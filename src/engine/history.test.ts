// The run's memory: snapshots accrue weekly, the annual report fires exactly
// on year boundaries with honest YoY math, and the ladder's rungs stay
// climbed once earned.
import { test } from "node:test";
import assert from "node:assert/strict";

import { snapshotRun, annualReport, ladder, ladderComplete, type RunSnapshot } from "./history.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function g(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
}

function fakeHistory(weeks: number, grow = 1): RunSnapshot[] {
  return Array.from({ length: weeks }, (_, i) => ({
    week: i,
    cash: 10,
    revenue: 10 + i * grow,
    valuation: 100 + i * grow * 4,
    netWorth: 50 + i * grow * 2,
    headcount: 2 + Math.floor(i / 10),
  }));
}

test("snapshotRun captures the week's financial truth", () => {
  const game = g();
  game.clock.week = 7;
  game.company.financials.revenue = 12.345;
  const s = snapshotRun(game);
  assert.equal(s.week, 7);
  assert.equal(s.revenue, 12.35); // rounded to cents
  assert.ok(s.netWorth >= 0);
});

test("the annual report fires only when a 52-week boundary is crossed", () => {
  const game = g();
  game.history = fakeHistory(53);
  game.clock.week = 52;
  assert.ok(annualReport(game, 51), "crossing week 52 reports");
  assert.equal(annualReport(game, 52), null, "no re-report inside the same year");
  game.clock.week = 51;
  assert.equal(annualReport(game, 50), null, "nothing before the first year closes");
});

test("the report's YoY compares against the snapshot from 52 weeks back", () => {
  const game = g();
  game.history = fakeHistory(105);
  game.clock.week = 104;
  const r = annualReport(game, 103)!;
  assert.equal(r.year, 2);
  assert.equal(r.revenue, 10 + 104);
  assert.equal(r.revenueAgo, 10 + 52);
  assert.equal(r.headcountAgo, 2 + Math.floor(52 / 10));
});

test("the ladder starts unclimbed, checks durable evidence, and can complete", () => {
  const game = g();
  const steps = ladder(game);
  assert.equal(steps.find((s) => s.id === "round")!.done, false);
  assert.equal(ladderComplete(steps), false);

  // Evidence appears → rungs check and stay checked (log-based).
  game.log.push({ id: "x1", week: 3, kind: "company", tone: "up", headline: "Committed Flagship 1" });
  game.log.push({ id: "x2", week: 9, kind: "company", tone: "up", headline: "Shipped Flagship 1" });
  game.history = [{ week: 9, cash: 5, revenue: 3, valuation: 120, netWorth: 12, headcount: 4 }];
  const later = ladder(game);
  assert.ok(later.find((s) => s.id === "commit")!.done);
  assert.ok(later.find((s) => s.id === "ship")!.done);
  assert.ok(later.find((s) => s.id === "ten")!.done, "history max net worth counts");
  assert.ok(later.find((s) => s.id === "hundred")!.done, "history max valuation counts");
  assert.equal(later.find((s) => s.id === "frontier")!.done, false);
});
