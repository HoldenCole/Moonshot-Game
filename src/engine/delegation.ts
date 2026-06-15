// Light delegation (Phase 9) — the cadence valve. Hire an exec per operating
// area and set its autonomy; areas set to "Handle it" auto-resolve their events
// on advance instead of pausing the player ("delegation IS the auto-decisions
// system"). Exec quality determines how well a handled decision goes. This is
// the same system the Mogul DLC extends, not a throwaway.

import type { Exec, ExecArea, GameState } from "@/domain/state";
import type { ResolvedEvent } from "@/domain/events";
import type { Money } from "@/domain/captable";
import { type Rng, nextInt, pick } from "./rng";

export const AREAS: ExecArea[] = ["finance", "operations", "revenue", "technical"];

export const AREA_LABEL: Record<ExecArea, string> = {
  finance: "Finance & Capital",
  operations: "Operations",
  revenue: "Revenue",
  technical: "Technical",
};

const ROLE: Record<ExecArea, string> = {
  finance: "CFO",
  operations: "COO",
  revenue: "Head of Revenue",
  technical: "Head of Research",
};

const FIRST = ["Lena", "Marcus", "Priya", "Sam", "Aria", "Theo", "Nadia", "Omar", "Mara", "Ivo", "Dana", "Yuki", "Rey", "Cleo"];
const LAST = ["Okafor", "Cho", "Renn", "Vance", "Sato", "Boone", "Adler", "Cruz", "Park", "Mensah", "Iyer", "Vos", "Haddad"];

/** Coarse area routing for an event, from keywords in its id. Personal events
 *  never delegate — they're always the founder's. */
export function eventArea(ev: { id: string; category: string }): ExecArea | null {
  // Personal and public-company calls (earnings, guidance, lockup) are the
  // founder's own — never an exec's to auto-handle.
  if (ev.category === "personal" || ev.category === "public") return null;
  const id = ev.id;
  // Ethics-laden calls (safety incidents, regulatory inquiries) are the founder's
  // conscience to weigh — never an exec's to silently auto-handle on advance.
  if (/safety|regulat|ethics|scandal|whistleblow|privacy|breach|cover_?up/.test(id)) return null;
  if (/megadeal|customer|enterprise|deal|undercut|oss|leapfrog|niche/.test(id)) return "revenue";
  if (/hype_peak|macro|rate|ipo|window|regulat|fund|capital/.test(id)) return "finance";
  if (/train|run|benchmark|chip|architecture|launch|safety|star|model|breakthrough|talent|poach|research/.test(id)) return "technical";
  return "operations"; // compute, supply, data, licensing, inference, …
}

export interface ExecCandidate extends Exec {
  /** Cash hiring cost, $M (signing + setup). */
  cost: Money;
}

/** Three rolled candidates for an area, varying in quality and price. */
export function generateCandidates(area: ExecArea, state: GameState, rng: Rng): ExecCandidate[] {
  const stageFactor = Math.max(1, state.company.financials.valuation / 200 + 1);
  // An Operator/Repeat founder lifts the hiring pool — better first execs.
  const floor = state.founder.execQualityFloor ?? 0;
  return Array.from({ length: 3 }, () => {
    const quality = Math.min(99, nextInt(rng, 42, 92) + floor);
    const cost = Math.round((0.15 + (quality / 100) * 0.5) * stageFactor * 100) / 100;
    return { name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`, role: ROLE[area], area, quality, cost };
  });
}

/** Whether an event should be auto-handled (delegated to a capable exec). */
export function isDelegated(state: GameState, area: ExecArea | null): boolean {
  if (!area) return false;
  return state.company.delegation[area] === "handle" && state.company.executives[area] != null;
}

/** Escalation threshold: a full-blown crisis always reaches the founder's desk,
 *  even in a "handle it" area — an exec doesn't get to quietly decide a crisis. */
export function shouldEscalate(event: ResolvedEvent): boolean {
  return event.tone === "crisis";
}

/** The exec who would advise on an area set to "recommend" (else null). */
export function recommendation(state: GameState, area: ExecArea | null, event: ResolvedEvent): number | null {
  if (!area || state.company.delegation[area] !== "recommend") return null;
  const exec = state.company.executives[area];
  return exec ? autoResolveChoice(exec, event) : null;
}

/** Which choice a delegated exec takes. Strong execs take the proactive action;
 *  weak ones default to the cautious/cheap option. Deterministic-ish. */
export function autoResolveChoice(exec: Exec, event: ResolvedEvent): number {
  const n = event.choices.length;
  if (n <= 1) return 0;
  if (exec.quality >= 65) return 0; // the decisive, proactive choice
  if (exec.quality >= 45) return Math.min(1, n - 1); // a measured middle
  return n - 1; // the passive / cheapest fallback
}

/** A short report line for a handled decision (shown instead of the modal). */
export function delegationReport(exec: Exec, event: ResolvedEvent, choiceIndex: number): string {
  const choice = event.choices[choiceIndex];
  return `${exec.name} (${exec.role}) handled it — ${choice?.label.toLowerCase() ?? "resolved"}.`;
}
