// App-level presentation preferences (theme + reduced motion + onboarding
// progress). Separate from the game save: these are device settings, persisted
// to localStorage and applied to the document root so the CSS themes/motion
// switch instantly. Tutorial "seen" hints live here too, so the player learns
// the game once across all their runs (CK3-style), not once per save.

import { create } from "zustand";

export type Theme = "dark" | "light";

interface Prefs {
  theme: Theme;
  reduceMotion: boolean;
  /** Master switch for the contextual onboarding hints. */
  tutorialEnabled: boolean;
  /** Hint ids the player has already dismissed (fire-once). */
  seenHints: string[];
  /** Whether the narrative right rail is shown (pure-data players can hide it). */
  railOpen: boolean;
  toggleTheme: () => void;
  setReduceMotion: (b: boolean) => void;
  markHintSeen: (id: string) => void;
  setTutorialEnabled: (b: boolean) => void;
  /** Re-arm every hint (and ensure tips are on) — "replay the tutorial". */
  resetHints: () => void;
  toggleRail: () => void;
}

const KEY = "moonshot.prefs";

interface Stored {
  theme: Theme;
  reduceMotion: boolean;
  tutorialEnabled: boolean;
  seenHints: string[];
  railOpen: boolean;
}

function osReduceMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function load(): Stored {
  // Default to the OS reduced-motion preference (UI_LANGUAGE §2), so the JS
  // motion layer (market tape, count tweens) honors it like the CSS does.
  const fallback: Stored = { theme: "dark", reduceMotion: osReduceMotion(), tutorialEnabled: true, seenHints: [], railOpen: true };
  if (typeof localStorage === "undefined") return fallback;
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Stored>) };
  } catch {
    return fallback;
  }
}

function apply(p: Stored): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  root.dataset.reduceMotion = p.reduceMotion ? "on" : "off";
}

function persist(p: Stored): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(p));
  apply(p);
}

const initial = load();
apply(initial); // set the default (dark) before first paint

export const usePrefs = create<Prefs>((set, get) => {
  const snapshot = (): Stored => {
    const s = get();
    return { theme: s.theme, reduceMotion: s.reduceMotion, tutorialEnabled: s.tutorialEnabled, seenHints: s.seenHints, railOpen: s.railOpen };
  };
  const commit = (patch: Partial<Stored>) => {
    persist({ ...snapshot(), ...patch });
    set(patch);
  };
  return {
    theme: initial.theme,
    reduceMotion: initial.reduceMotion,
    tutorialEnabled: initial.tutorialEnabled,
    seenHints: initial.seenHints,
    railOpen: initial.railOpen,
    toggleTheme: () => commit({ theme: get().theme === "dark" ? "light" : "dark" }),
    setReduceMotion: (reduceMotion) => commit({ reduceMotion }),
    markHintSeen: (id) => {
      if (get().seenHints.includes(id)) return;
      commit({ seenHints: [...get().seenHints, id] });
    },
    setTutorialEnabled: (tutorialEnabled) => commit({ tutorialEnabled }),
    resetHints: () => commit({ seenHints: [], tutorialEnabled: true }),
    toggleRail: () => commit({ railOpen: !get().railOpen }),
  };
});
