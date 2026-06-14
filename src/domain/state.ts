// The save game. Everything here is serializable; the engine mutates it only
// through pure functions so saves are deterministic given the seed.

import type { Industry, Stage, SubIndustry } from "./ids";
import type { CapTable, Money } from "./captable";
import type { Alert, LogEntry, RunwayBand } from "./log";
import type { CompanyContent } from "./content";
import type { EventState, ResolvedEvent } from "./events";

export const SCHEMA_VERSION = 1;

export interface FounderState {
  name: string;
  /** 0–100; persists across companies (the founder→magnate arc). */
  reputation: number;
  /** Personal liquid wealth, $M (separate from company equity). */
  personalCash: Money;
  /** Integrity score, 0–100 (decision L/M). Nudged by event choices; mostly a
   *  hidden risk meter in V1, deepened by scandals/activists in DLCs. */
  ethics: number;
}

/** Two-tier investor memory: a numeric score plus, for hand-crafted firms, an
 *  event history. Burning a firm colors future negotiations (decision G). */
export interface FirmRelationship {
  /** 0–100, 50 neutral. Feeds deal appetite in the next negotiation. */
  score: number;
  history: { week: number; note: string }[];
}

export const NEUTRAL_RELATIONSHIP = 50;

/** The player's company — the operating entity at the center of the board. */
export interface PlayerCompany {
  name: string;
  industry: Industry;
  subIndustry: SubIndustry;
  stage: Stage;
  foundedWeek: number;
  /** Brand color used across the UI for the player's company. */
  color: string;
  financials: {
    /** Cash in the bank, $M. */
    cash: Money;
    /** Annualized revenue, $M. */
    revenue: Money;
    /** Monthly net burn, $M (negative = profitable / cash-generative). */
    burnMonthly: Money;
    headcount: number;
    /** Latest post-money valuation, $M. */
    valuation: Money;
  };
  capTable: CapTable;
}

export type MacroPhase = "expansion" | "peak" | "contraction" | "trough" | "recovery";
export type IpoWindow = "open" | "cracking" | "closed";

/** The six master-variable engines' live state (three-layer world model). */
export interface WorldState {
  // ── Universal layer ──
  macroPhase: MacroPhase;
  /** Economic-cycle oscillator phase, radians. */
  macroPosition: number;
  /** Cycle strength, −1 (deep trough) … +1 (peak). */
  macroStrength: number;
  /** Policy interest rate, percent. */
  interestRate: number;
  /** Taylor-rule target the rate is moving toward. */
  rateTarget: number;
  weeksSinceRateReview: number;
  /** Risk appetite / animal spirits, 0–100. */
  marketSentiment: number;
  // ── Derived layer ──
  /** VC climate, 0–100. */
  vcClimate: number;
  ipoWindow: IpoWindow;
  /** Continuous IPO openness, 0–100 (mapped to the three states with hysteresis). */
  ipoOpenness: number;
  weeksInIpoWindow: number;
  /** Industry hype, 0–100, keyed by industry. */
  hype: Partial<Record<Industry, number>>;
}

/** A compact world sample for the World view's sparklines. */
export interface WorldSnapshot {
  week: number;
  macroStrength: number;
  interestRate: number;
  marketSentiment: number;
  vcClimate: number;
  ipoOpenness: number;
  hype: Partial<Record<Industry, number>>;
}

export interface GameClock {
  /** Weeks elapsed since founding. */
  week: number;
}

export interface GameMeta {
  schemaVersion: number;
  /** PRNG seed; world generation and rolls derive from it for determinism. */
  seed: number;
  /** Current PRNG generator state, carried in the save for deterministic ticks. */
  rngState: number;
  createdAt: string;
  /** Bumped whenever the player names/renames the run. */
  runName: string;
}

export interface GameState {
  meta: GameMeta;
  clock: GameClock;
  founder: FounderState;
  company: PlayerCompany;
  world: WorldState;
  /** The procedurally generated market — the long tail beyond the authored
   *  anchors. Generated once from the seed; the full market is anchors + these. */
  market: { companies: CompanyContent["company"][] };
  /** Recent world samples (capped ring) powering the World view's sparklines. */
  worldHistory: WorldSnapshot[];
  /** The world's running record — notable events shown in the narrative rail. */
  log: LogEntry[];
  /** Active, unacknowledged alerts surfaced as in-context decisions. */
  alerts: Alert[];
  /** Last runway band seen, so alerts fire on worsening rather than every week. */
  lastRunwayBand: RunwayBand;
  /** Net-worth milestones already crossed ($M), so each fires once. */
  achievedMilestones: number[];
  /** Per-firm relationship memory, keyed by firm id. */
  relationships: Record<string, FirmRelationship>;
  /** Cooldown / one-shot bookkeeping for the events engine. */
  eventState: EventState;
  /** The event currently awaiting the player's choice (blocks advance). */
  pendingEvent: ResolvedEvent | null;
}
