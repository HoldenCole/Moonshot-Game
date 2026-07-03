// ============================================================================
// rivals.ts — The other titans. Each rival advances a research→build→claim
// pipeline toward its ordered ambitions, generates news beats, and can claim
// legacy victories FIRST. Pure + seeded like every engine.
// ============================================================================

export interface RivalDef {
  id: string; name: string; ceo: string; tagline: string;
  branches: string[]; home_subs: string[];
  aggression: number; variance: number;
  starting_stature: number; stature_growth_per_year: number;
  ambitions: string[];               // ordered megaproject ids
  news_style: string; description: string;
}
export interface RivalTuning {
  research_weeks_base: number; build_time_mult: number;
  setback_chance: number; setback_delay_weeks: number;
  ambient_beats_per_year: number; poach_attribution: number;
  surge_chance_per_year: number; surge_weeks: number; surge_mult: number;
  pressure_per_player_legacy: number;
  poach_attempt_per_year: number; poach_base_success: number;
}
export interface PlayerSnapshot {
  activeMegas: string[]; completedMegas: string[];
  stature: number; power: number; legaciesClaimed: number;
}
export interface RivalState {
  def_id: string; stature: number;
  ambition_idx: number;              // which ambition they're on
  phase: "research" | "build" | "done";
  research_weeks_done: number; research_weeks_needed: number;
  build_weeks_done: number; build_weeks_needed: number; stage_idx: number;
  completed_megas: string[];
  surge_until: number;               // crash-program deadline (0 = not surging)
  aggression_bonus: number;          // fury from being beaten — permanent pace bump
  reacted_beaten: string[];          // legacies whose loss they've already reacted to
}
export interface RivalNews {
  rival_id: string; rival_name: string;
  kind: "breakthrough" | "groundbreak" | "stage" | "setback" | "completion" | "legacy_claim" | "ambient"
      | "surge" | "beaten" | "second_place" | "poach" | "poach_resisted" | "pressure";
  week: number; text: string;
}

// mega meta the rival pipeline needs: total build weeks + stage count + legacy
export interface MegaMeta { total_weeks: number; n_stages: number; legacy?: string; name: string }

const REACT: Record<string, { surge: string; beaten: string; second: string }> = {
  swagger: {
    surge: "{name} goes to a wartime footing on {mega} — {ceo}: \"We didn't come this far to watch.\"",
    beaten: "{ceo} congratulates you through visibly gritted teeth, then cancels three vacations. {name} is furious.",
    second: "{name} finishes {mega} anyway. {ceo} calls second place \"a rounding error\" — nobody on the livestream believes him." },
  silent: {
    surge: "{name} says nothing about {mega}. Its compute orders double.",
    beaten: "{name} issues no statement. Alumni report the lights haven't gone off in weeks.",
    second: "{name} completes {mega} without a press release. The silence reads as a promise." },
  institutional: {
    surge: "{name} reallocates an entire division to {mega}. The memo leaks; the stock rises.",
    beaten: "{name} notes your achievement in a shareholder letter, then triples the relevant budget line.",
    second: "{name} completes {mega} and files it under 'capacity.' Institutions don't grieve; they compound." },
  earnest: {
    surge: "{ceo} on {mega}: \"If it's a race, then let it be a race — the planet wins either way.\" {name} accelerates.",
    beaten: "{ceo} sends genuine congratulations and a job offer to your program lead in the same hour.",
    second: "{name} finishes {mega} and {ceo} attends YOUR ribbon-cuttings now. It is somehow worse than anger." },
  evangelist: {
    surge: "{ceo} tells a conference {mega} \"was always ours to finish.\" {name}'s hiring page triples overnight.",
    beaten: "{ceo}'s keynote doesn't mention you by name. It doesn't have to. {name} pivots hard.",
    second: "{name} ships {mega} with a rebrand and a launch event. The market briefly forgets who was first." },
  patrician: {
    surge: "{name} quietly retains three more contractors for {mega}. Kessler projects do not miss twice.",
    beaten: "Marta Kessler sends a handwritten note of congratulation. The family has outlasted worse.",
    second: "{name} completes {mega} to its own standard, on its own clock. History, the family believes, is patient." },
};

