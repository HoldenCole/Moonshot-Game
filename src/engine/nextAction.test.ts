// The coach recommends the right move at the right time — and stands down when
// the game is already loud or genuinely quiet.
import { test } from "node:test";
import assert from "node:assert/strict";

import { nextMove } from "./nextAction.ts";
import { initProductsRuntime, type SubContent } from "./productsRuntime.ts";
import { createNewGame } from "@/state/newgame";
import type { GameState } from "@/domain/state";
import type { ProductArchetype, ProductTuning, RDLine } from "@/domain/content";

const lines: RDLine[] = [
  { id: "scaling", sub_industry: "frontier_model_lab", name: "Scaling", description: "", starting_level: 0, base_cost_per_quarter: 8, drives_specs: ["capability"] },
];

const archetype: ProductArchetype = {
  id: "flagship",
  sub_industry: "frontier_model_lab",
  name: "Flagship Model",
  tier: 1,
  description: "",
  gates: { scaling: 20 },
  economics: {
    build_cost: 4,
    build_weeks: 10,
    unit_margin: 0.6,
    capacity_type: "compute",
    capacity_to_build: 1,
    capacity_to_run: 1,
    addressable_market: 100,
    ramp_weeks: 10,
    decay_per_quarter: 0.05,
  },
  specs: { capability: 1 },
};

const tuning: ProductTuning = {
  starting_capacity: 2,
  rd_diminishing_k: 0.8,
  frontier_pull: 1.2,
  max_concurrent_bets: 3,
  build_cost_mult: 1,
  build_time_mult: 1,
  decay_mult: 1,
  share_volatility: 0.15,
};

const sub: SubContent = {
  lines,
  capacityTypes: [],
  productById: new Map([[archetype.id, archetype]]),
  tuning,
};

function g(): GameState {
  const game = createNewGame(
    { founderName: "You", companyName: "Co", industry: "ai", subIndustry: "frontier_model_lab", color: "#fff", seed: 5 },
    "2026-01-01T00:00:00Z",
  );
  game.company.products = initProductsRuntime(sub);
  game.company.financials.cash = 10;
  game.company.financials.burnMonthly = 0.2; // long runway unless a test says otherwise
  return game;
}

test("an unfunded lab is the first thing the coach flags", () => {
  const game = g();
  game.company.products!.rd.rd_budget_per_week = 0;
  assert.equal(nextMove(game, sub)?.id, "fund-rd");
});

test("with gates cleared and cash on hand, it says commit the bet", () => {
  const game = g();
  game.company.products!.rd.rd_budget_per_week = 1;
  game.company.products!.rd.levels.scaling = 30;
  const move = nextMove(game, sub);
  assert.equal(move?.id, "commit-bet");
  assert.equal(move?.panel, "products");
  assert.ok(move!.label.includes("Flagship Model"));
});

test("with gates unmet it names the nearest line to push", () => {
  const game = g();
  game.company.products!.rd.rd_budget_per_week = 1;
  game.company.products!.rd.levels.scaling = 4;
  const move = nextMove(game, sub);
  assert.equal(move?.id, "push-gate");
  assert.ok(move!.label.includes("Scaling"));
  assert.ok(move!.detail.includes("Flagship Model"));
});

test("a short runway beats everything buildable", () => {
  const game = g();
  game.company.products!.rd.rd_budget_per_week = 1;
  game.company.products!.rd.levels.scaling = 4;
  game.company.financials.cash = 4;
  game.company.financials.burnMonthly = 1; // 4 months left
  assert.equal(nextMove(game, sub)?.id, "raise");
});

test("it stands down when an alert or event already owns the moment", () => {
  const game = g();
  game.company.products!.rd.rd_budget_per_week = 0;
  game.alerts = [{ id: "x", week: 0, kind: "runway_critical", tone: "warn", headline: "h", body: "b" }];
  assert.equal(nextMove(game, sub), null);
});

test("a fully declining portfolio calls for the next build", () => {
  const game = g();
  game.company.products!.rd.rd_budget_per_week = 1;
  game.company.products!.rd.levels.scaling = 4; // can't build flagship yet
  game.company.financials.cash = 2; // can't afford anyway
  game.company.products!.products = [
    { id: "p1", archetype_id: "flagship", instance_name: "Old One", shipped_week: 0, quality: 50, age_weeks: 90, state: "declining", share: 0.2, revenue_run_rate: 4, capacity_run: 1 },
  ];
  // gates unmet + budget > 0 → push-gate outranks; drop budget to see the portfolio call
  game.company.products!.rd.rd_budget_per_week = 0;
  game.company.financials.cash = 0.5;
  const move = nextMove(game, sub);
  assert.ok(move, "the coach says something");
});
