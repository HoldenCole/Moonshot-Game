import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buyStock,
  sellStock,
  markPortfolios,
  portfolioValue,
  companyPortfolioValue,
  pricePerShare,
  holdingGain,
} from "./investing.ts";
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

/** A fresh game with $50M personal cash and $30M of company cash to allocate. */
function g(): GameState {
  const s = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 7 },
    "2026-01-01T00:00:00Z",
  );
  s.founder.personalCash = 50;
  s.company.financials.cash = 30;
  return s;
}

// ── Personal pocket ───────────────────────────────────────────────────────────

test("a personal buy spends personal cash and creates a marked holding", () => {
  const s = g();
  const c = co("openmind");
  const next = buyStock(s, c, 20, "personal", s.world, s.clock.week);
  assert.ok(Math.abs(next.founder.personalCash - 30) < 1e-6); // $50 − $20
  assert.equal(next.company.financials.cash, 30); // company untouched
  const pf = next.founder.portfolio ?? [];
  assert.equal(pf.length, 1);
  assert.equal(pf[0]!.companyId, "openmind");
  assert.ok(Math.abs(pf[0]!.value - 20) < 1e-6);
  const pps = pricePerShare(c, s.world, s.clock.week);
  assert.ok(Math.abs(pf[0]!.shares - 20 / pps) < 1e-6);
});

test("a personal buy is net-worth neutral the instant it settles", () => {
  const s = g();
  const before = netWorth(s);
  const next = buyStock(s, co("openmind"), 20, "personal", s.world, s.clock.week);
  assert.ok(Math.abs(netWorth(next) - before) < 1e-6);
});

test("the spend is capped at the pocket's cash", () => {
  const s = g();
  const next = buyStock(s, co("openmind"), 999, "personal", s.world, s.clock.week);
  assert.ok(Math.abs(next.founder.personalCash) < 1e-6); // spent all $50
  assert.ok(Math.abs(next.founder.portfolio![0]!.value - 50) < 1e-6);
});

test("a sub-minimum trade is a no-op", () => {
  const s = g();
  assert.equal(buyStock(s, co("openmind"), 0.05, "personal", s.world, s.clock.week), s);
});

test("buying a private company (no shares out) does nothing", () => {
  const s = g();
  const priv = co("seedco");
  priv.financials.shares_out = 0;
  assert.equal(buyStock(s, priv, 20, "personal", s.world, s.clock.week), s);
});

test("buying the same name again averages into one holding", () => {
  const s = g();
  const c = co("openmind");
  const a = buyStock(s, c, 10, "personal", s.world, s.clock.week);
  const b = buyStock(a, c, 10, "personal", s.world, s.clock.week);
  assert.equal(b.founder.portfolio!.length, 1);
  assert.ok(Math.abs(b.founder.portfolio![0]!.costBasis - 20) < 1e-6);
  assert.ok(Math.abs(b.founder.personalCash - 30) < 1e-6);
});

test("selling banks the proceeds and removes a fully-sold holding", () => {
  const s = g();
  const c = co("openmind");
  const bought = buyStock(s, c, 20, "personal", s.world, s.clock.week);
  const sold = sellStock(bought, "openmind", 1, "personal", [c], s.world, s.clock.week);
  assert.equal((sold.founder.portfolio ?? []).length, 0);
  assert.ok(Math.abs(sold.founder.personalCash - 50) < 1e-6); // back to start
});

test("selling half keeps a smaller, lower-basis holding", () => {
  const s = g();
  const c = co("openmind");
  const bought = buyStock(s, c, 20, "personal", s.world, s.clock.week);
  const sold = sellStock(bought, "openmind", 0.5, "personal", [c], s.world, s.clock.week);
  const h = sold.founder.portfolio![0]!;
  assert.ok(Math.abs(h.costBasis - 10) < 1e-6);
  assert.ok(Math.abs(sold.founder.personalCash - 40) < 1e-6); // 30 left + 10 proceeds
});

