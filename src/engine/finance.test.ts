import { test } from "node:test";
import assert from "node:assert/strict";

import { businessValue, earningsMultiple, eps, netIncomeAnnual, peRatio, revenueGrowth, revenueMultiple, stockPrice } from "./finance.ts";
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

test("earningsMultiple scales with hype and growth, within a believable band", () => {
  assert.ok(Math.abs(earningsMultiple(0, 0) - 12) < 1e-9, "floors at 12× in a cold sector");
  assert.ok(earningsMultiple(100, 0) > earningsMultiple(0, 0), "a hotter sector earns a richer multiple");
  assert.ok(earningsMultiple(55, 0.5) > earningsMultiple(55, 0), "faster growth earns a richer multiple");
  assert.ok(earningsMultiple(100, 1) <= 30, "capped at 30×");
});

test("businessValue prices a profitable company on earnings, a loss-maker on revenue", () => {
  const s = g();
  s.world.hype.ai = 55;
  // High-margin & profitable: earnings power (netIncome × ~19×) beats revenue × ~9×,
  // so the implied P/E lands in a realistic band instead of collapsing to the multiple.
  s.company.financials.revenue = 100; // gross profit
  s.company.financials.burnMonthly = 1; // ~$12M/yr costs → a fat profit
  const profitable = businessValue(s.company, s.world);
  assert.ok(profitable > 100 * revenueMultiple(55), "valued above the pure revenue mark");
  const impliedPE = profitable / netIncomeAnnual(s.company);
  assert.ok(impliedPE >= 12 && impliedPE <= 30, `realistic P/E, got ${impliedPE.toFixed(1)}`);
  // Loss-making: the earnings path contributes nothing, so it falls back to revenue.
  s.company.financials.burnMonthly = 20; // ~$240M/yr costs → deep loss
  assert.ok(Math.abs(businessValue(s.company, s.world) - 100 * revenueMultiple(55)) < 1e-9);
});

test("revenue growth needs ~a quarter of history, then reads the trailing change", () => {
  const s = g();
  assert.equal(revenueGrowth(s.company), null); // no history yet
  s.company.financials.revenueLog = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 20];
  s.company.financials.revenue = 20; // 13 weeks ago it was 10
  assert.ok(Math.abs(revenueGrowth(s.company)! - 1) < 1e-9); // +100%
});