const AMBIENT: Record<string, string[]> = {
  swagger: ["{ceo} unveils a next-generation vehicle to a stadium crowd.",
            "{name} posts a landing video set to opera. It has 400M views.",
            "{ceo}, asked about competitors: \"Who?\""],
  silent: ["{name} quietly leases another gigawatt of datacenter capacity.",
           "A {name} recruiter has been calling your senior researchers.",
           "Satellite photos show {name}'s campus has doubled. No press release."],
  institutional: ["{name} announces record foundry utilization and says nothing else.",
                  "{name} files 1,200 patents in a single quarter.",
                  "A state delegation tours {name}'s newest fab."],
  earnest: ["{ceo} addresses a climate summit: \"The grid of the future is overhead.\"",
            "{name} signs power-purchase letters of intent with three governments.",
            "{name} publishes its engineering roadmap. It is disturbingly credible."],
  evangelist: ["{ceo} keynotes: \"Every industry becomes software. Ours.\"",
               "{name} acquires two more vertical-SaaS firms before lunch.",
               "{name}'s platform quietly becomes mandatory for an entire supply chain."],
  patrician: ["{name} breaks ground on infrastructure it won't discuss for a decade.",
              "Marta Kessler declines an interview. The stock rises anyway.",
              "{name} hires half a graduating class of structural engineers."],
};

export function initRivals(defs: Record<string, RivalDef>, tuning: RivalTuning,
                           megaMeta: Record<string, MegaMeta>): RivalState[] {
  return Object.values(defs).map(d => {
    const first = d.ambitions[0];
    return {
      def_id: d.id, stature: d.starting_stature, ambition_idx: 0, phase: "research" as const,
      research_weeks_done: 0,
      research_weeks_needed: Math.round(tuning.research_weeks_base / d.aggression),
      build_weeks_done: 0,
      build_weeks_needed: Math.round((megaMeta[first!]?.total_weeks ?? 300) * tuning.build_time_mult),
      stage_idx: 0, completed_megas: [],
      surge_until: 0, aggression_bonus: 0, reacted_beaten: [],
    };
  });
}

