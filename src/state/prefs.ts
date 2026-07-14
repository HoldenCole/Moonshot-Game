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
  /** Master switch for the synthesized UI sound. */
  soundOn: boolean;
  /** Master volume for UI sound (0–1). */
  volume: number;
  /** Master switch for the contextual onboarding hints. */
  tutorialEnabled: boolean;
  /** Hint ids the player has already dismissed (fire-once). */
  seenHints: string[];
  /** Whether the narrative right rail is shown (pure-data players can hide it). */
  railOpen: boolean;
  /** Current beat of the guided first-run tutorial (0-based index). */
  guidedStep: number;
  /** Whether the guided first-run tutorial has been completed or skipped. */
  guidedDone: boolean;
  /** Player-chosen order of the dashboard panels (empty = canonical order). */
  dashboardOrder: string[];
  /** Dashboard panel ids the player has hidden. */
  dashboardHidden: string[];
  toggleTheme: () => void;
  setReduceMotion: (b: boolean) => void;
  setSoundOn: (b: boolean) => void;
  setVolume: (v: number) => void;
  markHintSeen: (id: string) => void;
  setTutorialEnabled: (b: boolean) => void;
  /** Re-arm every hint + replay the guided tour — "replay the tutorial". */
  resetHints: () => void;
  toggleRail: () => void;
  /** Move the guided tour to the next beat. */
  advanceGuided: () => void;
  /** Jump the guided tour to a specific beat (used to skip unreachable beats). */
  setGuidedStep: (n: number) => void;
  /** End the guided tour (completed or skipped) and hand off to ambient hints. */
  finishGuided: () => void;
  /** Persist a new dashboard panel order. */
  setDashboardOrder: (ids: string[]) => void;
  /** Show/hide a dashboard panel. */
  toggleDashboardPanel: (id: string) => void;
  /** Restore the dashboard to its default order with every panel shown. */
  resetDashboard: () => void;
}

const KEY = "moonshot.prefs";

interface Stored {
  theme: Theme;
  reduceMotion: boolean;
  soundOn: boolean;
  volume: number;
  tutorialEnabled: boolean;
  seenHints: string[];
  railOpen: boolean;
  guidedStep: number;
  guidedDone: boolean;
  dashboardOrder: string[];
  dashboardHidden: string[];
}

function osReduceMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function load(): Stored {
  // Default to the OS reduced-motion preference (UI_LANGUAGE §2), so the JS
  // motion layer (market tape, count tweens) honors it like the CSS does.
  const fallback: Stored = { theme: "dark", reduceMotion: osReduceMotion(), soundOn: true, volume: 0.5, tutorialEnabled: true, seenHints: [], railOpen: true, guidedStep: 0, guidedDone: false, dashboardOrder: [], dashboardHidden: [] };
  if (typeof localStorage === "undefined") return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Stored>;
    const merged = { ...fallback, ...parsed };
    // Only a brand-new install should drop into the guided first-run tour.
    // An existing player who's already dismissed any hint is presumed to know
    // the game, so the tour starts already-completed for them.
    if (parsed.guidedDone === undefined) merged.guidedDone = (merged.seenHints?.length ?? 0) > 0;
    return merged;
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
    return { theme: s.theme, reduceMotion: s.reduceMotion, soundOn: s.soundOn, volume: s.volume, tutorialEnabled: s.tutorialEnabled, seenHints: s.seenHints, railOpen: s.railOpen, guidedStep: s.guidedStep, guidedDone: s.guidedDone, dashboardOrder: s.dashboardOrder, dashboardHidden: s.dashboardHidden };
  };
  const commit = (patch: Partial<Stored>) => {
    persist({ ...snapshot(), ...patch });
    set(patch);
  };
  return {
    theme: initial.theme,
    reduceMotion: initial.reduceMotion,
    soundOn: initial.soundOn,
    volume: initial.volume,
    tutorialEnabled: initial.tutorialEnabled,
    seenHints: initial.seenHints,
    railOpen: initial.railOpen,
    guidedStep: initial.guidedStep,
    guidedDone: initial.guidedDone,
    dashboardOrder: initial.dashboardOrder,
    dashboardHidden: initial.dashboardHidden,
    toggleTheme: () => commit({ theme: get().theme === "dark" ? "light" : "dark" }),
    setReduceMotion: (reduceMotion) => commit({ reduceMotion }),
    setSoundOn: (soundOn) => commit({ soundOn }),
    setVolume: (volume) => commit({ volume: Math.min(1, Math.max(0, volume)) }),
    markHintSeen: (id) => {
      if (get().seenHints.includes(id)) return;
      commit({ seenHints: [...get().seenHints, id] });
    },
    setTutorialEnabled: (tutorialEnabled) => commit({ tutorialEnabled }),
    // "Replay the tutorial": re-arm the ambient hints and restart the guided tour.
    resetHints: () => commit({ seenHints: [], tutorialEnabled: true, guidedStep: 0, guidedDone: false }),
    toggleRail: () => commit({ railOpen: !get().railOpen }),
    advanceGuided: () => commit({ guidedStep: get().guidedStep + 1 }),
    setGuidedStep: (guidedStep) => commit({ guidedStep }),
    finishGuided: () => commit({ guidedDone: true }),
    setDashboardOrder: (dashboardOrder) => commit({ dashboardOrder }),
    toggleDashboardPanel: (id) => {
      const hidden = get().dashboardHidden;
      commit({ dashboardHidden: hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id] });
    },
    resetDashboard: () => commit({ dashboardOrder: [], dashboardHidden: [] }),
  };
});
