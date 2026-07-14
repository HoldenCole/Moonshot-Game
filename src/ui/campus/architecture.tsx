// The architecture system: from the tower tier up, the HQ is built in the
// style the player chose — five parametric generators (silhouette + windows +
// crown), each scaling through four tiers on the way to a true supertall:
//   tower (~series A) → highrise (~series C) → skyscraper (Scale-Up)
//   → megatower (the Titan age).
import type { ReactNode } from "react";
import type { CompanyArchitecture } from "@/domain/state";
import { GROUND, Windows } from "./shared";

export type HqTier = "garage" | "loft" | "tower" | "highrise" | "skyscraper" | "megatower";
export type StyleId = CompanyArchitecture["style"];
export type CrownId = CompanyArchitecture["crown"];

export const STYLES: { id: StyleId; name: string; blurb: string }[] = [
  { id: "monolith", name: "Glass Monolith", blurb: "One clean slab of light." },
  { id: "deco", name: "Deco Setbacks", blurb: "Stepped shoulders, a gilded age." },
  { id: "helix", name: "The Helix", blurb: "A taper wound with light." },
  { id: "brutal", name: "Brutalist", blurb: "Concrete. Grid. Inevitable." },
  { id: "terrace", name: "Garden Terraces", blurb: "A hillside of hanging gardens." },
];

export const CROWNS: { id: CrownId; name: string }[] = [
  { id: "antenna", name: "Antenna" },
  { id: "helipad", name: "Helipad" },
  { id: "garden", name: "Roof garden" },
  { id: "billboard", name: "Billboard" },
];

export const TRIMS = ["#6f9cff", "#3ad29a", "#e8c76a", "#bd9dff", "#f4716f", "#46d6c8"];

/** Tier dimensions. Tower height comes from headcount (caller passes it). */
const TIER: Record<Exclude<HqTier, "garage" | "loft" | "tower">, { w: number; h: number; podium: boolean }> = {
  highrise: { w: 186, h: 340, podium: false },
  skyscraper: { w: 206, h: 430, podium: true },
  megatower: { w: 226, h: 520, podium: true },
};

export interface BuildingProps {
  x: number; // left edge of the shaft
  tier: Exclude<HqTier, "garage" | "loft">;
  style: StyleId;
  crown: CrownId;
  trim: string;
  litPct: number;
  /** Tower-tier height (from headcount); ignored above tower. */
  towerH?: number;
  /** Seasonal canopy for garden elements (null in winter → snow). */
  canopy: string | null;
}

/** The styled HQ building: podium (big tiers), shaft in the chosen style, and
 *  the chosen crown on the roof. Pure SVG — used by the scene AND the
 *  Architect panel's previews. */
export function StyleBuilding(p: BuildingProps) {
  const w = p.tier === "tower" ? 170 : TIER[p.tier].w;
  const h = p.tier === "tower" ? (p.towerH ?? 200) : TIER[p.tier].h;
  const podium = p.tier !== "tower" && TIER[p.tier].podium;
  const cx = p.x + w / 2;
  const topY = GROUND - h;
  const render = { monolith: Monolith, deco: Deco, helix: Helix, brutal: Brutal, terrace: Terrace }[p.style];
  return (
    <g>
      {podium && (
        <g>
          <rect x={p.x - 44} y={GROUND - 42} width={w + 88} height={42} fill="#161c2e" />
          <rect x={p.x - 44} y={GROUND - 42} width={w + 88} height={4} fill="#242e4c" />
          <Windows x={p.x - 32} y={GROUND - 32} cols={Math.floor((w + 64) / 30)} rows={1} cw={20} ch={16} gapX={10} gapY={0} litPct={70} salt={41} />
        </g>
      )}
      {render({ x: p.x, w, h, litPct: p.litPct, trim: p.trim, canopy: p.canopy })}
      <Crown kind={p.crown} cx={cx} roofY={topY} w={w} trim={p.trim} canopy={p.canopy} />
    </g>
  );
}

interface ShaftProps {
  x: number;
  w: number;
  h: number;
  litPct: number;
  trim: string;
  canopy: string | null;
}

/** One clean slab of light. */
function Monolith({ x, w, h, litPct }: ShaftProps) {
  const y = GROUND - h;
  const floors = Math.floor((h - 18) / 34);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#1a2136" />
      <rect x={x} y={y} width={w} height={5} fill="#2a3552" />
      <rect x={x + 6} y={y + 5} width={w - 12} height={h - 5} fill="url(#cmp-glass)" opacity={0.4} />
      <Windows x={x + 14} y={y + 13} cols={Math.floor((w - 24) / 28.5)} rows={floors} cw={24} ch={14} gapX={4.5} gapY={20} litPct={litPct} salt={9} />
    </g>
  );
}

