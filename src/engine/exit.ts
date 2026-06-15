// Exits — closing the arc (decision L). Two paths: a 3-act IPO (underwriter →
// pricing → first-day reveal, gated by the IPO window) and an acquisition
// (a procedural buyer's premium, which ends the run and seeds the next one).
// Pure + deterministic; the payout math reuses the cap-table waterfall.

import type { GameState, RunOutcome } from "@/domain/state";
import type { Industry } from "@/domain/ids";
import type { Money, RoundTerms } from "@/domain/captable";
import type { Bank } from "@/content/load";
import type { Company } from "@/content/load";
import { stageRank } from "@/domain/ids";
import { applyRound, exitWaterfall, founderOwnership, latestPostMoney } from "./captable";
import { type Rng, nextNoise, nextRange, pick } from "./rng";

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Post-IPO lockup before the founder can sell, ~180 days. */
export const LOCKUP_WEEKS = 26;

// ── IPO ──────────────────────────────────────────────────────────────────────

/** IPO is for grown companies in a live window. */
export function ipoEligible(state: GameState): boolean {
  return (
    state.company.stage !== "public" &&
    stageRank(state.company.stage) >= stageRank("series_b") &&
    latestPostMoney(state.company.capTable) >= 250 &&
    state.world.ipoWindow !== "closed"
  );
}

/** Banks that will underwrite this deal (meet their minimum raise, sector ok). */
export function eligibleBanks(banks: Bank[], state: GameState): Bank[] {
  const target = ipoTargetRaise(state);
  return banks
    .filter((b) => b.underwriting.available && target >= b.underwriting.min_raise)
    .filter((b) => b.underwriting.sectors.includes("all") || b.underwriting.sectors.includes(state.company.industry))
    .sort((a, b) => b.underwriting.prestige - a.underwriting.prestige);
}

/** Indicative primary raise (~12% of the company). */
export function ipoTargetRaise(state: GameState): Money {
  return Math.round(latestPostMoney(state.company.capTable) * 0.12);
}

export interface IpoPricing {
  fair: Money;
  low: Money;
  high: Money;
  demand: "soft" | "fair" | "strong";
}

/** The roadshow read: a fair value and a price range, shaped by the window,
 *  sector hype, and the bank's pricing quality. */
export function ipoPricing(state: GameState, bank: Bank): IpoPricing {
  const base = latestPostMoney(state.company.capTable);
  const hype = state.world.hype[state.company.industry] ?? 55;
  const windowMult = state.world.ipoWindow === "open" ? 1.12 : 0.86;
  const hypeMult = 1 + (hype - 60) / 100 * 0.6;
  const quality = bank.underwriting.pricing_quality / 100;
  const fair = Math.round(base * windowMult * hypeMult);
  const spread = 0.22 - quality * 0.1; // better banks → tighter book
  const demand = hype > 78 && state.world.ipoWindow === "open" ? "strong" : hype < 50 ? "soft" : "fair";
  return { fair, low: Math.round(fair * (1 - spread)), high: Math.round(fair * (1 + spread)), demand };
}

export interface IpoResult {
  bankName: string;
  raise: Money;
  pricedValuation: Money;
  firstDayPop: number; // fraction
  publicValuation: Money;
  founderStakeValue: Money;
}

/** Act 3 — price the book and reveal the first day. Pricing above fair risks a
 *  weak open; pricing below it pops (and leaves money on the table). */
export function revealIpo(state: GameState, bank: Bank, pricedValuation: Money, rng: Rng): IpoResult {
  const pricing = ipoPricing(state, bank);
  const raise = ipoTargetRaise(state);
  const mispriceVsFair = (pricing.fair - pricedValuation) / pricing.fair; // + = priced cheap
  const hype = state.world.hype[state.company.industry] ?? 55;
  const buzz = (hype - 60) / 100 * 0.25;
  const noise = nextRange(rng, -0.06, 0.06);
  const firstDayPop = clamp(mispriceVsFair * 0.8 + buzz + noise, -0.32, 0.7);
  const publicValuation = Math.round(pricedValuation * (1 + firstDayPop));

  // The primary raise prices in as new common at the IPO price.
  const after = applyRound(state.company.capTable, {
    terms: ipoTerms(pricedValuation, raise),
    stage: "public",
    week: state.clock.week,
    leadInvestorId: "public_markets",
    leadInvestorName: "Public Markets",
  });
  const founderStakeValue = founderOwnership(after) * publicValuation;

  return { bankName: bank.name, raise, pricedValuation, firstDayPop, publicValuation, founderStakeValue };
}

/** Commit the IPO: list public, mark the valuation, bank the primary raise. */
export function applyIpo(state: GameState, bank: Bank, result: IpoResult): GameState {
  const capTable = applyRound(state.company.capTable, {
    terms: ipoTerms(result.pricedValuation, result.raise),
    stage: "public",
    week: state.clock.week,
    leadInvestorId: "public_markets",
    leadInvestorName: "Public Markets",
  });
  void bank;
  return {
    ...state,
    company: {
      ...state.company,
      stage: "public",
      capTable,
      publicSince: state.clock.week,
      financials: {
        ...state.company.financials,
        cash: state.company.financials.cash + result.raise,
        valuation: result.publicValuation,
      },
    },
    founder: { ...state.founder, reputation: Math.min(100, state.founder.reputation + 12) },
  };
}

