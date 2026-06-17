import { test } from "node:test";
import assert from "node:assert/strict";

import { betCost, gatesMet, makeBet, shipProduct, tickBets } from "./products.ts";
import type { ProductArchetype, ProductTuning, RDLine } from "@/domain/content";

const lines: RDLine[] = [
  { id: "a", sub_industry: "ai_chips", name: "A", description: "", starting_level: 0, base_cost_per_quarter: 8, drives_specs: ["performance"] },
  { id: "b", sub_industry: "ai_chips", name: "B", description: "", starting_level: 0, base_cost_per_quarter: 8, drives_specs: ["efficiency"] },
];

const archetype = (id: string, over: Partial<ProductArchetype["economics"]> = {}, gates: Record<string, number> = { a: 20 }): ProductArchetype => ({
  id,
  sub_industry: "ai_chips",
  name: id,
  tier: 1,
  description: "",
  gates,
  economics: {
    build_cost: 40,
    build_weeks: 60,
    unit_margin: 0.5,
    capacity_type: "fab_line",
    capacity_to_build: 2,
    capacity_to_run: 1,
    addressable_market: 1000,
    ramp_weeks: 20,
    decay_per_quarter: 0.05,
    ...over,
  },
  specs: { performance: 0.6, efficiency: 0.4 },
});

const tuning = (over: Partial<ProductTuning> = {}): ProductTuning => ({
  starting_capacity: 2,
  rd_diminishing_k: 0.8,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.15,
  ...over,
});

test("gatesMet checks every gate against current levels", () => {
  const a = archetype("p", {}, { a: 20, b: 30 });
  assert.ok(gatesMet(a, { a: 25, b: 35 }));
  assert.ok(!gatesMet(a, { a: 25, b: 10 }));
});

test("betCost and makeBet apply the industry multipliers", () => {
  const a = archetype("p");
  assert.equal(betCost(a, tuning({ build_cost_mult: 1.5 })), 60); // 40 * 1.5
  const bet = makeBet(a, "My Chip", "create", { a: 30, b: 20 }, 5, tuning({ build_time_mult: 1.5 }));
  assert.equal(bet.weeks_left, 90); // round(60 * 1.5)
  assert.equal(bet.capacity_held, 2); // = capacity_to_build
  assert.equal(bet.cap_id, "fab_line");
  assert.deepEqual(bet.committed_levels, { a: 30, b: 20 });
});

test("shipProduct sets quality from committed levels and starts the ramp", () => {
  const a = archetype("p");
  const bet = makeBet(a, "My Chip", "create", { a: 60, b: 40 }, 5, tuning());
  const p = shipProduct(bet, a, lines, 65);
  assert.ok(Math.abs(p.quality - (0.6 * 60 + 0.4 * 40)) < 1e-9);
  assert.equal(p.state, "ramping");
  assert.equal(p.share, 0);
  assert.equal(p.age_weeks, 0);
  assert.equal(p.capacity_run, 1);
});

test("parallel bets tick independently; only the finished one ships", () => {
  const byId = new Map([["p1", archetype("p1")], ["p2", archetype("p2")]]);
  const bets = [
    makeBet(archetype("p1"), "One", "create", { a: 50, b: 50 }, 0, tuning()),
    makeBet(archetype("p2"), "Two", "create", { a: 50, b: 50 }, 0, tuning()),
  ];
  bets[0]!.weeks_left = 1; // p1 ships this tick
  bets[1]!.weeks_left = 3; // p2 keeps going

  const res = tickBets(bets, byId, lines, 10);
  assert.equal(res.shipped.length, 1);
  assert.equal(res.shipped[0]!.product.archetype_id, "p1");
  assert.equal(res.bets.length, 1, "the shipped bet leaves the list — its build capacity is freed");
  assert.equal(res.bets[0]!.archetype_id, "p2");
  assert.equal(res.bets[0]!.weeks_left, 2);
});
