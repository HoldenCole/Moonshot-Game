// The game store. Holds the active save and exposes actions that drive it
// through the pure engine. Content (including tuning) is loaded once.

import { create } from "zustand";
import type { GameState } from "@/domain/state";
import type { RoundTerms } from "@/domain/captable";
import type { Stage } from "@/domain/ids";
import type { LogEntry, StopReason } from "@/domain/log";
import { nextStage } from "@/domain/ids";
import { applyRound } from "@/engine/captable";
import { advance as engineAdvance, checkMilestones, type AdvanceMode } from "@/engine/tick";
import { runwayBand } from "@/engine/finance";
import { formatMoney } from "@/engine/format";
import { loadContent, type ContentDB } from "@/content/load";
import { createNewGame, type FoundingChoices } from "./newgame";

export interface RaiseInput {
  terms: RoundTerms;
  stage: Stage;
  leadInvestorId: string;
  leadInvestorName: string;
}

export interface AdvanceSummary {
  weeks: number;
  stopReason: StopReason;
  atWeek: number;
}

interface GameStore {
  content: ContentDB;
  game: GameState | null;
  /** Ephemeral summary of the most recent advance, for the smart-advance hint. */
  lastAdvance: AdvanceSummary | null;

  newGame: (choices: FoundingChoices) => void;
  raiseRound: (input: RaiseInput) => void;
  advance: (mode: AdvanceMode) => void;
  dismissAlert: (id: string) => void;
  resetGame: () => void;
}

export const useGame = create<GameStore>((set) => ({
  content: loadContent(),
  game: null,
  lastAdvance: null,

  newGame: (choices) =>
    set({ game: createNewGame(choices, new Date().toISOString()), lastAdvance: null }),

  raiseRound: (input) =>
    set((s) => {
      if (!s.game) return s;
      const tuning = s.content.tuning;
      const company = s.game.company;
      const capTable = applyRound(company.capTable, {
        terms: input.terms,
        stage: input.stage,
        week: s.game.clock.week,
        leadInvestorId: input.leadInvestorId,
        leadInvestorName: input.leadInvestorName,
      });
      const round = capTable.rounds[capTable.rounds.length - 1]!;

      const company2 = {
        ...company,
        stage: input.stage,
        capTable,
        financials: {
          ...company.financials,
          cash: company.financials.cash + input.terms.roundSize,
          valuation: round.postMoney,
        },
      };

      const entry: LogEntry = {
        id: `round-${round.id}`,
        week: s.game.clock.week,
        kind: "company",
        tone: "up",
        headline: `Closed the ${round.name} with ${input.leadInvestorName}`,
        detail: `${formatMoney(round.amountRaised)} raised at ${formatMoney(round.postMoney)} post-money.`,
      };

      // Cash is replenished: clear runway/raise alerts and re-baseline the band.
      let next: GameState = {
        ...s.game,
        company: company2,
        log: [...s.game.log, entry],
        alerts: s.game.alerts.filter(
          (a) => a.kind !== "runway_critical" && a.kind !== "raise_ready" && a.kind !== "out_of_cash",
        ),
        lastRunwayBand: runwayBand(company2, tuning),
      };

      // A raise can vault net worth past a milestone.
      const ms = checkMilestones(next, tuning, s.game.clock.week);
      next = { ...ms.state, log: [...next.log, ...ms.entries] };

      return { game: next };
    }),

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

  resetGame: () => set({ game: null, lastAdvance: null }),
}));

/** The stage a player's next priced round would open. */
export function upcomingStage(current: Stage): Stage {
  return nextStage(current);
}
