// ============================================================================
// connectors.tsx — the thin layer binding the base game store to the prop-driven
// late-game design-pack tabs. Each *Live component reads the live slice + late
// content from useGame and hands the tab exactly the props it wants.
// ============================================================================
import { useGame } from "@/state/store";
import { ResearchTab } from "./ResearchTab";
import { MegaprojectsTab } from "./MegaprojectsTab";
import { EmpireTab } from "./EmpireTab";
import { ExecutivesTab } from "./ExecutivesTab";
import { StandingTab } from "./StandingTab";
import { ContractsTab } from "./ContractsTab";
import { HomeTab } from "./HomeTab";
import type { ExecProfile } from "@/engine/late/advisory";
import type { GameSlice } from "@/engine/late/turn";
import type { ExecState } from "@/engine/late/executives";
import { ResearchHero, type ConstellationNode } from "@/ui/heroes/ResearchHero";
import { MegaHero, type MegaWork } from "@/ui/heroes/MegaHero";
import { CSuiteHero, type SuiteSeat } from "@/ui/heroes/CSuiteHero";
import { DealRoomHero, type DealFolder } from "@/ui/heroes/DealRoomHero";
import { PowerMapHero, type LegacyPlaque, type RaceRow } from "@/ui/heroes/PowerMapHero";
import { govShare, mixIdentity, TUNING as CONTRACT_TUNING } from "@/engine/late/contracts";

/** A small deterministic RNG for advisory noise — stable within a turn, varies
 *  across turns, so recommendations don't reshuffle every render. */
function uiRng(week: number): () => number {
  let s = (week * 0x9e3779b1) >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build the megaproject gate context the tab reads from the live slice. */
function gateCtx(slice: GameSlice) {
  return {
    researchDone: new Set(
      Object.entries(slice.research.nodes).filter(([, n]) => n.state === "complete").map(([id]) => id),
    ),
    stature: slice.stature,
    cash: slice.cashM,
    execDomains: new Set(Object.keys(slice.execQualityByDomain)),
    capacity: {} as Record<string, number>,
    megasDone: new Set(Object.keys(slice.megas.builds)),
  };
}

/** A CFO advisory profile for the contracts lens — the best-seated exec fronts
 *  the advice, else a competent house default. */
function cfoProfile(execs: ExecState): ExecProfile {
  const seats = Object.values(execs.seats);
  const best = seats.sort((a, b) => b.competence - a.competence)[0];
  return best
    ? { id: best.id, name: best.name, domain: best.domain, competence: best.competence, traits: best.traits }
    : { id: "house", name: "Your CFO", domain: "capital", competence: 68, traits: [] };
}

export function ResearchTabLive() {
  const late = useGame((s) => s.game?.late);
  const content = useGame((s) => s.content.late);
  const onStart = useGame((s) => s.lateStartResearch);
  if (!late) return null;
  const constellation: ConstellationNode[] = Object.values(content.researchNodes).map((n) => ({
    id: n.id,
    name: n.name,
    kind: n.kind,
    prereqs: n.prereqs,
    state: late.slice.research.nodes[n.id]?.state ?? "locked",
    ...(n.gates_megaproject ? { gatesMega: true } : {}),
  }));
  return (
    <>
      <ResearchHero nodes={constellation} />
      <ResearchTab state={late.slice.research} nodes={content.researchNodes} ctoName="Head of Research" onStart={onStart} />
    </>
  );
}

export function MegaprojectsTabLive() {
  const late = useGame((s) => s.game?.late);
  const content = useGame((s) => s.content.late);
  const onBegin = useGame((s) => s.lateBeginMega);
  if (!late) return null;
  const seats = Object.values(late.execs.seats);
  const execName = seats[0]?.name ?? "Chief Engineer";
  const megas = late.slice.megas;
  const works: MegaWork[] = megas.active.map((a) => {
    const def = content.megaprojects[a.def_id];
    const stages = def?.stages ?? [];
    const total = stages.reduce((s, st) => s + st.weeks, 0) || 1;
    const doneWeeks = stages.slice(0, a.stage_idx).reduce((s, st) => s + st.weeks, 0) + a.stage_progress_weeks;
    return {
      id: a.def_id,
      name: def?.name ?? a.def_id,
      branch: def?.branch ?? "space",
      progress: Math.min(1, doneWeeks / total),
      stageName: stages[a.stage_idx]?.name ?? "underway",
      copy: a.copy_n,
      stagesTotal: stages.length,
      stageIdx: a.stage_idx,
    };
  });
  const done = Object.entries(megas.builds)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ name: content.megaprojects[id]?.name ?? id, count: n }));
  return (
    <>
      <MegaHero works={works} done={done} slots={{ used: megas.active.length, total: megas.slots_total }} />
      <MegaprojectsTab
        state={megas}
        defs={content.megaprojects}
        gateCtx={gateCtx(late.slice)}
        sagaLog={{}}
        execName={execName}
        onBegin={onBegin}
      />
    </>
  );
}

