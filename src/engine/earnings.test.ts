import { test } from "node:test";
import assert from "node:assert/strict";

import {
  applyPublicChoice,
  earningsMove,
  earningsResult,
  guidanceWindowOpen,
  justClosedQuarter,
  quarterCloseTick,
  settleQuarter,
  weeksPublic,
} from "./earnings.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";

function publicCo(): GameState {
  const g = createNewGame(
    { founderName: "You", companyName: "Helion", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 5 },
    "2026-01-01T00:00:00Z",
  );
  g.company.stage = "public";
  g.company.publicSince = 0;
  g.company.earnings = { gap: 0, guidance: "inline" };
  g.company.financials.valuation = 600;
  return g;
}

test("the quarterly clock: guidance window mid-quarter, results at close", () => {
  const g = publicCo();
  const at = (wk: number) => ({ ...g, clock: { week: wk } });
  assert.equal(weeksPublic(at(7)), 7);
  assert.equal(guidanceWindowOpen(at(7)), true); // week 7 ≈ mid-quarter
  assert.equal(quarterCloseTick(at(7)), false);
  assert.equal(quarterCloseTick(at(13)), true); // first quarter closes
  assert.equal(quarterCloseTick(at(26)), true);
  assert.equal(quarterCloseTick(at(4)), false); // before the first full quarter
});

test("a quarter close settles the print, reacts the stock, and records both", () => {
  const g = publicCo();
  assert.equal(justClosedQuarter({ ...g, clock: { week: 13 } }), true);
  assert.equal(justClosedQuarter({ ...g, clock: { week: 7 } }), false); // mid-quarter
  const after = settleQuarter({ ...g, clock: { week: 13 } });
  const e = after.company.earnings!;
  assert.ok(["beat", "met", "missed"].includes(e.lastResult!));
  assert.equal(e.lastMove, earningsMove(e.lastResult!));
  assert.equal(after.company.financials.valuation, Math.max(1, Math.round(g.company.financials.valuation * (1 + e.lastMove!))));
});

test("engineering the beat widens the hidden gap and costs integrity", () => {
  let g = publicCo();
  const e0 = g.founder.ethics;
  g = applyPublicChoice(g, "earnings_engineer_aggressive");
  assert.ok(g.company.earnings!.gap > 0.2);
  assert.ok(g.founder.ethics < e0);

  // ...and investing for the long term narrows it back and restores integrity
  const beforeGap = g.company.earnings!.gap;
  g = applyPublicChoice(g, "earnings_invest_longterm");
  assert.ok(g.company.earnings!.gap < beforeGap);
  assert.ok(g.founder.ethics > e0 - 6);
});

test("setting guidance records the stance; the reset caps the gap", () => {
  let g = publicCo();
  g = applyPublicChoice(g, "guidance_stretch");
  assert.equal(g.company.earnings!.guidance, "stretched");
  g.company.earnings!.gap = 0.8;
  g = applyPublicChoice(g, "guide_down_clean_reset");
  assert.ok(g.company.earnings!.gap <= 0.1);
});

test("selling the stake at lockup banks personal cash and shrinks the founder lot", () => {
  const g = publicCo();
  const founderShares0 = g.company.capTable.lots.find((l) => l.holderType === "founder")!.shares;
  const after = applyPublicChoice(g, "lockup_sell_heavy");
  assert.ok(after.founder.personalCash > 0, "banked proceeds");
  const founderShares1 = after.company.capTable.lots.find((l) => l.holderType === "founder")!.shares;
  assert.ok(founderShares1 < founderShares0, "founder lot shrank");
  assert.ok(after.company.financials.valuation < g.company.financials.valuation, "heavy selling pressured the stock");
});

test("the earnings result is deterministic and stance-sensitive", () => {
  const g = publicCo();
  const sandbag = { ...g, company: { ...g.company, earnings: { gap: 0, guidance: "sandbagged" as const } }, clock: { week: 13 } };
  const stretch = { ...g, company: { ...g.company, earnings: { gap: 0, guidance: "stretched" as const } }, clock: { week: 13 } };
  // deterministic
  assert.equal(earningsResult(sandbag), earningsResult(sandbag));
  // sandbagging beats more often than stretching, sampled across quarters
  let sb = 0, st = 0;
  for (let q = 1; q < 40; q++) {
    const wk = q * 13;
    if (earningsResult({ ...sandbag, clock: { week: wk } }) === "beat") sb++;
    if (earningsResult({ ...stretch, clock: { week: wk } }) === "beat") st++;
  }
  assert.ok(sb > st, `sandbag beats (${sb}) should exceed stretch beats (${st})`);
});
