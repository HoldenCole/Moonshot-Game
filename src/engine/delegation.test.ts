import { test } from "node:test";
import assert from "node:assert/strict";

import { autoResolveChoice, eventArea, isDelegated, generateCandidates, recommendation, shouldEscalate } from "./delegation.ts";
import { scaleByExec } from "./eventOutcomes.ts";
import { advance } from "./tick.ts";
import { TEST_TUNING } from "./world.test.ts";
import { createNewGame } from "@/state/newgame";
import { makeRng } from "./rng.ts";
import type { GameState, Exec } from "@/domain/state";
import type { ResolvedEvent } from "@/domain/events";
import type { EventContent } from "@/domain/content";

function game(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 11 },
    "2026-01-01T00:00:00Z",
  );
}

test("events route to plausible areas", () => {
  assert.equal(eventArea({ id: "a2_compute_shortage", category: "ai" }), "operations");
  assert.equal(eventArea({ id: "a8_enterprise_megadeal", category: "ai" }), "revenue");
  assert.equal(eventArea({ id: "a13_ai_hype_peak", category: "ai" }), "finance");
  assert.equal(eventArea({ id: "a1_talent_poach", category: "ai" }), "technical");
  assert.equal(eventArea({ id: "p1_burnout_risk", category: "personal" }), null); // never delegated
});

test("a strong exec takes the proactive choice; a weak one defaults to the fallback", () => {
  const ev: ResolvedEvent = {
    id: "x", category: "ai", tone: "threat", headline: "h", body: "b", week: 0,
    choices: [
      { label: "Act", detail: "", effects: "", outcomeRef: "a" },
      { label: "Middle", detail: "", effects: "", outcomeRef: "b" },
      { label: "Pass", detail: "", effects: "", outcomeRef: "c" },
    ],
  };
  const strong: Exec = { name: "S", role: "COO", area: "operations", quality: 80 };
  const weak: Exec = { name: "W", role: "COO", area: "operations", quality: 38 };
  assert.equal(autoResolveChoice(strong, ev), 0);
  assert.equal(autoResolveChoice(weak, ev), 2);
});

test("isDelegated requires both an exec and 'handle' autonomy", () => {
  const g = game();
  assert.equal(isDelegated(g, "operations"), false);
  g.company.executives.operations = { name: "C", role: "COO", area: "operations", quality: 70 };
  g.company.delegation.operations = "recommend";
  assert.equal(isDelegated(g, "operations"), false);
  g.company.delegation.operations = "handle";
  assert.equal(isDelegated(g, "operations"), true);
  assert.equal(isDelegated(g, null), false);
});

test("candidates are rolled with a quality and a cost", () => {
  const cands = generateCandidates("finance", game(), makeRng(1));
  assert.equal(cands.length, 3);
  for (const c of cands) {
    assert.ok(c.quality >= 40 && c.quality <= 95);
    assert.ok(c.cost > 0);
    assert.equal(c.role, "CFO");
  }
});

test("exec quality reshapes a handled outcome; ethics + headcount stay intact", () => {
  const fx = { cash: -10, ethics: -4, reputation: -3, hypeSelf: 2, headcount: -1, revenue: 4, result: "" };
  const strong = scaleByExec(fx, 80);
  const weak = scaleByExec(fx, 38);
  assert.ok(strong.cash > fx.cash, "strong softens the loss");
  assert.ok(strong.revenue > fx.revenue, "strong presses the gain");
  assert.ok(weak.cash < fx.cash, "weak worsens the loss");
  assert.equal(strong.ethics, fx.ethics);
  assert.equal(strong.headcount, fx.headcount);
});

test("a crisis escalates past delegation; a lesser event does not", () => {
  const crisis = { id: "x", category: "ai", tone: "crisis", headline: "h", body: "b", week: 0, choices: [] } as ResolvedEvent;
  assert.equal(shouldEscalate(crisis), true);
  assert.equal(shouldEscalate({ ...crisis, tone: "threat" }), false);
});

test("recommendation surfaces the exec's pick only in 'recommend' mode", () => {
  const g = game();
  const ev: ResolvedEvent = {
    id: "x", category: "ai", tone: "threat", headline: "h", body: "b", week: 0,
    choices: [
      { label: "Act", detail: "", effects: "", outcomeRef: "a" },
      { label: "Pass", detail: "", effects: "", outcomeRef: "b" },
    ],
  };
  g.company.executives.operations = { name: "C", role: "COO", area: "operations", quality: 80 };
  assert.equal(recommendation(g, "operations", ev), null, "decide mode → no recommendation");
  g.company.delegation.operations = "recommend";
  assert.equal(recommendation(g, "operations", ev), 0, "recommend mode → the strong exec's proactive pick");
});

test("a delegated area's events auto-resolve on advance (no pause)", () => {
  // An always-eligible operations event, delegated to a capable COO.
  const opsEvent: EventContent = {
    id: "ops_test", category: "ai", weight: 50, cooldown_weeks: 1, one_shot: false,
    trigger: { type: "random", conditions: ["company.industry == ai"] },
    framing: { headline: "An operations call", body: "Decide.", tone: "threat" },
    choices: [
      { label: "Handle", detail: "", effects: "", outcome_ref: "ops_handle" },
      { label: "Wait", detail: "", effects: "", outcome_ref: "ops_wait" },
    ],
  };
  let g = game();
  g.company.executives.operations = { name: "C. Renn", role: "COO", area: "operations", quality: 78 };
  g.company.delegation.operations = "handle";
  g.company.financials.cash = 50;

  const r = advance(g, TEST_TUNING, { type: "weeks", weeks: 40 }, { events: [opsEvent], market: [] });
  // It advanced the full window (never paused for the delegated event)…
  assert.equal(r.weeks, 40);
  assert.equal(r.state.pendingEvent, null);
  // …and a delegation report was logged.
  assert.ok(r.state.log.some((e) => e.detail?.includes("handled it")), "expected a delegation report");
});
