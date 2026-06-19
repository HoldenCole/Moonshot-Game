import { test } from "node:test";
import assert from "node:assert/strict";

import { advanceShare, companyGrowthScale, rivalProductQuality, targetShare } from "./productMarket.ts";
import type { Company } from "@/content/load";
import type { ProductTuning } from "@/domain/content";
import type { LiveProduct } from "@/domain/products";

const co = (q: number): Company => ({
  id: "r",
  name: "R",
  tier: "anchor",
  industry: "ai",
  sub_industry: "ai_chips",
  founded_year: -5,
  hq: "SF",
  color: "#fff",
  logo_glyph: "x",
  identity: { tagline: "", reputation: 80, narrative_hooks: [] },
  stage: { status: "public", private_round: "", ipo_year: -1 },
  financials: { revenue: 100, revenue_growth: 0.3, gross_margin: 0.6, profitable: false, burn_monthly: 5, valuation: 1000, shares_out: 100 },
  quality: { fundamentals: q, hype_exposure: 0.6, moat: q, execution: q },
  signature: { benchmark_score: q, signature_notes: "" },
  relationships: { competitors: [], investors: [] },
});

const tuning = (vol: number): ProductTuning => ({
  starting_capacity: 2,
  rd_diminishing_k: 0.8,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: vol,
});

const product = (share: number, quality: number): LiveProduct => ({
  id: "p",
  archetype_id: "p",
  instance_name: "X",
  shipped_week: 0,
  quality,
  age_weeks: 0,
  state: "ramping",
  share,
  revenue_run_rate: 0,
  capacity_run: 1,
});

test("targetShare is 0.5 at parity and moves with the quality gap", () => {
  assert.ok(Math.abs(targetShare(60, 60) - 0.5) < 1e-9);
  assert.ok(targetShare(80, 60) > 0.5);
  assert.ok(targetShare(40, 60) < 0.5);
});

test("rivalProductQuality reads the strongest incumbent, 50 with no rivals", () => {
  assert.equal(rivalProductQuality([co(50), co(80)]), 80);
  assert.equal(rivalProductQuality([]), 50);
});

test("share drifts toward target, faster in volatile industries", () => {
  const p = product(0.2, 80); // target well above 0.2
  const sticky = advanceShare(p, 50, tuning(0.1)).share;
  const volatile = advanceShare(p, 50, tuning(0.25)).share;
  assert.ok(sticky > 0.2 && volatile > 0.2, "both move toward a higher target");
  assert.ok(volatile > sticky, "a hype industry swings faster than a sticky one");
});

test("share eases toward target by a fraction of the gap, never overshooting", () => {
  // Proportional approach: move 13% of the remaining gap, decelerating as it closes.
  const p = product(0.5, 100);
  const target = targetShare(100, 0);
  const next = advanceShare(p, 0, tuning(0.13)).share;
  assert.ok(Math.abs(next - (0.5 + (target - 0.5) * 0.13)) < 1e-9, "13% of the gap");
  assert.ok(next > 0.5 && next < target, "eases in without overshooting");
});

test("the company-size scale damps share growth as revenue climbs (floored)", () => {
  assert.equal(companyGrowthScale(0), 1, "a tiny company grows at full speed");
  assert.ok(companyGrowthScale(3000) < companyGrowthScale(500), "bigger → slower");
  assert.ok(companyGrowthScale(1e9) >= 0.25, "growth never fully stalls (floor)");

  const p = product(0.2, 80);
  const fast = advanceShare(p, 50, tuning(0.2), 1).share;
  const damped = advanceShare(p, 50, tuning(0.2), 0.4).share;
  assert.ok(damped < fast, "a damped (big) company gains share slower");
});
