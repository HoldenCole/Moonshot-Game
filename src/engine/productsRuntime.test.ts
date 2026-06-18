import { test } from "node:test";
import assert from "node:assert/strict";

import { advanceProducts, buyCapacityRung, commitBet, initProductsRuntime, productsOperatingRevenue, type SubContent } from "./productsRuntime.ts";
import { makeBet } from "./products.ts";
import { createNewGame } from "@/state/newgame";
import type { CapacityRung, CapacityType, ProductArchetype, ProductTuning, RDLine } from "@/domain/content";
import type { GameState } from "@/domain/state";

const line = (id: string, drives: string[]): RDLine => ({
  id,
  sub_industry: "ai_chips",
  name: id,
  description: "",
  starting_level: 20,
  base_cost_per_quarter: 8,
  drives_specs: drives,
});

const rungs: CapacityRung[] = [2, 4, 7, 11, 16, 22].map((capacity, i) => ({ capacity, cost: (i + 1) * 50, build_weeks: 4 + i }));
const cap: CapacityType = { id: "fab", sub_industry: "ai_chips", name: "Fab", unit_label: "line", description: "", rungs };

const arch: ProductArchetype = {
  id: "p",
  sub_industry: "ai_chips",
  name: "P",
  tier: 1,
  description: "",
  gates: { a: 10 },
  economics: {
    build_cost: 40,
    build_weeks: 2,
    unit_margin: 0.5,
    capacity_type: "fab",
    capacity_to_build: 1,
    capacity_to_run: 1,
    addressable_market: 1000,
    ramp_weeks: 4,
    decay_per_quarter: 0.05,
  },
  specs: { performance: 0.6, efficiency: 0.4 },
};

const tuning: ProductTuning = {
  starting_capacity: 5,
  rd_diminishing_k: 0.7,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.2,
};

const content: SubContent = {
  lines: [line("a", ["performance"]), line("b", ["efficiency"])],
  capacityTypes: [cap],
  productById: new Map([["p", arch]]),
  tuning,
};

test("initProductsRuntime seeds R&D + capacity and starts empty", () => {
  const rt = initProductsRuntime(content);
  assert.equal(rt.rd.levels.a, 20);
  assert.equal(rt.capacity.owned.fab, 5);
  assert.deepEqual(rt.bets, []);
  assert.deepEqual(rt.products, []);
});

test("advanceProducts progresses funded R&D each week", () => {
  let rt = initProductsRuntime(content);
  rt = { ...rt, rd: { ...rt.rd, rd_budget_per_week: 4, allocation: { a: 1, b: 0 } } };
  const before = rt.rd.levels.a!;
  const next = advanceProducts(rt, content, [], 1).runtime;
  assert.ok(next.rd.levels.a! > before, "funded line a advanced");
  assert.equal(next.rd.levels.b, 20, "unfunded line b held");
});

test("a committed bet ships a product, which then earns ramping revenue", () => {
  let rt = initProductsRuntime(content);
  rt = { ...rt, bets: [makeBet(arch, "Chip One", "create", { a: 50, b: 50 }, 0, tuning)] };
  assert.equal(productsOperatingRevenue(rt, content.productById, tuning), 0);

  // build_weeks 2 → ships on the second advance.
  rt = advanceProducts(rt, content, [], 1).runtime;
  assert.equal(rt.products.length, 0, "still building");
  const shipTick = advanceProducts(rt, content, [], 2);
  rt = shipTick.runtime;
  assert.equal(rt.products.length, 1, "shipped");
  assert.equal(rt.bets.length, 0, "bet left the queue");
  assert.deepEqual(shipTick.shipped, [{ name: "Chip One", archetypeId: "p" }]);

  // Ramp a few weeks; the product takes share and revenue grows from zero.
  let rev0 = productsOperatingRevenue(rt, content.productById, tuning);
  for (let i = 0; i < 4; i++) {
    rt = advanceProducts(rt, content, [], 3 + i).runtime;
    const rev = productsOperatingRevenue(rt, content.productById, tuning);
    assert.ok(rev >= rev0, "revenue is non-decreasing across the ramp");
    rev0 = rev;
  }
  assert.ok(rev0 > 0, "the live product earns operating revenue");
});

function gameWithRuntime(): GameState {
  const s = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "ai_chips", color: "#fff", seed: 3 },
    "2026-01-01T00:00:00Z",
  );
  s.company.products = initProductsRuntime(content);
  s.company.financials = { ...s.company.financials, cash: 200 };
  return s;
}

test("commitBet pays cash + queues a bet, and no-ops when gates aren't met", () => {
  const s = gameWithRuntime();
  s.company.products!.rd.levels = { a: 50, b: 50 }; // clears the a:10 gate
  const after = commitBet(s, content, "p", "My Chip");
  assert.equal(after.company.products!.bets.length, 1);
  assert.equal(after.company.products!.bets[0]!.instance_name, "My Chip");
  assert.ok(after.company.financials.cash < 200, "build cost paid");

  // Gated: levels below the requirement → unchanged state.
  const low = { ...s, company: { ...s.company, products: { ...s.company.products!, rd: { ...s.company.products!.rd, levels: { a: 1, b: 1 } } } } };
  assert.equal(commitBet(low, content, "p", "X"), low);
});

test("buyCapacityRung pays cash + schedules a build; a no-op when short", () => {
  const s = gameWithRuntime();
  const after = buyCapacityRung(s, content, "fab");
  assert.equal(after.company.products!.capacity.builds_in_progress.length, 1);
  assert.ok(after.company.financials.cash < 200, "rung cost paid");

  const broke = { ...s, company: { ...s.company, financials: { ...s.company.financials, cash: 0 } } };
  assert.equal(buyCapacityRung(broke, content, "fab"), broke);
});
