// The campus scene's building matrix: every architectural style renders at
// every tier, every crown renders, and the stage→tier ladder is correct.
// SSR-rendered (no browser) so a bad path or NaN coordinate fails loudly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { STYLES, CROWNS, StyleBuilding } from "./architecture";
import { Headquarters, hqTier } from "./hq";
import { IndustryDistrict, type DistrictData } from "./districts";
import { PLAYABLE_SUB_INDUSTRIES } from "@/domain/ids";

const TIERS = ["tower", "highrise", "skyscraper", "megatower"] as const;

test("every style renders at every tier with every crown anchor intact", () => {
  for (const s of STYLES) {
    for (const tier of TIERS) {
      const html = renderToStaticMarkup(
        h("svg", null, h(StyleBuilding, { x: 170, tier, style: s.id, crown: "antenna", trim: "#6f9cff", litPct: 60, towerH: 238, canopy: "#2f6b4f" })),
      );
      assert.ok(html.length > 300, `${s.id}/${tier} renders`);
      assert.ok(!html.includes("NaN"), `${s.id}/${tier} has no NaN coordinates`);
    }
  }
});

test("every crown renders (leafy and winter variants)", () => {
  for (const c of CROWNS) {
    for (const canopy of ["#2f6b4f", null]) {
      const html = renderToStaticMarkup(
        h("svg", null, h(StyleBuilding, { x: 170, tier: "highrise", style: "monolith", crown: c.id, trim: "#3ad29a", litPct: 50, canopy })),
      );
      assert.ok(html.length > 300, `${c.id} renders (canopy: ${canopy})`);
    }
  }
});

test("the stage ladder maps to the right buildings", () => {
  assert.equal(hqTier("idea", false), "garage");
  assert.equal(hqTier("pre_seed", false), "garage");
  assert.equal(hqTier("seed", false), "loft");
  assert.equal(hqTier("series_a", false), "tower");
  assert.equal(hqTier("series_b", false), "tower");
  assert.equal(hqTier("series_c", false), "highrise");
  assert.equal(hqTier("growth", false), "highrise");
  assert.equal(hqTier("public", false), "highrise");
  assert.equal(hqTier("public", true), "skyscraper");
  assert.equal(hqTier("public", true, "titan"), "megatower");
  assert.equal(hqTier("public", true, "sovereign"), "megatower");
});

test("headquarters renders at every tier; all six districts render", () => {
  for (const tier of ["garage", "loft", ...TIERS] as const) {
    const html = renderToStaticMarkup(
      h("svg", null, h(Headquarters, { name: "Helion", color: "#5b82ff", headcount: 24, tier, architecture: { style: "deco", crown: "garden" }, canopy: null, onGo: () => {} })),
    );
    assert.ok(html.length > 300, `${tier} HQ renders`);
  }
  const d: DistrictData = { color: "#5b82ff", hype: 75, owned: { compute: 2, fab_line: 2, ground_network: 3, module_construction: 2 }, building: true, bets: 1, nextShip: 3, launching: false, liveProducts: 3, onGo: () => {} };
  for (const sub of PLAYABLE_SUB_INDUSTRIES) {
    const html = renderToStaticMarkup(h("svg", null, h(IndustryDistrict, { sub, d })));
    assert.ok(html.length > 200, `${sub} district renders`);
  }
});
