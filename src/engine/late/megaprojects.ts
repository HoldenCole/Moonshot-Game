// ============================================================================
// megaprojects.ts — Convergence gates, the staged saga runner, repeatable math
// (doc 10 + the repeatable addition from the UI pass). Pure & seeded.
// ============================================================================

export interface MegaprojectDef {
  id: string; name: string; branch: "space" | "intelligence" | "energy" | "economic";
  repeatable: boolean;
  gate: {
    research: string[];            // research node ids (09)
    stature_min: number;           // $M market cap
    capital: number;               // $M on hand to commit
    exec_domain: string;           // required exec (12)
    capacity?: Record<string, number>;
    prereq_megas?: string[];
  };
  stages: { id: string; name: string; weeks: number; cost: number;
            setback_chance: number; catastrophe_chance: number;
            sub_economy_preview?: string }[];
  on_complete: { sub_economy?: string; power: number; synergies?: string[]; legacy_victory?: string };
  base_output: number;             // 100-unit reference for repeat scaling
}

export interface MegaState {
  builds: Record<string, number>;  // def id -> copies completed
  active: ActiveMega[];
  slots_total: number;             // base from 10's tuning; infra adds; cap 3
}
export interface ActiveMega {
  def_id: string; copy_n: number;  // 1 = first build
  stage_idx: number; stage_progress_weeks: number;
  log: { week: number; kind: "milestone" | "setback" | "catastrophe" | "start"; text: string }[];
}

export const MEGA_SLOT_CAP = 3;

// ---- THE FIRM REPEATABLE CURVES (pinned) ----
export const costMult   = (n: number) => n <= 1 ? 1.0 : Math.max(0.55, 1.0 - 0.15 * (n - 1));
export const outputAdd  = (n: number) => n <= 1 ? 100 : Math.round(Math.max(40, 100 * Math.pow(0.80, n - 1)));
export const powerAdd   = (n: number) => n <= 1 ? 2.0 : Math.round(Math.max(0.5, 2.0 * Math.pow(0.70, n - 1)) * 10) / 10;

export interface GateCheck { met: boolean; items: { key: string; label: string; met: boolean; fix_tab: string }[] }

export function checkGate(def: MegaprojectDef, ctx: {
  researchDone: Set<string>; stature: number; cash: number;
  execDomains: Set<string>; capacity: Record<string, number>; megasDone: Set<string>;
}): GateCheck {
  const items: GateCheck["items"] = [];
  for (const r of def.gate.research)
    items.push({ key: `research:${r}`, label: r, met: ctx.researchDone.has(r), fix_tab: "research" });
  items.push({ key: "stature", label: `Stature $${def.gate.stature_min / 1000}B`, met: ctx.stature >= def.gate.stature_min, fix_tab: "world" });
  items.push({ key: "capital", label: `Capital $${def.gate.capital / 1000}B on hand`, met: ctx.cash >= def.gate.capital, fix_tab: "capital" });
  items.push({ key: "exec", label: `${def.gate.exec_domain} executive`, met: ctx.execDomains.has(def.gate.exec_domain), fix_tab: "team" });
  for (const [c, amt] of Object.entries(def.gate.capacity ?? {}))
    items.push({ key: `cap:${c}`, label: `${c} ≥ ${amt}`, met: (ctx.capacity[c] ?? 0) >= amt, fix_tab: "build" });
  for (const m of def.gate.prereq_megas ?? [])
    items.push({ key: `mega:${m}`, label: `${m} complete`, met: ctx.megasDone.has(m), fix_tab: "megaprojects" });
  return { met: items.every(i => i.met), items };
}

