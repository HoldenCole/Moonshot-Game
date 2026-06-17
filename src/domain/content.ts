// Typed views over the hand-authored TOML content in `content/`.
// These mirror the on-disk schema 1:1 (see the entity_*.md authoring docs).
// All monetary fields are in $ millions unless noted.

import type { Industry, Stage, SubIndustry } from "./ids";

export type Tier = "anchor" | "procedural";
export type EventTone =
  | "opportunity"
  | "threat"
  | "crisis"
  | "neutral";
export type TriggerType = "random" | "threshold" | "scheduled";

// ── Companies ──────────────────────────────────────────────────────────────

export interface CompanyContent {
  company: {
    id: string;
    name: string;
    tier: Tier;
    industry: Industry;
    sub_industry: SubIndustry;
    /** Years relative to game start (negative = founded in the past). */
    founded_year: number;
    hq: string;
    color: string;
    logo_glyph: string;
    identity: {
      tagline: string;
      reputation: number;
      narrative_hooks: string[];
    };
    stage: {
      status: "private" | "public";
      private_round: string;
      ipo_year: number;
    };
    financials: {
      revenue: number;
      revenue_growth: number;
      gross_margin: number;
      profitable: boolean;
      /** Omitted by light/investment-grade anchors (derived in worldgen). */
      burn_monthly?: number;
      valuation: number;
      shares_out: number;
    };
    quality: {
      fundamentals: number;
      hype_exposure: number;
      moat: number;
      execution: number;
    };
    // Investment-grade (light) companies omit the signature block.
    signature?: {
      benchmark_score: number;
      signature_notes: string;
    };
    // Light/investment-only companies (the "light attribute set") carry only
    // `investors`; full competitor-grade companies carry all four edge lists.
    relationships: {
      competitors?: string[];
      suppliers?: string[];
      customers?: string[];
      investors: string[];
    };
  };
}

// ── Investors (VC firms) ─────────────────────────────────────────────────────

export interface InvestorContent {
  firm: {
    id: string;
    name: string;
    tier: Tier;
    partner_name: string;
    partner_title?: string;
    hq: string;
    color?: string;
    logo_glyph?: string;
    identity: {
      thesis: string;
      reputation: number;
      trait_tags: string[];
      narrative_hooks?: string[];
    };
    /** Five hidden axes, 1–100, that drive negotiation counter-logic. */
    personality: {
      aggression: number;
      patience: number;
      conviction: number;
      founder_friendliness: number;
      network_strength: number;
    };
    focus: {
      primary_sector: Industry;
      secondary_sector?: Industry;
      primary_stage: Stage;
      stage_range: [Stage, Stage];
      stretch_tolerance: number;
    };
    fund: {
      fund_name: string;
      fund_size: number;
      vintage_year: number;
      deployment_years: number;
      check_min: number;
      check_max: number;
    };
    relationships?: {
      signature_portfolio?: string[];
      rival_firms?: string[];
    };
  };
}

// ── Banks ───────────────────────────────────────────────────────────────────

