// Market share vs. rivals (doc 07 §3.4). A product's share eases toward a target
// set by how its quality compares to the rival field — each week it closes a
// fraction of the gap, the fraction being the sub-industry's volatility (damped
// by company size). Sticky industries (SaaS, launch) move slowly; hype ones
// (frontier lab) swing. Pure + deterministic.

import type { Company } from "@/content/load";
import type { ProductTuning } from "@/domain/content";
import type { LiveProduct } from "@/domain/products";

/** Quality-gap scale of the share logistic — a ~18pt edge is worth a lot. */
const SPREAD = 18;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** A representative rival quality (0–100) for a product class: the strongest
 *  same-sector incumbent, blended across its quality block. 50 with no rivals
 *  (a neutral field you can take share from). */
export function rivalProductQuality(rivals: Company[]): number {
  if (rivals.length === 0) return 50;
  return Math.max(
    ...rivals.map((c) => {
      const bench = c.signature?.benchmark_score ?? c.quality.execution;
      return (c.quality.fundamentals + c.quality.moat + c.quality.execution + bench) / 4;
    }),
  );
}

/** The equilibrium share a product of `yourQ` would hold against a `rivalQ`
 *  field — 0.5 at parity, climbing/falling with the quality gap. */
export function targetShare(yourQ: number, rivalQ: number): number {
  return logistic((yourQ - rivalQ) / SPREAD);
}

/** As a company's revenue grows, share gains come slower — diminishing returns at
 *  scale (a bigger base is harder to grow off). 1.0 for a small company, easing
 *  toward a floor as run-rate revenue climbs. */
export const GROWTH_SCALE_HALFLIFE = 3000; // $M of revenue at which growth roughly halves
export function companyGrowthScale(companyRevenue: number): number {
  return Math.max(0.25, 1 / (1 + Math.max(0, companyRevenue) / GROWTH_SCALE_HALFLIFE));
}

/** Yearly drift of the competitive bar toward the frontier — a maturing sector's
 *  incumbents keep improving, so you can't simply outgrow a static field. */
export const RIVAL_CLIMB_PER_YEAR = 0.05;

/** The effective rival quality bar (0–100) the market is contested against, given
 *  the difficulty's competition axis and the week. The authored bar is tilted by
 *  the axis (Forgiving < 1 weaker, Brutal > 1 stronger), then drifts up toward the
 *  100 cap over time at a difficulty-scaled rate. Axis 1.0 at week 0 = the raw bar,
 *  so early Realistic play is unchanged and the field stays level into the late game. */
export function competitionLevel(baseRivalQuality: number, competition: number, week: number): number {
  const scaled = baseRivalQuality * competition;
  const climb = clamp(RIVAL_CLIMB_PER_YEAR * competition * (Math.max(0, week) / 52), 0, 0.85);
  return clamp(scaled + (100 - scaled) * climb, 0, 100);
}

/** Move a product's share one week toward its target by a fraction of the
 *  remaining gap — the industry's volatility sets the fraction, the company-size
 *  scale damps it. Share ramps fast when far from target and eases as it closes
 *  in (fast-then-plateau), rather than crawling up a fixed step. */
export function advanceShare(product: LiveProduct, rivalQuality: number, tuning: ProductTuning, growthScale = 1): LiveProduct {
  const target = targetShare(product.quality, rivalQuality);
  const rate = clamp(tuning.share_volatility * growthScale, 0, 1);
  const share = clamp(product.share + (target - product.share) * rate, 0, 1);
  return { ...product, share };
}
