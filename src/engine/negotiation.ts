// Negotiation engine — pure, deterministic counter-logic.
//
// Each investor wants term values its five hidden axes imply; it scores the
// player's proposal by how far (in the directions bad for it) the offer sits
// from those ideals, weighted by how much it cares about price vs. governance.
// Eagerness for the deal (sector/stage/market fit + relationship) relaxes the
// bar. The result is an accept / counter / walk decision plus a soft signal —
// reproducible from inputs, so the player learns each firm by pattern.

import type { RoundTerms } from "@/domain/captable";
import type {
  InvestorAgent,
  InvestorEvaluation,
  InvestorType,
  NegotiationContext,
  NegotiationState,
  ReactionSignal,
  TermKey,
  TermReaction,
  TermStance,
} from "@/domain/negotiation";
import type { Investor } from "@/content/load";
import { stageRank } from "@/domain/ids";

export const MAX_ROUNDS = 3;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Building an agent from authored content ──────────────────────────────────

export function agentFromFirm(firm: Investor, type: InvestorType = "firm"): InvestorAgent {
  return {
    id: firm.id,
    name: firm.name,
    type,
    partnerName: firm.partner_name,
    reputation: firm.identity.reputation,
    traitTags: firm.identity.trait_tags,
    thesis: firm.identity.thesis,
    personality: {
      aggression: firm.personality.aggression,
      patience: firm.personality.patience,
      conviction: firm.personality.conviction,
      founderFriendliness: firm.personality.founder_friendliness,
      networkStrength: firm.personality.network_strength,
    },
    focus: {
      primarySector: firm.focus.primary_sector,
      secondarySector: firm.focus.secondary_sector,
      primaryStage: firm.focus.primary_stage,
      stageRange: firm.focus.stage_range,
      stretchTolerance: firm.focus.stretch_tolerance,
    },
    fund: { checkMin: firm.fund.check_min, checkMax: firm.fund.check_max },
  };
}

// ── Deal appetite — how much the firm wants in ───────────────────────────────

/** 0–1 eagerness for the deal: sector/stage fit, market heat, check fit, and
 *  the standing relationship. Eager firms tolerate founder-favorable terms. */
export function dealAppetite(agent: InvestorAgent, ctx: NegotiationContext): number {
  const f = agent.focus;
  const sectorFit =
    f.primarySector === ctx.industry
      ? 1
      : f.secondarySector === ctx.industry
        ? 0.55
        : 0.15 + 0.3 * f.stretchTolerance;

  const inRange =
    stageRank(ctx.stage) >= stageRank(f.stageRange[0]) &&
    stageRank(ctx.stage) <= stageRank(f.stageRange[1]);
  const stageFit = inRange ? (f.primaryStage === ctx.stage ? 1 : 0.7) : 0.3;

  const size = ctx.market.roundSize;
  const checkFit = size >= agent.fund.checkMin && size <= agent.fund.checkMax ? 1 : 0.4;

  const rel = ctx.relationshipScore / 100; // 0.5 neutral
  const hypeF = ctx.hype / 100;
  const climateF = ctx.vcClimate / 100;

  return clamp(
    0.34 * sectorFit + 0.2 * stageFit + 0.15 * hypeF + 0.12 * climateF + 0.09 * checkFit + 0.1 * rel,
    0,
    1,
  );
}

// ── What the investor would love ─────────────────────────────────────────────

function investorIdeal(agent: InvestorAgent, ctx: NegotiationContext, appetite: number): RoundTerms {
  const p = agent.personality;
  const agg = p.aggression / 100;
  const conv = p.conviction / 100;
  const ff = p.founderFriendliness / 100;
  const m = ctx.market;
  const lateStage = stageRank(ctx.stage) >= stageRank("series_a");

  return {
    // Wants a lower price; conviction + eagerness let it pay up, aggression discounts.
    valuation: clamp(m.valuation * (0.78 + 0.25 * conv + 0.18 * appetite - 0.12 * agg), m.valuation * 0.55, m.valuation * 1.5),
    roundSize: clamp(m.roundSize * (0.9 + 0.25 * conv), agent.fund.checkMin, agent.fund.checkMax),
    // Wants a stronger preference; founder-friendly firms sit at 1×.
    liquidationPref: clamp(1 + 1.0 * (1 - ff) * agg, 1, 2),
    participating: false,
    // Leads want a seat; aggression + low friendliness push for more.
    boardSeats: clamp(Math.round((lateStage ? 1 : 0.4) + 1.2 * (1 - ff) * agg + 0.4 * conv), 0, 3),
    // Wants a fatter pre-money pool (founder absorbs it).
    optionPoolPct: clamp(m.optionPoolPct + 0.045 * (1 - ff) * agg, 0, 0.22),
  };
}

// ── Evaluating a proposal ────────────────────────────────────────────────────

interface Displeasure {
  total: number;
  byTerm: Record<TermKey, number>;
}

