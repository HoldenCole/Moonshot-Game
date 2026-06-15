// Event slot resolution. Templates carry {rival}, {researcher}, {supplier},
// {customer}, {offer_amount}, {star_researcher}, {competitor_move}, {cofounder}.
// Slots resolve from the real market + team so events name actual entities
// ("Cerebra is poaching Dr. Okafor"). The company entities ({rival}/{supplier}/
// {customer}) are picked together off the relationship graph — salient (anchors
// and well-connected names surface) and coherent (a {customer} that co-occurs
// with a {rival} is drawn from that rival's real customers). If a required slot
// can't resolve, the event is skipped (decision M).

import type { GameState } from "@/domain/state";
import type { Company } from "@/content/load";
import { industryLabel } from "@/domain/ids";
import { type Rng, nextFloat, nextRange, pick } from "./rng";
import { buildGraph, type CompanyGraph } from "./companyGraph";
import { generateTeam } from "./narrative";
import { formatMoney } from "./format";

const FIRST = ["Lin", "Maya", "Sam", "Aria", "Marcus", "Priya", "Elena", "Sofia", "Omar", "Yuki", "Theo", "Nadia", "Raj", "Dana", "Ivo", "Mara"];
const LAST = ["Okafor", "Wei", "Chen", "Rao", "Cruz", "Park", "Adler", "Haddad", "Nguyen", "Boone", "Vos", "Mensah", "Iyer", "Kane", "Sato"];

const COMPETITOR_MOVES = [
  "A rival just shipped a capability jump.",
  "A new model release has reset expectations across the field.",
  "A competitor quietly leapfrogged the public benchmark.",
];

// Short, headline-friendly sector names for the {sector} slot (the full
// industryLabel — "Artificial Intelligence" — reads clumsily inline).
const SECTOR_SHORT: Record<string, string> = {
  ai: "AI",
  space: "space",
  biotech: "biotech",
  energy: "energy",
  defense: "defense",
  advanced_mfg: "advanced manufacturing",
  mobility: "mobility",
  quantum: "quantum",
};

// Flavor pools for macro/world slots (no mechanical link — they name the moment).
const BANKS = ["Meridian Capital", "Atlas Trust", "Sterling & Co.", "Calloway Brothers", "Granite Financial"];
const TAX_TARGETS = ["capital-gains treatment", "the R&D credit", "corporate tax rates", "stock-comp deductions", "carried interest"];
const PROGRAM_SUMMARIES = [
  "Budgets and priorities are being redrawn, and the contracts will follow.",
  "Procurement is reopening — and the incumbents aren't guaranteed a seat.",
  "It resets which capabilities get funded for the next decade.",
];

const BASE_COMP: Record<string, number> = {
  pre_seed: 0.3,
  seed: 0.45,
  series_a: 0.9,
  series_b: 1.6,
  series_c: 2.4,
  growth: 3.2,
  late_stage: 4.0,
  public: 4.0,
  idea: 0.3,
};

/** Resolve every {slot} used in the templates. Returns the filled strings, or
 *  null if a required slot can't be filled. */
export function resolveSlots(
  templates: string[],
  state: GameState,
  market: Company[],
  rng: Rng,
): { fill: (s: string) => string } | null {
  const text = templates.join(" ");
  const needed = new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!));
  const slots: Record<string, string> = {};

  // The company entities are cast together off the graph (salient + coherent);
  // everything else resolves independently.
  const cast = resolveCast(state, market, buildGraph(market), rng, needed);

  for (const slot of needed) {
    const fromCast = (cast as Record<string, string | null | undefined>)[slot];
    const value = fromCast !== undefined ? fromCast : resolveSlot(slot, state, rng);
    if (value == null) return null; // required slot failed → skip event
    slots[slot] = value;
  }

  return {
    fill: (s: string) => s.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? `{${k}}`),
  };
}

const ENTITY_SLOTS = ["rival", "supplier", "customer"] as const;

/** Pick a coherent, salient set of company entities for one event. A {rival} is
 *  a prominent same-sub competitor; a {customer} prefers that rival's real
 *  customers (a contested account) before falling back to the player's
 *  downstream sector; a {supplier} prefers a company that is actually a supplier
 *  in the graph. Returns only the entity slots the event needs. */
