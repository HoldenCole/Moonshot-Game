// Single-line payout curve for Exit Scenarios: how the founder's proceeds grow
// with exit value, with a movable marker at the modeled exit. The flat-then-rise
// shape makes the liquidation-preference overhang legible.

import { useSize } from "./useSize";

export interface CurvePoint {
  x: number; // exit value $M
  y: number; // payout $M
}

export function PayoutCurve({
  series,
  markerX,
  color = "var(--accent)",
  formatX,
  formatY,
}: {
  series: CurvePoint[];
  markerX: number;
  color?: string;
  formatX: (v: number) => string;
  formatY: (v: number) => string;
}) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const height = 232;
  const pad = { top: 16, right: 18, bottom: 30, left: 56 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;

  const xMax = Math.max(1, ...series.map((p) => p.x));
  const yMax = Math.max(1, ...series.map((p) => p.y)) * 1.1;

  const sx = (v: number) => pad.left + (v / xMax) * innerW;
  const sy = (v: number) => pad.top + innerH - (v / yMax) * innerH;

  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`)
    .join(" ");

  const markerY = interpolateY(series, markerX);

  return (
    <div ref={ref} className="chart" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={sy(yMax * f)}
                y2={sy(yMax * f)}
                stroke="var(--border-faint)"
              />
              <text x={pad.left - 8} y={sy(yMax * f) + 3} textAnchor="end" className="chart__tick">
                {formatY(yMax * f)}
              </text>
            </g>
          ))}
          {[0, 0.5, 1].map((f) => (
            <text key={f} x={sx(xMax * f)} y={height - 10} textAnchor="middle" className="chart__xlabel">
              {formatX(xMax * f)}
            </text>
          ))}

          <path d={`${path} L ${sx(xMax)} ${sy(0)} L ${sx(0)} ${sy(0)} Z`} fill={color} opacity={0.08} />
          <path d={path} fill="none" stroke={color} strokeWidth={2} />

          {/* marker at the modeled exit */}
          <line
            x1={sx(markerX)}
            x2={sx(markerX)}
            y1={pad.top}
            y2={pad.top + innerH}
            stroke="var(--warn)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={sx(markerX)} cy={sy(markerY)} r={4} fill="var(--warn)" stroke="var(--panel)" strokeWidth={1.5} />
        </svg>
      )}
    </div>
  );
}

function interpolateY(series: CurvePoint[], x: number): number {
  if (series.length === 0) return 0;
  if (x <= series[0]!.x) return series[0]!.y;
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1]!;
    const b = series[i]!;
    if (x <= b.x) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.y + t * (b.y - a.y);
    }
  }
  return series[series.length - 1]!.y;
}
