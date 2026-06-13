// Tick/simulation constants. Authored in `content/world/tuning.toml` (never
// hardcoded — design decision A), loaded into this shape, and passed into the
// pure tick engine so balancing needs no recompile and saves stay deterministic.

import type { Industry } from "./ids";

export interface Tuning {
  runway: {
    /** Months of runway below which the game nudges you to raise. */
    lowMonths: number;
    /** Months below which runway is flagged critical. */
    criticalMonths: number;
  };
  world: {
    /** Fraction of the gap to baseline hype closed per week (mean reversion). */
    hypeReversion: number;
    hypeNoise: number;
    hypeBaseline: Partial<Record<Industry, number>>;
    climateReversion: number;
    climateBaseline: number;
    climateNoise: number;
    rateNoise: number;
    macroTransitionWeeklyProb: number;
    ipoWindowTransitionWeeklyProb: number;
  };
  advance: {
    /** Hard cap on a single "Advance to Next Decision" so it always returns. */
    nextDecisionCapWeeks: number;
  };
  milestones: {
    /** Net-worth thresholds, $M — the motivational spine. */
    netWorth: number[];
  };
}
