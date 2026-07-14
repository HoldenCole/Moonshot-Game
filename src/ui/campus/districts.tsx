// The industrial district — the right side of the campus — is YOUR business:
// a data center for a frontier lab, a product-cloud block for SaaS, a fab for
// chips, a launch complex, a ground station under a sky of your birds, or an
// assembly hall beneath your growing station. Every one is state-driven:
// capacity lights it up, in-flight bets change its chip, builds raise a crane.
import type { PlayableSubIndustry } from "@/domain/ids";
import { GROUND, Chip, Crane, Hot, Windows, rnd } from "./shared";

export interface DistrictData {
  color: string;
  hype: number;
  /** Capacity owned, keyed by capacity-type id (e.g. compute, fab_line). */
  owned: Record<string, number>;
  /** A capacity rung is under construction. */
  building: boolean;
  bets: number;
  /** Weeks until the nearest bet ships (Infinity when none). */
  nextShip: number;
  launching: boolean;
  liveProducts: number;
  onGo: () => void;
}

const sum = (o: Record<string, number>) => Object.values(o).reduce((s, n) => s + n, 0);
const t = (d: DistrictData) => (Number.isFinite(d.nextShip) ? `T−${d.nextShip}w` : undefined);

export function IndustryDistrict({ sub, d }: { sub: PlayableSubIndustry; d: DistrictData }) {
  switch (sub) {
    case "frontier_model_lab":
      return <FrontierLab d={d} />;
    case "vertical_ai_saas":
      return <SaasCloud d={d} />;
    case "ai_chips":
      return <ChipFab d={d} />;
    case "launch_services":
      return <LaunchComplex d={d} />;
    case "satellite_constellations":
      return <GroundStation d={d} />;
    case "space_stations":
      return <StationYard d={d} />;
  }
}

/** Frontier model lab: the data center — rack bays light with owned clusters,
 *  and a live training run announces itself. */
function FrontierLab({ d }: { d: DistrictData }) {
  const clusters = sum(d.owned);
  const training = d.bets > 0;
  return (
    <Hot label="Data center — compute capacity" onGo={d.onGo}>
      <g style={d.hype >= 70 || training ? { filter: "drop-shadow(0 0 18px rgba(111,156,255,0.35))" } : undefined}>
        <ellipse cx={870} cy={GROUND} rx={170} ry={15} fill="#6f9cff" opacity={0.05} />
        <rect x={720} y={GROUND - 112} width={300} height={112} fill="#131a2a" />
        <rect x={720} y={GROUND - 112} width={300} height={6} fill="#1e2842" />
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
        <rect x={734} y={GROUND - 92} width={272} height={58} rx={3} fill="#0d1322" stroke="#22304e" strokeWidth={1} />
        {Array.from({ length: 13 }, (_, i) => {
          const active = i < Math.min(13, clusters);
          return (
            <g key={i} transform={`translate(${742 + i * 20}, ${GROUND - 86})`}>
              <rect width={15} height={46} rx={2} fill={active ? "#1a2740" : "#121a2b"} />
              {active
                ? [0, 1, 2].map((j) => (
                    <circle key={j} cx={7.5} cy={9 + j * 14} r={1.8} className={training ? "cmp-led cmp-led--hot" : "cmp-led"} style={{ animationDelay: `${(rnd(i * 3 + j, 60) * 2.4).toFixed(2)}s` }} />
                  ))
                : [0, 1, 2].map((j) => <circle key={j} cx={7.5} cy={9 + j * 14} r={1.8} fill="#1c2537" />)}
            </g>
          );
        })}
        <text x={870} y={GROUND - 18} textAnchor="middle" className="cmp-sign" fill="#6f9cff">
          COMPUTE
        </text>
        {d.building && <Crane x={1056} h={140} />}
        <Chip x={870} y={GROUND - 160} label={training ? "TRAINING RUN" : "DATA CENTER"} value={training ? t(d) : `${clusters} clusters`} accent={training ? "#bd9dff" : "#6f9cff"} />
      </g>
    </Hot>
  );
}