export function tickRivals(
  states: RivalState[], defs: Record<string, RivalDef>, tuning: RivalTuning,
  megaMeta: Record<string, MegaMeta>, claimedLegacies: Record<string, string>,
  week: number, weeks: number, rng: () => number, player?: PlayerSnapshot
): RivalNews[] {
  const news: RivalNews[] = [];
  // the field feels your wins: every player legacy quickens every rival
  const pressureMult = 1 + tuning.pressure_per_player_legacy * (player?.legaciesClaimed ?? 0);
  for (const s of states) {
    const d = defs[s.def_id]!;
    const react = (REACT[d.news_style] ?? REACT.institutional)!;
    const curMega = d.ambitions[s.ambition_idx]!;
    const curMeta = megaMeta[curMega];
    const fill = (t: string) => t.replace(/{ceo}/g, d.ceo).replace(/{name}/g, d.name)
      .replace(/{mega}/g, curMeta?.name ?? curMega);
    // BEATEN: the player claimed the legacy this rival is currently chasing
    if (s.phase !== "done" && curMeta?.legacy && claimedLegacies[curMeta.legacy] === "player"
        && !s.reacted_beaten.includes(curMeta.legacy)) {
      s.reacted_beaten.push(curMeta.legacy);
      s.aggression_bonus += 0.15;
      news.push({ rival_id: d.id, rival_name: d.name, kind: "beaten", week, text: fill(react.beaten) });
    }
    // SURGE: the player is actively building the same mega — crash program
    if (s.phase !== "done" && player?.activeMegas.includes(curMega) && week >= s.surge_until
        && curMeta?.legacy && !claimedLegacies[curMeta.legacy]
        && rng() < (tuning.surge_chance_per_year * weeks) / 52) {
      s.surge_until = week + tuning.surge_weeks;
      news.push({ rival_id: d.id, rival_name: d.name, kind: "surge", week, text: fill(react.surge) });
    }
    const paceMult = pressureMult * (week < s.surge_until ? tuning.surge_mult : 1)
      * (1 + s.aggression_bonus);
    // stature drift
    s.stature *= Math.pow(1 + d.stature_growth_per_year, weeks / 52);
    // ambient beat roll
    if (rng() < (tuning.ambient_beats_per_year * weeks) / 52) {
      const pool = (AMBIENT[d.news_style] ?? AMBIENT.institutional)!;
      news.push({ rival_id: d.id, rival_name: d.name, kind: "ambient", week,
        text: pool[Math.floor(rng() * pool.length)]!.replace(/{ceo}/g, d.ceo).replace(/{name}/g, d.name) });
    }
    if (s.phase === "done") continue;
    const mega = d.ambitions[s.ambition_idx]!;
    const meta = megaMeta[mega];
    if (!meta) { s.phase = "done"; continue; }

    if (s.phase === "research") {
      // variance: each tick's progress swings by ±variance; reactive pace applies
      s.research_weeks_done += weeks * paceMult * (1 + (rng() * 2 - 1) * d.variance);
      if (s.research_weeks_done >= s.research_weeks_needed) {
        s.phase = "build"; s.build_weeks_done = 0; s.stage_idx = 0;
        s.build_weeks_needed = Math.round(meta.total_weeks * tuning.build_time_mult);
        news.push({ rival_id: d.id, rival_name: d.name, kind: "groundbreak", week,
          text: `${d.name} announces ${meta.name} — ${d.ceo} calls it "the company's whole reason to exist."` });
      }
    } else if (s.phase === "build") {
      s.build_weeks_done += weeks * paceMult;
      const perStage = s.build_weeks_needed / meta.n_stages;
      const newStage = Math.min(meta.n_stages - 1, Math.floor(s.build_weeks_done / perStage));
      if (newStage > s.stage_idx) {
        s.stage_idx = newStage;
        if (rng() < tuning.setback_chance) {
          s.build_weeks_done -= tuning.setback_delay_weeks;
          news.push({ rival_id: d.id, rival_name: d.name, kind: "setback", week,
            text: `${d.name}'s ${meta.name} slips — a stage-${newStage + 1} failure sets the program back months.` });
        } else {
          news.push({ rival_id: d.id, rival_name: d.name, kind: "stage", week,
            text: `${d.name}'s ${meta.name} clears stage ${newStage + 1} of ${meta.n_stages}.` });
        }
      }
      if (s.build_weeks_done >= s.build_weeks_needed) {
        s.completed_megas.push(mega);
        news.push({ rival_id: d.id, rival_name: d.name, kind: "completion", week,
          text: `${d.name} completes ${meta.name}.` });
        if (meta.legacy && !claimedLegacies[meta.legacy]) {
          claimedLegacies[meta.legacy] = d.id;
          news.push({ rival_id: d.id, rival_name: d.name, kind: "legacy_claim", week,
            text: `HISTORY: ${d.name} claims "${meta.legacy.replace(/_/g, " ")}" — ${d.ceo} takes the podium that could have been yours.` });
        } else if (meta.legacy && claimedLegacies[meta.legacy] === "player") {
          news.push({ rival_id: d.id, rival_name: d.name, kind: "second_place", week,
            text: fill(REACT[d.news_style]?.second ?? REACT.institutional!.second)
              .replace(/{mega}/g, meta.name) });
        }
        // next ambition
        s.ambition_idx += 1;
        if (s.ambition_idx >= d.ambitions.length) s.phase = "done";
        else {
          const nxt = d.ambitions[s.ambition_idx]!;
          s.phase = "research"; s.research_weeks_done = 0;
          s.research_weeks_needed = Math.round(tuning.research_weeks_base / d.aggression);
          s.build_weeks_needed = Math.round((megaMeta[nxt]?.total_weeks ?? 300) * tuning.build_time_mult);
        }
      }
    }
  }
  return news;
}