test("selling a name you don't hold is a no-op", () => {
  const s = g();
  assert.equal(sellStock(s, "ghost", 1, "personal", [co("ghost")], s.world, s.clock.week), s);
});

// ── Company treasury pocket ─────────────────────────────────────────────────────

test("a company buy spends treasury cash, not personal cash", () => {
  const s = g();
  const c = co("openmind");
  const next = buyStock(s, c, 20, "company", s.world, s.clock.week);
  assert.ok(Math.abs(next.company.financials.cash - 10) < 1e-6); // $30 − $20
  assert.equal(next.founder.personalCash, 50); // personal untouched
  assert.equal((next.founder.portfolio ?? []).length, 0); // not a personal holding
  const pf = next.company.portfolio ?? [];
  assert.equal(pf.length, 1);
  assert.ok(Math.abs(pf[0]!.value - 20) < 1e-6);
});

test("company holdings stay out of net worth (no double count with company cash)", () => {
  const s = g();
  const before = netWorth(s);
  const next = buyStock(s, co("openmind"), 20, "company", s.world, s.clock.week);
  // Company cash isn't in net worth, and neither are the holdings it buys — so a
  // treasury purchase leaves net worth untouched.
  assert.ok(Math.abs(netWorth(next) - before) < 1e-6);
  assert.ok(Math.abs(companyPortfolioValue(next) - 20) < 1e-6);
  assert.equal(portfolioValue(next), 0); // personal portfolio still empty
});

test("selling a company holding returns the proceeds to the treasury", () => {
  const s = g();
  const c = co("openmind");
  const bought = buyStock(s, c, 20, "company", s.world, s.clock.week);
  const sold = sellStock(bought, "openmind", 1, "company", [c], s.world, s.clock.week);
  assert.equal((sold.company.portfolio ?? []).length, 0);
  assert.ok(Math.abs(sold.company.financials.cash - 30) < 1e-6); // back to start
  assert.equal(sold.founder.personalCash, 50); // personal never involved
});

test("the two pockets are independent — same name, separate positions", () => {
  const s = g();
  const c = co("openmind");
  let next = buyStock(s, c, 20, "personal", s.world, s.clock.week);
  next = buyStock(next, c, 15, "company", next.world, next.clock.week);
  assert.equal(next.founder.portfolio!.length, 1);
  assert.equal(next.company.portfolio!.length, 1);
  assert.ok(Math.abs(next.founder.portfolio![0]!.value - 20) < 1e-6);
  assert.ok(Math.abs(next.company.portfolio![0]!.value - 15) < 1e-6);
});

// ── Marking ──────────────────────────────────────────────────────────────────

test("markPortfolios re-values both pockets as the market moves", () => {
  const s = g();
  const c = co("openmind");
  let bought = buyStock(s, c, 20, "personal", s.world, s.clock.week);
  bought = buyStock(bought, c, 15, "company", bought.world, bought.clock.week);
  const persCost = bought.founder.portfolio![0]!.costBasis;
  const coCost = bought.company.portfolio![0]!.costBasis;

  const hot = { ...bought, world: { ...bought.world, hype: { ...bought.world.hype, ai: 95 } } };
  const marked = markPortfolios(hot, [c], hot.world, hot.clock.week);

  assert.ok(marked.founder.portfolio![0]!.value > persCost, "personal re-marked up");
  assert.ok(marked.company.portfolio![0]!.value > coCost, "company re-marked up");
  assert.ok(holdingGain(marked.founder.portfolio![0]!) > 0);
  assert.ok(companyPortfolioValue(marked) > coCost);
  // Personal gains still flow to net worth; company gains do not.
  assert.ok(netWorth(marked) > netWorth(bought));
});

test("portfolio values are zero with no holdings", () => {
  const s = g();
  assert.equal(portfolioValue(s), 0);
  assert.equal(companyPortfolioValue(s), 0);
});