/** Vertical SaaS: the product cloud — a glass block under a billboard of
 *  rising bars, with a small server annex humming next door. */
function SaasCloud({ d }: { d: DistrictData }) {
  const deploying = d.bets > 0;
  return (
    <Hot label="Product cloud — your live software" onGo={d.onGo}>
      <g>
        <ellipse cx={860} cy={GROUND} rx={170} ry={15} fill="#46d6c8" opacity={0.05} />
        {/* the block */}
        <rect x={730} y={GROUND - 96} width={236} height={96} fill="#151c2e" />
        <rect x={730} y={GROUND - 96} width={236} height={5} fill="#222c48" />
        <Windows x={742} y={GROUND - 82} cols={7} rows={3} cw={22} ch={16} gapX={9} gapY={10} litPct={Math.min(88, 40 + d.liveProducts * 12)} salt={52} />
        {/* rooftop billboard: the product, always up */}
        <rect x={766} y={GROUND - 156} width={160} height={48} rx={4} fill="#0d1424" stroke="#26314e" strokeWidth={1.2} />
        <line x1={790} y1={GROUND - 108} x2={790} y2={GROUND - 96} stroke="#26314e" strokeWidth={3} />
        <line x1={902} y1={GROUND - 108} x2={902} y2={GROUND - 96} stroke="#26314e" strokeWidth={3} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={782 + i * 26} y={GROUND - 122 - i * 7} width={16} height={8 + i * 7} rx={1.5} fill="#46d6c8" opacity={0.75} className="cmp-bar" style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
        <text x={918} y={GROUND - 146} textAnchor="end" className="cmp-sign" fill="#8fa2c4" style={{ fontSize: 8.5, letterSpacing: "0.14em" }}>
          {deploying ? "SHIPPING…" : "99.9% UPTIME"}
        </text>
        {/* server annex */}
        <rect x={984} y={GROUND - 52} width={72} height={52} fill="#131a2a" />
        <rect x={992} y={GROUND - 42} width={56} height={34} rx={2} fill="#0d1322" stroke="#22304e" strokeWidth={1} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={1000 + i * 18} cy={GROUND - 25} r={1.8} className="cmp-led" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
        {d.building && <Crane x={1080} h={110} />}
        <Chip x={860} y={GROUND - 192} label={deploying ? "DEPLOYING" : "PRODUCT CLOUD"} value={deploying ? t(d) : `${d.liveProducts} live`} accent="#46d6c8" />
      </g>
    </Hot>
  );
}

/** AI chips: the fab — sawtooth roofline, the yellow cleanroom band, cooling
 *  stacks, and a tape-out countdown when a design is committed. */
function ChipFab({ d }: { d: DistrictData }) {
  const lines = d.owned["fab_line"] ?? sum(d.owned);
  const tapeout = d.bets > 0;
  return (
    <Hot label="The fab — wafer capacity" onGo={d.onGo}>
      <g>
        <ellipse cx={880} cy={GROUND} rx={185} ry={15} fill="#e8c76a" opacity={0.045} />
        {/* stacks */}
        {[746, 782].map((x, i) => (
          <g key={x}>
            <rect x={x} y={GROUND - 152} width={13} height={48} fill="#1c2438" />
            <circle cx={x + 6.5} cy={GROUND - 156} r={2.6} className="cmp-beacon" style={{ animationDelay: `${i * 1.2}s` }} />
          </g>
        ))}
        {/* hall with sawtooth roof */}
        <rect x={720} y={GROUND - 104} width={320} height={104} fill="#141b2c" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${724 + i * 80} ${GROUND - 104} L ${724 + i * 80} ${GROUND - 128} L ${796 + i * 80} ${GROUND - 104} Z`} fill="#1d2740" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${727 + i * 80} ${GROUND - 106} L ${727 + i * 80} ${GROUND - 122} L ${776 + i * 80} ${GROUND - 106} Z`} fill="#46d6c8" opacity={0.1} />
        ))}
        {/* the cleanroom band — lithography yellow */}
        <rect x={732} y={GROUND - 76} width={296} height={26} rx={3} fill="#0f1322" stroke="#2b2c42" strokeWidth={1} />
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={740 + i * 26} y={GROUND - 71} width={18} height={16} rx={1.5} fill="#e8c76a" opacity={i < lines * 2 ? 0.5 : 0.12} className={i < lines * 2 ? "cmp-cleanroom" : undefined} style={{ animationDelay: `${(i % 4) * 0.8}s` }} />
        ))}
        {/* bay door */}
        <rect x={968} y={GROUND - 40} width={48} height={40} fill="#0e1420" />
        <rect x={971} y={GROUND - 37} width={42} height={34} fill="#232c44" opacity={0.7} />
        <text x={880} y={GROUND - 14} textAnchor="middle" className="cmp-sign" fill="#e8c76a">
          WAFER FAB
        </text>
        {d.building && <Crane x={1064} h={130} />}
        <Chip x={880} y={GROUND - 182} label={tapeout ? "TAPE-OUT" : "FAB"} value={tapeout ? t(d) : `${lines} ${lines === 1 ? "line" : "lines"}`} accent="#e8c76a" />
      </g>
    </Hot>
  );
}

