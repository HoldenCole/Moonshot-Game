import { test } from "node:test";
import assert from "node:assert/strict";

import { accumulatedUnits, commitProcess, commitCost, processProgress, tickProcess, winChance } from "./signature.ts";
import { createNewGame } from "@/state/newgame";
import { makeRng } from "./rng.ts";
import type { GameState } from "@/domain/state";
import type { Industry, PlayableSubIndustry } from "@/domain/ids";

function game(): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Helion Labs", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.cash = 20;
  return g;
}

const SPACE: PlayableSubIndustry[] = ["launch_services", "satellite_constellations", "space_stations"];
function gameSub(sub: PlayableSubIndustry): GameState {
  const industry: Industry = SPACE.includes(sub) ? "space" : "ai";
  const g = createNewGame(
    { founderName: "You", companyName: "Orbital", industry, subIndustry: sub, color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
  g.company.financials.cash = 40;
  return g;
}

/** Run a committed process to its end week and resolve it; return the kind. */
function resolveOnce(g: GameState, approachId?: string): { state: GameState; kind: "success" | "partial" | "failure" } {
  let running = commitProcess(g, makeRng(1), approachId);
  running = { ...running, clock: { week: running.company.signature.endWeek } };
  const r = tickProcess(running, makeRng(2));
  const h = r.resolved!.headline;
  const kind = h.includes("beat target") ? "success" : h.includes("on target") ? "partial" : "failure";
  return { state: r.state, kind };
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

test("a default approach is used when none is chosen; the choice is recorded", () => {
  const g = game();
  assert.equal(commitProcess(g, makeRng(1)).company.signature.approach, "scaling");
  assert.equal(commitProcess(g, makeRng(1), "frontier").company.signature.approach, "frontier");
});

test("the approach scales the commit cost: a frontier run costs more than a targeted one", () => {
  const g = game();
  assert.ok(commitCost(g, "targeted") < commitCost(g, "scaling"));
  assert.ok(commitCost(g, "scaling") < commitCost(g, "frontier"));
});

test("a built-up edge (flight heritage) lifts the odds; winChance stays bounded", () => {
  const g = gameSub("launch_services");
  g.company.signatureStats = { heritage: 0 };
  const low = winChance(g, "conservative");
  g.company.signatureStats = { heritage: 10 };
  const high = winChance(g, "conservative");
  assert.ok(high > low, "heritage compounds the odds");
  assert.ok(low >= 0.05 && high <= 0.95, "odds stay in range");
});

test("the satellite fleet accumulates on a good batch and feeds revenue", () => {
  const g = gameSub("satellite_constellations");
  assert.equal(accumulatedUnits(g), 0); // no fleet yet
  const { state, kind } = resolveOnce(g, "large");
  const fleet = state.company.signatureStats!.fleet ?? 0;
  if (kind === "failure") {
    assert.ok(fleet >= 0);
    assert.equal(state.company.financials.revenue, 0);
  } else {
    assert.ok(fleet > 0, "a deployed batch grows the fleet");
    assert.ok(state.company.financials.revenue > 0, "the fleet ramps recurring revenue");
  }
});