function resolveCast(
  state: GameState,
  market: Company[],
  graph: CompanyGraph,
  rng: Rng,
  needed: Set<string>,
): Partial<Record<(typeof ENTITY_SLOTS)[number], string | null>> {
  if (!ENTITY_SLOTS.some((s) => needed.has(s))) return {};
  const c = state.company;
  const byId = new Map(market.map((m) => [m.id, m]));
  const cast: Partial<Record<(typeof ENTITY_SLOTS)[number], string | null>> = {};

  let rivalCo: Company | null = null;
  if (needed.has("rival")) {
    const rivals = market.filter((m) => m.sub_industry === c.subIndustry && m.industry === c.industry);
    rivalCo = pickSalient(rng, rivals, graph);
    cast.rival = rivalCo?.name ?? null;
  }

  if (needed.has("customer")) {
    const contested = rivalCo ? graph.customersOf(rivalCo.id).map((id) => byId.get(id)).filter((m): m is Company => !!m) : [];
    const pool = contested.length > 0 ? contested : market.filter((m) => m.industry === c.industry && m.sub_industry !== c.subIndustry);
    cast.customer = pickSalient(rng, pool, graph)?.name ?? null;
  }

  if (needed.has("supplier")) {
    const sectorSuppliers = market.filter((m) => (c.industry === "ai" ? m.sub_industry === "ai_chips" : m.industry === "advanced_mfg"));
    const realSuppliers = sectorSuppliers.filter((m) => graph.customersOf(m.id).length > 0);
    cast.supplier = pickSalient(rng, realSuppliers.length > 0 ? realSuppliers : sectorSuppliers, graph)?.name ?? null;
  }

  return cast;
}

/** Weighted pick favouring anchors, reputation, and graph connectivity, so
 *  events name recognizable, well-connected players. Deterministic via rng. */
function pickSalient(rng: Rng, pool: Company[], graph: CompanyGraph): Company | null {
  if (pool.length === 0) return null;
  const weights = pool.map((m) => {
    const rep = m.identity?.reputation ?? 50;
    const degree = graph.competitorsOf(m.id).length + graph.customersOf(m.id).length + graph.suppliersOf(m.id).length;
    return (rep + degree * 6) * (m.tier === "anchor" ? 2.5 : 1);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = nextFloat(rng) * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

function resolveSlot(slot: string, state: GameState, rng: Rng): string | null {
  const c = state.company;
  switch (slot) {
    case "researcher": {
      const team = generateTeam(state.meta.seed);
      return pick(rng, team)?.name ?? null;
    }
    case "star_researcher":
      return `Dr. ${pick(rng, FIRST)} ${pick(rng, LAST)}`;
    case "cofounder": {
      const lot = c.capTable.lots.find((l) => l.holderType === "cofounder");
      return lot?.holderName ?? null;
    }
    case "offer_amount": {
      const base = BASE_COMP[c.stage] ?? 0.5;
      const hype = state.world.hype[c.industry] ?? 50;
      return formatMoney(base * (1 + hype / 120) * nextRange(rng, 0.9, 1.3));
    }
    case "competitor_move":
      return pick(rng, COMPETITOR_MOVES) ?? null;

    // ── Macro / world slots (the m-series economic events) ──
    case "sector":
      return SECTOR_SHORT[c.industry] ?? industryLabel(c.industry);
    case "bank":
      return pick(rng, BANKS) ?? null;
    case "rate_move":
      return Math.max(0.25, Math.abs(rateMoveQtr(state))).toFixed(2);
    case "rate_direction":
      return rateMoveQtr(state) < 0 ? "lower" : "higher";
    case "tax_target":
      return pick(rng, TAX_TARGETS) ?? null;
    case "talent_direction":
      return hypeRising(state) ? "rising" : "easing";
    case "talent_summary":
      return hypeRising(state)
        ? "Comp expectations are spiking and recruiters are circling your best people."
        : "Talent that was untouchable a year ago is suddenly answering calls.";
    case "window_direction": {
      const wnd = state.world.ipoWindow;
      return wnd === "open" ? "swung open" : wnd === "closed" ? "slammed shut" : "started to crack";
    }
    case "window_summary": {
      const wnd = state.world.ipoWindow;
      return wnd === "open"
        ? "Bankers are calling and comparables are rich."
        : wnd === "closed"
          ? "Listings are being pulled and pricing has gone hostile."
          : "Sentiment is wobbling and underwriters are hedging.";
    }
    case "program_direction":
      return pick(rng, ["expanded", "realigned", "scaled back"]) ?? null;
    case "program_summary":
      return pick(rng, PROGRAM_SUMMARIES) ?? null;

    default:
      // An unhandled slot fails the resolution → the event is skipped, rather
      // than rendering a literal "{slot}" or a blank (decision M).
      return null;
  }
}

/** Signed change in the policy rate over roughly the last quarter, read off the
 *  world-history tape (0 when history is too short). */
function rateMoveQtr(state: GameState): number {
  const snap = snapAgo(state, 13);
  return snap ? state.world.interestRate - snap.interestRate : 0;
}

/** Whether the player sector's hype is higher than ~a month ago (talent demand). */
function hypeRising(state: GameState): boolean {
  const ind = state.company.industry;
  const now = state.world.hype[ind] ?? 50;
  const then = snapAgo(state, 4)?.hype[ind] ?? now;
  return now >= then;
}

function snapAgo(state: GameState, weeksBack: number) {
  const h = state.worldHistory;
  const target = state.clock.week - weeksBack;
  for (let i = h.length - 1; i >= 0; i--) if (h[i]!.week <= target) return h[i]!;
  return null;
}
