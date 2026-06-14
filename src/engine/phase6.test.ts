import { test } from "node:test";
import assert from "node:assert/strict";

import { buildGraph } from "./companyGraph.ts";
import { fundamentalValue, marketPrice, mispricing } from "./pricing.ts";
import { generateMarket } from "./worldgen.ts";
import type { Company } from "@/content/load";
import type { WorldState } from "@/domain/state";
import type { Industry, SubIndustry } from "@/domain/ids";

function co(
  id: string,
  over: Partial<{
    industry: Industry;
    sub: SubIndustry;
    valuation: number;
    fundamentals: number;
    hype_exposure: number;
    status: "public" | "private";
    competitors: string[];
    suppliers: string[];
    customers: string[];
    investors: string[];
  }> = {},
): Company {
  return {
    id,
    name: id,
    tier: "anchor",
    industry: over.industry ?? "ai",
    sub_industry: over.sub ?? "frontier_model_lab",
    founded_year: -5,
    hq: "San Francisco, CA",
    color: "#fff",
    logo_glyph: "x",
    identity: { tagline: "", reputation: 75, narrative_hooks: ["leads"] },
    stage: { status: over.status ?? "public", private_round: "", ipo_year: -1 },
    financials: {
      revenue: 100,
      revenue_growth: 0.3,
      gross_margin: 0.6,
      profitable: false,
      burn_monthly: 5,
      valuation: over.valuation ?? 1000,
      shares_out: 100,
    },
    quality: { fundamentals: over.fundamentals ?? 70, hype_exposure: over.hype_exposure ?? 0.5, moat: 60, execution: 70 },
    signature: { benchmark_score: 70, signature_notes: "" },
    relationships: {
      competitors: over.competitors,
      suppliers: over.suppliers,
      customers: over.customers,
      investors: over.investors ?? [],
    },
  };
}

const world = (over: Partial<WorldState> = {}): WorldState => ({
  macroPhase: "expansion",
  macroPosition: 0.5,
  macroStrength: 0.3,
  interestRate: 4,
  rateTarget: 4,
  weeksSinceRateReview: 0,
  marketSentiment: 60,
  vcClimate: 60,
  ipoWindow: "open",
  ipoOpenness: 65,
  weeksInIpoWindow: 8,
  hype: { ai: 80, space: 55 },
  ...over,
});

// ── Relationship graph ───────────────────────────────────────────────────────

test("competitor edges are symmetric even when declared one-directionally", () => {
  const g = buildGraph([co("a", { competitors: ["b"] }), co("b")]);
  assert.deepEqual(g.competitorsOf("a"), ["b"]);
  assert.deepEqual(g.competitorsOf("b"), ["a"]);
});

test("supplier and customer edges are reciprocal", () => {
  const g = buildGraph([co("lab", { suppliers: ["chips"] }), co("chips")]);
  assert.deepEqual(g.suppliersOf("lab"), ["chips"]);
  assert.deepEqual(g.customersOf("chips"), ["lab"]);
});

test("co-invested finds companies sharing an investor", () => {
  const g = buildGraph([
    co("a", { investors: ["frontier"] }),
    co("b", { investors: ["frontier"] }),
    co("c", { investors: ["other"] }),
  ]);
  assert.deepEqual(g.coInvested("a").sort(), ["b"]);
  assert.deepEqual(g.companiesBackedBy("frontier").sort(), ["a", "b"]);
});

test("sector peers are same-industry, excluding self", () => {
  const g = buildGraph([co("a", { industry: "ai" }), co("b", { industry: "ai" }), co("c", { industry: "space" })]);
  assert.deepEqual(g.sectorPeers("a").sort(), ["b"]);
});

// ── Pricing ──────────────────────────────────────────────────────────────────

test("market price is deterministic per company + world + week", () => {
  const c = co("x", { hype_exposure: 0.8 });
  assert.equal(marketPrice(c, world(), 10), marketPrice(c, world(), 10));
});

test("high hype lifts a hype-exposed name above fair value", () => {
  const exposed = co("hot", { hype_exposure: 0.9, valuation: 1000 });
  const price = marketPrice(exposed, world({ hype: { ai: 95 } }), 3);
  assert.ok(price > fundamentalValue(exposed), `expected premium, got ${price}`);
  assert.ok(mispricing(exposed, world({ hype: { ai: 95 } }), 3) > 0);
});

test("low hype discounts a hype-exposed name below fair value", () => {
  const exposed = co("cold", { hype_exposure: 0.9, valuation: 1000 });
  assert.ok(mispricing(exposed, world({ hype: { ai: 20 }, macroStrength: -0.2 }), 3) < 0);
});

// ── Procedural generation ────────────────────────────────────────────────────

const anchors = [
  co("openmind", { industry: "ai", fundamentals: 85 }),
  co("cerebra", { industry: "ai", fundamentals: 80 }),
  co("ascent", { industry: "space", sub: "launch_services", fundamentals: 75 }),
  co("vertex", { industry: "biotech", sub: "therapeutics", fundamentals: 72 }),
];

test("generation is deterministic for a given seed", () => {
  const a = generateMarket(123, anchors, ["frontier", "helio"]);
  const b = generateMarket(123, anchors, ["frontier", "helio"]);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("generation fills industries toward their targets with unique names", () => {
  const gen = generateMarket(7, anchors, ["frontier"]);
  const all = [...anchors, ...gen];
  // AI target is 15; with 2 anchors we expect ~13 generated AI companies.
  const ai = all.filter((c) => c.industry === "ai").length;
  assert.ok(ai >= 12 && ai <= 16, `ai count ${ai}`);
  // Names are unique across the whole market.
  const names = new Set(all.map((c) => c.name));
  assert.equal(names.size, all.length);
  // Every generated company is tagged procedural and carries an investor.
  for (const c of gen) {
    assert.equal(c.tier, "procedural");
    assert.ok(c.relationships.investors!.length >= 1);
  }
});

test("procedural fundamentals are biased slightly below the anchor base", () => {
  const gen = generateMarket(42, anchors, []);
  const aiGen = gen.filter((c) => c.industry === "ai");
  const avg = aiGen.reduce((s, c) => s + c.quality.fundamentals, 0) / aiGen.length;
  // Anchor AI base averages ~82; procedural should trend below it.
  assert.ok(avg < 82, `procedural avg ${avg} should be below the anchor base`);
});
