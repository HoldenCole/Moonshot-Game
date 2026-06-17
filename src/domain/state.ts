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
  /** Chosen founder archetype id (flavor + the tilts below), or "custom". */
  archetype?: string;
  /** Founder age — cosmetic in V1 (seeds the lifespan clock in mortal/Dynasty mode). */
  age?: number;
  /** Persistent founder tilts from the archetype. Warmth seeds every
   *  negotiation; the lean boosts the signature mechanic; the floor lifts hires. */
  investorWarmth?: number;
  signatureLean?: number;
  execQualityFloor?: number;
}

/** Two-tier investor memory: a numeric score plus, for hand-crafted firms, an
 *  event history. Burning a firm colors future negotiations (decision G). */
export interface FirmRelationship {
  /** 0–100, 50 neutral. Feeds deal appetite in the next negotiation. */
  score: number;
  history: { week: number; note: string }[];
}

export const NEUTRAL_RELATIONSHIP = 50;

/** The sub-industry signature process (Phase 9): a commit→anticipate→resolve
 *  loop that gives the player something to advance toward. */
export interface SignatureState {
  status: "idle" | "running" | "resolved";
  /** Process noun, e.g. "training run", "launch", "fab tape-out". */
  noun: string;
  /** Display name, e.g. "Helion-3 training run". */
  name: string;
  metricLabel: string;
  startWeek: number;
  endWeek: number;
  /** Cash committed to the current process, $M. */
  committed: Money;
  /** The chosen approach id for the running process (e.g. "frontier", "aggressive"). */
  approach?: string;
  lastOutcome?: { kind: "success" | "partial" | "failure"; summary: string; week: number };
}

/** A drawn debt facility (non-dilutive capital). Interest services weekly; the
 *  principal is a balloon due at maturity. Rate is fixed at origination. */
export interface Loan {
  id: string;
  /** Lending bank id + display name (the same roster that underwrites IPOs). */
  lenderId: string;
  lenderName: string;
  /** Outstanding principal, $M. */
  principal: Money;
  /** Annual rate, percent, locked when the loan was drawn. */
  rateAnnual: number;
  startWeek: number;
  /** Weeks from `startWeek` to maturity. */
  termWeeks: number;
  /** Set once a matured loan couldn't be repaid (accrues at a penalty rate). */
  overdue?: boolean;
}

/** The four delegatable operating areas (Phase 9 light delegation). */
export type ExecArea = "finance" | "operations" | "revenue" | "technical";

/** Per-area autonomy: surface to me / surface with a rec / let the exec handle it.
 *  "Handle it" is what makes hands-off cadence viable (delegation = auto-decisions). */
export type Autonomy = "decide" | "recommend" | "handle";

export interface Exec {
  name: string;
  role: string;
  area: ExecArea;
  /** 0–100; higher execs handle delegated areas better. */
  quality: number;
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
  /** Invested compute / facilities capacity (Operations). Raises execution on
   *  the signature mechanic; absent until you invest. */
  capacity?: number;
  /** Outstanding debt facilities (non-dilutive financing); absent until drawn. */
  loans?: Loan[];
  /** The sub-industry signature process. */
  signature: SignatureState;
  /** Persistent quantities the signature mechanic builds up — keyed per
   *  sub-industry (flight heritage, satellites live, station occupancy, moat
   *  depth). Absent until the first process resolves. */
  signatureStats?: Record<string, number>;
  /** Hired executives by area (empty until you delegate). */
  executives: Partial<Record<ExecArea, Exec>>;
  /** Autonomy setting per area. */
  delegation: Record<ExecArea, Autonomy>;
  /** Week the company went public (set at IPO); drives the post-IPO lockup. */
  publicSince?: number;
  /** Public-company earnings-management state (set at IPO). */
  earnings?: { gap: number; guidance: GuidanceStance };
}

/** The bar a public company sets itself for the next quarter. */
export type GuidanceStance = "sandbagged" | "inline" | "stretched";

export type MacroPhase = "expansion" | "peak" | "contraction" | "trough" | "recovery";
/** The macro phase plus a "frothy" overlay (euphoric sentiment / hot VC climate),
 *  used as the market regime the event system reads. */
export type MacroRegime = MacroPhase | "frothy";
export type IpoWindow = "open" | "cracking" | "closed";

/** The six master-variable engines' live state (three-layer world model). */
export interface WorldState {
  // ── Universal layer ──
  macroPhase: MacroPhase;
  /** Weeks the current market regime (phase incl. "frothy") has held — 0 on the
   *  transition tick. Gives regime-transition events a short, reliable window. */
  weeksInPhase: number;
  /** The regime that preceded the current one (for "recovery out of contraction"
   *  style triggers). */
  macroPrevPhase: MacroRegime;
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

/** The outcome that ends a run (acquisition, a stock-swap merger, or a chosen
 *  post-IPO cash-out). */
export interface RunOutcome {
  kind: "ipo" | "acquisition" | "merger";
  company: string;
  exitValue: Money;
  founderProceeds: Money;
  finalNetWorth: Money;
  week: number;
  headline: string;
  /** A stock-swap "step back": the stake the founder holds in the acquirer. */
  stake?: { company: string; pct: number; value: Money };
}

/** Locked-at-start difficulty: a preset (or "custom" once a slider moves), the
 *  authoritative tunable axes, and a separate News Cycle for UI transparency. */
export type DifficultyPreset = "forgiving" | "realistic" | "brutal";
export type NewsCycle = "easy" | "medium" | "hard";
/** Each axis is a multiplier; 1.0 is the baseline (Realistic). Presets pre-fill
 *  these; the Advanced sliders edit them directly. */
export interface DifficultyAxes {
  /** World swing — volatility + shock frequency. */
  volatility: number;
  /** How fast the macro cycle turns over. */
  cycleSpeed: number;
  /** How generously rounds price. */
  capitalClimate: number;
  /** Founder's opening capital. */
  startingCapital: number;
  /** Opening monthly burn. */
  burnRate: number;
  /** How hard the bad side of an event outcome bites. */
  eventSeverity: number;
}
export interface Difficulty {
  preset: DifficultyPreset | "custom";
  newsCycle: NewsCycle;
  axes: DifficultyAxes;
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
  /** Difficulty chosen at founding; locked for the run. */
  difficulty: Difficulty;
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
  /** Set when the run has ended (drives the between-companies screen). */
  runOutcome: RunOutcome | null;
  /** Unlocked achievement ids (persist across the run). */
  achievements: string[];
}
