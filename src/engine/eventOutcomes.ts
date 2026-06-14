// Soft outcome resolution. The authored events reference outcomes by a short
// ref ("poach_counter"). Rather than hardcode 150 bespoke results, we read the
// intent from the ref's keywords and apply proportionate, plausible effects —
// the "soft outcomes" the design calls for. A starter model (Path B); the
// numbers are tunable and grow with playtest.

import type { GameState } from "@/domain/state";
import type { ResolvedChoice } from "@/domain/events";
import type { Money } from "@/domain/captable";
import { formatMoney } from "./format";

export interface OutcomeEffects {
  cash: Money; // delta ($M), negative = cost
  ethics: number; // delta
  reputation: number; // delta
  hypeSelf: number; // delta to the player's industry hype
  result: string; // voiced one-line consequence
}

const COSTLY = ["counter", "aggress", "pay", "premium", "hire", "custom", "discount", "match", "commit_new", "license", "retry", "buyout", "invest", "raise"];
const ETHICS_UP = ["transparent", "cooperate", "preempt", "embrace", "license", "present", "balance", "rest", "delegate", "differentiate", "alternative"];
const ETHICS_DOWN = ["deflect", "quiet", "risk", "fight", "push"];
const HYPE_UP = ["loud", "breakthrough", "raise", "chase", "profile_embrace", "hype_raise"];
const HYPE_DOWN = ["niche", "decline", "discipline"];
const REP_UP = ["transparent", "preempt", "present", "profile_embrace", "differentiate", "cooperate"];
const REP_DOWN = ["deflect", "part", "push"];

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function resolveOutcome(choice: ResolvedChoice, state: GameState): OutcomeEffects {
  const ref = choice.outcomeRef.toLowerCase();
  const hit = (arr: string[]) => arr.some((k) => ref.includes(k));

  const cash = hit(COSTLY) ? -costFor(state) : 0;
  const ethics = (hit(ETHICS_UP) ? 4 : 0) + (hit(ETHICS_DOWN) ? -5 : 0);
  const reputation = (hit(REP_UP) ? 3 : 0) + (hit(REP_DOWN) ? -3 : 0);
  const hypeSelf = (hit(HYPE_UP) ? 3 : 0) + (hit(HYPE_DOWN) ? -2 : 0);

  return { cash, ethics, reputation, hypeSelf, result: compose(cash, ethics, reputation, hypeSelf) };
}

/** Apply an outcome to the state, returning the new state. */
export function applyOutcome(state: GameState, fx: OutcomeEffects): GameState {
  const f = state.company.financials;
  const hype = { ...state.world.hype };
  const ind = state.company.industry;
  hype[ind] = clamp((hype[ind] ?? 50) + fx.hypeSelf, 0, 100);

  return {
    ...state,
    company: { ...state.company, financials: { ...f, cash: Math.max(0, f.cash + fx.cash) } },
    founder: {
      ...state.founder,
      reputation: clamp(state.founder.reputation + fx.reputation, 0, 100),
      ethics: clamp(state.founder.ethics + fx.ethics, 0, 100),
    },
    world: { ...state.world, hype },
  };
}

function costFor(state: GameState): Money {
  const cash = state.company.financials.cash;
  return Math.round(clamp(cash * 0.14, 0.03, Math.max(0.03, cash * 0.5)) * 100) / 100;
}

function compose(cash: number, ethics: number, reputation: number, hype: number): string {
  const parts: string[] = [];
  if (cash < 0) parts.push(`Cost you ${formatMoney(-cash)}`);
  if (ethics > 0) parts.push("your integrity standing rose");
  else if (ethics < 0) parts.push("it nicked your integrity standing");
  if (reputation > 0) parts.push("your profile climbed");
  else if (reputation < 0) parts.push("your reputation took a knock");
  if (hype > 0) parts.push("sector buzz ticked up");
  else if (hype < 0) parts.push("the spotlight dimmed a little");
  if (parts.length === 0) return "You held the line — no immediate cost.";
  const s = parts.join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
