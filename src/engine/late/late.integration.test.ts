// ============================================================================
// late.integration.test.ts — the late-game stack running INSIDE the repo:
// real TOML through the repo's own smol-toml path -> loaders -> bridge ->
// 600 weeks of turns. Proves the whole system functions in this codebase.
// ============================================================================
import { test } from "node:test";
import assert from "node:assert/strict";
import { assembleLateContent } from "./nodeContent.ts";
import { loadSubEconomies, loadSynergies, loadContracts, loadPowerEvents, loadSubEvents,
         loadResearchNodes, loadMegaprojects, loadRivals, megaMetaFrom,
         loadEras, loadCycleTuning, loadPressures, loadExecutives } from "./content_loader.ts";
import { GameContent, advanceTurn } from "./turn.ts";
import { initLateSlice, syncFromBase, BaseSnapshot } from "./bridge.ts";
import { pressureTriggerMap } from "./pacing.ts";
import { takeContract, refreshMarket } from "./contracts.ts";
import { checkGate, beginMega } from "./megaprojects.ts";

function rng(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

test("late-game content loads through the repo's smol-toml path", () => {
  const raw = assembleLateContent();
  const contracts = loadContracts(raw.contracts as never);
  const nodes = loadResearchNodes(raw.research as never);
  const megas = loadMegaprojects(raw.megaprojects as never);
  const execs = loadExecutives(raw.executives as never);
  assert.equal(Object.keys(nodes).length, 82);
  assert.equal(Object.keys(megas).length, 11);
  assert.equal(Object.keys(contracts.templates).length, 30);
  assert.equal(loadPowerEvents(raw.events_power as never).length, 23);
  assert.equal(loadSubEvents(raw.events_sub as never).length, 66);
  assert.equal(loadSubEvents(raw.events_world as never).length, 24);
  assert.equal(Object.keys(loadRivals(raw.rivals as never).defs).length, 6);
  assert.equal(Object.keys(execs.archetypes).length, 14);
  assert.equal(loadEras(raw.eras as never).length, 4);
});

test("800-week campaign runs on the bridge inside the repo", () => {
  const raw = assembleLateContent();
  const contracts = loadContracts(raw.contracts as never);
  const megaprojects = loadMegaprojects(raw.megaprojects as never);
  const rivals = loadRivals(raw.rivals as never);
  const pressures = loadPressures(raw.pressures as never);
  const content: GameContent = {
    researchNodes: loadResearchNodes(raw.research as never), megaprojects,
    subEconomies: loadSubEconomies(raw.sub_economies as never),
    synergies: loadSynergies(raw.synergies as never),
    contractTemplates: contracts.templates, customers: contracts.customers,
    powerEvents: loadPowerEvents(raw.events_power as never),
    subEvents: loadSubEvents(raw.events_sub as never),
    worldEvents: loadSubEvents(raw.events_world as never),
    rivalDefs: rivals.defs, rivalTuning: rivals.tuning, megaMeta: megaMetaFrom(megaprojects),
    eras: loadEras(raw.eras as never), cycleTuning: loadCycleTuning(raw.cycles as never),
    pressures, pressureTriggers: pressureTriggerMap(Object.values(pressures)) };

  // the base game's snapshot at handoff (a titan-age company)
  const snap: BaseSnapshot = {
    valuationM: 33000, cashM: 9000,
    subIndustriesOperated: ["satellite_constellations", "launch_services", "space_stations", "ai_chips", "frontier_model_lab"],
    rdLevelsBySub: {
      ai_chips: { process_node: 60, architecture: 40, yield_line: 55 },
      launch_services: { reliability: 60, reusability: 50, propulsion: 40 },
      space_stations: { module_tech: 50, life_support: 45, assembly: 40 },
      frontier_model_lab: { scaling: 50, alignment: 45, data_quality: 40 },
      satellite_constellations: { network: 50, mass_production: 45, satellite_tech: 40 } },
    productTierBySub: { satellite_constellations: 2, ai_chips: 2, launch_services: 2,
      space_stations: 2, frontier_model_lab: 2, vertical_ai_saas: 2 },
    execQualityByDomain: { space_program: 0.85 }, maxMarketShare: 0.45 };
  const s = initLateSlice(content, 2077, snap);
  assert.equal(s.era, "titan");

  const r = rng(2077);
  refreshMarket(s.contracts, content.contractTemplates, content.customers,
    { stature: s.stature, productTiers: s.productTiers, rdLevels: s.rdLevels,
      frontsOperated: s.frontsOperated, clearances: ["defense_secret"] }, r);
  s.contracts.clearances = ["defense_secret"];
  s.research.nodes["mass_manufacturing"]!.state = "in_progress";
  s.research.nodes["inter_satellite_links"]!.state = "in_progress";
  const CHAIN = ["mass_manufacturing", "inter_satellite_links", "global_broadband", "space_solar_power"];

  let cycleShifts = 0, rivalBeats = 0, legaciesLost = 0, worldBeats = 0, maxEntangle = 0;
  for (let turn = 0; turn < 200; turn++) {
    snap.valuationM *= 1.004 ** 4;                    // the base game's growth, simulated
    syncFromBase(s, snap);
    const gate = checkGate(megaprojects.orbital_solar_array!, {
      researchDone: new Set(Object.entries(s.research.nodes).filter(([, n]) => n.state === "complete").map(([id]) => id)),
      stature: s.stature, cash: s.cashM, execDomains: new Set(["space_program"]), capacity: {}, megasDone: new Set() });
    if (gate.met && !s.megas.active.length && !(s.megas.builds["orbital_solar_array"] ?? 0)) {
      const b = beginMega(s.megas, megaprojects.orbital_solar_array!, s.week);
      if (b.ok) s.cashM -= b.cost;
    }
    for (const nid of CHAIN) {
      const st = s.research.nodes[nid]!.state as string;
      if ((st === "available" || st === "locked")
          && content.researchNodes[nid]!.prereqs.every(p => (s.research.nodes[p]!.state as string) === "complete"))
        s.research.nodes[nid]!.state = "in_progress";
    }
    const rep = advanceTurn(s, content, r);
    if (rep.marketRefreshed && s.contracts.active.length < 4) {
      const el = s.contracts.market.map(id => content.contractTemplates[id]!)
        .filter(t => !t.requires.clearance || s.contracts.clearances.includes(t.requires.clearance));
      const next = el.find(t => content.customers[t.customer]!.channel === "government") ?? el[0];
      if (next) takeContract(s.contracts, next);
    }
    if (rep.cycleShift) cycleShifts++;
    rivalBeats += rep.rivalNews.length;
    legaciesLost += rep.legaciesLostToRivals.length;
    if (rep.worldNews) worldBeats++;
    maxEntangle = Math.max(maxEntangle, s.contracts.entanglement);
  }

  assert.equal(s.research.nodes["space_solar_power"]!.state, "complete", "the real frontier chain completes");
  assert.ok((s.megas.builds["orbital_solar_array"] ?? 0) >= 1, "The Sunfarm gets built");
  assert.ok(s.subEcon.instances["space_power"], "space_power opens");
  assert.ok(s.activeSynergies.some(a => a.id === "abundant_clean_energy"), "the flow synergy activates");
  assert.ok(s.powerAxis.power >= 3, `power accumulates (${s.powerAxis.power})`);
  assert.ok(maxEntangle > 0, `entanglement tracked during the run (peak ${maxEntangle.toFixed(0)})`);
  assert.ok(cycleShifts >= 3, `the economy cycles (${cycleShifts} shifts)`);
  assert.ok(rivalBeats >= 20, `the rivals live (${rivalBeats} beats)`);
  assert.ok(legaciesLost >= 1, `the legacy race is real (${legaciesLost} lost)`);
  assert.ok(worldBeats >= 3, `the world turns (${worldBeats} beats)`);
  assert.ok(s.stature > 33000 && (s.era as string) !== "garage", "the bridge syncs base-game growth");
});
