// The onboarding hint library. CK3-style: each hint fires once, anchored to the
// real UI element it explains, the first time the player naturally reaches that
// system. Copy lives here so the set can grow from playtest signal without
// touching the driver. Keep it lean — a handful of high-value beats, never spam.

import type { View } from "@/ui/frame/types";
import type { GameState } from "@/domain/state";
import { ipoEligible } from "@/engine/exit";

export interface HintCtx {
  view: View;
  game: GameState;
}

export interface Hint {
  id: string;
  /** `data-coach` value of the element this points at. */
  anchor: string;
  title: string;
  body: string;
  placement: "top" | "bottom" | "left" | "right";
  /** Lower fires first when several are eligible at once. */
  priority: number;
  /** Only offered when this holds (and the anchor is on screen). */
  when: (c: HintCtx) => boolean;
}

/** Hints eligible right now (unseen + condition holds), highest priority first.
 *  The driver then shows the first one whose anchor is actually on screen. Pure,
 *  so the ordering is unit-testable without a DOM. */
export function eligibleHints(ctx: HintCtx, seen: readonly string[]): Hint[] {
  return HINTS.filter((h) => !seen.includes(h.id) && h.when(ctx)).sort((a, b) => a.priority - b.priority);
}

const onDashboard = (c: HintCtx) => c.view === "dashboard";

export const HINTS: Hint[] = [
  {
    id: "welcome",
    anchor: "advance",
    title: "Welcome to Moonshot Inc",
    body: "This is how time moves — advance a week at a time, or skip to the next decision. Your burn drains cash every week, so time is never free. Tips like this appear once; you can switch them off anytime.",
    placement: "bottom",
    priority: 0,
    when: onDashboard,
  },
  {
    id: "event",
    anchor: "event",
    title: "A decision lands on your desk",
    body: "Events are the heartbeat of the run. Each choice trades off cash, reputation, and your integrity — there's rarely a free option, and the world remembers what you pick.",
    placement: "top",
    priority: 5,
    when: (c) => c.game.pendingEvent != null,
  },
  {
    id: "runway",
    anchor: "runway",
    title: "Watch your runway",
    body: "Runway is how many months of cash you have left at the current burn. The best rounds are raised from strength — well before this number gets short.",
    placement: "bottom",
    priority: 10,
    when: onDashboard,
  },
  {
    id: "captable",
    anchor: "captable",
    title: "Your cap table is the whole game",
    body: "You own 100% today. Every round you raise sells a slice of the company — and dilution compounds. Guarding ownership across many rounds is how founders actually get rich.",
    placement: "top",
    priority: 20,
    when: (c) => c.view === "dashboard" || c.view === "captable",
  },
  {
    id: "signature",
    anchor: "signature",
    title: "Your signature move",
    body: "This is your sub-industry's defining bet: commit resources, let the process run over weeks, and live with the outcome. Win it and the whole company re-rates.",
    placement: "top",
    priority: 30,
    when: (c) => c.view === "dashboard",
  },
  {
    id: "fundraising",
    anchor: "fundraising",
    title: "Terms matter as much as price",
    body: "A high valuation isn't the whole deal. The option pool, board seats, and liquidation preferences all bite into your ownership and control — read the term sheet, not just the headline number.",
    placement: "top",
    priority: 40,
    when: (c) => c.view === "fundraising",
  },
  {
    id: "market",
    anchor: "market",
    title: "The frontier market",
    body: "Every rival, supplier, and customer lives here. Prices move with fundamentals, hype, and the macro cycle — the same forces that set the price of your own next round.",
    placement: "bottom",
    priority: 50,
    when: (c) => c.view === "market",
  },

  // ── First-time milestone triggers (fire once, the first time it happens) ──
  {
    id: "first-raise",
    anchor: "captable",
    title: "Your first round is closed",
    body: "Investors own a slice now, and your founder percentage just dropped — that's dilution. It compounds across every future round, so the goal is to raise as little, and as high, as you can get away with.",
    placement: "top",
    priority: 22,
    when: (c) => c.game.company.capTable.rounds.some((r) => r.postMoney > 0),
  },
  {
    id: "exit-ready",
    anchor: "exit",
    title: "An exit is on the table",
    body: "You're big enough to go public — or to field an acquisition. Either one ends the run and locks in your founder proceeds, so time it for a hot window rather than a desperate one.",
    placement: "top",
    priority: 35,
    when: (c) => ipoEligible(c.game),
  },
  {
    id: "went-public",
    anchor: "company",
    title: "You took it public",
    body: "You're a public-company CEO now. Your shares are locked for 180 days, the market re-prices you every week, and the run keeps going — chase the next net-worth milestone.",
    placement: "bottom",
    priority: 8,
    when: (c) => c.game.company.stage === "public",
  },
];
