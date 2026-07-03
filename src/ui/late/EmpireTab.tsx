// ============================================================================
// EmpireTab.tsx — Empire > Sub-Economies + Synergy Web (19 §3.9-3.10, the
// never-mocked cluster, built directly in the calibration language).
// Each frontier: scale, growth, net, resources, posture control. Below: the
// resource pool and the synergy web (active + locked-with-what-unlocks).
// ============================================================================
import { useState } from "react";
import { T } from "./tokens";
import { BoldTable, FilterPills, BigValue, ViewToggle, Column } from "./components";
import { SubEconState, SubEconomyDef, SynergyDef, ActiveSynergy, Posture } from "@/engine/late/empire";

const purple = "#bd9dff";

interface Row { id: string; def: SubEconomyDef; scale: number; cap: number;
  posture: Posture; netPerYear: number }

export function EmpireTab({ state, defs, synergies, activeSynergies, onPosture }: {
  state: SubEconState;
  defs: Record<string, SubEconomyDef>;
  synergies: SynergyDef[];
  activeSynergies: ActiveSynergy[];
  onPosture: (id: string, p: Posture) => void;
}) {
  const [branch, setBranch] = useState("all");
  const activeIds = new Set(activeSynergies.map(a => a.id));
  const strength = (id: string) => activeSynergies.find(a => a.id === id)?.strength ?? 0;

  let rows: Row[] = Object.values(state.instances).map(inst => {
    const def = defs[inst.def_id]!;
    const net = inst.scale * (def.produces.revenue_per_scale - def.consumes.upkeep_per_scale);
    return { id: inst.def_id, def, scale: inst.scale, cap: def.scale.scale_cap,
      posture: inst.posture, netPerYear: net };
  });
  if (branch !== "all") rows = rows.filter(r => r.def.branch === branch);

  const columns: Column<Row>[] = [
    { key: "name", header: "Frontier", render: r => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 15, color: T.white }}>
          {r.id.replace(/_/g, " ")}</div>
        <div style={{ fontSize: 11.5, color: T.dim, marginTop: 2 }}>{r.def.branch}</div>
      </div>) },
    { key: "scale", header: "Scale", numeric: true, render: r => (
      <div>
        <BigValue color="neutral">{Math.round(r.scale).toLocaleString()}</BigValue>
        <div style={{ fontSize: 10.5, color: T.label }}>of {r.cap.toLocaleString()}</div>
      </div>) },
    { key: "net", header: "Net", numeric: true, render: r =>
      <BigValue color={r.netPerYear >= 0 ? "money" : "warning"} suffix="/yr">
        {r.netPerYear >= 0 ? "+" : "−"}${Math.abs(r.netPerYear).toFixed(0)}M</BigValue> },
    { key: "out", header: "Produces", render: r => (
      <div style={{ fontSize: 12, color: T.dim }}>
        {Object.keys(r.def.produces.resources).map(res => (
          <div key={res}><span style={{ color: "#7dc4a6" }}>▸</span> {res.replace(/_/g, " ")}</div>))}
      </div>) },
    { key: "posture", header: "Posture", render: r => (
      <ViewToggle active={r.posture} onChange={p => onPosture(r.id, p as Posture)} views={[
        { id: "grow", label: "Grow" }, { id: "balanced", label: "Bal" }, { id: "harvest", label: "Harvest" },
      ]} /> ) },
  ];

  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px" }}>
        <FilterPills active={branch} onChange={setBranch} pills={[
          { id: "all", label: "All" },
          { id: "space", label: "Space" },
          { id: "intelligence", label: "Intelligence", dotColor: purple },
          { id: "energy", label: "Energy" },
          { id: "economic", label: "Economic", dotColor: T.green },
        ]} />
        <div style={{ marginLeft: "auto", fontSize: 12, color: T.dim }}>
          Frontiers operating: <b style={{ color: T.white, fontFamily: T.mono }}>
            {Object.keys(state.instances).length}</b>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "40px 24px", color: T.dim, fontSize: 14 }}>
          No frontiers yet. Complete a megaproject to open your first sub-economy —
          this is where the empire begins.
        </div>
      ) : (
        <BoldTable columns={columns} rows={rows} />
      )}

      {/* ---- Resource pool ---- */}
      {Object.keys(state.resource_pool).length > 0 && (
        <div style={{ padding: "18px 24px", borderTop: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase",
            letterSpacing: 0.5, marginBottom: 10 }}>Resource pool (feeds the synergy web)</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {Object.entries(state.resource_pool).filter(([, v]) => v > 0).map(([res, v]) => (
              <div key={res}>
                <BigValue color="money">{v.toFixed(1)}</BigValue>
                <div style={{ fontSize: 11, color: T.dim }}>{res.replace(/_/g, " ")}</div>
              </div>))}
          </div>
        </div>
      )}

      {/* ---- Synergy web: active w/ strength, locked w/ what-unlocks ---- */}
      <div style={{ padding: "18px 24px", borderTop: `1px solid ${T.line}` }}>
        <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase",
          letterSpacing: 0.5, marginBottom: 12 }}>Synergy web</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {synergies.map(syn => {
            const on = activeIds.has(syn.id);
            const pct = Math.round(strength(syn.id) * 100);
            return (
              <div key={syn.id} style={{ padding: "13px 15px", borderRadius: 9,
                border: `1px solid ${on ? "#2c4680" : T.line2}`, opacity: on ? 1 : 0.65 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? T.white : T.dim }}>
                    {syn.id.replace(/_/g, " ")}</span>
                  {on ? <BigValue color="action">{syn.activation === "flow" ? `${pct}%` : "on"}</BigValue>
                      : <span style={{ fontSize: 11, color: T.label }}>locked</span>}
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 5 }}>
                  {on
                    ? (syn.activation === "flow" ? "fed by " + (syn.fed_by_resources ?? []).join(", ").replace(/_/g, " ")
                       : "presence bonus active")
                    : (syn.activation === "flow"
                       ? "produce " + (syn.fed_by_resources ?? []).join(" or ").replace(/_/g, " ") + " to activate"
                       : "needs " + (syn.requires_fronts ?? []).map(f => f.replace(/_/g, " ")).join(" + "))}
                </div>
              </div>);
          })}
        </div>
      </div>
    </div>
  );
}
