// The cap table — the hero feature's core data model.
//
// Units: monetary values are $ millions ("Money"); share counts are absolute
// integers; price-per-share is in whole dollars. The model is a flat list of
// share lots plus the rounds that created them, so every derived view
// (ownership %, dilution history, exit waterfall) is a pure function of it.

import type { Stage } from "./ids";

/** Dollars, in millions. The whole engine speaks $M to keep valuations and
 *  check sizes in the same unit; format at the edges. */
export type Money = number;

export type ShareClass = "common" | "preferred";

export type HolderType =
  | "founder"
  | "cofounder"
  | "investor"
  | "self" // architected from day one; self-investing is a post-V1 feature
  | "pool"
  | "employee";

/** A single block of shares with a uniform class, price, and origin round.
 *  Aggregations group these by holder; the waterfall walks them by class. */
export interface ShareLot {
  id: string;
  holderId: string;
  holderName: string;
  holderType: HolderType;
  shareClass: ShareClass;
  shares: number;
  /** Cash paid for this lot, $M (0 for founder common and the option pool). */
  investedAmount: Money;
  /** Issue price per share, in whole dollars. */
  pricePerShare: number;
  /** Id of the round that created this lot ("founding" for the initial grant). */
  roundId: string;
  // Preferred-only economics (ignored for common):
  /** Liquidation preference multiple, e.g. 1 = 1×. 0 for common. */
  liquidationPref: number;
  /** Participating preferred also shares in the common pool after its pref. */
  participating: boolean;
}

/** The negotiated terms of a priced round — the five V1 levers. */
export interface RoundTerms {
  /** Pre-money valuation, $M. */
  valuation: Money;
  /** Amount raised, $M. */
  roundSize: Money;
  /** Liquidation preference multiple on the new preferred (1 = 1×). */
  liquidationPref: number;
  /** Whether the new preferred participates after its preference. */
  participating: boolean;
  /** Board seats granted to investors in this round. */
  boardSeats: number;
  /** Target option pool as a fraction of post-money fully-diluted (0–1),
   *  topped up pre-money so existing holders absorb the dilution. */
  optionPoolPct: number;
}

export interface Round {
  id: string;
  name: string;
  stage: Stage;
  /** Game-clock week at close. */
  closedWeek: number;
  preMoney: Money;
  amountRaised: Money;
  postMoney: Money;
  pricePerShare: number;
  /** Realised post-money option pool fraction after the top-up. */
  optionPoolPctPost: number;
  leadInvestorId?: string;
  leadInvestorName?: string;
  terms: RoundTerms;
}

export interface CapTable {
  lots: ShareLot[];
  rounds: Round[];
}

// ── Derived views (computed by engine selectors, not stored) ─────────────────

/** One row of the aggregated ownership table — a holder's combined position. */
export interface OwnershipRow {
  holderId: string;
  holderName: string;
  holderType: HolderType;
  shares: number;
  /** Ownership as a fraction of fully-diluted shares (0–1). */
  ownership: number;
  shareClass: ShareClass | "mixed";
  investedAmount: Money;
  /** Holder's stake valued at the latest round's post-money, $M. */
  currentValue: Money;
}

/** A point on the round-history dilution/value chart. */
export interface RoundHistoryPoint {
  roundId: string;
  roundName: string;
  stage: Stage;
  postMoney: Money;
  pricePerShare: number;
  /** Founder ownership immediately after this round (0–1). */
  founderOwnershipAfter: number;
  /** Founder stake value immediately after this round, $M. */
  founderValueAfter: Money;
}

/** One holder's payout in an exit-scenario waterfall. */
export interface PayoutRow {
  holderId: string;
  holderName: string;
  holderType: HolderType;
  /** Total proceeds to this holder at the modeled exit value, $M. */
  payout: Money;
  /** Whether preferred took its liquidation preference (vs. converting). */
  tookPreference: boolean;
  /** Multiple on invested capital (payout / invested), undefined if nothing in. */
  multipleOnInvested?: number;
}
