// The Works — megaprojects as rising monuments. Each active build renders as
// its branch's silhouette filling with light as stages complete, scaffolding
// and crane over the live one; finished monuments stand small and gold.
export interface MegaWork {
  id: string;
  name: string;
  branch: "space" | "intelligence" | "energy" | "economic";
  progress: number; // 0..1
  stageName: string;
  copy: number;
  /** Stage rail: how many stages, and which one is live. */
  stagesTotal?: number;
  stageIdx?: number;
}

const W = 920;
const H = 225;
const GY = 196; // ground line

const BRANCH_COLOR: Record<MegaWork["branch"], string> = {
  space: "#6f9cff",
  intelligence: "#bd9dff",
  energy: "#e8c76a",
  economic: "#3ad29a",
};

/** A monument silhouette per branch, drawn inside a bay. */
function Silhouette({ branch, cx, ghost }: { branch: MegaWork["branch"]; cx: number; ghost?: boolean }) {
  const stroke = ghost ? "#232c44" : "#31405f";
  switch (branch) {
    case "space":
      return (
        <g>
          <path d={`M ${cx - 66} ${GY} A 66 66 0 0 1 ${cx + 66} ${GY}`} fill="none" stroke={stroke} strokeWidth={6} />
          <line x1={cx} y1={GY - 96} x2={cx} y2={GY} stroke={stroke} strokeWidth={4} />
        </g>
      );
    case "intelligence":
      return <polygon points={`${cx - 34},${GY} ${cx - 10},${GY - 112} ${cx + 10},${GY - 112} ${cx + 34},${GY}`} fill="none" stroke={stroke} strokeWidth={4} />;
    case "energy":
      return (
        <g>
          <path d={`M ${cx - 46} ${GY} A 46 46 0 0 1 ${cx + 46} ${GY}`} fill="none" stroke={stroke} strokeWidth={4} />
          <line x1={cx} y1={GY - 104} x2={cx} y2={GY - 40} stroke={stroke} strokeWidth={4} />
          <circle cx={cx} cy={GY - 108} r={7} fill="none" stroke={stroke} strokeWidth={3} />
        </g>
      );
    case "economic":
      return (
        <g>
          <rect x={cx - 56} y={GY - 84} width={30} height={84} fill="none" stroke={stroke} strokeWidth={4} />
          <rect x={cx + 26} y={GY - 84} width={30} height={84} fill="none" stroke={stroke} strokeWidth={4} />
          <line x1={cx - 26} y1={GY - 64} x2={cx + 26} y2={GY - 64} stroke={stroke} strokeWidth={4} />
        </g>
      );
  }
}

function Bay({ work, cx }: { work: MegaWork; cx: number }) {
  const color = BRANCH_COLOR[work.branch];
  const fillH = Math.max(4, 116 * work.progress);
  const stages = work.stagesTotal ?? 0;
  return (
    <g>
      {/* the light rising inside the silhouette */}
      <clipPath id={`mega-clip-${work.id}-${work.copy}`}>
        <rect x={cx - 70} y={GY - fillH} width={140} height={fillH} />
      </clipPath>
      <g clipPath={`url(#mega-clip-${work.id}-${work.copy})`}>
        <rect x={cx - 70} y={GY - 120} width={140} height={120} fill={color} opacity={0.16} className="work-glow" />
      </g>
      {/* welding sparks at the build line */}
      {[0, 1].map((i) => (
        <circle key={i} className="work-spark" cx={cx - 26 + i * 50} cy={GY - fillH} r={1.6} fill="#ffd98a" style={{ animationDelay: `${i * 0.9 + 0.2}s` }} />
      ))}
      <Silhouette branch={work.branch} cx={cx} />
      {/* scaffolding */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={cx - 62} y1={GY - 24 - i * 34} x2={cx + 62} y2={GY - 24 - i * 34} stroke="#26314e" strokeWidth={1.4} opacity={0.8} />
      ))}
      {/* crane */}
      <g>
        <rect x={cx + 74} y={GY - 128} width={5} height={128} fill="#2c3752" />
        <rect x={cx + 52} y={GY - 133} width={64} height={4} fill="#2c3752" />
        <line x1={cx + 96} y1={GY - 129} x2={cx + 96} y2={GY - 100} stroke="#3a4a6e" strokeWidth={1.4} />
        <circle cx={cx + 76.5} cy={GY - 135} r={2.4} className="cmp-beacon" />
      </g>
      <text x={cx} y={GY + 16} textAnchor="middle" className="mega-bay__name">
        {work.name.toUpperCase()}
        {work.copy > 1 ? ` #${work.copy}` : ""}
      </text>
      <text x={cx} y={GY + 30} textAnchor="middle" className="mega-bay__stage" fill={color}>
        {work.stageName} · {Math.round(work.progress * 100)}%
      </text>
      {/* stage rail */}
      {stages > 1 &&
        Array.from({ length: stages }, (_, i) => (
          <circle
            key={i}
            cx={cx - ((stages - 1) * 14) / 2 + i * 14}
            cy={GY + 42}
            r={3}
            fill={i < (work.stageIdx ?? 0) ? color : "transparent"}
            stroke={i === (work.stageIdx ?? 0) ? color : "#31405f"}
            strokeWidth={1.4}
            className={i === (work.stageIdx ?? 0) ? "exchange__dot" : undefined}
          />
        ))}
    </g>
  );
}

export function MegaHero({ works, done, slots }: { works: MegaWork[]; done: { name: string; count: number }[]; slots: { used: number; total: number } }) {
  const bays = [190, 470, 750];
  const ghosts: MegaWork["branch"][] = ["space", "energy", "intelligence"];
  return (
    <section className="hero-panel megaworks" aria-label="The Works">
      <div className="megaworks__head">
        <div className="hero-kicker">The Works · monuments in progress</div>
        <div className="megaworks__meta">
          <span className="floor-lamp">SLOTS {slots.used}/{slots.total}</span>
          {done.length > 0 && (
            <span className="floor-lamp floor-lamp--gold">
              {done.reduce((s, d) => s + d.count, 0)} STANDING
            </span>
          )}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="megaworks__svg" aria-hidden>
        {Array.from({ length: 34 }, (_, i) => (
          <circle key={i} cx={(i * 271) % W} cy={12 + ((i * 97) % 150)} r={0.7 + (i % 3) * 0.3} fill="#cdd8ec" opacity={0.35} className="cmp-star" style={{ animationDelay: `${(i % 6) * 1.1}s` }} />
        ))}
        <line x1={0} y1={GY} x2={W} y2={GY} stroke="#232c44" strokeWidth={1.5} />
        {works.slice(0, 3).map((w, i) => (
          <Bay key={`${w.id}-${w.copy}`} work={w} cx={bays[i]!} />
        ))}
        {works.length === 0 &&
          ghosts.map((b, i) => (
            <g key={b} opacity={0.5}>
              <Silhouette branch={b} cx={bays[i]!} ghost />
              <text x={bays[i]!} y={GY + 16} textAnchor="middle" className="mega-bay__ghost">
                AWAITING GROUNDBREAK
              </text>
            </g>
          ))}
      </svg>
    </section>
  );
}