function displeasure(
  agent: InvestorAgent,
  player: RoundTerms,
  ideal: RoundTerms,
): Displeasure {
  const p = agent.personality;
  const agg = p.aggression / 100;
  const conv = p.conviction / 100;
  const ff = p.founderFriendliness / 100;

  // How much the firm cares about price vs. governance (its negotiation "feel").
  const priceSens = agg * (1 - 0.6 * conv); // conviction → pays up on price
  const govSens = (0.4 + 0.6 * agg) * (1 - 0.75 * ff); // aggression amps, friendliness damps

  const d_val = Math.max(0, (player.valuation - ideal.valuation) / Math.max(ideal.valuation, 1)) * priceSens * 1.5;
  const d_pref = Math.max(0, ideal.liquidationPref - player.liquidationPref) * govSens * 0.7;
  const d_board = Math.max(0, ideal.boardSeats - player.boardSeats) * govSens * 0.3;
  const d_pool = Math.max(0, ideal.optionPoolPct - player.optionPoolPct) * govSens * 4.0;
  const d_size = player.roundSize > agent.fund.checkMax ? ((player.roundSize - agent.fund.checkMax) / agent.fund.checkMax) * 0.6 : 0;

  return {
    total: d_val + d_pref + d_board + d_pool + d_size,
    byTerm: {
      valuation: d_val,
      roundSize: d_size,
      liquidationPref: d_pref,
      boardSeats: d_board,
      optionPoolPct: d_pool,
    },
  };
}

function termStance(d: number, playerBeatsIdeal: boolean): TermStance {
  if (d <= 0.001) return playerBeatsIdeal ? "loves" : "fine";
  if (d < 0.12) return "fine";
  if (d < 0.45) return "pushing";
  return "dealbreaker";
}

function counterTerms(
  agent: InvestorAgent,
  player: RoundTerms,
  ideal: RoundTerms,
  appetite: number,
): RoundTerms {
  const p = agent.personality;
  const agg = p.aggression / 100;
  const ff = p.founderFriendliness / 100;
  // How far the firm moves from its ideal toward the player's ask.
  const toPlayer = clamp(0.25 + 0.5 * ff - 0.25 * agg + 0.15 * appetite, 0.1, 0.8);

  return {
    valuation: Math.min(player.valuation, lerp(ideal.valuation, player.valuation, toPlayer)),
    // Never demand a bigger round than asked — only cap at what they can write.
    roundSize: Math.min(player.roundSize, agent.fund.checkMax),
    liquidationPref: roundQuarter(Math.max(player.liquidationPref, lerp(ideal.liquidationPref, player.liquidationPref, toPlayer))),
    participating: false,
    boardSeats: Math.round(Math.max(player.boardSeats, lerp(ideal.boardSeats, player.boardSeats, toPlayer))),
    optionPoolPct: Math.max(player.optionPoolPct, lerp(ideal.optionPoolPct, player.optionPoolPct, toPlayer)),
  };
}

function signalFor(sat: number): ReactionSignal {
  if (sat >= 0.82) return "warm";
  if (sat >= 0.66) return "receptive";
  if (sat >= 0.45) return "pushing";
  if (sat >= 0.28) return "cool";
  return "walking";
}

const TERM_LABEL: Record<TermKey, string> = {
  valuation: "the valuation",
  roundSize: "the round size",
  liquidationPref: "the liquidation preference",
  boardSeats: "the board seat",
  optionPoolPct: "the option pool",
};

function line(agent: InvestorAgent, signal: ReactionSignal, topTerm: TermKey | null): string {
  const who = agent.partnerName;
  const term = topTerm ? TERM_LABEL[topTerm] : "the structure";
  switch (signal) {
    case "warm":
      return `${who} is genuinely excited — this is a deal they want to lead.`;
    case "receptive":
      return `${who} likes the shape of it, but wants to talk through ${term}.`;
    case "pushing":
      return `${who} is pushing back, especially on ${term}.`;
    case "cool":
      return `${who} thinks you're far apart on ${term}.`;
    case "walking":
      return `${who} doesn't see a deal at these terms.`;
  }
}

/** Score one proposal. Pure: identical inputs → identical evaluation. */
export function evaluateProposal(
  agent: InvestorAgent,
  player: RoundTerms,
  ctx: NegotiationContext,
  round: number,
  competing: boolean,
): InvestorEvaluation {
  let appetite = dealAppetite(agent, ctx);
  if (competing) appetite = clamp(appetite + 0.2, 0, 1); // Hot Deal: don't lose it to a rival

  const ideal = investorIdeal(agent, ctx, appetite);
  const d = displeasure(agent, player, ideal);
  const satisfaction = clamp(1 - d.total + 0.25 * appetite, 0, 1);

  const conv = agent.personality.conviction / 100;
  const pat = agent.personality.patience / 100;
  const acceptThreshold = 0.68 - 0.12 * appetite - (round / MAX_ROUNDS) * 0.12 * conv;
  const walkFloor = 0.35 - 0.18 * pat;

  // Per-term reactions (a term the player over-delivers on is "loved").
  const termReactions: TermReaction[] = (Object.keys(d.byTerm) as TermKey[]).map((t) => {
    const beats = termBeatsIdeal(t, player, ideal);
    return { term: t, stance: termStance(d.byTerm[t], beats) };
  });
  const topTerm = (Object.keys(d.byTerm) as TermKey[]).reduce<TermKey | null>(
    (best, t) => (best === null || d.byTerm[t] > d.byTerm[best] ? t : best),
    null,
  );
  const topIsSore = topTerm && d.byTerm[topTerm] > 0.05 ? topTerm : null;
  const signal = signalFor(satisfaction);

  let decision: InvestorEvaluation["decision"];
  if (satisfaction >= acceptThreshold) decision = "accept";
  else if (round >= MAX_ROUNDS) decision = satisfaction >= acceptThreshold - 0.1 * conv ? "accept" : "walk";
  else if (satisfaction < walkFloor && round >= 2) decision = "walk";
  else decision = "counter";

  return {
    satisfaction,
    appetite,
    signal,
    line: line(agent, signal, topIsSore),
    termReactions,
    decision,
    counter: decision === "counter" ? counterTerms(agent, player, ideal, appetite) : undefined,
  };
}

