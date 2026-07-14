// ============================================================================
// CampusView — the game world as a place, and a MIRROR of the run:
//   · the HQ grows with your stage (garage → loft → tower → campus → spire)
//   · the industrial district IS your business (fab, pad, dishes, station…)
//   · downtown's towers rise and fall with the rivals' live market caps
//   · seasons turn, weather follows the macro cycle, staff walk the grounds
// Every structure is clickable and routes to its management surface.
// ============================================================================
import { useEffect, useState } from "react";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { play } from "@/audio/sfx";
import { ActiveDecisions } from "@/ui/decisions/ActiveDecisions";
import { NextMoveChip } from "@/ui/components/NextMoveChip";
import type { PlayableSubIndustry } from "@/domain/ids";
import { PLAYABLE_SUB_INDUSTRIES } from "@/domain/ids";
import { GROUND, Chip, Hot, Tree, Windows, rnd } from "./shared";
import { Headquarters, hqTier } from "./hq";
import { IndustryDistrict, type DistrictData } from "./districts";
import { ArchitectModal } from "./ArchitectModal";

/** The year turns: sky palette + tree canopy per quarter of the 52-week year. */
const SEASONS = [
  { name: "spring", sky: ["#070a12", "#0d1322", "#182036"], canopy: "#2f6b4f" },
  { name: "summer", sky: ["#080a10", "#111528", "#232945"], canopy: "#3a8757" },
  { name: "autumn", sky: ["#0a0910", "#151020", "#2b1e33"], canopy: "#b06a35" },
  { name: "winter", sky: ["#06080f", "#0e1626", "#1e2c46"], canopy: null },
] as const;

/** Downtown slots for the rival towers (x, width). The exchange sits apart. */
const SLOTS: [number, number][] = [
  [0, 74], [82, 66], [156, 58], [222, 70], [300, 62],
  [456, 60], [524, 72], [604, 64], [676, 70], [754, 58],
  [820, 74], [902, 62], [972, 70], [1050, 60], [1118, 80],
];

