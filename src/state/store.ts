// The game store. Holds the active save and exposes actions that drive it
// through the pure engine. Content (including tuning) is loaded once.

import { create } from "zustand";
import type { GameState } from "@/domain/state";
import { NEUTRAL_RELATIONSHIP } from "@/domain/state";
import type { RoundTerms } from "@/domain/captable";
import type { Stage } from "@/domain/ids";
import type { LogEntry, StopReason } from "@/domain/log";
import type { NegotiationContext, NegotiationState } from "@/domain/negotiation";
import { nextStage } from "@/domain/ids";
import { applyRound } from "@/engine/captable";
import { advance as engineAdvance, checkMilestones, type AdvanceMode } from "@/engine/tick";
import { runwayBand } from "@/engine/finance";
import {
  agentFromFirm,
  counterOffer as engineCounter,
  openNegotiation,
} from "@/engine/negotiation";
import { formatMoney } from "@/engine/format";
import { loadContent, type ContentDB } from "@/content/load";
import { createNewGame, suggestedTerms, type FoundingChoices } from "./newgame";

export interface AdvanceSummary {
  weeks: number;
  stopReason: StopReason;
  atWeek: number;
}

interface GameStore {
  content: ContentDB;
  game: GameState | null;
  lastAdvance: AdvanceSummary | null;
  /** The in-progress fundraising negotiation, if any (ephemeral). */
  negotiation: NegotiationState | null;

  newGame: (choices: FoundingChoices) => void;
  advance: (mode: AdvanceMode) => void;
  dismissAlert: (id: string) => void;

  startNegotiation: (leadInvestorId: string, openingTerms: RoundTerms) => void;
  counterOffer: (terms: RoundTerms) => void;
  acceptDeal: () => void;
  walkAway: () => void;
  dismissNegotiation: () => void;

