// The per-company orchestration of the depth system: one place that ties the
// pure R&D / capacity / bet / lifecycle modules into a single weekly advance and
// the derived readouts the tick + UI consume. Pure + deterministic.

import type { Company } from "@/content/load";
import type { CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";
import type { ProductsRuntime } from "@/domain/products";
import { advanceRD, initRDState, rivalLevelsForLines } from "./rd";
import { initCapacityState, tickCapacityBuilds } from "./capacity";
import { productGrossProfit, tickBets, tickProduct } from "./products";
import { advanceShare, rivalProductQuality } from "./productMarket";

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
export function advanceProducts(rt: ProductsRuntime, c: SubContent, rivals: Company[], week: number): ProductsAdvance {
  const rd = advanceRD(rt.rd, c.lines, c.tuning, rivalLevelsForLines(c.lines, rivals));

  const typeById = new Map(c.capacityTypes.map((t) => [t.id, t]));
  const capacity = tickCapacityBuilds(rt.capacity, typeById);

  const betRes = tickBets(rt.bets, c.productById, c.lines, week);

  const rivalQ = rivalProductQuality(rivals);
  const products = [...rt.products, ...betRes.shipped.map((s) => s.product)].map((p) => {
    const arch = c.productById.get(p.archetype_id);
    return arch ? tickProduct(advanceShare(p, rivalQ, c.tuning), arch, c.tuning) : p;
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
