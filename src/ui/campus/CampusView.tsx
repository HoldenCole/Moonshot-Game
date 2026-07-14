// ============================================================================
// CampusView — the game world as a place. A hand-drawn SVG dusk scene of your
// company's campus: the office tower grows with headcount, the data center
// racks up with compute, a rocket sits on the pad while a bet builds (and
// launches when it ships), the market is the skyline, the world is the sky.
// Every structure is clickable and routes to its management surface.
// ============================================================================
import type { ReactNode } from "react";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { ActiveDecisions } from "@/ui/decisions/ActiveDecisions";

// Deterministic pseudo-random (stable scene between renders/screenshots).
function rnd(i: number, salt = 0): number {
  let h = (i * 2654435761) ^ (salt * 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const GROUND = 630;

/** A small HUD chip (label + optional value) floating above a structure. */
function Chip({ x, y, label, value, accent }: { x: number; y: number; label: string; value?: string; accent?: string }) {
  const text = value ? `${label} · ${value}` : label;
  const w = 14 + text.length * 6.4;
  return (
    <g className="cmp-chip" transform={`translate(${x - w / 2}, ${y})`}>
      <rect width={w} height={20} rx={10} className="cmp-chip__bg" />
      {accent && <circle cx={11} cy={10} r={2.6} fill={accent} />}
      <text x={accent ? 19 : w / 2} y={13.5} textAnchor={accent ? "start" : "middle"} className="cmp-chip__text">
        {text}
      </text>
    </g>
  );
}

/** A clickable structure group: hover glow + keyboard access + navigation. */
function Hot({ label, onGo, children }: { label: string; onGo: () => void; children: ReactNode }) {
  return (
    <g
      className="cmp-hot"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onGo}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onGo();
        }
      }}
    >
      {children}
    </g>
  );
}

/** Window grid for a building face; lit fraction scales with activity. */
function Windows({ x, y, cols, rows, cw, ch, gapX, gapY, litPct, salt }: { x: number; y: number; cols: number; rows: number; cw: number; ch: number; gapX: number; gapY: number; litPct: number; salt: number }) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = rnd(r * 31 + c * 7 + 3, salt) * 100 < litPct;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * (cw + gapX)}
          y={y + r * (ch + gapY)}
          width={cw}
          height={ch}
          rx={1.5}
          className={lit ? "cmp-win cmp-win--lit" : "cmp-win"}
          style={lit ? { animationDelay: `${(rnd(r * 13 + c, salt + 5) * 7).toFixed(1)}s` } : undefined}
        />,
      );
    }
  }
  return <>{cells}</>;
}

