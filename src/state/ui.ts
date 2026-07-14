// Ephemeral shell UI state (not persisted, not part of the save): the active
// workspace view and whether the command palette is open. Lifted out of the
// GameShell so the command palette and other surfaces can drive navigation.

import { create } from "zustand";
import type { View } from "@/ui/frame/types";

/** Which top-level surface the app is showing — the game boots to a title
 *  screen like a game, not into a form. "loading" plays the in-world load
 *  interstitial between Continue and the shell. */
export type Screen = "title" | "newgame" | "loading" | "game";

interface UiStore {
  screen: Screen;
  setScreen: (s: Screen) => void;
  /** The Esc pause menu (in-game only). */
  pauseOpen: boolean;
  setPauseOpen: (b: boolean) => void;
  /** The settings sheet (reachable from the title and the pause menu). */
  settingsOpen: boolean;
  setSettingsOpen: (b: boolean) => void;
  view: View;
  setView: (v: View) => void;
  paletteOpen: boolean;
  setPaletteOpen: (b: boolean) => void;
  /** Current step of the new-game wizard, so the guided tour can re-resolve its
   *  anchors as the player moves between steps (the wizard hides per-step DOM). */
  newGameStep: string;
  setNewGameStep: (s: string) => void;
  /** Set the moment a company is founded so the shell shows the founding
   *  interstitial once, then cleared when the player enters the game. */
  justFounded: boolean;
  setJustFounded: (b: boolean) => void;
  /** A dashboard panel to scroll to + flash on next dashboard render (deep
   *  links from the campus / the coach). Cleared after it's consumed. */
  focusPanel: string | null;
  setFocusPanel: (id: string | null) => void;
}

export const useUi = create<UiStore>((set) => ({
  screen: "title",
  setScreen: (screen) => set({ screen }),
  pauseOpen: false,
  setPauseOpen: (pauseOpen) => set({ pauseOpen }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  view: "campus",
  setView: (view) => set({ view }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  newGameStep: "welcome",
  setNewGameStep: (newGameStep) => set({ newGameStep }),
  justFounded: false,
  setJustFounded: (justFounded) => set({ justFounded }),
  focusPanel: null,
  setFocusPanel: (focusPanel) => set({ focusPanel }),
}));
