// The Constellation — the research tree as a star map. Every node is a star:
// applied science near the ground, the frontier up among the stars. Prereq
// edges are constellation lines; completed work burns green, live programs
// pulse blue. The map IS the progress readout.
import { rnd } from "@/ui/campus/shared";

export interface ConstellationNode {
  id: string;
  name: string;
  kind: "applied" | "advanced" | "frontier" | "cross_domain";
  prereqs: string[];
  state: "locked" | "available" | "in_progress" | "complete";
}

const W = 920;
const H = 235;
const BAND: Record<ConstellationNode["kind"], [number, number]> = {
  frontier: [30, 72],
  cross_domain: [78, 110],
  advanced: [118, 156],
  applied: [164, 200],
};

function hashN(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pos(n: { id: string; kind: ConstellationNode["kind"] }): [number, number] {
  const h = hashN(n.id);
  const [lo, hi] = BAND[n.kind];
  const x = 26 + (h % 1000) / 1000 * (W - 52);
  const y = lo + rnd(h % 9973, 7) * (hi - lo);
  return [x, y];
}

const STATE_FILL: Record<ConstellationNode["state"], string> = {
  complete: "#3ad29a",
  in_progress: "#6f9cff",
  available: "#cdd8ec",
  locked: "#2c3550",
};

export function ResearchHero({ nodes }: { nodes: ConstellationNode[] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const counts = {
    complete: nodes.filter((n) => n.state === "complete").length,
    in_progress: nodes.filter((n) => n.state === "in_progress").length,
    available: nodes.filter((n) => n.state === "available").length,
  };
  return (
    <section className="hero-panel constellation" aria-label="The research constellation">
      <div className="constellation__head">
        <div className="hero-kicker">The Constellation · {nodes.length} programs charted</div>
        <div className="constellation__legend">
          <span><i style={{ background: "#3ad29a" }} /> {counts.complete} complete</span>
          <span><i style={{ background: "#6f9cff" }} /> {counts.in_progress} running</span>
          <span><i style={{ background: "#cdd8ec" }} /> {counts.available} in reach</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="constellation__svg" aria-hidden>
        <text x={14} y={44} className="constellation__band">FRONTIER</text>
        <text x={14} y={132} className="constellation__band">ADVANCED</text>
        <text x={14} y={196} className="constellation__band">APPLIED</text>
        {/* constellation lines (prereq edges) */}
        {nodes.map((n) =>
          n.prereqs.map((p) => {
            const from = byId.get(p);
            if (!from) return null;
            const [x1, y1] = pos(from);
            const [x2, y2] = pos(n);
            const lit = from.state === "complete" && (n.state === "complete" || n.state === "in_progress");
            return <line key={`${p}->${n.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={lit ? "#3ad29a" : "#26314e"} strokeWidth={lit ? 1.2 : 0.8} opacity={lit ? 0.55 : 0.4} />;
          }),
        )}
        {/* the stars */}
        {nodes.map((n) => {
          const [x, y] = pos(n);
          const r = n.kind === "frontier" ? 4 : n.kind === "cross_domain" ? 3.4 : 2.8;
          return (
            <g key={n.id}>
              <title>{`${n.name} — ${n.state.replace("_", " ")}`}</title>
              {n.state === "complete" && <circle cx={x} cy={y} r={r + 4} fill="#3ad29a" opacity={0.16} />}
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={STATE_FILL[n.state]}
                opacity={n.state === "locked" ? 0.55 : 1}
                className={n.state === "in_progress" ? "constellation__live" : n.state === "complete" ? "constellation__done" : undefined}
              />
            </g>
          );
        })}
      </svg>
    </section>
  );
}
