// Validates the runtime glue between the base game and the late slice: the
// snapshot builder, the boot handoff, and the 4-week turn loop (exec layer +
// advanceTurn + report accumulation). Content loads through the repo's fs path.
import { test } from "node:test";
import assert from "node:assert/strict";
import { assembleLateContent } from "./nodeContent.ts";
import {
  loadSubEconomies, loadSynergies, loadContracts, loadPowerEvents, loadSubEvents,
  loadResearchNodes, loadMegaprojects, loadRivals, megaMetaFrom, loadEras,
  loadCycleTuning, loadPressures, loadExecutives,
} from "./content_loader.ts";
import { pressureTriggerMap } from "./pacing.ts";
import type { GameContent } from "./turn.ts";
import { bootLate, runLateTurn, lateSnapshot, lateTurnsDue } from "./runtime.ts";
import type { PlayerCompany } from "@/domain/state";

function content(): GameContent {
  const raw = assembleLateContent();
  const contracts = loadContracts(raw.contracts as never);
  const megaprojects = loadMegaprojects(raw.megaprojects as never);
  const rivals = loadRivals(raw.rivals as never);
  const pressures = loadPressures(raw.pressures as never);
  return {
    researchNodes: loadResearchNodes(raw.research as never), megaprojects,
    subEconomies: loadSubEconomies(raw.sub_economies as never),
    synergies: loadSynergies(raw.synergies as never),
    contractTemplates: contracts.templates, customers: contracts.customers,
    powerEvents: loadPowerEvents(raw.events_power as never),
    subEvents: loadSubEvents(raw.events_sub as never),
    worldEvents: loadSubEvents(raw.events_world as never),
    rivalDefs: rivals.defs, rivalTuning: rivals.tuning, megaMeta: megaMetaFrom(megaprojects),
    eras: loadEras(raw.eras as never), cycleTuning: loadCycleTuning(raw.cycles as never),
    pressures, pressureTriggers: pressureTriggerMap(Object.values(pressures)),
  };
}

function execContent() {
  return loadExecutives(assembleLateContent().executives as never);
}

/** A minimal company — lateSnapshot only reads sub, valuation, cash, products. */
function company(valuation: number, cash: number): PlayerCompany {
  return {
    subIndustry: "frontier_model_lab",
    financials: { valuation, cash },
    products: { rd: { levels: { scaling: 40, alignment: 30, data_quality: 25 } }, products: [] },
  } as unknown as PlayerCompany;
}

test("lateSnapshot maps the base company into the bridge snapshot", () => {
  const snap = lateSnapshot(company(3000, 500), new Map());
  assert.equal(snap.valuationM, 3000);
  assert.equal(snap.cashM, 500);
  assert.deepEqual(snap.subIndustriesOperated, ["frontier_model_lab"]);
  assert.equal(snap.rdLevelsBySub.frontier_model_lab!.scaling, 40);
});

test("bootLate births a scale-up slice with a seeded candidate market", () => {
  const late = bootLate(content(), execContent(), lateSnapshot(company(3000, 500), new Map()), 42, 60);
  assert.equal(late.slice.era, "scaleup"); // $2B ≤ 3B < $15B
  assert.equal(late.slice.stature, 3000);
  assert.equal(late.birthWeek, 60);
  assert.ok(late.execs.market.length > 0, "a candidate market is seeded to hire from");
  assert.equal(late.reports.length, 0);
});

test("runLateTurn advances 4-week turns, accumulates reports, and pacing is due-correct", () => {
  const c = content();
  const ec = execContent();
  const snap = lateSnapshot(company(3000, 500), new Map());
  let late = bootLate(c, ec, snap, 42, 0);

  let cash = 500;
  for (let i = 0; i < 10; i++) {
    const r = runLateTurn(late, c, ec, { ...snap, cashM: cash }, 42);
    late = r.late;
    cash += r.report.netCash;
    assert.equal(r.report.week, (i + 1) * 4, "the late clock ticks 4 weeks per turn");
  }
  assert.equal(late.slice.week, 40);
  assert.equal(late.reports.length, 10, "reports accumulate (capped ring)");
  // Ten turns are due by base week 40 for a slice born at week 0.
  assert.equal(lateTurnsDue(late, 40), 10);
  assert.equal(lateTurnsDue(late, 41), 10);
  assert.equal(lateTurnsDue(late, 44), 11);
});
