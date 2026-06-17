// Product lifecycle + the bet scheduler (doc 07 §3.3, §3.5, §3.6). A bet ties up
// build capacity while it runs, then ships a LiveProduct whose quality is set by
// the tech levels at commit. Shipped products ramp → mature → decline, earning
// revenue from their market share the whole time. Pure + deterministic.

import type { ProductArchetype, ProductTuning, RDLine } from "@/domain/content";
import type { ActiveBet, LiveProduct, ProductLifecycle } from "@/domain/products";

/** Weeks a product plateaus at peak before obsolescence sets in. */
export const MATURE_WINDOW = 26;
const QUARTER = 13;

// ── Quality at ship (§3.3) ────────────────────────────────────────────────────

/** Product quality (0–100): each spec weight times the average tech level of the
 *  lines that drive that spec, at the levels captured when the bet was committed. */
export function productQuality(archetype: ProductArchetype, lines: RDLine[], levels: Record<string, number>): number {
  let q = 0;
  for (const [tag, weight] of Object.entries(archetype.specs)) {
    const driving = lines.filter((l) => l.drives_specs.includes(tag));
    const score = driving.length
      ? driving.reduce((s, l) => s + (levels[l.id] ?? l.starting_level), 0) / driving.length
      : 0;
    q += weight * score;
  }
  return q;
}

/** An upgrade re-runs quality at current levels and never lowers the product. */
export function upgradedQuality(product: LiveProduct, archetype: ProductArchetype, lines: RDLine[], levels: Record<string, number>): number {
  return Math.max(product.quality, productQuality(archetype, lines, levels));
}

// ── The bet scheduler (§3.6) ──────────────────────────────────────────────────

/** Every gate's required tech level is met by the current levels. */
export function gatesMet(archetype: ProductArchetype, levels: Record<string, number>): boolean {
  return Object.entries(archetype.gates).every(([lineId, req]) => (levels[lineId] ?? 0) >= req);
}

/** The cash a bet costs to commit, after the industry's build-cost multiplier. */
export function betCost(archetype: ProductArchetype, tuning: ProductTuning): number {
  return Math.round(archetype.economics.build_cost * tuning.build_cost_mult);
}

/** Build a bet (caller has checked gates/capacity/cash). `seq` keeps the seeded
 *  id unique when several are committed the same week. */
export function makeBet(
  archetype: ProductArchetype,
  instanceName: string,
  kind: ActiveBet["kind"],
  levels: Record<string, number>,
  week: number,
  tuning: ProductTuning,
  seq = 0,
): ActiveBet {
  return {
    id: `bet-${archetype.id}-${week}-${seq}`,
    archetype_id: archetype.id,
    instance_name: instanceName,
    kind,
    weeks_left: Math.max(1, Math.round(archetype.economics.build_weeks * tuning.build_time_mult)),
    capacity_held: archetype.economics.capacity_to_build,
    cap_id: archetype.economics.capacity_type,
    committed_levels: { ...levels },
  };
}

/** A freshly shipped product entering its ramp. */
export function shipProduct(bet: ActiveBet, archetype: ProductArchetype, lines: RDLine[], week: number, seq = 0): LiveProduct {
  return {
    id: `prod-${archetype.id}-${week}-${seq}`,
    archetype_id: archetype.id,
    instance_name: bet.instance_name,
    shipped_week: week,
    quality: productQuality(archetype, lines, bet.committed_levels),
    age_weeks: 0,
    state: "ramping",
    share: 0,
    revenue_run_rate: 0,
    capacity_run: archetype.economics.capacity_to_run,
  };
}

export interface BetTickResult {
  bets: ActiveBet[];
  shipped: { bet: ActiveBet; product: LiveProduct }[];
}

/** Tick every bet one week; ship the ones that hit zero (build capacity is freed
 *  simply because the shipped bet leaves `bets`). Bets run independently and in
 *  parallel. `lines` are the sub-industry's R&D lines. */
export function tickBets(bets: ActiveBet[], archetypeById: Map<string, ProductArchetype>, lines: RDLine[], week: number): BetTickResult {
  const remaining: ActiveBet[] = [];
  const shipped: BetTickResult["shipped"] = [];
  bets.forEach((b, i) => {
    const weeks_left = b.weeks_left - 1;
    if (weeks_left <= 0) {
      const arch = archetypeById.get(b.archetype_id);
      if (arch) shipped.push({ bet: b, product: shipProduct(b, arch, lines, week, i) });
    } else {
      remaining.push({ ...b, weeks_left });
    }
  });
  return { bets: remaining, shipped };
}

// ── Revenue, ramp, decay (§3.5) ───────────────────────────────────────────────

/** Lifecycle stage from age: ramping while filling, a mature plateau, then decline. */
export function lifecycleState(ageWeeks: number, archetype: ProductArchetype): ProductLifecycle {
  const ramp = archetype.economics.ramp_weeks;
  if (ageWeeks < ramp) return "ramping";
  if (ageWeeks < ramp + MATURE_WINDOW) return "mature";
  return "declining";
}

/** Obsolescence factor (1 during ramp + plateau, decaying afterward). */
function decayMultiplier(ageWeeks: number, archetype: ProductArchetype, tuning: ProductTuning): number {
  const declineStart = archetype.economics.ramp_weeks + MATURE_WINDOW;
  if (ageWeeks <= declineStart) return 1;
  const decayWeek = (archetype.economics.decay_per_quarter * tuning.decay_mult) / QUARTER;
  return Math.pow(Math.max(0, 1 - decayWeek), ageWeeks - declineStart);
}

/** $M/yr a product is earning now: its share of the market, scaled by where it is
 *  in the ramp and how far obsolescence has eaten in. */
export function productRevenueRunRate(product: LiveProduct, archetype: ProductArchetype, tuning: ProductTuning): number {
  const peak = product.share * archetype.economics.addressable_market;
  const rampFrac = Math.min(1, product.age_weeks / Math.max(1, archetype.economics.ramp_weeks));
  return peak * rampFrac * decayMultiplier(product.age_weeks, archetype, tuning);
}

/** $M/yr of gross profit (revenue × launch margin). */
export function productGrossProfit(product: LiveProduct, archetype: ProductArchetype, tuning: ProductTuning): number {
  return productRevenueRunRate(product, archetype, tuning) * archetype.economics.unit_margin;
}

/** Age a product one week: advance the lifecycle and re-cache its run-rate. Share
 *  is moved separately (productMarket) before this, so revenue reads the latest. */
export function tickProduct(product: LiveProduct, archetype: ProductArchetype, tuning: ProductTuning): LiveProduct {
  const next: LiveProduct = { ...product, age_weeks: product.age_weeks + 1 };
  next.state = lifecycleState(next.age_weeks, archetype);
  next.revenue_run_rate = Math.round(productRevenueRunRate(next, archetype, tuning) * 100) / 100;
  return next;
}
