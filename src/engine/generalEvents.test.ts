import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

import { resolveOutcome } from "./eventOutcomes.ts";
import { buildEventContext } from "./eventConditions.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

// The general events couple authored prose to the outcome engine's keyword
// grammar; a silent no-op (or a stray keyword) is exactly the "samey" feel we're
// fixing. These guard that contract so a future copy edit can't quietly break it.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function load(): Record<string, any> {
  const path = fileURLToPath(new URL("../../content/events/general.toml", import.meta.url));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return parse(readFileSync(path, "utf8")) as Record<string, any>;
}

function state(): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 1 },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.revenue = 20;
  return g;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fxOf = (c: any, g: GameState) =>
  resolveOutcome({ label: c.label, detail: c.detail, effects: c.effects, outcomeRef: c.outcome_ref } as never, g);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bites = (fx: any) => !!(fx.cash || fx.ethics || fx.reputation || fx.hypeSelf || fx.headcount || fx.revenue);

test("every general event is well-formed with at least two choices", () => {
  const events = Object.values(load());
  assert.ok(events.length >= 12, `expected a real batch, got ${events.length}`);
  for (const ev of events) {
    assert.ok(ev.id && ev.category && ev.trigger?.type && ev.framing?.headline && ev.framing?.tone, `${ev.id}: framing`);
    assert.ok(Array.isArray(ev.choices) && ev.choices.length >= 2, `${ev.id}: needs >= 2 choices`);
    for (const c of ev.choices) assert.ok(c.label && c.effects && c.outcome_ref, `${ev.id}: choice fields`);
  }
});

test("event conditions reference only known context keys (so they actually fire)", () => {
  const ctx = buildEventContext(state(), []);
  for (const ev of Object.values(load())) {
    for (const cond of ev.trigger?.conditions ?? []) {
      const lhs = (cond as string).match(/^(\S+)/)![1]!;
      assert.ok(lhs in ctx, `${ev.id}: unknown condition key "${lhs}"`);
    }
  }
});

test("each event has a choice with mechanical bite; ethics events present a real fork", () => {
  const g = state();
  for (const ev of Object.values(load())) {
    const fxs = ev.choices.map((c: unknown) => fxOf(c, g));
    assert.ok(fxs.some(bites), `${ev.id}: every choice is a no-op`);
    if (/breach|regulat|scandal/.test(ev.id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.ok(fxs.some((fx: any) => fx.ethics > 0), `${ev.id}: needs an integrity-positive choice`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.ok(fxs.some((fx: any) => fx.ethics < 0), `${ev.id}: needs an integrity-negative choice`);
    }
  }
});
