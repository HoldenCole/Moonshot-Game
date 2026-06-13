// The fundraising negotiation model — the second hero feature.
//
// A negotiation is a 3-round exchange of term sheets. The player proposes the
// five V1 terms; the investor evaluates them against what its five hidden
// personality axes want, and either accepts, counters, or walks. Reactions are
// soft, qualitative signals — never shown probabilities (decision G).

import type { RoundTerms } from "./captable";
import type { Industry, Stage, SubIndustry } from "./ids";

/** Investor counterparties. Only "firm" is live in V1, but the negotiation
 *  engine is written against this union so angel and the player's own capital
 *  ("self") slot in later without rework (roadmap extension point 1). */
export type InvestorType = "firm" | "self" | "angel";

/** The negotiable terms, by key — the five V1 levers (participation is a Mogul
 *  term and stays non-participating here). */
export type TermKey = "valuation" | "roundSize" | "liquidationPref" | "boardSeats" | "optionPoolPct";

export const NEGOTIABLE_TERMS: TermKey[] = [
  "valuation",
  "roundSize",
  "liquidationPref",
  "boardSeats",
  "optionPoolPct",
];

/** A content/runtime-agnostic view of an investor for the negotiation engine. */
export interface InvestorAgent {
  id: string;
  name: string;
  type: InvestorType;
  partnerName: string;
  reputation: number;
  traitTags: string[];
  thesis: string;
  personality: {
    aggression: number;
    patience: number;
    conviction: number;
    founderFriendliness: number;
    networkStrength: number;
  };
  focus: {
    primarySector: Industry;
    secondarySector?: Industry;
    primaryStage: Stage;
    stageRange: [Stage, Stage];
    stretchTolerance: number;
  };
  fund: { checkMin: number; checkMax: number };
}

export type ReactionSignal = "warm" | "receptive" | "pushing" | "cool" | "walking";

export type TermStance = "loves" | "fine" | "pushing" | "dealbreaker";

export interface TermReaction {
  term: TermKey;
  stance: TermStance;
}

export type NegotiationDecision = "accept" | "counter" | "walk";

/** The investor's read on one proposal. `satisfaction` is hidden from the UI —
 *  only the qualitative `signal`, `line`, and per-term stances are shown. */
export interface InvestorEvaluation {
  /** Hidden 0–1; exposed for tests/tuning, never rendered as a number. */
  satisfaction: number;
  appetite: number;
  signal: ReactionSignal;
  line: string;
  termReactions: TermReaction[];
  decision: NegotiationDecision;
  /** Investor's counter terms when `decision === "counter"`. */
  counter?: RoundTerms;
}

export type NegotiationStatus = "active" | "agreed" | "walked" | "exhausted";

export interface NegotiationRoundRecord {
  round: number;
  playerTerms: RoundTerms;
  evaluation: InvestorEvaluation;
}

export interface NegotiationState {
  agentId: string;
  agentName: string;
  partnerName: string;
  stage: Stage;
  round: number;
  maxRounds: number;
  status: NegotiationStatus;
  history: NegotiationRoundRecord[];
  /** Investor's latest counter (terms the player can accept outright). */
  currentCounter?: RoundTerms;
  /** Terms the investor accepted (when the player's offer was good enough). */
  agreedTerms?: RoundTerms;
  /** Rare "Hot Deal" leverage — a competing firm is circling (decision G). */
  competingInterest?: { firmName: string };
}

/** Everything the pure engine needs to evaluate a proposal. */
export interface NegotiationContext {
  stage: Stage;
  industry: Industry;
  subIndustry: SubIndustry;
  hype: number;
  vcClimate: number;
  week: number;
  /** Market-baseline terms for the stage (the negotiation's center of gravity). */
  market: RoundTerms;
  /** Player↔firm relationship, 0–100 (50 neutral). */
  relationshipScore: number;
  /** Save seed, for the deterministic Hot-Deal gate. */
  seed: number;
}