/** Launch services: hangar, gantry, and the rocket that actually goes. */
function LaunchComplex({ d }: { d: DistrictData }) {
  return (
    <Hot label="Launch complex — builds and launches" onGo={d.onGo}>
      <g>
        <ellipse cx={912} cy={GROUND} rx={190} ry={16} fill="#6f9cff" opacity={0.06} />
        <rect x={730} y={GROUND - 4} width={360} height={4} fill="#1c2438" />
        <path d={`M 742 ${GROUND} L 742 ${GROUND - 54} Q 802 ${GROUND - 92} 862 ${GROUND - 54} L 862 ${GROUND} Z`} fill="#171f33" />
        <rect x={782} y={GROUND - 40} width={40} height={40} fill="#0e1420" />
        <rect x={784} y={GROUND - 38} width={36} height={36} fill="#22304c" opacity={0.7} />
        <rect x={892} y={GROUND - 8} width={190} height={8} fill="#1e2740" />
        <rect x={906} y={GROUND - 12} width={162} height={4} fill="#2a3550" />
        <rect x={1032} y={GROUND - 196} width={20} height={188} fill="#233050" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={1032} y1={GROUND - 186 + i * 30} x2={1052} y2={GROUND - 166 + i * 30} stroke="#31405f" strokeWidth={2} />
        ))}
        <circle cx={1042} cy={GROUND - 200} r={3} className="cmp-beacon" />
        {(d.bets > 0 || d.launching) && (
          <g className={d.launching ? "cmp-rocket is-launching" : "cmp-rocket"}>
            {!d.launching && <rect x={1006} y={GROUND - 150} width={26} height={5} fill="#2a3550" />}
            <g transform="translate(966, 0)">
              <path d={`M 0 ${GROUND - 148} Q 17 ${GROUND - 186} 34 ${GROUND - 148} L 34 ${GROUND - 34} L 0 ${GROUND - 34} Z`} fill="#dfe6f3" />
              <path d={`M 0 ${GROUND - 148} Q 17 ${GROUND - 186} 34 ${GROUND - 148} L 34 ${GROUND - 140} L 0 ${GROUND - 140} Z`} fill={d.color} />
              <circle cx={17} cy={GROUND - 122} r={5.5} fill="#0d1322" stroke="#9fb0cc" strokeWidth={1.5} />
              <path d={`M 0 ${GROUND - 64} L -13 ${GROUND - 34} L 0 ${GROUND - 44} Z`} fill="#b9c5da" />
              <path d={`M 34 ${GROUND - 64} L 47 ${GROUND - 34} L 34 ${GROUND - 44} Z`} fill="#b9c5da" />
              <path d={`M 8 ${GROUND - 34} L 26 ${GROUND - 34} L 22 ${GROUND - 26} L 12 ${GROUND - 26} Z`} fill="#7c8aa5" />
              {d.launching && (
                <g className="cmp-flame">
                  <path d={`M 10 ${GROUND - 26} Q 17 ${GROUND + 16} 24 ${GROUND - 26} Z`} fill="#f0b54e" />
                  <path d={`M 13 ${GROUND - 26} Q 17 ${GROUND + 2} 21 ${GROUND - 26} Z`} fill="#fff1c4" />
                </g>
              )}
            </g>
          </g>
        )}
        {d.launching && (
          <g className="cmp-smoke">
            <circle cx={952} cy={GROUND - 12} r={13} fill="#2a3550" opacity={0.5} />
            <circle cx={996} cy={GROUND - 8} r={17} fill="#232c44" opacity={0.5} />
            <circle cx={1022} cy={GROUND - 14} r={11} fill="#2a3550" opacity={0.45} />
          </g>
        )}
        {d.launching && <rect x={906} y={GROUND - 40} width={162} height={30} fill="url(#cmp-pad-glow)" />}
        <text x={802} y={GROUND - 100} textAnchor="middle" className="cmp-sign" fill="#6f9cff">
          LAUNCH OPS
        </text>
        {d.building && <Crane x={886} h={120} />}
        <Chip
          x={984}
          y={GROUND - 232}
          label={d.launching ? "LIFTOFF" : d.bets > 0 ? "ON THE PAD" : "PAD READY"}
          value={d.launching ? undefined : d.bets > 0 ? t(d) : undefined}
          accent={d.launching ? "#f0b54e" : "#6f9cff"}
        />
      </g>
    </Hot>
  );
}

