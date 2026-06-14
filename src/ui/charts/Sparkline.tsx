// A small inline trend line for the World view's master-variable history.
// Flat, axis-less; the latest point is dotted. Scales to its container width.

import { useSize } from "./useSize";

export function Sparkline({
  data,
  color = "var(--accent)",
  height = 34,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const pad = 3;
  const innerW = Math.max(0, width - pad * 2);
  const innerH = height - pad * 2;

  const min = data.length ? Math.min(...data) : 0;
  const max = data.length ? Math.max(...data) : 1;
  const span = max - min || 1;
  const n = data.length;

  const x = (i: number) => (n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW);
  const y = (v: number) => pad + innerH - ((v - min) / span) * innerH;

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = data.length - 1;

  return (
    <div ref={ref} className="sparkline" style={{ height }}>
      {width > 0 && data.length > 0 && (
        <svg width={width} height={height} role="img" aria-hidden>
          {fill && (
            <path d={`${line} L ${x(last)} ${pad + innerH} L ${x(0)} ${pad + innerH} Z`} fill={color} opacity={0.1} />
          )}
          <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(last)} cy={y(data[last]!)} r={2.2} fill={color} />
        </svg>
      )}
    </div>
  );
}
