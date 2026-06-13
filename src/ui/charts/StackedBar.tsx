// A single horizontal stacked bar — the cap table's ownership view.
// Stacked bars only, never donuts (Tufte-aligned, decision H).

export interface StackSegment {
  key: string;
  label: string;
  value: number; // any positive magnitude; normalized internally
  color: string;
}

export function StackedBar({
  segments,
  height = 30,
  rounded = true,
}: {
  segments: StackSegment[];
  height?: number;
  rounded?: boolean;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  let x = 0;
  const r = rounded ? height / 2 : 0;

  return (
    <svg
      className="stacked-bar"
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      role="img"
    >
      <defs>
        <clipPath id="stacked-clip">
          <rect x="0" y="0" width="100" height={height} rx={r / (height / height)} ry={r} />
        </clipPath>
      </defs>
      <g clipPath="url(#stacked-clip)">
        {segments.map((seg) => {
          const w = (Math.max(0, seg.value) / total) * 100;
          const rect = (
            <rect key={seg.key} x={x} y={0} width={w} height={height} fill={seg.color}>
              <title>{`${seg.label}: ${((seg.value / total) * 100).toFixed(1)}%`}</title>
            </rect>
          );
          x += w;
          return rect;
        })}
      </g>
      {/* hairline separators in the background color for crisp divisions */}
      <g>
        {separators(segments, total).map((sx, i) => (
          <line key={i} x1={sx} x2={sx} y1={0} y2={height} stroke="var(--bg)" strokeWidth={0.4} />
        ))}
      </g>
    </svg>
  );
}

function separators(segments: StackSegment[], total: number): number[] {
  const out: number[] = [];
  let x = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    x += (Math.max(0, segments[i]!.value) / total) * 100;
    out.push(x);
  }
  return out;
}
