// Cap-table engine — pure functions over the CapTable model.
//
// Conventions:
//   • money is $M; shares are absolute integers; price-per-share is dollars
//   • ids are derived (never random) so a save reconstructs identically
//   • every public function is a pure transform or selector — no I/O, no Date

import type {
  CapTable,
  Money,
  OwnershipRow,
  PayoutRow,
  Round,
  RoundHistoryPoint,
  RoundTerms,
  ShareClass,
  ShareLot,
} from "@/domain/captable";
import type { Stage } from "@/domain/ids";
import { stageRoundName } from "@/domain/ids";

/** Default total shares issued to founders at incorporation. A round, ground
 *  number that keeps later per-share prices legible. */
export const FOUNDING_SHARES = 10_000_000;

export const OPTION_POOL_HOLDER_ID = "option_pool";

const EPSILON = 1e-6;

// ── Construction ─────────────────────────────────────────────────────────────

export interface FoundingParams {
  founderId: string;
  founderName: string;
  /** Total founding shares (split with a co-founder if provided). */
  totalShares?: number;
  cofounder?: { id: string; name: string; sharePct: number };
  week: number;
  foundingStage?: Stage;
}

/** Create the genesis cap table: founder common (optionally split with a
 *  co-founder), and a "founding" round record at 100% founder ownership. */
export function foundCompany(params: FoundingParams): CapTable {
  const total = params.totalShares ?? FOUNDING_SHARES;
  const stage = params.foundingStage ?? "idea";
  const lots: ShareLot[] = [];

  const cofounderShares = params.cofounder
    ? Math.round(total * clamp01(params.cofounder.sharePct))
    : 0;
  const founderShares = total - cofounderShares;

  lots.push(
    commonLot({
      id: `founding:${params.founderId}`,
      holderId: params.founderId,
      holderName: params.founderName,
      holderType: "founder",
      shares: founderShares,
      roundId: "founding",
    }),
  );

  if (params.cofounder && cofounderShares > 0) {
    lots.push(
      commonLot({
        id: `founding:${params.cofounder.id}`,
        holderId: params.cofounder.id,
        holderName: params.cofounder.name,
        holderType: "cofounder",
        shares: cofounderShares,
        roundId: "founding",
      }),
    );
  }

  const founding: Round = {
    id: "founding",
    name: "Founding",
    stage,
    closedWeek: params.week,
    preMoney: 0,
    amountRaised: 0,
    postMoney: 0,
    pricePerShare: 0,
    optionPoolPctPost: 0,
    terms: {
      valuation: 0,
      roundSize: 0,
      liquidationPref: 0,
      participating: false,
      boardSeats: 0,
      optionPoolPct: 0,
    },
  };

  return { lots, rounds: [founding] };
}

// ── Applying a priced round ──────────────────────────────────────────────────

export interface RoundParams {
  terms: RoundTerms;
  stage: Stage;
  week: number;
  leadInvestorId: string;
  leadInvestorName: string;
  roundName?: string;
}

export interface RoundComputation {
  preMoney: Money;
  postMoney: Money;
  investorShares: number;
  investorOwnership: number;
  pricePerShare: number;
  /** Net new pool shares created in the pre-money top-up. */
  poolIncrease: number;
  optionPoolPctPost: number;
  /** Total fully-diluted shares after the round. */
  postShares: number;
}

/** Pure preview of a round's effect — the math the live cap-table preview and
 *  the apply step both use. Models the standard *pre-money* option pool: the
 *  pool top-up is created before the new money, so existing holders (not the
 *  new investor) absorb its dilution. */
export function computeRound(capTable: CapTable, terms: RoundTerms): RoundComputation {
  const existingShares = totalShares(capTable);
  const existingPool = poolShares(capTable);
  const nonPool = existingShares - existingPool;

  const pre = Math.max(0, terms.valuation);
  const inv = Math.max(0, terms.roundSize);
  const post = pre + inv;

  // Keep the dilution math well-posed: the new money + pool top-up cannot take
  // ≥100% of the company. A degenerate valuation (≤0) would otherwise fabricate
  // ownership; realistic negotiated terms never approach this cap.
  const poolPct = Math.min(0.9, clamp01(terms.optionPoolPct));
  const rawInvestorOwnership = post > 0 ? inv / post : 0;
  const investorOwnership = Math.min(rawInvestorOwnership, Math.max(0, 0.97 - poolPct));

  // T·(1 − investorPct − poolPct) = nonPool   ⇒   solve for post-round total T.
  const denom = 1 - investorOwnership - poolPct;
  const postShares = denom > EPSILON ? nonPool / denom : existingShares;

  const investorShares = investorOwnership * postShares;
  const newPoolTotal = poolPct * postShares;
  const poolIncrease = Math.max(0, newPoolTotal - existingPool);

  // inv is $M; convert to dollars for a per-share price.
  const pricePerShare = investorShares > EPSILON ? (inv * 1_000_000) / investorShares : 0;
  const optionPoolPctPost = postShares > 0 ? newPoolTotal / postShares : 0;

  return {
    preMoney: pre,
    postMoney: post,
    investorShares,
    investorOwnership,
    pricePerShare,
    poolIncrease,
    optionPoolPctPost,
    postShares,
  };
}

