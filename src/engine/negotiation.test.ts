import { test } from "node:test";
import assert from "node:assert/strict";

import {
  agentFromFirm,
  counterOffer,
  dealAppetite,
  evaluateProposal,
  openNegotiation,
} from "./negotiation.ts";
import { suggestedTerms } from "@/state/newgame";
import type { Investor } from "@/content/load";
import type { NegotiationContext } from "@/domain/negotiation";
import type { RoundTerms } from "@/domain/captable";

// Two firms with deliberately opposite postures (mirrors the authored anchors:
// a founder-friendly seed whisperer vs. an aggressive activist crossover).
function firm(over: Partial<Investor["personality"]>, base: Partial<Investor> = {}): Investor {
  return {
    id: base.id ?? "test_firm",
    name: base.name ?? "Test Capital",
    tier: "anchor",
    partner_name: "A. Partner",
    hq: "Menlo Park, CA",
    identity: { thesis: "Back the best.", reputation: 80, trait_tags: ["Test"] },
    personality: {
      aggression: 50,
      patience: 60,
      conviction: 60,
      founder_friendliness: 50,
      network_strength: 60,
      ...over,
    },
    focus: {
      primary_sector: "ai",
      primary_stage: "seed",
      stage_range: ["pre_seed", "series_a"],
      stretch_tolerance: 0.4,
    },
    fund: { fund_name: "Fund I", fund_size: 200, vintage_year: -1, deployment_years: 3, check_min: 0.5, check_max: 20 },
  } as Investor;
}

const friendly = agentFromFirm(firm({ founder_friendliness: 92, aggression: 35, conviction: 70 }, { id: "helio", name: "Helio" }));
const activist = agentFromFirm(firm({ founder_friendliness: 26, aggression: 88, conviction: 55 }, { id: "meridian", name: "Meridian" }));

function ctx(over: Partial<NegotiationContext> = {}): NegotiationContext {
  return {
    stage: "seed",
    industry: "ai",
    subIndustry: "frontier_model_lab",
    hype: 70,
    vcClimate: 62,
    week: 10,
    market: suggestedTerms("seed"),
    relationshipScore: 50,
    seed: 12345,
    ...over,
  };
}

const market = suggestedTerms("seed");
// A founder-favorable ask: rich valuation, 1× pref, lean pool, no board seat.
const aggressiveAsk: RoundTerms = { ...market, valuation: market.valuation * 1.6, liquidationPref: 1, boardSeats: 0, optionPoolPct: 0.05 };
// A market-rate ask near the baseline.
const fairAsk: RoundTerms = { ...market };

test("an evaluation is deterministic for identical inputs", () => {
  const a = evaluateProposal(activist, aggressiveAsk, ctx(), 1, false);
  const b = evaluateProposal(activist, aggressiveAsk, ctx(), 1, false);
  assert.equal(a.satisfaction, b.satisfaction);
  assert.equal(a.decision, b.decision);
});

test("a founder-friendly firm is happier than an activist with the same ask", () => {
  const f = evaluateProposal(friendly, aggressiveAsk, ctx(), 1, false);
  const a = evaluateProposal(activist, aggressiveAsk, ctx(), 1, false);
  assert.ok(f.satisfaction > a.satisfaction, `friendly ${f.satisfaction} should beat activist ${a.satisfaction}`);
});

test("the activist counters toward worse terms for the founder", () => {
  const e = evaluateProposal(activist, aggressiveAsk, ctx(), 1, false);
  assert.equal(e.decision, "counter");
  const c = e.counter!;
  // It pulls valuation down and pushes pref / pool / board up versus the ask.
  assert.ok(c.valuation < aggressiveAsk.valuation, "counter should cut valuation");
  assert.ok(
    c.liquidationPref > aggressiveAsk.liquidationPref || c.optionPoolPct > aggressiveAsk.optionPoolPct || c.boardSeats > aggressiveAsk.boardSeats,
    "counter should harden some governance term",
  );
});

test("a fair ask to an eager, friendly firm is accepted", () => {
  const e = evaluateProposal(friendly, fairAsk, ctx({ hype: 80, vcClimate: 75 }), 1, false);
  assert.equal(e.decision, "accept");
});

test("eagerness rises with sector + market heat", () => {
  const cold = dealAppetite(activist, ctx({ hype: 20, vcClimate: 25, industry: "energy" }));
  const hot = dealAppetite(activist, ctx({ hype: 95, vcClimate: 90, industry: "ai" }));
  assert.ok(hot > cold);
});

test("a soft signal is reported, never a probability", () => {
  const e = evaluateProposal(activist, aggressiveAsk, ctx(), 1, false);
  assert.ok(["warm", "receptive", "pushing", "cool", "walking"].includes(e.signal));
  assert.ok(/Partner|partner|sees|pushing|talk|excited|far apart|deal/i.test(e.line));
});

test("the negotiation runs at most three rounds", () => {
  let neg = openNegotiation(activist, aggressiveAsk, ctx());
  let guard = 0;
  while (neg.status === "active" && guard++ < 10) {
    neg = counterOffer(neg, activist, aggressiveAsk, ctx()); // keep lowballing
  }
  assert.ok(neg.round <= 3);
  assert.ok(["walked", "exhausted", "agreed"].includes(neg.status));
  assert.ok(neg.history.length <= 3);
});

test("accepting the investor's counter yields agreeable terms", () => {
  const neg = openNegotiation(activist, aggressiveAsk, ctx());
  if (neg.status === "active" && neg.currentCounter) {
    // Re-submitting their own counter should satisfy them.
    const e = evaluateProposal(activist, neg.currentCounter, ctx(), 2, false);
    assert.ok(e.satisfaction > evaluateProposal(activist, aggressiveAsk, ctx(), 2, false).satisfaction);
  }
});

test("per-term reactions flag the sore points", () => {
  const e = evaluateProposal(activist, aggressiveAsk, ctx(), 1, false);
  const val = e.termReactions.find((r) => r.term === "valuation")!;
  assert.ok(["pushing", "dealbreaker"].includes(val.stance), `valuation stance was ${val.stance}`);
});
