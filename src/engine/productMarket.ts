// Market share vs. rivals (doc 07 §3.4). A product's share drifts toward a target
// set by how its quality compares to the rival field, rate-limited by the
// sub-industry's stickiness. Sticky industries (SaaS, launch) barely move; hype
// ones (frontier lab) swing. Pure + deterministic.

import type { Company } from "@/content/load";
import type { ProductTuning } from "@/domain/content";
import type { LiveProduct } from "@/domain/products";

const QUARTER = 13;
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

/** Move a product's share one week toward its target, capped by the industry's
 *  share volatility (per-week slice of a quarter). */
export function advanceShare(product: LiveProduct, rivalQuality: number, tuning: ProductTuning): LiveProduct {
  const target = targetShare(product.quality, rivalQuality);
  const step = tuning.share_volatility / QUARTER;
  const share = clamp(product.share + clamp(target - product.share, -step, step), 0, 1);
  return { ...product, share };
}
