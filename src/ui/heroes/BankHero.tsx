// Capital Row — the fundraising screen's banking hall: marble columns, the
// vault, mood lighting keyed to the VC climate, and the street's indicative
// term sheet stamped for your stage.
import type { IpoWindow } from "@/domain/state";
import type { Stage } from "@/domain/ids";
import { STAGE_LABELS } from "@/domain/ids";
import { formatMoney } from "@/engine/format";

export function BankHero({ climate, rate, window: win, stage, valuation, roundSize }: { climate: number; rate: number; window: IpoWindow; stage: Stage; valuation: number; roundSize: number }) {
  // The hall's lighting follows the money: frozen blue → warm → gilded froth.
  const lamp = climate >= 72 ? "#e8c76a" : climate >= 45 ? "#ffd98a" : "#6f9cff";
  const lampOpacity = climate >= 72 ? 0.5 : climate >= 45 ? 0.34 : 0.26;
  const moodWord = climate >= 78 ? "Frothy" : climate >= 62 ? "Hot" : climate >= 42 ? "Normal" : climate >= 22 ? "Cool" : "Frozen";

  return (
    <section className="hero-panel bankhall" aria-label="Capital Row">
      <svg viewBox="0 0 900 210" className="bankhall__svg" preserveAspectRatio="xMidYMax slice" aria-hidden>
        {/* back wall + floor */}
        <rect width={900} height={210} fill="#0b0e18" />
        <rect x={0} y={176} width={900} height={34} fill="#10141f" />
        <line x1={0} y1={176} x2={900} y2={176} stroke="#232c44" strokeWidth={1.5} />
        {/* floor sheen */}
        <ellipse cx={450} cy={198} rx={330} ry={13} fill={lamp} opacity={lampOpacity * 0.25} />
        {/* pediment + columns */}
        <rect x={70} y={22} width={760} height={12} fill="#1b2234" />
        <path d="M 60 22 L 450 4 L 840 22 Z" fill="#161d2e" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect x={92 + i * 130} y={34} width={20} height={142} fill="#1c2438" />
            <rect x={88 + i * 130} y={34} width={28} height={7} fill="#242e4a" />
            <rect x={88 + i * 130} y={169} width={28} height={7} fill="#242e4a" />
          </g>
        ))}
        {/* hanging lamps, glowing with the climate */}
        {[190, 450, 710].map((x, i) => (
          <g key={x}>
            <line x1={x} y1={34} x2={x} y2={58} stroke="#2a3550" strokeWidth={1.5} />
            <circle cx={x} cy={64} r={6} fill={lamp} opacity={0.85} className="bank-lamp" style={{ animationDelay: `${i * 1.1}s` }} />
            <circle cx={x} cy={64} r={16} fill={lamp} opacity={lampOpacity} className="bank-lamp" style={{ animationDelay: `${i * 1.1}s` }} />
          </g>
        ))}
        {/* arched windows — the weather outside is the climate */}
        {[318, 582].map((wx) => (
          <g key={wx}>
            <path d={`M ${wx - 22} 130 L ${wx - 22} 78 A 22 22 0 0 1 ${wx + 22} 78 L ${wx + 22} 130 Z`} fill={climate < 30 ? "#0a0f1c" : "#101a30"} stroke="#232c44" strokeWidth={1.5} />
            {climate < 30 &&
              [0, 1, 2, 3].map((i) => (
                <line key={i} className="hall-rain" x1={wx - 14 + i * 9} y1={74} x2={wx - 17 + i * 9} y2={86} stroke="#5f7cad" strokeWidth={1.2} opacity={0.5} style={{ animationDelay: `${i * 0.35}s` }} />
              ))}
            {climate >= 62 && <circle cx={wx + 8} cy={92} r={7} fill="#e8c76a" opacity={0.35} />}
          </g>
        ))}

        {/* the vault — it swings open with the IPO window */}
        {win === "open" && <circle cx={450} cy={126} r={50} fill="none" stroke="#3ad29a" strokeWidth={1.5} opacity={0.5} className="bank-vault-open" />}
        <circle cx={450} cy={126} r={44} fill="#141a2b" stroke={win === "open" ? "#2f5a4c" : "#2c3752"} strokeWidth={3} />
        <circle cx={450} cy={126} r={33} fill={win === "open" ? "#0f1d1c" : "#101624"} stroke="#232c44" strokeWidth={2} />
        {win === "open" && <circle cx={450} cy={126} r={26} fill="#3ad29a" opacity={0.08} />}
        <g className={win === "open" ? "bank-vault bank-vault--fast" : "bank-vault"}>
          <circle cx={450} cy={126} r={12} fill="none" stroke="#3a4a6e" strokeWidth={3} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1={450} y1={126} x2={450 + 20 * Math.cos((a * Math.PI) / 180)} y2={126 + 20 * Math.sin((a * Math.PI) / 180)} stroke="#3a4a6e" strokeWidth={2.6} />
          ))}
        </g>

        {/* teller desks + the deal-flow queue (longer when the money runs hot) */}
        <rect x={180} y={148} width={110} height={28} fill="#161c2e" />
        <rect x={610} y={148} width={110} height={28} fill="#161c2e" />
        <rect x={186} y={142} width={26} height={6} fill="#ffd98a" opacity={0.3} />
        <rect x={688} y={142} width={26} height={6} fill="#ffd98a" opacity={0.3} />
        {Array.from({ length: Math.min(5, Math.max(0, Math.round(climate / 18))) }, (_, i) => (
          <g key={`qa${i}`} opacity={0.9 - i * 0.13}>
            <circle cx={306 + i * 17} cy={156} r={3} fill="#cfd9ec" />
            <rect x={303 + i * 17} y={160} width={6} height={11} rx={3} fill="#8fa2c4" />
          </g>
        ))}
        {Array.from({ length: Math.min(4, Math.max(0, Math.round(climate / 24))) }, (_, i) => (
          <g key={`qb${i}`} opacity={0.9 - i * 0.16}>
            <circle cx={736 + i * 17} cy={156} r={3} fill="#cfd9ec" />
            <rect x={733 + i * 17} y={160} width={6} height={11} rx={3} fill="#8fa2c4" />
          </g>
        ))}

        {/* gilded air when the market froths */}
        {climate >= 72 &&
          Array.from({ length: 7 }, (_, i) => (
            <circle key={i} className="bank-mote" cx={140 + i * 106} cy={170} r={1.6} fill="#e8c76a" style={{ animationDelay: `${i * 1.3}s` }} />
          ))}
      </svg>

      <div className="bankhall__overlay">
        <div>
          <div className="hero-kicker">Capital Row · the money is listening</div>
          <div className="bankhall__lamps">
            <span className="floor-lamp">CLIMATE {moodWord.toUpperCase()}</span>
            <span className="floor-lamp">RATES {rate.toFixed(1)}%</span>
            <span className={`floor-lamp floor-lamp--${win}`}>IPO {win.toUpperCase()}</span>
          </div>
        </div>
        <div className="termsheet">
          <div className="termsheet__kicker">Indicative · {STAGE_LABELS[stage] ?? stage}</div>
          <div className="termsheet__row">
            <span>Pre-money</span>
            <b className="num">{formatMoney(valuation)}</b>
          </div>
          <div className="termsheet__row">
            <span>Round size</span>
            <b className="num">{formatMoney(roundSize)}</b>
          </div>
          <div className="termsheet__stamp">THE STREET</div>
        </div>
      </div>
    </section>
  );
}
