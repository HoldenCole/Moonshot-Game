// ============================================================================
// FoundingInterstitial.tsx — the loading screen as a MOMENT. Two modes:
//   founding: wk-0 articles-of-incorporation scene after "Found <company>"
//   loading:  generic load-in (continue a save) with rotating in-world lines
// The trajectory is the progress bar; era ticks light as the head passes.
// Content: loading_lines.toml (founding line per sub-industry + generic pool).
// ============================================================================
import { useEffect, useRef, useState } from "react";

export interface FoundingFacts {
  companyName: string; founderName: string; frontierLabel: string;
  cashLabel: string; employees: number; eraName: string;
  foundingLine: string;                     // from loading_lines.toml [founding]
}
export interface LoadStage { at: number; html: string }   // at: 0..1

export function FoundingInterstitial({ mode, facts, genericLines, stages, progress, onDone }: {
  mode: "founding" | "loading";
  facts?: FoundingFacts;
  genericLines?: string[];                  // loading mode: rotating quips
  stages?: LoadStage[];                     // founding mode: staged labels
  progress?: number;                        // 0..1 external; undefined = self-timed
  onDone?: () => void;
}) {
  const fillRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const [p, setP] = useState(0);
  const [label, setLabel] = useState("assembling the world…");
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // self-timed progress when uncontrolled
  useEffect(() => {
    if (progress !== undefined) { setP(progress); return; }
    if (reduce) { setP(1); return; }
    const t = setInterval(() => setP(v => {
      const n = Math.min(1, v + 0.012 + Math.random() * 0.02);
      if (n >= 1) clearInterval(t);
      return n;
    }), 60);
    return () => clearInterval(t);
  }, [progress, reduce]);

  // drive the arc + head + labels
  useEffect(() => {
    const fill = fillRef.current, head = headRef.current;
    if (!fill || !head) return;
    const L = fill.getTotalLength();
    fill.style.strokeDasharray = `${L}`;
    fill.style.strokeDashoffset = `${L * (1 - p)}`;
    const pt = fill.getPointAtLength(L * p);
    head.setAttribute("cx", `${pt.x}`); head.setAttribute("cy", `${pt.y}`);
    head.style.opacity = "1";
    if (mode === "founding" && stages) {
      const s = [...stages].reverse().find(st => p >= st.at - 0.17);
      if (s) setLabel(s.html);
    }
    if (p >= 1 && onDone) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); }
  }, [p, mode, stages, onDone]);

  // loading mode: rotate the quips
  useEffect(() => {
    if (mode !== "loading" || !genericLines?.length) return;
    setLabel(genericLines[Math.floor(Math.random() * genericLines.length)]!);
    const t = setInterval(() =>
      setLabel(genericLines[Math.floor(Math.random() * genericLines.length)]!), 2600);
    return () => clearInterval(t);
  }, [mode, genericLines]);

  return (
    <div className="fi">
      <div className="fi__doc">
        {mode === "founding" && facts ? (
          <>
            <div className="fi__kicker">Articles of Incorporation</div>
            <div className="fi__date">Week 0 · filed this day</div>
            <h1 className="fi__company">{facts.companyName.toUpperCase()}</h1>
            <div className="fi__founder">Founded by <b>{facts.founderName}</b> · {facts.frontierLabel} · {facts.eraName}</div>
            <div className="fi__facts">
              <Fact v={facts.cashLabel} k="War chest" tone="cash" />
              <Fact v={facts.frontierLabel} k="Frontier" tone="frontier" />
              <Fact v={`${facts.employees}`} k="Employees" />
              <Fact v={facts.eraName} k="Era" tone="era" />
            </div>
            <p className="fi__scene">{facts.foundingLine}</p>
          </>
        ) : (
          <>
            <div className="fi__kicker">Moonshot Inc</div>
            <div className="fi__date">resuming the run</div>
          </>
        )}

        <div className="fi__prog">
          <svg viewBox="0 0 560 74">
            <defs>
              <linearGradient id="fi-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent, #6f9cff)" />
                <stop offset="38%" stopColor="var(--up, #3ad29a)" />
                <stop offset="72%" stopColor="var(--power, #bd9dff)" />
                <stop offset="100%" stopColor="var(--gold, #e8c76a)" />
              </linearGradient>
            </defs>
            <path className="fi__ghost" d="M 8 66 C 190 62, 330 44, 420 28 S 530 8, 552 5" />
            <path ref={fillRef} className="fi__fill" d="M 8 66 C 190 62, 330 44, 420 28 S 530 8, 552 5" />
            {[[8, 66, "var(--accent, #6f9cff)", 0], [215, 59, "var(--up, #3ad29a)", 0.37],
              [424, 27, "var(--power, #bd9dff)", 0.74], [552, 5, "var(--gold, #e8c76a)", 0.985]].map(([x, y, c, th], i) => (
              <circle key={i} className={`fi__tick${p >= (th as number) ? " lit" : ""}`}
                cx={x as number} cy={y as number} r={i === 3 ? 4 : 3.5} stroke={c as string} />
            ))}
            <circle ref={headRef} className="fi__head" r={3.2} />
          </svg>
          <div className="fi__label" dangerouslySetInnerHTML={{ __html: label }} />
        </div>
      </div>
    </div>
  );
}

function Fact({ v, k, tone }: { v: string; k: string; tone?: "cash" | "frontier" | "era" }) {
  return (
    <div className="fi-fact">
      <div className={`fi-fact__v${tone ? ` fi-fact__v--${tone}` : ""}`}>{v}</div>
      <div className="fi-fact__k">{k}</div>
    </div>
  );
}