// where each rival stands, for the UI ("Helion: Mars Transit Line, stage 2/3")
export function rivalStanding(s: RivalState, d: RivalDef, megaMeta: Record<string, MegaMeta>) {
  if (s.phase === "done") return { headline: "ambitions complete", detail: `${s.completed_megas.length} megaprojects built` };
  const mega = d.ambitions[s.ambition_idx]!;
  const meta = megaMeta[mega];
  if (s.phase === "research")
    return { headline: `researching toward ${meta?.name ?? mega}`,
      detail: `${Math.round(100 * s.research_weeks_done / s.research_weeks_needed)}% to gate` };
  return { headline: `building ${meta?.name ?? mega}`,
    detail: `stage ${s.stage_idx + 1}/${meta?.n_stages ?? "?"} · ${Math.round(100 * s.build_weeks_done / s.build_weeks_needed)}%` };
}

// ============================================================================
// Poaching — rivals raid the player's leadership by name. Composes with the
// executives engine: the store passes the seats in; poached seats empty.
// ============================================================================
import type { SeatedExec, TraitDef } from "./executives";

export function tickRivalPoaching(
  states: RivalState[], defs: Record<string, RivalDef>, tuning: RivalTuning,
  seats: Record<string, SeatedExec>, traits: Record<string, TraitDef>,
  week: number, weeks: number, rng: () => number
): { news: RivalNews[]; poachedDomains: string[] } {
  const news: RivalNews[] = [];
  const poachedDomains: string[] = [];
  const hungry = states.map(s => ({ s, d: defs[s.def_id]! }))
    .filter(x => x.s.phase !== "done");
  if (!hungry.length) return { news, poachedDomains };
  for (const [domain, e] of Object.entries(seats)) {
    const attemptP = (tuning.poach_attempt_per_year * weeks) / 52
      * (0.5 + e.competence / 150);                       // the best people get called most
    if (rng() >= attemptP) continue;
    // the raider: aggression-weighted (plus fury)
    const weights = hungry.map(x => x.d.aggression + x.s.aggression_bonus);
    let roll = rng() * weights.reduce((a, b) => a + b, 0);
    let raider = hungry[0]!;
    for (let i = 0; i < hungry.length; i++) { roll -= weights[i]!; if (roll <= 0) { raider = hungry[i]!; break; } }
    // success odds: underpayment + low morale open the door; loyalty closes it.
    // Paying people what they ask is real protection — the damper is strong by design.
    let p = tuning.poach_base_success;
    if (e.paid_salary < e.ask_salary) p += 0.35;
    else p *= 0.15;
    p += (1 - e.morale) * 0.25;
    if (e.traits.includes("star")) p += 0.1;
    for (const t of e.traits) {
      const dm = traits[t]?.effects?.defection_mult;
      if (dm !== undefined) p *= dm;
    }
    if (rng() < p) {
      delete seats[domain];
      poachedDomains.push(domain);
      news.push({ rival_id: raider.d.id, rival_name: raider.d.name, kind: "poach", week,
        text: `${raider.d.name} poaches ${e.name}, your ${domain.replace(/_/g, " ")} — ${raider.d.ceo} announces the hire personally. The seat sits empty.` });
    } else {
      e.morale = Math.min(1, e.morale + 0.05);            // being wanted (and staying) feels good
      news.push({ rival_id: raider.d.id, rival_name: raider.d.name, kind: "poach_resisted", week,
        text: `${e.name} turned down ${raider.d.name}'s offer${e.paid_salary >= e.ask_salary ? " without a meeting" : " — this time"}. Loyalty like that is worth what you pay for it.` });
    }
  }
  return { news, poachedDomains };
}

// threat read for the UI: is this rival racing something the player cares about?
export function rivalThreat(s: RivalState, d: RivalDef, playerActiveMegas: string[],
                            claimedLegacies: Record<string, string>,
                            megaMeta: Record<string, MegaMeta>): "racing_you" | "contests_future" | "dormant" {
  if (s.phase === "done") return "dormant";
  const cur = d.ambitions[s.ambition_idx];
  if (playerActiveMegas.includes(cur!)) return "racing_you";
  const legacy = megaMeta[cur!]?.legacy;
  if (legacy && !claimedLegacies[legacy]) return "contests_future";
  return "dormant";
}
