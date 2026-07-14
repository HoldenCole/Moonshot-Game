import { useEffect, useState } from "react";
import type { View } from "./types";
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
import { CampusView } from "@/ui/campus/CampusView";
import { OrreryHeroLive } from "@/ui/heroes/live";
import { PauseMenu } from "./PauseMenu";
import { CelebrationLayer } from "./CelebrationLayer";
import { KeysOverlay } from "./KeysOverlay";
import { play } from "@/audio/sfx";
import { setAmbientMood, startAmbient } from "@/audio/ambient";
import {
  ResearchTabLive, MegaprojectsTabLive, EmpireTabLive, ExecutivesTabLive,
  ContractsTabLive, StandingTabLive, BriefingTabLive,
} from "@/ui/late/connectors";
import { EventModal } from "@/ui/events/EventModal";
import { OutcomeToast } from "@/ui/events/OutcomeToast";
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
      <OrreryHeroLive />
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

  const [keysOpen, setKeysOpen] = useState(false);

  // The ambient pad tracks the macro cycle: contraction turns the music dark.
  const macroPhase = useGame((s) => s.game?.world.macroPhase);
  useEffect(() => {
    startAmbient();
    setAmbientMood(macroPhase === "contraction" || macroPhase === "trough" ? "dark" : "bright");
  }, [macroPhase]);

  // Game keys: ⌘K palette, Esc pause, Space advances a week, 1–8 switch views,
  // ? shows the legend.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      const ui = useUi.getState();
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (e.key === "Escape") {
        if (keysOpen) {
          e.preventDefault();
          setKeysOpen(false);
          return;
        }
        // The palette and settings own their own Esc; otherwise toggle pause.
        if (ui.paletteOpen || ui.settingsOpen) return;
        e.preventDefault();
        play(ui.pauseOpen ? "close" : "open");
        ui.setPauseOpen(!ui.pauseOpen);
        return;
      }
      const surfaceUp = ui.pauseOpen || ui.settingsOpen || ui.paletteOpen || keysOpen;
      if (e.key === "?" && !typing && !surfaceUp) {
        e.preventDefault();
        play("open");
        setKeysOpen(true);
        return;
      }
      if (/^[1-8]$/.test(e.key) && !typing && !surfaceUp && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const order: View[] = ["campus", "dashboard", "captable", "fundraising", "market", "world", "team", "about"];
        const v = order[Number(e.key) - 1];
        if (v) {
          play("nav");
          useUi.getState().setView(v);
        }
        return;
      }
      if (e.key === " " || e.code === "Space") {
        // Space = advance a week, but never while typing, focused on a control,
        // or while any surface (pause, settings, palette, event, exit) is up.
        const g = useGame.getState();
        const blocked = surfaceUp || !g.game || g.game.pendingEvent != null || g.game.runOutcome != null || g.exitFlow != null;
        if (typing || (el && el.tagName === "BUTTON") || blocked) return;
        e.preventDefault();
        play("advance");
        g.advance({ type: "weeks", weeks: 1 });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen, keysOpen]);

  const showRail = railOpen && view !== "market" && view !== "world";

  return (
    <div className="shell">
      <TopBar />
      <Ticker />
      <div className="shell__body">
        <NavRail view={view} onChange={setView} />
        <main className="workspace" data-guide="center-workspace">
          <div className="view-fade" key={view}>
            {view === "campus" && <CampusView />}
            {view === "dashboard" && <Dashboard onNavigate={setView} />}
            {view === "captable" && <CapTableView />}
            {view === "fundraising" && <FundraisingView />}
            {view === "market" && <MarketView />}
            {view === "world" && <WorldView />}
            {view === "team" && <TeamView />}
            {view === "about" && <AboutView />}
            {view === "research" && <div className="workspace-scroll late-scroll"><ResearchTabLive /></div>}
            {view === "megaprojects" && <div className="workspace-scroll late-scroll"><MegaprojectsTabLive /></div>}
            {view === "empire" && <div className="workspace-scroll late-scroll"><EmpireTabLive /></div>}
            {view === "executives" && <div className="workspace-scroll late-scroll"><ExecutivesTabLive /></div>}
            {view === "contracts" && <div className="workspace-scroll late-scroll"><ContractsTabLive /></div>}
            {view === "standing" && <div className="workspace-scroll late-scroll"><StandingTabLive /></div>}
            {view === "briefing" && <div className="workspace-scroll late-scroll"><BriefingTabLive /></div>}
          </div>
        </main>
        {showRail && <NarrativeRail />}
        {!railOpen && view !== "market" && view !== "world" && (
          <button className="rail-reopen" onClick={toggleRail} title="Show narrative rail" aria-label="Show narrative rail">
            ‹
          </button>
        )}
      </div>
      <EventModal />
      <OutcomeToast />
      <ExitFlow />
      <PauseMenu />
      <CelebrationLayer />
      {keysOpen && <KeysOverlay onClose={() => setKeysOpen(false)} />}
      <AchievementToast />
      {!guidedActive && <TutorialLayer view={view} />}
      <CommandPalette />
    </div>
  );
}
