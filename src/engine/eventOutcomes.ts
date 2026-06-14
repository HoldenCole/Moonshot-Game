// Soft outcome resolution. Rather than hardcode 117 bespoke results, we read
// the intent from each choice's AUTHORED consequence text (label + detail +
// effects) — which describes the real cost/ethics/hype/reputation stakes — and
// apply proportionate effects. Reading the authored text (not the outcome_ref
// stem) avoids substring mis-tags (e.g. "derisk" matching "risk") and stops
// crisis choices that promise consequences from resolving to a no-op.

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

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const FREE = /\bfree\b|no money|no cost|costs? nothing|no immediate cost/;
const COST = /cash|capex|expensive|\bcosts?\b|spend|premium|markup|\bburns?\b|\bpay\b|buy ?out|dilut|margin hit|\bfee\b|war chest|retention grant|bespoke|custom build|fortune|spot market|license it|re-?tool|rebuild|discount|sets? a low price/;
const HEAVY = /brutal|heavy|fortune|bet-the-company|doubles|fast|burns? cash fast|large cash/;
const ETHICS_UP = /trust|integrity|transparent|responsibl|cooperat|\bclean\b|honest|standards|model citizen|defensible|own it|properly/;
const ETHICS_DOWN = /erodes?|cheap(est)? (today|now)|liabilit|cover|stonewall|deflect|downplay|hope it (fades|fizzle)|shortcut|skirt|reads as|risk it|quietly.*hope/;
const HYPE_UP = /maximi[sz]es? hype|\bhype\b (jump|up|pull)|buzz|press|halo|spotlight|ship loud|visibility|announc|riding the hype|talent pull/;
const HYPE_DOWN = /less hype|quieter|low profile|niche|retreat|shrinks|cedes? the (press|narrative)|forgoes the visibility/;
const REP_UP = /credibilit|profile (climbs|rises|jump)|persona|brand|standing rose|builds.*trust|reputation.*(climb|rise|boost)|halo of credibility/;
const REP_DOWN = /scrutiny|backlash|reputation (took|risk|hit)|erodes (trust|standing)|takes a knock|liability/;

export function resolveOutcome(choice: ResolvedChoice, state: GameState): OutcomeEffects {
  const text = `${choice.label} ${choice.detail} ${choice.effects}`.toLowerCase();
  const has = (re: RegExp) => re.test(text);

  const cash = !has(FREE) && has(COST) ? -costFor(state, has(HEAVY) ? 1.6 : 1) : 0;
  const ethics = (has(ETHICS_UP) ? 4 : 0) + (has(ETHICS_DOWN) ? -5 : 0);
  const reputation = (has(REP_UP) ? 3 : 0) + (has(REP_DOWN) ? -3 : 0);
  const hypeSelf = (has(HYPE_UP) ? 3 : 0) + (has(HYPE_DOWN) ? -2 : 0);

  return { cash, ethics, reputation, hypeSelf, result: compose(cash, ethics, reputation, hypeSelf) };
}

/** Apply an outcome to the state, returning the new state. Cash is allowed to
 *  go negative — the tick's runway/out-of-cash system handles the consequences,
 *  so a costly choice is never silently swallowed. */
export function applyOutcome(state: GameState, fx: OutcomeEffects): GameState {
  const f = state.company.financials;
  const hype = { ...state.world.hype };
  const ind = state.company.industry;
  hype[ind] = clamp((hype[ind] ?? 50) + fx.hypeSelf, 0, 100);

  return {
    ...state,
    company: { ...state.company, financials: { ...f, cash: f.cash + fx.cash } },
    founder: {
      ...state.founder,
      reputation: clamp(state.founder.reputation + fx.reputation, 0, 100),
      ethics: clamp(state.founder.ethics + fx.ethics, 0, 100),
    },
    world: { ...state.world, hype },
  };
}

function costFor(state: GameState, mult: number): Money {
  const cash = Math.max(0, state.company.financials.cash);
  return Math.round(clamp(cash * 0.14 * mult, 0.03, Math.max(0.03, cash * 0.5)) * 100) / 100;
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
