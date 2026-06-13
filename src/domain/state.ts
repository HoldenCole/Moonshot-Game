// The save game. Everything here is serializable; the engine mutates it only
// through pure functions so saves are deterministic given the seed.

import type { Industry, Stage, SubIndustry } from "./ids";
import type { CapTable, Money } from "./captable";

export const SCHEMA_VERSION = 1;

export interface FounderState {
  name: string;
  /** 0–100; persists across companies (the founder→magnate arc). */
  reputation: number;
  /** Personal liquid wealth, $M (separate from company equity). */
  personalCash: Money;
}

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

/** Master-variable "weather". Full engines arrive in Phase 5; for now these
 *  carry sensible defaults so downstream code can read them. */
export interface WorldState {
  macroPhase: "expansion" | "peak" | "contraction" | "trough" | "recovery";
  /** Policy interest rate, percent. */
  interestRate: number;
  /** VC climate, 0–100. */
  vcClimate: number;
  ipoWindow: "open" | "cracking" | "closed";
  /** Industry hype, 0–100, keyed by industry. */
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
}
