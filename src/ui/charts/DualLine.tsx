// Dual-axis line chart: founder ownership trending down, stake value trending
// up — the Round History story (dilution down, value up) in one figure.

import { useSize } from "./useSize";

export interface DualPoint {
  label: string;
  left: number; // ownership fraction 0–1 (left axis)
  right: number; // value $M (right axis)
}

export function DualLine({
  points,
  leftColor = "var(--accent)",
  rightColor = "var(--up)",
  leftLabel = "Founder %",
  rightLabel = "Value",
  formatLeft,
  formatRight,
}: {
  points: DualPoint[];
  leftColor?: string;
  rightColor?: string;
  leftLabel?: string;
  rightLabel?: string;
  formatLeft: (v: number) => string;
  formatRight: (v: number) => string;
}) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const height = 232;
  const pad = { top: 18, right: 54, bottom: 30, left: 48 };

  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;

  const n = points.length;
  const xAt = (i: number) => (n <= 1 ? pad.left + innerW / 2 : pad.left + (i / (n - 1)) * innerW);

  const leftMax = 1; // ownership is always 0–1
  const rightMax = Math.max(1, ...points.map((p) => p.right)) * 1.15;

  const yLeft = (v: number) => pad.top + innerH - (v / leftMax) * innerH;
  const yRight = (v: number) => pad.top + innerH - (v / rightMax) * innerH;

  const linePath = (accessor: (p: DualPoint) => number, scale: (v: number) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${scale(accessor(p)).toFixed(1)}`).join(" ");

  const gridYs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={ref} className="chart" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img">
          {/* horizontal gridlines + left (%) axis */}
          {gridYs.map((g) => (
            <g key={g}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yLeft(g)}
                y2={yLeft(g)}
                stroke="var(--border-faint)"
                strokeWidth={1}
              />
              <text x={pad.left - 8} y={yLeft(g) + 3} textAnchor="end" className="chart__tick">
                {formatLeft(g)}
              </text>
            </g>
          ))}

          {/* right ($) axis ticks */}
          {[0, 0.5, 1].map((f) => (
            <text
              key={f}
              x={width - pad.right + 8}
              y={yRight(rightMax * f) + 3}
              textAnchor="start"
              className="chart__tick chart__tick--right"
            >
              {formatRight(rightMax * f)}
            </text>
          ))}

          {/* value (right axis) line + area */}
          <path
            d={`${linePath((p) => p.right, yRight)} L ${xAt(n - 1)} ${pad.top + innerH} L ${xAt(0)} ${pad.top + innerH} Z`}
            fill={rightColor}
            opacity={0.08}
          />
          <path d={linePath((p) => p.right, yRight)} fill="none" stroke={rightColor} strokeWidth={2} />

          {/* ownership (left axis) line */}
          <path d={linePath((p) => p.left, yLeft)} fill="none" stroke={leftColor} strokeWidth={2} />

          {/* points + x labels */}
          {points.map((p, i) => (
            <g key={p.label + i}>
              <circle cx={xAt(i)} cy={yRight(p.right)} r={3} fill={rightColor} stroke="var(--panel)" strokeWidth={1.5} />
              <circle cx={xAt(i)} cy={yLeft(p.left)} r={3} fill={leftColor} stroke="var(--panel)" strokeWidth={1.5} />
              <text x={xAt(i)} y={height - 10} textAnchor="middle" className="chart__xlabel">
                {p.label}
              </text>
            </g>
          ))}

          {/* legend */}
          <g>
            <circle cx={pad.left + 4} cy={pad.top - 8} r={3} fill={leftColor} />
            <text x={pad.left + 12} y={pad.top - 5} className="chart__legend">
              {leftLabel}
            </text>
            <circle cx={pad.left + 92} cy={pad.top - 8} r={3} fill={rightColor} />
            <text x={pad.left + 100} y={pad.top - 5} className="chart__legend">
              {rightLabel}
            </text>
          </g>
        </svg>
      )}
    </div>
  );
}
