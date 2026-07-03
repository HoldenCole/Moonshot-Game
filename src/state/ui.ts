// Ephemeral shell UI state (not persisted, not part of the save): the active
// workspace view and whether the command palette is open. Lifted out of the
// GameShell so the command palette and other surfaces can drive navigation.

import { create } from "zustand";
import type { View } from "@/ui/frame/types";

interface UiStore {
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
}

export const useUi = create<UiStore>((set) => ({
  view: "dashboard",
  setView: (view) => set({ view }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  newGameStep: "welcome",
  setNewGameStep: (newGameStep) => set({ newGameStep }),
  justFounded: false,
  setJustFounded: (justFounded) => set({ justFounded }),
}));
