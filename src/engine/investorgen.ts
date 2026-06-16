// Procedural investor generation (anchors-as-archetypes, mirroring worldgen for
// companies). The 7 hand-authored firms ARE the archetypes: each generated firm
// picks a base anchor, varies its personality / focus / fund, and is assigned a
// stage so the full roster covers seed → growth (every round has eligible
// leads). Deterministic from a fixed seed, so firm ids are stable across games
// and every reference to them resolves. Generated at content-load, so the rest
// of the app reads `content.investors` unchanged — just a bigger roster.

import type { InvestorContent } from "@/domain/content";
import type { Industry, Stage } from "@/domain/ids";
import { type Rng, makeRng, nextFloat, nextInt, nextRange, pick } from "./rng";

type Investor = InvestorContent["firm"];

const FIRM_PREFIX = [
  "Northgate", "Silverline", "Ironwood", "Brightwater", "Keystone", "Highmark", "Crestline", "Westford",
  "Tidewater", "Cardinal", "Emberline", "Two Rivers", "Ridgeline", "Copperfield", "Stonebridge", "Fathom",
  "Lodestar", "Wavelength", "Outset", "Magnitude", "Proxima", "Evergreen", "Halford", "Meridian Park",
];
const FIRM_SUFFIX = ["Ventures", "Capital", "Partners", "Group", "Equity", "Growth"];

const FIRST = [
  "Mara", "David", "Priya", "Sam", "Lin", "Noah", "Ava", "Diego", "Yuki", "Omar", "Hannah", "Theo",
  "Grace", "Raj", "Nina", "Marcus", "Sofia", "Ben", "Kira", "Andre", "Leah", "Tomas", "Iris", "Kofi",
];
const LAST = [
  "Okafor", "Lindqvist", "Mehta", "Caldwell", "Park", "Romano", "Bauer", "Nakamura", "Sullivan", "Adeyemi",
  "Fischer", "Delgado", "Whitman", "Chen", "Petrov", "Ibarra", "Holt", "Vance", "Suzuki", "Marchetti",
];
const TITLES = ["General Partner", "Managing Partner", "Partner", "Founding Partner"];
const TRAITS = [
  "Thesis-Driven", "Founder-Friendly", "Hard-Charging", "Patient Capital", "Contrarian", "Network-Heavy",
  "Operator-Led", "Concentrated", "High-Conviction", "Metrics-Driven", "Fast to Yes", "Tough Term Sheets",
  "Platform Support", "Quiet Money",
];
const THESES = [
  "Back the outliers early and hold through the noise.",
  "We price discipline, not hype — and we lead.",
  "Operators backing operators in hard tech.",
  "Conviction bets on the frontier, written with patience.",
  "We lead the round and follow on with the whole fund.",
  "Capital is commodity; the network is the edge.",
  "The unglamorous infrastructure is where it compounds.",
  "Concentrated, high-conviction, allergic to the consensus deck.",
  "Underwrite the team first, the market second, the multiple last.",
  "We move fast, then we don't move for a decade.",
];
const HOOKS = [
  "leans in when the metrics are still thin",
  "writes the term sheet others won't",
  "long memory, longer holding period",
  "the partner does the work, not the associate",
  "happiest one rung early",
  "drives a hard bargain, then shows up",
];
const COLORS = [
  "#5b82ff", "#46d6c8", "#f5b945", "#9b8cff", "#58c6f5", "#e879b9", "#5bd6a0", "#d98a3d", "#7a9bf0", "#c07be0",
];

/** Per-stage shape: the stretch range, fund size, check sizes, reputation band. */
const STAGE_PROFILE: Record<string, { range: [Stage, Stage]; fund: [number, number]; check: [number, number]; rep: [number, number] }> = {
  seed: { range: ["pre_seed", "series_a"], fund: [120, 380], check: [0.5, 12], rep: [55, 80] },
  series_a: { range: ["seed", "series_b"], fund: [350, 900], check: [4, 30], rep: [58, 84] },
  series_b: { range: ["series_a", "series_c"], fund: [800, 1900], check: [12, 60], rep: [60, 86] },
  series_c: { range: ["series_b", "growth"], fund: [1500, 3200], check: [25, 110], rep: [62, 88] },
  growth: { range: ["series_b", "late_stage"], fund: [2500, 6500], check: [50, 260], rep: [64, 90] },
};

// A repeating stage cycle so the generated roster spreads across the ladder
// rather than clustering at seed (where the anchors already sit).
const STAGE_CYCLE: Stage[] = ["seed", "series_a", "series_b", "growth", "series_a", "series_c", "seed", "series_b", "growth", "series_a", "series_c"];

const PLAYABLE: Industry[] = ["ai", "space"];
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Generate procedural firms from the anchors until the roster reaches `target`.
 *  Returns only the generated firms (the full roster is anchors + these). */
