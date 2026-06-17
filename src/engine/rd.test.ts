import { test } from "node:test";
import assert from "node:assert/strict";

import { advanceRD, initRDState, rdLineDelta, rivalFrontierLevel, LEVEL_CAP } from "./rd.ts";
import type { Company } from "@/content/load";
import type { ProductTuning, RDLine } from "@/domain/content";

function co(over: { execution?: number; fundamentals?: number; moat?: number; benchmark?: number } = {}): Company {
  return {
    id: "rival",
    name: "Rival",
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
    quality: { fundamentals: over.fundamentals ?? 70, hype_exposure: 0.6, moat: over.moat ?? 60, execution: over.execution ?? 70 },
    signature: { benchmark_score: over.benchmark ?? 75, signature_notes: "" },
    relationships: { competitors: [], investors: [] },
  };
}

const line = (id: string, drives: string[], starting = 20, base = 8): RDLine => ({
  id,
  sub_industry: "ai_chips",
  name: id,
  description: "",
  starting_level: starting,
  base_cost_per_quarter: base,
  drives_specs: drives,
});

const tuning = (over: Partial<ProductTuning> = {}): ProductTuning => ({
  starting_capacity: 2,
  rd_diminishing_k: 0.8,
  frontier_pull: 1.3,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.15,
  ...over,
});

test("R&D gains diminish as the level climbs (same spend, no frontier gap)", () => {
  const low = rdLineDelta(20, 1, 8, 0.8, 1.3, 0); // rival behind → no pull
  const high = rdLineDelta(80, 1, 8, 0.8, 1.3, 0);
  assert.ok(low > high, "a high level gains less per dollar than a low one");
  assert.ok(high > 0, "but still makes some progress");
});

test("frontier pull boosts catch-up when rivals are ahead", () => {
  const even = rdLineDelta(20, 1, 8, 0.8, 1.3, 0); // no one ahead
  const behind = rdLineDelta(20, 1, 8, 0.8, 1.3, 60); // rival 40 levels ahead
  assert.ok(behind > even, "being behind the frontier accelerates progress");
  // With frontier_pull = 1 there's no catch-up bonus at all.
  assert.ok(Math.abs(rdLineDelta(20, 1, 8, 0.8, 1.0, 60) - even) < 1e-9);
});

test("an unfunded line, or zero base cost, makes no progress", () => {
  assert.equal(rdLineDelta(20, 0, 8, 0.8, 1.3, 0), 0);
  assert.equal(rdLineDelta(20, 1, 0, 0.8, 1.3, 0), 0);
});

test("advanceRD raises funded lines, skips unfunded ones, and is deterministic", () => {
  const lines = [line("a", ["performance"]), line("b", ["margin"])];
  const rd = { levels: { a: 20, b: 20 }, allocation: { a: 1, b: 0 }, rd_budget_per_week: 2 };
  const rivals = { a: 0, b: 0 };
  const next = advanceRD(rd, lines, tuning(), rivals);
  assert.ok(next.levels.a! > 20, "funded line a advanced");
  assert.equal(next.levels.b, 20, "unfunded line b did not");
  // Pure: same inputs → identical output.
  assert.deepEqual(advanceRD(rd, lines, tuning(), rivals), next);
});

test("levels are capped at LEVEL_CAP", () => {
  const lines = [line("a", ["performance"], 99)];
  const rd = { levels: { a: 99 }, allocation: { a: 1 }, rd_budget_per_week: 999 };
  const next = advanceRD(rd, lines, tuning(), { a: 0 });
  assert.equal(next.levels.a, LEVEL_CAP);
});

test("rivalFrontierLevel reads the strongest rival on the line's dimensions", () => {
  const perfLine = line("a", ["performance"]); // → benchmark_score
  const weak = co({ benchmark: 50 });
  const strong = co({ benchmark: 90 });
  assert.equal(rivalFrontierLevel(perfLine, [weak, strong]), 90);
  assert.equal(rivalFrontierLevel(perfLine, []), 0); // no rivals → no frontier
});

test("initRDState seeds levels at each line's start with an even budget split", () => {
  const lines = [line("a", ["x"], 25), line("b", ["y"], 30)];
  const rd = initRDState(lines);
  assert.equal(rd.levels.a, 25);
  assert.equal(rd.levels.b, 30);
  assert.ok(Math.abs(rd.allocation.a! - 0.5) < 1e-9);
  assert.equal(rd.rd_budget_per_week, 0);
});
