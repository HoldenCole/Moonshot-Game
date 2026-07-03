// ============================================================================
// runtime.ts — the integration layer between the base game and the late-game v2
// slice. The base game stays the source of truth (valuation → stature, cash, rd
// levels, product tiers); each late turn reads a SNAPSHOT of it, runs the exec
// layer + advanceTurn, and reconciles net cash back. This is the repo-side twin
// of the design pack's standalone store, adapted to the single saved GameState.
// ============================================================================
import type { PlayerCompany } from "@/domain/state";
import type { ProductArchetype } from "@/domain/content";
import type { LogEntry } from "@/domain/log";
import { advanceTurn, type GameContent, type GameSlice, type TurnReport } from "./turn";
import { initLateSlice, syncFromBase, type BaseSnapshot } from "./bridge";
import {
  initExecs, generateCandidates, execQuality, tickRetention, hireExec, fireExec,
  type Candidate, type ExecState,
} from "./executives";
import type { ExecContent } from "./content_loader";
import { tickRivalPoaching } from "./rivals";
import { beginMega, checkGate, type GateCheck, type MegaprojectDef } from "./megaprojects";
import { takeContract, refreshMarket, type ContractTemplate } from "./contracts";
import type { Posture } from "./empire";

/** Valuation ($M) at which the late-game slice is born — the garage→scaleup
 *  boundary the bridge uses to seed the opening era. */
export const LATE_UNLOCK_VALUATION = 2000;

const REPORTS_CAP = 24;
const WEEKS_PER_TURN = 4;

/** The late-game runtime carried inside the save: the world slice, the exec
 *  bench, a capped ring of recent turn reports for the Standing/news feeds, and
 *  the base week the slice was born (to pace 4-week turns against the clock). */
export interface LateState {
  slice: GameSlice;
  execs: ExecState;
  reports: TurnReport[];
  birthWeek: number;
}

/** A deterministic per-turn RNG derived from the run seed + week, so late turns
 *  replay identically from a save (no hidden generator state to persist). */
