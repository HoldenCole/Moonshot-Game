import { test } from "node:test";
import assert from "node:assert/strict";

import { headcountBurn, hireCost, hireStaff, trimTeam } from "./operations.ts";
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

  const floored = trimTeam(game(), 999);
  assert.equal(floored.company.financials.headcount, 2);
});
