// ============================================================================
// TitleScreen — the front door. The signature is THE TRAJECTORY: the game's
// whole arc (Garage → Sovereign) drawn as one gradient line through the value
// colors. A boot splash beats first, then the wordmark, the arc, and a quiet
// menu: Continue (live save card) / Found a company / Settings.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { saveSummary } from "@/state/persist";
import { formatMoney } from "@/engine/format";
import { play } from "@/audio/sfx";
import pkg from "../../../package.json";

export function TitleScreen() {
  const setScreen = useUi((s) => s.setScreen);
  const setSettingsOpen = useUi((s) => s.setSettingsOpen);
  const continueGame = useGame((s) => s.continueGame);
  const content = useGame((s) => s.content);
  const [splash, setSplash] = useState(true);

  const save = saveSummary();
  const skyRef = useRef<HTMLDivElement>(null);

  // The boot beat: a breath of black with the studio line, then the title.
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1350);
    return () => clearTimeout(t);
  }, []);

  // A starfield thickening toward the arc's end — hand-placed once.
  useEffect(() => {
    const sky = skyRef.current;
    if (!sky || sky.childElementCount) return;
    for (let i = 0; i < 90; i++) {
      const s = document.createElement("i");
      const t = Math.pow(Math.random(), 0.55);
      s.style.left = `${34 + t * 64 + Math.random() * 4}%`;
      s.style.top = `${Math.random() * (1 - t) * 55 + 2}%`;
      s.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
      sky.appendChild(s);
    }
  }, [splash]);

  if (splash) {
    return (
      <div className="ts-splash" onClick={() => setSplash(false)}>
        <div className="ts-splash__mark">MOONSHOT INC</div>
        <div className="ts-splash__sub">a frontier-capital simulation</div>
      </div>
    );
  }

  const stats = {
    programs: Object.keys(content.late.researchNodes).length,
    megaprojects: Object.keys(content.late.megaprojects).length,
    rivals: Object.keys(content.late.rivalDefs).length,
  };

  return (
    <div className="ts">
      <div className="ts__traj" aria-hidden>
        <svg viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="ts-arc" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="38%" stopColor="var(--up)" />
              <stop offset="72%" stopColor="#bd9dff" />
              <stop offset="100%" stopColor="#e8c76a" />
            </linearGradient>
          </defs>
          <path className="ts__ghost" d="M 120 760 C 560 745, 900 640, 1090 470 S 1330 170, 1400 88" />
          <path className="ts__path" d="M 120 760 C 560 745, 900 640, 1090 470 S 1330 170, 1400 88" />
          {[
            { x: 240, y: 752, c: "var(--accent)", n: "The Garage", w: "wk 0", cls: "ts-era--1", above: true, end: false },
            { x: 760, y: 672, c: "var(--up)", n: "The Scale-Up", w: "$2B", cls: "ts-era--2", above: false, end: false },
            { x: 1105, y: 452, c: "#bd9dff", n: "The Titan Age", w: "$15B", cls: "ts-era--3", above: true, end: false },
            { x: 1382, y: 106, c: "#e8c76a", n: "The Sovereign Era", w: "power 5+", cls: "ts-era--4", above: false, end: true },
          ].map((e) => (
            <g key={e.n} className={`ts-era ${e.cls}`}>
              <circle cx={e.x} cy={e.y} r={e.end ? 5 : 4} stroke={e.c} />
              <text x={e.end ? e.x - 52 : e.x} y={e.above || e.end ? e.y - (e.end ? 18 : 24) : e.y + 26} textAnchor={e.end ? "end" : "middle"}>
                {e.n}
              </text>
              <text className="ts-era__week" x={e.end ? e.x - 52 : e.x} y={e.above || e.end ? e.y - (e.end ? 32 : 38) : e.y + 40} textAnchor={e.end ? "end" : "middle"}>
                {e.w}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="ts__sky" ref={skyRef} aria-hidden />

      <div className="ts__col">
        <div className="ts__wordmark">
          <div className="ts__main">MOONSHOT</div>
          <div className="ts__row">
            <div className="ts__main ts__main--inc">INC</div>
            <div className="ts__sub">FRONTIER · CAPITAL · POWER</div>
          </div>
          <p className="ts__tag">
            Found a frontier-tech company and take it from <b>a garage</b> to <b>more powerful than governments</b> — if the money, the
            rivals, and the physics let you.
          </p>
        </div>

        <nav className="ts__menu" aria-label="Main menu">
          {save && (
            <button
              className="ts-continue"
              onClick={() => {
                play("click");
                continueGame();
                setScreen("game");
              }}
            >
              <div>
                <div className="ts-continue__k">Continue the run</div>
                <div className="ts-continue__co">{save.company}</div>
                <div className="ts-continue__meta">
                  Week {save.week} · <b>{formatMoney(save.netWorth)}</b> net worth
                </div>
              </div>
              <div className="ts-continue__arrow">›</div>
            </button>
          )}
          <button
            className="ts-row ts-row--primary"
            onClick={() => {
              play("click");
              setScreen("newgame");
            }}
            data-guide="title-new-game"
          >
            <span className="ts-row__tick" />
            {save ? "Found a new company" : "Found a company"}
            <span className="ts-row__hint">the arc starts at wk 0</span>
          </button>
          <button
            className="ts-row ts-row--quiet"
            onClick={() => {
              play("open");
              setSettingsOpen(true);
            }}
          >
            <span className="ts-row__tick" />
            Settings
          </button>
        </nav>
      </div>

      <div className="ts__foot">
        <span>
          <b>Moonshot Inc</b> · a frontier-capital simulation
        </span>
        <span>
          v{pkg.version} · <b>{stats.programs}</b> programs · <b>{stats.megaprojects}</b> megaprojects · <b>{stats.rivals}</b> rival titans
        </span>
      </div>
    </div>
  );
}
