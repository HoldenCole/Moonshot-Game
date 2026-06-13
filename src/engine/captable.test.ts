import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyRound,
  computeRound,
  exitWaterfall,
  foundCompany,
  founderOwnership,
  ownership,
  roundHistory,
  totalShares,
  FOUNDING_SHARES,
} from "./captable.ts";
import type { CapTable, RoundTerms } from "@/domain/captable";

const approx = (a: number, b: number, eps = 1e-4) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

function found(): CapTable {
  return foundCompany({ founderId: "you", founderName: "You", week: 0 });
}

const seed: RoundTerms = {
  valuation: 8, // $8M pre
  roundSize: 2, // $2M raised → $10M post
  liquidationPref: 1,
  participating: false,
  boardSeats: 1,
  optionPoolPct: 0.1, // 10% post-money pool
};

test("founding gives the founder 100% of common", () => {
  const c = found();
  assert.equal(totalShares(c), FOUNDING_SHARES);
  approx(founderOwnership(c), 1);
  const rows = ownership(c);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.holderType, "founder");
  approx(rows[0]!.ownership, 1);
});

test("a priced round: investor owns amount/post, pool is created pre-money", () => {
  const c = applyRound(found(), {
    terms: seed,
    stage: "seed",
    week: 4,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });

  const rows = ownership(c);
  const investor = rows.find((r) => r.holderId === "redwood_ventures")!;
  const pool = rows.find((r) => r.holderType === "pool")!;
  const founder = rows.find((r) => r.holderType === "founder")!;

  // Investor ownership equals 2/10 = 20%.
  approx(investor.ownership, 0.2, 1e-3);
  // Pool is 10% of post-money fully diluted.
  approx(pool.ownership, 0.1, 1e-3);
  // Founder absorbs both the investor and the pool dilution: 70%.
  approx(founder.ownership, 0.7, 1e-3);
  // Ownership fractions sum to 1.
  approx(investor.ownership + pool.ownership + founder.ownership, 1, 1e-3);
});

test("price per share is consistent with post-money / total shares", () => {
  const c = applyRound(found(), {
    terms: seed,
    stage: "seed",
    week: 4,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });
  const comp = computeRound(found(), seed);
  // pps · postShares (in $) == post-money (in $).
  approx((comp.pricePerShare * comp.postShares) / 1_000_000, comp.postMoney, 1e-2);
  const round = c.rounds.at(-1)!;
  approx(round.postMoney, 10);
  approx(round.preMoney, 8);
});

test("sequential rounds keep diluting the founder and round history tracks it", () => {
  let c = found();
  c = applyRound(c, {
    terms: seed,
    stage: "seed",
    week: 4,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });
  c = applyRound(c, {
    terms: {
      valuation: 40,
      roundSize: 10,
      liquidationPref: 1,
      participating: false,
      boardSeats: 1,
      optionPoolPct: 0.1,
    },
    stage: "series_a",
    week: 60,
    leadInvestorId: "frontier_partners",
    leadInvestorName: "Frontier Partners",
  });

  const f = founderOwnership(c);
  assert.ok(f < 0.7 && f > 0.4, `founder should be diluted into the 40-70% band, got ${f}`);

  const history = roundHistory(c);
  assert.equal(history.length, 3); // founding + 2 rounds
  approx(history[0]!.founderOwnershipAfter, 1);
  assert.ok(history[1]!.founderOwnershipAfter > history[2]!.founderOwnershipAfter);
  // Value goes up even as ownership goes down (the whole point).
  assert.ok(history[2]!.founderValueAfter > history[1]!.founderValueAfter);
});

test("exit waterfall conserves value (payouts sum to the exit value)", () => {
  let c = found();
  c = applyRound(c, {
    terms: seed,
    stage: "seed",
    week: 4,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });

  for (const exit of [1, 5, 10, 25, 100, 1000]) {
    const rows = exitWaterfall(c, exit);
    const total = rows.reduce((s, r) => s + r.payout, 0);
    approx(total, exit, 1e-2);
  }
});

test("at a low exit, preferred takes its preference; at a high exit it converts", () => {
  let c = found();
  c = applyRound(c, {
    terms: { ...seed, valuation: 8, roundSize: 2, liquidationPref: 1 },
    stage: "seed",
    week: 4,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });

  // Exit at $4M: below post-money. Investor put in $2M at 1× → takes $2M pref,
  // which beats converting (20% of $4M = $0.8M).
  const low = exitWaterfall(c, 4);
  const invLow = low.find((r) => r.holderId === "redwood_ventures")!;
  approx(invLow.payout, 2, 1e-2);
  assert.equal(invLow.tookPreference, true);

  // Exit at $1B: converting (20% ≈ $200M) dwarfs the $2M preference.
  const high = exitWaterfall(c, 1000);
  const invHigh = high.find((r) => r.holderId === "redwood_ventures")!;
  assert.equal(invHigh.tookPreference, false);
  assert.ok(invHigh.payout > 150, `expected investor ~20% of 1000, got ${invHigh.payout}`);
});

test("founder keeps a majority through a typical seed (decision H)", () => {
  const c = applyRound(found(), {
    terms: seed,
    stage: "seed",
    week: 4,
    leadInvestorId: "redwood_ventures",
    leadInvestorName: "Redwood Ventures",
  });
  assert.ok(founderOwnership(c) >= 0.51, "founder should retain 51%+ after a seed");
});
