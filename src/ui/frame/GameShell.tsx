import { useState } from "react";
import { TopBar } from "./TopBar";
import { Ticker } from "./Ticker";
import { NavRail } from "./NavRail";
import { NarrativeRail } from "./NarrativeRail";
import type { View } from "./types";
import { Dashboard } from "@/ui/views/Dashboard";
import { MarketView } from "@/ui/views/MarketView";
import { FundraisingView } from "@/ui/views/FundraisingView";
import { WorldView } from "@/ui/views/WorldView";
import { AboutView } from "@/ui/views/AboutView";
import { CapTablePanel } from "@/ui/captable/CapTablePanel";
import { useGame } from "@/state/store";

function CapTableView() {
  const game = useGame((s) => s.game);
  if (!game) return null;
  return (
    <div className="workspace-scroll">
      <CapTablePanel capTable={game.company.capTable} />
    </div>
  );
}

/** The four persistent zones (decision E): top bar, left nav rail, center
 *  workspace, right narrative rail. The workspace swaps with the active view. */
export function GameShell() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div className="shell">
      <TopBar />
      <Ticker />
      <div className="shell__body">
        <NavRail view={view} onChange={setView} />
        <main className="workspace">
          {view === "dashboard" && <Dashboard onNavigate={setView} />}
          {view === "captable" && <CapTableView />}
          {view === "fundraising" && <FundraisingView />}
          {view === "market" && <MarketView />}
          {view === "world" && <WorldView />}
          {view === "about" && <AboutView />}
        </main>
        {view !== "market" && view !== "world" && <NarrativeRail />}
      </div>
    </div>
  );
}
