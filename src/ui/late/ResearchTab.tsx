// ============================================================================
// ResearchTab.tsx — Research & Frontier: the goal-path planner tab.
// Composes the kit + research.ts (computeGoalPath). 19 §3.4: pick a frontier
// goal -> see the prereq chain, parallel-front timing, the blocker, and
// what to start NOW. Everything clickable; numbers outcome-framed.
// ============================================================================
import { useMemo, useState } from "react";
import { T } from "./tokens";
import { BoldTable, FilterPills, BigValue, OutcomeButton,
         useDrillIn, Column } from "./components";
import { ResearchState, ResearchNode, computeGoalPath, slotsUsed } from "@/engine/late/research";

interface Row { id: string; n: ResearchNode; state: string; pct: number }

export function ResearchTab({ state, nodes, onStart }: {
  state: ResearchState; nodes: Record<string, ResearchNode>;
  ctoName: string; onStart: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [goal, setGoal] = useState<string | null>(null);
  const [openId, toggle] = useDrillIn();

  const rows: Row[] = useMemo(() => {
    let r = Object.values(nodes).map(n => {
      const st = state.nodes[n.id]!;
      return { id: n.id, n, state: st.state,
        pct: st.state === "complete" ? 100 : st.state === "in_progress"
          ? Math.round(100 * st.progress_weeks / n.weeks) : 0 };
    });
    if (filter !== "all") r = r.filter(x => x.n.kind === filter);
    const order: Record<string, number> = { in_progress: 0, available: 1, locked: 2, complete: 3 };
    return r.sort((a, b) => (order[a.state] ?? 9) - (order[b.state] ?? 9));
  }, [nodes, state, filter]);

  const path = useMemo(() => goal
    ? computeGoalPath(state, nodes, goal) : null, [goal, nodes, state]);

  const stateColor: Record<string, string> = {
    complete: T.green, in_progress: T.blue, available: T.white, locked: T.label };

  const columns: Column<Row>[] = [
    { key: "name", header: "Program", render: r => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, color: stateColor[r.state] }}>
          {r.state === "locked" ? "🔒 " : ""}{r.n.name}</div>
        <div style={{ fontSize: 11.5, color: T.dim, marginTop: 2 }}>
          {r.n.sub_industry.replace(/_/g, " ")} · {r.n.kind}</div>
      </div>) },
    { key: "cost", header: "Cost", numeric: true, render: r =>
      <BigValue color="neutral">${r.n.cost}M</BigValue> },
    { key: "time", header: "Time", numeric: true, render: r =>
      <span style={{ fontFamily: T.mono, fontSize: 14, color: T.dim }}>{r.n.weeks} wk</span> },
    { key: "prog", header: "Progress", numeric: true, render: r =>
      r.state === "in_progress"
        ? <BigValue color="action">{r.pct}%</BigValue>
        : <span style={{ fontSize: 12.5, color: stateColor[r.state] }}>{r.state.replace("_", " ")}</span> },
  ];

  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px" }}>
        <FilterPills active={filter} onChange={setFilter} pills={[
          { id: "all", label: "All" },
          { id: "core", label: "Core" },
          { id: "advanced", label: "Advanced" },
          { id: "frontier", label: "Frontier", dotColor: T.purple },
        ]} />
        <div style={{ marginLeft: "auto", fontSize: 12, color: T.dim }}>
          Research slots: <b style={{ color: T.white, fontFamily: T.mono }}>
            {slotsUsed(state)}/{state.slots_total}</b>
        </div>
      </div>

      {/* The goal-path planner — the "how do I get to AGI" answer */}
      {path && (
        <div style={{ margin: "0 24px 16px", padding: "16px 18px", borderRadius: 10,
          border: "1px solid #2c2448", background: "#0d0a16" }}>
          <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Path to {nodes[goal!]?.name}</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <BigValue color="power" size="lg">~{path.remaining_weeks} wk</BigValue>
            <span style={{ color: T.dim, marginLeft: 10 }}>
              · ${path.remaining_cost}M · {path.ordered.length} programs · blocker:{" "}
              <b style={{ color: T.amber }}>{path.blocker ?? "none"}</b></span>
          </div>
          {path.start_now.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {path.start_now.map(id => (
                <OutcomeButton key={id} verb={`Start ${nodes[id]!.name}`}
                  breakdown={[`$${nodes[id]!.cost}M`, `${nodes[id]!.weeks} wk`]}
                  onClick={() => onStart(id)} />
              ))}
            </div>
          )}
        </div>
      )}

      <BoldTable columns={columns} rows={rows} openId={openId}
        onRowClick={r => toggle(r.id)} renderDetail={r => (
          <div>
            <div style={{ fontSize: 13, color: T.dim, marginBottom: 14 }}>
              {r.n.prereqs.length
                ? <>Requires: {r.n.prereqs.map(p => nodes[p]?.name ?? p).join(", ")}</>
                : "No prerequisites."}
              {r.n.gates_megaproject && <span style={{ color: "#bd9dff" }}>
                {" "}· Gates megaproject: <b>{r.n.gates_megaproject.replace(/_/g, " ")}</b></span>}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {r.state === "available" && (
                <OutcomeButton verb="Start research"
                  breakdown={[`$${r.n.cost}M`, `${r.n.weeks} wk`]} onClick={() => onStart(r.id)} />
              )}
              <OutcomeButton verb="Set as goal" variant="pass"
                breakdown={["compute the path"]} onClick={() => setGoal(r.id)} />
            </div>
          </div>
        )} />
    </div>
  );
}
