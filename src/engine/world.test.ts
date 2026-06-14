import { test } from "node:test";
import assert from "node:assert/strict";

import { snapshotWorld, stepWorld, valuationMultiplier } from "./world.ts";
import { makeRng } from "./rng.ts";
import type { Tuning } from "@/domain/tuning";
import type { WorldState } from "@/domain/state";

/** A representative tuning, mirroring content/world/tuning.toml. Shared with the
 *  tick tests so both exercise the same constants. */
export const TEST_TUNING: Tuning = {
  runway: { lowMonths: 9, criticalMonths: 4 },
  advance: { nextDecisionCapWeeks: 104 },
  milestones: { netWorth: [1, 10, 100, 1000, 10000] },
  world: {
    macro: { cycleWeeks: 460, positionNoise: 0.004, shockWeeklyProb: 0.0035, shockMagnitude: 0.55 },
    rates: { neutral: 3.0, taylorOutput: 1.2, taylorInflation: 1.6, reviewWeeks: 13, maxMovePerReview: 0.5, min: 0.25 },
    sentiment: { baseline: 58, reversion: 0.05, macroWeight: 24, rateWeight: 4.0, noise: 2.6 },
    climate: { reversion: 0.06, base: 54, sentimentWeight: 0.55, rateWeight: 3.0, hypeWeight: 0.22, noise: 1.5 },
    ipo: { minPersistWeeks: 8, openThreshold: 64, closedThreshold: 38, sentimentWeight: 0.7, macroWeight: 26 },
    hype: {
      macroLift: 18,
      waveWeeklyProb: 0.012,
      waveMagnitude: 18,
      noise: 1.1,
      baseline: { ai: 72, space: 60, biotech: 55, energy: 50, defense: 58, advanced_mfg: 48, mobility: 52, quantum: 46 },
      reversion: { ai: 0.06, space: 0.042, biotech: 0.036, energy: 0.03, defense: 0.034, advanced_mfg: 0.03, mobility: 0.04, quantum: 0.022 },
    },
    difficulty: { volatility: 1.0 },
  },
};

function world(): WorldState {
  return {
    macroPhase: "expansion",
    weeksInPhase: 12,
    macroPrevPhase: "recovery",
    macroPosition: 0.6,
    macroStrength: 0.45,
    interestRate: 4.5,
    rateTarget: 4.5,
    weeksSinceRateReview: 0,
    marketSentiment: 64,
    vcClimate: 62,
    ipoWindow: "open",
    ipoOpenness: 68,
    weeksInIpoWindow: 8,
    hype: { ai: 78, space: 64, biotech: 55, energy: 50, defense: 58, advanced_mfg: 48, mobility: 52, quantum: 46 },
  };
}

/** Run the world forward N weeks from a fixed seed. */
function run(weeks: number, seed = 7): { world: WorldState; phases: Set<string> } {
  let w = world();
  const rng = makeRng(seed);
  const phases = new Set<string>();
  for (let i = 0; i < weeks; i++) {
    w = stepWorld(w, rng, TEST_TUNING.world, "ai").world;
    phases.add(w.macroPhase);
  }
  return { world: w, phases };
}

test("the world steps deterministically from a seed", () => {
  const a = run(120, 42).world;
  const b = run(120, 42).world;
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("all bounded variables stay within range over a long run", () => {
  const { world: w } = run(600);
  for (const v of [w.marketSentiment, w.vcClimate, w.ipoOpenness]) {
    assert.ok(v >= 0 && v <= 100, `out of [0,100]: ${v}`);
  }
  for (const h of Object.values(w.hype)) {
    assert.ok(h! >= 0 && h! <= 100, `hype out of range: ${h}`);
  }
  assert.ok(w.interestRate >= TEST_TUNING.world.rates.min);
  assert.ok(Math.abs(w.macroStrength) <= 1);
});

test("interest rate only moves on the quarterly review cadence", () => {
  let w = world();
  const rng = makeRng(3);
  const reviewWeeks = TEST_TUNING.world.rates.reviewWeeks;
  for (let i = 1; i <= reviewWeeks - 1; i++) {
    const prev = w.interestRate;
    w = stepWorld(w, rng, TEST_TUNING.world, "ai").world;
    assert.equal(w.interestRate, prev, `rate moved off-cadence at week ${i}`);
  }
  // On the review week it may move.
  w = stepWorld(w, rng, TEST_TUNING.world, "ai").world;
  assert.equal(w.weeksSinceRateReview, 0);
});

test("the macro cycle progresses through multiple phases over years", () => {
  const { phases } = run(900); // ~17 years, ~2 cycles
  assert.ok(phases.size >= 3, `expected several phases, saw ${[...phases].join(", ")}`);
});

test("valuation multiplier rises with climate and hype, within bounds", () => {
  const cold = valuationMultiplier({ ...world(), vcClimate: 20, hype: { ai: 30 } }, "ai");
  const hot = valuationMultiplier({ ...world(), vcClimate: 95, hype: { ai: 95 } }, "ai");
  assert.ok(hot > cold);
  assert.ok(cold >= 0.6 && hot <= 1.65);
});

test("a world snapshot captures the headline series", () => {
  const snap = snapshotWorld(world(), 5);
  assert.equal(snap.week, 5);
  assert.equal(snap.vcClimate, 62);
  assert.ok("ai" in snap.hype);
});
