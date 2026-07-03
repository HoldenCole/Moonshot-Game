// ============================================================================
// pacing.ts — The arc engines: eras (the explicit progression), macro cycles
// (booms and winters — the systemic downs), and pressures (multi-turn
// adversity arcs). Pure + seeded. These are what make turns breathe.
// ============================================================================

// ---------------- eras ----------------
export interface EraDef {
  id: string; name: string; order: number;
  enter: { stature_min?: number; stature_below?: number; power_min?: number; any?: boolean };
  texture: string; transition_prose: string;
}
export function currentEra(defs: EraDef[], stature: number, power: number): EraDef {
  const sorted = [...defs].sort((a, b) => b.order - a.order);
  for (const e of sorted) {
    const g = e.enter;
    const checks: boolean[] = [];
    if (g.stature_min !== undefined) checks.push(stature >= g.stature_min);
    if (g.power_min !== undefined) checks.push(power >= g.power_min);
    if (g.stature_below !== undefined) checks.push(stature < g.stature_below);
    const met = g.any ? checks.some(Boolean) : checks.every(Boolean);
    if (met) return e;
  }
  return [...defs].sort((a, b) => a.order - b.order)[0]!;
}

// ---------------- macro cycles ----------------
export type CyclePhase = "steady" | "boom" | "winter";
export interface CycleTuning {
  steady_weeks_range: [number, number]; boom_weeks_range: [number, number];
  winter_weeks_range: [number, number]; p_boom_from_steady: number;
  boom_payment_mult: number; boom_growth_mult: number; boom_extra_offers: number;
  winter_payment_mult: number; winter_growth_mult: number; winter_offer_penalty: number;
  prose: { boom_start: string; boom_end: string; winter_start: string; winter_end: string };
}
export interface CycleState { phase: CyclePhase; weeks_left: number; last_swing?: "boom" | "winter" }
const span = (r: [number, number], rng: () => number) => Math.round(r[0] + rng() * (r[1] - r[0]));

export function initCycle(t: CycleTuning, rng: () => number): CycleState {
  return { phase: "steady", weeks_left: span(t.steady_weeks_range, rng) };
}
export function tickCycle(s: CycleState, t: CycleTuning, weeks: number, rng: () => number):
  { changed: boolean; prose?: string } {
  s.weeks_left -= weeks;
  if (s.weeks_left > 0) return { changed: false };
  if (s.phase === "steady") {
    // bias against repeating the last swing: the economy alternates
    const pBoom = s.last_swing === "boom" ? 0.25 : s.last_swing === "winter" ? 0.75 : t.p_boom_from_steady;
    const boom = rng() < pBoom;
    s.phase = boom ? "boom" : "winter";
    s.last_swing = s.phase;
    s.weeks_left = span(boom ? t.boom_weeks_range : t.winter_weeks_range, rng);
    return { changed: true, prose: boom ? t.prose.boom_start : t.prose.winter_start };
  }
  const ending = s.phase;
  s.phase = "steady";
  s.weeks_left = span(t.steady_weeks_range, rng);
  return { changed: true, prose: ending === "boom" ? t.prose.boom_end : t.prose.winter_end };
}
export function cycleModifiers(s: CycleState, t: CycleTuning) {
  if (s.phase === "boom") return { payment_mult: t.boom_payment_mult, growth_mult: t.boom_growth_mult, offer_delta: t.boom_extra_offers };
  if (s.phase === "winter") return { payment_mult: t.winter_payment_mult, growth_mult: t.winter_growth_mult, offer_delta: -t.winter_offer_penalty };
  return { payment_mult: 1, growth_mult: 1, offer_delta: 0 };
}

// ---------------- pressures ----------------
export interface PressureDef {
  id: string; name: string; duration_weeks: number;
  modifiers: { contract_payment_mult?: number; build_cost_mult?: number; opex_mult?: number;
               rd_speed_mult?: number; reputation_drift?: number };
  on_start: string; on_end: string; triggered_by: string[];
}
export interface ActivePressure { def_id: string; weeks_left: number }

export function pressureTriggerMap(defs: PressureDef[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const d of defs) for (const ev of d.triggered_by) m[ev] = d.id;
  return m;
}
/** Fired events -> newly started pressures (no stacking of the same pressure). */
export function startPressures(active: ActivePressure[], defs: Record<string, PressureDef>,
                               trigger: Record<string, string>, firedEventIds: string[]): PressureDef[] {
  const started: PressureDef[] = [];
  for (const ev of firedEventIds) {
    const pid = trigger[ev];
    if (!pid || active.some(a => a.def_id === pid)) continue;
    active.push({ def_id: pid, weeks_left: defs[pid]!.duration_weeks });
    started.push(defs[pid]!);
  }
  return started;
}
export function tickPressures(active: ActivePressure[], defs: Record<string, PressureDef>, weeks: number):
  { ended: PressureDef[] } {
  const ended: PressureDef[] = [];
  for (const a of active) a.weeks_left -= weeks;
  for (let i = active.length - 1; i >= 0; i--)
    if (active[i]!.weeks_left <= 0) { ended.push(defs[active[i]!.def_id]!); active.splice(i, 1); }
  return { ended };
}
export function pressureModifiers(active: ActivePressure[], defs: Record<string, PressureDef>) {
  const out = { contract_payment_mult: 1, build_cost_mult: 1, opex_mult: 1, rd_speed_mult: 1, reputation_drift: 0 };
  for (const a of active) {
    const m = defs[a.def_id]!.modifiers;
    out.contract_payment_mult *= m.contract_payment_mult ?? 1;
    out.build_cost_mult *= m.build_cost_mult ?? 1;
    out.opex_mult *= m.opex_mult ?? 1;
    out.rd_speed_mult *= m.rd_speed_mult ?? 1;
    out.reputation_drift += m.reputation_drift ?? 0;
  }
  return out;
}
