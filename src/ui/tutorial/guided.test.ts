import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

import {
  advancesOn,
  gateContext,
  gatePasses,
  guidedScreen,
  interpolate,
  isAck,
  nextReachable,
  signatureLabel,
} from "./guided.ts";
import { createNewGame } from "@/state/newgame";
import type { TutorialStep } from "@/domain/content";
import type { GameState } from "@/domain/state";

const game = (): GameState =>
  createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "launch_services", color: "#fff", seed: 7 },
    "2026-01-01T00:00:00Z",
  );

const step = (over: Partial<TutorialStep>): TutorialStep => ({
  id: "x",
  order: 1,
  anchor: "a",
  placement: "top",
  title: "",
  body: "",
  advance_on: "ack",
  allow_skip: true,
  gate: "",
  hint_fallback: "",
  ...over,
});

test("the screen id is new_game before founding, then the active view", () => {
  assert.equal(guidedScreen(false, "dashboard"), "new_game");
  assert.equal(guidedScreen(true, "dashboard"), "dashboard");
  assert.equal(guidedScreen(true, "fundraising"), "fundraising");
});

test("the signature slot resolves to the sub-industry noun", () => {
  assert.equal(signatureLabel(game()), "launch"); // launch_services
  assert.equal(signatureLabel(null), "signature move");
});

test("interpolate fills known slots and leaves unknown tokens alone", () => {
  assert.equal(interpolate("Make your first {signature_label}", { signature_label: "launch" }), "Make your first launch");
  assert.equal(interpolate("{unknown} stays", {}), "{unknown} stays");
});

test("raising is available until you're public; signatures when none is running", () => {
  const g = game();
  let ctx = gateContext(true, "dashboard", g);
  assert.equal(ctx["company.can_raise"], true);
  assert.equal(ctx["company.signature_available"], true);
  assert.equal(ctx["screen"], "dashboard");

  g.company.stage = "public";
  assert.equal(gateContext(true, "dashboard", g)["company.can_raise"], false);

  g.company.signature = { ...g.company.signature, status: "running" };
  assert.equal(gateContext(true, "dashboard", g)["company.signature_available"], false);

  // No game yet → nothing is actionable.
  ctx = gateContext(false, "dashboard", null);
  assert.equal(ctx["company.can_raise"], false);
  assert.equal(ctx["screen"], "new_game");
});

test("a beat's gate is checked against the guided context; empty gates always hold", () => {
  const g = game();
  const dash = gateContext(true, "dashboard", g);
  const newGame = gateContext(false, "", null);
  assert.equal(gatePasses(step({ gate: "screen == dashboard" }), dash), true);
  assert.equal(gatePasses(step({ gate: "screen == dashboard" }), newGame), false);
  assert.equal(gatePasses(step({ gate: "company.can_raise == true" }), dash), true);
  assert.equal(gatePasses(step({ gate: "" }), newGame), true);
});

test("advance predicates read the advance_on contract", () => {
  assert.equal(isAck(step({ advance_on: "ack" })), true);
  assert.equal(isAck(step({ advance_on: "action:advanced_week" })), false);
  assert.equal(advancesOn(step({ advance_on: "action:round_closed" }), "round_closed"), true);
  assert.equal(advancesOn(step({ advance_on: "action:round_closed" }), "advanced_week"), false);
  assert.equal(advancesOn(step({ advance_on: "ack" }), "advanced_week"), false);
});

test("skipping forward steps over beats whose gate can't be reached from here", () => {
  // On the dashboard, the two fundraising-gated beats are unreachable, so a skip
  // from the raise beat lands on the next dashboard-reachable beat (the signature).
  const steps = [
    step({ id: "raise", gate: "company.can_raise == true" }),
    step({ id: "terms", gate: "screen == fundraising" }),
    step({ id: "accept", gate: "screen == fundraising" }),
    step({ id: "signature", gate: "company.signature_available == true" }),
  ];
  const dash = gateContext(true, "dashboard", game());
  assert.equal(nextReachable(steps, 0, dash), 3); // skip terms(1) + accept(2) → signature(3)

  // When nothing further is reachable, it returns past the end (→ finish).
  const onlyFundraising = [step({ id: "a" }), step({ id: "b", gate: "screen == fundraising" })];
  assert.equal(nextReachable(onlyFundraising, 0, dash), 2);
});

test("the authored first-run script honors the harness contract", () => {
  const path = fileURLToPath(new URL("../../../content/tutorial/first_run.toml", import.meta.url));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { tutorial } = parse(readFileSync(path, "utf8")) as any;

  assert.equal(tutorial.steps.length, 11);
  const placements = new Set(["top", "bottom", "left", "right", "center"]);
  for (const s of tutorial.steps) {
    assert.ok(s.id && s.anchor && s.title && s.body, `${s.id}: required fields present`);
    assert.ok(placements.has(s.placement), `${s.id}: valid placement`);
    assert.ok(s.advance_on === "ack" || s.advance_on.startsWith("action:"), `${s.id}: advance_on shape`);
  }
  // The signature beat carries the slot the driver fills.
  const sig = tutorial.steps.find((s: TutorialStep) => s.id === "signature_intro");
  assert.ok(sig.title.includes("{signature_label}"));
  // Handoff re-arms the ambient hint system.
  assert.equal(tutorial.handoff.enable_hint_system, true);
});
