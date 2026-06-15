import { useEffect } from "react";
import { TopBar } from "./TopBar";
import { Ticker } from "./Ticker";
import { NavRail } from "./NavRail";
import { NarrativeRail } from "./NarrativeRail";
import { CommandPalette } from "./CommandPalette";
import { Dashboard } from "@/ui/views/Dashboard";
import { MarketView } from "@/ui/views/MarketView";
import { FundraisingView } from "@/ui/views/FundraisingView";
import { WorldView } from "@/ui/views/WorldView";
import { TeamView } from "@/ui/views/TeamView";
import { AboutView } from "@/ui/views/AboutView";
import { CapTablePanel } from "@/ui/captable/CapTablePanel";
import { EventModal } from "@/ui/events/EventModal";
import { ExitFlow } from "@/ui/exit/ExitFlow";
import { AchievementToast } from "@/ui/achievements/AchievementToast";
import { TutorialLayer } from "@/ui/tutorial/TutorialLayer";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { usePrefs } from "@/state/prefs";

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
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const railOpen = usePrefs((s) => s.railOpen);
  const toggleRail = usePrefs((s) => s.toggleRail);
  // While the guided first-run tour is running, the ambient hints stand down so
  // the player only ever sees one coachmark at a time.
  const hasGuided = useGame((s) => (s.content.tutorial?.steps.length ?? 0) > 0);
  const guidedActive = usePrefs((s) => s.tutorialEnabled && !s.guidedDone) && hasGuided;

  // ⌘K / Ctrl-K opens the command palette from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  const showRail = railOpen && view !== "market" && view !== "world";

  return (
    <div className="shell">
      <TopBar />
      <Ticker />
      <div className="shell__body">
        <NavRail view={view} onChange={setView} />
        <main className="workspace" data-guide="center-workspace">
          {view === "dashboard" && <Dashboard onNavigate={setView} />}
          {view === "captable" && <CapTableView />}
          {view === "fundraising" && <FundraisingView />}
          {view === "market" && <MarketView />}
          {view === "world" && <WorldView />}
          {view === "team" && <TeamView />}
          {view === "about" && <AboutView />}
        </main>
        {showRail && <NarrativeRail />}
        {!railOpen && view !== "market" && view !== "world" && (
          <button className="rail-reopen" onClick={toggleRail} title="Show narrative rail" aria-label="Show narrative rail">
            ‹
          </button>
        )}
      </div>
      <EventModal />
      <ExitFlow />
      <AchievementToast />
      {!guidedActive && <TutorialLayer view={view} />}
      <CommandPalette />
    </div>
  );
}
