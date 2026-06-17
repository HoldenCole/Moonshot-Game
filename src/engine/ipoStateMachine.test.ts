import { test } from "node:test";
import assert from "node:assert/strict";

import { nextStage } from "@/domain/ids";
import { applyIpo, ipoEligible, type IpoResult } from "./exit.ts";
import { createNewGame } from "@/state/newgame";
import type { Bank } from "@/content/load";
import type { GameState } from "@/domain/state";

function g(): GameState {
  return createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
}

test("public is a terminal stage — a priced round can never revert it", () => {
  // The bug was nextStage('public') falling through to 'late_stage', so closing
  // a round while public reverted the company to private and re-armed the IPO.
  assert.equal(nextStage("public"), "public");
});

test("a public company is not IPO-eligible, so the IPO can't fire twice", () => {
  const s = g();
  s.company.stage = "public";
  assert.equal(ipoEligible(s), false);
});

test("applyIpo lists the company public, banks the raise, and locks out a second IPO", () => {
  const s = g();
  const cash0 = s.company.financials.cash;
  const result: IpoResult = {
    bankName: "Bank",
    raise: 30,
    pricedValuation: 300,
    firstDayPop: 0.1,
    publicValuation: 330,
    founderStakeValue: 0,
  };
  const after = applyIpo(s, {} as Bank, result);
  assert.equal(after.company.stage, "public");
  assert.ok(Math.abs(after.company.financials.cash - (cash0 + 30)) < 1e-9, "primary raise banked");
  assert.equal(after.company.financials.valuation, 330);
  assert.equal(ipoEligible(after), false); // can't re-IPO
});
