// Procedural world generation (decision K: anchors-as-templates). The hand-
// authored anchors ARE the archetypes: each generated company picks a base
// anchor in its industry, then rolls quality widely (±20) but biased slightly
// below the anchor, so the market has genuinely good and bad companies while
// the named leaders stay special. Deterministic from the save seed.

import type { Company } from "@/content/load";
import type { Industry } from "@/domain/ids";
import { type Rng, makeRng, nextFloat, nextInt, nextRange, pick } from "./rng";

/** Roughly how many companies each industry should hold in the full market. */
const INDUSTRY_TARGET: Record<Industry, number> = {
  ai: 15,
  space: 15,
  biotech: 7,
  energy: 7,
  defense: 6,
  advanced_mfg: 6,
  mobility: 6,
  quantum: 6,
};

const PREFIXES = [
  "Helix", "Vertex", "Nimbus", "Apex", "Orbital", "Lumen", "Forge", "Axiom", "Cobalt", "Stratos",
  "Pinnacle", "Catalyst", "Beacon", "Sable", "Onyx", "Zenith", "Cipher", "Halcyon", "Polaris",
  "Aurora", "Titan", "Ember", "Granite", "Summit", "Cygnus", "Helios", "Cinder", "Talos", "Verdant",
  "Lattice", "Quill", "Arc", "Drift", "Solace", "Tessera", "Kestrel", "Mirage", "Bastion",
];

const SUFFIX: Record<Industry, string[]> = {
  ai: ["AI", "Labs", "Intelligence", "Cognition", "Systems", "Neural"],
  space: ["Aerospace", "Orbital", "Launch", "Space", "Dynamics", "Astronautics"],
  biotech: ["Bio", "Therapeutics", "Genomics", "Sciences", "Biolabs"],
  energy: ["Energy", "Power", "Grid", "Fusion", "Renewables"],
  defense: ["Defense", "Systems", "Dynamics", "Security", "Tactical"],
  advanced_mfg: ["Materials", "Manufacturing", "Industries", "Fabrication"],
  mobility: ["Mobility", "Motors", "Transit", "Autonomy"],
  quantum: ["Quantum", "Computing", "Qubits", "Photonics"],
};

const HQS = [
  "San Francisco, CA", "Palo Alto, CA", "Austin, TX", "Seattle, WA", "Boston, MA", "New York, NY",
  "Denver, CO", "Los Angeles, CA", "Pittsburgh, PA", "Chicago, IL", "San Diego, CA", "Atlanta, GA",
];

const COLORS = [
  "#5b82ff", "#46d6c8", "#f5b945", "#f4716f", "#9b8cff", "#58c6f5", "#e879b9", "#5bd6a0", "#d98a3d", "#7a9bf0",
];

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Generate the procedural long tail. Returns only the generated companies;
 *  the full market is the anchors plus these. `firmIds` seed light investor
 *  edges so the investor-overlap graph has texture. */
export function generateMarket(seed: number, anchors: Company[], firmIds: string[] = []): Company[] {
  const rng = makeRng((seed ^ 0x5f356495) >>> 0);
  const usedNames = new Set(anchors.map((a) => a.name.toLowerCase()));
  const out: Company[] = [];
  const industries = Object.keys(INDUSTRY_TARGET) as Industry[];

  for (const industry of industries) {
    const inIndustry = anchors.filter((a) => a.industry === industry);
    if (inIndustry.length === 0) continue;
    const need = Math.max(0, INDUSTRY_TARGET[industry] - inIndustry.length);
    for (let i = 0; i < need; i++) {
      const base = pick(rng, inIndustry)!;
      out.push(generateFrom(rng, base, usedNames, out.length, firmIds));
    }
  }
  return out;
}

