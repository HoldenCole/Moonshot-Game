// The Floor — the team screen's office cutaway: the founder's corner office,
// four executive offices (nameplates, quality arcs, autonomy badges — dark and
// VACANT until you hire), and an open floor of lit desks, one per hire.
import type { Autonomy } from "@/domain/state";

export interface OfficeSeat {
  area: string;
  label: string; // "Finance & Capital"
  name?: string;
  quality?: number; // 0..100
  autonomy?: Autonomy;
}

const AUTONOMY_BADGE: Record<Autonomy, { glyph: string; word: string; color: string }> = {
  decide: { glyph: "○", word: "you decide", color: "#69748a" },
  recommend: { glyph: "◐", word: "recommends", color: "#6f9cff" },
  handle: { glyph: "●", word: "handles it", color: "#3ad29a" },
};

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function OfficeFloorHero({ founderName, color, headcount, seats }: { founderName: string; color: string; headcount: number; seats: OfficeSeat[] }) {
  const desks = Math.min(36, headcount);
  const cols = 12;
  return (
    <section className="hero-panel officefloor" aria-label="The Floor">
      <div className="observatory__head">
        <div className="hero-kicker">The Floor · {headcount} aboard</div>
        <div className="exchange__lamps">
          <span className="floor-lamp">{seats.filter((s) => s.name).length}/{seats.length} SEATS FILLED</span>
          <span className="floor-lamp">{seats.filter((s) => s.autonomy === "handle" && s.name).length} DELEGATED</span>
        </div>
      </div>
      <svg viewBox="0 0 920 220" className="officefloor__svg" aria-hidden>
        {/* floor + carpet */}
        <rect x={0} y={100} width={920} height={120} fill="#0d1220" />
        {Array.from({ length: 23 }, (_, i) => (
          <line key={i} x1={i * 40} y1={100} x2={i * 40} y2={220} stroke="#131a2c" strokeWidth={1} />
        ))}

        {/* founder corner office */}
        <g>
          <rect x={14} y={16} width={168} height={84} fill="#141b2e" stroke="#26314e" strokeWidth={1.2} />
          <rect x={14} y={16} width={168} height={5} fill={color} opacity={0.55} />
          <rect x={28} y={62} width={62} height={22} rx={2} fill="#1b2338" />
          <rect x={32} y={54} width={16} height={10} rx={1.5} fill="#ffd98a" opacity={0.5} />
          <circle cx={110} cy={58} r={9} fill={color} opacity={0.9} />
          <text x={110} y={61.5} textAnchor="middle" className="office-initials">{initials(founderName)}</text>
          <text x={98} y={94} textAnchor="middle" className="obs-label">FOUNDER · {founderName.toUpperCase().slice(0, 18)}</text>
        </g>

        {/* executive offices */}
        {seats.map((s, i) => {
          const x = 210 + i * 178;
          const filled = !!s.name;
          const badge = s.autonomy ? AUTONOMY_BADGE[s.autonomy] : AUTONOMY_BADGE.decide;
          const q = s.quality ?? 0;
          return (
            <g key={s.area} opacity={filled ? 1 : 0.6}>
              <rect x={x} y={16} width={160} height={84} fill={filled ? "#141b2e" : "#10141f"} stroke="#26314e" strokeWidth={1.2} />
              <rect x={x} y={16} width={160} height={4} fill={filled ? "#3ad29a" : "#232c44"} opacity={0.5} />
              {filled ? (
                <>
                  <circle cx={x + 34} cy={52} r={13} fill="#1f2b45" stroke="#3a4a6e" strokeWidth={1.4} />
                  <text x={x + 34} y={56} textAnchor="middle" className="office-initials">{initials(s.name!)}</text>
                  {/* quality arc */}
                  <circle cx={x + 34} cy={52} r={17} fill="none" stroke="#232c44" strokeWidth={2.6} />
                  <circle
                    cx={x + 34}
                    cy={52}
                    r={17}
                    fill="none"
                    stroke="#3ad29a"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeDasharray={`${(q / 100) * 2 * Math.PI * 17} ${2 * Math.PI * 17}`}
                    transform={`rotate(-90 ${x + 34} ${x ? 52 : 52})`}
                  />
                  <text x={x + 62} y={46} className="office-name">{s.name}</text>
                  <text x={x + 62} y={62} className="obs-label" fill={badge.color}>{badge.glyph} {badge.word.toUpperCase()}</text>
                </>
              ) : (
                <>
                  <rect x={x + 24} y={44} width={40} height={18} rx={2} fill="#141a2b" />
                  <text x={x + 80} y={56} textAnchor="middle" className="office-vacant">VACANT</text>
                </>
              )}
              <text x={x + 80} y={94} textAnchor="middle" className="obs-label">{s.label.toUpperCase()}</text>
            </g>
          );
        })}

        {/* the open floor: one lit desk per hire */}
        {Array.from({ length: 36 }, (_, i) => {
          const dx = 40 + (i % cols) * 72;
          const dy = 122 + Math.floor(i / cols) * 32;
          const lit = i < desks;
          return (
            <g key={i} opacity={lit ? 1 : 0.28}>
              <rect x={dx} y={dy} width={40} height={12} rx={2} fill="#171f33" />
              <rect x={dx + 12} y={dy - 8} width={16} height={7} rx={1} fill={lit ? "#8fb3ff" : "#1c2537"} opacity={lit ? 0.85 : 1} className={lit ? "office-monitor" : undefined} style={lit ? { animationDelay: `${(i % 9) * 0.8}s` } : undefined} />
              <circle cx={dx + 20} cy={dy + 18} r={3.4} fill={lit ? "#31405f" : "#1a2233"} />
            </g>
          );
        })}
        {headcount > 36 && (
          <text x={880} y={210} textAnchor="end" className="obs-label">
            +{headcount - 36} MORE ACROSS THE HALL
          </text>
        )}
      </svg>
    </section>
  );
}
