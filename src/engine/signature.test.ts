import { test } from "node:test";
import assert from "node:assert/strict";

import { commitProcess, processProgress, tickProcess, commitCost } from "./signature.ts";
import { createNewGame } from "@/state/newgame";
import { makeRng } from "./rng.ts";
import type { GameState } from "@/domain/state";

function game(): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Helion Labs", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.cash = 20;
  return g;
}

test("committing a process deducts cash and starts running", () => {
  const g = game();
  const cost = commitCost(g);
  const after = commitProcess(g, makeRng(1));
  assert.equal(after.company.signature.status, "running");
  assert.ok(after.company.signature.endWeek > after.company.signature.startWeek);
  assert.ok(Math.abs(after.company.financials.cash - (g.company.financials.cash - cost)) < 1e-6);
  assert.ok(after.company.signature.name.includes("training run"));
});

test("the process doesn't resolve before its end week", () => {
  const running = commitProcess(game(), makeRng(1));
  const r = tickProcess(running, makeRng(2));
  assert.equal(r.resolved, null);
  assert.equal(r.state.company.signature.status, "running");
});

test("the process resolves at its end week with an outcome", () => {
  let running = commitProcess(game(), makeRng(1));
  running = { ...running, clock: { week: running.company.signature.endWeek } };
  const r = tickProcess(running, makeRng(2));
  assert.ok(r.resolved, "a log entry should be produced");
  assert.equal(r.state.company.signature.status, "resolved");
  assert.ok(["success", "partial", "failure"].includes(r.state.company.signature.lastOutcome!.kind));
});

test("progress runs 0 → 1 across the process window", () => {
  const running = commitProcess(game(), makeRng(1));
  const sig = running.company.signature;
  assert.equal(processProgress(sig, sig.startWeek), 0);
  assert.ok(processProgress(sig, Math.round((sig.startWeek + sig.endWeek) / 2)) > 0.3);
  assert.equal(processProgress(sig, sig.endWeek), 1);
});
