// The C-Suite — the late-game executive floor as a boardroom: seven domain
// seats around the table, each filled chair carrying its exec's competence arc
// and morale, empty ones waiting. The market's bench and refresh sit above.
export interface SuiteSeat {
  domain: string;
  label: string;
  name?: string;
  competence?: number; // 0..100
  morale?: number; // 0..1
}

const CX = 460;
const CY = 118;

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/** Compact a long title ("Chief Financial Officer (Growth)" → "FINANCIAL"). */
function compactTitle(label: string): string {
  const t = label
    .replace(/\(.*?\)/g, "")
    .replace(/^Chief\s+/i, "")
    .replace(/\s+Officer$/i, "")
    .trim();
  return (t || label).toUpperCase().slice(0, 22);
}

export function CSuiteHero({ seats, marketCount, refreshWeeks }: { seats: SuiteSeat[]; marketCount: number; refreshWeeks: number }) {
  const filled = seats.filter((s) => s.name).length;
  return (
    <section className="hero-panel csuite" aria-label="The C-Suite">
      <div className="observatory__head">
        <div className="hero-kicker">The C-Suite · {filled}/{seats.length} seats filled</div>
        <div className="exchange__lamps">
          <span className="floor-lamp">{marketCount} ON THE MARKET</span>
          <span className="floor-lamp">NEW SLATE IN {Math.max(0, refreshWeeks)}W</span>
        </div>
      </div>
      <svg viewBox="0 0 920 240" className="csuite__svg" aria-hidden>
        {/* the table */}
        <ellipse cx={CX} cy={CY} rx={220} ry={64} fill="#141b2e" stroke="#2a3550" strokeWidth={2} />
        <ellipse cx={CX} cy={CY} rx={196} ry={50} fill="#10162a" />
        <ellipse cx={CX} cy={CY - 6} rx={60} ry={14} fill="#1b2742" opacity={0.6} />
        <text x={CX} y={CY + 2} textAnchor="middle" className="obs-label">THE TABLE</text>

        {/* seats around it */}
        {seats.map((s, i) => {
          const a = -Math.PI / 2 + (i / seats.length) * Math.PI * 2;
          const sx = CX + 300 * Math.cos(a) * 0.92;
          const sy = CY + 74 * Math.sin(a) + 8;
          const below = Math.sin(a) > 0.35; // bottom seats label upward instead of clipping
          const filledSeat = !!s.name;
          const q = s.competence ?? 0;
          const unhappy = filledSeat && (s.morale ?? 1) < 0.5;
          return (
            <g key={s.domain} opacity={filledSeat ? 1 : 0.55}>
              <title>{filledSeat ? `${s.name} — ${s.label} · competence ${q}` : `${s.label} — open seat`}</title>
              {/* chair */}
              <path d={`M ${sx - 15} ${sy + 16} A 16 16 0 0 1 ${sx + 15} ${sy + 16}`} fill="none" stroke="#31405f" strokeWidth={3} />
              {filledSeat ? (
                <>
                  <circle cx={sx} cy={sy} r={14} fill="#1f2b45" stroke={unhappy ? "#f0b54e" : "#3a4a6e"} strokeWidth={1.6} className={unhappy ? "suite-unhappy" : undefined} />
                  <text x={sx} y={sy + 4} textAnchor="middle" className="office-initials">{initials(s.name!)}</text>
                  <circle cx={sx} cy={sy} r={18.5} fill="none" stroke="#232c44" strokeWidth={2.6} />
                  <circle
                    cx={sx}
                    cy={sy}
                    r={18.5}
                    fill="none"
                    stroke={unhappy ? "#f0b54e" : "#3ad29a"}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeDasharray={`${(q / 100) * 2 * Math.PI * 18.5} ${2 * Math.PI * 18.5}`}
                    transform={`rotate(-90 ${sx} ${sy})`}
                  />
                  <text x={sx} y={below ? sy - 40 : sy + 34} textAnchor="middle" className="office-name">{s.name}</text>
                </>
              ) : (
                <>
                  <circle cx={sx} cy={sy} r={12} fill="#10141f" stroke="#232c44" strokeWidth={1.4} strokeDasharray="3 3" />
                  <text x={sx} y={below ? sy - 40 : sy + 34} textAnchor="middle" className="office-vacant">OPEN</text>
                </>
              )}
              <text x={sx} y={below ? sy - 27 : sy + 47} textAnchor="middle" className="obs-label">{compactTitle(s.label)}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
