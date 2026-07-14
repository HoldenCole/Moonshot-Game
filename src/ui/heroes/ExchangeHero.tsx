// The Exchange — the market screen's trading floor. A composite index drawn
// from the world's own history (sentiment, VC climate, IPO openness), a wall
// of movers flashing red/green, and the floor's mood lamps.
import type { IpoWindow } from "@/domain/state";

export interface ExchangePoint {
  week: number;
  composite: number; // 0..100
}
export interface Mover {
  id: string;
  name: string;
  delta: number; // percent
}

/** The same synthetic weekly wiggle the ticker tape uses, so both agree. */
export function tickNoise(id: string, week: number): number {
  let h = 2166136261;
  const s = `${id}:${week}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 900) / 100 - 4.5) * 0.8;
}

const W = 560;
const H = 132;

export function ExchangeHero({ points, window: win, rate, movers }: { points: ExchangePoint[]; window: IpoWindow; rate: number; movers: Mover[] }) {
  const comp = points[points.length - 1]?.composite ?? 50;
  const prev = points[points.length - 2]?.composite ?? comp;
  const index = 1000 + comp * 38;
  const deltaPct = prev > 0 ? ((comp - prev) / prev) * 100 : 0;
  const mood = comp >= 70 ? "euphoric" : comp >= 55 ? "risk-on" : comp >= 40 ? "choppy" : comp >= 25 ? "risk-off" : "frozen";

  const xs = points.length > 1 ? points : [{ week: 0, composite: comp }, { week: 1, composite: comp }];
  const min = Math.min(...xs.map((p) => p.composite)) - 4;
  const max = Math.max(...xs.map((p) => p.composite)) + 4;
  const px = (i: number) => (i / (xs.length - 1)) * W;
  const py = (v: number) => H - 16 - ((v - min) / Math.max(1, max - min)) * (H - 20);
  const path = xs.map((p, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(p.composite).toFixed(1)}`).join(" ");
  const up = deltaPct >= 0;
  // Session extremes + per-week "volume" (how hard the composite moved).
  const hi = 1000 + Math.max(...xs.map((p) => p.composite)) * 38;
  const lo = 1000 + Math.min(...xs.map((p) => p.composite)) * 38;
  const vols = xs.map((p, i) => (i === 0 ? 0 : Math.abs(p.composite - xs[i - 1]!.composite)));
  const maxVol = Math.max(...vols, 0.5);

  return (
    <section className="hero-panel exchange" aria-label="The Exchange">
      <div className="exchange__chart">
        <div className="exchange__head">
          <div>
            <div className="hero-kicker">The Exchange · Frontier Composite</div>
            <div className="exchange__big num">
              {index.toFixed(0)}
              <span className={`exchange__delta ${up ? "up" : "down"}`}>
                {up ? "▲" : "▼"} {Math.abs(deltaPct).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="exchange__lamps">
            <span className={`floor-lamp floor-lamp--${win}`}>IPO {win.toUpperCase()}</span>
            <span className="floor-lamp">RATES {rate.toFixed(1)}%</span>
            <span className="floor-lamp">{mood.toUpperCase()}</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="exchange__svg" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="xch-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "#3ad29a" : "#f4716f"} stopOpacity="0.28" />
              <stop offset="100%" stopColor={up ? "#3ad29a" : "#f4716f"} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.22, 0.44, 0.66].map((t) => (
            <line key={t} x1={0} y1={H * t} x2={W} y2={H * t} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          ))}
          {/* the tape's volume: how hard each week moved */}
          {vols.map((v, i) =>
            v > 0 ? (
              <rect
                key={i}
                x={px(i) - 1.6}
                y={H - 14 - (v / maxVol) * 22}
                width={3.2}
                height={(v / maxVol) * 22}
                fill={xs[i]!.composite >= xs[i - 1]!.composite ? "#3ad29a" : "#f4716f"}
                opacity={0.34}
              />
            ) : null,
          )}
          <path d={`${path} L ${W} ${H - 14} L 0 ${H - 14} Z`} fill="url(#xch-fill)" />
          <path d={path} fill="none" stroke={up ? "#3ad29a" : "#f4716f"} strokeWidth={2} className="exchange__line" />
          <circle cx={px(xs.length - 1)} cy={py(comp)} r={3.4} fill={up ? "#3ad29a" : "#f4716f"} className="exchange__dot" />
          {/* session frame */}
          <text x={2} y={H - 2} className="xch-axis">W{xs[0]!.week}</text>
          <text x={W - 2} y={H - 2} textAnchor="end" className="xch-axis">W{xs[xs.length - 1]!.week}</text>
          <text x={2} y={10} className="xch-axis">HI {hi.toFixed(0)}</text>
          <text x={2} y={22} className="xch-axis" opacity={0.7}>LO {lo.toFixed(0)}</text>
        </svg>
      </div>
      <div className="exchange__wall">
        {movers.map((m) => (
          <div key={m.id} className={`mover ${m.delta >= 0 ? "mover--up" : "mover--down"}`}>
            <span className="mover__name">{m.name}</span>
            <span className="mover__delta num">
              {m.delta >= 0 ? "+" : ""}
              {m.delta.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
