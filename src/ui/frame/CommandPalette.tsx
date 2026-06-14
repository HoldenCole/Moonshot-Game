import { useMemo, useRef, useState } from "react";
import { useUi } from "@/state/ui";
import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import { useModalA11y } from "@/ui/components/useModalA11y";
import { Icon, type IconName } from "@/ui/components/Icon";
import { WEEKS_PER_MONTH } from "@/engine/tick";
import type { View } from "./types";

interface Cmd {
  id: string;
  label: string;
  group: string;
  icon?: IconName;
  run: () => void;
}

/** The ⌘K command palette: fuzzy-ish jump to any view, advance time, trigger an
 *  exit, or flip a setting — keyboard-first. Mounts only while open. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  return open ? <Palette /> : null;
}

function Palette() {
  const setOpen = useUi((s) => s.setPaletteOpen);
  const setView = useUi((s) => s.setView);
  const advance = useGame((s) => s.advance);
  const game = useGame((s) => s.game);
  const openIpo = useGame((s) => s.openIpo);
  const exploreSale = useGame((s) => s.exploreSale);
  const theme = usePrefs((s) => s.theme);
  const toggleTheme = usePrefs((s) => s.toggleTheme);
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const setReduceMotion = usePrefs((s) => s.setReduceMotion);
  const railOpen = usePrefs((s) => s.railOpen);
  const toggleRail = usePrefs((s) => s.toggleRail);
  const tutorialEnabled = usePrefs((s) => s.tutorialEnabled);
  const setTutorialEnabled = usePrefs((s) => s.setTutorialEnabled);
  const resetHints = usePrefs((s) => s.resetHints);

  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const close = () => setOpen(false);
  useModalA11y(ref, { onClose: close });

  const cmds: Cmd[] = useMemo(() => {
    const go = (v: View) => () => {
      setView(v);
      close();
    };
    const time = (mode: Parameters<typeof advance>[0]) => () => {
      advance(mode);
      close();
    };
    const nav: Cmd[] = [
      { id: "dashboard", label: "Go to Dashboard", group: "Navigate", icon: "dashboard", run: go("dashboard") },
      { id: "captable", label: "Go to Cap Table", group: "Navigate", icon: "captable", run: go("captable") },
      { id: "fundraising", label: "Go to Fundraising", group: "Navigate", icon: "fundraising", run: go("fundraising") },
      { id: "market", label: "Go to Market", group: "Navigate", icon: "market", run: go("market") },
      { id: "world", label: "Go to World", group: "Navigate", icon: "world", run: go("world") },
      { id: "team", label: "Go to Team", group: "Navigate", icon: "team", run: go("team") },
      { id: "about", label: "Go to About", group: "Navigate", icon: "info", run: go("about") },
    ];
    const tcmds: Cmd[] = [
      { id: "adv-week", label: "Advance one week", group: "Time", icon: "chevron-right", run: time({ type: "weeks", weeks: 1 }) },
      { id: "adv-month", label: "Advance one month", group: "Time", icon: "chevron-right", run: time({ type: "weeks", weeks: Math.round(WEEKS_PER_MONTH) }) },
      { id: "adv-next", label: "Advance to next decision", group: "Time", icon: "chevron-right", run: time({ type: "nextDecision" }) },
    ];
    const exits: Cmd[] = game
      ? [
          { id: "ipo", label: "Go public (IPO)", group: "Exits", icon: "fundraising", run: () => { openIpo(); close(); } },
          { id: "sale", label: "Explore a sale", group: "Exits", icon: "captable", run: () => { exploreSale(); close(); } },
        ]
      : [];
    const settings: Cmd[] = [
      { id: "theme", label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme", group: "Settings", icon: theme === "dark" ? "sun" : "moon", run: () => { toggleTheme(); close(); } },
      { id: "motion", label: reduceMotion ? "Enable motion" : "Reduce motion", group: "Settings", icon: "motion", run: () => { setReduceMotion(!reduceMotion); close(); } },
      { id: "rail", label: railOpen ? "Hide narrative rail" : "Show narrative rail", group: "Settings", icon: "info", run: () => { toggleRail(); close(); } },
      { id: "tips", label: tutorialEnabled ? "Turn off tips" : "Replay tips", group: "Settings", icon: "info", run: () => { tutorialEnabled ? setTutorialEnabled(false) : resetHints(); close(); } },
    ];
    return [...nav, ...tcmds, ...exits, ...settings];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, theme, reduceMotion, railOpen, tutorialEnabled]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? cmds.filter((c) => c.label.toLowerCase().includes(needle)) : cmds;
  }, [cmds, q]);

  const active = Math.min(sel, Math.max(0, filtered.length - 1));

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel(Math.min(filtered.length - 1, active + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel(Math.max(0, active - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  }

  return (
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={ref}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <input
          className="palette__input"
          placeholder="Type a command…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          autoFocus
        />
        <ul className="palette__list">
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                className={`palette__item${i === active ? " is-sel" : ""}`}
                onMouseEnter={() => setSel(i)}
                onClick={c.run}
              >
                {c.icon && <Icon name={c.icon} size={15} />}
                <span className="palette__cmd-label">{c.label}</span>
                <span className="palette__group">{c.group}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="palette__empty">No commands match “{q.trim()}”.</li>}
        </ul>
        <div className="palette__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> run</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
