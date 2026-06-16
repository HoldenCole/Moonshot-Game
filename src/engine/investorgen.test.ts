import { test } from "node:test";
import assert from "node:assert/strict";

import { generateInvestors } from "./investorgen.ts";
import type { InvestorContent } from "@/domain/content";
import type { Industry } from "@/domain/ids";

type Investor = InvestorContent["firm"];

function anchor(id: string, sector: Industry): Investor {
  return {
    id,
    name: id,
    tier: "anchor",
    partner_name: `Partner ${id}`,
    hq: "San Francisco, CA",
    identity: { thesis: "Authored thesis.", reputation: 78, trait_tags: ["Seed Specialist"] },
    personality: { aggression: 40, patience: 70, conviction: 75, founder_friendliness: 72, network_strength: 65 },
    focus: { primary_sector: sector, primary_stage: "seed", stage_range: ["pre_seed", "series_a"], stretch_tolerance: 0.5 },
    fund: { fund_name: "Seed Fund I", fund_size: 280, vintage_year: -2, deployment_years: 3, check_min: 0.5, check_max: 12 },
  };
}

const anchors = [anchor("redwood", "ai"), anchor("apex", "space")];

test("generation is deterministic and fills the roster to target", () => {
  const a = generateInvestors(123, anchors, 12);
  const b = generateInvestors(123, anchors, 12);
  assert.equal(a.length, 10); // 12 target − 2 anchors
  assert.deepEqual(a.map((f) => f.id), b.map((f) => f.id));
  assert.deepEqual(a.map((f) => f.name), b.map((f) => f.name));
});

test("generated firms are valid, procedural, and distinct from the anchors", () => {
  const gen = generateInvestors(7, anchors, 16);
  const ids = new Set<string>();
  const names = new Set(anchors.map((a) => a.name.toLowerCase()));
  for (const f of gen) {
    assert.equal(f.tier, "procedural");
    assert.ok(f.id && !ids.has(f.id), "unique id");
    ids.add(f.id);
    assert.ok(!names.has(f.name.toLowerCase()), "name distinct from anchors + each other");
    names.add(f.name.toLowerCase());
    for (const v of Object.values(f.personality)) assert.ok(v >= 5 && v <= 95, `personality ${v} in band`);
    assert.ok(["seed", "series_a", "series_b", "series_c", "growth"].includes(f.focus.primary_stage));
    assert.ok(["ai", "space"].includes(f.focus.primary_sector), "focuses a playable sector");
    assert.ok(f.fund.check_max > f.fund.check_min, "check band is ordered");
    assert.ok(f.identity.trait_tags.length >= 2, "carries trait tags");
    assert.ok(f.identity.reputation >= 40 && f.identity.reputation <= 95);
  }
});

test("the generated roster spreads across funding stages, not just seed", () => {
  const gen = generateInvestors(99, anchors, 18);
  const stages = new Set(gen.map((f) => f.focus.primary_stage));
  assert.ok(stages.size >= 3, `covers multiple stages, got ${[...stages].join(", ")}`);
});

test("a target at or below the anchor count generates nothing", () => {
  assert.equal(generateInvestors(1, anchors, 2).length, 0);
  assert.equal(generateInvestors(1, anchors, 1).length, 0);
});
