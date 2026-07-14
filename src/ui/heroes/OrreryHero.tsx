// The Orrery — the cap table as a solar system. Your company is the star;
// every holder is a body whose size is its stake, riding the ring of the round
// that created it. Dilution is drawn, not tabulated.
import { rnd } from "@/ui/campus/shared";

export interface OrreryHolder {
  id: string;
  name: string;
  type: "founder" | "cofounder" | "investor" | "pool" | "employee" | "self";
  ownership: number; // 0..1
  /** Ring index (which priced round brought them in; 0 = founding). */
  ring: number;
}

const TYPE_COLOR: Record<OrreryHolder["type"], string> = {
  founder: "#e8c76a",
  cofounder: "#f0b54e",
  investor: "#6f9cff",
  pool: "#69748a",
  employee: "#46d6c8",
  self: "#bd9dff",
};

const CX = 460;
const CY = 128;

export function OrreryHero({ holders, ringNames, founderPct, color }: { holders: OrreryHolder[]; ringNames: string[]; founderPct: number; color: string }) {
  const rings = Math.max(1, ringNames.length);
  const ringR = (i: number) => 42 + ((i + 1) / rings) * 62;
  const nonFounder = holders.filter((h) => h.type !== "founder" && h.type !== "cofounder" && h.ownership > 0.001);
  const labeled = [...nonFounder].sort((a, b) => b.ownership - a.ownership).slice(0, 4);

  return (
    <section className="hero-panel orrery" aria-label="The Orrery">
      <div className="observatory__head">
        <div className="hero-kicker">The Orrery · who owns the company</div>
        <div className="exchange__lamps">
          <span className="floor-lamp floor-lamp--gold">FOUNDERS {(founderPct * 100).toFixed(1)}%</span>
          <span className="floor-lamp">{nonFounder.length} OUTSIDE HOLDERS</span>
          <span className="floor-lamp">{ringNames.length} ROUNDS</span>
        </div>
      </div>
      <svg viewBox="0 0 920 235" className="orrery__svg" aria-hidden>
        {/* rings, labeled at their crown */}
        {ringNames.map((name, i) => (
          <g key={i}>
            <circle cx={CX} cy={CY} r={ringR(i)} fill="none" stroke="#232c46" strokeWidth={1.1} strokeDasharray={i === ringNames.length - 1 ? "none" : "2 5"} />
            <text x={CX} y={CY - ringR(i) - 4} textAnchor="middle" className="orr-ringlabel">
              {name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* the founder star */}
        <circle cx={CX} cy={CY} r={30} fill={color} opacity={0.14} className="orr-glow" />
        <circle cx={CX} cy={CY} r={16 + founderPct * 14} fill={color} opacity={0.92} />
        <circle cx={CX} cy={CY} r={16 + founderPct * 14} fill="none" stroke="#ffffff" strokeOpacity={0.25} strokeWidth={1} />
        <text x={CX} y={CY + 4} textAnchor="middle" className="orr-core num">
          {(founderPct * 100).toFixed(0)}%
        </text>

        {/* holder bodies on their round's ring */}
        {nonFounder.map((h) => {
          const r = ringR(Math.min(h.ring, rings - 1));
          const a = rnd(0, h.id.length * 31 + h.id.charCodeAt(0)) * Math.PI * 2;
          const bx = CX + r * Math.cos(a);
          const by = CY + r * Math.sin(a) * 0.86; // slight ellipse for depth
          const size = 4 + Math.sqrt(h.ownership) * 26;
          const isLabeled = labeled.includes(h);
          return (
            <g key={h.id}>
              <title>{`${h.name} — ${(h.ownership * 100).toFixed(1)}%`}</title>
              <circle cx={bx} cy={by} r={size} fill={TYPE_COLOR[h.type]} opacity={0.85} className="orr-body" />
              <circle cx={bx} cy={by} r={size} fill="none" stroke="#0a0e18" strokeWidth={1} />
              {isLabeled && (
                <text x={bx} y={by - size - 5} textAnchor="middle" className="orr-name">
                  {h.name} · {(h.ownership * 100).toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}

        {/* legend */}
        <g transform="translate(18, 168)">
          {(
            [
              ["investor", "Investors"],
              ["pool", "Option pool"],
              ["employee", "Employees"],
            ] as const
          ).map(([t, label], i) => (
            <g key={t} transform={`translate(0, ${i * 20})`}>
              <circle cx={5} cy={-3} r={4.5} fill={TYPE_COLOR[t]} opacity={0.85} />
              <text x={16} y={0} className="obs-label">{label.toUpperCase()}</text>
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}
