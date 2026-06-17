import { test } from "node:test";
import assert from "node:assert/strict";

import { available, canStartBet, initCapacityState, isBuilding, nextRung, startRungBuild, tickCapacityBuilds } from "./capacity.ts";
import type { CapacityRung, CapacityType, ProductArchetype, ProductTuning } from "@/domain/content";
import type { ActiveBet, CapacityState, LiveProduct } from "@/domain/products";

const rungs = (): CapacityRung[] => [
  { capacity: 2, cost: 60, build_weeks: 4 },
  { capacity: 4, cost: 140, build_weeks: 6 },
  { capacity: 7, cost: 300, build_weeks: 8 },
];

const capType = (id = "fab_line"): CapacityType => ({
  id,
  sub_industry: "ai_chips",
  name: id,
  unit_label: "line",
  description: "",
  rungs: rungs(),
});

const tuning = (starting = 5): ProductTuning => ({
  starting_capacity: starting,
  rd_diminishing_k: 0.8,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.15,
});

const archetype = (id: string, capId = "fab_line", capRun = 1): ProductArchetype => ({
  id,
  sub_industry: "ai_chips",
  name: id,
  tier: 1,
  description: "",
  gates: {},
  economics: {
    build_cost: 40,
    build_weeks: 60,
    unit_margin: 0.5,
    capacity_type: capId,
    capacity_to_build: 1,
    capacity_to_run: capRun,
    addressable_market: 1000,
    ramp_weeks: 26,
    decay_per_quarter: 0.05,
  },
  specs: { performance: 1 },
});

const bet = (capId: string, held: number): ActiveBet => ({
  id: `bet-${held}`,
  archetype_id: "p",
  instance_name: "X",
  kind: "create",
  weeks_left: 10,
  capacity_held: held,
  cap_id: capId,
  committed_levels: {},
});

const product = (archetypeId: string, capRun: number): LiveProduct => ({
  id: `prod-${archetypeId}`,
  archetype_id: archetypeId,
  instance_name: "Y",
  shipped_week: 0,
  quality: 60,
  age_weeks: 0,
  state: "ramping",
  share: 0.1,
  revenue_run_rate: 0,
  capacity_run: capRun,
});

test("initCapacityState seeds owned = starting_capacity, no rungs built", () => {
  const cap = initCapacityState([capType()], tuning(5));
  assert.equal(cap.owned.fab_line, 5);
  assert.equal(cap.rung_index.fab_line, -1);
  assert.deepEqual(cap.builds_in_progress, []);
});

test("available = owned − bet build holds − product run holds", () => {
  const cap: CapacityState = { owned: { fab_line: 10 }, rung_index: { fab_line: -1 }, builds_in_progress: [] };
  const byId = new Map([["p1", archetype("p1", "fab_line", 2)]]);
  const bets = [bet("fab_line", 3)];
  const products = [product("p1", 2)];
  assert.equal(available(cap, "fab_line", bets, products, byId), 10 - 3 - 2);
  // A different capacity type is unaffected by these holders.
  assert.equal(available(cap, "fab_line", [], [], byId), 10);
});

test("buying a rung schedules a build, advances rung_index, and completes with the authored delta", () => {
  let cap = initCapacityState([capType()], tuning(5));
  assert.equal(nextRung(cap, capType())!.index, 0);

  cap = startRungBuild(cap, capType()); // rung 0: +2 capacity over 4 weeks
  assert.equal(cap.rung_index.fab_line, 0);
  assert.ok(isBuilding(cap, "fab_line"));
  assert.equal(cap.owned.fab_line, 5, "capacity not added until the build finishes");

  const typeById = new Map([["fab_line", capType()]]);
  for (let i = 0; i < 3; i++) cap = tickCapacityBuilds(cap, typeById); // 3 weeks: still building
  assert.equal(cap.owned.fab_line, 5);
  cap = tickCapacityBuilds(cap, typeById); // week 4: completes
  assert.equal(cap.owned.fab_line, 7, "added the rung's +2 delta");
  assert.ok(!isBuilding(cap, "fab_line"));
  assert.equal(nextRung(cap, capType())!.index, 1);
});

test("nextRung is null once the ladder is fully built", () => {
  const cap: CapacityState = { owned: { fab_line: 99 }, rung_index: { fab_line: 2 }, builds_in_progress: [] };
  assert.equal(nextRung(cap, capType()), null);
});

test("a bet may start only with free capacity and under the concurrency cap", () => {
  const cap: CapacityState = { owned: { fab_line: 2 }, rung_index: { fab_line: -1 }, builds_in_progress: [] };
  const byId = new Map([["p1", archetype("p1")]]);
  const base = { cap, capId: "fab_line", products: [] as LiveProduct[], productById: byId, capacityToBuild: 2, maxConcurrentBets: 3 };

  assert.ok(canStartBet({ ...base, bets: [] }), "enough free capacity, no bets running");
  assert.ok(!canStartBet({ ...base, bets: [bet("fab_line", 1)] }), "1 unit held → only 1 free < 2 needed");
  assert.ok(
    !canStartBet({ ...base, bets: [bet("other", 0), bet("other", 0), bet("other", 0)] }),
    "at the concurrency cap",
  );
});
