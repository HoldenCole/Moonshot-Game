import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LOCKUP_WEEKS,
  acquisitionOffer,
  applyAcquisition,
  applyCashOut,
  applyIpo,
  cashOutProceeds,
  founderTakeAt,
  ipoEligible,
  ipoPricing,
  lockupExpired,
  repricePublic,
  revealIpo,
  weeksToUnlock,
} from "./exit.ts";
import { applyRound, exitWaterfall } from "./captable.ts";
import { createNewGame } from "@/state/newgame";
import { makeRng } from "./rng.ts";
import type { GameState } from "@/domain/state";
import type { Bank } from "@/content/load";
import type { Stage } from "@/domain/ids";

/** A grown, well-funded company in a live IPO window. */
function grown(stage: Stage = "growth", post = 1000): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Helion Labs", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 7 },
    "2026-01-01T00:00:00Z",
  );
  const capTable = applyRound(g.company.capTable, {
    terms: { valuation: post * 0.8, roundSize: post * 0.2, liquidationPref: 1, participating: false, boardSeats: 1, optionPoolPct: 0.1 },
    stage: "series_b",
    week: 0,
    leadInvestorId: "frontier_partners",
    leadInvestorName: "Frontier Partners",
  });
  g.company = { ...g.company, stage, capTable, financials: { ...g.company.financials, valuation: post, cash: 50 } };
  return g;
}

const bank: Bank = {
  id: "granite", name: "Granite Stearns", tier: "anchor", founded_year: -80, hq: "NY", color: "#333",
  identity: { tagline: "The bulge bracket.", trait_tags: [], narrative_hooks: [] },
  underwriting: { available: true, prestige: 92, pricing_quality: 85, fee_pct: 0.07, min_raise: 50, selectivity: 80, sectors: ["all"] },
  debt: { offers_debt: true, max_loan_multiple: 2.5, base_rate_spread: 0.018, covenant_strictness: 65, prefers_profitable: true },
  financials: { status: "public", revenue: 48000, valuation: 180000, fundamentals: 80, hype_exposure: 0.2 },
};

test("IPO eligibility needs scale and an open window", () => {
  assert.equal(ipoEligible(grown()), true);
  assert.equal(ipoEligible(grown("seed", 1000)), false); // too early
  const closed = grown();
  closed.world.ipoWindow = "closed";
  assert.equal(ipoEligible(closed), false);
});

test("pricing gives a range around fair, with demand from hype", () => {
  const hot = grown();
  hot.world.hype.ai = 90;
  hot.world.ipoWindow = "open";
  const p = ipoPricing(hot, bank);
  assert.ok(p.low < p.fair && p.fair < p.high);
  assert.equal(p.demand, "strong");
});

test("pricing below fair pops; pricing above fair sags", () => {
  const g = grown();
  const p = ipoPricing(g, bank);
  const cheap = revealIpo(g, bank, Math.round(p.fair * 0.85), makeRng(1));
  const rich = revealIpo(g, bank, Math.round(p.fair * 1.15), makeRng(1));
  assert.ok(cheap.firstDayPop > rich.firstDayPop);
  assert.ok(cheap.firstDayPop > 0);
});

test("listing makes the company public and marks the valuation", () => {
  const g = grown();
  const result = revealIpo(g, bank, ipoPricing(g, bank).fair, makeRng(1));
  const after = applyIpo(g, bank, result);
  assert.equal(after.company.stage, "public");
  assert.equal(after.company.financials.valuation, result.publicValuation);
  assert.ok(after.company.financials.cash > g.company.financials.cash); // banked the raise
});

test("going public starts a lockup, re-prices weekly, and the cash-out ends the run", () => {
  const g = grown();
  const ipo = applyIpo(g, bank, revealIpo(g, bank, ipoPricing(g, bank).fair, makeRng(1)));
  assert.equal(ipo.company.stage, "public");
  assert.equal(ipo.company.publicSince, g.clock.week);

  // Locked at listing; tradeable after the lockup window.
  assert.equal(lockupExpired(ipo), false);
  assert.equal(weeksToUnlock(ipo), LOCKUP_WEEKS);
  const later = { ...ipo, clock: { week: ipo.clock.week + LOCKUP_WEEKS } };
  assert.equal(lockupExpired(later), true);

  // The stock actually moves week-to-week, within a bounded weekly return.
  const v0 = ipo.company.financials.valuation;
  const v1 = repricePublic(v0, ipo.world, ipo.company.industry, makeRng(3));
  assert.notEqual(v1, v0);
  assert.ok(v1 > v0 * 0.92 && v1 < v0 * 1.08);

  // Cashing out banks the stake and produces an "ipo" run outcome (was never set).
  const { state, outcome } = applyCashOut(later);
  assert.equal(outcome.kind, "ipo");
  assert.ok(outcome.founderProceeds > 0);
  assert.ok(Math.abs(outcome.founderProceeds - cashOutProceeds(later)) < 1e-6);
  assert.ok(state.founder.personalCash >= outcome.founderProceeds);
});

test("acquisition pays the founder their waterfall take and ends the run", () => {
  const g = grown();
  const offer = acquisitionOffer(g, [], makeRng(2));
  const expected = exitWaterfall(g.company.capTable, offer.exitValue)
    .filter((r) => r.holderType === "founder")
    .reduce((s, r) => s + r.payout, 0);
  assert.ok(Math.abs(offer.founderTake - founderTakeAt(g, offer.exitValue)) < 1e-6);
  assert.ok(Math.abs(offer.founderTake - expected) < 1e-6);

  const { state, outcome } = applyAcquisition(g, offer);
  assert.equal(outcome.kind, "acquisition");
  assert.ok(state.founder.personalCash >= offer.founderTake);
  assert.equal(outcome.founderProceeds, offer.founderTake);
});