// ── Public company: a live, weekly-repriced stock + a lockup'd cash-out ───────

/** Re-rate a public company's market cap one week. A bounded weekly return
 *  tilted by sector hype and the macro cycle, plus per-week noise — so the stock
 *  actually moves, and timing the cash-out matters. Pure given the rng. */
export function repricePublic(prev: Money, world: GameState["world"], industry: Industry, rng: Rng): Money {
  const hype = world.hype[industry] ?? 55;
  const hypeTilt = ((hype - 58) / 100) * 0.012;
  const macroTilt = world.macroStrength * 0.004;
  const ret = clamp(hypeTilt + macroTilt + nextNoise(rng, 0.018), -0.07, 0.07);
  return Math.max(1, Math.round(prev * (1 + ret)));
}

/** Weeks until the founder's shares unlock (0 once tradeable; Infinity if not public). */
export function weeksToUnlock(state: GameState): number {
  if (state.company.stage !== "public" || state.company.publicSince == null) return Infinity;
  return Math.max(0, state.company.publicSince + LOCKUP_WEEKS - state.clock.week);
}

export function lockupExpired(state: GameState): boolean {
  return state.company.stage === "public" && weeksToUnlock(state) === 0;
}

/** What the founder would walk away with by selling their whole public stake. */
export function cashOutProceeds(state: GameState): Money {
  return founderOwnership(state.company.capTable) * state.company.financials.valuation;
}

/** Sell the public stake: bank the proceeds and end the run. */
export function applyCashOut(state: GameState): { state: GameState; outcome: RunOutcome } {
  const proceeds = cashOutProceeds(state);
  const personalCash = state.founder.personalCash + proceeds;
  const outcome: RunOutcome = {
    kind: "ipo",
    company: state.company.name,
    exitValue: state.company.financials.valuation,
    founderProceeds: proceeds,
    finalNetWorth: personalCash,
    week: state.clock.week,
    headline: `You cashed out of ${state.company.name} at ${state.company.financials.valuation}`,
  };
  return {
    state: { ...state, founder: { ...state.founder, personalCash } },
    outcome,
  };
}

function ipoTerms(valuation: Money, raise: Money): RoundTerms {
  return { valuation, roundSize: raise, liquidationPref: 0, participating: false, boardSeats: 0, optionPoolPct: 0 };
}

// ── Acquisition ──────────────────────────────────────────────────────────────

export interface AcquisitionOffer {
  buyerName: string;
  exitValue: Money;
  premiumPct: number;
  /** What the founder personally walks away with, $M (after the waterfall). */
  founderTake: Money;
}

/** A procedural buyer's offer — a premium to the current mark, scaled by the
 *  market mood. */
export function acquisitionOffer(state: GameState, market: Company[], rng: Rng): AcquisitionOffer {
  const base = Math.max(latestPostMoney(state.company.capTable), state.company.financials.valuation, 5);
  const climateMult = 0.85 + (state.world.vcClimate / 100) * 0.5;
  const premium = nextRange(rng, 0.1, 0.6) * climateMult;
  const exitValue = Math.round(base * (1 + premium));

  // A plausible strategic buyer: a larger public company, ideally same sector.
  const ind = state.company.industry;
  const buyers = market
    .filter((c) => c.stage.status === "public" && c.financials.valuation > exitValue * 1.5)
    .sort((a, b) => (a.industry === ind ? 0 : 1) - (b.industry === ind ? 0 : 1));
  const buyer = pick(rng, buyers.length ? buyers : market) ?? { name: "a strategic acquirer" };

  const founderTake = founderTakeAt(state, exitValue);
  return { buyerName: buyer.name, exitValue, premiumPct: premium, founderTake };
}

/** The founder + co-founder proceeds at a given exit value, via the waterfall. */
export function founderTakeAt(state: GameState, exitValue: Money): Money {
  return exitWaterfall(state.company.capTable, exitValue)
    .filter((r) => r.holderType === "founder" || r.holderType === "cofounder")
    .reduce((s, r) => s + r.payout, 0);
}

/** Accept an acquisition: bank the founder's proceeds as personal wealth and
 *  end the run. */
export function applyAcquisition(state: GameState, offer: AcquisitionOffer): { state: GameState; outcome: RunOutcome } {
  const proceeds = offer.founderTake;
  const personalCash = state.founder.personalCash + proceeds;
  const outcome: RunOutcome = {
    kind: "acquisition",
    company: state.company.name,
    exitValue: offer.exitValue,
    founderProceeds: proceeds,
    finalNetWorth: personalCash,
    week: state.clock.week,
    headline: `${offer.buyerName} acquired ${state.company.name} for ${offer.exitValue}`,
  };
  return {
    state: {
      ...state,
      founder: { ...state.founder, personalCash, reputation: Math.min(100, state.founder.reputation + 8) },
    },
    outcome,
  };
}

/** Is a sale worth exploring? (Always available once you've raised.) */
export function canExplore(state: GameState): boolean {
  return latestPostMoney(state.company.capTable) > 0;
}

/** Random-ish first-day descriptor for the reveal copy. */
export function firstDayWord(pop: number): string {
  if (pop > 0.25) return "soars";
  if (pop > 0.05) return "pops";
  if (pop > -0.05) return "holds steady";
  return "slides";
}
