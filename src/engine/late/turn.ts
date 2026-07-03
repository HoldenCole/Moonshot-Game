// ============================================================================
// turn.ts — The turn processor: orchestrates all five engines in dependency
// order each turn. Pure: (state, content, rng) -> { state mutated, TurnReport }.
// Order: research -> megaprojects -> sub-economies -> synergies -> contracts
//        -> power events. Synergy modifiers feed back into next turn's speeds.
// ============================================================================
import { ResearchState, ResearchNode, tickResearch, refreshAvailability } from "./research";
import { MegaState, MegaprojectDef, tickMegas, outputAdd } from "./megaprojects";
import { ContractsState, ContractTemplate, CustomerDef, PowerEventDef, tickContracts,
         refreshMarket, govShare, mixIdentity, powerFromBusiness, eligiblePowerEvents,
         powerEventChance, TUNING as CONTRACT_TUNING } from "./contracts";
import { SubEconState, SubEconomyDef, SynergyDef, tickSubEconomies, openSubEconomy,
         scaleSubEconomy, evalSynergies, compositeModifiers, ActiveSynergy } from "./empire";
import { SubEventDef } from "./content_loader";
import { RivalDef, RivalTuning, RivalState, RivalNews, MegaMeta, tickRivals, PlayerSnapshot } from "./rivals";
import { EraDef, CycleTuning, CycleState, PressureDef, ActivePressure, currentEra, tickCycle,
         cycleModifiers, startPressures, tickPressures, pressureModifiers } from "./pacing";

export interface GameContent {
  researchNodes: Record<string, ResearchNode>;
  megaprojects: Record<string, MegaprojectDef>;
  subEconomies: Record<string, SubEconomyDef>;
  synergies: SynergyDef[];
  contractTemplates: Record<string, ContractTemplate>;
  customers: Record<string, CustomerDef>;
  powerEvents: PowerEventDef[];
  subEvents: SubEventDef[];
  worldEvents: SubEventDef[];
  rivalDefs: Record<string, RivalDef>;
  rivalTuning: RivalTuning;
  megaMeta: Record<string, MegaMeta>;
  eras: EraDef[];
  cycleTuning: CycleTuning;
  pressures: Record<string, PressureDef>;
  pressureTriggers: Record<string, string>;
}

export interface PowerAxis {
  power: number;                 // 0..7 composite
  basePower: number;             // accumulated from mega completions + events
  reputation: number;
  regulationLevel: number;
  eventCooldowns: Record<string, number>;
}

export interface GameSlice {
  week: number;
  cashM: number;
  stature: number;               // $M market cap (owned by the finance system; here a field)
  frontsOperated: string[];
  rdLevels: Record<string, Record<string, number>>;
  productTiers: Record<string, number>;
  execQualityByDomain: Record<string, number>;   // 0..1
  maxMarketShare: number;
  research: ResearchState;
  megas: MegaState;
  subEcon: SubEconState;
  contracts: ContractsState;
  powerAxis: PowerAxis;
  activeSynergies: ActiveSynergy[];
  rivals: RivalState[];
  claimedLegacies: Record<string, string>;   // legacy id -> "player" | rival id
  era: string;
  cycle: CycleState;
  activePressures: ActivePressure[];
  // ---- DLC foundation stubs (21 §II.5): optional, serialized, never read by base engines ----
  schema_version?: number;
  ext?: Record<string, unknown>;             // pack_id -> pack state
  founder?: { age_years: number; founded_week: number };
  subsidiaries?: { id: string; name: string }[];
  deals_log?: { week: number; kind: string; counterparty: string }[];
}

export interface TurnReport {
  week: number;
  revenue: number; upkeep: number; netCash: number;
  researchCompleted: string[];
  megaBeats: { def_id: string; kind: string; text: string }[];
  megaCompleted: { def_id: string; copy_n: number }[];
  subEconomyCrises: { def_id: string; event: SubEventDef | null }[];
  powerEventFired: PowerEventDef | null;
  power: number; entanglement: number; identity: string;
  contractsExpired: string[];
  marketRefreshed: boolean;
  rivalNews: RivalNews[];
  worldNews: SubEventDef | null;
  legaciesClaimedByPlayer: string[];
  legaciesLostToRivals: { legacy: string; rival: string }[];
  eraTransition: { name: string; prose: string } | null;
  cycleShift: { phase: string; prose: string } | null;
  pressuresStarted: PressureDef[];
  pressuresEnded: PressureDef[];
  activePressureNames: string[];
}

const WEEKS_PER_TURN = 4;

