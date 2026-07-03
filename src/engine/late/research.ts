// ============================================================================
// research.ts — The R&D tree engine (doc 09)
// Pure, deterministic. Slots, project state machine, and the goal-path planner.
// ============================================================================

export type NodeKind = "applied" | "advanced" | "frontier" | "cross_domain";
export type NodeState = "locked" | "available" | "in_progress" | "complete";

export interface ResearchNode {
  id: string;
  name: string;
  kind: NodeKind;
  sub_industry: string;            // owning front ("" or "cross" for cross_domain)
  requires_fronts?: string[];      // cross-domain: fronts you must operate
  prereqs: string[];               // node ids
  rd_gates?: Record<string, number>; // line -> min level
  cost: number;                    // $M
  weeks: number;
  grants?: { capability_tags?: string[]; synergy_tags?: string[]; unlocks_products?: string[] };
  gates_megaproject?: string;      // frontier nodes: the megaproject this gates
}

export interface ResearchState {
  nodes: Record<string, { state: NodeState; progress_weeks: number }>;
  slots_total: number;             // 1 at start; infra grants add; hard cap 5
  goal_id: string | null;
}

export const RESEARCH_SLOT_CAP = 5;

export function initResearch(all: ResearchNode[]): ResearchState {
  const nodes: ResearchState["nodes"] = {};
  for (const n of all) nodes[n.id] = { state: "locked", progress_weeks: 0 };
  return { nodes, slots_total: 1, goal_id: null };
}

export function slotsUsed(s: ResearchState): number {
  return Object.values(s.nodes).filter(n => n.state === "in_progress").length;
}

/** Recompute availability: prereqs complete + rd gates met + fronts operated. */
export function refreshAvailability(
  s: ResearchState, all: Record<string, ResearchNode>,
  rdLevels: Record<string, Record<string, number>>,  // front -> line -> level
  frontsOperated: string[]
): void {
  for (const id in s.nodes) {
    const st = s.nodes[id];
    if (st!.state === "complete" || st!.state === "in_progress") continue;
    const n = all[id];
    const prereqsOk = n!.prereqs.every(p => s.nodes[p]?.state === "complete");
    const frontsOk = !n!.requires_fronts || n!.requires_fronts.every(f => frontsOperated.includes(f));
    let gatesOk = true;
    if (n!.rd_gates) {
      const lv = rdLevels[n!.sub_industry] ?? {};
      gatesOk = Object.entries(n!.rd_gates).every(([line, min]) => (lv[line] ?? 0) >= min);
    }
    st!.state = prereqsOk && frontsOk && gatesOk ? "available" : "locked";
  }
}

export function startProject(s: ResearchState, all: Record<string, ResearchNode>, id: string):
  { ok: true; cost: number } | { ok: false; reason: string } {
  const st = s.nodes[id];
  if (!st || st.state !== "available") return { ok: false, reason: "not_available" };
  if (slotsUsed(s) >= s.slots_total) return { ok: false, reason: "no_slots" };
  return { ok: true, cost: all[id]!.cost };  // caller deducts cash then calls commitProject
}
export function commitProject(s: ResearchState, id: string): void {
  s.nodes[id]!.state = "in_progress";
  s.nodes[id]!.progress_weeks = 0;
}

/** Per-turn tick. rd_speed_mult = infra × synergies (engine-clamped upstream). */
export function tickResearch(
  s: ResearchState, all: Record<string, ResearchNode>, weeksElapsed: number, rd_speed_mult: number
): string[] {
  const completed: string[] = [];
  for (const id in s.nodes) {
    const st = s.nodes[id];
    if (st!.state !== "in_progress") continue;
    st!.progress_weeks += weeksElapsed * rd_speed_mult;
    if (st!.progress_weeks >= all[id]!.weeks) { st!.state = "complete"; completed.push(id); }
  }
  return completed;
}

// ---------------------------------------------------------------------------
// GOAL-PATH PLANNER (the Research tab's killer feature)
// ---------------------------------------------------------------------------
export interface GoalPath {
  goal_id: string;
  ordered: { id: string; front: string; status: "done" | "in_progress" | "next" | "later" }[];
  remaining_cost: number;
  remaining_weeks: number;         // critical-path estimate (per-front parallel)
  start_now: string[];             // available nodes on the path
  blocker: string | null;          // the front whose chain is longest & least started
}

export function computeGoalPath(
  s: ResearchState, all: Record<string, ResearchNode>, goalId: string
): GoalPath {
  // Reverse-collect the prereq closure of the goal.
  const inPath = new Set<string>();
  const stack = [goalId];
  while (stack.length) {
    const id = stack.pop()!;
    if (inPath.has(id)) continue;
    inPath.add(id);
    for (const p of all[id]!.prereqs) stack.push(p);
  }
  // Topological order (Kahn) over the path subgraph.
  const indeg: Record<string, number> = {}; const order: string[] = [];
  for (const id of inPath) indeg[id] = all[id]!.prereqs.filter(p => inPath.has(p)).length;
  const q = [...inPath].filter(id => indeg[id] === 0).sort();
  while (q.length) {
    const id = q.shift()!; order.push(id);
    for (const other of inPath) if (all[other]!.prereqs.includes(id) && --(indeg[other]!) === 0) q.push(other);
  }
  // Status per node + totals + per-front remaining weeks (parallel fronts).
  let cost = 0; const frontWeeks: Record<string, number> = {};
  const blockerWeeks: Record<string, number> = {};   // excludes the goal node (it's the destination, not a lagging pillar)
  const startNow: string[] = [];
  const ordered = order.map(id => {
    const st = s.nodes[id]!.state; const n = all[id]!;
    let status: "done" | "in_progress" | "next" | "later";
    if (st === "complete") status = "done";
    else if (st === "in_progress") status = "in_progress";
    else if (st === "available") { status = "next"; startNow.push(id); }
    else status = "later";
    if (st !== "complete") {
      cost += n!.cost;
      const f = n!.sub_industry || "cross";
      const w = st === "in_progress" ? Math.max(0, n.weeks - s.nodes[id]!.progress_weeks) : n.weeks;
      frontWeeks[f] = (frontWeeks[f] ?? 0) + w;
      if (id !== goalId) blockerWeeks[f] = (blockerWeeks[f] ?? 0) + w;
    }
    return { id, front: n!.sub_industry || "cross", status };
  });
  // ETA = the longest front chain (per-front serial, fronts parallel). Blocker = the longest PRE-goal chain.
  let eta = 0; for (const w of Object.values(frontWeeks)) if (w > eta) eta = w;
  let blocker: string | null = null; let worst = 0;
  for (const [f, w] of Object.entries(blockerWeeks)) if (w > worst) { worst = w; blocker = f; }
  return { goal_id: goalId, ordered, remaining_cost: cost, remaining_weeks: eta, start_now: startNow, blocker };
}
