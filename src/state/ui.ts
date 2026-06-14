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
}

export const useUi = create<UiStore>((set) => ({
  view: "dashboard",
  setView: (view) => set({ view }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
