import { test } from "node:test";
import assert from "node:assert/strict";

import { buyStock, sellStock, markPortfolio, portfolioValue, pricePerShare, holdingGain } from "./investing.ts";
import { netWorth } from "./finance.ts";
import { createNewGame } from "@/state/newgame";
import type { Company } from "@/content/load";
import type { GameState } from "@/domain/state";

/** A tradeable public company fixture. */
function co(id: string): Company {
  return {
    id,
    name: id[0]!.toUpperCase() + id.slice(1),
    tier: "anchor",
    industry: "ai",
    sub_industry: "frontier_model_lab",
    founded_year: -5,
    hq: "SF",
    color: "#fff",
    logo_glyph: "x",
    identity: { tagline: "", reputation: 80, narrative_hooks: ["leads"] },
    stage: { status: "public", private_round: "", ipo_year: -1 },
    financials: { revenue: 100, revenue_growth: 0.3, gross_margin: 0.6, profitable: false, burn_monthly: 5, valuation: 1000, shares_out: 100 },
    quality: { fundamentals: 80, hype_exposure: 0.6, moat: 60, execution: 70 },
    signature: { benchmark_score: 70, signature_notes: "" },
    relationships: { competitors: [], investors: [] },
  };
}

/** A fresh game with $50M of personal cash to allocate. */
function g(): GameState {
  const s = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 7 },
    "2026-01-01T00:00:00Z",
  );
  s.founder.personalCash = 50;
  return s;
}

test("buying a stock spends personal cash and creates a marked holding", () => {
  const s = g();
  const c = co("openmind");
  const next = buyStock(s, c, 20, s.world, s.clock.week);
  assert.ok(Math.abs(next.founder.personalCash - 30) < 1e-6); // $50 − $20
  const pf = next.founder.portfolio ?? [];
  assert.equal(pf.length, 1);
  assert.equal(pf[0]!.companyId, "openmind");
  // freshly bought at this week: value == cost basis == spend.
  assert.ok(Math.abs(pf[0]!.value - 20) < 1e-6);
  assert.ok(Math.abs(pf[0]!.costBasis - 20) < 1e-6);
  // shares = spend / price-per-share.
  const pps = pricePerShare(c, s.world, s.clock.week);
  assert.ok(Math.abs(pf[0]!.shares - 20 / pps) < 1e-6);
});

test("a buy is net-worth neutral the instant it settles", () => {
  const s = g();
  const before = netWorth(s);
  const next = buyStock(s, co("openmind"), 20, s.world, s.clock.week);
  // Cash went down $20, holdings went up $20 — net worth is unchanged.
  assert.ok(Math.abs(netWorth(next) - before) < 1e-6);
});

test("the spend is capped at available personal cash", () => {
  const s = g(); // $50 personal cash
  const next = buyStock(s, co("openmind"), 999, s.world, s.clock.week);
  assert.ok(Math.abs(next.founder.personalCash) < 1e-6); // spent all $50
  assert.ok(Math.abs(next.founder.portfolio![0]!.value - 50) < 1e-6);
});

test("a sub-minimum trade is a no-op", () => {
  const s = g();
  const next = buyStock(s, co("openmind"), 0.05, s.world, s.clock.week);
  assert.equal(next, s); // returns the same state, untouched
});

test("buying a private company (no shares out) does nothing", () => {
  const s = g();
  const priv = co("seedco");
  priv.financials.shares_out = 0;
  const next = buyStock(s, priv, 20, s.world, s.clock.week);
  assert.equal(next, s);
});

test("buying the same name again averages into one holding", () => {
  const s = g();
  const c = co("openmind");
  const a = buyStock(s, c, 10, s.world, s.clock.week);
  const b = buyStock(a, c, 10, s.world, s.clock.week);
  assert.equal(b.founder.portfolio!.length, 1);
  assert.ok(Math.abs(b.founder.portfolio![0]!.costBasis - 20) < 1e-6);
  assert.ok(Math.abs(b.founder.personalCash - 30) < 1e-6);
});

test("selling banks the proceeds and removes a fully-sold holding", () => {
  const s = g();
  const c = co("openmind");
  const bought = buyStock(s, c, 20, s.world, s.clock.week);
  const sold = sellStock(bought, "openmind", 1, [c], s.world, s.clock.week);
  assert.equal((sold.founder.portfolio ?? []).length, 0);
  // Sold at the same price we bought (same week) → roughly back to $50.
  assert.ok(Math.abs(sold.founder.personalCash - 50) < 1e-6);
});

test("selling half keeps a smaller, lower-basis holding", () => {
  const s = g();
  const c = co("openmind");
  const bought = buyStock(s, c, 20, s.world, s.clock.week);
  const sold = sellStock(bought, "openmind", 0.5, [c], s.world, s.clock.week);
  const h = sold.founder.portfolio![0]!;
  assert.ok(Math.abs(h.costBasis - 10) < 1e-6);
  assert.ok(Math.abs(sold.founder.personalCash - 40) < 1e-6); // 30 left + 10 proceeds
});

test("selling a name you don't hold is a no-op", () => {
  const s = g();
  const next = sellStock(s, "ghost", 1, [co("ghost")], s.world, s.clock.week);
  assert.equal(next, s);
});

test("markPortfolio re-values holdings as the market moves", () => {
  const s = g();
  const c = co("openmind");
  const bought = buyStock(s, c, 20, s.world, s.clock.week);
  const cost = bought.founder.portfolio![0]!.costBasis;
  // Push sector hype up; the exposed name should re-mark higher.
  const hot = { ...bought, world: { ...bought.world, hype: { ...bought.world.hype, ai: 95 } } };
  const marked = markPortfolio(hot, [c], hot.world, hot.clock.week);
  const v = marked.founder.portfolio![0]!.value;
  assert.ok(v > cost); // value rose with the market
  assert.ok(Math.abs(portfolioValue(marked) - v) < 1e-6);
  assert.ok(holdingGain(marked.founder.portfolio![0]!) > 0);
  // The gain also shows up in net worth.
  assert.ok(netWorth(marked) > netWorth(bought));
});

test("portfolioValue is zero with no holdings", () => {
  assert.equal(portfolioValue(g()), 0);
});
