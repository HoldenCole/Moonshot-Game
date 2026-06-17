import { test } from "node:test";
import assert from "node:assert/strict";

import { checkAchievements, newlyUnlocked } from "./achievements.ts";
import { applyRound } from "./captable.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function fresh(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1 },
    "2026-01-01T00:00:00Z",
  );
}

test("a brand-new founder has unlocked nothing", () => {
  assert.deepEqual(checkAchievements(fresh()), []);
});

test("closing a round unlocks 'first money' and 'millionaire'", () => {
  const g = fresh();
  g.company.capTable = applyRound(g.company.capTable, {
    terms: { valuation: 12, roundSize: 3, liquidationPref: 1, participating: false, boardSeats: 1, optionPoolPct: 0.1 },
    stage: "seed",
    week: 4,
    leadInvestorId: "x",
    leadInvestorName: "X",
  });
  const ids = checkAchievements(g);
  assert.ok(ids.includes("first_money"));
  assert.ok(ids.includes("millionaire")); // 70% of $15M post is well over $1M
});

test("going public and crossing $1B net worth unlock the gold tier", () => {
  const g = fresh();
  // A real IPO stamps the live market cap onto financials (what a public company
  // is marked at); valuationMark reads that for a public company.
  g.company = { ...g.company, stage: "public", financials: { ...g.company.financials, valuation: 5000 } };
  g.company.capTable = applyRound(g.company.capTable, {
    terms: { valuation: 4000, roundSize: 1000, liquidationPref: 0, participating: false, boardSeats: 0, optionPoolPct: 0 },
    stage: "public",
    week: 200,
    leadInvestorId: "public_markets",
    leadInvestorName: "Public Markets",
  });
  const ids = checkAchievements(g);
  assert.ok(ids.includes("ipo"));
  assert.ok(ids.includes("billionaire"));
  assert.ok(ids.includes("unicorn"));
});

test("a bootstrapped $1B company unlocks Unicorn without ever raising a round", () => {
  const g = fresh();
  g.company.financials.valuation = 1200; // grew into a $1.2B live mark on revenue
  assert.equal(g.company.capTable.rounds.filter((r) => r.postMoney > 0).length, 0, "never raised a priced round");
  assert.ok(checkAchievements(g).includes("unicorn"));
});

test("newlyUnlocked excludes already-recorded achievements", () => {
  const g = fresh();
  g.company.capTable = applyRound(g.company.capTable, {
    terms: { valuation: 12, roundSize: 3, liquidationPref: 1, participating: false, boardSeats: 1, optionPoolPct: 0.1 },
    stage: "seed",
    week: 4,
    leadInvestorId: "x",
    leadInvestorName: "X",
  });
  g.achievements = ["first_money"];
  const newly = newlyUnlocked(g);
  assert.ok(!newly.includes("first_money"));
  assert.ok(newly.includes("millionaire"));
});