  resetGame: () => void;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const useGame = create<GameStore>((set, get) => ({
  content: loadContent(),
  game: null,
  lastAdvance: null,
  negotiation: null,

  newGame: (choices) =>
    set({ game: createNewGame(choices, new Date().toISOString()), lastAdvance: null, negotiation: null }),

  advance: (mode) =>
    set((s) => {
      if (!s.game) return s;
      const r = engineAdvance(s.game, s.content.tuning, mode);
      return {
        game: r.state,
        lastAdvance: { weeks: r.weeks, stopReason: r.stopReason, atWeek: r.state.clock.week },
      };
    }),

  dismissAlert: (id) =>
    set((s) =>
      s.game ? { game: { ...s.game, alerts: s.game.alerts.filter((a) => a.id !== id) } } : s,
    ),

  startNegotiation: (leadInvestorId, openingTerms) => {
    const s = get();
    if (!s.game) return;
    const firm = s.content.investorById.get(leadInvestorId);
    if (!firm) return;
    const agent = agentFromFirm(firm);
    const ctx = buildCtx(s.game, leadInvestorId);
    const neg = openNegotiation(agent, openingTerms, ctx);
    set({ game: applyOutcome(s.game, neg), negotiation: neg });
  },

  counterOffer: (terms) => {
    const s = get();
    if (!s.game || !s.negotiation) return;
    const firm = s.content.investorById.get(s.negotiation.agentId);
    if (!firm) return;
    const agent = agentFromFirm(firm);
    const ctx = buildCtx(s.game, s.negotiation.agentId);
    const neg = engineCounter(s.negotiation, agent, terms, ctx);
    set({ game: applyOutcome(s.game, neg), negotiation: neg });
  },

  acceptDeal: () => {
    const s = get();
    const neg = s.negotiation;
    if (!s.game || !neg) return;
    const terms = neg.status === "agreed" ? neg.agreedTerms : neg.currentCounter;
    if (!terms) return;
    set({ game: closeRound(s.game, s.content, neg, terms), negotiation: null });
  },

  walkAway: () =>
    set((s) => {
      if (!s.game || !s.negotiation) return s;
      const neg = s.negotiation;
      const game = relationshipNote(
        s.game,
        neg.agentId,
        -6,
        `You walked from ${neg.agentName}'s term sheet.`,
        "down",
        `Talks with ${neg.agentName} ended — you walked.`,
      );
      return { game, negotiation: { ...neg, status: "walked" } };
    }),

  dismissNegotiation: () => set({ negotiation: null }),

  resetGame: () => set({ game: null, lastAdvance: null, negotiation: null }),
}));

/** The stage a player's next priced round would open. */
export function upcomingStage(current: Stage): Stage {
  return nextStage(current);
}

// ── internals ────────────────────────────────────────────────────────────────

function buildCtx(game: GameState, leadId: string): NegotiationContext {
  const stage = upcomingStage(game.company.stage);
  return {
    stage,
    industry: game.company.industry,
    subIndustry: game.company.subIndustry,
    hype: game.world.hype[game.company.industry] ?? 50,
    vcClimate: game.world.vcClimate,
    week: game.clock.week,
    market: suggestedTerms(stage),
    relationshipScore: game.relationships[leadId]?.score ?? NEUTRAL_RELATIONSHIP,
    seed: game.meta.seed,
  };
}

/** Side-effects when a negotiation reaches a no-deal terminal state. */
function applyOutcome(game: GameState, neg: NegotiationState): GameState {
  if (neg.status === "walked" || neg.status === "exhausted") {
    return relationshipNote(
      game,
      neg.agentId,
      -3,
      `${neg.agentName} passed after you couldn't agree.`,
      "down",
      `${neg.partnerName} passed on the ${stageName(neg.stage)} — no deal.`,
    );
  }
  return game;
}

function closeRound(
  game: GameState,
  content: ContentDB,
  neg: NegotiationState,
  terms: RoundTerms,
): GameState {
  const company = game.company;
  const capTable = applyRound(company.capTable, {
    terms,
    stage: neg.stage,
    week: game.clock.week,
    leadInvestorId: neg.agentId,
    leadInvestorName: neg.agentName,
  });
  const round = capTable.rounds[capTable.rounds.length - 1]!;

  const company2 = {
    ...company,
    stage: neg.stage,
    capTable,
    financials: {
      ...company.financials,
      cash: company.financials.cash + terms.roundSize,
      valuation: round.postMoney,
    },
  };

  const entry: LogEntry = {
    id: `round-${round.id}`,
    week: game.clock.week,
    kind: "company",
    tone: "up",
    headline: `Closed the ${round.name} with ${neg.agentName}`,
    detail: `${formatMoney(round.amountRaised)} raised at ${formatMoney(round.postMoney)} post-money.`,
  };

  let next: GameState = {
    ...game,
    company: company2,
    log: [...game.log, entry],
    alerts: game.alerts.filter(
      (a) => a.kind !== "runway_critical" && a.kind !== "raise_ready" && a.kind !== "out_of_cash",
    ),
    lastRunwayBand: runwayBand(company2, content.tuning),
  };
  next = relationshipNote(next, neg.agentId, +8, `Closed the ${stageName(neg.stage)} together.`, "up", null);

  const ms = checkMilestones(next, content.tuning, game.clock.week);
  return { ...ms.state, log: [...next.log, ...ms.entries] };
}

/** Adjust a firm's relationship score + history, optionally adding a timeline line. */
function relationshipNote(
  game: GameState,
  firmId: string,
  delta: number,
  note: string,
  tone: LogEntry["tone"],
  logHeadline: string | null,
): GameState {
  const cur = game.relationships[firmId] ?? { score: NEUTRAL_RELATIONSHIP, history: [] };
  const relationships = {
    ...game.relationships,
    [firmId]: {
      score: clamp(cur.score + delta, 0, 100),
      history: [...cur.history, { week: game.clock.week, note }],
    },
  };
  const log = logHeadline
    ? [...game.log, { id: `rel-${firmId}-${game.clock.week}-${game.log.length}`, week: game.clock.week, kind: "company" as const, tone, headline: logHeadline }]
    : game.log;
  return { ...game, relationships, log };
}

function stageName(stage: Stage): string {
  return stage
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
