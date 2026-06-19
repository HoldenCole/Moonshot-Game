// Achievements — the earned-moments record (~30 for V1, grows via updates).
// Each is a pure predicate over game state; once unlocked it stays unlocked.

import type { GameState } from "@/domain/state";
import { founderOwnership } from "./captable";
import { netWorth, valuationMark } from "./finance";
import { stageRank } from "@/domain/ids";

export type AchTier = "bronze" | "silver" | "gold";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  tier: AchTier;
  test: (g: GameState) => boolean;
}

const pricedRounds = (g: GameState) => g.company.capTable.rounds.filter((r) => r.postMoney > 0).length;
const stageAtLeast = (g: GameState, s: Parameters<typeof stageRank>[0]) => stageRank(g.company.stage) >= stageRank(s);
const execCount = (g: GameState) => Object.keys(g.company.executives).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_money", name: "First Money In", desc: "Close your first priced round.", tier: "bronze", test: (g) => pricedRounds(g) >= 1 },
  { id: "series_a", name: "Series A", desc: "Reach Series A.", tier: "bronze", test: (g) => stageAtLeast(g, "series_a") },
  { id: "series_b", name: "Scaling Up", desc: "Reach Series B.", tier: "silver", test: (g) => stageAtLeast(g, "series_b") },
  { id: "growth", name: "Growth Stage", desc: "Reach the growth stage.", tier: "silver", test: (g) => stageAtLeast(g, "growth") },
  { id: "dealmaker", name: "Dealmaker", desc: "Close three rounds.", tier: "silver", test: (g) => pricedRounds(g) >= 3 },
  { id: "clean_cap", name: "Still in Control", desc: "Hold 51%+ at Series A.", tier: "silver", test: (g) => stageAtLeast(g, "series_a") && founderOwnership(g.company.capTable) >= 0.51 },

  { id: "unicorn", name: "Unicorn", desc: "Reach a $1B valuation.", tier: "gold", test: (g) => valuationMark(g.company) >= 1000 },
  { id: "decacorn", name: "Decacorn", desc: "Reach a $10B valuation.", tier: "gold", test: (g) => valuationMark(g.company) >= 10000 },
  { id: "hectocorn", name: "Hectocorn", desc: "Reach a $100B valuation.", tier: "gold", test: (g) => valuationMark(g.company) >= 100000 },
  { id: "trillion_co", name: "Trillion-Dollar Company", desc: "Reach a $1T valuation.", tier: "gold", test: (g) => valuationMark(g.company) >= 1000000 },
  { id: "ipo", name: "Ring the Bell", desc: "Take a company public.", tier: "gold", test: (g) => g.company.stage === "public" },
  { id: "first_exit", name: "Exit", desc: "Complete your first exit.", tier: "gold", test: (g) => g.runOutcome != null },

  { id: "millionaire", name: "Millionaire", desc: "Reach $1M net worth.", tier: "bronze", test: (g) => netWorth(g) >= 1 },
  { id: "deca_m", name: "$10M Club", desc: "Reach $10M net worth.", tier: "silver", test: (g) => netWorth(g) >= 10 },
  { id: "centi_m", name: "Nine Figures", desc: "Reach $100M net worth.", tier: "gold", test: (g) => netWorth(g) >= 100 },
  { id: "billionaire", name: "Billionaire", desc: "Reach $1B net worth.", tier: "gold", test: (g) => netWorth(g) >= 1000 },
  { id: "hundred_billionaire", name: "Hundred-Billionaire", desc: "Reach $100B net worth.", tier: "gold", test: (g) => netWorth(g) >= 100000 },
  { id: "trillionaire", name: "Trillionaire", desc: "Reach $1T net worth.", tier: "gold", test: (g) => netWorth(g) >= 1000000 },

  { id: "first_hire", name: "Delegator", desc: "Hire your first executive.", tier: "bronze", test: (g) => execCount(g) >= 1 },
  { id: "full_bench", name: "Full Bench", desc: "Hire all four executives.", tier: "silver", test: (g) => execCount(g) >= 4 },
  { id: "hands_off", name: "Hands Off", desc: "Set every area to Handle it.", tier: "silver", test: (g) => Object.values(g.company.delegation).every((a) => a === "handle") && execCount(g) >= 4 },
  { id: "big_team", name: "A Real Company", desc: "Grow to 20 people.", tier: "bronze", test: (g) => g.company.financials.headcount >= 20 },

  { id: "revenue", name: "First Dollar", desc: "Book your first revenue.", tier: "bronze", test: (g) => g.company.financials.revenue > 0 },
  { id: "profitable", name: "In the Black", desc: "Turn cash-flow positive.", tier: "gold", test: (g) => g.company.financials.revenue / 12 > g.company.financials.burnMonthly && g.company.financials.revenue > 0 },

  { id: "sig_commit", name: "Big Swing", desc: "Commit a signature process.", tier: "bronze", test: (g) => g.company.signature.status !== "idle" },
  { id: "sig_win", name: "Breakthrough", desc: "Land a signature win.", tier: "silver", test: (g) => g.company.signature.lastOutcome?.kind === "success" },

  { id: "saint", name: "Above Reproach", desc: "Keep integrity at 85+.", tier: "silver", test: (g) => g.founder.ethics >= 85 },
  { id: "ruthless", name: "Whatever It Takes", desc: "Let integrity fall to 25.", tier: "silver", test: (g) => g.founder.ethics <= 25 },
  { id: "survivor", name: "Survivor", desc: "Weather a genuine crisis.", tier: "silver", test: (g) => g.log.some((e) => e.tone === "crisis") },
  { id: "famous", name: "Public Figure", desc: "Reach 80 founder reputation.", tier: "silver", test: (g) => g.founder.reputation >= 80 },

  { id: "patient", name: "Playing the Long Game", desc: "Run a company for two years.", tier: "bronze", test: (g) => g.clock.week >= 104 },
  { id: "veteran", name: "Veteran", desc: "Run a company for five years.", tier: "silver", test: (g) => g.clock.week >= 260 },
  { id: "serial", name: "Serial Founder", desc: "Found again after an exit.", tier: "gold", test: (g) => g.founder.personalCash > 0 && g.clock.week < 6 && pricedRounds(g) === 0 },
  { id: "magnate", name: "Magnate", desc: "Cross $1B net worth and exit.", tier: "gold", test: (g) => netWorth(g) >= 1000 && g.runOutcome != null },
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function achievementById(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

/** All achievement ids currently satisfied by the state. */
export function checkAchievements(state: GameState): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(state)).map((a) => a.id);
}

/** Ids newly unlocked relative to what's already recorded. */
export function newlyUnlocked(state: GameState): string[] {
  const have = new Set(state.achievements);
  return checkAchievements(state).filter((id) => !have.has(id));
}
