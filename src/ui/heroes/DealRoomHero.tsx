// The Deal Room — the contracts screen's back office: the identity dial
// (commercial ↔ state), the entanglement thermometer, live deals as folders
// with their terms running down, and the clearances on the wall.
export interface DealFolder {
  id: string;
  name: string;
  weeksLeft: number;
  termWeeks: number;
  gov: boolean;
  perYear: number;
}

export function DealRoomHero({ share, identity, entanglement, deals, marketCount, refreshWeeks, clearances }: { share: number; identity: string; entanglement: number; deals: DealFolder[]; marketCount: number; refreshWeeks: number; clearances: string[] }) {
  const needle = Math.PI - share * Math.PI; // 0 → left (commercial), 1 → right (state)
  const nx = 130 + 78 * Math.cos(needle);
  const ny = 150 - 78 * Math.sin(needle);
  const tubeH = 132;
  const fill = Math.min(1, entanglement / 100) * tubeH;

  return (
    <section className="hero-panel dealroom" aria-label="The Deal Room">
      <div className="observatory__head">
        <div className="hero-kicker">The Deal Room · {deals.length} live · {marketCount} on the table</div>
        <div className="exchange__lamps">
          <span className="floor-lamp">{identity.toUpperCase()}</span>
          <span className="floor-lamp">NEW PAPER IN {Math.max(0, refreshWeeks)}W</span>
        </div>
      </div>
      <svg viewBox="0 0 920 230" className="dealroom__svg" aria-hidden>
        {/* identity dial */}
        <path d="M 52 150 A 78 78 0 0 1 208 150" fill="none" stroke="#26314e" strokeWidth={9} strokeLinecap="round" />
        <path d="M 52 150 A 78 78 0 0 1 130 72" fill="none" stroke="#46d6c8" strokeWidth={9} strokeLinecap="round" opacity={0.4} />
        <path d="M 130 72 A 78 78 0 0 1 208 150" fill="none" stroke="#bd9dff" strokeWidth={9} strokeLinecap="round" opacity={0.4} />
        <line x1={130} y1={150} x2={nx} y2={ny} stroke="#e7ecf4" strokeWidth={2.6} className="obs-needle" />
        <circle cx={130} cy={150} r={4.5} fill="#e7ecf4" />
        <text x={46} y={172} className="obs-label">COMMERCIAL</text>
        <text x={214} y={172} textAnchor="end" className="obs-label">STATE</text>
        <text x={130} y={192} textAnchor="middle" className="orr-name">{identity}</text>
        <text x={130} y={208} textAnchor="middle" className="obs-label num">{Math.round(share * 100)}% GOVERNMENT REVENUE</text>

        {/* entanglement thermometer */}
        <g transform="translate(268, 34)">
          <rect x={0} y={0} width={20} height={tubeH} rx={10} fill="#141a2b" stroke="#2a3550" strokeWidth={1.4} />
          <rect x={3} y={tubeH - fill + 3} width={14} height={Math.max(4, fill - 6)} rx={7} fill="#f0b54e" opacity={0.85} className="deal-heat" />
          {[25, 50, 75].map((t) => (
            <line key={t} x1={20} y1={tubeH - (t / 100) * tubeH} x2={26} y2={tubeH - (t / 100) * tubeH} stroke="#3a4a6e" strokeWidth={1.4} />
          ))}
          <circle cx={10} cy={tubeH + 12} r={14} fill="#f0b54e" opacity={0.25} />
          <circle cx={10} cy={tubeH + 12} r={9} fill="#f0b54e" opacity={0.8} />
          <text x={10} y={tubeH + 40} textAnchor="middle" className="obs-label">ENTANGLED</text>
          <text x={10} y={tubeH + 54} textAnchor="middle" className="orr-name num">{Math.round(entanglement)}</text>
        </g>

        {/* live deals as folders */}
        {deals.slice(0, 4).map((d, i) => {
          const x = 360 + i * 138;
          const done = 1 - d.weeksLeft / Math.max(1, d.termWeeks);
          return (
            <g key={d.id}>
              <title>{`${d.name} — ${d.weeksLeft}w left`}</title>
              <path d={`M ${x} 66 L ${x + 34} 66 L ${x + 42} 58 L ${x + 122} 58 L ${x + 122} 66 L ${x + 122} 150 L ${x} 150 Z`} fill="#151c2e" stroke="#2a3550" strokeWidth={1.2} />
              <circle cx={x + 12} cy={78} r={3.4} fill={d.gov ? "#bd9dff" : "#46d6c8"} />
              <text x={x + 22} y={82} className="office-name">{d.name.slice(0, 15)}</text>
              <text x={x + 10} y={102} className="obs-label">${d.perYear}M/YR{d.gov ? " · GOV" : ""}</text>
              <rect x={x + 10} y={116} width={102} height={6} rx={3} fill="#10162a" />
              <rect x={x + 10} y={116} width={Math.max(4, done * 102)} height={6} rx={3} fill={d.gov ? "#bd9dff" : "#46d6c8"} opacity={0.85} />
              <text x={x + 10} y={138} className="obs-label num">{d.weeksLeft}W LEFT</text>
            </g>
          );
        })}
        {deals.length === 0 && (
          <g>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M ${380 + i * 150} 66 L ${414 + i * 150} 66 L ${422 + i * 150} 58 L ${502 + i * 150} 58 L ${502 + i * 150} 150 L ${380 + i * 150} 150 Z`} fill="none" stroke="#232c44" strokeWidth={1.2} strokeDasharray="4 4" />
            ))}
            <text x={600} y={110} textAnchor="middle" className="office-vacant">NO PAPER SIGNED — THE MARKET IS BELOW</text>
          </g>
        )}

        {/* clearances on the wall */}
        <g transform="translate(360, 186)">
          <text x={0} y={0} className="obs-label">CLEARANCES:</text>
          {clearances.length === 0 ? (
            <text x={86} y={0} className="office-vacant">NONE HELD</text>
          ) : (
            clearances.slice(0, 4).map((c, i) => (
              <g key={c} transform={`translate(${86 + i * 130}, -11)`}>
                <rect width={118} height={17} rx={8.5} fill="rgba(189,157,255,0.12)" stroke="rgba(189,157,255,0.45)" strokeWidth={1} />
                <text x={59} y={12} textAnchor="middle" className="deal-clearance">{c.replace(/_/g, " ").toUpperCase().slice(0, 17)}</text>
              </g>
            ))
          )}
        </g>
      </svg>
    </section>
  );
}
