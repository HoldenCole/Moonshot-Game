import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LOCKUP_WEEKS,
  acquisitionOffer,
  applyAcquisition,
  applyCashOut,
  applyIpo,
  applyStepBack,
  cashOutProceeds,
  eligibleBanks,
  founderTakeAt,
  ipoEligible,
  ipoReadiness,
  ipoPricing,
  ipoTargetRaise,
  lockupExpired,
  repricePublic,
  revealIpo,
  weeksToUnlock,
} from "./exit.ts";
import { applyRound, exitWaterfall } from "./captable.ts";
import { netWorth, valuationMark } from "./finance.ts";
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
  g.clock = { week: 60 }; // a grown company has an operating track record
  return g;
}

const bank: Bank = {
  id: "granite", name: "Granite Stearns", tier: "anchor", founded_year: -80, hq: "NY", color: "#333",
  identity: { tagline: "The bulge bracket.", trait_tags: [], narrative_hooks: [] },
  underwriting: { available: true, prestige: 92, pricing_quality: 85, fee_pct: 0.07, min_raise: 50, selectivity: 80, sectors: ["all"] },
  debt: { offers_debt: true, max_loan_multiple: 2.5, base_rate_spread: 0.018, covenant_strictness: 65, prefers_profitable: true },
  financials: { status: "public", revenue: 48000, valuation: 180000, fundamentals: 80, hype_exposure: 0.2 },
};

test("IPO eligibility needs scale, a track record, and an open window", () => {
  assert.equal(ipoEligible(grown()), true);
  // Too small — a low valuation can't clear the scale bar (stage no longer gates).
  assert.equal(ipoEligible(grown("series_b", 100)), false);
  // No operating history yet.
  const young = grown();
  young.clock = { week: 5 };
  assert.equal(ipoEligible(young), false);
  // A closed window blocks it.
  const closed = grown();
  closed.world.ipoWindow = "closed";
  assert.equal(ipoEligible(closed), false);
});

test("a self-financed company can IPO on valuation alone — raising is never required", () => {
  const g = createNewGame(
    { founderName: "You", companyName: "Bootstrapped", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 9 },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.valuation = 600; // grew into a real mark on revenue
  g.clock.week = 60;
  assert.equal(g.company.capTable.rounds.filter((r) => r.postMoney > 0).length, 0, "never raised a priced round");
  assert.equal(ipoEligible(g), true, "eligible on valuation + track record + window");
  // And the offering actually prices: a bank takes it and the book is non-zero.
  assert.ok(ipoTargetRaise(g) > 0);
  assert.equal(eligibleBanks([bank], g).length, 1);
  assert.ok(ipoPricing(g, bank).fair > 0);
});

test("a public company's mark and net worth track the live cap, not the IPO price", () => {
  const g = grown();
  const ipo = applyIpo(g, bank, revealIpo(g, bank, ipoPricing(g, bank).fair, makeRng(1)));
  const ipoPost = ipo.company.capTable.rounds[ipo.company.capTable.rounds.length - 1]!.postMoney;
  // The stock slides well below the IPO price.
  const fallen = { ...ipo, company: { ...ipo.company, financials: { ...ipo.company.financials, valuation: Math.round(ipoPost * 0.6) } } };
  assert.equal(valuationMark(fallen.company), fallen.company.financials.valuation, "mark = live cap, not floored at the IPO post-money");
  assert.ok(valuationMark(fallen.company) < ipoPost, "mark actually fell below the IPO price");
  // Net worth uses the live mark, so it matches what cashing out would actually pay.
  assert.ok(Math.abs(netWorth(fallen) - (cashOutProceeds(fallen) + fallen.founder.personalCash)) < 1e-6);
});

test("ipoReadiness surfaces each criterion and what's missing", () => {
  const small = grown("series_b", 100); // old + window open, but only a $100M mark
  const r = ipoReadiness(small);
  assert.equal(r.find((c) => c.id === "scale")!.met, false); // $100M < $250M bar
  assert.equal(r.find((c) => c.id === "track")!.met, true); // 60 weeks operating
  assert.equal(r.find((c) => c.id === "window")!.met, true);
  assert.equal(ipoReadiness(grown()).every((c) => c.met), true); // a grown co clears all
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

  // The market cap tracks fundamentals: more revenue → a higher mark.
  const marked = repricePublic(ipo.company, ipo.world);
  assert.ok(marked > 0, "marks at a live value");
  const richer = { ...ipo.company, financials: { ...ipo.company.financials, revenue: ipo.company.financials.revenue + 2000 } };
  assert.ok(repricePublic(richer, ipo.world) > marked, "more revenue lifts the market cap");

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

test("a stock-swap step-back banks an acquirer stake and ends the run as a merger", () => {
  const g = grown();
  const offer = acquisitionOffer(g, [], makeRng(5));
  // The all-stock deal is a richer headline, taken as a stake in the buyer.
  assert.ok(offer.stockExitValue >= offer.exitValue);
  assert.ok(offer.founderStakePct > 0 && offer.founderStakePct <= 0.9);
  assert.ok(offer.founderStockValue > 0);

  const { state, outcome } = applyStepBack(g, offer);
  assert.equal(outcome.kind, "merger");
  assert.equal(outcome.exitValue, offer.stockExitValue);
  assert.ok(outcome.stake);
  assert.equal(outcome.stake!.pct, offer.founderStakePct);
  assert.equal(outcome.stake!.value, offer.founderStockValue);
  assert.ok(state.founder.personalCash >= offer.founderStockValue);
});
