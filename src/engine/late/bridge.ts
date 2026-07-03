// ============================================================================
// bridge.ts — where the base game hands the late game its inputs. The base
// game owns the early arc (products, fundraising, IPO); the late-game slice
// reads a SNAPSHOT of that world each turn. One direction, one place.
//   stature      <- company.valuation ($M post-money / market cap)
//   cashM        <- shared: late-game net cash flows BACK via LateTurnResult
//   rdLevels     <- company rd.levels, keyed under the operating sub-industry
//   frontsOperated / productTiers <- the company's live product lines
//   execQuality  <- the base game's executive bench (until executives v2 lands)
// ============================================================================
import { GameSlice, GameContent } from "./turn";
import { initResearch } from "./research";
import { initContracts } from "./contracts";
import { initRivals } from "./rivals";
import { initExecs, ExecState } from "./executives";
import { initCycle } from "./pacing";

export interface BaseSnapshot {
  valuationM: number;
  cashM: number;
  subIndustriesOperated: string[];                    // e.g. ["frontier_model_lab"]
  rdLevelsBySub: Record<string, Record<string, number>>;
  productTierBySub: Record<string, number>;
  execQualityByDomain: Record<string, number>;        // 0..1 from the base exec bench
  maxMarketShare: number;
}

function mulberry32(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function initLateSlice(content: GameContent, seed: number, snap: BaseSnapshot): GameSlice {
  return {
    week: 0, cashM: snap.cashM, stature: snap.valuationM,
    frontsOperated: [...snap.subIndustriesOperated],
    rdLevels: structuredClone(snap.rdLevelsBySub),
    productTiers: { ...snap.productTierBySub },
    execQualityByDomain: { ...snap.execQualityByDomain },
    maxMarketShare: snap.maxMarketShare,
    research: initResearch(Object.values(content.researchNodes)),
    megas: { builds: {}, active: [], slots_total: 1 },
    subEcon: { instances: {}, resource_pool: {} },
    contracts: initContracts(),
    powerAxis: { power: 0, basePower: 0, reputation: 0, regulationLevel: 0, eventCooldowns: {} },
    activeSynergies: [],
    rivals: initRivals(content.rivalDefs, content.rivalTuning, content.megaMeta),
    claimedLegacies: {},
    era: snap.valuationM < 2000 ? "garage" : snap.valuationM < 15000 ? "scaleup" : "titan",
    cycle: initCycle(content.cycleTuning, mulberry32(seed ^ 0x5eed)),
    activePressures: [],
    schema_version: 1, ext: {}, subsidiaries: [], deals_log: [],
  };
}

export function initLateExecs(): ExecState { return initExecs(); }

/** Refresh the slice's base-owned fields from a fresh snapshot (call each turn
 *  BEFORE advanceTurn; the base game stays the source of truth for these). */
export function syncFromBase(slice: GameSlice, snap: BaseSnapshot): void {
  slice.stature = snap.valuationM;
  slice.frontsOperated = [...snap.subIndustriesOperated];
  slice.rdLevels = structuredClone(snap.rdLevelsBySub);
  slice.productTiers = { ...snap.productTierBySub };
  slice.maxMarketShare = snap.maxMarketShare;
  // exec quality merges: base bench + late-game hires (late wins per-domain)
  slice.execQualityByDomain = { ...snap.execQualityByDomain, ...slice.execQualityByDomain };
}
