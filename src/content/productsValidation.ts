// Pure validation for the Products / R&D / Capacity content (doc 07 §1.3).
// DOM- and glob-free so it runs in the loader AND in disk-read tests. Problems
// are returned as warning strings (the loader pushes them to ContentDB.warnings
// rather than crashing). Also exports the shape predicates the loader uses to
// pick entities out of keyed-table TOML.

import type { CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isRDLine(v: unknown): v is RDLine {
  return isObj(v) && "id" in v && "drives_specs" in v && "base_cost_per_quarter" in v;
}

export function isProductArchetype(v: unknown): v is ProductArchetype {
  return isObj(v) && "id" in v && "gates" in v && "economics" in v && "specs" in v;
}

export function isCapacityType(v: unknown): v is CapacityType {
  return isObj(v) && "id" in v && "rungs" in v && Array.isArray((v as { rungs: unknown }).rungs);
}

export interface ProductsContent {
  rdLines: RDLine[];
  products: ProductArchetype[];
  capacityTypes: CapacityType[];
  tuningBySub: Map<string, ProductTuning>;
  /** The sub-industries that must each have a full content set (coverage check). */
  subIndustries: readonly string[];
}

function groupBySub<T extends { sub_industry: string }>(items: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const arr = m.get(it.sub_industry);
    if (arr) arr.push(it);
    else m.set(it.sub_industry, [it]);
  }
  return m;
}

/** Run the spec's §1.3 sanity checklist. Returns one warning string per issue
 *  (empty = clean). Cross-references resolve within a sub-industry. */
export function validateProducts(c: ProductsContent): string[] {
  const w: string[] = [];
  const rdBySub = groupBySub(c.rdLines);
  const capBySub = groupBySub(c.capacityTypes);
  const prodBySub = groupBySub(c.products);

  const lineIds = new Map<string, Set<string>>();
  const driveTags = new Map<string, Set<string>>();
  for (const [sub, lines] of rdBySub) {
    lineIds.set(sub, new Set(lines.map((l) => l.id)));
    const tags = new Set<string>();
    for (const l of lines) for (const t of l.drives_specs) tags.add(t);
    driveTags.set(sub, tags);
  }
  const capIds = new Map<string, Set<string>>();
  const capById = new Map<string, Map<string, CapacityType>>();
  for (const [sub, caps] of capBySub) {
    capIds.set(sub, new Set(caps.map((cp) => cp.id)));
    capById.set(sub, new Map(caps.map((cp) => [cp.id, cp])));
  }

  // Per-product checks: gates (1), capacity_type (2), spec sum (3), spec tags
  // trace to a line (4), and capacity_to_build is buildable (7).
  for (const p of c.products) {
    const sub = p.sub_industry;
    for (const lineId of Object.keys(p.gates)) {
      if (!lineIds.get(sub)?.has(lineId)) w.push(`product ${p.id}: gate references unknown R&D line "${lineId}" in ${sub}`);
    }
    const capId = p.economics.capacity_type;
    const capOk = capIds.get(sub)?.has(capId) ?? false;
    if (!capOk) w.push(`product ${p.id}: economics.capacity_type "${capId}" not found in ${sub}`);

    const sum = Object.values(p.specs).reduce((s, x) => s + x, 0);
    if (Math.abs(sum - 1) > 1e-6) w.push(`product ${p.id}: specs weights sum to ${sum.toFixed(4)} (expected 1.0)`);

    for (const tag of Object.keys(p.specs)) {
      if (!driveTags.get(sub)?.has(tag)) w.push(`product ${p.id}: spec tag "${tag}" is not driven by any R&D line in ${sub}`);
    }
    if (capOk) {
      const cap = capById.get(sub)!.get(capId)!;
      const maxRung = cap.rungs.length ? Math.max(...cap.rungs.map((r) => r.capacity)) : 0;
      if (p.economics.capacity_to_build > maxRung) {
        w.push(`product ${p.id}: capacity_to_build ${p.economics.capacity_to_build} exceeds the largest ${capId} rung (${maxRung}) — unbuildable`);
      }
    }
  }

  // Capacity ladders (5): ≥6 rungs, strictly increasing capacity + cost,
  // non-decreasing build_weeks.
  for (const cap of c.capacityTypes) {
    if (cap.rungs.length < 6) w.push(`capacity ${cap.id}: ${cap.rungs.length} rungs (need ≥6 so it never caps out)`);
    for (let i = 1; i < cap.rungs.length; i++) {
      const a = cap.rungs[i - 1]!;
      const b = cap.rungs[i]!;
      if (b.capacity <= a.capacity) w.push(`capacity ${cap.id}: rung ${i + 1} capacity not strictly increasing (${a.capacity} → ${b.capacity})`);
      if (b.cost <= a.cost) w.push(`capacity ${cap.id}: rung ${i + 1} cost not strictly increasing (${a.cost} → ${b.cost})`);
      if (b.build_weeks < a.build_weeks) w.push(`capacity ${cap.id}: rung ${i + 1} build_weeks decreased (${a.build_weeks} → ${b.build_weeks})`);
    }
  }

  // Tier progression (6): tiers contiguous from their floor (a tier-0 component
  // layer is allowed beneath tier 1), and build_cost + build_weeks non-decreasing
  // across tiers — each tier's cheapest/fastest product is at least the prior
  // tier's priciest/slowest (clean separation; free variety within a tier).
  for (const [sub, prods] of prodBySub) {
    const byTier = new Map<number, ProductArchetype[]>();
    for (const p of prods) {
      const arr = byTier.get(p.tier);
      if (arr) arr.push(p);
      else byTier.set(p.tier, [p]);
    }
    const tiers = [...byTier.keys()].sort((a, b) => a - b);
    tiers.forEach((t, i) => {
      if (t !== tiers[0]! + i) w.push(`products ${sub}: tiers not contiguous (tier ${t} after a gap)`);
    });
    for (let i = 1; i < tiers.length; i++) {
      const prev = byTier.get(tiers[i - 1]!)!;
      const cur = byTier.get(tiers[i]!)!;
      const prevMaxCost = Math.max(...prev.map((p) => p.economics.build_cost));
      const curMinCost = Math.min(...cur.map((p) => p.economics.build_cost));
      if (curMinCost < prevMaxCost) w.push(`products ${sub}: build_cost drops at tier ${tiers[i]} (${curMinCost} < tier ${tiers[i - 1]} max ${prevMaxCost})`);
      const prevMaxWk = Math.max(...prev.map((p) => p.economics.build_weeks));
      const curMinWk = Math.min(...cur.map((p) => p.economics.build_weeks));
      if (curMinWk < prevMaxWk) w.push(`products ${sub}: build_weeks drops at tier ${tiers[i]} (${curMinWk} < tier ${tiers[i - 1]} max ${prevMaxWk})`);
    }
  }

  // Coverage (8): every required sub-industry has a tuning block.
  for (const sub of c.subIndustries) {
    if (!c.tuningBySub.has(sub)) w.push(`tuning: missing _tuning block for "${sub}"`);
  }

  return w;
}