export function EmpireTabLive() {
  const late = useGame((s) => s.game?.late);
  const content = useGame((s) => s.content.late);
  const onPosture = useGame((s) => s.lateSetPosture);
  if (!late) return null;
  return (
    <EmpireTab
      state={late.slice.subEcon}
      defs={content.subEconomies}
      synergies={content.synergies}
      activeSynergies={late.slice.activeSynergies}
      onPosture={onPosture}
    />
  );
}

export function ExecutivesTabLive() {
  const late = useGame((s) => s.game?.late);
  const execContent = useGame((s) => s.content.lateExec);
  const onHire = useGame((s) => s.lateHireExec);
  const onFire = useGame((s) => s.lateFireExec);
  if (!late) return null;
  const seats: SuiteSeat[] = Object.values(execContent.domains).map((d) => {
    const e = late.execs.seats[d.id];
    return { domain: d.id, label: d.name, name: e?.name, competence: e?.competence, morale: e?.morale };
  });
  return (
    <>
      <CSuiteHero
        seats={seats}
        marketCount={late.execs.market.length}
        refreshWeeks={execContent.tuning.market_refresh_weeks - late.execs.weeks_since_refresh}
      />
      <ExecutivesTab
        state={late.execs}
        domains={execContent.domains}
        traits={execContent.traits}
        quality={late.slice.execQualityByDomain}
        stature={late.slice.stature}
        onHire={onHire}
        onFire={onFire}
      />
    </>
  );
}

export function ContractsTabLive() {
  const late = useGame((s) => s.game?.late);
  const content = useGame((s) => s.content.late);
  const onTake = useGame((s) => s.lateTakeContract);
  if (!late) return null;
  const cs = late.slice.contracts;
  const share = govShare(cs, content.contractTemplates, content.customers);
  const deals: DealFolder[] = cs.active.map((a, i) => {
    const t = content.contractTemplates[a.template_id];
    return {
      id: `${a.template_id}-${i}`,
      name: t?.name ?? a.template_id,
      weeksLeft: a.weeks_left,
      termWeeks: t?.payment.term_weeks ?? a.weeks_left,
      gov: (t && content.customers[t.customer]?.channel === "government") ?? false,
      perYear: t?.payment.recurring_per_year ?? 0,
    };
  });
  return (
    <>
      <DealRoomHero
        share={share}
        identity={mixIdentity(share)}
        entanglement={cs.entanglement}
        deals={deals}
        marketCount={cs.market.length}
        refreshWeeks={CONTRACT_TUNING.refresh_weeks - cs.weeks_since_refresh}
        clearances={cs.clearances}
      />
      <ContractsTab
        state={cs}
        templates={content.contractTemplates}
        customers={content.customers}
        cfo={cfoProfile(late.execs)}
        rng={uiRng(late.slice.week)}
        onTake={onTake}
      />
    </>
  );
}

const RIVAL_COLORS = ["#f4716f", "#e8c76a", "#bd9dff", "#46d6c8", "#f0b54e", "#9fb0cc"];

export function StandingTabLive() {
  const late = useGame((s) => s.game?.late);
  const content = useGame((s) => s.content.late);
  const company = useGame((s) => s.game?.company);
  if (!late || !company) return null;
  const s = late.slice;
  const race: RaceRow[] = [
    { id: "__you__", name: company.name, stature: s.stature, phase: "done", surging: false, you: true, color: company.color },
    ...s.rivals.map((r, i) => ({
      id: r.def_id,
      name: content.rivalDefs[r.def_id]?.name ?? r.def_id,
      stature: r.stature,
      phase: r.phase,
      surging: r.surge_until > s.week,
      color: RIVAL_COLORS[i % RIVAL_COLORS.length]!,
    })),
  ];
  // The loader hoists legacy ids into megaMeta (not on_complete) — read there.
  const legacies: LegacyPlaque[] = Object.values(content.megaMeta)
    .filter((m) => m.legacy)
    .map((m) => {
      const id = m.legacy!;
      const claimed = s.claimedLegacies[id];
      return {
        id,
        name: m.name,
        by: claimed === "player" ? ("you" as const) : claimed ? ("rival" as const) : null,
        ...(claimed && claimed !== "player" ? { byName: content.rivalDefs[claimed]?.name ?? claimed } : {}),
      };
    });
  const eraName = content.eras.find((e) => e.id === s.era)?.name ?? s.era;
  return (
    <>
      <PowerMapHero
        power={s.powerAxis.power}
        reputation={s.powerAxis.reputation}
        regulation={s.powerAxis.regulationLevel}
        era={eraName}
        race={race}
        legacies={legacies}
      />
      <StandingTab s={s} c={content} />
    </>
  );
}

export function BriefingTabLive() {
  const late = useGame((s) => s.game?.late);
  if (!late) return null;
  return <HomeTab reports={late.reports} week={late.slice.week} />;
}
