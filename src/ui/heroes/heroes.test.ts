// The per-screen hero scenes render from plain data (SSR, no browser): the
// Exchange chart survives short/flat histories, the bank hall lights every
// climate, the constellation maps every node state, the Works fills bays.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExchangeHero, tickNoise } from "./ExchangeHero";
import { BankHero } from "./BankHero";
import { ResearchHero, type ConstellationNode } from "./ResearchHero";
import { MegaHero, type MegaWork } from "./MegaHero";

test("the Exchange renders (rich history, one-point history, movers)", () => {
  const points = Array.from({ length: 40 }, (_, i) => ({ week: i, composite: 40 + Math.sin(i / 5) * 20 }));
  const movers = [
    { id: "a", name: "Nova Silicon", delta: 2.9 },
    { id: "b", name: "OpenMind", delta: -3.2 },
  ];
  for (const pts of [points, points.slice(0, 1)]) {
    const html = renderToStaticMarkup(h(ExchangeHero, { points: pts, window: "open", rate: 4.5, movers }));
    assert.ok(html.includes("Frontier Composite") && !html.includes("NaN"), `renders with ${pts.length} points`);
  }
  assert.equal(tickNoise("x", 3), tickNoise("x", 3), "noise is deterministic");
  assert.notEqual(tickNoise("x", 3), tickNoise("x", 4), "noise moves week to week");
});

test("the bank hall lights every climate and window state", () => {
  for (const climate of [10, 50, 90]) {
    for (const win of ["open", "cracking", "closed"] as const) {
      const html = renderToStaticMarkup(h(BankHero, { climate, rate: 4.5, window: win, stage: "series_a", valuation: 60, roundSize: 12 }));
      assert.ok(html.includes("Capital Row") && !html.includes("NaN"), `climate ${climate} / ${win}`);
    }
  }
});

test("the constellation maps all four node states and draws prereq edges", () => {
  const nodes: ConstellationNode[] = [
    { id: "a", name: "A", kind: "applied", prereqs: [], state: "complete" },
    { id: "b", name: "B", kind: "advanced", prereqs: ["a"], state: "in_progress" },
    { id: "c", name: "C", kind: "frontier", prereqs: ["b"], state: "available" },
    { id: "d", name: "D", kind: "cross_domain", prereqs: ["c"], state: "locked" },
  ];
  const html = renderToStaticMarkup(h(ResearchHero, { nodes }));
  assert.ok(html.includes("1 complete") && html.includes("1 running") && html.includes("1 in reach"));
  assert.ok((html.match(/<line/g) ?? []).length >= 3, "edges drawn");
});

test("the Works renders active bays and the empty ghost state", () => {
  const works: MegaWork[] = [
    { id: "orbital_solar_array", name: "The Sunfarm", branch: "space", progress: 0.4, stageName: "Assembly", copy: 1 },
    { id: "national_lab", name: "The Lab", branch: "intelligence", progress: 0.9, stageName: "Commissioning", copy: 2 },
  ];
  const busy = renderToStaticMarkup(h(MegaHero, { works, done: [{ name: "The Sunfarm", count: 1 }], slots: { used: 2, total: 3 } }));
  assert.ok(busy.includes("THE SUNFARM") && busy.includes("40%") && busy.includes("1 STANDING"));
  const empty = renderToStaticMarkup(h(MegaHero, { works: [], done: [], slots: { used: 0, total: 1 } }));
  assert.ok(empty.includes("AWAITING GROUNDBREAK"));
});
