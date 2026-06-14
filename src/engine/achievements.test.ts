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
  g.company = { ...g.company, stage: "public" };
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
