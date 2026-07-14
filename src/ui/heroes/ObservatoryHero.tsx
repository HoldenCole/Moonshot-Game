// The Observatory — the world screen's situation room. The planet turns under
// cloud bands, the macro cycle is a literal orbit with the economy riding it,
// rate/sentiment/climate read as instruments, and sector hype burns in bars.
import type { IpoWindow, MacroPhase } from "@/domain/state";

export interface ObservatoryProps {
  phase: MacroPhase;
  /** Macro oscillator position, radians. */
  position: number;
  /** Cycle strength −1..1. */
  strength: number;
  rate: number;
  rateTarget: number;
  sentiment: number;
  climate: number;
  window: IpoWindow;
  hype: { label: string; value: number }[];
  economyScale: number;
}

const PHASE_WORD: Record<MacroPhase, string> = {
  expansion: "EXPANSION",
  peak: "PEAK",
  contraction: "CONTRACTION",
  trough: "TROUGH",
  recovery: "RECOVERY",
};

export function ObservatoryHero(p: ObservatoryProps) {
  // The marker rides the cycle orbit: angle = oscillator position, altitude =
  // strength (booms fly high, busts sink inside the ring).
  const cx = 452;
  const cy = 122;
  const ringR = 74;
  const mr = ringR + p.strength * 16;
  const mx = cx + mr * Math.cos(p.position);
  const my = cy - mr * Math.sin(p.position);
  const rateAngle = Math.PI - (Math.min(10, Math.max(0, p.rate)) / 10) * Math.PI;
  const targetAngle = Math.PI - (Math.min(10, Math.max(0, p.rateTarget)) / 10) * Math.PI;

  return (
    <section className="hero-panel observatory" aria-label="The Observatory">
      <div className="observatory__head">
        <div className="hero-kicker">The Observatory · six master variables, one sky</div>
        <div className="exchange__lamps">
          <span className="floor-lamp">{PHASE_WORD[p.phase]}</span>
          <span className={`floor-lamp floor-lamp--${p.window}`}>IPO {p.window.toUpperCase()}</span>
          <span className="floor-lamp floor-lamp--gold">ECONOMY ×{p.economyScale.toFixed(2)}</span>
        </div>
      </div>
      <svg viewBox="0 0 920 235" className="observatory__svg" aria-hidden>
        {/* stars */}
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={(i * 227) % 920} cy={18 + ((i * 83) % 200)} r={0.7 + (i % 3) * 0.3} fill="#cdd8ec" opacity={0.4} className="cmp-star" style={{ animationDelay: `${(i % 7) * 0.9}s` }} />
        ))}

        {/* ── the planet ── */}
        <g>
          <circle cx={132} cy={122} r={72} fill="#12203a" />
          <clipPath id="obs-planet">
            <circle cx={132} cy={122} r={72} />
          </clipPath>
          <g clipPath="url(#obs-planet)">
            {[0, 1, 2, 3, 4].map((i) => (
              <ellipse key={i} className="obs-band" cx={132} cy={70 + i * 26} rx={86} ry={9} fill={i % 2 ? "#1b3050" : "#16283f"} opacity={0.9} style={{ animationDelay: `${i * -6}s` }} />
            ))}
            <circle cx={104} cy={96} r={17} fill="#1f3a5e" opacity={0.8} />
            <circle cx={156} cy={148} r={23} fill="#1d3556" opacity={0.7} />
            {/* the terminator: the dark side grows when the cycle sours */}
            <ellipse cx={132 + 90 + p.strength * 46} cy={122} rx={110} ry={110} fill="#060910" opacity={0.75} />
          </g>
          <circle cx={132} cy={122} r={72} fill="none" stroke="#2c3a58" strokeWidth={1.5} />
          {/* a satellite on a slow pass */}
          <g className="obs-sat">
            <rect x={-3} y={-2} width={6} height={4} rx={1} fill="#9fb0cc" />
            <rect x={-10} y={-1} width={5} height={2} fill="#46d6c8" opacity={0.8} />
            <rect x={5} y={-1} width={5} height={2} fill="#46d6c8" opacity={0.8} />
          </g>
        </g>

        {/* ── the macro cycle as an orbit ── */}
        <g>
          <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="#26314e" strokeWidth={1.5} strokeDasharray="3 6" />
          <circle cx={cx} cy={cy} r={ringR + 16} fill="none" stroke="#1b2337" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={ringR - 16} fill="none" stroke="#1b2337" strokeWidth={1} />
          <text x={cx} y={cy - ringR - 24} textAnchor="middle" className="obs-label">BOOM ALTITUDE</text>
          <text x={cx} y={cy + ringR + 30} textAnchor="middle" className="obs-label">BUST FLOOR</text>
          {/* trail */}
          {[0.5, 0.35, 0.2].map((t, i) => (
            <circle key={i} cx={cx + mr * Math.cos(p.position - (i + 1) * 0.28)} cy={cy - mr * Math.sin(p.position - (i + 1) * 0.28)} r={3 - i * 0.7} fill="#6f9cff" opacity={t} />
          ))}
          <circle cx={mx} cy={my} r={5} fill="#6f9cff" className="exchange__dot" />
          <text x={cx} y={cy - 4} textAnchor="middle" className="obs-phase">{PHASE_WORD[p.phase]}</text>
          <text x={cx} y={cy + 16} textAnchor="middle" className="obs-strength num" fill={p.strength >= 0 ? "#3ad29a" : "#f4716f"}>
            {p.strength >= 0 ? "+" : ""}{(p.strength * 100).toFixed(0)}
          </text>
        </g>

        {/* ── instruments ── */}
        <g transform="translate(640, 0)">
          {/* rates dial */}
          <path d="M 20 96 A 60 60 0 0 1 140 96" fill="none" stroke="#26314e" strokeWidth={7} strokeLinecap="round" />
          <line x1={80} y1={96} x2={80 + 52 * Math.cos(targetAngle)} y2={96 - 52 * Math.sin(targetAngle)} stroke="#3d4a63" strokeWidth={2} strokeDasharray="3 3" />
          <line x1={80} y1={96} x2={80 + 52 * Math.cos(rateAngle)} y2={96 - 52 * Math.sin(rateAngle)} stroke="#e8c76a" strokeWidth={2.6} className="obs-needle" />
          <circle cx={80} cy={96} r={4} fill="#e8c76a" />
          <text x={80} y={116} textAnchor="middle" className="obs-label">RATES {p.rate.toFixed(1)}% → {p.rateTarget.toFixed(1)}%</text>

          {/* sentiment + climate bars */}
          {[
            { label: "SENTIMENT", v: p.sentiment, y: 142, color: "#6f9cff" },
            { label: "VC CLIMATE", v: p.climate, y: 172, color: "#3ad29a" },
          ].map((g) => (
            <g key={g.label}>
              <text x={0} y={g.y + 4} className="obs-label">{g.label}</text>
              <rect x={92} y={g.y - 5} width={150} height={9} rx={4.5} fill="#161d2f" />
              <rect x={92} y={g.y - 5} width={Math.max(4, (g.v / 100) * 150)} height={9} rx={4.5} fill={g.color} opacity={0.8} className="obs-fill" />
              <text x={252} y={g.y + 4} className="obs-label num">{Math.round(g.v)}</text>
            </g>
          ))}

          {/* sector hype */}
          {p.hype.slice(0, 2).map((h, i) => (
            <g key={h.label}>
              <text x={0} y={206 + i * 22} className="obs-label">{h.label.toUpperCase()} HYPE</text>
              <rect x={112} y={198 + i * 22} width={130} height={7} rx={3.5} fill="#161d2f" />
              <rect x={112} y={198 + i * 22} width={Math.max(4, (h.value / 100) * 130)} height={7} rx={3.5} fill="#f0b54e" opacity={0.85} className="obs-fill" />
              <text x={252} y={205 + i * 22} className="obs-label num">{Math.round(h.value)}</text>
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}
