// The per-company orchestration of the depth system: one place that ties the
// pure R&D / capacity / bet / lifecycle modules into a single weekly advance and
// the derived readouts the tick + UI consume. Pure + deterministic.

import type { Company } from "@/content/load";
import type { CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";
import type { GameState } from "@/domain/state";
import type { ProductsRuntime } from "@/domain/products";
import { advanceRD, initRDState, rivalLevelsForLines } from "./rd";
import { canStartBet, initCapacityState, nextRung, startRungBuild, tickCapacityBuilds } from "./capacity";
import { betCost, gatesMet, makeBet, productGrossProfit, rushQuote, tickBets, tickProduct } from "./products";
import { advanceShare, companyGrowthScale, competitionLevel, rivalProductQuality } from "./productMarket";
import { formatMoney } from "./format";

/** The authored content for one sub-industry, resolved once and passed in. */
export interface SubContent {
  lines: RDLine[];
  capacityTypes: CapacityType[];
  productById: Map<string, ProductArchetype>;
  tuning: ProductTuning;
}

/** The content maps the orchestrator reads (a structural slice of ContentDB). */
export interface ProductContentDB {
  rdLinesBySub: Map<string, RDLine[]>;
  capacityBySub: Map<string, CapacityType[]>;
  productsBySub: Map<string, ProductArchetype[]>;
  productTuningBySub: Map<string, ProductTuning>;
}

/** Resolve the depth content for a sub-industry, or null when none is authored. */
export function subContentFor(content: ProductContentDB, sub: string): SubContent | null {
  const tuning = content.productTuningBySub.get(sub);
  if (!tuning) return null;
  const products = content.productsBySub.get(sub) ?? [];
  return {
    lines: content.rdLinesBySub.get(sub) ?? [],
    capacityTypes: content.capacityBySub.get(sub) ?? [],
    productById: new Map(products.map((p) => [p.id, p])),
    tuning,
  };
}

/** A fresh runtime for a sub-industry. */
export function initProductsRuntime(c: SubContent): ProductsRuntime {
  return {
    rd: initRDState(c.lines),
    capacity: initCapacityState(c.capacityTypes, c.tuning),
    bets: [],
    products: [],
  };
}

export interface ProductsAdvance {
  runtime: ProductsRuntime;
  /** Products that shipped this week (for the news feed). */
  shipped: { name: string; archetypeId: string }[];
}

/** Advance the whole depth system one week, in the spec's deterministic order:
 *  R&D progress → capacity builds → bets ship → products age (share, revenue). */
export function advanceProducts(rt: ProductsRuntime, c: SubContent, rivals: Company[], week: number, competition = 1): ProductsAdvance {
  const rd = advanceRD(rt.rd, c.lines, c.tuning, rivalLevelsForLines(c.lines, rivals));

  const typeById = new Map(c.capacityTypes.map((t) => [t.id, t]));
  const capacity = tickCapacityBuilds(rt.capacity, typeById);

  const betRes = tickBets(rt.bets, c.productById, c.lines, week);

  // The competitive bar your products take share against — scaled by difficulty
  // and drifting up over time, so the field stays level as you (and the TAM) grow.
  const rivalQ = competitionLevel(rivalProductQuality(rivals), competition, week);
  // Growth slows as the company gets bigger: damp share gains by total run-rate.
  const growthScale = companyGrowthScale(rt.products.reduce((s, p) => s + p.revenue_run_rate, 0));
  const products = [...rt.products, ...betRes.shipped.map((s) => s.product)].map((p) => {
    const arch = c.productById.get(p.archetype_id);
    return arch ? tickProduct(advanceShare(p, rivalQ, c.tuning, growthScale), arch, c.tuning) : p;
  });

  return {
    runtime: { rd, capacity, bets: betRes.bets, products },
    shipped: betRes.shipped.map((s) => ({ name: s.product.instance_name, archetypeId: s.product.archetype_id })),
  };
}

/** Operating revenue from shipped products ($M/yr) — the sum of their gross
 *  profit, fed into the finance pipeline as the company's product revenue. */
export function productsOperatingRevenue(rt: ProductsRuntime, productById: Map<string, ProductArchetype>, tuning: ProductTuning): number {
  const r = rt.products.reduce((s, p) => {
    const arch = productById.get(p.archetype_id);
    return arch ? s + productGrossProfit(p, arch, tuning) : s;
  }, 0);
  return Math.round(r * 100) / 100;
}

// ── Player mutations (store actions) ──────────────────────────────────────────

/** Set the weekly R&D budget ($M/wk). */
export function setRdBudget(rt: ProductsRuntime, amount: number): ProductsRuntime {
  return { ...rt, rd: { ...rt.rd, rd_budget_per_week: Math.max(0, Math.round(amount * 100) / 100) } };
}

/** Set the per-line budget split, normalized to sum to 1. */
export function setRdAllocation(rt: ProductsRuntime, allocation: Record<string, number>): ProductsRuntime {
  const total = Object.values(allocation).reduce((s, x) => s + Math.max(0, x), 0);
  const norm: Record<string, number> = {};
  for (const [k, v] of Object.entries(allocation)) norm[k] = total > 0 ? Math.max(0, v) / total : 0;
  return { ...rt, rd: { ...rt.rd, allocation: norm } };
}

/** Commit a bet to create a product (gates + capacity + concurrency + cash must
 *  clear, else a no-op). */
export function commitBet(state: GameState, c: SubContent, archetypeId: string, instanceName: string): GameState {
  const rt = state.company.products;
  if (!rt) return state;
  const arch = c.productById.get(archetypeId);
  if (!arch || !gatesMet(arch, rt.rd.levels)) return state;
  const startable = canStartBet({
    cap: rt.capacity,
    capId: arch.economics.capacity_type,
    bets: rt.bets,
    products: rt.products,
    productById: c.productById,
    capacityToBuild: arch.economics.capacity_to_build,
    maxConcurrentBets: c.tuning.max_concurrent_bets,
  });
  const cost = betCost(arch, c.tuning);
  if (!startable || state.company.financials.cash < cost) return state;

  const name = instanceName.trim() || arch.name;
  // Each successive build of an archetype takes a bit longer (frontier hardens).
  const priorBuilds =
    rt.products.filter((p) => p.archetype_id === archetypeId).length +
    rt.bets.filter((b) => b.archetype_id === archetypeId).length;
  const bet = makeBet(arch, name, "create", rt.rd.levels, state.clock.week, c.tuning, rt.bets.length, priorBuilds);
  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...state.company.financials, cash: state.company.financials.cash - cost },
      products: { ...rt, bets: [...rt.bets, bet] },
      signature: { ...state.company.signature, status: "running" },
    },
    log: [
      ...state.log,
      { id: `bet-${archetypeId}-${state.clock.week}`, week: state.clock.week, kind: "company", tone: "neutral", headline: `Committed ${name}`, detail: `${formatMoney(cost)} to build over ~${bet.weeks_left} weeks. It ships when the build completes.` },
    ],
  };
}

