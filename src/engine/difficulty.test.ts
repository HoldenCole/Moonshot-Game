import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyWorldDifficulty,
  biteFor,
  matchingPreset,
  normalizeDifficulty,
  previewBars,
  AXES,
  DEFAULT_DIFFICULTY,
  PRESET_AXES,
} from "./difficulty.ts";
import { TEST_TUNING } from "./world.test.ts";
import { createNewGame } from "@/state/newgame";
import type { Difficulty } from "@/domain/state";

const forgiving = normalizeDifficulty({ preset: "forgiving", newsCycle: "easy" });
const brutal = normalizeDifficulty({ preset: "brutal", newsCycle: "hard" });

test("the default is realistic, and realistic leaves the world untouched", () => {
  assert.equal(DEFAULT_DIFFICULTY.preset, "realistic");
  const same = applyWorldDifficulty(TEST_TUNING, DEFAULT_DIFFICULTY).world;
  assert.equal(same.difficulty.volatility, TEST_TUNING.world.difficulty.volatility);
  assert.equal(same.macro.shockWeeklyProb, TEST_TUNING.world.macro.shockWeeklyProb);
  assert.equal(same.macro.cycleWeeks, TEST_TUNING.world.macro.cycleWeeks);
});

test("brutal raises volatility/shocks and speeds the cycle; forgiving softens and slows it", () => {
  const b = applyWorldDifficulty(TEST_TUNING, brutal).world;
  const f = applyWorldDifficulty(TEST_TUNING, forgiving).world;
  assert.ok(b.difficulty.volatility > TEST_TUNING.world.difficulty.volatility);
  assert.ok(f.difficulty.volatility < TEST_TUNING.world.difficulty.volatility);
  assert.ok(b.macro.shockWeeklyProb > f.macro.shockWeeklyProb);
  // Higher cycleSpeed ⇒ fewer weeks per cycle.
  assert.ok(b.macro.cycleWeeks < TEST_TUNING.world.macro.cycleWeeks);
  assert.ok(f.macro.cycleWeeks > TEST_TUNING.world.macro.cycleWeeks);
});

test("event severity bites the bad side only; gains pass through", () => {
  assert.ok(biteFor(brutal, -10) < -10);
  assert.ok(biteFor(forgiving, -10) > -10);
  assert.equal(biteFor(brutal, 8), 8);
  assert.equal(biteFor(undefined, -5), -5);
});

test("starting capital and opening burn both scale with the preset", () => {
  const open = (d: Difficulty) => {
    const f = createNewGame(
      { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1, difficulty: d },
      "2026-01-01T00:00:00Z",
    ).company.financials;
    return { cash: f.cash, burn: f.burnMonthly, runway: f.cash / f.burnMonthly };
  };
  const f = open(forgiving);
  const b = open(brutal);
  assert.ok(f.cash > b.cash, "forgiving opens with more cash");
  assert.ok(f.burn < b.burn, "forgiving opens with a lighter burn");
  assert.ok(f.runway > b.runway * 2, "the opening runway gap is large");
});

test("preview bars are normalized [0,1] and a harsher world reads higher", () => {
  const bars = previewBars(PRESET_AXES.realistic);
  assert.equal(bars.length, 5);
  for (const bar of bars) assert.ok(bar.fill >= 0 && bar.fill <= 1, `${bar.label}=${bar.fill}`);
  const turb = (axes: typeof PRESET_AXES.realistic) => previewBars(axes).find((x) => x.label === "Market turbulence")!.fill;
  assert.ok(turb(PRESET_AXES.brutal) > turb(PRESET_AXES.forgiving));
});

test("matchingPreset names a preset's axes, and flags a tweak as custom", () => {
  assert.equal(matchingPreset(PRESET_AXES.realistic), "realistic");
  assert.equal(matchingPreset(PRESET_AXES.brutal), "brutal");
  const tweaked = { ...PRESET_AXES.realistic, volatility: 1.3 };
  assert.equal(matchingPreset(tweaked), "custom");
});

test("normalizeDifficulty backfills axes for an older preset-only save", () => {
  // Old shape: a preset with no axes.
  const filled = normalizeDifficulty({ preset: "brutal", newsCycle: "medium" } as Partial<Difficulty>);
  assert.deepEqual(filled.axes, PRESET_AXES.brutal);
  // Every axis the UI exposes is present.
  for (const a of AXES) assert.equal(typeof filled.axes[a.key], "number");
});

test("a custom run carries its exact axes through founding", () => {
  const axes = { ...PRESET_AXES.realistic, volatility: 1.5, startingCapital: 0.7 };
  const g = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1, difficulty: { preset: "custom", newsCycle: "medium", axes } },
    "2026-01-01T00:00:00Z",
  );
  assert.equal(g.difficulty.preset, "custom");
  assert.deepEqual(g.difficulty.axes, axes);
});
