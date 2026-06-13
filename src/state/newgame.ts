// New-game construction. Turns founding choices into an initial GameState.
// Pure — the store calls this; tests can too.

import type { Industry, Stage, SubIndustry } from "@/domain/ids";
import type { GameState } from "@/domain/state";
import { SCHEMA_VERSION } from "@/domain/state";
import type { RoundTerms } from "@/domain/captable";
import { foundCompany } from "@/engine/captable";

export interface FoundingChoices {
  founderName: string;
  companyName: string;
  industry: Industry;
  subIndustry: SubIndustry;
  color: string;
  seed: number;
  cofounder?: { name: string; sharePct: number };
}

/** Build the genesis save from founding choices. The company starts pre-seed
 *  with a little founder capital and a cap table the founder wholly owns. */
export function createNewGame(choices: FoundingChoices, createdAt: string): GameState {
  const capTable = foundCompany({
    founderId: "you",
    founderName: choices.founderName,
    week: 0,
    foundingStage: "pre_seed",
    cofounder: choices.cofounder
      ? { id: "cofounder", name: choices.cofounder.name, sharePct: choices.cofounder.sharePct }
      : undefined,
  });

  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      seed: choices.seed,
      rngState: choices.seed >>> 0,
      createdAt,
      runName: choices.companyName,
    },
    clock: { week: 0 },
    founder: {
      name: choices.founderName,
      reputation: 30,
      personalCash: 0,
    },
    company: {
      name: choices.companyName,
      industry: choices.industry,
      subIndustry: choices.subIndustry,
      stage: "pre_seed",
      foundedWeek: 0,
      color: choices.color,
      financials: {
        cash: 0.75, // ~$750K of founder / friends-and-family capital (~9mo runway)
        revenue: 0,
        burnMonthly: 0.08,
        headcount: choices.cofounder ? 3 : 2,
        valuation: 0,
      },
      capTable,
    },
    world: {
      macroPhase: "expansion",
      interestRate: 4.5,
      vcClimate: 62,
      ipoWindow: "open",
      hype: { ai: 78, space: 64 },
    },
    log: [
      {
        id: "founded",
        week: 0,
        kind: "milestone",
        tone: "opportunity",
        headline: `${choices.companyName} is founded`,
        detail: "Day one. An idea, a little capital, and everything to build.",
      },
    ],
    alerts: [],
    lastRunwayBand: "ok",
    achievedMilestones: [],
    relationships: {},
  };
}

/** Sensible opening terms for a round at the given stage — the starting point
 *  the player negotiates from. Valuations scale with stage; pools shrink as the
 *  company matures. */
export function suggestedTerms(stage: Stage): RoundTerms {
  const table: Record<Stage, RoundTerms> = {
    idea: t(4, 1, 1, 0, 0.1),
    pre_seed: t(6, 1.5, 1, 0, 0.1),
    seed: t(12, 3, 1, 1, 0.1),
    series_a: t(40, 12, 1, 1, 0.12),
    series_b: t(120, 30, 1, 1, 0.1),
    series_c: t(300, 60, 1, 1, 0.08),
    growth: t(700, 120, 1, 1, 0.05),
    late_stage: t(1500, 250, 1, 1, 0.03),
    public: t(1500, 250, 1, 1, 0.03),
  };
  return table[stage];
}

function t(
  valuation: number,
  roundSize: number,
  liquidationPref: number,
  boardSeats: number,
  optionPoolPct: number,
): RoundTerms {
  return { valuation, roundSize, liquidationPref, participating: false, boardSeats, optionPoolPct };
}