/** Satellite constellations: the ground station — dishes sweeping the sky,
 *  and your birds actually crossing it. */
function GroundStation({ d }: { d: DistrictData }) {
  const stations = d.owned["ground_network"] ?? 0;
  const birds = Math.min(5, d.liveProducts);
  return (
    <Hot label="Ground station — the constellation's home" onGo={d.onGo}>
      <g>
        <ellipse cx={890} cy={GROUND} rx={180} ry={15} fill="#46d6c8" opacity={0.05} />
        {/* your birds, actually overhead */}
        {Array.from({ length: birds }, (_, i) => (
          <g key={i} className="cmp-bird" style={{ animationDuration: `${(46 + rnd(i, 95) * 30).toFixed(0)}s`, animationDelay: `${(-rnd(i, 96) * 60).toFixed(0)}s`, ["--alt" as string]: `${120 + rnd(i, 97) * 130}px` }}>
            <rect x={-3} y={-2.5} width={6} height={5} rx={1} fill="#9fb0cc" />
            <rect x={-13} y={-1.2} width={8} height={2.4} fill="#46d6c8" opacity={0.8} />
            <rect x={5} y={-1.2} width={8} height={2.4} fill="#46d6c8" opacity={0.8} />
            <circle cx={0} cy={0} r={1} className="cmp-beacon" style={{ animationDelay: `${i * 0.7}s` }} />
          </g>
        ))}
        {/* ops building + antenna farm */}
        <rect x={728} y={GROUND - 64} width={150} height={64} fill="#151c2e" />
        <Windows x={738} y={GROUND - 52} cols={5} rows={2} cw={18} ch={12} gapX={8} gapY={10} litPct={62} salt={73} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line x1={744 + i * 32} y1={GROUND - 64} x2={744 + i * 32} y2={GROUND - 94 - i * 6} stroke="#2e3a58" strokeWidth={2} />
            <circle cx={744 + i * 32} cy={GROUND - 96 - i * 6} r={1.6} className="cmp-beacon" style={{ animationDelay: `${i * 0.9}s` }} />
          </g>
        ))}
        {/* the big dish, sweeping */}
        <rect x={946} y={GROUND - 44} width={10} height={44} fill="#1d2740" />
        <g className="cmp-dish" style={{ transformOrigin: "951px " + (GROUND - 48) + "px" }}>
          <ellipse cx={951} cy={GROUND - 56} rx={34} ry={13} fill="#26314e" transform={`rotate(-34 951 ${GROUND - 56})`} />
          <line x1={951} y1={GROUND - 48} x2={966} y2={GROUND - 72} stroke="#3a4a6e" strokeWidth={2} />
          <circle cx={967} cy={GROUND - 73} r={2} fill="#46d6c8" />
        </g>
        {/* the small dish */}
        <rect x={1036} y={GROUND - 30} width={8} height={30} fill="#1d2740" />
        <ellipse cx={1040} cy={GROUND - 38} rx={20} ry={8} fill="#232d48" transform={`rotate(-28 1040 ${GROUND - 38})`} />
        <text x={803} y={GROUND - 14} textAnchor="middle" className="cmp-sign" fill="#46d6c8">
          MISSION CTRL
        </text>
        {d.building && <Crane x={1086} h={110} />}
        <Chip
          x={890}
          y={GROUND - 168}
          label={d.bets > 0 ? "INTEGRATION" : "GROUND STATION"}
          value={d.bets > 0 ? t(d) : `${birds} up · ${stations} ${stations === 1 ? "station" : "stations"}`}
          accent="#46d6c8"
        />
      </g>
    </Hot>
  );
}