/** Stepped shoulders and warm windows — the gilded-age silhouette. */
function Deco({ x, w, h, litPct }: ShaftProps) {
  const b1h = h * 0.52;
  const b2h = h * 0.29;
  const b3h = h * 0.19;
  const b2w = w * 0.76;
  const b3w = w * 0.52;
  const cxv = x + w / 2;
  const y1 = GROUND - b1h;
  const y2 = y1 - b2h;
  const y3 = y2 - b3h;
  return (
    <g>
      <rect x={x} y={y1} width={w} height={b1h} fill="#221f30" />
      <rect x={cxv - b2w / 2} y={y2} width={b2w} height={b2h} fill="#262238" />
      <rect x={cxv - b3w / 2} y={y3} width={b3w} height={b3h} fill="#2a2540" />
      {/* pilaster seams up the base block */}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={x + 10 + i * ((w - 20) / 4)} y1={y1 + 6} x2={x + 10 + i * ((w - 20) / 4)} y2={GROUND - 4} stroke="#171525" strokeWidth={3} />
      ))}
      <Windows x={x + 14} y={y1 + 10} cols={Math.floor((w - 24) / 24)} rows={Math.floor((b1h - 18) / 30)} cw={12} ch={18} gapX={12} gapY={12} litPct={litPct + 12} salt={19} />
      <Windows x={cxv - b2w / 2 + 10} y={y2 + 8} cols={Math.floor((b2w - 16) / 24)} rows={Math.floor((b2h - 14) / 30)} cw={12} ch={18} gapX={12} gapY={12} litPct={litPct + 6} salt={23} />
      <Windows x={cxv - b3w / 2 + 8} y={y3 + 8} cols={Math.floor((b3w - 12) / 24)} rows={Math.floor((b3h - 14) / 30)} cw={12} ch={18} gapX={12} gapY={12} litPct={litPct} salt={29} />
      {/* stepped cap */}
      <rect x={cxv - b3w / 2 + 8} y={y3 - 7} width={b3w - 16} height={7} fill="#332c4e" />
      <rect x={cxv - 12} y={y3 - 13} width={24} height={6} fill="#3a3258" />
    </g>
  );
}

/** A taper wound with light seams. */
function Helix({ x, w, h, litPct, trim }: ShaftProps) {
  const y = GROUND - h;
  const cxv = x + w / 2;
  const topW = w * 0.36;
  const seams = Math.floor(h / 52);
  const edge = (yy: number) => {
    const t = (GROUND - yy) / h; // 0 at ground → 1 at top
    return (w / 2) * (1 - t) + (topW / 2) * t;
  };
  return (
    <g>
      <polygon points={`${x},${GROUND} ${cxv - topW / 2},${y} ${cxv + topW / 2},${y} ${x + w},${GROUND}`} fill="#1b2238" />
      <polygon points={`${x + 10},${GROUND} ${cxv - topW / 2 + 6},${y + 10} ${cxv + topW / 2 - 6},${y + 10} ${x + w - 10},${GROUND}`} fill="url(#cmp-glass)" opacity={0.45} />
      {/* the winding seams */}
      {Array.from({ length: seams }, (_, i) => {
        const ya = GROUND - 20 - i * 52;
        const yb = ya - 26;
        const flip = i % 2 === 0;
        return <line key={i} x1={cxv + (flip ? -edge(ya) : edge(ya)) * 0.92} y1={ya} x2={cxv + (flip ? edge(yb) : -edge(yb)) * 0.92} y2={yb} stroke={trim} strokeWidth={1.6} opacity={0.5} className="cmp-lab-glow" />;
      })}
      {/* window bands following the taper */}
      {Array.from({ length: Math.floor((h - 40) / 40) }, (_, i) => {
        const yy = GROUND - 30 - i * 40;
        const half = edge(yy) * 0.8;
        return <rect key={i} x={cxv - half} y={yy} width={half * 2} height={5} fill="#ffd98a" opacity={0.08 + ((i * 37) % 23) / 23 * (litPct / 260)} />;
      })}
    </g>
  );
}

/** Concrete. Grid. Inevitable. */
function Brutal({ x, w, h, litPct }: ShaftProps) {
  const y = GROUND - h;
  const cols = Math.floor((w - 18) / 24);
  const rows = Math.floor((h - 30) / 30);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#232636" />
      <rect x={x + w * 0.3} y={y - 14} width={w * 0.4} height={14} fill="#1d202e" />
      {/* the exposed grid */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line key={`v${i}`} x1={x + 9 + i * 24} y1={y + 6} x2={x + 9 + i * 24} y2={GROUND - 4} stroke="#181b28" strokeWidth={4} />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line key={`h${i}`} x1={x + 4} y1={y + 12 + i * 30} x2={x + w - 4} y2={y + 12 + i * 30} stroke="#181b28" strokeWidth={4} />
      ))}
      <Windows x={x + 13} y={y + 17} cols={cols} rows={rows} cw={16} ch={20} gapX={8} gapY={10} litPct={Math.max(14, litPct - 18)} salt={37} />
    </g>
  );
}

