// Shared campus-scene primitives: the ground line, deterministic randomness,
// HUD chips, clickable structures, window grids, seasonal trees, and the
// construction crane that appears wherever the company is building.
import type { ReactNode } from "react";
import { play } from "@/audio/sfx";

export const GROUND = 630;

/** Deterministic pseudo-random (stable scene between renders/screenshots). */
export function rnd(i: number, salt = 0): number {
  let h = (i * 2654435761) ^ (salt * 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A small HUD chip (label + optional value) floating above a structure. */
export function Chip({ x, y, label, value, accent }: { x: number; y: number; label: string; value?: string; accent?: string }) {
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
export function Hot({ label, onGo, children }: { label: string; onGo: () => void; children: ReactNode }) {
  return (
    <g
      className="cmp-hot"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => {
        play("nav");
        onGo();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          play("nav");
          onGo();
        }
      }}
    >
      {children}
    </g>
  );
}

/** Window grid for a building face; lit fraction scales with activity. */
export function Windows({ x, y, cols, rows, cw, ch, gapX, gapY, litPct, salt }: { x: number; y: number; cols: number; rows: number; cw: number; ch: number; gapX: number; gapY: number; litPct: number; salt: number }) {
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

/** A campus tree that turns with the seasons (bare + snow-capped in winter). */
export function Tree({ x, canopy, winter }: { x: number; canopy: string | null; winter: boolean }) {
  return (
    <g>
      <rect x={x - 1.5} y={GROUND - 16} width={3} height={16} fill="#241d2c" />
      {canopy ? (
        <>
          <circle cx={x} cy={GROUND - 22} r={10} fill={canopy} opacity={0.9} />
          <circle cx={x - 6} cy={GROUND - 17} r={6.5} fill={canopy} opacity={0.75} />
        </>
      ) : (
        <>
          <line x1={x} y1={GROUND - 16} x2={x - 6} y2={GROUND - 26} stroke="#241d2c" strokeWidth={2} />
          <line x1={x} y1={GROUND - 18} x2={x + 6} y2={GROUND - 27} stroke="#241d2c" strokeWidth={2} />
          {winter && <ellipse cx={x} cy={GROUND - 27} rx={7} ry={2.2} fill="#cdd8ec" opacity={0.65} />}
        </>
      )}
    </g>
  );
}

/** A construction crane — the visible sign that capacity is being built. */
export function Crane({ x, h = 120 }: { x: number; h?: number }) {
  const top = GROUND - h;
  return (
    <g className="cmp-crane">
      <rect x={x - 3} y={top} width={6} height={h} fill="#2c3752" />
      {Array.from({ length: Math.floor(h / 22) }, (_, i) => (
        <line key={i} x1={x - 3} y1={top + 6 + i * 22} x2={x + 3} y2={top + 17 + i * 22} stroke="#3a4a6e" strokeWidth={1.6} />
      ))}
      {/* jib + counter-jib */}
      <rect x={x - 26} y={top - 6} width={96} height={4.5} fill="#2c3752" />
      <line x1={x} y1={top - 18} x2={x + 66} y2={top - 4} stroke="#3a4a6e" strokeWidth={1.6} />
      <line x1={x} y1={top - 18} x2={x - 24} y2={top - 4} stroke="#3a4a6e" strokeWidth={1.6} />
      <rect x={x - 1.5} y={top - 20} width={3} height={16} fill="#2c3752" />
      <circle cx={x} cy={top - 20} r={2.4} className="cmp-beacon" />
      {/* hook, gently swinging a beam */}
      <g className="cmp-crane__hook">
        <line x1={x + 52} y1={top - 2} x2={x + 52} y2={top + 34} stroke="#3a4a6e" strokeWidth={1.4} />
        <rect x={x + 43} y={top + 34} width={18} height={5} rx={1} fill="#38466a" />
      </g>
    </g>
  );
}
