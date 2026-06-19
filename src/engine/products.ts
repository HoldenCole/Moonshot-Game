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

/** The cash a bet costs to commit, after the industry's build-cost multiplier.
 *  Kept to $0.01M precision so sub-$1M entry products read correctly. */
export function betCost(archetype: ProductArchetype, tuning: ProductTuning): number {
  return Math.round(archetype.economics.build_cost * tuning.build_cost_mult * 100) / 100;
}

/** How much longer each successive build of the same product takes. Early
 *  iterations are quick; once you've shipped a dozen-ish of one archetype its
 *  frontier is harder and a new version takes up to ~3× as long. Front-flat then
 *  rising (quadratic), so the first several stay near baseline. */
export const ITERATION_RAMP_K = 1.5;
export const ITERATION_RAMP_SCALE = 12;
export const ITERATION_RAMP_MAX = 3;
export function iterationBuildFactor(priorBuilds: number): number {
  const n = Math.max(0, priorBuilds);
  return Math.min(ITERATION_RAMP_MAX, 1 + ITERATION_RAMP_K * (n / ITERATION_RAMP_SCALE) ** 2);
}

/** The full build length of a bet in weeks: the authored weeks after the
 *  industry's time multiplier, lengthened by the iteration ramp for how many of
 *  this archetype you've already built. makeBet seeds weeks_left with this. */
export function betBuildWeeks(archetype: ProductArchetype, tuning: ProductTuning, priorBuilds = 0): number {
  return Math.max(1, Math.round(archetype.economics.build_weeks * tuning.build_time_mult * iterationBuildFactor(priorBuilds)));
}

// ── Crashing the schedule (invest cash to ship sooner) ────────────────────────

/** Each rush pulls in this fraction of the build's full length. */
export const RUSH_FRACTION = 0.25;
/** Bought weeks cost this premium over the build's natural per-week cost. */
export const RUSH_PREMIUM = 1.5;

/** What one rush would buy on an in-flight bet: the weeks it shaves and the cash
 *  it costs, or null when the bet is too close to shipping to rush (≤1 week left).
 *  Weeks bought are capped to leave a final week so the ship runs in the normal
 *  tick; cost scales with the build's per-week cost × a premium. */
export function rushQuote(
  bet: ActiveBet,
  archetype: ProductArchetype,
  tuning: ProductTuning,
): { weeks: number; cost: number } | null {
  if (bet.weeks_left <= 1) return null;
  const full = bet.build_weeks_total || betBuildWeeks(archetype, tuning);
  const chunk = Math.max(1, Math.round(full * RUSH_FRACTION));
  const weeks = Math.min(chunk, bet.weeks_left - 1);
  if (weeks <= 0) return null;
  const cost = Math.round((betCost(archetype, tuning) / full) * weeks * RUSH_PREMIUM * 100) / 100;
  return { weeks, cost };
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
  priorBuilds = 0,
): ActiveBet {
  const weeks = betBuildWeeks(archetype, tuning, priorBuilds);
  return {
    id: `bet-${archetype.id}-${week}-${seq}`,
    archetype_id: archetype.id,
    instance_name: instanceName,
    kind,
    weeks_left: weeks,
    build_weeks_total: weeks,
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

/** How sharply TAM growth tracks the macro cycle: a peak (+1 strength) grows the
 *  market this much faster, a trough (−1) this much slower (floored so it stalls,
 *  not shrinks). */
export const MACRO_TAM_SENSITIVITY = 0.8;

/** Adoption-curve modulation of a sector's TAM growth across the years: a wave that
 *  runs fast → medium → slow (saturation) → fast again as the next technology
 *  generation reignites demand. So the authored rate is the PEAK adoption rate, not
 *  a flat forever-rate. cos starts the run at the fast crest. */
export const TAM_WAVE_PERIOD_YEARS = 16;
const TAM_WAVE_MID = 0.55;
const TAM_WAVE_AMP = 0.45;
export function adoptionWave(year: number): number {
  return TAM_WAVE_MID + TAM_WAVE_AMP * Math.cos((2 * Math.PI * Math.max(0, year)) / TAM_WAVE_PERIOD_YEARS);
}

/** Advance a sector's TAM multiplier one week: the addressable market compounds at
 *  its peak rate shaped by the adoption wave (fast early, slow at saturation, fast
 *  again) and nudged by the macro cycle — waves, not a straight 30%-forever line. */
export function nextTamScale(prev: number, peakRate: number, week: number, macroStrength: number): number {
  if (!(peakRate > 0)) return prev;
  const rate = peakRate * adoptionWave(week / 52);
  const macroFactor = Math.max(0.1, 1 + MACRO_TAM_SENSITIVITY * macroStrength);
  return prev * (1 + Math.max(0, rate) * macroFactor) ** (1 / 52);
}

/** $M/yr a product is earning now: its share of the (TAM-scaled) market, scaled by
 *  where it is in the ramp and how far obsolescence has eaten in. */
export function productRevenueRunRate(product: LiveProduct, archetype: ProductArchetype, tuning: ProductTuning, tamScale = 1): number {
  const peak = product.share * archetype.economics.addressable_market * tamScale;
  const t = Math.min(1, product.age_weeks / Math.max(1, archetype.economics.ramp_weeks));
  // Front-loaded ramp: revenue climbs fast early then eases into its plateau,
  // instead of crawling up a straight line (=1 at t≥1, so it still matures at
  // share × market). With the share ease (productMarket) the curve reads as an S.
  const rampFrac = 1 - (1 - t) ** 2;
  return peak * rampFrac * decayMultiplier(product.age_weeks, archetype, tuning);
}

/** $M/yr of gross profit (revenue × launch margin). */
export function productGrossProfit(product: LiveProduct, archetype: ProductArchetype, tuning: ProductTuning, tamScale = 1): number {
  return productRevenueRunRate(product, archetype, tuning, tamScale) * archetype.economics.unit_margin;
}

/** Age a product one week: advance the lifecycle and re-cache its run-rate. Share
 *  is moved separately (productMarket) before this, so revenue reads the latest. */
export function tickProduct(product: LiveProduct, archetype: ProductArchetype, tuning: ProductTuning, tamScale = 1): LiveProduct {
  const next: LiveProduct = { ...product, age_weeks: product.age_weeks + 1 };
  next.state = lifecycleState(next.age_weeks, archetype);
  next.revenue_run_rate = Math.round(productRevenueRunRate(next, archetype, tuning, tamScale) * 100) / 100;
  return next;
}
