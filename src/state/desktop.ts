// Desktop (Tauri) wiring: the native menu emits `menu:*` events; here we listen
// and drive the same store actions the UI uses. No-op on the web build.

import { listen } from "@tauri-apps/api/event";
import { useGame } from "./store";
import { useUi } from "./ui";
import { saveGame } from "./persist";

function underTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function setupDesktopMenu(): Promise<void> {
  if (!underTauri()) return;
  // New Game → back to the setup screen (the existing save stays on disk, so the
  // Continue banner still offers the in-progress run).
  await listen("menu:new-game", () => useGame.getState().resetGame());
  // Save → flush the current run now (autosave is debounced).
  await listen("menu:save", () => {
    const game = useGame.getState().game;
    if (game) saveGame(game);
  });
  await listen("menu:about", () => useUi.getState().setView("about"));
  await listen("menu:reload", () => window.location.reload());
}
