import { test } from "node:test";
import assert from "node:assert/strict";

import { evalCondition, buildEventContext } from "./eventConditions.ts";
import { resolveSlots } from "./eventSlots.ts";
import { resolveOutcome, applyOutcome } from "./eventOutcomes.ts";
import { evaluateEvents } from "./events.ts";
import { createNewGame } from "@/state/newgame";
import { makeRng } from "./rng.ts";
import type { Company } from "@/content/load";
import type { EventContent } from "@/domain/content";
import type { GameState } from "@/domain/state";

function co(id: string, sub = "frontier_model_lab"): Company {
  return {
    id,
    name: id[0]!.toUpperCase() + id.slice(1),
    tier: "anchor",
    industry: "ai",
    sub_industry: sub,
    founded_year: -5,
    hq: "SF",
    color: "#fff",
    logo_glyph: "x",
    identity: { tagline: "", reputation: 80, narrative_hooks: ["leads"] },
    stage: { status: "public", private_round: "", ipo_year: -1 },
    financials: { revenue: 100, revenue_growth: 0.3, gross_margin: 0.6, profitable: false, burn_monthly: 5, valuation: 1000, shares_out: 100 },
    quality: { fundamentals: 80, hype_exposure: 0.6, moat: 60, execution: 70 },
    signature: { benchmark_score: 70, signature_notes: "" },
    relationships: { competitors: [], investors: [] },
  };
}

const anchors = [co("openmind"), co("cerebra"), co("chips", "ai_chips")];

function game(): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 99 },
    "2026-01-01T00:00:00Z",
    anchors,
    ["frontier"],
  );
  return g;
}

const market = (g: GameState): Company[] => [...anchors, ...g.market.companies];

const poach: EventContent = {
  id: "test_poach",
  category: "ai",
  weight: 10,
  cooldown_weeks: 26,
  one_shot: false,
  trigger: { type: "random", conditions: ["company.industry == ai", "company.has_competitor == true"] },
  framing: { headline: "{rival} is poaching {researcher}", body: "{rival} made an offer.", tone: "threat" },
  choices: [
    { label: "Counter aggressively", detail: "Match the offer", effects: "Expensive.", outcome_ref: "poach_counter" },
    { label: "Let them go", detail: "Backfill", effects: "Free.", outcome_ref: "poach_release" },
  ],
};

// ── Conditions ───────────────────────────────────────────────────────────────

test("conditions compare stages ordinally and enums by equality", () => {
  const ctx = buildEventContext(game(), market(game()));
  assert.equal(evalCondition("company.industry == ai", ctx), true);
  assert.equal(evalCondition("company.industry == space", ctx), false);
  assert.equal(evalCondition("company.stage >= series_a", ctx), false); // starts pre-seed
  assert.equal(evalCondition("company.stage <= series_b", ctx), true);
  assert.equal(evalCondition("company.has_competitor == true", ctx), true);
});

test("milestone thresholds resolve per-path", () => {
  const g = game();
  g.founder.reputation = 70;
  const ctx = buildEventContext(g, market(g));
  assert.equal(evalCondition("founder.reputation >= milestone", ctx), true);
  g.founder.reputation = 20;
  assert.equal(evalCondition("founder.reputation >= milestone", buildEventContext(g, market(g))), false);
});

// ── Slots ────────────────────────────────────────────────────────────────────

test("slots resolve from the real market; missing required slot skips", () => {
  const g = game();
  const rng = makeRng(1);
  const ok = resolveSlots(["{rival} is poaching {researcher}"], g, market(g), rng);
  assert.ok(ok);
  const filled = ok!.fill("{rival} is poaching {researcher}");
  assert.ok(!filled.includes("{rival}") && !filled.includes("{researcher}"), filled);

  // No competitors in market → {rival} can't resolve → null.
  const lonely = resolveSlots(["{rival} did something"], g, [], rng);
  assert.equal(lonely, null);
});

// ── Outcomes ─────────────────────────────────────────────────────────────────

test("a costly choice spends cash; a transparent one lifts ethics", () => {
  const g = game();
  g.company.financials.cash = 10;
  // Outcomes read the AUTHORED consequence text (label + detail + effects), the
  // way real content expresses stakes — not the outcome_ref stem.
  const counter = resolveOutcome(
    { label: "Counter aggressively", detail: "Match the offer with a premium retention grant", effects: "Expensive — burns cash.", outcomeRef: "poach_counter" },
    g,
  );
  assert.ok(counter.cash < 0, "counter should cost cash");

  const transparent = resolveOutcome(
    { label: "Disclose it openly", detail: "Publish a transparent post-mortem and cooperate fully", effects: "Builds trust and integrity.", outcomeRef: "safety_transparent" },
    g,
  );
  assert.ok(transparent.ethics > 0, "transparent should raise ethics");

  const after = applyOutcome(g, counter);
  assert.ok(after.company.financials.cash < g.company.financials.cash);
});

// ── Engine ───────────────────────────────────────────────────────────────────

test("an eligible event eventually fires, fully resolved", () => {
  const g = game();
  const rng = makeRng(5);
  let fired = null;
  for (let i = 0; i < 80 && !fired; i++) {
    const et = evaluateEvents(g, [poach], market(g), rng);
    if (et.event) fired = et;
  }
  assert.ok(fired, "an eligible event should fire within many tries");
  assert.equal(fired!.event!.choices.length, 2);
  assert.ok(!fired!.event!.headline.includes("{"), "headline slots filled");
  assert.equal(fired!.eventState.cooldowns["test_poach"], g.clock.week);
});

test("an event on cooldown is not eligible", () => {
  const g = game();
  g.eventState = { cooldowns: { test_poach: g.clock.week - 5 }, fired: [], lastEventWeek: -999 };
  const rng = makeRng(5);
  let fired = null;
  for (let i = 0; i < 80 && !fired; i++) {
    const et = evaluateEvents(g, [poach], market(g), rng);
    if (et.event) fired = et;
  }
  assert.equal(fired, null);
});

test("a pending event blocks new events", () => {
  const g = game();
  const rng = makeRng(5);
  const et = evaluateEvents({ ...g, pendingEvent: { id: "x", category: "ai", tone: "threat", headline: "h", body: "b", choices: [], week: 0 } }, [poach], market(g), rng);
  assert.equal(et.event, null);
});
