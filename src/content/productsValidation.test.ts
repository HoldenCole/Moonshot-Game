import { test } from "node:test";
import assert from "node:assert/strict";

import { validateProducts, isRDLine, isProductArchetype, isCapacityType, type ProductsContent } from "./productsValidation.ts";
import type { CapacityRung, CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";

const SUB = "ai_chips";

const tuning = (): ProductTuning => ({
  starting_capacity: 2,
  rd_diminishing_k: 0.7,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.15,
});

const line = (id: string, drives: string[]): RDLine => ({
  id,
  sub_industry: SUB,
  name: id,
  description: "",
  starting_level: 20,
  base_cost_per_quarter: 5,
  drives_specs: drives,
});

const goodRungs = (): CapacityRung[] =>
  [2, 4, 6, 8, 10, 12].map((capacity, i) => ({ capacity, cost: (i + 1) * 10, build_weeks: 10 + i * 2 }));

const cap = (id: string, rungs: CapacityRung[] = goodRungs()): CapacityType => ({
  id,
  sub_industry: SUB,
  name: id,
  unit_label: "unit",
  description: "",
  rungs,
});

const prod = (
  id: string,
  tier: number,
  over: Partial<ProductArchetype["economics"]> & { gates?: Record<string, number>; specs?: Record<string, number> } = {},
): ProductArchetype => {
  const { gates, specs, ...econ } = over;
  return {
    id,
    sub_industry: SUB,
    name: id,
    tier,
    description: "",
    gates: gates ?? { l1: 20 },
    economics: {
      build_cost: 10 * tier,
      build_weeks: 20 * tier,
      unit_margin: 0.5,
      capacity_type: "cap1",
      capacity_to_build: 1,
      capacity_to_run: 1,
      addressable_market: 1000,
      ramp_weeks: 20,
      decay_per_quarter: 0.05,
      ...econ, // override any economics field (build_cost, capacity_type, …)
    },
    specs: specs ?? { perf: 0.6, eff: 0.4 },
  };
};

/** A clean, single-sub content set that passes every check. */
function clean(): ProductsContent {
  return {
    rdLines: [line("l1", ["perf", "eff"])],
    capacityTypes: [cap("cap1")],
    products: [prod("p1", 1), prod("p2", 2)],
    tuningBySub: new Map<string, ProductTuning>([[SUB, tuning()]]),
    subIndustries: [SUB],
  };
}

test("clean content produces no warnings", () => {
  assert.deepEqual(validateProducts(clean()), []);
});

test("1 — a gate referencing an unknown R&D line warns", () => {
  const c = clean();
  c.products = [prod("p1", 1, { gates: { ghost: 20 } })];
  assert.match(validateProducts(c).join("\n"), /unknown R&D line "ghost"/);
});

test("2 — an unknown capacity_type warns", () => {
  const c = clean();
  c.products = [prod("p1", 1, { capacity_type: "nope" })];
  assert.match(validateProducts(c).join("\n"), /capacity_type "nope" not found/);
});

test("3 — spec weights that don't sum to 1.0 warn", () => {
  const c = clean();
  c.products = [prod("p1", 1, { specs: { perf: 0.5, eff: 0.4 } })]; // 0.9
  assert.match(validateProducts(c).join("\n"), /specs weights sum to/);
});

test("4 — a spec tag no R&D line drives warns", () => {
  const c = clean();
  c.products = [prod("p1", 1, { specs: { perf: 0.6, ghost: 0.4 } })];
  assert.match(validateProducts(c).join("\n"), /spec tag "ghost" is not driven/);
});

test("5 — fewer than 6 rungs, or non-monotonic rungs, warn", () => {
  const short = clean();
  short.capacityTypes = [cap("cap1", goodRungs().slice(0, 5))];
  assert.match(validateProducts(short).join("\n"), /rungs \(need ≥6/);

  const flat = clean();
  const rungs = goodRungs();
  rungs[3] = { ...rungs[3]!, capacity: rungs[2]!.capacity }; // not strictly increasing
  flat.capacityTypes = [cap("cap1", rungs)];
  assert.match(validateProducts(flat).join("\n"), /capacity not strictly increasing/);
});

test("6 — non-contiguous tiers, or a build cost that drops by tier, warn", () => {
  const gap = clean();
  gap.products = [prod("p1", 1), prod("p3", 3)]; // missing tier 2
  assert.match(validateProducts(gap).join("\n"), /tiers not contiguous/);

  const cheaper = clean();
  cheaper.products = [prod("p1", 1, { build_cost: 100 }), prod("p2", 2, { build_cost: 10 })];
  assert.match(validateProducts(cheaper).join("\n"), /build_cost drops/);
});

test("7 — capacity_to_build above the largest rung is unbuildable", () => {
  const c = clean();
  c.products = [prod("p1", 1, { capacity_to_build: 99 })]; // max rung is 12
  assert.match(validateProducts(c).join("\n"), /exceeds the largest cap1 rung/);
});

test("8 — a sub-industry missing its _tuning block warns", () => {
  const c = clean();
  c.subIndustries = [SUB, "space_stations"]; // tuning only has ai_chips
  assert.match(validateProducts(c).join("\n"), /missing _tuning block for "space_stations"/);
});

test("shape predicates separate the three keyed-table entities", () => {
  assert.ok(isRDLine(line("l", ["x"])));
  assert.ok(!isRDLine(prod("p", 1)));
  assert.ok(isProductArchetype(prod("p", 1)));
  assert.ok(!isProductArchetype(cap("c")));
  assert.ok(isCapacityType(cap("c")));
  assert.ok(!isCapacityType(line("l", ["x"])));
});