/** Apply a priced round, returning a new cap table (does not mutate input). */
export function applyRound(capTable: CapTable, params: RoundParams): CapTable {
  const c = computeRound(capTable, params.terms);
  const stage = params.stage;
  const roundId = `round:${capTable.rounds.length}`;
  const name = params.roundName ?? stageRoundName(stage);

  const lots = capTable.lots.slice();

  lots.push({
    id: `${roundId}:${params.leadInvestorId}`,
    holderId: params.leadInvestorId,
    holderName: params.leadInvestorName,
    holderType: "investor",
    // A zero-preference raise (the IPO public float) is common, not preferred.
    shareClass: params.terms.liquidationPref > 0 ? "preferred" : "common",
    shares: Math.round(c.investorShares),
    investedAmount: params.terms.roundSize,
    pricePerShare: c.pricePerShare,
    roundId,
    liquidationPref: params.terms.liquidationPref,
    participating: params.terms.participating,
  });

  if (c.poolIncrease > 0.5) {
    lots.push(
      commonLot({
        id: `${roundId}:${OPTION_POOL_HOLDER_ID}`,
        holderId: OPTION_POOL_HOLDER_ID,
        holderName: "Option Pool",
        holderType: "pool",
        shares: Math.round(c.poolIncrease),
        roundId,
        pricePerShare: c.pricePerShare,
      }),
    );
  }

  const round: Round = {
    id: roundId,
    name,
    stage,
    closedWeek: params.week,
    preMoney: c.preMoney,
    amountRaised: params.terms.roundSize,
    postMoney: c.postMoney,
    pricePerShare: c.pricePerShare,
    optionPoolPctPost: c.optionPoolPctPost,
    leadInvestorId: params.leadInvestorId,
    leadInvestorName: params.leadInvestorName,
    terms: params.terms,
  };

  return { lots, rounds: [...capTable.rounds, round] };
}

// ── Selectors ────────────────────────────────────────────────────────────────

export function totalShares(capTable: CapTable): number {
  return sum(capTable.lots.map((l) => l.shares));
}

export function poolShares(capTable: CapTable): number {
  return sum(capTable.lots.filter((l) => l.holderType === "pool").map((l) => l.shares));
}

export function latestPostMoney(capTable: CapTable): Money {
  const priced = capTable.rounds.filter((r) => r.postMoney > 0);
  return priced.length ? priced[priced.length - 1]!.postMoney : 0;
}

/** Aggregate lots into per-holder ownership rows, sorted by stake descending.
 *  `valuation` defaults to the latest post-money for current-value math. */
export function ownership(capTable: CapTable, valuation?: Money): OwnershipRow[] {
  const total = totalShares(capTable);
  const value = valuation ?? latestPostMoney(capTable);

  const byHolder = new Map<string, OwnershipRow & { classes: Set<ShareClass> }>();
  for (const lot of capTable.lots) {
    let row = byHolder.get(lot.holderId);
    if (!row) {
      row = {
        holderId: lot.holderId,
        holderName: lot.holderName,
        holderType: lot.holderType,
        shares: 0,
        ownership: 0,
        shareClass: lot.shareClass,
        investedAmount: 0,
        currentValue: 0,
        classes: new Set<ShareClass>(),
      };
      byHolder.set(lot.holderId, row);
    }
    row.shares += lot.shares;
    row.investedAmount += lot.investedAmount;
    row.classes.add(lot.shareClass);
  }

  const rows: OwnershipRow[] = [];
  for (const row of byHolder.values()) {
    const frac = total > 0 ? row.shares / total : 0;
    rows.push({
      holderId: row.holderId,
      holderName: row.holderName,
      holderType: row.holderType,
      shares: row.shares,
      ownership: frac,
      shareClass: row.classes.size > 1 ? "mixed" : [...row.classes][0]!,
      investedAmount: row.investedAmount,
      currentValue: frac * value,
    });
  }

  return rows.sort((a, b) => b.shares - a.shares);
}

/** Founder + co-founder combined ownership fraction (0–1). */
export function founderOwnership(capTable: CapTable): number {
  const total = totalShares(capTable);
  if (total <= 0) return 0;
  const founderShares = sum(
    capTable.lots
      .filter((l) => l.holderType === "founder" || l.holderType === "cofounder")
      .map((l) => l.shares),
  );
  return founderShares / total;
}

/** Per-round founder dilution + value, for the Round History chart. */
export function roundHistory(capTable: CapTable): RoundHistoryPoint[] {
  const points: RoundHistoryPoint[] = [];
  const seenRoundIds = new Set<string>();

  for (const round of capTable.rounds) {
    seenRoundIds.add(round.id);
    const activeLots = capTable.lots.filter((l) => seenRoundIds.has(l.roundId));
    const total = sum(activeLots.map((l) => l.shares));
    const founderShares = sum(
      activeLots
        .filter((l) => l.holderType === "founder" || l.holderType === "cofounder")
        .map((l) => l.shares),
    );
    const frac = total > 0 ? founderShares / total : 0;
    points.push({
      roundId: round.id,
      roundName: round.name,
      stage: round.stage,
      postMoney: round.postMoney,
      pricePerShare: round.pricePerShare,
      founderOwnershipAfter: frac,
      founderValueAfter: frac * round.postMoney,
    });
  }

  return points;
}