function generateFrom(rng: Rng, base: Company, used: Set<string>, idx: number, firmIds: string[]): Company {
  const name = uniqueName(rng, base.industry, used);
  const id = `gen_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

  // Vary quality widely (±20) but bias ~4 below the anchor (anchors stay iconic).
  const q = (v: number) => clamp(Math.round(v + nextRange(rng, -20, 20) - 4), 8, 96);
  const fundamentals = q(base.quality.fundamentals);
  const moat = q(base.quality.moat);
  const execution = q(base.quality.execution);
  const hypeExp = clamp(base.quality.hype_exposure + nextRange(rng, -0.25, 0.25), 0.1, 0.95);

  // Scale financials off the quality ratio + noise.
  const qualityFactor = (fundamentals / Math.max(1, base.quality.fundamentals)) * nextRange(rng, 0.45, 1.4);
  const valuation = Math.max(20, Math.round(base.financials.valuation * qualityFactor));
  const revenue = Math.max(0, Math.round(base.financials.revenue * qualityFactor * nextRange(rng, 0.6, 1.2)));
  const profitable = revenue > 0 && nextFloat(rng) < 0.4;

  const isPublic = nextFloat(rng) < (base.stage.status === "public" ? 0.55 : 0.3);

  return {
    id,
    name,
    tier: "procedural",
    industry: base.industry,
    sub_industry: base.sub_industry,
    founded_year: -nextInt(rng, 2, 12),
    hq: pick(rng, HQS)!,
    color: COLORS[idx % COLORS.length]!,
    logo_glyph: base.logo_glyph,
    identity: {
      tagline: tagline(rng, base),
      reputation: q(base.identity.reputation),
      narrative_hooks: base.identity.narrative_hooks.slice(0, 1),
    },
    stage: { status: isPublic ? "public" : "private", private_round: "", ipo_year: isPublic ? -nextInt(rng, 1, 5) : 0 },
    financials: {
      revenue,
      revenue_growth: clamp(base.financials.revenue_growth + nextRange(rng, -0.2, 0.25), -0.1, 1.2),
      gross_margin: clamp(base.financials.gross_margin + nextRange(rng, -0.15, 0.15), 0.1, 0.92),
      profitable,
      burn_monthly: profitable ? 0 : Math.max(0, Math.round(base.financials.burn_monthly * nextRange(rng, 0.3, 1.3))),
      valuation,
      shares_out: Math.max(10, Math.round(base.financials.shares_out * nextRange(rng, 0.5, 1.5))),
    },
    quality: { fundamentals, hype_exposure: Math.round(hypeExp * 100) / 100, moat, execution },
    signature: { benchmark_score: q(base.signature?.benchmark_score ?? 50), signature_notes: "" },
    // Light relationships: an investor or two from the firm pool; competitor
    // edges among anchors are unioned in by the graph builder.
    relationships: { investors: rollInvestors(rng, firmIds) },
  };
}

function rollInvestors(rng: Rng, firmIds: string[]): string[] {
  if (firmIds.length === 0) return [];
  const a = pick(rng, firmIds)!;
  if (nextFloat(rng) < 0.4) {
    const b = pick(rng, firmIds)!;
    if (b !== a) return [a, b];
  }
  return [a];
}

const TAGLINE_TEMPLATES = [
  (b: Company) => `A challenger in ${b.sub_industry.replace(/_/g, " ")}.`,
  () => "Building the unglamorous infrastructure everyone will need.",
  () => "Fast, focused, and hungry for the incumbents' lunch.",
  (b: Company) => `Betting the company on ${b.sub_industry.replace(/_/g, " ")}.`,
  () => "Quietly compounding, far from the headlines.",
  () => "A rising name the analysts are starting to notice.",
];

function tagline(rng: Rng, base: Company): string {
  return pick(rng, TAGLINE_TEMPLATES)!(base);
}

function uniqueName(rng: Rng, industry: Industry, used: Set<string>): string {
  for (let attempt = 0; attempt < 40; attempt++) {
    const name = `${pick(rng, PREFIXES)} ${pick(rng, SUFFIX[industry])}`;
    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase());
      return name;
    }
  }
  const fallback = `${pick(rng, PREFIXES)} ${pick(rng, SUFFIX[industry])} ${used.size}`;
  used.add(fallback.toLowerCase());
  return fallback;
}
