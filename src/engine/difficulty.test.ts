import { test } from "node:test";
import assert from "node:assert/strict";

import { applyWorldDifficulty, biteFor, previewBars, DEFAULT_DIFFICULTY } from "./difficulty.ts";
import { TEST_TUNING } from "./world.test.ts";
import { createNewGame } from "@/state/newgame";
import type { Difficulty } from "@/domain/state";

const forgiving: Difficulty = { preset: "forgiving", newsCycle: "easy" };
const brutal: Difficulty = { preset: "brutal", newsCycle: "hard" };

test("the default is realistic, and realistic leaves the world untouched", () => {
  assert.equal(DEFAULT_DIFFICULTY.preset, "realistic");
  const same = applyWorldDifficulty(TEST_TUNING, DEFAULT_DIFFICULTY);
  assert.equal(same.world.difficulty.volatility, TEST_TUNING.world.difficulty.volatility);
  assert.equal(same.world.macro.shockWeeklyProb, TEST_TUNING.world.macro.shockWeeklyProb);
});

test("brutal raises world volatility and shock odds; forgiving lowers them", () => {
  const b = applyWorldDifficulty(TEST_TUNING, brutal).world;
  const f = applyWorldDifficulty(TEST_TUNING, forgiving).world;
  assert.ok(b.difficulty.volatility > TEST_TUNING.world.difficulty.volatility);
  assert.ok(f.difficulty.volatility < TEST_TUNING.world.difficulty.volatility);
  assert.ok(b.macro.shockWeeklyProb > f.macro.shockWeeklyProb);
});

test("event severity bites the bad side only; positive effects pass through", () => {
  assert.ok(biteFor(brutal, -10) < -10, "brutal worsens a loss");
  assert.ok(biteFor(forgiving, -10) > -10, "forgiving softens a loss");
  assert.equal(biteFor(brutal, 8), 8, "a gain is never scaled");
  assert.equal(biteFor(undefined, -5), -5, "no difficulty ⇒ realistic ⇒ no change");
});

test("starting capital scales with the preset", () => {
  const cash = (d: Difficulty) =>
    createNewGame(
      { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1, difficulty: d },
      "2026-01-01T00:00:00Z",
    ).company.financials.cash;
  const f = cash(forgiving);
  const r = cash(DEFAULT_DIFFICULTY);
  const b = cash(brutal);
  assert.ok(f > r && r > b, `expected forgiving(${f}) > realistic(${r}) > brutal(${b})`);
});

test("preview bars are normalized [0,1] and a harsher world reads higher", () => {
  const bars = previewBars("realistic");
  assert.equal(bars.length, 4);
  for (const bar of bars) assert.ok(bar.fill >= 0 && bar.fill <= 1, `${bar.label}=${bar.fill}`);
  const vol = (p: "forgiving" | "brutal") => previewBars(p).find((x) => x.label === "Market volatility")!.fill;
  assert.ok(vol("brutal") > vol("forgiving"));
});

test("a new game records the chosen difficulty", () => {
  const g = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1, difficulty: brutal },
    "2026-01-01T00:00:00Z",
  );
  assert.deepEqual(g.difficulty, brutal);
});