export function CampusView() {
  const game = useGame((s) => s.game);
  const setView = useUi((s) => s.setView);
  if (!game) return null;

  const c = game.company;
  const week = game.clock.week;
  const industry = c.industry;
  const hype = game.world.hype[industry] ?? 55;
  const phase = game.world.macroPhase;

  // ── Live state the scene is drawn from ──
  const headcount = c.financials.headcount;
  const floors = Math.min(9, 3 + Math.ceil(headcount / 8));
  const litPct = Math.min(85, 25 + headcount * 3);
  const clusters = Object.values(c.products?.capacity.owned ?? {}).reduce((s, n) => s + n, 0);
  const capBuilding = (c.products?.capacity.builds_in_progress.length ?? 0) > 0;
  const bets = c.products?.bets ?? [];
  const nextShip = bets.reduce((m, b) => Math.min(m, b.weeks_left), Infinity);
  const launching = game.log.some((e) => e.week >= week - 1 && e.kind === "company" && e.headline.startsWith("Shipped"));
  const liveProducts = c.products?.products.filter((p) => p.state !== "declining").length ?? 0;
  const late = game.late;

  // Sky mood follows the macro cycle.
  const cloudOpacity = { expansion: 0.35, peak: 0.3, recovery: 0.45, contraction: 0.6, trough: 0.7 }[phase] ?? 0.4;
  const starDim = phase === "contraction" || phase === "trough" ? 0.55 : 1;

  const towerX = 170;
  const towerW = 170;
  const towerH = floors * 34;
  const towerY = GROUND - towerH;

  return (
    <div className="workspace-scroll campus-scroll">
      <ActiveDecisions onNavigate={setView} />
      <section className="panel panel--flush campus-panel">
        <svg viewBox="0 0 1200 720" className="campus-svg">
          <defs>
            <linearGradient id="cmp-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#070a12" />
              <stop offset="68%" stopColor="#0d1322" />
              <stop offset="100%" stopColor="#182036" />
            </linearGradient>
            <linearGradient id="cmp-aurora" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#46d6c8" stopOpacity="0" />
              <stop offset="35%" stopColor="#46d6c8" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#6f9cff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#bd9dff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cmp-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b2740" />
              <stop offset="100%" stopColor="#101827" />
            </linearGradient>
            <linearGradient id="cmp-pad-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0b54e" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f0b54e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cmp-fog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#101626" stopOpacity="0" />
              <stop offset="100%" stopColor="#131a2c" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* ── Sky ── */}
          <rect width="1200" height="720" fill="url(#cmp-sky)" />
          {/* a faint aurora ribbon, drifting */}
          <path d="M -40 150 C 260 96, 560 190, 840 128 S 1180 92, 1260 130" fill="none" stroke="url(#cmp-aurora)" strokeWidth={38} opacity={0.09} className="cmp-aurora" />
          <path d="M -40 190 C 300 140, 600 226, 900 160 S 1200 130, 1260 168" fill="none" stroke="url(#cmp-aurora)" strokeWidth={20} opacity={0.07} className="cmp-aurora cmp-aurora--b" />
          <g opacity={starDim}>
            {Array.from({ length: 72 }, (_, i) => (
              <circle
                key={i}
                cx={12 + rnd(i, 1) * 1176}
                cy={10 + rnd(i, 2) * 400}
                r={0.6 + rnd(i, 3) * 0.9}
                className="cmp-star"
                style={{ animationDelay: `${(rnd(i, 4) * 6).toFixed(1)}s` }}
              />
            ))}
          </g>
          {/* a shooting star, every once in a while */}
          <g className="cmp-shooting">
            <line x1={0} y1={0} x2={34} y2={12} stroke="#cdd8ec" strokeWidth={1.6} strokeLinecap="round" />
          </g>
          {/* a tiny satellite on a slow pass */}
          <g className="cmp-sat">
            <rect x={-4} y={-3} width={8} height={6} rx={1} fill="#9fb0cc" />
            <rect x={-16} y={-1.5} width={9} height={3} fill="#46d6c8" opacity={0.75} />
            <rect x={7} y={-1.5} width={9} height={3} fill="#46d6c8" opacity={0.75} />
            <circle cx={0} cy={0} r={1.2} className="cmp-beacon" />
          </g>

          {/* The world, readable in the sky — the moon routes to the World view. */}
          <Hot label="The World — macro forces" onGo={() => setView("world")}>
            <circle cx={1076} cy={82} r={26} fill="#dfe6f3" opacity={0.92} />
            <circle cx={1066} cy={74} r={22} fill="#0d1322" />
            <Chip x={1076} y={118} label="THE WORLD" />
          </Hot>

          {/* Drifting clouds (macro mood sets their weight). */}
          <g className="cmp-cloud cmp-cloud--a" opacity={cloudOpacity}>
            <ellipse cx={220} cy={104} rx={95} ry={17} fill="#1b2233" />
            <ellipse cx={286} cy={92} rx={60} ry={13} fill="#1b2233" />
          </g>
          <g className="cmp-cloud cmp-cloud--b" opacity={cloudOpacity * 0.85}>
            <ellipse cx={700} cy={64} rx={120} ry={15} fill="#161d2c" />
            <ellipse cx={640} cy={54} rx={55} ry={11} fill="#161d2c" />
          </g>

          {/* ── Megaproject on the horizon (late game) ── */}
          {late && Object.keys(late.slice.megas.builds).length + late.slice.megas.active.length > 0 && (
            <g opacity={0.85}>
              <path d={`M 1030 ${GROUND - 140} A 96 96 0 0 1 1192 ${GROUND - 140}`} fill="none" stroke="#232c44" strokeWidth={7} />
              <line x1={1110} y1={GROUND - 236} x2={1110} y2={GROUND - 140} stroke="#232c44" strokeWidth={4} />
              <line x1={1110} y1={GROUND - 226} x2={1168} y2={GROUND - 208} stroke="#232c44" strokeWidth={3} />
              <circle cx={1110} cy={GROUND - 234} r={3} className="cmp-beacon" />
            </g>
          )}

          {/* ── The Market: downtown skyline (clickable, receded) ── */}
          <Hot label="The Market — every rival, priced live" onGo={() => setView("market")}>
            <g opacity={0.82}>
              {[
                [0, 386, 74], [82, 344, 66], [156, 408, 58], [222, 368, 70], [300, 422, 62],
                [456, 392, 60], [524, 356, 72], [604, 416, 64], [676, 374, 70],
                [754, 404, 58], [820, 340, 74], [902, 396, 62], [972, 362, 70], [1050, 408, 60], [1118, 382, 80],
              ].map(([bx, by, bw], i) => (
                <g key={i}>
                  <rect x={bx} y={by} width={bw} height={GROUND - (by as number)} fill="#0f131d" />
                  <Windows x={(bx as number) + 8} y={(by as number) + 10} cols={Math.floor(((bw as number) - 14) / 13)} rows={Math.floor((GROUND - (by as number) - 18) / 22)} cw={7} ch={9} gapX={6} gapY={13} litPct={8} salt={i + 40} />
                </g>
              ))}
              {/* The exchange tower — a ticker pulse at its crown. */}
              <rect x={370} y={326} width={78} height={GROUND - 326} fill="#111726" />
              <Windows x={378} y={338} cols={4} rows={Math.floor((GROUND - 326 - 18) / 22)} cw={7} ch={9} gapX={6} gapY={13} litPct={10} salt={72} />
              <rect x={382} y={310} width={54} height={16} rx={3} fill="#0e1420" stroke="#22304e" strokeWidth={1} />
              <polyline points="388,320 396,316 402,319 410,313 418,317 428,311" fill="none" stroke="#3ad29a" strokeWidth={1.6} className="cmp-ticker" />
              <Chip x={409} y={282} label="THE MARKET" accent="#3ad29a" />
            </g>
          </Hot>

          {/* Atmospheric fog recedes downtown behind the campus. */}
          <rect x={0} y={GROUND - 170} width={1200} height={170} fill="url(#cmp-fog)" />

          {/* ── Ground + road ── */}
          <rect x={0} y={GROUND} width={1200} height={90} fill="#0c1018" />
          <rect x={0} y={GROUND + 22} width={1200} height={26} fill="#10151f" />
          {Array.from({ length: 24 }, (_, i) => (
            <rect key={i} x={i * 52} y={GROUND + 34} width={22} height={2} rx={1} fill="#232c40" />
          ))}
          <g className="cmp-car cmp-car--a">
            <rect x={0} y={GROUND + 24} width={26} height={9} rx={4} fill="#1d2637" />
            <circle cx={26} cy={GROUND + 28.5} r={2.4} fill="#ffd98a" opacity={0.9} />
          </g>
          <g className="cmp-car cmp-car--b">
            <rect x={0} y={GROUND + 38} width={26} height={9} rx={4} fill="#1a2130" />
            <circle cx={0} cy={GROUND + 42.5} r={2.4} fill="#f4716f" opacity={0.8} />
          </g>

          {/* ── Capital Row: the bank (fundraising) ── */}
          <Hot label="Capital Row — raise money" onGo={() => setView("fundraising")}>
            <g>
              <rect x={34} y={GROUND - 92} width={104} height={92} fill="#151b2a" />
              <rect x={30} y={GROUND - 100} width={112} height={10} fill="#1c2436" />
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={44 + i * 24} y={GROUND - 84} width={9} height={76} fill="#0e1420" />
              ))}
              <rect x={62} y={GROUND - 30} width={48} height={30} fill="#0b0f18" />
              <rect x={64} y={GROUND - 28} width={44} height={26} fill="#26314b" opacity={0.5} />
              <text x={86} y={GROUND - 106} textAnchor="middle" className="cmp-sign" fill="#3ad29a">
                $
              </text>
              <Chip x={86} y={GROUND - 146} label="CAPITAL ROW" accent="#3ad29a" />
            </g>
          </Hot>

          {/* ── HQ office tower (Team) ── */}
          <Hot label="Headquarters — your team" onGo={() => setView("team")}>
            <g>
              {/* campus ground glow */}
              <ellipse cx={towerX + towerW / 2} cy={GROUND} rx={150} ry={16} fill={c.color} opacity={0.07} />
              {/* antenna + aviation light */}
              <line x1={towerX + towerW / 2} y1={towerY - 26} x2={towerX + towerW / 2} y2={towerY} stroke="#2a3550" strokeWidth={3} />
              <circle cx={towerX + towerW / 2} cy={towerY - 28} r={3} className="cmp-beacon" />
              {/* company sign */}
              <text
                x={towerX + towerW / 2}
                y={towerY - 40}
                textAnchor="middle"
                className="cmp-sign cmp-sign--company"
                fill={c.color}
                style={{ filter: `drop-shadow(0 0 8px ${c.color})` }}
              >
                {c.name.toUpperCase()}
              </text>
              {/* body */}
              <rect x={towerX} y={towerY} width={towerW} height={towerH} fill="#1a2136" />
              <rect x={towerX} y={towerY} width={towerW} height={5} fill="#2a3552" />
              <rect x={towerX + 6} y={towerY + 5} width={towerW - 12} height={towerH - 5} fill="url(#cmp-glass)" opacity={0.4} />
              <Windows x={towerX + 14} y={towerY + 13} cols={5} rows={floors} cw={24} ch={14} gapX={4.5} gapY={20} litPct={litPct} salt={9} />
              {/* entrance */}
              <rect x={towerX + towerW / 2 - 20} y={GROUND - 26} width={40} height={26} fill="#0b0f18" />
              <rect x={towerX + towerW / 2 - 17} y={GROUND - 23} width={34} height={23} fill="#ffd98a" opacity={0.18} />
              <rect x={towerX + towerW / 2 - 26} y={GROUND - 30} width={52} height={5} rx={2} fill="#232c44" />
              <Chip x={towerX + towerW / 2} y={towerY - 76} label="HEADQUARTERS" value={`${headcount} aboard`} accent={c.color} />
            </g>
          </Hot>

          {/* ── R&D lab wing (Products & R&D) ── */}
          <Hot label="R&D Lab — products and research" onGo={() => setView("dashboard")}>
            <g>
              <rect x={towerX + towerW + 18} y={GROUND - 66} width={126} height={66} fill="#141a2b" />
              <path d={`M ${towerX + towerW + 18} ${GROUND - 66} L ${towerX + towerW + 62} ${GROUND - 96} L ${towerX + towerW + 144} ${GROUND - 96} L ${towerX + towerW + 144} ${GROUND - 66} Z`} fill="#1a2338" />
              <path d={`M ${towerX + towerW + 26} ${GROUND - 70} L ${towerX + towerW + 64} ${GROUND - 92} L ${towerX + towerW + 138} ${GROUND - 92} L ${towerX + towerW + 138} ${GROUND - 70} Z`} fill="#46d6c8" opacity={0.16} className="cmp-lab-glow" />
              <Windows x={towerX + towerW + 28} y={GROUND - 54} cols={5} rows={2} cw={16} ch={11} gapX={6} gapY={9} litPct={60} salt={21} />
              {/* roof dish, tilted at the sky */}
              <g transform={`translate(${towerX + towerW + 126}, ${GROUND - 96})`}>
                <line x1={0} y1={0} x2={0} y2={8} stroke="#2e3a58" strokeWidth={2.5} />
                <ellipse cx={0} cy={-3} rx={10} ry={4.5} fill="#26314b" transform="rotate(-32)" />
                <circle cx={-4} cy={-7} r={1.4} fill="#46d6c8" opacity={0.9} />
              </g>
              <Chip
                x={towerX + towerW + 82}
                y={GROUND - 132}
                label="R&D LAB"
                value={liveProducts > 0 ? `${liveProducts} live` : bets.length > 0 ? "building" : "idle"}
                accent="#46d6c8"
              />
            </g>
          </Hot>

          {/* ── Capitol (late game: standing & power) ── */}
          {late && (
            <Hot label="The Capitol — power, rivals, legacies" onGo={() => setView("standing")}>
              <g>
                <rect x={560} y={GROUND - 74} width={118} height={74} fill="#151b2a" />
                <path d="M 560 396 L 619 380 L 678 396 Z" fill="#1c2436" />
                <circle cx={619} cy={GROUND - 96} r={17} fill="#1c2436" />
                <circle cx={619} cy={GROUND - 112} r={2.8} fill="#e8c76a" className="cmp-beacon cmp-beacon--gold" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <rect key={i} x={572 + i * 20} y={GROUND - 62} width={8} height={62} fill="#0e1420" />
                ))}
                <Chip x={619} y={GROUND - 148} label="CAPITOL" value={`power ${late.slice.powerAxis.power.toFixed(0)}`} accent="#bd9dff" />
              </g>
            </Hot>
          )}

          {/* ── Industry district ── */}
          {industry === "ai" ? (
            <Hot label="Data center — compute capacity" onGo={() => setView("dashboard")}>
              <g style={hype >= 70 ? { filter: "drop-shadow(0 0 18px rgba(111,156,255,0.35))" } : undefined}>
                <ellipse cx={870} cy={GROUND} rx={170} ry={15} fill="#6f9cff" opacity={0.05} />
                <rect x={720} y={GROUND - 112} width={300} height={112} fill="#131a2a" />
                <rect x={720} y={GROUND - 112} width={300} height={6} fill="#1e2842" />
                {/* roof cooling fans */}
                {[0, 1, 2].map((i) => (
                  <g key={i} transform={`translate(${776 + i * 96}, ${GROUND - 124})`}>
                    <rect x={-16} y={0} width={32} height={12} rx={2} fill="#1a2338" />
                    <g className="cmp-fan" style={{ animationDelay: `${i * 0.6}s` }}>
                      <circle r={8} cy={0} fill="none" stroke="#2e3a58" strokeWidth={2} />
                      <line x1={-7} y1={0} x2={7} y2={0} stroke="#2e3a58" strokeWidth={2} />
                      <line x1={0} y1={-7} x2={0} y2={7} stroke="#2e3a58" strokeWidth={2} />
                    </g>
                  </g>
                ))}
                {/* glass hall: 13 rack bays — lit bays are the clusters you own */}
                <rect x={734} y={GROUND - 92} width={272} height={58} rx={3} fill="#0d1322" stroke="#22304e" strokeWidth={1} />
                {Array.from({ length: 13 }, (_, i) => {
                  const active = i < Math.min(13, clusters);
                  return (
                    <g key={i} transform={`translate(${742 + i * 20}, ${GROUND - 86})`}>
                      <rect width={15} height={46} rx={2} fill={active ? "#1a2740" : "#121a2b"} />
                      {active
                        ? [0, 1, 2].map((j) => (
                            <circle key={j} cx={7.5} cy={9 + j * 14} r={1.8} className="cmp-led" style={{ animationDelay: `${(rnd(i * 3 + j, 60) * 2.4).toFixed(2)}s` }} />
                          ))
                        : [0, 1, 2].map((j) => <circle key={j} cx={7.5} cy={9 + j * 14} r={1.8} fill="#1c2537" />)}
                    </g>
                  );
                })}
                <text x={870} y={GROUND - 18} textAnchor="middle" className="cmp-sign" fill="#6f9cff">
                  COMPUTE
                </text>
                <Chip x={870} y={GROUND - 160} label="DATA CENTER" value={`${clusters} clusters${capBuilding ? " +bld" : ""}`} accent="#6f9cff" />
              </g>
            </Hot>
          ) : (
            <Hot label="Launch complex — builds and launches" onGo={() => setView("dashboard")}>
              <g>
                {/* apron ground glow */}
                <ellipse cx={912} cy={GROUND} rx={190} ry={16} fill="#6f9cff" opacity={0.06} />
                <rect x={730} y={GROUND - 4} width={360} height={4} fill="#1c2438" />
                {/* hangar */}
                <path d={`M 742 ${GROUND} L 742 ${GROUND - 54} Q 802 ${GROUND - 92} 862 ${GROUND - 54} L 862 ${GROUND} Z`} fill="#171f33" />
                <rect x={782} y={GROUND - 40} width={40} height={40} fill="#0e1420" />
                <rect x={784} y={GROUND - 38} width={36} height={36} fill="#22304c" opacity={0.7} />
                {/* pad */}
                <rect x={892} y={GROUND - 8} width={190} height={8} fill="#1e2740" />
                <rect x={906} y={GROUND - 12} width={162} height={4} fill="#2a3550" />
                {/* gantry tower */}
                <rect x={1032} y={GROUND - 196} width={20} height={188} fill="#233050" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line key={i} x1={1032} y1={GROUND - 186 + i * 30} x2={1052} y2={GROUND - 166 + i * 30} stroke="#31405f" strokeWidth={2} />
                ))}
                <circle cx={1042} cy={GROUND - 200} r={3} className="cmp-beacon" />
                {(bets.length > 0 || launching) && (
                  <g className={launching ? "cmp-rocket is-launching" : "cmp-rocket"}>
                    {/* service arm (retracts on launch) */}
                    {!launching && <rect x={1006} y={GROUND - 150} width={26} height={5} fill="#2a3550" />}
                    {/* rocket */}
                    <g transform="translate(966, 0)">
                      <path d={`M 0 ${GROUND - 148} Q 17 ${GROUND - 186} 34 ${GROUND - 148} L 34 ${GROUND - 34} L 0 ${GROUND - 34} Z`} fill="#dfe6f3" />
                      <path d={`M 0 ${GROUND - 148} Q 17 ${GROUND - 186} 34 ${GROUND - 148} L 34 ${GROUND - 140} L 0 ${GROUND - 140} Z`} fill={c.color} />
                      <circle cx={17} cy={GROUND - 122} r={5.5} fill="#0d1322" stroke="#9fb0cc" strokeWidth={1.5} />
                      <path d={`M 0 ${GROUND - 64} L -13 ${GROUND - 34} L 0 ${GROUND - 44} Z`} fill="#b9c5da" />
                      <path d={`M 34 ${GROUND - 64} L 47 ${GROUND - 34} L 34 ${GROUND - 44} Z`} fill="#b9c5da" />
                      <path d={`M 8 ${GROUND - 34} L 26 ${GROUND - 34} L 22 ${GROUND - 26} L 12 ${GROUND - 26} Z`} fill="#7c8aa5" />
                      {/* exhaust when launching */}
                      {launching && (
                        <g className="cmp-flame">
                          <path d={`M 10 ${GROUND - 26} Q 17 ${GROUND + 16} 24 ${GROUND - 26} Z`} fill="#f0b54e" />
                          <path d={`M 13 ${GROUND - 26} Q 17 ${GROUND + 2} 21 ${GROUND - 26} Z`} fill="#fff1c4" />
                        </g>
                      )}
                    </g>
                  </g>
                )}
                {launching && (
                  <g className="cmp-smoke">
                    <circle cx={952} cy={GROUND - 12} r={13} fill="#2a3550" opacity={0.5} />
                    <circle cx={996} cy={GROUND - 8} r={17} fill="#232c44" opacity={0.5} />
                    <circle cx={1022} cy={GROUND - 14} r={11} fill="#2a3550" opacity={0.45} />
                  </g>
                )}
                {launching && <rect x={906} y={GROUND - 40} width={162} height={30} fill="url(#cmp-pad-glow)" />}
                <text x={802} y={GROUND - 100} textAnchor="middle" className="cmp-sign" fill="#6f9cff">
                  LAUNCH OPS
                </text>
                <Chip
                  x={984}
                  y={GROUND - 232}
                  label={launching ? "LIFTOFF" : bets.length > 0 ? "ON THE PAD" : "PAD READY"}
                  value={launching ? undefined : bets.length > 0 && Number.isFinite(nextShip) ? `T−${nextShip}w` : undefined}
                  accent={launching ? "#f0b54e" : "#6f9cff"}
                />
              </g>
            </Hot>
          )}

          {/* hint */}
          <text x={1186} y={708} textAnchor="end" className="cmp-hint">
            click a structure to manage it
          </text>
        </svg>
      </section>
    </div>
  );
}
