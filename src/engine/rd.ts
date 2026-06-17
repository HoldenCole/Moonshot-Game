// R&D progress (doc 07 §3.1). Each advanced week, every funded line gains tech
// level: the weekly spend over the line's anchor cost, dampened by diminishing
// returns as the level climbs, and lifted by a "frontier pull" catch-up bonus
// when rivals are ahead. Pure arithmetic — no RNG.

import type { Company } from "@/content/load";
import type { ProductTuning, RDLine } from "@/domain/content";
import type { RDState } from "@/domain/products";

/** Tech levels are scored 0–100. */
export const LEVEL_CAP = 100;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Map a spec tag to the rival quality field that best represents it, so a line's
 *  frontier is read off the dimension it actually drives. Deliberately coarse —
 *  it's a balance lever, not a precise model. */
function rivalQualityForTag(c: Company, tag: string): number {
  if (/capab|perf|bench|payload|coverage|capacity|fit/.test(tag)) return c.signature?.benchmark_score ?? c.quality.execution;
  if (/reliab|safe/.test(tag)) return c.quality.fundamentals;
  if (/moat|stick|margin|cost|efficien|special/.test(tag)) return c.quality.moat;
  return c.quality.execution;
}

/** The frontier level a line is measured against: the strongest same-sector
 *  rival's quality on the dimensions this line drives, 0–100. 0 with no rivals. */
export function rivalFrontierLevel(line: RDLine, rivals: Company[]): number {
  if (rivals.length === 0) return 0;
  return Math.max(
    ...rivals.map((c) => {
      const vals = line.drives_specs.map((t) => rivalQualityForTag(c, t));
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }),
  );
}

/** The frontier level per line id, for a set of rivals (precomputed once a tick). */
export function rivalLevelsForLines(lines: RDLine[], rivals: Company[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lines) out[l.id] = rivalFrontierLevel(l, rivals);
  return out;
}

/** One week's level gain for a single line. */
export function rdLineDelta(
  level: number,
  spendWeek: number,
  baseCostPerQuarter: number,
  diminishingK: number,
  frontierPull: number,
  rivalLevel: number,
): number {
  if (spendWeek <= 0 || baseCostPerQuarter <= 0) return 0;
  const baseCostPerWeek = baseCostPerQuarter / 13; // ~1 level/qtr at full anchor spend
  const rawGain = spendWeek / baseCostPerWeek;
  const dim = Math.max(0.1, 1 - diminishingK * (level / 100)); // diminishing returns
  const gap = Math.max(0, rivalLevel - level);
  const pull = 1 + (frontierPull - 1) * clamp(gap / 40, 0, 1); // catch-up boost when behind
  return rawGain * dim * pull;
}

/** Advance every funded line one week, returning the new R&D state. */
export function advanceRD(rd: RDState, lines: RDLine[], tuning: ProductTuning, rivalLevels: Record<string, number>): RDState {
  const levels = { ...rd.levels };
  for (const line of lines) {
    const alloc = rd.allocation[line.id] ?? 0;
    if (alloc <= 0) continue;
    const spendWeek = rd.rd_budget_per_week * alloc;
    const level = levels[line.id] ?? line.starting_level;
    const delta = rdLineDelta(level, spendWeek, line.base_cost_per_quarter, tuning.rd_diminishing_k, tuning.frontier_pull, rivalLevels[line.id] ?? 0);
    levels[line.id] = Math.min(LEVEL_CAP, level + delta);
  }
  return { ...rd, levels };
}

/** A fresh R&D state for a sub-industry: levels at each line's start, budget
 *  split evenly, nothing committed yet. */
export function initRDState(lines: RDLine[]): RDState {
  const levels: Record<string, number> = {};
  const allocation: Record<string, number> = {};
  const share = lines.length ? 1 / lines.length : 0;
  for (const l of lines) {
    levels[l.id] = l.starting_level;
    allocation[l.id] = share;
  }
  return { levels, allocation, rd_budget_per_week: 0 };
}
