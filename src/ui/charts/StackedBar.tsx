// The cap table's ownership bar — a single horizontal stacked bar with each
// holder's share labeled inside its segment. Stacked bars only, never donuts
// (decision H). A data viz, so it gets a modest radius; it is not a container.

export interface StackSegment {
  key: string;
  label: string;
  value: number; // any positive magnitude; normalized internally
  color: string;
  /** Use dark label text (for light-valued segments like amber/cyan/pool). */
  labelDark?: boolean;
}

export function StackedBar({ segments, height = 34 }: { segments: StackSegment[]; height?: number }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;

  return (
    <div className="ownbar" style={{ height }}>
      {segments.map((seg) => {
        const pct = (Math.max(0, seg.value) / total) * 100;
        return (
          <div
            key={seg.key}
            className="ownbar__seg"
            style={{ width: `${pct}%`, background: seg.color, color: seg.labelDark ? "#15171c" : "#ffffff" }}
            title={`${seg.label}: ${pct.toFixed(1)}%`}
          >
            {pct >= 6.5 && <span className="ownbar__lbl num">{pct.toFixed(1)}%</span>}
          </div>
        );
      })}
    </div>
  );
}
