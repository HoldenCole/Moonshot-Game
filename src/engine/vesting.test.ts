import { test } from "node:test";
import assert from "node:assert/strict";

import { CLIFF_WEEKS, VEST_WEEKS, vestedFraction, vestingRows, weeksToFullyVested } from "./vesting.ts";
import { foundCompany } from "./captable.ts";

test("vesting: nothing before the cliff, linear to fully vested at four years", () => {
  assert.equal(vestedFraction(0), 0);
  assert.equal(vestedFraction(CLIFF_WEEKS - 1), 0);
  assert.ok(Math.abs(vestedFraction(CLIFF_WEEKS) - CLIFF_WEEKS / VEST_WEEKS) < 1e-9); // ~25% at the cliff
  assert.equal(vestedFraction(VEST_WEEKS), 1);
  assert.equal(vestedFraction(VEST_WEEKS + 100), 1);
});

test("vesting rows split vested/unvested and flag an unvested co-founder", () => {
  const cap = foundCompany({
    founderId: "you",
    founderName: "You",
    week: 0,
    foundingStage: "pre_seed",
    cofounder: { id: "cf", name: "Sam", sharePct: 0.3 },
  });

  const atCliff = vestingRows(cap, 0, CLIFF_WEEKS);
  const cf = atCliff.find((r) => r.holderType === "cofounder")!;
  assert.ok(cf.vested > 0 && cf.unvested > 0);
  assert.equal(cf.vested + cf.unvested, cf.shares);
  assert.equal(cf.flightRisk, true);

  const fully = vestingRows(cap, 0, VEST_WEEKS).find((r) => r.holderType === "cofounder")!;
  assert.equal(fully.unvested, 0);
  assert.equal(fully.flightRisk, false);
  assert.equal(weeksToFullyVested(0, VEST_WEEKS), 0);
});
