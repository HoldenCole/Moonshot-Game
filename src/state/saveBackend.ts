// Where saves physically live. On the desktop (Tauri) build, saves are a real
// JSON file in the OS app-data directory — so Steam Cloud can sync them and the
// player can back them up — read into memory once at boot so the rest of the
// save layer can stay synchronous. On the web build, it's localStorage.

import { invoke } from "@tauri-apps/api/core";

const KEY = "moonshot.save";

/** True only inside the Tauri webview. Guarded so it's safe under Node (tests). */
function underTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// The desktop save, mirrored in memory so reads are synchronous after boot.
let fileCache: string | null = null;

/** Load the on-disk save into the cache (desktop only). Call once before the
 *  first render; resolves immediately on web. */
export async function initSaveBackend(): Promise<void> {
  if (!underTauri()) return;
  try {
    fileCache = await invoke<string | null>("load_game");
  } catch {
    fileCache = null;
  }
}

export const saveBackend = {
  read(): string | null {
    if (underTauri()) return fileCache;
    return typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  },
  write(contents: string): void {
    if (underTauri()) {
      fileCache = contents;
      void invoke("save_game", { contents }).catch(() => {});
      return;
    }
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, contents);
  },
  clear(): void {
    if (underTauri()) {
      fileCache = null;
      void invoke("clear_save").catch(() => {});
      return;
    }
    if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
  },
};
