// ============================================================================
// MegaprojectsTab.tsx — the functional-with-cinematic surface (19 §3.8):
// active builds w/ stage tracker + saga log, ready-to-commit gate checklists
// w/ clickable fix-tabs, and the repeat-build marginal readout with the exec
// diminishing-returns nudge. Composes kit + megaprojects.ts.
// ============================================================================
import { useState } from "react";
import { T } from "./tokens";
import { BigValue, SpecGrid, ExecAdviceStrip, OutcomeButton } from "./components";
import { MegaState, MegaprojectDef, ActiveMega, GateCheck, checkGate,
         buildAnotherReadout, costMult } from "@/engine/late/megaprojects";

const purple = "#bd9dff";

function StageTracker({ def, active }: { def: MegaprojectDef; active: ActiveMega }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {def.stages.map((st, i) => {
        const done = i < active.stage_idx;
        const cur = i === active.stage_idx;
        const pct = cur ? Math.round(100 * active.stage_progress_weeks / st.weeks) : done ? 100 : 0;
        return (
          <div key={st.id} style={{ flex: 1 }}>
            <div style={{ height: 6, borderRadius: 3, background: "#161c25", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`,
                background: done ? "#3f3564" : purple }} />
            </div>
            <div style={{ fontSize: 10, marginTop: 4,
              color: cur ? T.white : done ? T.dim : T.label }}>{st.name}</div>
          </div>
        );
      })}
    </div>
  );
}

export function MegaprojectsTab({ state, defs, gateCtx, sagaLog, execName, onBegin }: {
  state: MegaState;
  defs: Record<string, MegaprojectDef>;
  gateCtx: Parameters<typeof checkGate>[1];
  sagaLog: Record<string, { week: number; text: string }[]>;   // def_id -> beats
  execName: string;
  onBegin: (def: MegaprojectDef) => void;
}) {
  const [expandedSaga, setExpandedSaga] = useState<string | null>(null);
  const activeIds = new Set(state.active.map(a => a.def_id));

  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg, padding: "16px 24px" }}>
      {/* ---- ACTIVE BUILDS: stage tracker + expandable saga ---- */}
      {state.active.map(a => {
        const def = defs[a.def_id]!;
        const beats = sagaLog[a.def_id] ?? [];
        return (
          <div key={a.def_id} style={{ marginBottom: 18, padding: "18px 20px", borderRadius: 12,
            border: "1px solid #2c2448", background: "linear-gradient(180deg,#0d0a16,#0a0d12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.white }}>
                {def.name}{a.copy_n > 1 && <span style={{ color: purple }}> · #{a.copy_n}</span>}</div>
              <BigValue color="power">stage {a.stage_idx + 1}/{def.stages.length}</BigValue>
            </div>
            <div style={{ margin: "14px 0" }}><StageTracker def={def} active={a} /></div>
            {beats.length > 0 && (
              <div>
                <button onClick={() => setExpandedSaga(expandedSaga === a.def_id ? null : a.def_id)}
                  style={{ fontSize: 11.5, color: T.dim, background: "none", border: "none",
                    cursor: "pointer", padding: 0 }}>
                  {expandedSaga === a.def_id ? "▾" : "▸"} Build log ({beats.length})
                </button>
                {expandedSaga === a.def_id && (
                  <div style={{ marginTop: 10, borderLeft: `2px solid ${T.line}`, paddingLeft: 14 }}>
                    {beats.slice(-6).map((b, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: T.dim, margin: "6px 0" }}>
                        <span style={{ fontFamily: T.mono, color: T.label }}>wk {b.week}</span> — {b.text}
                      </div>))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ---- READY / GATED: the briefed commit + convergence checklists ---- */}
      {Object.values(defs).filter(d => !activeIds.has(d.id)).map(def => {
        const copies = state.builds[def.id] ?? 0;
        const gate: GateCheck = checkGate(def, gateCtx);
        const nextCost = Math.round(
          def.stages.reduce((s, st) => s + st.cost, 0) * costMult(copies + 1));
        const repeat = copies > 0 && def.repeatable;
        const readout = repeat ? buildAnotherReadout(def, copies) : null;
        if (copies > 0 && !def.repeatable) {
          return (
            <div key={def.id} style={{ marginBottom: 14, padding: "14px 20px", borderRadius: 10,
              border: `1px solid ${T.line}`, opacity: 0.75 }}>
              <span style={{ color: T.green }}>✓</span> <b style={{ color: T.white }}>{def.name}</b>
              <span style={{ color: T.dim, fontSize: 13 }}> — complete. A monument.</span>
            </div>);
        }
        return (
          <div key={def.id} style={{ marginBottom: 14, padding: "18px 20px", borderRadius: 12,
            border: `1px solid ${gate.met ? "#2c2448" : T.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: gate.met ? T.white : T.dim }}>
                {def.name}{repeat && <span style={{ fontSize: 12, color: purple }}> · build #{copies + 1}</span>}</div>
              <BigValue color={gate.met ? "power" : "neutral"}>${nextCost}M</BigValue>
            </div>
            {!gate.met ? (
              <div style={{ marginTop: 12 }}>
                {gate.items.map(it => (
                  <div key={it.label} style={{ fontSize: 13, margin: "5px 0",
                    color: it.met ? T.dim : T.txt }}>
                    <span style={{ color: it.met ? T.green : T.amber }}>{it.met ? "✓" : "○"}</span>{" "}
                    {it.label}
                    {!it.met && it.fix_tab && <a style={{ color: T.blue, marginLeft: 8, fontSize: 12,
                      cursor: "pointer" }}>→ {it.fix_tab}</a>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 14 }}>
                {readout && (
                  <div style={{ marginBottom: 14 }}>
                    <SpecGrid cells={[
                      { label: "Cost", value: `${Math.round(readout.cost_mult * 100)}%` },
                      { label: "Output added", value: `+${readout.output_add}`, color: "money" },
                      { label: "Power added", value: `+${readout.power_add}`, color: "power" },
                    ]} />
                    {readout.diversify_hint && (
                      <ExecAdviceStrip execName={execName} initials={execName.split(" ").map(x => x[0]).join("")}
                        reasoning="The returns on another copy are thinning — the capital might build something new instead. Your call; the floor value is still real." />
                    )}
                  </div>
                )}
                <OutcomeButton verb={repeat ? "Build another" : "Begin megaproject"} variant="government"
                  breakdown={[`$${nextCost}M`, `~${def.stages.reduce((s, st) => s + st.weeks, 0)} wk`,
                    repeat ? `+${readout!.output_add} output` : `opens ${def.on_complete.sub_economy}`]}
                  onClick={() => onBegin(def)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
