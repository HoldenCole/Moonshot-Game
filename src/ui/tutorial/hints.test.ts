import { test } from "node:test";
import assert from "node:assert/strict";

import { eligibleHints, HINTS } from "./hints.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function game(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
}

test("the welcome tip leads on the dashboard, then runway, then the cap table", () => {
  const g = game();
  const fresh = eligibleHints({ view: "dashboard", game: g }, []).map((h) => h.id);
  assert.equal(fresh[0], "welcome");

  const afterWelcome = eligibleHints({ view: "dashboard", game: g }, ["welcome"]).map((h) => h.id);
  assert.equal(afterWelcome[0], "runway");
  assert.equal(afterWelcome[1], "captable");
});

test("a pending event outranks the ambient dashboard tips", () => {
  const g = game();
  g.pendingEvent = { id: "x", category: "ai", tone: "threat", headline: "h", body: "b", choices: [], week: 0 };
  const seen = ["welcome", "runway"];
  const order = eligibleHints({ view: "dashboard", game: g }, seen).map((h) => h.id);
  assert.equal(order[0], "event"); // priority 5 beats captable(20)/signature(30)
});

test("view-scoped tips only surface on their own view", () => {
  const g = game();
  assert.ok(!eligibleHints({ view: "dashboard", game: g }, []).some((h) => h.id === "fundraising"));
  assert.ok(eligibleHints({ view: "fundraising", game: g }, []).some((h) => h.id === "fundraising"));
  assert.ok(eligibleHints({ view: "market", game: g }, []).some((h) => h.id === "market"));
});

test("a seen tip never fires again; once all are seen, nothing surfaces", () => {
  const g = game();
  assert.ok(!eligibleHints({ view: "dashboard", game: g }, ["welcome"]).some((h) => h.id === "welcome"));
  const all = HINTS.map((h) => h.id);
  assert.equal(eligibleHints({ view: "dashboard", game: g }, all).length, 0);
});

// ── First-time milestone triggers ─────────────────────────────────────────────

const ids = (g: GameState) => eligibleHints({ view: "dashboard", game: g }, []).map((h) => h.id);

test("first-raise fires only after a priced round closes", () => {
  const g = game();
  assert.ok(!ids(g).includes("first-raise"), "not before any raise");
  g.company.capTable.rounds[0]!.postMoney = 12; // simulate a closed priced round
  assert.ok(ids(g).includes("first-raise"), "fires once you've raised");
});

test("exit-ready fires only when IPO-eligible", () => {
  const g = game();
  assert.ok(!ids(g).includes("exit-ready"), "not at pre-seed");
  g.company.stage = "series_b";
  g.company.capTable.rounds[0]!.postMoney = 300; // >= the $250M IPO bar
  assert.ok(ids(g).includes("exit-ready"), "fires once public-ready");
});

test("went-public fires once the company is public", () => {
  const g = game();
  assert.ok(!ids(g).includes("went-public"));
  g.company.stage = "public";
  assert.ok(ids(g).includes("went-public"));
});