export function generateInvestors(seed: number, anchors: Investor[], target: number): Investor[] {
  const rng = makeRng((seed ^ 0x1d2c3b4a) >>> 0);
  const usedNames = new Set(anchors.map((a) => a.name.toLowerCase()));
  const usedPartners = new Set(anchors.map((a) => a.partner_name.toLowerCase()));
  const need = Math.max(0, target - anchors.length);
  const out: Investor[] = [];
  for (let i = 0; i < need; i++) {
    const base = pick(rng, anchors)!;
    const stage = STAGE_CYCLE[i % STAGE_CYCLE.length]!;
    out.push(generateFirm(rng, base, stage, usedNames, usedPartners, i));
  }
  return out;
}

function generateFirm(
  rng: Rng,
  base: Investor,
  stage: Stage,
  usedNames: Set<string>,
  usedPartners: Set<string>,
  idx: number,
): Investor {
  const name = uniqueName(rng, usedNames);
  const partner = uniquePartner(rng, usedPartners);
  const prof = STAGE_PROFILE[stage] ?? STAGE_PROFILE.seed!;

  // Personality varies off the chosen archetype, kept in a believable band.
  const p = (v: number) => clamp(Math.round(v + nextRange(rng, -18, 18)), 5, 95);

  // Mostly inherit the anchor's sector; sometimes cross to the other playable one.
  // Always focus a playable sector (where the player operates) — inherit the
  // anchor's when it's playable, otherwise roll one.
  const primary = PLAYABLE.includes(base.focus.primary_sector) && nextFloat(rng) < 0.65 ? base.focus.primary_sector : pick(rng, PLAYABLE)!;
  const secondary = nextFloat(rng) < 0.5 ? PLAYABLE.find((s) => s !== primary) : undefined;
  const checkMin = Math.round(nextRange(rng, prof.check[0], (prof.check[0] + prof.check[1]) / 2) * 10) / 10;
  const checkMax = Math.round(nextRange(rng, (prof.check[0] + prof.check[1]) / 2, prof.check[1]));

  return {
    id: `genvc_${idx}_${slug(name)}`,
    name,
    tier: "procedural",
    partner_name: partner,
    partner_title: pick(rng, TITLES)!,
    hq: base.hq,
    color: pick(rng, COLORS)!,
    identity: {
      thesis: pick(rng, THESES)!,
      reputation: Math.round(nextRange(rng, prof.rep[0], prof.rep[1])),
      trait_tags: pickN(rng, TRAITS, nextInt(rng, 2, 3)),
      narrative_hooks: pickN(rng, HOOKS, nextInt(rng, 1, 2)),
    },
    personality: {
      aggression: p(base.personality.aggression),
      patience: p(base.personality.patience),
      conviction: p(base.personality.conviction),
      founder_friendliness: p(base.personality.founder_friendliness),
      network_strength: p(base.personality.network_strength),
    },
    focus: {
      primary_sector: primary,
      ...(secondary ? { secondary_sector: secondary } : {}),
      primary_stage: stage,
      stage_range: prof.range,
      stretch_tolerance: Math.round(clamp(base.focus.stretch_tolerance + nextRange(rng, -0.2, 0.2), 0.2, 0.9) * 100) / 100,
    },
    fund: {
      fund_name: `${name.split(" ")[0]} Fund ${roman(nextInt(rng, 1, 6))}`,
      fund_size: Math.round(nextRange(rng, prof.fund[0], prof.fund[1])),
      vintage_year: -nextInt(rng, 1, 5),
      deployment_years: nextInt(rng, 3, 5),
      check_min: Math.max(0.25, checkMin),
      check_max: Math.max(checkMin + 1, checkMax),
    },
    relationships: { signature_portfolio: [], rival_firms: [] },
  };
}

function uniqueName(rng: Rng, used: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const name = `${pick(rng, FIRM_PREFIX)} ${pick(rng, FIRM_SUFFIX)}`;
    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase());
      return name;
    }
  }
  const fallback = `${pick(rng, FIRM_PREFIX)} ${pick(rng, FIRM_SUFFIX)} ${used.size}`;
  used.add(fallback.toLowerCase());
  return fallback;
}

function uniquePartner(rng: Rng, used: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const name = `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase());
      return name;
    }
  }
  const fallback = `${pick(rng, FIRST)} ${pick(rng, LAST)} ${used.size}`;
  used.add(fallback.toLowerCase());
  return fallback;
}

function pickN<T>(rng: Rng, pool: T[], n: number): T[] {
  const out: T[] = [];
  const avail = [...pool];
  for (let i = 0; i < n && avail.length > 0; i++) {
    const j = nextInt(rng, 0, avail.length - 1);
    out.push(avail.splice(j, 1)[0]!);
  }
  return out;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_");

function roman(n: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][Math.max(0, Math.min(7, n - 1))]!;
}
