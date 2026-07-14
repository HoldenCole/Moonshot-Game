// The Map of Power — the standing screen's war room: the power meter climbing
// toward sovereignty, the stature race against the titans, and the wall of
// legacies — gold where your name is carved, red where a rival got there first.
export interface RaceRow {
  id: string;
  name: string;
  stature: number; // $M
  phase: "research" | "build" | "done";
  surging: boolean;
  you?: boolean;
  color: string;
}

export interface LegacyPlaque {
  id: string;
  name: string;
  by: "you" | "rival" | null;
  byName?: string;
}

export function PowerMapHero({ power, reputation, regulation, era, race, legacies }: { power: number; reputation: number; regulation: number; era: string; race: RaceRow[]; legacies: LegacyPlaque[] }) {
  const maxStature = Math.max(...race.map((r) => r.stature), 1);
  const bar = (v: number) => 30 + (Math.log10(Math.max(100, v)) / Math.log10(Math.max(1000, maxStature))) * 250;
  const rows = [...race].sort((a, b) => b.stature - a.stature).slice(0, 7);

  return (
    <section className="hero-panel powermap" aria-label="The Map of Power">
      <div className="observatory__head">
        <div className="hero-kicker">The Map of Power · {era}</div>
        <div className="exchange__lamps">
          <span className="floor-lamp">REPUTATION {Math.round(reputation)}</span>
          <span className="floor-lamp">REGULATION {Math.round(regulation)}</span>
        </div>
      </div>
      <svg viewBox="0 0 920 235" className="powermap__svg" aria-hidden>
        {/* the power meter: seven rungs to sovereignty */}
        <g transform="translate(30, 20)">
          <text x={60} y={4} textAnchor="middle" className="obs-label">POWER {power.toFixed(1)} / 7</text>
          {Array.from({ length: 7 }, (_, i) => {
            const idx = 6 - i;
            const lit = power >= idx + 1;
            const partial = !lit && power > idx;
            return (
              <g key={i}>
                <rect x={20} y={14 + i * 26} width={80} height={20} rx={4} fill={lit ? "rgba(189,157,255,0.35)" : "#141a2b"} stroke={lit || partial ? "#bd9dff" : "#232c44"} strokeWidth={1.2} className={lit && idx === Math.floor(power) - 0 ? "power-rung" : undefined} />
                {partial && <rect x={20} y={14 + i * 26} width={80 * (power - idx)} height={20} rx={4} fill="rgba(189,157,255,0.25)" />}
                <text x={60} y={28 + i * 26} textAnchor="middle" className="obs-label" fill={lit ? "#d9c8ff" : "#3d4a63"}>{idx + 1}</text>
              </g>
            );
          })}
          <text x={60} y={210} textAnchor="middle" className="obs-label">SOVEREIGNTY AT 5+</text>
        </g>

        {/* the stature race */}
        <g transform="translate(180, 22)">
          <text x={0} y={0} className="obs-label">THE RACE · MARKET STATURE</text>
          {rows.map((r, i) => (
            <g key={r.id} transform={`translate(0, ${14 + i * 26})`}>
              <title>{`${r.name} — $${(r.stature / 1000).toFixed(1)}B · ${r.phase}${r.surging ? " · CRASH PROGRAM" : ""}`}</title>
              <text x={0} y={13} className={r.you ? "race-you" : "office-name"}>{r.name.slice(0, 16)}</text>
              <rect x={128} y={4} width={280} height={12} rx={6} fill="#10162a" />
              <rect x={128} y={4} width={bar(r.stature)} height={12} rx={6} fill={r.color} opacity={r.you ? 0.95 : 0.6} className={r.you ? "race-bar-you" : undefined} />
              <text x={416} y={14} className="obs-label num">${(r.stature / 1000).toFixed(1)}B</text>
              {r.surging && <text x={470} y={14} className="race-surge">⚡ SURGING</text>}
              {r.phase === "build" && !r.surging && <text x={470} y={14} className="obs-label">BUILDING</text>}
            </g>
          ))}
        </g>

        {/* the wall of legacies */}
        <g transform="translate(756, 22)">
          <text x={0} y={0} className="obs-label">FIRST-IN-HISTORY</text>
          {legacies.slice(0, 6).map((l, i) => {
            const tone = l.by === "you" ? "#e8c76a" : l.by === "rival" ? "#f4716f" : "#3d4a63";
            return (
              <g key={l.id} transform={`translate(0, ${12 + i * 31})`}>
                <title>{l.by === "you" ? `${l.name} — yours, forever` : l.by === "rival" ? `${l.name} — claimed by ${l.byName}` : `${l.name} — unclaimed`}</title>
                <rect width={148} height={25} rx={4} fill={l.by === "you" ? "rgba(232,199,106,0.12)" : l.by === "rival" ? "rgba(244,113,111,0.08)" : "transparent"} stroke={tone} strokeWidth={1.1} />
                <text x={9} y={16.5} className="plaque-name" fill={l.by ? "#e7ecf4" : "#4b566b"}>{l.name.slice(0, 18)}</text>
                <text x={139} y={16.5} textAnchor="end" className="plaque-mark" fill={tone}>
                  {l.by === "you" ? "♛ YOU" : l.by === "rival" ? "✕" : "—"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </section>
  );
}
