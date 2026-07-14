// The coach: reads the run and names the single most useful next move. Quiet
// by design — it stands down whenever an alert is already on screen, and says
// nothing when the right move is simply to let time run.

import type { GameState } from "@/domain/state";
import type { SubContent } from "./productsRuntime";
import { gatesMet, betCost } from "./products";
import { runwayMonths } from "./finance";
import { signatureConfig } from "./signature";

export interface NextMove {
  id: string;
  label: string;
  detail: string;
  /** Where the move lives (a View id the shell can navigate to). */
  view: "dashboard" | "fundraising" | "research";
  /** Dashboard panel to focus, when the move lives inside one. */
  panel?: string;
}

/** The most useful thing to do right now, or null when the game is loud
 *  (alerts/pending decisions own the moment) or genuinely quiet. */
export function nextMove(game: GameState, sub: SubContent | null): NextMove | null {
  // Something is already asking for attention — don't compete with it.
  if (game.pendingEvent || game.alerts.length > 0 || game.runOutcome) return null;

  const c = game.company;
  const rt = c.products;
  const noun = signatureConfig(c.subIndustry).noun;

  // 1 — Survival first: raise from strength, before the alerts start shouting.
  if (c.stage !== "public" && runwayMonths(c) < 10 && c.financials.cash > 0) {
    return {
      id: "raise",
      label: "Open a round from strength",
      detail: `${Math.floor(runwayMonths(c))} months of runway left. The best terms are signed before you need them.`,
      view: "fundraising",
    };
  }

  // 1 — R&D is the engine; an unfunded lab improves nothing.
  if (rt && sub && rt.rd.rd_budget_per_week <= 0 && c.financials.cash > 1) {
    return {
      id: "fund-rd",
      label: "Fund R&D",
      detail: "Nothing improves until the lab has a budget. Even a small weekly spend moves the gates.",
      view: "dashboard",
      panel: "products",
    };
  }

  // 2 — A cleared, affordable build with nothing in flight: commit.
  if (rt && sub && rt.bets.length === 0) {
    const ready = [...sub.productById.values()]
      .filter((a) => gatesMet(a, rt.rd.levels))
      .map((a) => ({ a, cost: betCost(a, sub.tuning) }))
      .filter(({ cost }) => c.financials.cash >= cost)
      .sort((x, y) => x.a.tier - y.a.tier || x.cost - y.cost)[0];
    if (ready) {
      return {
        id: "commit-bet",
        label: `Commit a ${noun}: ${ready.a.name}`,
        detail: `Gates are clear and the ${ready.cost.toFixed(1)}M build is affordable. Revenue starts when it ships.`,
        view: "dashboard",
        panel: "products",
      };
    }
    // 3 — Nothing buildable yet: name the nearest gate to push.
    const nearest = [...sub.productById.values()]
      .filter((a) => !gatesMet(a, rt.rd.levels))
      .map((a) => {
        const gaps = Object.entries(a.gates).map(([line, need]) => ({ line, need, cur: rt.rd.levels[line] ?? 0 }));
        const worst = gaps.sort((g1, g2) => g2.need - g2.cur - (g1.need - g1.cur))[0]!;
        return { a, worst, gap: worst.need - worst.cur };
      })
      .filter((x) => x.gap > 0)
      .sort((x, y) => x.a.tier - y.a.tier || x.gap - y.gap)[0];
    if (nearest && rt.rd.rd_budget_per_week > 0) {
      const lineName = sub.lines.find((l) => l.id === nearest.worst.line)?.name ?? nearest.worst.line;
      return {
        id: "push-gate",
        label: `Push ${lineName} to ${nearest.worst.need}`,
        detail: `${lineName} is at ${Math.floor(nearest.worst.cur)} — clearing ${nearest.worst.need} unlocks ${nearest.a.name}.`,
        view: "dashboard",
        panel: "products",
      };
    }
  }

  // 5 — The frontier is open but the lab bench is idle.
  if (game.late) {
    const nodes = Object.values(game.late.slice.research.nodes);
    const running = nodes.filter((n) => n.state === "in_progress").length;
    const available = nodes.filter((n) => n.state === "available").length;
    if (running === 0 && available > 0) {
      return {
        id: "start-research",
        label: "Start a research program",
        detail: `${available} programs are in reach and none are running. The tree only moves when you push it.`,
        view: "research",
      };
    }
  }

  // 6 — The whole portfolio is winding down: the next product is overdue.
  if (rt && sub && rt.products.length > 0 && rt.bets.length === 0 && rt.products.every((p) => p.state === "declining")) {
    return {
      id: "next-product",
      label: `Every ${noun} is fading — build the next one`,
      detail: "The entire portfolio is in decline. Commit the next build before the revenue goes with it.",
      view: "dashboard",
      panel: "products",
    };
  }

  return null;
}
