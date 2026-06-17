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
import { valuationMultiplier } from "@/engine/world";
import { applyWorldDifficulty, difficultyProfile } from "@/engine/difficulty";
import { applyOutcome as applyEventOutcome, resolveOutcome } from "@/engine/eventOutcomes";
import { applyPublicChoice } from "@/engine/earnings";
import { debtOffer, repayLoan as engineRepayLoan, takeLoan as engineTakeLoan } from "@/engine/debt";
import { hireStaff as engineHireStaff, investCapacity as engineInvestCapacity, trimTeam as engineTrimTeam } from "@/engine/operations";
import { commitProcess } from "@/engine/signature";
import { makeRng } from "@/engine/rng";
import { newlyUnlocked } from "@/engine/achievements";
import type { Autonomy, Exec, ExecArea } from "@/domain/state";
import {
  acquisitionOffer,
  applyAcquisition,
  applyCashOut,
  applyIpo,
  lockupExpired,
  revealIpo,
  type AcquisitionOffer,
  type IpoResult,
} from "@/engine/exit";

export type ExitFlow =
  | { kind: "ipo"; act: "underwriter" | "pricing" | "reveal"; bankId?: string; result?: IpoResult }
  | { kind: "acquisition"; offer: AcquisitionOffer }
  | null;
import {
  agentFromFirm,
  counterOffer as engineCounter,
  openNegotiation,
} from "@/engine/negotiation";
import { formatMoney } from "@/engine/format";
import { loadContent, type ContentDB } from "@/content/load";
import { createNewGame, suggestedTerms, type FoundingChoices } from "./newgame";
import { loadGame, saveGame } from "./persist";

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
  /** The in-progress exit flow (IPO acts / acquisition offer), if any. */
  exitFlow: ExitFlow;
  /** New Game Plus carry-over staged between runs. */
  carryOver: { reputation: number; personalCash: number } | null;
  /** Newly-unlocked achievement ids to toast (cleared by the UI). */
  achievementToast: string[] | null;

  newGame: (choices: FoundingChoices) => void;
  /** Resume the saved run, if any. */
  continueGame: () => void;
  advance: (mode: AdvanceMode) => void;
  dismissAlert: (id: string) => void;
  /** Resolve the pending event by choosing one of its options. */
  resolveEvent: (choiceIndex: number) => void;
  /** Commit the sub-industry signature process (a training run, a launch, …)
   *  under a chosen approach. */
  commitSignature: (approachId?: string) => void;
  /** Hire an executive into an area (pays the cash cost). */
  hireExec: (exec: Exec, cost: number) => void;
  /** Set an area's autonomy. */
  setAutonomy: (area: ExecArea, autonomy: Autonomy) => void;

  /** Draw a debt facility from a bank (cash in now, principal due at maturity). */
  takeLoan: (bankId: string, amount: number, termWeeks: number) => void;
  /** Repay an outstanding loan's principal in full. */
  repayLoan: (loanId: string) => void;

  /** Grow the team (raises headcount + burn, lifts execution). */
  hireStaff: (count: number) => void;
  /** Cut the team (lowers burn + a small reputation hit). */
  trimTeam: (count: number) => void;
  /** Invest in a compute / facilities capacity tier (capex + burn, lifts execution). */
  investCapacity: (tierId: string) => void;

  startNegotiation: (leadInvestorId: string, openingTerms: RoundTerms) => void;
  counterOffer: (terms: RoundTerms) => void;
  acceptDeal: () => void;
  walkAway: () => void;
  dismissNegotiation: () => void;

  // Exits & the arc.
  openIpo: () => void;
  ipoSelectBank: (bankId: string) => void;
  ipoPrice: (pricedValuation: number) => void;
  ipoList: () => void;
  exploreSale: () => void;
  acceptAcquisition: () => void;
  /** Sell the public stake after lockup — banks the proceeds and ends the run. */
  cashOut: () => void;
  cancelExit: () => void;
  /** Start a new company after an exit, carrying reputation + wealth forward. */
  foundAgain: () => void;

  /** Dismiss the achievement toast. */
  clearAchievementToast: () => void;

  resetGame: () => void;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Record any newly-unlocked achievements and stage them for a toast. */
function withAch(game: GameState): { game: GameState; achievementToast?: string[] } {
  const newly = newlyUnlocked(game);
  if (newly.length === 0) return { game };
  return { game: { ...game, achievements: [...game.achievements, ...newly] }, achievementToast: newly };
}