/** A hillside of hanging gardens — ledges of green stepping up the face. */
function Terrace({ x, w, h, litPct, canopy }: ShaftProps) {
  const shaftW = w * 0.6;
  const shaftX = x + w - shaftW;
  const y = GROUND - h;
  const steps = 4;
  const leaf = canopy ?? null;
  return (
    <g>
      <rect x={shaftX} y={y} width={shaftW} height={h} fill="#1c2434" />
      <rect x={shaftX} y={y} width={shaftW} height={5} fill="#2c3a50" />
      <Windows x={shaftX + 10} y={y + 12} cols={Math.floor((shaftW - 16) / 26)} rows={Math.floor((h - 22) / 32)} cw={18} ch={13} gapX={8} gapY={19} litPct={litPct} salt={47} />
      {Array.from({ length: steps }, (_, i) => {
        const ly = GROUND - (h / (steps + 1)) * (i + 1);
        const lw = (w - shaftW) * (1 - i * 0.16) + 14;
        const lx = shaftX - lw;
        return (
          <g key={i}>
            <rect x={lx} y={ly} width={lw + 8} height={10} fill="#222c40" />
            <rect x={lx} y={ly + 10} width={10} height={GROUND - ly - 10} fill="#1a2232" />
            {leaf ? (
              <>
                <circle cx={lx + 12} cy={ly - 5} r={7} fill={leaf} opacity={0.85} />
                <circle cx={lx + 27} cy={ly - 4} r={5.5} fill={leaf} opacity={0.7} />
                <circle cx={lx + lw - 10} cy={ly - 5} r={6} fill={leaf} opacity={0.8} />
              </>
            ) : (
              <ellipse cx={lx + lw / 2} cy={ly - 2} rx={lw / 2.4} ry={2.5} fill="#cdd8ec" opacity={0.5} />
            )}
            <rect x={lx + 6} y={ly + 3} width={lw - 12} height={2} fill="#ffd98a" opacity={0.25} />
          </g>
        );
      })}
    </g>
  );
}

/** What sits on the roof — the player's pick. */
export function Crown({ kind, cx, roofY, w, trim, canopy }: { kind: CrownId; cx: number; roofY: number; w: number; trim: string; canopy: string | null }): ReactNode {
  switch (kind) {
    case "antenna":
      return (
        <g>
          <line x1={cx} y1={roofY - 28} x2={cx} y2={roofY} stroke="#2a3550" strokeWidth={3} />
          <circle cx={cx} cy={roofY - 30} r={3} className="cmp-beacon" />
        </g>
      );
    case "helipad":
      return (
        <g>
          <ellipse cx={cx} cy={roofY - 4} rx={Math.min(34, w * 0.26)} ry={8} fill="#141a2b" stroke="#2c3752" strokeWidth={1.5} />
          <text x={cx} y={roofY - 1} textAnchor="middle" style={{ fontSize: 9, fontWeight: 800 }} fill="#8fa2c4">
            H
          </text>
          {[-1, 1].map((s) => (
            <circle key={s} cx={cx + s * Math.min(30, w * 0.23)} cy={roofY - 4} r={1.6} className="cmp-beacon" style={{ animationDelay: s > 0 ? "1.2s" : "0s" }} />
          ))}
        </g>
      );
    case "garden":
      return (
        <g>
          {[-18, 0, 17].map((dx, i) =>
            canopy ? (
              <circle key={i} cx={cx + dx} cy={roofY - 6} r={6.5 - i} fill={canopy} opacity={0.85} />
            ) : (
              <ellipse key={i} cx={cx + dx} cy={roofY - 4} rx={6} ry={2} fill="#cdd8ec" opacity={0.6} />
            ),
          )}
          <line x1={cx - 26} y1={roofY - 3} x2={cx + 26} y2={roofY - 3} stroke="#ffd98a" strokeWidth={1} opacity={0.5} />
        </g>
      );
    case "billboard":
      return (
        <g>
          <rect x={cx - 32} y={roofY - 30} width={64} height={24} rx={3} fill="#0d1424" stroke="#26314e" strokeWidth={1.2} />
          <line x1={cx - 20} y1={roofY - 6} x2={cx - 20} y2={roofY} stroke="#26314e" strokeWidth={2.5} />
          <line x1={cx + 20} y1={roofY - 6} x2={cx + 20} y2={roofY} stroke="#26314e" strokeWidth={2.5} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={cx - 22 + i * 16} y={roofY - 13 - i * 5} width={10} height={5 + i * 5} rx={1} fill={trim} opacity={0.8} className="cmp-bar" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      );
  }
}