function turnRng(seed: number, week: number): () => number {
  let s = (seed ^ Math.imul(week + 1, 0x9e3779b1)) >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build the base snapshot the late slice reads from the live company. The base
 *  game operates one sub-industry at a time, so the fronts/levels/tiers maps are
 *  keyed by it. Exec domains are left to the late bench (base areas don't map). */
export function lateSnapshot(company: PlayerCompany, productById: Map<string, ProductArchetype>): BaseSnapshot {
  const sub = company.subIndustry;
  const rt = company.products;
  const live = rt?.products ?? [];
  const maxTier = live.reduce((m, p) => Math.max(m, productById.get(p.archetype_id)?.tier ?? 0), 0);
  const maxShare = live.reduce((m, p) => Math.max(m, p.share), 0);
  return {
    valuationM: company.financials.valuation,
    cashM: company.financials.cash,
    subIndustriesOperated: [sub],
    rdLevelsBySub: { [sub]: { ...(rt?.rd.levels ?? {}) } },
    productTierBySub: { [sub]: maxTier },
    execQualityByDomain: {},
    maxMarketShare: maxShare,
  };
}

/** Birth the late-game slice from the base game at handoff. Seeds the exec
 *  market so the player has candidates to hire immediately. */
export function bootLate(
  content: GameContent, execContent: ExecContent, snap: BaseSnapshot, seed: number, birthWeek: number,
): LateState {
  const slice = initLateSlice(content, seed, snap);
  const execs = initExecs();
  const rng = turnRng(seed, 0);
  execs.market = generateCandidates(
    execContent.archetypes, execContent.traits, execContent.names, execContent.domains,
    slice.stature, execContent.tuning, rng,
  );
  slice.execQualityByDomain = { ...snap.execQualityByDomain, ...execQuality(execs, execContent.traits) };
  return { slice, execs, reports: [], birthWeek };
}

/** How many 4-week late turns should have run by `baseWeek`, given the birth week. */
export function lateTurnsDue(late: LateState, baseWeek: number): number {
  return Math.max(0, Math.floor((baseWeek - late.birthWeek) / WEEKS_PER_TURN));
}

/** Advance the late game one 4-week turn: sync from base, run the exec layer
 *  (retention, rival poaching, market refresh), advance the world, and hand back
 *  the report. `report.netCash` is the amount to reconcile into base cash. */
export function runLateTurn(
  late: LateState, content: GameContent, execContent: ExecContent, snap: BaseSnapshot, seed: number,
): { late: LateState; report: TurnReport } {
  const slice = structuredClone(late.slice);
  const execs = structuredClone(late.execs);
  const rng = turnRng(seed, slice.week + WEEKS_PER_TURN);

  syncFromBase(slice, snap);
  slice.cashM = snap.cashM; // base cash is the shared wallet; net late cash flows back

  // Exec layer first: retention roll, rival raids, periodic market refresh.
  tickRetention(execs, execContent.traits, execContent.tuning, slice.week, WEEKS_PER_TURN, rng);
  const raid = tickRivalPoaching(
    slice.rivals, content.rivalDefs, content.rivalTuning, execs.seats, execContent.traits,
    slice.week, WEEKS_PER_TURN, rng,
  );
  execs.weeks_since_refresh += WEEKS_PER_TURN;
  if (execs.weeks_since_refresh >= execContent.tuning.market_refresh_weeks) {
    execs.market = generateCandidates(
      execContent.archetypes, execContent.traits, execContent.names, execContent.domains,
      slice.stature, execContent.tuning, rng,
    );
    execs.weeks_since_refresh = 0;
  }
  slice.execQualityByDomain = { ...snap.execQualityByDomain, ...execQuality(execs, execContent.traits) };

  const report = advanceTurn(slice, content, rng);
  report.rivalNews.push(...raid.news);

  const reports = [...late.reports, report].slice(-REPORTS_CAP);
  return { late: { slice, execs, reports, birthWeek: late.birthWeek }, report };
}

// ── Player actions (each returns a fresh LateState + the net cash change to
//    apply to base company cash; cashDelta > 0 is cash in). ────────────────────

export interface LateAction {
  late: LateState;
  /** Net change to base cash, $M (negative for spends, positive for receipts). */
  cashDelta: number;
  ok?: boolean;
  reason?: string;
}

function clone(late: LateState): LateState {
  return { slice: structuredClone(late.slice), execs: structuredClone(late.execs), reports: late.reports, birthWeek: late.birthWeek };
}

/** Commit to a megaproject build (gated + costed; a no-op when it can't start). */
export function lateBeginMega(late: LateState, def: MegaprojectDef): LateAction {
  const next = clone(late);
  const r = beginMega(next.slice.megas, def, next.slice.week);
  if (!r.ok) return { late, cashDelta: 0, ok: false, reason: r.reason };
  next.slice.cashM -= r.cost;
  return { late: next, cashDelta: -r.cost, ok: true };
}

/** Gate readout for a megaproject (for the UI's "what's missing"). */
export function lateMegaGate(late: LateState, def: MegaprojectDef): GateCheck {
  const s = late.slice;
  return checkGate(def, {
    researchDone: new Set(Object.entries(s.research.nodes).filter(([, n]) => n.state === "complete").map(([id]) => id)),
    stature: s.stature, cash: s.cashM,
    execDomains: new Set(Object.keys(s.execQualityByDomain)),
    capacity: {}, megasDone: new Set(Object.keys(s.megas.builds)),
  });
}

/** Start researching a node (spends its cost; a no-op when not startable). */
export function lateStartResearch(late: LateState, content: GameContent, id: string): LateAction {
  const node = content.researchNodes[id];
  const st = late.slice.research.nodes[id];
  if (!node || !st || (st.state !== "available" && st.state !== "locked")) return { late, cashDelta: 0, ok: false };
  const next = clone(late);
  next.slice.research.nodes[id]!.state = "in_progress";
  next.slice.cashM -= node.cost;
  return { late: next, cashDelta: -node.cost, ok: true };
}

/** Take a contract from the current market (banks its upfront payment). */
export function lateTakeContract(late: LateState, template: ContractTemplate): LateAction {
  const next = clone(late);
  takeContract(next.slice.contracts, template);
  next.slice.cashM += template.payment.upfront;
  return { late: next, cashDelta: template.payment.upfront, ok: true };
}

/** Refresh the contract market against the company's current standing. */
export function lateRefreshMarket(late: LateState, content: GameContent, seed: number): LateAction {
  const next = clone(late);
  const rng = turnRng(seed, next.slice.week + 1);
  refreshMarket(next.slice.contracts, content.contractTemplates, content.customers, {
    stature: next.slice.stature, productTiers: next.slice.productTiers, rdLevels: next.slice.rdLevels,
    frontsOperated: next.slice.frontsOperated, clearances: next.slice.contracts.clearances,
  }, rng);
  return { late: next, cashDelta: 0, ok: true };
}

/** Set a sub-economy's posture (grow / harvest / hold). */
export function lateSetPosture(late: LateState, subId: string, posture: Posture): LateAction {
  if (!late.slice.subEcon.instances[subId]) return { late, cashDelta: 0, ok: false };
  const next = clone(late);
  next.slice.subEcon.instances[subId]!.posture = posture;
  return { late: next, cashDelta: 0, ok: true };
}

/** Hire an executive candidate into their domain seat. */
export function lateHireExec(late: LateState, execContent: ExecContent, cand: Candidate): LateAction {
  const next = clone(late);
  const r = hireExec(next.execs, cand, cand.ask_salary, next.slice.week);
  if (!r.ok) return { late, cashDelta: 0, ok: false, reason: r.reason };
  next.slice.execQualityByDomain = { ...next.slice.execQualityByDomain, ...execQuality(next.execs, execContent.traits) };
  return { late: next, cashDelta: 0, ok: true };
}

/** Fire the executive in a domain (pays severance). */
export function lateFireExec(late: LateState, execContent: ExecContent, domain: string): LateAction {
  const next = clone(late);
  const r = fireExec(next.execs, domain, next.slice.week, execContent.tuning);
  if (!r) return { late, cashDelta: 0, ok: false };
  next.slice.cashM -= r.severance;
  next.slice.execQualityByDomain = { ...snapExecless(next.slice.execQualityByDomain, domain), ...execQuality(next.execs, execContent.traits) };
  return { late: next, cashDelta: -r.severance, ok: true };
}

/** Drop a domain's quality entry (a fired exec no longer counts) before the
 *  fresh bench is overlaid. */
function snapExecless(q: Record<string, number>, domain: string): Record<string, number> {
  const out = { ...q };
  delete out[domain];
  return out;
}

// ── News: fold the structured TurnReport into base log entries ────────────────

/** Turn a late-game TurnReport into narrative-rail log entries. Only the beats
 *  worth surfacing are emitted; the full structured report lives in LateState
 *  for the Standing tab. `baseWeek` is the run's clock week the turn resolved at. */
export function lateReportToLog(report: TurnReport, baseWeek: number): LogEntry[] {
  const out: LogEntry[] = [];
  const push = (tone: LogEntry["tone"], headline: string, detail?: string, salt = out.length) =>
    out.push({ id: `late-w${baseWeek}-t${report.week}-${salt}`, week: baseWeek, kind: "world", tone, headline, detail });

  const label = (id: string) => id.replace(/_/g, " ");
  if (report.eraTransition) push("opportunity", `New era: ${report.eraTransition.name}`, report.eraTransition.prose);
  if (report.cycleShift) push(report.cycleShift.phase === "winter" ? "warn" : "up", `The cycle turns: ${report.cycleShift.phase}`, report.cycleShift.prose);
  for (const m of report.megaCompleted) push("opportunity", "Megaproject complete", `${label(m.def_id)} #${m.copy_n} came online.`);
  for (const b of report.megaBeats) push("neutral", "Megaproject milestone", b.text);
  for (const id of report.researchCompleted) push("up", "Research complete", label(id));
  for (const l of report.legaciesClaimedByPlayer) push("opportunity", "Legacy claimed", `You made history: ${label(l)}.`);
  for (const l of report.legaciesLostToRivals) push("down", "Legacy lost", `${l.rival} claimed ${label(l.legacy)} first.`);
  if (report.powerEventFired) push("warn", `Power: ${report.powerEventFired.category}`, "A power-axis event is in play.");
  if (report.worldNews) push("neutral", report.worldNews.headline, report.worldNews.body);
  for (const n of report.rivalNews) push("neutral", n.rival_name, n.text);
  for (const c of report.subEconomyCrises) if (c.event) push("warn", c.event.headline, c.event.body);
  for (const p of report.pressuresStarted) push("warn", `Pressure: ${p.name}`, p.on_start);
  for (const p of report.pressuresEnded) push("up", `Pressure eased: ${p.name}`, p.on_end);
  return out;
}
