import { test } from "node:test";
import assert from "node:assert/strict";

import { adoptionWave, betBuildWeeks, iterationBuildFactor, lifecycleState, nextTamScale, productQuality, productRevenueRunRate, productGrossProfit, tickProduct, MATURE_WINDOW } from "./products.ts";
import type { ProductArchetype, ProductTuning, RDLine } from "@/domain/content";
import type { LiveProduct } from "@/domain/products";

const line = (id: string, drives: string[]): RDLine => ({
  id,
  sub_industry: "ai_chips",
  name: id,
  description: "",
  starting_level: 0,
  base_cost_per_quarter: 8,
  drives_specs: drives,
});

const archetype = (over: Partial<ProductArchetype["economics"]> = {}, specs: Record<string, number> = { performance: 0.6, efficiency: 0.4 }): ProductArchetype => ({
  id: "p",
  sub_industry: "ai_chips",
  name: "P",
  tier: 1,
  description: "",
  gates: {},
  economics: {
    build_cost: 40,
    build_weeks: 60,
    unit_margin: 0.5,
    capacity_type: "fab_line",
    capacity_to_build: 1,
    capacity_to_run: 1,
    addressable_market: 1000,
    ramp_weeks: 20,
    decay_per_quarter: 0.1,
    ...over,
  },
  specs,
});

const tuning = (): ProductTuning => ({
  starting_capacity: 2,
  rd_diminishing_k: 0.8,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.15,
});

const product = (over: Partial<LiveProduct> = {}): LiveProduct => ({
  id: "prod",
  archetype_id: "p",
  instance_name: "X",
  shipped_week: 0,
  quality: 60,
  age_weeks: 0,
  state: "ramping",
  share: 0.2,
  revenue_run_rate: 0,
  capacity_run: 1,
  ...over,
});

test("quality is the spec-weighted average of the driving lines' levels", () => {
  const lines = [line("a", ["performance"]), line("b", ["efficiency"])];
  // 0.6*60 + 0.4*40 = 52
  assert.ok(Math.abs(productQuality(archetype(), lines, { a: 60, b: 40 }) - 52) < 1e-9);
});

test("lifecycle goes ramping → mature → declining off age", () => {
  const a = archetype(); // ramp_weeks 20
  assert.equal(lifecycleState(10, a), "ramping");
  assert.equal(lifecycleState(20, a), "mature");
  assert.equal(lifecycleState(20 + MATURE_WINDOW - 1, a), "mature");
  assert.equal(lifecycleState(20 + MATURE_WINDOW, a), "declining");
});

test("revenue ramps up across the ramp window — grows between bets (bug #3 guard)", () => {
  const a = archetype(); // ramp 20, addressable 1000, share 0.2 → peak 200
  const r5 = productRevenueRunRate(product({ age_weeks: 5 }), a, tuning());
  const r15 = productRevenueRunRate(product({ age_weeks: 15 }), a, tuning());
  const rPeak = productRevenueRunRate(product({ age_weeks: 25 }), a, tuning());
  assert.ok(r5 < r15 && r15 < rPeak, "run-rate rises every week of the ramp with no new event");
  assert.ok(Math.abs(rPeak - 200) < 1e-9, "matures at share × addressable market");
});

test("the revenue ramp is front-loaded — a quarter into the window, past a quarter of peak", () => {
  const a = archetype(); // ramp 20, peak = share 0.2 × 1000 = 200
  const quarterIn = productRevenueRunRate(product({ age_weeks: 5 }), a, tuning()); // t = 0.25
  assert.ok(quarterIn > 0.25 * 200, "climbs faster than a straight line early");
  assert.ok(quarterIn < 200, "but hasn't reached the plateau yet");
});

test("iterationBuildFactor lengthens later builds — flat early, rising, then capped", () => {
  assert.equal(iterationBuildFactor(0), 1, "the first build is at baseline");
  assert.ok(iterationBuildFactor(3) < iterationBuildFactor(8), "later iterations take longer");
  assert.ok(iterationBuildFactor(50) <= 3 + 1e-9, "capped at the max");
  const a = archetype({ build_weeks: 20 });
  assert.ok(betBuildWeeks(a, tuning(), 10) > betBuildWeeks(a, tuning(), 0), "the 11th build is slower than the 1st");
});

test("the adoption wave runs fast → slow → fast again over its period", () => {
  assert.ok(adoptionWave(0) > adoptionWave(4), "fast at the crest, easing by year 4");
  assert.ok(adoptionWave(8) < adoptionWave(4), "slowest at the saturation trough (~half period)");
  assert.ok(adoptionWave(16) > adoptionWave(8), "a new wave reignites growth");
  assert.ok(Math.abs(adoptionWave(0) - adoptionWave(16)) < 1e-9, "one full period returns to the crest");
});

test("nextTamScale follows the adoption wave: fast early, slow at saturation; flat when ungrown", () => {
  assert.equal(nextTamScale(1, 0, 0, 0), 1, "a flat sector (peak 0) never moves");
  const early = nextTamScale(1, 0.3, 26, 0) - 1; // ~year 0.5, near the crest
  const sat = nextTamScale(1, 0.3, 8 * 52, 0) - 1; // ~year 8, the saturation trough
  assert.ok(early > sat, "adoption is faster early than at saturation");
  assert.ok(sat > 0, "even saturated, the market still creeps up");
  assert.ok(nextTamScale(1, 0.3, 26, 1) > nextTamScale(1, 0.3, 26, -1), "booms expand TAM faster than busts");
});

test("a growing TAM lifts a product's revenue proportionally", () => {
  const a = archetype(); // peak (share 0.2 × 1000) = 200
  const base = productRevenueRunRate(product({ age_weeks: 25 }), a, tuning());
  const grown = productRevenueRunRate(product({ age_weeks: 25 }), a, tuning(), 2); // TAM doubled
  assert.ok(Math.abs(grown - base * 2) < 1e-9, "double the TAM, double the revenue");
});

test("revenue decays after the mature plateau", () => {
  const a = archetype();
  const peak = productRevenueRunRate(product({ age_weeks: 30 }), a, tuning());
  const late = productRevenueRunRate(product({ age_weeks: 20 + MATURE_WINDOW + 26 }), a, tuning());
  assert.ok(late < peak, "obsolescence eats the run-rate once declining");
});

test("gross profit applies the unit margin", () => {
  const a = archetype({ unit_margin: 0.5 });
  const p = product({ age_weeks: 25 }); // peak 200
  assert.ok(Math.abs(productGrossProfit(p, a, tuning()) - 100) < 1e-9);
});

test("tickProduct ages the product and re-caches the run-rate", () => {
  const a = archetype();
  const t1 = tickProduct(product({ age_weeks: 9 }), a, tuning());
  assert.equal(t1.age_weeks, 10);
  assert.ok(t1.revenue_run_rate > 0);
  const t2 = tickProduct(t1, a, tuning());
  assert.ok(t2.revenue_run_rate > t1.revenue_run_rate, "still ramping → keeps growing");
});
