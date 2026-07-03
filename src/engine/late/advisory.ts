// ============================================================================
// advisory.ts — The executive advisory engine (doc 12 + UI rule #2).
// Every significant decision gets an exec recommendation WITH reasoning.
// Depth rule: advice QUALITY scales with exec competence — great execs are
// genuinely better information; weak ones sometimes recommend suboptimally.
// Pure & seeded.
// ============================================================================

export interface ExecProfile {
  id: string; name: string; domain: string;
  competence: number;               // 0..100
  traits: string[];                 // e.g. "aggressive","cautious","visionary","frugal"
}

export interface Option {
  id: string; label: string;
  score: number;                    // the engine's true expected-value score (hidden)
  outcome_line: string;             // outcome-framed ("reach Q40 in ~16wk")
  risk_note?: string;               // ("reliability slips")
}

export interface Recommendation {
  exec_id: string; exec_name: string;
  option_id: string;
  reasoning: string;                // shown verbatim in the advice strip
  confidence: "high" | "measured" | "hedged";
  is_optimal: boolean;              // telemetry/track record (never shown pre-decision)
}

/**
 * Core: the exec evaluates options through a NOISY lens.
 * - competence 95: near-perfect reads (noise ~±5% of score range)
 * - competence 50: meaningful noise (~±24%) — sometimes picks 2nd best
 * - competence 25: fog (~±35%) — wrong roughly a quarter of the time on close calls
 * Traits BIAS the read (aggressive overweights upside; cautious overweights risk)
 * — so two great execs can honestly disagree. That's the depth: who you hire
 * shapes what you're told, and their track record teaches you who to trust.
 */
export function recommend(
  exec: ExecProfile, options: Option[], context: DecisionContext, rng: () => number
): Recommendation {
  const range = Math.max(...options.map(o => o.score)) - Math.min(...options.map(o => o.score)) || 1;
  const noiseAmp = range * (0.45 - 0.42 * (exec.competence / 100));
  const biased = options.map(o => {
    let s = o.score + (rng() * 2 - 1) * noiseAmp;
    if (exec.traits.includes("aggressive") && o.risk_note) s += range * 0.08;   // undervalues risk
    if (exec.traits.includes("cautious") && o.risk_note) s -= range * 0.10;     // overweights risk
    if (exec.traits.includes("frugal") && /\$\d+B/.test(o.outcome_line)) s -= range * 0.05;
    if (exec.traits.includes("visionary") && context.kind === "megaproject") s += range * 0.07;
    return { o, s };
  }).sort((a, b) => b.s - a.s);
  const pick = biased[0]!.o;
  const truthBest = [...options].sort((a, b) => b.score - a.score)[0];
  const margin = (biased[0]!.s - (biased[1]?.s ?? biased[0]!.s)) / range;
  const confidence = margin > 0.25 ? "high" : margin > 0.1 ? "measured" : "hedged";
  return {
    exec_id: exec.id, exec_name: exec.name, option_id: pick.id,
    reasoning: composeReasoning(exec, pick, options, context, confidence),
    confidence, is_optimal: pick.id === truthBest!.id,
  };
}

export interface DecisionContext {
  kind: "stance" | "product" | "capacity" | "contract" | "megaproject" | "posture";
  facts: Record<string, string>;    // slot-in facts: {"lead":"+6 ahead of Nova Silicon", ...}
}

/** Reasoning text: trait-flavored template + the option's own outcome + context facts. */
function composeReasoning(
  exec: ExecProfile, pick: Option, _all: Option[], ctx: DecisionContext, conf: string
): string {
  const openers: Record<string, string> = {
    aggressive: "Press the advantage —", cautious: "Let's not get ahead of ourselves —",
    visionary: "Think about where this puts us in five years —", frugal: "The economics decide this —",
    default: "My read —",
  };
  const opener = openers[exec.traits.find(t => openers[t]) ?? "default"] ?? openers.default;
  const fact = Object.values(ctx.facts)[0] ?? "";
  const risk = pick.risk_note ? ` I won't pretend it's free: ${pick.risk_note}.` : "";
  const hedge = conf === "hedged" ? " It's a close call — I could be argued off this." : "";
  return `${opener} ${fact ? fact + ". " : ""}I'd take **${pick.label}**: ${pick.outcome_line}.${risk}${hedge}`;
}

// ---- track record (execs earn trust on-screen; shown on Team) ----
export interface TrackRecord { taken: number; optimal: number }
export function updateTrackRecord(tr: TrackRecord, rec: Recommendation, accepted: boolean): TrackRecord {
  return accepted ? { taken: tr.taken + 1, optimal: tr.optimal + (rec.is_optimal ? 1 : 0) } : tr;
}

// ---- convenience scorers the UI uses to build Option.score ----
/** Stance option scoring: value of capability gained per week, penalized by risk. */
export function scoreStance(qGain: number, weeks: number, riskPenalty: number): number {
  return (qGain / weeks) * 100 - riskPenalty;
}
/** Contract scoring for the exec lens: NPV-ish minus entanglement burden weighted by identity intent. */
export function scoreContract(upfront: number, recurringYr: number, termWeeks: number,
  entangle: number, powerValueWeight: number, power: number): number {
  const npv = upfront + recurringYr * (termWeeks / 52) * 0.85;
  return npv + power * powerValueWeight - entangle * 2;
}