export function advanceTurn(s: GameSlice, c: GameContent, rng: () => number): TurnReport {
  const w = WEEKS_PER_TURN;
  s.week += w;
  const report: TurnReport = { week: s.week, revenue: 0, upkeep: 0, netCash: 0,
    researchCompleted: [], megaBeats: [], megaCompleted: [], subEconomyCrises: [],
    powerEventFired: null, power: 0, entanglement: 0, identity: "", contractsExpired: [],
    marketRefreshed: false, rivalNews: [], worldNews: null,
    legaciesClaimedByPlayer: [], legaciesLostToRivals: [],
    eraTransition: null, cycleShift: null, pressuresStarted: [], pressuresEnded: [],
    activePressureNames: [] };

  // ---- -1. the arc: cycle turns, pressures tick down ----
  const shift = tickCycle(s.cycle, c.cycleTuning, w, rng);
  if (shift.changed) report.cycleShift = { phase: s.cycle.phase, prose: shift.prose! };
  const cyc = cycleModifiers(s.cycle, c.cycleTuning);
  report.pressuresEnded = tickPressures(s.activePressures, c.pressures, w).ended;

  // ---- 0. synergy modifiers from LAST turn's resource pool (feed-forward) ----
  const researchDone = new Set(Object.entries(s.research.nodes)
    .filter(([, n]) => n.state === "complete").map(([id]) => id));
  s.activeSynergies = evalSynergies(c.synergies, s.subEcon.resource_pool, s.frontsOperated, researchDone);
  const synDefs = Object.fromEntries(c.synergies.map(d => [d.id, d]));
  const mods = compositeModifiers(s.activeSynergies, synDefs, "all", "all");
  const press = pressureModifiers(s.activePressures, c.pressures);
  mods.rd_speed_mult *= press.rd_speed_mult;
  mods.opex_mult *= press.opex_mult;
  mods.build_cost_mult *= press.build_cost_mult;

  // ---- 1. research (speed boosted by synergies) ----
  report.researchCompleted = tickResearch(s.research, c.researchNodes, w, mods.rd_speed_mult);
  refreshAvailability(s.research, c.researchNodes, s.rdLevels, s.frontsOperated);

  // ---- 2. megaprojects (exec quality of the relevant domain reduces setbacks) ----
  const bestExecQ = Math.max(0, ...Object.values(s.execQualityByDomain));
  const megaTick = tickMegas(s.megas, c.megaprojects, s.week, w, bestExecQ, rng);
  report.megaBeats = megaTick.beats;
  for (const done of megaTick.completed) {
    report.megaCompleted.push({ def_id: done.def_id, copy_n: done.copy_n });
    s.powerAxis.basePower += done.power;
    const legacy = c.megaMeta[done.def_id]?.legacy;
    if (legacy && !s.claimedLegacies[legacy]) {
      s.claimedLegacies[legacy] = "player";
      report.legaciesClaimedByPlayer.push(legacy);
    }
    if (done.opens_sub_economy && c.subEconomies[done.opens_sub_economy])
      openSubEconomy(s.subEcon, c.subEconomies[done.opens_sub_economy]!);
    if (done.scales_sub_economy && c.subEconomies[done.scales_sub_economy])
      scaleSubEconomy(s.subEcon, done.scales_sub_economy, outputAdd(done.copy_n),
        c.subEconomies[done.scales_sub_economy]!);
  }

  // ---- 3. sub-economies (tick -> revenue, resources into pool, crises) ----
  const se = tickSubEconomies(s.subEcon, c.subEconomies, w, s.execQualityByDomain, rng, cyc.growth_mult);
  report.revenue += se.revenue * cyc.payment_mult;      // booms lift demand everywhere; winters cut it
  report.upkeep += se.upkeep * press.opex_mult;
  for (const crisis of se.crises) {
    const pool = c.subEvents.filter(e => e.pool === crisis.pool && e.kind === "crisis"
      && (s.powerAxis.eventCooldowns[e.id] ?? 0) <= 0);
    const picked = pool.length ? pool[Math.floor(rng() * pool.length)]! : null;
    if (picked) s.powerAxis.eventCooldowns[picked.id] = picked.cooldown_weeks;
    report.subEconomyCrises.push({ def_id: crisis.def_id, event: picked });
  }

  // ---- 4. contracts (recurring revenue, decay, market refresh) ----
  const ct = tickContracts(s.contracts, c.contractTemplates, w);
  report.revenue += ct.revenue * cyc.payment_mult * press.contract_payment_mult;
  report.contractsExpired = ct.expired;
  if (s.contracts.weeks_since_refresh >= CONTRACT_TUNING.refresh_weeks) {
    refreshMarket(s.contracts, c.contractTemplates, c.customers, {
      stature: s.stature, productTiers: s.productTiers, rdLevels: s.rdLevels,
      frontsOperated: s.frontsOperated, clearances: s.contracts.clearances }, rng);
    report.marketRefreshed = true;
  }

  // ---- 5. the power composite (base + business + sub-economies + synergies, cap 7) ----
  const contractPower = powerFromBusiness(s.contracts, c.contractTemplates, s.maxMarketShare);
  s.powerAxis.power = Math.min(7, Math.round(
    (s.powerAxis.basePower + contractPower + se.power + mods.power_bonus) * 10) / 10);
  report.power = s.powerAxis.power;
  report.entanglement = Math.round(s.contracts.entanglement);
  report.identity = mixIdentity(govShare(s.contracts, c.contractTemplates, c.customers));

  // ---- 6. power/gov events (threshold-gated, exposure-scaled frequency) ----
  for (const id in s.powerAxis.eventCooldowns)
    s.powerAxis.eventCooldowns[id] = Math.max(0, (s.powerAxis.eventCooldowns[id] ?? 0) - w);
  const activeCust = new Set(s.contracts.active.map(a => c.contractTemplates[a.template_id]!.customer));
  const eligible = eligiblePowerEvents(c.powerEvents, s.powerAxis.power,
    s.contracts.entanglement, s.stature, activeCust, s.powerAxis.eventCooldowns);
  if (eligible.length) {
    const cand = eligible[Math.floor(rng() * eligible.length)]!;
    if (rng() < powerEventChance(cand!.category, s.powerAxis.power, s.contracts.entanglement)) {
      report.powerEventFired = cand;
      s.powerAxis.eventCooldowns[cand!.id] = cand!.cooldown_weeks;
    }
  }

  // ---- 6.5 the other titans race, and the world turns ----
  const before = { ...s.claimedLegacies };
  const snapshot: PlayerSnapshot = {
    activeMegas: s.megas.active.map(a => a.def_id),
    completedMegas: Object.keys(s.megas.builds),
    stature: s.stature, power: s.powerAxis.power,
    legaciesClaimed: Object.values(s.claimedLegacies).filter(o => o === "player").length,
  };
  report.rivalNews = tickRivals(s.rivals, c.rivalDefs, c.rivalTuning, c.megaMeta,
    s.claimedLegacies, s.week, w, rng, snapshot);
  for (const [legacy, owner] of Object.entries(s.claimedLegacies))
    if (!before[legacy] && owner !== "player")
      report.legaciesLostToRivals.push({ legacy, rival: owner });
  // adaptive texture floor: quiet turns get world texture; busy turns stay focused
  const provisionalBeats = report.researchCompleted.length + report.megaBeats.length
    + report.megaCompleted.length + report.subEconomyCrises.filter(x => x.event).length
    + (report.powerEventFired ? 1 : 0) + report.rivalNews.length + report.contractsExpired.length
    + (report.marketRefreshed ? 1 : 0) + (report.cycleShift ? 1 : 0) + report.pressuresEnded.length;
  const worldChance = provisionalBeats === 0 ? 0.85 : 0.25;
  const worldPool = c.worldEvents.filter(e => (s.powerAxis.eventCooldowns[e.id] ?? 0) <= 0
    && ((e as { gates?: { power_min?: number } }).gates?.power_min ?? 0) <= s.powerAxis.power);
  if (worldPool.length && rng() < worldChance) {
    const picked = worldPool[Math.floor(rng() * worldPool.length)]!;
    s.powerAxis.eventCooldowns[picked!.id] = picked!.cooldown_weeks;
    report.worldNews = picked;
  }

  // ---- 6.8 pressures ignite from what just happened; the era is re-read ----
  const fired: string[] = [];
  if (report.powerEventFired) fired.push(report.powerEventFired.id);
  for (const cr of report.subEconomyCrises) if (cr.event) fired.push(cr.event.id);
  if (report.worldNews) fired.push(report.worldNews.id);
  report.pressuresStarted = startPressures(s.activePressures, c.pressures, c.pressureTriggers, fired);
  report.activePressureNames = s.activePressures.map(a => c.pressures[a.def_id]!.name);
  const era = currentEra(c.eras, s.stature, s.powerAxis.power);
  if (era.id !== s.era) {
    s.era = era.id;
    if (era.transition_prose) report.eraTransition = { name: era.name, prose: era.transition_prose };
  }

  // ---- 7. cash ----
  report.netCash = report.revenue - report.upkeep;
  s.cashM += report.netCash;
  return report;
}
