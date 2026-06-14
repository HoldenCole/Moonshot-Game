// Tick/simulation constants. Authored in `content/world/tuning.toml` (never
// hardcoded — design decision A), loaded into this shape, and passed into the
// pure tick engine so balancing needs no recompile and saves stay deterministic.

import type { Industry } from "./ids";

/** The six master-variable engines' constants (three-layer world model). */
export interface WorldTuning {
  // Universal layer
  macro: {
    /** Weeks for a full economic cycle (the oscillator's period). */
    cycleWeeks: number;
    positionNoise: number;
    /** Per-week probability of a recession shock. */
    shockWeeklyProb: number;
    shockMagnitude: number;
  };
  rates: {
    /** Neutral policy rate, %. */
    neutral: number;
    taylorOutput: number;
    taylorInflation: number;
    /** Cadence of rate reviews, weeks (Taylor rule settles quarterly). */
    reviewWeeks: number;
    maxMovePerReview: number;
    min: number;
  };
  sentiment: {
    baseline: number;
    reversion: number;
    macroWeight: number;
    rateWeight: number;
    noise: number;
  };
  // Derived layer
  climate: {
    reversion: number;
    base: number;
    sentimentWeight: number;
    rateWeight: number;
    hypeWeight: number;
    noise: number;
  };
  ipo: {
    /** Minimum weeks a window state must persist before it can change. */
    minPersistWeeks: number;
    openThreshold: number;
    closedThreshold: number;
    sentimentWeight: number;
    macroWeight: number;
  };
  hype: {
    /** How much risk-on macro lifts all industry hype. */
    macroLift: number;
    waveWeeklyProb: number;
    waveMagnitude: number;
    noise: number;
    baseline: Partial<Record<Industry, number>>;
    /** Per-industry mean-reversion rate (AI fastest, Quantum slowest). */
    reversion: Partial<Record<Industry, number>>;
  };
  /** Global volatility multiplier — the difficulty seam (decision I). */
  difficulty: { volatility: number };
}

export interface Tuning {
  runway: {
    /** Months of runway below which the game nudges you to raise. */
    lowMonths: number;
    /** Months below which runway is flagged critical. */
    criticalMonths: number;
  };
  world: WorldTuning;
  advance: {
    /** Hard cap on a single "Advance to Next Decision" so it always returns. */
    nextDecisionCapWeeks: number;
  };
  milestones: {
    /** Net-worth thresholds, $M — the motivational spine. */
    netWorth: number[];
  };
}