// ── Negotiation lifecycle ────────────────────────────────────────────────────

export function openNegotiation(
  agent: InvestorAgent,
  openingTerms: RoundTerms,
  ctx: NegotiationContext,
): NegotiationState {
  const competing = hotDeal(agent, ctx);
  const evaluation = evaluateProposal(agent, openingTerms, ctx, 1, competing);
  return buildState(agent, ctx, 1, openingTerms, evaluation, competing ? { firmName: "a rival fund" } : undefined);
}

export function counterOffer(
  state: NegotiationState,
  agent: InvestorAgent,
  playerTerms: RoundTerms,
  ctx: NegotiationContext,
): NegotiationState {
  if (state.status !== "active") return state;
  const round = state.round + 1;
  const competing = state.competingInterest != null;
  const evaluation = evaluateProposal(agent, playerTerms, ctx, round, competing);
  const merged = buildState(agent, ctx, round, playerTerms, evaluation, state.competingInterest);
  return { ...merged, history: [...state.history, ...merged.history] };
}

function buildState(
  agent: InvestorAgent,
  ctx: NegotiationContext,
  round: number,
  playerTerms: RoundTerms,
  evaluation: InvestorEvaluation,
  competingInterest: NegotiationState["competingInterest"],
): NegotiationState {
  let status: NegotiationState["status"] = "active";
  let agreedTerms: RoundTerms | undefined;
  let currentCounter: RoundTerms | undefined;

  if (evaluation.decision === "accept") {
    status = "agreed";
    agreedTerms = playerTerms;
  } else if (evaluation.decision === "walk") {
    status = round >= MAX_ROUNDS ? "exhausted" : "walked";
  } else {
    currentCounter = evaluation.counter;
    if (round >= MAX_ROUNDS) status = "exhausted";
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    partnerName: agent.partnerName,
    stage: ctx.stage,
    round,
    maxRounds: MAX_ROUNDS,
    status,
    history: [{ round, playerTerms, evaluation }],
    currentCounter,
    agreedTerms,
    competingInterest,
  };
}

// ── Comparable rounds (eval-help layer) ──────────────────────────────────────

export interface RoundComp {
  name: string;
  preMoney: number;
}

export interface Comparables {
  median: number;
  low: number;
  high: number;
  comps: RoundComp[];
}

/** Ground the player's sense of price: a stage median + band, with a few real
 *  sector peers' (synthesized, in-band) comparable rounds for specificity. */
export function comparableRounds(
  companies: { id: string; name: string; industry: string; tier: string }[],
  industry: string,
  stage: string,
  market: RoundTerms,
): Comparables {
  const peers = companies.filter((c) => c.industry === industry && c.tier === "anchor").slice(0, 3);
  const comps = peers.map((c) => ({
    name: c.name,
    preMoney: market.valuation * (0.72 + (hashStr(c.id + stage) % 66) / 100),
  }));
  return {
    median: market.valuation,
    low: market.valuation * 0.65,
    high: market.valuation * 1.4,
    comps,
  };
}

// ── Hot Deal (competing term sheets) — a rare earned moment ───────────────────

function hotDeal(agent: InvestorAgent, ctx: NegotiationContext): boolean {
  const ripe = ctx.hype > 78 && ctx.vcClimate > 68 && dealAppetite(agent, ctx) > 0.7;
  if (!ripe) return false;
  return hashStr(`${ctx.seed}:${ctx.week}:${agent.id}`) % 100 < 25; // rare even when ripe
}

// ── helpers ──────────────────────────────────────────────────────────────────

function termBeatsIdeal(t: TermKey, player: RoundTerms, ideal: RoundTerms): boolean {
  switch (t) {
    case "valuation":
      return player.valuation <= ideal.valuation;
    case "liquidationPref":
      return player.liquidationPref >= ideal.liquidationPref;
    case "boardSeats":
      return player.boardSeats >= ideal.boardSeats;
    case "optionPoolPct":
      return player.optionPoolPct >= ideal.optionPoolPct;
    case "roundSize":
      return player.roundSize <= ideal.roundSize;
  }
}

function roundQuarter(x: number): number {
  return Math.round(x * 4) / 4;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
