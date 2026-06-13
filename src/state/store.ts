// The game store. Holds the active save and exposes actions that drive it
// through the pure engine. Content is loaded once and kept alongside.

import { create } from "zustand";
import type { GameState } from "@/domain/state";
import type { RoundTerms } from "@/domain/captable";
import type { Stage } from "@/domain/ids";
import { nextStage } from "@/domain/ids";
import { applyRound } from "@/engine/captable";
import { loadContent, type ContentDB } from "@/content/load";
import { createNewGame, type FoundingChoices } from "./newgame";

export interface RaiseInput {
  terms: RoundTerms;
  stage: Stage;
  leadInvestorId: string;
  leadInvestorName: string;
}

interface GameStore {
  content: ContentDB;
  game: GameState | null;

  newGame: (choices: FoundingChoices) => void;
  raiseRound: (input: RaiseInput) => void;
  /** Move the clock forward, accruing burn against cash. The full tick engine
   *  (world, events, signature mechanics) lands in later phases; for now this
   *  is the real, deterministic financial effect of time passing. */
  advanceWeeks: (weeks: number) => void;
  resetGame: () => void;
}

const WEEKS_PER_MONTH = 13 / 3; // ≈4.333

export const useGame = create<GameStore>((set) => ({
  content: loadContent(),
  game: null,

  newGame: (choices) =>
    set({ game: createNewGame(choices, new Date().toISOString()) }),

  raiseRound: (input) =>
    set((s) => {
      if (!s.game) return s;
      const company = s.game.company;
      const capTable = applyRound(company.capTable, {
        terms: input.terms,
        stage: input.stage,
        week: s.game.clock.week,
        leadInvestorId: input.leadInvestorId,
        leadInvestorName: input.leadInvestorName,
      });
      const newRound = capTable.rounds[capTable.rounds.length - 1]!;

      return {
        game: {
          ...s.game,
          company: {
            ...company,
            stage: input.stage,
            capTable,
            financials: {
              ...company.financials,
              cash: company.financials.cash + input.terms.roundSize,
              valuation: newRound.postMoney,
            },
          },
        },
      };
    }),

  advanceWeeks: (weeks) =>
    set((s) => {
      if (!s.game) return s;
      const f = s.game.company.financials;
      const months = weeks / WEEKS_PER_MONTH;
      const netBurn = (f.burnMonthly - f.revenue / 12) * months;
      return {
        game: {
          ...s.game,
          clock: { week: s.game.clock.week + weeks },
          company: {
            ...s.game.company,
            financials: { ...f, cash: f.cash - netBurn },
          },
        },
      };
    }),

  resetGame: () => set({ game: null }),
}));

/** The stage a player's next priced round would open. */
export function upcomingStage(current: Stage): Stage {
  return nextStage(current);
}