export const useGame = create<GameStore>((set, get) => ({
  content: loadContent(),
  game: null,
  lastAdvance: null,
  negotiation: null,
  exitFlow: null,
  carryOver: null,
  achievementToast: null,

  newGame: (choices) =>
    set((s) => ({
      carryOver: null,
      exitFlow: null,
      game: createNewGame(
        { ...choices, carryOver: s.carryOver ?? undefined },
        new Date().toISOString(),
        s.content.companies,
        s.content.investors.map((i) => i.id),
      ),
      lastAdvance: null,
      negotiation: null,
    })),

  continueGame: () => set({ game: loadGame(), negotiation: null, exitFlow: null, lastAdvance: null }),

  advance: (mode) =>
    set((s) => {
      if (!s.game) return s;
      const env = {
        events: s.content.events,
        market: [...s.content.companies, ...s.game.market.companies],
      };
      // Difficulty bends the world's volatility before the tick reads it.
      const tuning = applyWorldDifficulty(s.content.tuning, s.game.difficulty);
      const r = engineAdvance(s.game, tuning, mode, env);
      const a = withAch(r.state);
      return {
        game: a.game,
        lastAdvance: { weeks: r.weeks, stopReason: r.stopReason, atWeek: r.state.clock.week },
        ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}),
      };
    }),

  dismissAlert: (id) =>
    set((s) =>
      s.game ? { game: { ...s.game, alerts: s.game.alerts.filter((a) => a.id !== id) } } : s,
    ),

  resolveEvent: (choiceIndex) =>
    set((s) => {
      if (!s.game || !s.game.pendingEvent) return s;
      const ev = s.game.pendingEvent;
      const choice = ev.choices[choiceIndex];
      if (!choice) return s;
      const fx = resolveOutcome(choice, s.game);
      // Generic text-based effect, then the bespoke earnings/guidance/lockup
      // effect for public-company choices (a no-op for everything else).
      const after = applyPublicChoice(applyEventOutcome(s.game, fx), choice.outcomeRef);
      const entry: LogEntry = {
        id: `evres-${ev.id}-${s.game.clock.week}`,
        week: s.game.clock.week,
        kind: "company",
        tone: fx.cash < 0 || fx.ethics < 0 ? "warn" : "up",
        headline: `${ev.headline.replace(/\{.*?\}/g, "").trim()} — ${choice.label}`,
        detail: fx.result,
      };
      const a = withAch({ ...after, pendingEvent: null, log: [...after.log, entry] });
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  commitSignature: (approachId) =>
    set((s) => {
      if (!s.game || s.game.company.signature.status === "running") return s;
      // A one-off RNG draw seeded off the save's state — deterministic per commit.
      const rng = makeRng((s.game.meta.rngState ^ (s.game.clock.week << 8)) >>> 0);
      const a = withAch(commitProcess(s.game, rng, approachId));
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  hireExec: (exec, cost) =>
    set((s) => {
      if (!s.game || s.game.company.financials.cash < cost) return s;
      const company = s.game.company;
      const a = withAch({
        ...s.game,
        company: {
          ...company,
          financials: { ...company.financials, cash: company.financials.cash - cost, headcount: company.financials.headcount + 1 },
          executives: { ...company.executives, [exec.area]: exec },
          // Hiring an exec opens that area up to delegation.
          delegation: { ...company.delegation, [exec.area]: "recommend" as Autonomy },
        },
      });
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  setAutonomy: (area, autonomy) =>
    set((s) => {
      if (!s.game) return s;
      const a = withAch({ ...s.game, company: { ...s.game.company, delegation: { ...s.game.company.delegation, [area]: autonomy } } });
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  takeLoan: (bankId, amount, termWeeks) =>
    set((s) => {
      if (!s.game) return s;
      const bank = s.content.bankById.get(bankId);
      if (!bank) return s;
      const offer = debtOffer(s.game.company, bank, s.game.world);
      if (!offer) return s;
      const a = withAch(engineTakeLoan(s.game, offer, amount, termWeeks));
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  repayLoan: (loanId) =>
    set((s) => {
      if (!s.game) return s;
      const a = withAch(engineRepayLoan(s.game, loanId));
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  hireStaff: (count) =>
    set((s) => {
      if (!s.game) return s;
      const a = withAch(engineHireStaff(s.game, count));
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  trimTeam: (count) =>
    set((s) => {
      if (!s.game) return s;
      const a = withAch(engineTrimTeam(s.game, count));
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  investCapacity: (tierId) =>
    set((s) => {
      if (!s.game) return s;
      const a = withAch(engineInvestCapacity(s.game, tierId));
      return { game: a.game, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

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
    const a = withAch(closeRound(s.game, s.content, neg, terms));
    set({ game: a.game, negotiation: null, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) });
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

  openIpo: () => set({ exitFlow: { kind: "ipo", act: "underwriter" } }),

  ipoSelectBank: (bankId) =>
    set((s) =>
      s.exitFlow?.kind === "ipo" ? { exitFlow: { ...s.exitFlow, bankId, act: "pricing" } } : s,
    ),

  ipoPrice: (pricedValuation) =>
    set((s) => {
      if (!s.game || s.exitFlow?.kind !== "ipo" || !s.exitFlow.bankId) return s;
      const bank = s.content.bankById.get(s.exitFlow.bankId);
      if (!bank) return s;
      const rng = makeRng((s.game.meta.rngState ^ 0x1a2b3c4d) >>> 0);
      const result = revealIpo(s.game, bank, pricedValuation, rng);
      return { exitFlow: { ...s.exitFlow, act: "reveal", result } };
    }),

  ipoList: () =>
    set((s) => {
      if (!s.game || s.exitFlow?.kind !== "ipo" || !s.exitFlow.bankId || !s.exitFlow.result) return s;
      const bank = s.content.bankById.get(s.exitFlow.bankId)!;
      const result = s.exitFlow.result;
      const after = applyIpo(s.game, bank, result);
      const entry: LogEntry = {
        id: `ipo-${s.game.clock.week}`,
        week: s.game.clock.week,
        kind: "milestone",
        tone: "opportunity",
        headline: `${s.game.company.name} rang the bell — public at ${formatMoney(result.publicValuation)}`,
        detail: `Led by ${bank.name}. First day ${result.firstDayPop >= 0 ? "+" : ""}${Math.round(result.firstDayPop * 100)}%.`,
      };
      const a = withAch({ ...after, log: [...after.log, entry] });
      return { game: a.game, exitFlow: null, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  exploreSale: () =>
    set((s) => {
      if (!s.game) return s;
      const rng = makeRng((s.game.meta.rngState ^ 0x55aa55aa) >>> 0);
      const market = [...s.content.companies, ...s.game.market.companies];
      return { exitFlow: { kind: "acquisition", offer: acquisitionOffer(s.game, market, rng) } };
    }),

  acceptAcquisition: () =>
    set((s) => {
      if (!s.game || s.exitFlow?.kind !== "acquisition") return s;
      const { state, outcome } = applyAcquisition(s.game, s.exitFlow.offer);
      const a = withAch({ ...state, runOutcome: outcome });
      return { game: a.game, exitFlow: null, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  cashOut: () =>
    set((s) => {
      if (!s.game || !lockupExpired(s.game)) return s;
      const { state, outcome } = applyCashOut(s.game);
      const a = withAch({ ...state, runOutcome: outcome });
      return { game: a.game, exitFlow: null, ...(a.achievementToast ? { achievementToast: a.achievementToast } : {}) };
    }),

  cancelExit: () => set({ exitFlow: null }),

  clearAchievementToast: () => set({ achievementToast: null }),

  foundAgain: () =>
    set((s) =>
      s.game
        ? {
            carryOver: { reputation: s.game.founder.reputation, personalCash: s.game.founder.personalCash },
            game: null,
            negotiation: null,
            exitFlow: null,
            lastAdvance: null,
          }
        : s,
    ),

  resetGame: () => set({ game: null, lastAdvance: null, negotiation: null, exitFlow: null, carryOver: null }),
}));

/** The stage a player's next priced round would open. */
export function upcomingStage(current: Stage): Stage {
  return nextStage(current);
}

// Autosave: persist the run shortly after it changes (debounced).
let saveTimer: ReturnType<typeof setTimeout> | undefined;
useGame.subscribe((state, prev) => {
  if (state.game && state.game !== prev.game) {
    clearTimeout(saveTimer);
    const game = state.game;
    saveTimer = setTimeout(() => saveGame(game), 700);
  }
});

// ── internals ────────────────────────────────────────────────────────────────

function buildCtx(game: GameState, leadId: string): NegotiationContext {
  const stage = upcomingStage(game.company.stage);
  // The world's "weather" sets the market price: a hot climate / high hype
  // lifts the baseline valuation, a cold one cuts it. Difficulty's capital
  // climate then makes rounds across the board more or less generous.
  const heat = valuationMultiplier(game.world, game.company.industry) * difficultyProfile(game.difficulty).capitalClimate;
  const base = suggestedTerms(stage);
  const market = { ...base, valuation: Math.round(base.valuation * heat * 10) / 10 };
  return {
    stage,
    industry: game.company.industry,
    subIndustry: game.company.subIndustry,
    hype: game.world.hype[game.company.industry] ?? 50,
    vcClimate: game.world.vcClimate,
    week: game.clock.week,
    market,
    // A warm/cold founder (Seller vs. Engineer) seeds every relationship.
    relationshipScore: clamp((game.relationships[leadId]?.score ?? NEUTRAL_RELATIONSHIP) + (game.founder.investorWarmth ?? 0), 0, 100),
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
