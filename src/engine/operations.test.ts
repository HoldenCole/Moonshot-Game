import { test } from "node:test";
import assert from "node:assert/strict";

import {
  capacityLevel,
  capacityTiers,
  headcountBurn,
  hireCost,
  hireStaff,
  hireToTargetCount,
  investCapacity,
  nextCapacityTier,
  opsExecutionBoost,
  staffingState,
  targetHeadcount,
  trimTeam,
  trimToTargetCount,
} from "./operations.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function game(cash = 20): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 4 },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.cash = cash;
  return g;
}

test("hiring raises headcount and burn and spends the recruiting cost", () => {
  const g = game();
  const h0 = g.company.financials.headcount;
  const b0 = g.company.financials.burnMonthly;
  const after = hireStaff(g, 5);
  assert.equal(after.company.financials.headcount, h0 + 5);
  assert.ok(Math.abs(after.company.financials.burnMonthly - (b0 + headcountBurn(5))) < 1e-9, "payroll added to burn");
  assert.ok(Math.abs(after.company.financials.cash - (20 - hireCost(5))) < 1e-9, "recruiting cost paid");
});

test("hiring is a no-op you can't afford", () => {
  const broke = game(0.01);
  assert.equal(hireStaff(broke, 25).company.financials.headcount, broke.company.financials.headcount);
});

test("trimming cuts burn, floors headcount at 2, and dings reputation", () => {
  let g = game();
  g = hireStaff(g, 10); // headcount 12
  const rep0 = g.founder.reputation;
  const burn0 = g.company.financials.burnMonthly;
  const after = trimTeam(g, 5);
  assert.equal(after.company.financials.headcount, g.company.financials.headcount - 5);
  assert.ok(after.company.financials.burnMonthly < burn0, "burn fell");
  assert.equal(after.founder.reputation, rep0 - 1);

  // Can't cut below the floor.
  const floored = trimTeam(game(), 999);
  assert.equal(floored.company.financials.headcount, 2);
});

test("the headcount target scales with revenue, above a stage floor", () => {
  const g = game();
  const floor = targetHeadcount(g.company); // pre-revenue → the stage floor
  g.company.financials.revenue = 60; // $60M → 150 heads at ~$400K/head
  assert.equal(targetHeadcount(g.company), 150);
  assert.ok(targetHeadcount(g.company) > floor, "revenue lifts the target");
});

test("staffing state reads under / right / over against the target", () => {
  const g = game();
  g.company.financials.revenue = 40; // target 100
  g.company.financials.headcount = 40;
  assert.equal(staffingState(g.company), "understaffed");
  g.company.financials.headcount = 100;
  assert.equal(staffingState(g.company), "right");
  g.company.financials.headcount = 200;
  assert.equal(staffingState(g.company), "overstaffed");
});

test("hire-to-target closes the gap, capped by cash; trim-to-target only when over", () => {
  const g = game(999); // plenty of cash
  g.company.financials.revenue = 40; // target 100
  g.company.financials.headcount = 40;
  assert.equal(hireToTargetCount(g.company), 60); // 100 − 40
  assert.equal(trimToTargetCount(g.company), 0);

  // Cash-constrained: only what you can afford toward the target.
  const tight = game(0.6); // 0.6 / 0.03 = 20 hires affordable
  tight.company.financials.revenue = 40;
  tight.company.financials.headcount = 40;
  assert.equal(hireToTargetCount(tight.company), 20);

  // Overstaffed → trim back to the target, never below.
  g.company.financials.headcount = 150;
  assert.equal(hireToTargetCount(g.company), 0);
  assert.equal(trimToTargetCount(g.company), 50); // 150 − 100
});

test("capacity is a one-each ladder gated on the previous rung", () => {
  const g = game(999);
  assert.equal(capacityLevel(g.company), 0);
  assert.equal(nextCapacityTier(g)!.id, "pod");

  const a = investCapacity(g);
  assert.equal(capacityLevel(a.company), 1);
  assert.ok(a.company.financials.cash < g.company.financials.cash, "capex paid");
  assert.ok(a.company.financials.burnMonthly > g.company.financials.burnMonthly, "run cost added");
  assert.equal(nextCapacityTier(a)!.id, "cluster");

  const b = investCapacity(a);
  const c = investCapacity(b);
  assert.equal(capacityLevel(c.company), 3);
  assert.equal(nextCapacityTier(c), null); // fully built out
  // Building past the top rung is a no-op.
  assert.equal(investCapacity(c), c);

  // AI gets compute tiers; space gets facilities.
  assert.equal(capacityTiers(g)[0]!.label, "GPU pod");
});

test("investing is a no-op you can't afford", () => {
  const broke = game(0.1); // can't afford even a pod (0.4)
  assert.equal(investCapacity(broke), broke);
});

test("a right-sized team + a built-out base lift the execution boost, but it stays bounded", () => {
  const g = game(999);
  g.company.financials.revenue = 40; // target 100
  g.company.financials.headcount = 50; // half-staffed
  const base = opsExecutionBoost(g.company);

  // Fully staff to target and build all three rungs.
  let grown = hireStaff(g, 50); // 50 → 100, right-sized
  grown = investCapacity(investCapacity(investCapacity(grown)));
  assert.ok(opsExecutionBoost(grown.company) > base, "spending improves execution");
  assert.ok(opsExecutionBoost(grown.company) <= 0.34 + 1e-9, "boost stays bounded");

  // Over-hiring past the target adds nothing more.
  const atTarget = opsExecutionBoost(grown.company);
  const over = hireStaff(grown, 100); // 100 → 200, overstaffed
  assert.ok(Math.abs(opsExecutionBoost(over.company) - atTarget) < 1e-9, "over-hiring is wasted burn");
});