export function beginMega(s: MegaState, def: MegaprojectDef, week: number):
  { ok: false; reason: string } | { ok: true; cost: number } {
  if (s.active.length >= s.slots_total) return { ok: false, reason: "no_slots" };
  const n = (s.builds[def.id] ?? 0) + 1;
  if (n > 1 && !def.repeatable) return { ok: false, reason: "singular_already_built" };
  const cost = Math.round(def.gate.capital * costMult(n));
  s.active.push({
    def_id: def.id, copy_n: n, stage_idx: 0, stage_progress_weeks: 0,
    log: [{ week, kind: "start", text: n === 1 ? `${def.name} begins.` : `${def.name} — build #${n} begins (${Math.round((1 - costMult(n)) * 100)}% cheaper).` }],
  });
  return { ok: true, cost };
}

export interface MegaTickResult {
  completed: { def_id: string; copy_n: number; power: number; output: number;
               opens_sub_economy?: string; scales_sub_economy?: string; legacy_victory?: string }[];
  beats: { def_id: string; kind: "milestone" | "setback" | "catastrophe"; text: string }[];
}

/** Per-turn saga tick. rng in [0,1), seeded upstream. Rolls are per-stage-completion. */
export function tickMegas(
  s: MegaState, defs: Record<string, MegaprojectDef>, week: number, weeksElapsed: number,
  execQuality: number,              // 0..1, reduces setback odds (the exec managing it)
  rng: () => number
): MegaTickResult {
  const out: MegaTickResult = { completed: [], beats: [] };
  for (let i = s.active.length - 1; i >= 0; i--) {
    const a = s.active[i]; const def = defs[a!.def_id]; const stage = def!.stages[a!.stage_idx];
    a!.stage_progress_weeks += weeksElapsed;
    if (a!.stage_progress_weeks < stage!.weeks) continue;
    // Stage complete — roll the tail.
    const setbackP = stage!.setback_chance * (1 - 0.4 * execQuality);
    const roll = rng();
    if (roll < stage!.catastrophe_chance) {
      a!.stage_progress_weeks = 0; // stage restarts
      const t = `Catastrophe at ${stage!.name} — the stage must be rebuilt.`;
      a!.log.push({ week, kind: "catastrophe", text: t });
      out.beats.push({ def_id: a!.def_id, kind: "catastrophe", text: t });
      continue;
    }
    if (roll < stage!.catastrophe_chance + setbackP) {
      a!.stage_progress_weeks = Math.max(0, stage!.weeks * 0.7); // ~30% of the stage redone
      const t = `Setback at ${stage!.name} — weeks lost, costs mount.`;
      a!.log.push({ week, kind: "setback", text: t });
      out.beats.push({ def_id: a!.def_id, kind: "setback", text: t });
      continue;
    }
    a!.log.push({ week, kind: "milestone", text: `${stage!.name} complete.` });
    out.beats.push({ def_id: a!.def_id, kind: "milestone", text: `${stage!.name} complete.` });
    a!.stage_idx++; a!.stage_progress_weeks = 0;
    if (a!.stage_idx >= def!.stages.length) {
      s.builds[a!.def_id] = a!.copy_n;
      const first = a!.copy_n === 1;
      out.completed.push({
        def_id: a!.def_id, copy_n: a!.copy_n,
        power: powerAdd(a!.copy_n), output: outputAdd(a!.copy_n),
        opens_sub_economy: first ? def!.on_complete.sub_economy : undefined,
        scales_sub_economy: !first ? def!.on_complete.sub_economy : undefined,
        legacy_victory: first ? def!.on_complete.legacy_victory : undefined,
      });
      s.active.splice(i, 1);
    }
  }
  return out;
}

/** The legible marginal readout for "build another" (UI rule: player always sees the math). */
export function buildAnotherReadout(_def: MegaprojectDef, builds: number) {
  const n = builds + 1;
  return {
    copy_n: n,
    cost_mult: costMult(n), cheaper_pct: Math.round((1 - costMult(n)) * 100),
    output_add: outputAdd(n), power_add: powerAdd(n),
    diversify_hint: outputAdd(n) <= 45, // at/near the floor → exec nudges toward a new frontier
  };
}
