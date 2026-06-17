import { test } from "node:test";
import assert from "node:assert/strict";

import { earningsReport, qualityOfEarnings } from "./earnings.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function game(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 5 },
    "2026-01-01T00:00:00Z",
  );
}

/** A public company one quarter in, with an engineered beat on the books. */
function publicGame(): GameState {
  const s = game();
  s.company.stage = "public";
  s.company.publicSince = 0;
  s.clock = { week: 13 };
  s.company.financials = { ...s.company.financials, revenue: 80, valuation: 5000 };
  s.company.earnings = { gap: 0.55, guidance: "stretched", lastResult: "beat", lastMove: 0.08 };
  return s;
}

test("qualityOfEarnings bands the hidden engineered-vs-real gap", () => {
  assert.equal(qualityOfEarnings(0.05), "clean");
  assert.equal(qualityOfEarnings(0.3), "managed");
  assert.equal(qualityOfEarnings(0.6), "stretched");
});

test("earningsReport surfaces the settled print + the figures for a public company", () => {
  const r = earningsReport(publicGame());
  assert.ok(r, "a public company produces a report");
  assert.equal(r!.result, "beat");
  assert.ok(Math.abs(r!.move - 0.08) < 1e-9, "uses the settled stock reaction");
  assert.equal(r!.guidance, "stretched");
  assert.equal(r!.quality, "stretched"); // gap 0.55 → heavily engineered
  assert.equal(r!.revenue, 80);
  assert.ok(r!.stockPrice > 0, "a per-share price is shown");
  assert.equal(typeof r!.eps, "number");
});

test("earningsReport recomputes the result when none is settled yet", () => {
  const s = publicGame();
  s.company.earnings = { gap: 0.1, guidance: "inline" }; // no lastResult/lastMove
  const r = earningsReport(s);
  assert.ok(r);
  assert.ok(["beat", "met", "missed"].includes(r!.result));
  assert.equal(r!.quality, "clean");
});

test("earningsReport is null for a private company", () => {
  assert.equal(earningsReport(game()), null);
});
