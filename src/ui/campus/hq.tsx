// The headquarters GROWS with the run — the visible arc of the game:
//   garage (idea/pre-seed) → brick loft (seed) → then the player's CHOSEN
//   architecture, scaling tower → highrise → skyscraper → megatower.
import type { Stage } from "@/domain/ids";
import type { CompanyArchitecture } from "@/domain/state";
import { GROUND, Chip, Hot, Windows } from "./shared";
import { StyleBuilding, type HqTier } from "./architecture";

/** Which building the run has earned. */
export function hqTier(stage: Stage, late: boolean, era?: string): HqTier {
  if (late && (era === "titan" || era === "sovereign")) return "megatower";
  if (late) return "skyscraper";
  if (stage === "series_c" || stage === "growth" || stage === "late_stage" || stage === "public") return "highrise";
  if (stage === "series_a" || stage === "series_b") return "tower";
  if (stage === "seed") return "loft";
  return "garage";
}

const TIER_LABEL: Record<HqTier, string> = {
  garage: "THE GARAGE",
  loft: "THE LOFT",
  tower: "HEADQUARTERS",
  highrise: "HQ TOWER",
  skyscraper: "HQ CAMPUS",
  megatower: "THE MEGATOWER",
};

interface HqProps {
  name: string;
  color: string;
  headcount: number;
  tier: HqTier;
  architecture: CompanyArchitecture;
  canopy: string | null;
  onGo: () => void;
}

const X = 170; // the HQ block's left edge — every form roots here

function Sign({ cx, y, name, color, size = 13 }: { cx: number; y: number; name: string; color: string; size?: number }) {
  return (
    <text
      x={cx}
      y={y}
      textAnchor="middle"
      className="cmp-sign cmp-sign--company"
      fill={color}
      style={{ filter: `drop-shadow(0 0 8px ${color})`, fontSize: size }}
    >
      {name.toUpperCase()}
    </text>
  );
}

export function Headquarters({ name, color, headcount, tier, architecture, canopy, onGo }: HqProps) {
  const litPct = Math.min(85, 25 + headcount * 3);
  const trim = architecture.trim ?? color;
  // Heights the styled tiers stand at (tower scales with headcount).
  const towerH = Math.min(9, 3 + Math.ceil(headcount / 8)) * 34;
  const heights: Record<HqTier, number> = { garage: 84, loft: 96, tower: towerH, highrise: 340, skyscraper: 430, megatower: 520 };
  const cx = tier === "garage" ? X + 92 : tier === "loft" ? X + 93 : X + (tier === "tower" ? 85 : tier === "highrise" ? 93 : tier === "skyscraper" ? 103 : 113);
  const topY = GROUND - heights[tier];
  const signSize = tier === "megatower" ? 15 : tier === "skyscraper" ? 14 : tier === "garage" ? 10.5 : tier === "loft" ? 11.5 : 13;

  return (
    <Hot label="Headquarters — your team (and your architect)" onGo={onGo}>
      <g>
        <ellipse cx={X + 95} cy={GROUND} rx={160} ry={16} fill={color} opacity={0.07} />
        {tier === "garage" && <Garage />}
        {tier === "loft" && <Loft headcount={headcount} />}
        {tier !== "garage" && tier !== "loft" && (
          <StyleBuilding x={X} tier={tier} style={architecture.style} crown={architecture.crown} trim={trim} litPct={litPct} towerH={towerH} canopy={canopy} />
        )}
        <Sign cx={cx} y={topY - (tier === "garage" || tier === "loft" ? 22 : 44)} name={name} color={color} size={signSize} />
        <Chip x={cx} y={topY - (tier === "garage" || tier === "loft" ? 56 : 80)} label={TIER_LABEL[tier]} value={`${headcount} aboard`} accent={color} />
      </g>
    </Hot>
  );
}

/** Where it starts: a garage, a roller door, a hoop over the driveway. */
function Garage() {
  const x = X + 30;
  return (
    <g>
      <rect x={x} y={GROUND - 62} width={124} height={62} fill="#181f30" />
      <path d={`M ${x - 6} ${GROUND - 62} L ${x + 62} ${GROUND - 84} L ${x + 130} ${GROUND - 62} Z`} fill="#202942" />
      <rect x={x + 14} y={GROUND - 44} width={56} height={44} fill="#0e1420" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + 16} y={GROUND - 41 + i * 8.4} width={52} height={5.4} rx={1.5} fill="#1c2740" />
      ))}
      <rect x={x + 16} y={GROUND - 8} width={52} height={4} fill="#ffd98a" opacity={0.35} />
      <rect x={x + 84} y={GROUND - 34} width={18} height={34} fill="#0e1420" />
      <rect x={x + 86} y={GROUND - 32} width={14} height={30} fill="#ffd98a" opacity={0.2} />
      <rect x={x + 106} y={GROUND - 40} width={14} height={12} rx={1.5} className="cmp-win cmp-win--lit" />
      <line x1={x + 4} y1={GROUND - 56} x2={x + 4} y2={GROUND} stroke="#2a3550" strokeWidth={3} />
      <rect x={x - 4} y={GROUND - 58} width={16} height={11} rx={1} fill="none" stroke="#3a4a6e" strokeWidth={1.6} />
      <circle cx={x + 4} cy={GROUND - 46} r={4} fill="none" stroke="#b06a35" strokeWidth={1.6} />
    </g>
  );
}

/** Seed: the brick loft — two floors, tall windows, an AC box on the roof. */
function Loft({ headcount }: { headcount: number }) {
  const x = X + 10;
  return (
    <g>
      <rect x={x} y={GROUND - 96} width={166} height={96} fill="#1b1c2c" />
      <rect x={x} y={GROUND - 96} width={166} height={5} fill="#272b44" />
      <rect x={x + 122} y={GROUND - 108} width={26} height={12} fill="#232c44" />
      <Windows x={x + 12} y={GROUND - 84} cols={5} rows={2} cw={22} ch={26} gapX={8} gapY={12} litPct={Math.min(85, 35 + headcount * 4)} salt={31} />
      <rect x={x + 66} y={GROUND - 30} width={34} height={30} fill="#0e1420" />
      <rect x={x + 69} y={GROUND - 27} width={28} height={27} fill="#ffd98a" opacity={0.2} />
      <rect x={x + 60} y={GROUND - 34} width={46} height={5} rx={2} fill="#232c44" />
    </g>
  );
}
