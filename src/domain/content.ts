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
