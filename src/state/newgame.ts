// New-game construction. Turns founding choices into an initial GameState.
// Pure — the store calls this; tests can too.

import type { Industry, Stage, SubIndustry } from "@/domain/ids";
import type { Difficulty, GameState, WorldState } from "@/domain/state";
import { SCHEMA_VERSION } from "@/domain/state";
import type { RoundTerms } from "@/domain/captable";
import type { CompanyContent, FounderContent } from "@/domain/content";
import { INITIAL_EVENT_STATE } from "@/domain/events";
import { normalizeDifficulty } from "@/engine/difficulty";
import { foundCompany } from "@/engine/captable";
import { IDLE_SIGNATURE } from "@/engine/signature";
import { snapshotWorld } from "@/engine/world";
import { generateMarket } from "@/engine/worldgen";

export interface FoundingChoices {
  founderName: string;
  companyName: string;
  industry: Industry;
  subIndustry: SubIndustry;
  color: string;
  seed: number;
  cofounder?: { name: string; sharePct: number };
  /** Difficulty chosen on the setup screen (defaults to Realistic / Medium). */
  difficulty?: Difficulty;
  /** Chosen founder archetype (tilts the opening state); neutral if omitted.
   *  A custom-built founder passes one of these too, with id "custom". */
  archetype?: FounderContent;
  /** Founder age (custom builds set it; cosmetic in V1). */
  age?: number;
  /** New Game Plus: reputation + personal wealth carried from a prior run. */
  carryOver?: { reputation: number; personalCash: number };
}

/** Build the genesis save from founding choices. The company starts pre-seed
 *  with a little founder capital and a cap table the founder wholly owns. The
 *  procedural market is generated from the seed (anchors as templates). */
const clampScore = (x: number) => Math.max(0, Math.min(100, x));

export function createNewGame(
  choices: FoundingChoices,
  createdAt: string,
  anchors: CompanyContent["company"][] = [],
  firmIds: string[] = [],
): GameState {
  const capTable = foundCompany({
    founderId: "you",
    founderName: choices.founderName,
    week: 0,
    foundingStage: "pre_seed",
    cofounder: choices.cofounder
      ? { id: "cofounder", name: choices.cofounder.name, sharePct: choices.cofounder.sharePct }
      : undefined,
  });

  const difficulty = normalizeDifficulty(choices.difficulty);
  const axes = difficulty.axes;
  // Founder archetype tilts the opening board over the difficulty baselines.
  const m = choices.archetype?.modifiers;
  const burnEff = m?.sub_system_lean === "burn_efficiency" ? 0.92 : 1;
  // Founding capital and opening burn scale with difficulty (and the archetype) —
  // more cushion and a lighter burn on Forgiving / capital-efficient founders.
  const startingCash = Math.round(0.75 * axes.startingCapital * (m?.starting_cash_mult ?? 1) * 100) / 100;
  const startingBurn = Math.round(0.08 * axes.burnRate * burnEff * 1000) / 1000;

  // Opening "weather": a healthy late-expansion, all eight industries seeded
  // at their hype baselines so the public market (Phase 6) reads from them.
  const world: WorldState = {
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
    hype: {
      ai: 78,
      space: 64,
      biotech: 55,
      energy: 50,
      defense: 58,
      advanced_mfg: 48,
      mobility: 52,
      quantum: 46,
    },
  };

  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      seed: choices.seed,
      rngState: choices.seed >>> 0,
      createdAt,
      runName: choices.companyName,
    },
    difficulty,
    clock: { week: 0 },
    founder: {
      name: choices.founderName,
      // A proven serial founder carries reputation (and exit wealth) forward;
      // the archetype tilts reputation/integrity over that baseline.
      reputation: clampScore((choices.carryOver?.reputation ?? 30) + (m?.starting_reputation ?? 0)),
      personalCash: choices.carryOver?.personalCash ?? 0,
      ethics: clampScore(60 + (m?.integrity_baseline ?? 0)),
      investorWarmth: m?.investor_warmth ?? 0,
      signatureLean: m?.signature_lean ?? 0,
      execQualityFloor: m?.exec_quality_floor ?? 0,
      // Only present when set (keeps the save round-trip clean).
      ...(choices.archetype ? { archetype: choices.archetype.id } : {}),
      ...(choices.age != null ? { age: choices.age } : {}),
    },
    company: {
      name: choices.companyName,
      industry: choices.industry,
      subIndustry: choices.subIndustry,
      stage: "pre_seed",
      foundedWeek: 0,
      color: choices.color,
      financials: {
        cash: startingCash, // base ~$750K of founder / F&F capital, scaled by difficulty
        revenue: 0,
        burnMonthly: startingBurn, // base $80K/mo, scaled by the burn-rate axis
        headcount: choices.cofounder ? 3 : 2,
        valuation: 0,
      },
      capTable,
      signature: IDLE_SIGNATURE,
      executives: {},
      delegation: { finance: "decide", operations: "decide", revenue: "decide", technical: "decide" },
    },
    world,
    market: { companies: generateMarket(choices.seed, anchors, firmIds) },
    worldHistory: [snapshotWorld(world, 0)],
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
    eventState: INITIAL_EVENT_STATE,
    pendingEvent: null,
    runOutcome: null,
    achievements: [],
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