export interface BankContent {
  bank: {
    id: string;
    name: string;
    tier: Tier;
    founded_year: number;
    hq: string;
    color: string;
    identity: {
      tagline: string;
      trait_tags: string[];
      narrative_hooks: string[];
    };
    underwriting: {
      available: boolean;
      prestige: number;
      pricing_quality: number;
      fee_pct: number;
      min_raise: number;
      selectivity: number;
      sectors: string[];
    };
    debt: {
      offers_debt: boolean;
      max_loan_multiple: number;
      base_rate_spread: number;
      covenant_strictness: number;
      prefers_profitable: boolean;
    };
    financials: {
      status: "private" | "public";
      revenue: number;
      valuation: number;
      fundamentals: number;
      hype_exposure: number;
    };
  };
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface EventChoice {
  label: string;
  detail: string;
  effects: string;
  outcome_ref: string;
  /** Optional gate — the choice is hidden when this condition is false. */
  condition?: string;
}

export interface EventContent {
  id: string;
  category: string;
  weight: number;
  cooldown_weeks: number;
  one_shot: boolean;
  trigger: {
    type: TriggerType;
    conditions: string[];
    weight_mods?: { when: string; factor: number }[];
  };
  framing: {
    headline: string;
    body: string;
    tone: EventTone;
  };
  choices: EventChoice[];
}

/** Event TOML files are keyed tables (one table per event); the loader
 *  flattens them into a list. */
export type EventFile = Record<string, EventContent>;

// ── Founder archetypes ───────────────────────────────────────────────────────

/** Deltas/multipliers applied in createNewGame over the difficulty baselines. */
export interface FounderModifiers {
  starting_reputation: number;
  starting_cash_mult: number;
  investor_warmth: number;
  integrity_baseline: number;
  signature_lean: number;
  exec_quality_floor: number;
  /** Names the one system this founder is nudged toward (tooltip + future hooks). */
  sub_system_lean: string;
}

export interface FounderContent {
  id: string;
  name: string;
  blurb: string;
  playstyle_hint: string;
  modifiers: FounderModifiers;
}

/** founders.toml is one keyed table per archetype; the loader flattens it. */
export type FounderFile = Record<string, FounderContent>;

// ── Guided first-run tutorial ────────────────────────────────────────────────

export type GuidedPlacement = "top" | "bottom" | "left" | "right" | "center";

/** One coachmark beat in the guided first-run script. */
export interface TutorialStep {
  id: string;
  order: number;
  /** `data-guide` value of the element this beat points at. */
  anchor: string;
  placement: GuidedPlacement;
  title: string;
  body: string;
  /** "ack" (player taps Got it) or "action:<evt>" (player performs the action). */
  advance_on: string;
  allow_skip: boolean;
  /** Gate string evaluated against the guided context (e.g. "screen == dashboard"). */
  gate: string;
  hint_fallback: string;
}

/** What happens once the guided run ends — hand the player to ambient hints. */
export interface TutorialHandoff {
  enable_hint_system: boolean;
  first_hints: string[];
  completion_flag: string;
  replayable_from: string;
}

export interface TutorialScript {
  id: string;
  version: number;
  title: string;
  skippable_global: boolean;
  resumable: boolean;
  intro_line: string;
  steps: TutorialStep[];
  handoff: TutorialHandoff;
}

/** first_run.toml wraps the script under a single `[tutorial]` table. */
export interface TutorialFile {
  tutorial: TutorialScript;
}

// ── Products / R&D / Capacity (the depth system) ─────────────────────────────
// Four content shapes, one set of files per playable sub-industry. R&D lines
// accumulate tech levels that gate product archetypes; products are bets that
// consume capacity; per-industry tuning shapes the economics. (See doc 07.)

/** A free-form quality dimension, consistent within a sub-industry. */
export type SpecTag = string;

/** content/rd_lines/<sub>.toml — keyed tables, one per line. */
export interface RDLine {
  id: string;
  sub_industry: SubIndustry;
  name: string;
  description: string;
  icon?: string;
  /** Tech level the line starts at (0–100+). */
  starting_level: number;
  /** $M anchor cost to advance ~1 level/quarter at low levels. */
  base_cost_per_quarter: number;
  /** The spec tags this line feeds into product quality. */
  drives_specs: SpecTag[];
}

/** content/products/<sub>.toml — keyed tables, one per archetype. */
export interface ProductArchetype {
  id: string;
  sub_industry: SubIndustry;
  name: string;
  /** Tier 1..N, contiguous within a sub-industry. */
  tier: number;
  description: string;
  flavor_naming_hint?: string;
  /** Required tech level per R&D line id (gates creation). */
  gates: Record<string, number>;
  economics: {
    build_cost: number; // $M, one-time bet cost
    build_weeks: number; // bet duration
    unit_margin: number; // 0–1 gross margin at launch
    capacity_type: string; // capacity id in the same sub-industry
    capacity_to_build: number; // units tied up DURING the bet
    capacity_to_run: number; // units a shipped product occupies while live
    addressable_market: number; // $M/yr ceiling for the product class
    ramp_weeks: number; // ship → peak revenue
    decay_per_quarter: number; // obsolescence rate once mature
  };
  /** Weights mapping spec tags → quality; sum ≈ 1.0. */
  specs: Record<SpecTag, number>;
}

export interface CapacityRung {
  capacity: number; // delta added to owned capacity when built
  cost: number; // $M
  build_weeks: number;
}

/** content/capacity/<sub>.toml — keyed tables, one per capacity type. */
export interface CapacityType {
  id: string;
  sub_industry: SubIndustry;
  name: string;
  unit_label: string;
  description: string;
  /** ≥6 rungs, monotonic — so capacity never caps out. */
  rungs: CapacityRung[];
}

/** content/products/_tuning.toml — one block per sub-industry (table key = sub). */
export interface ProductTuning {
  starting_capacity: number;
  rd_diminishing_k: number; // 0–1; higher = harsher diminishing returns
  frontier_pull: number; // ≥1; R&D catch-up bonus when behind the frontier
  max_concurrent_bets: number;
  build_cost_mult: number;
  build_time_mult: number;
  decay_mult: number;
  share_volatility: number; // how fast share can swing vs. rivals
}

/** Keyed-table TOML files (one table per entity). */
export type RDLineFile = Record<string, RDLine>;
export type ProductFile = Record<string, ProductArchetype>;
export type CapacityFile = Record<string, CapacityType>;
/** _tuning.toml: one table per sub-industry. */
export type ProductTuningFile = Record<string, ProductTuning>;
