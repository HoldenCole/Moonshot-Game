// Soft outcome resolution. Rather than hardcode 117 bespoke results, we read
// the intent from each choice's AUTHORED consequence text (label + detail +
// effects) — which describes the real cost/ethics/hype/reputation stakes — and
// apply proportionate effects. Reading the authored text (not the outcome_ref
// stem) avoids substring mis-tags (e.g. "derisk" matching "risk") and stops
// crisis choices that promise consequences from resolving to a no-op.

import type { GameState } from "@/domain/state";
import type { ResolvedChoice } from "@/domain/events";
import type { Money } from "@/domain/captable";
import { biteFor } from "./difficulty";
import { formatMoney } from "./format";

export interface OutcomeEffects {
  cash: Money; // delta ($M), negative = cost
  ethics: number; // delta
  reputation: number; // delta
  hypeSelf: number; // delta to the player's industry hype
  headcount: number; // delta to team size
  revenue: Money; // delta to annualized revenue ($M)
  result: string; // voiced one-line consequence
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const FREE = /\bfree\b|no money|no cost|costs? nothing|no immediate cost/;
const COST = /cash|capex|expensive|\bcosts?\b|spend|premium|markup|\bburns?\b|\bpay\b|buy ?out|dilut|\bfee\b|war chest|retention grant|bespoke|custom build|fortune|spot market|license it|re-?tool|rebuild|discount|sets? a low price|throw (resources|money|capital)|pours? (in|cash|capital)|pull(s|ed)? forward|foot the bill|fund(s|ed)? it|qualify an alternative|outspend|matching/;
const HEAVY = /brutal|heavy|fortune|bet-the-company|doubles|burns? cash fast|large cash|years and capital/;
const ETHICS_UP = /trust|integrity|transparent|responsibl|cooperat|\bclean\b|honest|standards|model citizen|defensible|own it|properly/;
const ETHICS_DOWN = /erodes?|cheap(est)? (today|now)|liabilit|cover|stonewall|deflect|downplay|hope it (fades|fizzle)|shortcut|skirt|reads as|risk it|quietly.*hope/;
const HYPE_UP = /maximi[sz]es? hype|\bhype\b (jump|up|pull)|buzz|press|halo|spotlight|ship loud|visibility|announc|riding the hype|talent pull/;
const HYPE_DOWN = /less hype|quieter|low profile|niche|retreat|shrinks|cedes? the (press|narrative)|forgoes the visibility/;
const REP_UP = /credibilit|profile (climbs|rises|jump)|persona|brand|standing rose|builds.*trust|reputation.*(climb|rise|boost)|halo of credibility|trust and a barrier/;
const REP_DOWN = /scrutiny|backlash|reputation (took|risk|hit)|erodes (trust|standing)|takes a knock|liability|stonewall/;

// Team size — a consequence the engine used to leave as flavor text.
const HEADCOUNT_DOWN = /lose the (researcher|engineer|lead|scientist|hire|talent)|(researcher|engineer|lead|scientist|teammate|cofounder|star) (walks|leaves|departs)|poach(ed|es|ing)|attrition|let (them|him|her|people|the team) go|loses? (a|the) (key|senior|star)/;
const HEADCOUNT_UP = /grows? (your |the )?team|staff up|expand(s|ing)? the team|build(s|ing)? out the team|hire(s|d)? (a |an |more |aggressively|the )|talent (influx|pour)/;
// Top-line — wins/losses of accounts, leases, pricing.
const REVENUE_UP = /revenue (jump|up|grows?|lift|climbs)|win(s|ning)? the (logo|account|deal|contract|bid|tender)|marquee (account|reference|customer|deal)|recurring revenue|lock in (a |the )?(lease|tenant|long lease|deal)|raise prices|land(s|ed)? the (deal|customer|contract|account|tenant)|occupancy (up|climbs|rises|ticks up)|anchor (customer|tenant)|new recurring|fills the manifest/;
const REVENUE_DOWN = /lose the (customer|account|contract|logo|tenant|anchor|deal)|customer (walks|leaves|churns)|tenant (walks|pulls out|leaves)|\bchurn|cancels?\b|pulls? out|discount aggressively|bleeds? margin|worse economics|margin hit|cedes? (share|the market|ground)|lose share|occupancy (slips|drops)|sets? a low price/;

export function resolveOutcome(choice: ResolvedChoice, state: GameState): OutcomeEffects {
  const text = `${choice.label} ${choice.detail} ${choice.effects}`.toLowerCase();
  const has = (re: RegExp) => re.test(text);
  const rev = Math.max(0, state.company.financials.revenue);

  const cash = !has(FREE) && has(COST) ? -costFor(state, has(HEAVY) ? 1.6 : 1) : 0;
  const ethics = (has(ETHICS_UP) ? 4 : 0) + (has(ETHICS_DOWN) ? -5 : 0);
  const reputation = (has(REP_UP) ? 3 : 0) + (has(REP_DOWN) ? -3 : 0);
  const hypeSelf = (has(HYPE_UP) ? 3 : 0) + (has(HYPE_DOWN) ? -2 : 0);
  const headcount = (has(HEADCOUNT_UP) ? 1 : 0) + (has(HEADCOUNT_DOWN) ? -1 : 0);
  const revenue =
    Math.round(((has(REVENUE_UP) ? Math.max(0.2, rev * 0.08) : 0) + (has(REVENUE_DOWN) ? -(rev * 0.12) : 0)) * 100) / 100;

  return { cash, ethics, reputation, hypeSelf, headcount, revenue, result: compose({ cash, ethics, reputation, hypeSelf, headcount, revenue }) };
}

/** Apply an outcome to the state, returning the new state. Cash is allowed to
 *  go negative — the tick's runway/out-of-cash system handles the consequences,
 *  so a costly choice is never silently swallowed. */
export function applyOutcome(state: GameState, fx: OutcomeEffects): GameState {
  const f = state.company.financials;
  const hype = { ...state.world.hype };
  const ind = state.company.industry;
  // Difficulty's event-severity lever amplifies the bad side of an outcome.
  const cash = biteFor(state.difficulty, fx.cash);
  const reputation = biteFor(state.difficulty, fx.reputation);
  const ethics = biteFor(state.difficulty, fx.ethics);
  const revenue = biteFor(state.difficulty, fx.revenue);
  hype[ind] = clamp((hype[ind] ?? 50) + fx.hypeSelf, 0, 100);

  return {
    ...state,
    company: {
      ...state.company,
      financials: {
        ...f,
        cash: f.cash + cash,
        headcount: Math.max(1, f.headcount + fx.headcount),
        revenue: Math.max(0, Math.round((f.revenue + revenue) * 100) / 100),
      },
    },
    founder: {
      ...state.founder,
      reputation: clamp(state.founder.reputation + reputation, 0, 100),
      ethics: clamp(state.founder.ethics + ethics, 0, 100),
    },
    world: { ...state.world, hype },
  };
}

function costFor(state: GameState, mult: number): Money {
  const cash = Math.max(0, state.company.financials.cash);
  return Math.round(clamp(cash * 0.14 * mult, 0.03, Math.max(0.03, cash * 0.5)) * 100) / 100;
}

function compose(fx: Omit<OutcomeEffects, "result">): string {
  const parts: string[] = [];
  if (fx.cash < 0) parts.push(`Cost you ${formatMoney(-fx.cash)}`);
  if (fx.revenue > 0) parts.push("revenue picked up");
  else if (fx.revenue < 0) parts.push("revenue took a hit");
  if (fx.headcount > 0) parts.push("you grew the team");
  else if (fx.headcount < 0) parts.push("you lost a teammate");
  if (fx.ethics > 0) parts.push("your integrity standing rose");
  else if (fx.ethics < 0) parts.push("it nicked your integrity standing");
  if (fx.reputation > 0) parts.push("your profile climbed");
  else if (fx.reputation < 0) parts.push("your reputation took a knock");
  if (fx.hypeSelf > 0) parts.push("sector buzz ticked up");
  else if (fx.hypeSelf < 0) parts.push("the spotlight dimmed a little");
  if (parts.length === 0) return "You held the line — no immediate cost.";
  const s = parts.join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
