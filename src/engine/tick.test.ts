import { test } from "node:test";
import assert from "node:assert/strict";

import { advance, checkMilestones, tickWeek, weeksToCritical, WEEKS_PER_MONTH } from "./tick.ts";
import { applyRound } from "./captable.ts";
import { weeklyInterest } from "./debt.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState, Loan } from "@/domain/state";
import type { Tuning } from "@/domain/tuning";

import { TEST_TUNING } from "./world.test.ts";

const TUNING: Tuning = TEST_TUNING;

function base(cash = 1.0, burnMonthly = 0.1): GameState {
  const g = createNewGame(
    {
      founderName: "You",
      companyName: "Testco",
      industry: "ai",
      subIndustry: "frontier_model_lab",
      color: "#fff",
      seed: 12345,
    },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.cash = cash;
  g.company.financials.burnMonthly = burnMonthly;
  return g;
}

const approx = (a: number, b: number, eps = 1e-2) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

test("advancing is deterministic given the seed", () => {
  const project = (g: GameState) =>
    JSON.stringify({
      week: g.clock.week,
      cash: g.company.financials.cash,
      rng: g.meta.rngState,
      world: g.world,
      logLen: g.log.length,
    });
  const a = advance(base(), TUNING, { type: "weeks", weeks: 30 }).state;
  const b = advance(base(), TUNING, { type: "weeks", weeks: 30 }).state;
  assert.equal(project(a), project(b));
});

test("a week burns one week of cash and advances the clock", () => {
  const g = base(1.0, 0.12);
  const r = advance(g, TUNING, { type: "weeks", weeks: 13 });
  assert.equal(r.state.clock.week, 13);
  // 13 weeks ≈ 3 months of $0.12M burn.
  approx(r.state.company.financials.cash, 1.0 - 0.12 * (13 / WEEKS_PER_MONTH));
});

test("the world drifts but hype stays bounded 0–100", () => {
  const r = advance(base(), TUNING, { type: "weeks", weeks: 120 });
  const ai = r.state.world.hype.ai!;
  assert.ok(ai >= 0 && ai <= 100, `hype out of bounds: ${ai}`);
  // rng state moved (world actually drifted).
  assert.notEqual(r.state.meta.rngState, base().meta.rngState);
});

test("Advance to Next Decision stops when runway turns critical", () => {
  const g = base(0.5, 0.5); // ~1 month of runway
  const r = advance(g, TUNING, { type: "nextDecision" });
  assert.equal(r.stopReason, "decision");
  assert.ok(r.weeks >= 1);
  const kinds = r.state.alerts.map((a) => a.kind);
  assert.ok(kinds.includes("runway_critical") || kinds.includes("raise_ready"));
});

test("a fixed advance stops early when the company runs out of cash", () => {
  const g = base(0.2, 0.6);
  const r = advance(g, TUNING, { type: "weeks", weeks: 26 });
  assert.equal(r.stopReason, "out_of_cash");
  assert.ok(r.weeks < 26);
  assert.ok(r.state.company.financials.cash <= 0);
});

test("runway alerts fire on worsening, not every week (single critical alert)", () => {
  const g = base(0.5, 0.5);
  const r = advance(g, TUNING, { type: "weeks", weeks: 8 });
  const critical = r.state.alerts.filter((a) => a.kind === "runway_critical");
  assert.ok(critical.length <= 1, "should not stack duplicate critical alerts");
});

test("a healthy round vaults net worth past milestones", () => {
  let g = base();
  const ct = applyRound(g.company.capTable, {
    terms: { valuation: 12, roundSize: 3, liquidationPref: 1, participating: false, boardSeats: 1, optionPoolPct: 0.1 },
    stage: "seed",
    week: 0,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });
  g = { ...g, company: { ...g.company, capTable: ct } };

  const r = checkMilestones(g, TUNING, 5);
  const headlines = r.entries.map((e) => e.headline).join(" | ");
  // Founder holds ~70% of a $15M post → ~$10.5M net worth.
  assert.ok(headlines.includes("$1M"), headlines);
  assert.ok(headlines.includes("$10M"), headlines);
  assert.ok(!headlines.includes("$100M"));
  assert.ok(r.state.achievedMilestones.includes(10));
});

test("weeksToCritical estimates the runway countdown", () => {
  // $1M cash, $0.1M/mo burn → 10 months; critical reserve 4 → ~6 months left.
  approx(weeksToCritical(base(1.0, 0.1), TUNING), Math.ceil(6 * WEEKS_PER_MONTH), 1.01);
  // Cash-flow positive → infinite.
  assert.equal(weeksToCritical(base(1.0, 0), TUNING), Infinity);
});

test("tickWeek is a pure step (does not mutate the input state)", () => {
  const g = base();
  const before = g.company.financials.cash;
  tickWeek(g, TUNING);
  assert.equal(g.company.financials.cash, before);
  assert.equal(g.clock.week, 0);
});

test("a drawn loan services interest through the tick and settles at maturity", () => {
  const g = base(20, 0); // ample cash, no operating burn — isolate debt service
  const loan: Loan = { id: "L", lenderId: "b", lenderName: "Bank", principal: 10, rateAnnual: 5.2, startWeek: 0, termWeeks: 3 };
  g.company.loans = [loan];

  // Pre-maturity: interest only, the loan stays open.
  const r1 = advance(g, TUNING, { type: "weeks", weeks: 2 });
  assert.equal(r1.state.company.loans!.length, 1);
  approx(r1.state.company.financials.cash, 20 - weeklyInterest(loan) * 2, 1e-6);

  // Past maturity: the balloon principal is repaid from cash and the loan closes.
  const r2 = advance(r1.state, TUNING, { type: "weeks", weeks: 1 });
  assert.equal(r2.state.company.loans!.length, 0);
  assert.ok(r2.state.company.financials.cash < 11, "principal came out of cash");
});