// ── Exit waterfall ───────────────────────────────────────────────────────────

/** Model proceeds to each holder at a given exit value, $M.
 *
 *  V1 preferred is non-participating with a liquidation-preference multiple,
 *  pari passu across rounds: each preferred holder takes the greater of its
 *  preference or its as-converted common value. Because that choice is
 *  interdependent (a holder converting changes everyone's residual), this
 *  solves the conversion set by best-response iteration from "all convert",
 *  then distributes the residual to common, the pool, and converters. */
export function exitWaterfall(capTable: CapTable, exitValue: Money): PayoutRow[] {
  const E = Math.max(0, exitValue);
  const lots = capTable.lots;

  const commonShares = sum(
    lots.filter((l) => l.shareClass === "common").map((l) => l.shares),
  );
  const preferred = lots.filter((l) => l.shareClass === "preferred");

  // Best-response: start with everyone converting, let holders defect to their
  // preference while it pays more. Converges in ≤ preferred.length passes.
  const converting = new Set<string>(preferred.map((l) => l.id));
  const prefOf = (l: ShareLot) => Math.max(0, l.liquidationPref) * l.investedAmount;

  for (let pass = 0; pass <= preferred.length; pass++) {
    const convShares = sum(
      preferred.filter((l) => converting.has(l.id)).map((l) => l.shares),
    );
    const prefSum = sum(preferred.filter((l) => !converting.has(l.id)).map(prefOf));
    const residual = Math.max(0, E - prefSum);
    const residualShares = commonShares + convShares;
    const rps = residualShares > EPSILON ? residual / residualShares : 0;

    let changed = false;
    for (const l of preferred) {
      const asConverted = l.shares * rps;
      const wantConvert = asConverted > prefOf(l) + EPSILON;
      if (wantConvert !== converting.has(l.id)) {
        if (wantConvert) converting.add(l.id);
        else converting.delete(l.id);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Final distribution with the settled conversion set.
  const convShares = sum(preferred.filter((l) => converting.has(l.id)).map((l) => l.shares));
  const preferring = preferred.filter((l) => !converting.has(l.id));
  let prefSum = sum(preferring.map(prefOf));

  const payoutByHolder = new Map<string, { row: PayoutRow; invested: Money; tookPref: boolean }>();
  const add = (lot: ShareLot, amount: Money, tookPref: boolean) => {
    let entry = payoutByHolder.get(lot.holderId);
    if (!entry) {
      entry = {
        row: {
          holderId: lot.holderId,
          holderName: lot.holderName,
          holderType: lot.holderType,
          payout: 0,
          tookPreference: false,
        },
        invested: 0,
        tookPref: false,
      };
      payoutByHolder.set(lot.holderId, entry);
    }
    entry.row.payout += amount;
    entry.invested += lot.investedAmount;
    if (tookPref) entry.tookPref = true;
  };

  if (prefSum >= E - EPSILON && prefSum > 0) {
    // Not enough to clear preferences — pay preferred pro-rata by preference;
    // common and converters get nothing.
    for (const l of preferring) add(l, E * (prefOf(l) / prefSum), true);
    for (const l of preferred.filter((p) => converting.has(p.id))) add(l, 0, false);
    for (const l of lots.filter((x) => x.shareClass === "common")) add(l, 0, false);
  } else {
    const residual = E - prefSum;
    const residualShares = commonShares + convShares;
    const rps = residualShares > EPSILON ? residual / residualShares : 0;
    for (const l of preferring) add(l, prefOf(l), true);
    for (const l of preferred.filter((p) => converting.has(p.id))) add(l, l.shares * rps, false);
    for (const l of lots.filter((x) => x.shareClass === "common")) add(l, l.shares * rps, false);
  }

  const rows: PayoutRow[] = [];
  for (const entry of payoutByHolder.values()) {
    rows.push({
      ...entry.row,
      tookPreference: entry.tookPref,
      multipleOnInvested: entry.invested > EPSILON ? entry.row.payout / entry.invested : undefined,
    });
  }
  return rows.sort((a, b) => b.payout - a.payout);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function commonLot(p: {
  id: string;
  holderId: string;
  holderName: string;
  holderType: ShareLot["holderType"];
  shares: number;
  roundId: string;
  pricePerShare?: number;
}): ShareLot {
  return {
    id: p.id,
    holderId: p.holderId,
    holderName: p.holderName,
    holderType: p.holderType,
    shareClass: "common",
    shares: p.shares,
    investedAmount: 0,
    pricePerShare: p.pricePerShare ?? 0,
    roundId: p.roundId,
    liquidationPref: 0,
    participating: false,
  };
}

function sum(xs: number[]): number {
  let t = 0;
  for (const x of xs) t += x;
  return t;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
