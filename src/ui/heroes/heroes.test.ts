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

// ── second wave ──
import { ObservatoryHero } from "./ObservatoryHero";
import { OfficeFloorHero, type OfficeSeat } from "./OfficeFloorHero";
import { OrreryHero, type OrreryHolder } from "./OrreryHero";
import { CSuiteHero, type SuiteSeat } from "./CSuiteHero";
import { DealRoomHero, type DealFolder } from "./DealRoomHero";
import { PowerMapHero, type LegacyPlaque, type RaceRow } from "./PowerMapHero";

test("the observatory renders every phase and extreme strength", () => {
  for (const [phase, strength] of [["expansion", 0.9], ["trough", -0.95], ["recovery", 0.1]] as const) {
    const html = renderToStaticMarkup(
      h(ObservatoryHero, { phase, position: 2.2, strength, rate: 4.5, rateTarget: 3.75, sentiment: 62, climate: 55, window: "open", hype: [{ label: "AI", value: 78 }, { label: "Space", value: 61 }], economyScale: 1.34 }),
    );
    assert.ok(html.includes("The Observatory") && !html.includes("NaN"), `${phase} renders`);
  }
});

test("the floor seats execs, marks vacancies, and lights desks by headcount", () => {
  const seats: OfficeSeat[] = [
    { area: "finance", label: "Finance & Capital", name: "Lena Cho", quality: 84, autonomy: "handle" },
    { area: "operations", label: "Operations", autonomy: "decide" },
    { area: "revenue", label: "Revenue", autonomy: "decide" },
    { area: "technical", label: "Technical", name: "Omar Vos", quality: 61, autonomy: "recommend" },
  ];
  const html = renderToStaticMarkup(h(OfficeFloorHero, { founderName: "Alex Rivera", color: "#5b82ff", headcount: 22, seats }));
  assert.ok(html.includes("Lena Cho") && html.includes("VACANT") && html.includes("2/4 SEATS FILLED"));
});

test("the orrery places holders on their rings and never breaks on a fresh table", () => {
  const holders: OrreryHolder[] = [
    { id: "you", name: "You", type: "founder", ownership: 0.62, ring: 0 },
    { id: "vc", name: "Frontier Partners", type: "investor", ownership: 0.2, ring: 1 },
    { id: "pool", name: "Option Pool", type: "pool", ownership: 0.1, ring: 1 },
    { id: "exec", name: "Lena Cho", type: "employee", ownership: 0.02, ring: 2 },
  ];
  const busy = renderToStaticMarkup(h(OrreryHero, { holders, ringNames: ["Founding", "Seed", "Series A"], founderPct: 0.62, color: "#5b82ff" }));
  assert.ok(busy.includes("Frontier Partners") && busy.includes("62%") && !busy.includes("NaN"));
  const fresh = renderToStaticMarkup(h(OrreryHero, { holders: [{ id: "you", name: "You", type: "founder", ownership: 1, ring: 0 }], ringNames: ["Founding"], founderPct: 1, color: "#5b82ff" }));
  assert.ok(fresh.includes("100%"));
});

test("the c-suite fills chairs, flags low morale, and leaves seats open", () => {
  const seats: SuiteSeat[] = [
    { domain: "space_program", label: "Space Program", name: "R. Vance", competence: 88, morale: 0.9 },
    { domain: "capital", label: "Capital Markets", name: "M. Iyer", competence: 71, morale: 0.3 },
    { domain: "gov", label: "Government Affairs" },
  ];
  const html = renderToStaticMarkup(h(CSuiteHero, { seats, marketCount: 6, refreshWeeks: 5 }));
  assert.ok(html.includes("R. Vance") && html.includes("OPEN") && html.includes("6 ON THE MARKET"));
});

test("the deal room dials identity, heats entanglement, and shows empty paper", () => {
  const deals: DealFolder[] = [
    { id: "a", name: "Orbital Cargo IDIQ", weeksLeft: 12, termWeeks: 52, gov: true, perYear: 240 },
    { id: "b", name: "Fleet API", weeksLeft: 40, termWeeks: 52, gov: false, perYear: 90 },
  ];
  const busy = renderToStaticMarkup(h(DealRoomHero, { share: 0.62, identity: "National Champion", entanglement: 44, deals, marketCount: 5, refreshWeeks: 7, clearances: ["defense_secret"] }));
  assert.ok(busy.includes("NATIONAL CHAMPION") && busy.includes("DEFENSE SECRET") && !busy.includes("NaN"));
  const empty = renderToStaticMarkup(h(DealRoomHero, { share: 0, identity: "Independent", entanglement: 0, deals: [], marketCount: 0, refreshWeeks: 13, clearances: [] }));
  assert.ok(empty.includes("NO PAPER SIGNED") && empty.includes("NONE HELD"));
});

test("the map of power runs the race and carves the plaques", () => {
  const race: RaceRow[] = [
    { id: "you", name: "Helion", stature: 22000, phase: "done", surging: false, you: true, color: "#5b82ff" },
    { id: "r1", name: "Kessler Dynamics", stature: 61000, phase: "build", surging: true, color: "#f4716f" },
  ];
  const legacies: LegacyPlaque[] = [
    { id: "l1", name: "The Sunfarm", by: "you" },
    { id: "l2", name: "First Fusion", by: "rival", byName: "Kessler Dynamics" },
    { id: "l3", name: "Mars Landing", by: null },
  ];
  const html = renderToStaticMarkup(h(PowerMapHero, { power: 3.4, reputation: 61, regulation: 28, era: "The Titan Age", race, legacies }));
  assert.ok(html.includes("SURGING") && html.includes("♛ YOU") && html.includes("The Titan Age") && !html.includes("NaN"));
});
