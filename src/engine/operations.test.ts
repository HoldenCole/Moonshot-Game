import { test } from "node:test";
import assert from "node:assert/strict";

import {
  capacityTiers,
  headcountBurn,
  hireCost,
  hireStaff,
  investCapacity,
  opsExecutionBoost,
  trimTeam,
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

test("investing in capacity spends capex, raises burn, and builds capacity", () => {
  const g = game();
  const tier = capacityTiers(g).find((t) => t.id === "cluster")!;
  const after = investCapacity(g, "cluster");
  assert.equal(after.company.capacity, tier.gain);
  assert.ok(Math.abs(after.company.financials.cash - (20 - tier.capex)) < 1e-9);
  assert.ok(after.company.financials.burnMonthly > g.company.financials.burnMonthly);
  // AI gets compute tiers; space gets facilities.
  assert.equal(capacityTiers(g)[0]!.label, "GPU pod");
});

test("team + capacity lift the execution boost the signature reads", () => {
  const g = game();
  const base = opsExecutionBoost(g.company);
  const grown = investCapacity(hireStaff(g, 25), "datacenter");
  assert.ok(opsExecutionBoost(grown.company) > base, "spending improves execution");
  assert.ok(opsExecutionBoost(grown.company) <= 0.34 + 1e-9, "boost stays bounded");
});
