// ============================================================================
// ExecutivesTab.tsx — the team + the candidate market (12). Hire with the
// full ask stated; seats show morale + the domains they unlock.
// ============================================================================
import { T } from "./tokens";
import { BigValue, OutcomeButton } from "./components";
import { ExecState, Candidate, DomainDef, TraitDef } from "@/engine/late/executives";

const purple = "#bd9dff";

export function ExecutivesTab({ state, domains, traits, quality, stature, onHire, onFire }: {
  state: ExecState; domains: Record<string, DomainDef>; traits: Record<string, TraitDef>;
  quality: Record<string, number>; stature: number;
  onHire: (c: Candidate) => void; onFire: (domain: string) => void;
}) {
  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg, padding: "20px 24px" }}>
      {/* the team */}
      <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        Leadership</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 30 }}>
        {Object.values(domains).map(d => {
          const e = state.seats[d.id];
          const locked = stature < d.unlock_stature;
          return (
            <div key={d.id} style={{ padding: "14px 16px", borderRadius: 10,
              border: `1px solid ${e ? "#2c4680" : T.line}`, opacity: locked ? 0.5 : 1 }}>
              <div style={{ fontSize: 11, color: T.label }}>{d.name}</div>
              {e ? (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white }}>{e.name}</div>
                  <div style={{ fontSize: 11.5, color: T.dim, margin: "3px 0 8px" }}>
                    {e.flavor} · {e.traits.map(t => traits[t]?.name ?? t).join(", ")}</div>
                  <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                    <BigValue color="action">{Math.round((quality[d.id] ?? 0) * 100)}</BigValue>
                    <span style={{ fontSize: 11, color: T.dim }}>quality</span>
                    <span style={{ fontSize: 11, color: e.morale > 0.6 ? T.green : T.amber }}>
                      morale {Math.round(e.morale * 100)}%</span>
                    <button onClick={() => onFire(d.id)} style={{ marginLeft: "auto", background: "none",
                      border: "none", color: T.label, fontSize: 11, cursor: "pointer" }}>fire</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 6, fontSize: 12.5, color: T.dim }}>
                  {locked ? `Opens at $${(d.unlock_stature / 1000).toFixed(0)}B stature`
                    : "You hold this seat — routine decisions are yours."}
                  {d.gates_megaprojects.length > 0 && (
                    <div style={{ fontSize: 11, color: purple, marginTop: 4 }}>
                      gates {d.gates_megaprojects.length} megaprojects</div>)}
                </div>
              )}
            </div>);
        })}
      </div>

      {/* the market */}
      <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        The candidate market</div>
      {state.market.length === 0 && <div style={{ fontSize: 13, color: T.dim }}>
        No candidates in play. The market refreshes every two quarters.</div>}
      {state.market.map(cand => (
        <div key={cand.id} style={{ padding: "14px 18px", marginBottom: 10, borderRadius: 10,
          border: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: T.white }}>
              {cand.name} <span style={{ fontSize: 11.5, color: T.label, fontWeight: 400 }}>
                — {domains[cand.domain]?.name}</span></div>
            <div style={{ fontSize: 11.5, color: T.dim, marginTop: 2 }}>
              {cand.flavor} · {cand.traits.map(t => traits[t]?.name ?? t).join(", ")}</div>
          </div>
          <BigValue color="action">{cand.competence}</BigValue>
          <div style={{ textAlign: "right", fontSize: 12, color: T.dim }}>
            <div style={{ color: "#7dc4a6", fontFamily: T.mono, fontWeight: 700 }}>${cand.ask_salary}M/yr</div>
            <div>{(cand.ask_equity * 100).toFixed(1)}% equity</div>
          </div>
          <OutcomeButton verb="Hire" breakdown={[`$${cand.ask_salary}M/yr`, `${(cand.ask_equity * 100).toFixed(1)}% dilution`]}
            onClick={() => onHire(cand)} />
        </div>
      ))}
    </div>
  );
}
