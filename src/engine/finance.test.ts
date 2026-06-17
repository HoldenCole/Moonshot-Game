import { test } from "node:test";
import assert from "node:assert/strict";

import { eps, netIncomeAnnual, peRatio, revenueGrowth, stockPrice } from "./finance.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function g(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1 },
    "2026-01-01T00:00:00Z",
  );
}

test("net income is revenue minus annualized operating costs", () => {
  const s = g();
  s.company.financials.revenue = 60;
  s.company.financials.burnMonthly = 2; // $24M/yr of costs
  assert.ok(Math.abs(netIncomeAnnual(s.company) - 36) < 0.01); // 60 − 24
});

test("stock price + EPS derive from shares; P/E only when profitable", () => {
  const s = g();
  s.company.financials.valuation = 250; // $250M over 10M founding shares → $25.00
  assert.ok(Math.abs(stockPrice(s.company) - 25) < 0.01);

  s.company.financials.revenue = 60;
  s.company.financials.burnMonthly = 2; // profitable
  assert.ok(eps(s.company) > 0);
  assert.ok(peRatio(s.company) != null && peRatio(s.company)! > 0);

  s.company.financials.revenue = 0; // loss-making
  assert.equal(peRatio(s.company), null);
  assert.ok(eps(s.company) < 0);
});

test("revenue growth needs ~a quarter of history, then reads the trailing change", () => {
  const s = g();
  assert.equal(revenueGrowth(s.company), null); // no history yet
  s.company.financials.revenueLog = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20];
  s.company.financials.revenue = 20; // 13 weeks ago it was 10
  assert.ok(Math.abs(revenueGrowth(s.company)! - 1) < 1e-9); // +100%
});
