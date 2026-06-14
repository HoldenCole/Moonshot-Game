// App-level presentation preferences (theme + reduced motion). Separate from
// the game save: these are device settings, persisted to localStorage and
// applied to the document root so the CSS themes/motion switch instantly.

import { create } from "zustand";

export type Theme = "dark" | "light";

interface Prefs {
  theme: Theme;
  reduceMotion: boolean;
  toggleTheme: () => void;
  setReduceMotion: (b: boolean) => void;
}

const KEY = "moonshot.prefs";

interface Stored {
  theme: Theme;
  reduceMotion: boolean;
}

function load(): Stored {
  const fallback: Stored = { theme: "dark", reduceMotion: false };
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

export const usePrefs = create<Prefs>((set, get) => ({
  theme: initial.theme,
  reduceMotion: initial.reduceMotion,
  toggleTheme: () => {
    const theme: Theme = get().theme === "dark" ? "light" : "dark";
    persist({ theme, reduceMotion: get().reduceMotion });
    set({ theme });
  },
  setReduceMotion: (reduceMotion) => {
    persist({ theme: get().theme, reduceMotion });
    set({ reduceMotion });
  },
}));