/** Market cap ($M) → silhouette height. Log scale: $100M ≈ 80, $2T ≈ 330. */
function towerHeight(valuation: number): number {
  const t = Math.min(1, Math.max(0, (Math.log10(Math.max(100, valuation)) - 2) / 4.4));
  return Math.round(80 + t * 250);
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const LAB_X = 430;

export function CampusView() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const setView = useUi((s) => s.setView);
  const setFocusPanel = useUi((s) => s.setFocusPanel);
  // The pad roars when a ship goes up (space campuses only). Selected before the
  // early return so the hook order is stable.
  const launchingNow = useGame((s) => {
    const g = s.game;
    if (!g || g.company.industry !== "space") return false;
    return g.log.some((e) => e.week >= g.clock.week - 1 && e.kind === "company" && e.headline.startsWith("Shipped"));
  });
  useEffect(() => {
    if (launchingNow) play("launch");
  }, [launchingNow]);
  const [architectOpen, setArchitectOpen] = useState(false);
  if (!game) return null;

  const c = game.company;
  const week = game.clock.week;
  const industry = c.industry;
  const hype = game.world.hype[industry] ?? 55;
  const phase = game.world.macroPhase;

  // ── Live state the scene is drawn from ──
  const headcount = c.financials.headcount;
  const owned = c.products?.capacity.owned ?? {};
  const capBuilding = (c.products?.capacity.builds_in_progress.length ?? 0) > 0;
  const bets = c.products?.bets ?? [];
  const nextShip = bets.reduce((m, b) => Math.min(m, b.weeks_left), Infinity);
  const launching = game.log.some((e) => e.week >= week - 1 && e.kind === "company" && e.headline.startsWith("Shipped"));
  const liveProducts = c.products?.products.filter((p) => p.state !== "declining").length ?? 0;
  const late = game.late;
  const tier = hqTier(c.stage, !!late, late?.slice.era);
  const architecture = c.architecture ?? { style: "monolith" as const, crown: "antenna" as const };
  const sub: PlayableSubIndustry = (PLAYABLE_SUB_INDUSTRIES as readonly string[]).includes(c.subIndustry)
    ? (c.subIndustry as PlayableSubIndustry)
    : "frontier_model_lab";

  const district: DistrictData = {
    color: c.color,
    hype,
    owned,
    building: capBuilding,
    bets: bets.length,
    nextShip,
    launching,
    liveProducts,
    onGo: () => {
      setFocusPanel("products");
      setView("dashboard");
    },
  };

  // Downtown mirrors the market: the top rivals by live cap, heights to scale.
  const rivals = [...content.companies, ...game.market.companies]
    .slice()
    .sort((a, b) => b.financials.valuation - a.financials.valuation)
    .slice(0, SLOTS.length)
    .sort((a, b) => hashId(a.id) - hashId(b.id));

  // Sky mood follows the macro cycle; the palette follows the season.
  const cloudOpacity = { expansion: 0.35, peak: 0.3, recovery: 0.45, contraction: 0.6, trough: 0.7 }[phase] ?? 0.4;
  const starDim = phase === "contraction" || phase === "trough" ? 0.55 : 1;
  const season = SEASONS[Math.floor(((week % 52) / 52) * 4) % 4]!;
  const winter = season.name === "winter";
  const raining = !winter && (phase === "contraction" || phase === "trough");
  const staff = Math.max(1, Math.min(6, Math.ceil(headcount / 4)));

  return (
    <div className="workspace-scroll campus-scroll">
      <ActiveDecisions onNavigate={setView} />
      <NextMoveChip />
      <section className="panel panel--flush campus-panel">
        <svg viewBox="0 0 1200 720" className="campus-svg">
          <defs>
            <linearGradient id="cmp-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={season.sky[0]} />
              <stop offset="68%" stopColor={season.sky[1]} />
              <stop offset="100%" stopColor={season.sky[2]} />
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
          <g className="cmp-shooting">
            <line x1={0} y1={0} x2={34} y2={12} stroke="#cdd8ec" strokeWidth={1.6} strokeLinecap="round" />
          </g>
          <g className="cmp-sat">
            <rect x={-4} y={-3} width={8} height={6} rx={1} fill="#9fb0cc" />
            <rect x={-16} y={-1.5} width={9} height={3} fill="#46d6c8" opacity={0.75} />
            <rect x={7} y={-1.5} width={9} height={3} fill="#46d6c8" opacity={0.75} />
            <circle cx={0} cy={0} r={1.2} className="cmp-beacon" />
          </g>

          {/* The world, readable in the sky — the moon routes to the World view. */}
          <Hot label="The World — macro forces" onGo={() => setView("world")}>
            <circle cx={1076} cy={82} r={26} fill="#dfe6f3" opacity={0.92} />
            <circle cx={1066} cy={74} r={22} fill={season.sky[0]} />
            <Chip x={1076} y={118} label="THE WORLD" />
          </Hot>

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

          {/* ── The Market: downtown, heights tracking the rivals' live caps ── */}
          <Hot label="The Market — every rival, priced live" onGo={() => setView("market")}>
            <g opacity={0.82}>
              {rivals.map((co, i) => {
                const slot = SLOTS[i]!;
                const h = towerHeight(co.financials.valuation);
                const by = GROUND - h;
                const [bx, bw] = slot;
                // Each rival gets its own silhouette, so downtown reads as a
                // real city: slab / setback / slant roof / antenna / twin.
                const variant = hashId(co.id) % 5;
                const bodyY = variant === 1 ? by + 18 : variant === 2 ? by + 14 : by;
                return (
                  <g key={co.id}>
                    <title>{co.name}</title>
                    <rect className="cmp-bldg" x={bx} y={bodyY} width={bw} height={GROUND - bodyY} fill="#0f131d" />
                    {variant === 1 && <rect className="cmp-bldg" x={bx + bw * 0.2} y={by} width={bw * 0.6} height={20} fill="#0f131d" />}
                    {variant === 2 && <path d={`M ${bx} ${by + 14} L ${bx + bw * 0.7} ${by} L ${bx + bw} ${by + 14} Z`} fill="#12172400" stroke="none" />}
                    {variant === 2 && <path d={`M ${bx} ${by + 14} L ${bx + bw * 0.7} ${by} L ${bx + bw} ${by + 14} Z`} fill="#0f131d" />}
                    {variant === 3 && <line x1={bx + bw / 2} y1={by - 16} x2={bx + bw / 2} y2={by} stroke="#1d2536" strokeWidth={2.5} />}
                    {variant === 4 && <rect x={bx + bw * 0.44} y={by} width={bw * 0.12} height={h * 0.22} fill={season.sky[1]} />}
                    <Windows x={bx + 8} y={bodyY + 10} cols={Math.floor((bw - 14) / 13)} rows={Math.floor((GROUND - bodyY - 18) / 22)} cw={7} ch={9} gapX={6} gapY={13} litPct={8} salt={hashId(co.id) % 97} />
                  </g>
                );
              })}
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
          <rect x={0} y={GROUND} width={1200} height={90} fill={winter ? "#0e1322" : "#0c1018"} />
          {winter && <rect x={0} y={GROUND} width={1200} height={2.5} fill="#33415f" opacity={0.55} />}
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

          {/* ── Headquarters: the building your stage earned, in your style ── */}
          <Headquarters
            name={c.name}
            color={c.color}
            headcount={headcount}
            tier={tier}
            architecture={architecture}
            canopy={season.canopy}
            onGo={() => setView("team")}
          />

          {/* ── R&D lab wing (Products & R&D) ── */}
          <Hot label="R&D Lab — products and research" onGo={() => { setFocusPanel("products"); setView("dashboard"); }}>
            <g>
              <rect x={LAB_X} y={GROUND - 66} width={126} height={66} fill="#141a2b" />
              <path d={`M ${LAB_X} ${GROUND - 66} L ${LAB_X + 44} ${GROUND - 96} L ${LAB_X + 126} ${GROUND - 96} L ${LAB_X + 126} ${GROUND - 66} Z`} fill="#1a2338" />
              <path d={`M ${LAB_X + 8} ${GROUND - 70} L ${LAB_X + 46} ${GROUND - 92} L ${LAB_X + 120} ${GROUND - 92} L ${LAB_X + 120} ${GROUND - 70} Z`} fill="#46d6c8" opacity={0.16} className="cmp-lab-glow" />
              <Windows x={LAB_X + 10} y={GROUND - 54} cols={5} rows={2} cw={16} ch={11} gapX={6} gapY={9} litPct={60} salt={21} />
              <g transform={`translate(${LAB_X + 108}, ${GROUND - 96})`}>
                <line x1={0} y1={0} x2={0} y2={8} stroke="#2e3a58" strokeWidth={2.5} />
                <ellipse cx={0} cy={-3} rx={10} ry={4.5} fill="#26314b" transform="rotate(-32)" />
                <circle cx={-4} cy={-7} r={1.4} fill="#46d6c8" opacity={0.9} />
              </g>
              <Chip
                x={LAB_X + 64}
                y={GROUND - 132}
                label="R&D LAB"
                value={liveProducts > 0 ? `${liveProducts} live` : bets.length > 0 ? "building" : "idle"}
                accent="#46d6c8"
              />
            </g>
          </Hot>

          {/* ── Campus grounds: trees turn with the year; staff come and go ── */}
          <Tree x={120} canopy={season.canopy} winter={winter} />
          <Tree x={575} canopy={season.canopy} winter={winter} />
          <Tree x={602} canopy={season.canopy} winter={winter} />
          <Tree x={706} canopy={season.canopy} winter={winter} />
          {Array.from({ length: staff }, (_, i) => (
            <g
              key={i}
              className="cmp-person"
              style={{
                animationDuration: `${(15 + rnd(i, 90) * 10).toFixed(1)}s`,
                animationDelay: `${(-rnd(i, 91) * 24).toFixed(1)}s`,
              }}
            >
              <rect x={-2} y={GROUND - 9} width={4} height={7} rx={2} fill="#93a5c8" />
              <circle cx={0} cy={GROUND - 11.5} r={2} fill="#cfd9ec" />
            </g>
          ))}

          {/* ── Capitol (late game: standing & power) ── */}
          {late && (
            <Hot label="The Capitol — power, rivals, legacies" onGo={() => setView("standing")}>
              <g>
                <rect x={560} y={GROUND - 74} width={118} height={74} fill="#151b2a" />
                <path d="M 560 556 L 619 540 L 678 556 Z" fill="#1c2436" />
                <circle cx={619} cy={GROUND - 96} r={17} fill="#1c2436" />
                <circle cx={619} cy={GROUND - 112} r={2.8} fill="#e8c76a" className="cmp-beacon cmp-beacon--gold" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <rect key={i} x={572 + i * 20} y={GROUND - 62} width={8} height={62} fill="#0e1420" />
                ))}
                <Chip x={619} y={GROUND - 148} label="CAPITOL" value={`power ${late.slice.powerAxis.power.toFixed(0)}`} accent="#bd9dff" />
              </g>
            </Hot>
          )}

          {/* ── The industrial district: your business, drawn as itself ── */}
          <IndustryDistrict sub={sub} d={district} />

          {/* ── Weather: snow through the winter quarter; rain in a downturn ── */}
          {winter && (
            <g pointerEvents="none">
              {Array.from({ length: 44 }, (_, i) => (
                <circle
                  key={i}
                  className="cmp-flake"
                  cx={rnd(i, 70) * 1200}
                  cy={-8}
                  r={0.9 + rnd(i, 71) * 1.1}
                  style={{ animationDuration: `${(7 + rnd(i, 72) * 5).toFixed(1)}s`, animationDelay: `${(-rnd(i, 73) * 12).toFixed(1)}s` }}
                />
              ))}
            </g>
          )}
          {raining && (
            <g pointerEvents="none" transform="rotate(8 600 360)">
              {Array.from({ length: 36 }, (_, i) => (
                <line
                  key={i}
                  className="cmp-drop"
                  x1={rnd(i, 80) * 1280 - 40}
                  y1={-18}
                  x2={rnd(i, 80) * 1280 - 40}
                  y2={-6}
                  style={{ animationDuration: `${(0.9 + rnd(i, 81) * 0.6).toFixed(2)}s`, animationDelay: `${(-rnd(i, 82) * 2).toFixed(2)}s` }}
                />
              ))}
            </g>
          )}

          {/* hint */}
          <text x={1186} y={708} textAnchor="end" className="cmp-hint">
            click a structure to manage it
          </text>
        </svg>
        <button
          className="campus-architect"
          onClick={() => {
            play("open");
            setArchitectOpen(true);
          }}
          title="Choose your HQ's architecture"
        >
          ✎ Architect
        </button>
      </section>
      {architectOpen && <ArchitectModal onClose={() => setArchitectOpen(false)} />}
    </div>
  );
}
