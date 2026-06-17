// Core identifier vocabularies for the world model.
// Kept narrow where V1 commits to a fixed set, open where the long tail
// (light industries, procedural sub-industries) varies per save.

/** The eight frontier industries. AI + Space are playable in V1; the rest
 *  exist as investment targets and world texture. */
export type Industry =
  | "ai"
  | "space"
  | "biotech"
  | "energy"
  | "defense"
  | "advanced_mfg"
  | "mobility"
  | "quantum";

export const PLAYABLE_INDUSTRIES: readonly Industry[] = ["ai", "space"] as const;

/** The six V1 playable sub-industries, each with one signature mechanic. */
export type PlayableSubIndustry =
  | "frontier_model_lab"
  | "vertical_ai_saas"
  | "ai_chips"
  | "launch_services"
  | "satellite_constellations"
  | "space_stations";

/** The six playable sub-industries as a value (e.g. for content coverage checks). */
export const PLAYABLE_SUB_INDUSTRIES: readonly PlayableSubIndustry[] = [
  "frontier_model_lab",
  "vertical_ai_saas",
  "ai_chips",
  "launch_services",
  "satellite_constellations",
  "space_stations",
] as const;

/** Light/investment-only industries carry free-form sub-industry tags. */
export type SubIndustry = PlayableSubIndustry | (string & {});

/** Company lifecycle stages, ordered earliest → latest. The investor focus
 *  schema and event conditions reference a subset of these. */
export type Stage =
  | "idea"
  | "pre_seed"
  | "seed"
  | "series_a"
  | "series_b"
  | "series_c"
  | "growth"
  | "late_stage"
  | "public";

const STAGE_ORDER: readonly Stage[] = [
  "idea",
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "growth",
  "late_stage",
  "public",
];

/** Numeric rank for stage comparisons (`stage >= series_a` in event conditions). */
export function stageRank(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function compareStage(a: Stage, b: Stage): number {
  return stageRank(a) - stageRank(b);
}

/** The next funding stage after the given one (caps at late_stage; public is
 *  reached via IPO, not a priced round). */
export function nextStage(stage: Stage): Stage {
  switch (stage) {
    case "idea":
      return "pre_seed";
    case "pre_seed":
      return "seed";
    case "seed":
      return "series_a";
    case "series_a":
      return "series_b";
    case "series_b":
      return "series_c";
    case "series_c":
      return "growth";
    case "growth":
      return "late_stage";
    case "public":
      return "public"; // terminal — a public company never reverts to a private stage
    default:
      return "late_stage";
  }
}

export const INDUSTRY_LABELS: Record<Industry, string> = {
  ai: "Artificial Intelligence",
  space: "Space",
  biotech: "Biotech",
  energy: "Energy",
  defense: "Defense",
  advanced_mfg: "Advanced Manufacturing",
  mobility: "Mobility",
  quantum: "Quantum",
};

export const SUB_INDUSTRY_LABELS: Record<PlayableSubIndustry, string> = {
  frontier_model_lab: "Frontier Model Lab",
  vertical_ai_saas: "Vertical AI SaaS",
  ai_chips: "AI Chips & Silicon",
  launch_services: "Launch Services",
  satellite_constellations: "Satellite Constellations",
  space_stations: "Space Stations",
};

export const STAGE_LABELS: Record<Stage, string> = {
  idea: "Idea",
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
  growth: "Growth",
  late_stage: "Late Stage",
  public: "Public",
};

/** Round names follow the stage that *opens* with the round. */
export function stageRoundName(stage: Stage): string {
  return STAGE_LABELS[stage];
}

export function industryLabel(industry: Industry): string {
  return INDUSTRY_LABELS[industry] ?? industry;
}

export function subIndustryLabel(sub: SubIndustry): string {
  return (
    SUB_INDUSTRY_LABELS[sub as PlayableSubIndustry] ??
    sub
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}