/** Invest cash to pull an in-flight bet's schedule in (a no-op when it can't be
 *  rushed or the cash isn't there). Works the same in every sub-industry. */
export function accelerateBet(state: GameState, c: SubContent, betId: string): GameState {
  const rt = state.company.products;
  if (!rt) return state;
  const bet = rt.bets.find((b) => b.id === betId);
  if (!bet) return state;
  const arch = c.productById.get(bet.archetype_id);
  if (!arch) return state;
  const quote = rushQuote(bet, arch, c.tuning);
  if (!quote || state.company.financials.cash < quote.cost) return state;

  const bets = rt.bets.map((b) => (b.id === betId ? { ...b, weeks_left: b.weeks_left - quote.weeks } : b));
  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...state.company.financials, cash: state.company.financials.cash - quote.cost },
      products: { ...rt, bets },
    },
    log: [
      ...state.log,
      { id: `rush-${betId}-${state.clock.week}-${bet.weeks_left}`, week: state.clock.week, kind: "company", tone: "neutral", headline: `Rushed ${bet.instance_name}`, detail: `${formatMoney(quote.cost)} to pull the schedule in ${quote.weeks} week${quote.weeks === 1 ? "" : "s"} — ships in ~${bet.weeks_left - quote.weeks}.` },
    ],
  };
}

/** Build the next rung of a capacity type (cash + a no-op when maxed/short). */
export function buyCapacityRung(state: GameState, c: SubContent, capId: string): GameState {
  const rt = state.company.products;
  if (!rt) return state;
  const type = c.capacityTypes.find((t) => t.id === capId);
  if (!type) return state;
  const next = nextRung(rt.capacity, type);
  if (!next || state.company.financials.cash < next.rung.cost) return state;
  return {
    ...state,
    company: {
      ...state.company,
      financials: { ...state.company.financials, cash: state.company.financials.cash - next.rung.cost },
      products: { ...rt, capacity: startRungBuild(rt.capacity, type) },
    },
    log: [
      ...state.log,
      { id: `rung-${capId}-${state.clock.week}`, week: state.clock.week, kind: "company", tone: "neutral", headline: `Building ${type.name} capacity`, detail: `+${next.rung.capacity} ${type.unit_label}s in ${next.rung.build_weeks} weeks for ${formatMoney(next.rung.cost)}.` },
    ],
  };
}