/** Space stations: the assembly yard below, your station growing overhead —
 *  one module per live product. */
function StationYard({ d }: { d: DistrictData }) {
  const modules = Math.min(6, Math.max(d.liveProducts, 0));
  const berths = d.owned["module_construction"] ?? 0;
  return (
    <Hot label="Assembly yard — modules for the station" onGo={d.onGo}>
      <g>
        <ellipse cx={880} cy={GROUND} rx={180} ry={15} fill="#bd9dff" opacity={0.05} />
        {/* the station overhead, drifting */}
        <g className="cmp-station">
          <rect x={-40} y={-6} width={80} height={12} rx={4} fill="#8b9bbd" />
          <rect x={-58} y={-2.5} width={16} height={5} fill="#46d6c8" opacity={0.85} />
          <rect x={42} y={-2.5} width={16} height={5} fill="#46d6c8" opacity={0.85} />
          {Array.from({ length: modules }, (_, i) => {
            const up = i % 2 === 0;
            const mx = -26 + Math.floor(i / 2) * 26;
            return <rect key={i} x={mx} y={up ? -22 : 8} width={14} height={14} rx={3} fill="#a5b3d4" />;
          })}
          <circle cx={0} cy={0} r={1.6} className="cmp-beacon" />
        </g>
        {d.launching && (
          <g className="cmp-capsule">
            <path d={`M 866 ${GROUND - 60} L 874 ${GROUND - 76} L 882 ${GROUND - 60} Z`} fill="#dfe6f3" />
            <path d={`M 869 ${GROUND - 58} Q 874 ${GROUND - 40} 879 ${GROUND - 58} Z`} fill="#f0b54e" />
          </g>
        )}
        {/* the assembly hall */}
        <path d={`M 730 ${GROUND} L 730 ${GROUND - 62} Q 830 ${GROUND - 118} 930 ${GROUND - 62} L 930 ${GROUND} Z`} fill="#161d31" />
        <rect x={786} y={GROUND - 54} width={88} height={54} fill="#0e1420" />
        <rect x={790} y={GROUND - 50} width={80} height={46} fill="#28324e" opacity={0.7} />
        <line x1={830} y1={GROUND - 50} x2={830} y2={GROUND - 4} stroke="#0e1420" strokeWidth={3} />
        {/* gantry rails out the door */}
        <rect x={940} y={GROUND - 6} width={140} height={3} fill="#2a3550" />
        <rect x={952} y={GROUND - 26} width={64} height={20} rx={3} fill="#1d2740" />
        <rect x={958} y={GROUND - 22} width={20} height={12} rx={2} fill="#a5b3d4" opacity={0.85} />
        <text x={830} y={GROUND - 126} textAnchor="middle" className="cmp-sign" fill="#bd9dff">
          ASSEMBLY YARD
        </text>
        {d.building && <Crane x={1052} h={128} />}
        <Chip
          x={880}
          y={GROUND - 168}
          label={d.bets > 0 ? "MODULE BUILD" : "ORBITAL WORKS"}
          value={d.bets > 0 ? t(d) : `${modules} in orbit · ${berths} ${berths === 1 ? "berth" : "berths"}`}
          accent="#bd9dff"
        />
      </g>
    </Hot>
  );
}
