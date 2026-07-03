// ============================================================================
// StandingTab.tsx — Your Standing: the power meter, entanglement, identity,
// and what the next tier means (from the your_standing mock, 17/19).
// ============================================================================
import { T } from "./tokens";
import { SpecGrid } from "./components";
import { GameSlice, GameContent } from "@/engine/late/turn";
import { govShare, mixIdentity } from "@/engine/late/contracts";
import { rivalStanding, rivalThreat } from "@/engine/late/rivals";

const purple = "#bd9dff";
const TIERS = [
  { at: 0, label: "Unnoticed" }, { at: 1, label: "A name in the industry" },
  { at: 2, label: "Strategically relevant" }, { at: 3, label: "A national asset" },
  { at: 4, label: "Geopolitically significant" }, { at: 5, label: "A peer of states" },
  { at: 6, label: "Indispensable" }, { at: 7, label: "More powerful than government" },
];

export function StandingTab({ s, c }: { s: GameSlice; c: GameContent }) {
  const power = s.powerAxis.power;
  const share = govShare(s.contracts, c.contractTemplates, c.customers);
  const identity = mixIdentity(share);
  const tier = [...TIERS].reverse().find(t => power >= t.at)!;
  const next = TIERS.find(t => t.at > power);
  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg, padding: "22px 24px", maxWidth: 860 }}>
      {/* the power meter */}
      <div style={{ fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5 }}>Power</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, margin: "6px 0 10px" }}>
        <span style={{ fontFamily: T.mono, fontSize: 34, fontWeight: 700, color: purple }}>{power}</span>
        <span style={{ fontSize: 16, color: T.white, fontWeight: 600 }}>{tier.label}</span>
        {next && <span style={{ fontSize: 12, color: T.dim }}>next: {next.label} at {next.at}</span>}
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 26 }}>
        {TIERS.slice(1).map(t => (
          <div key={t.at} style={{ flex: 1, height: 8, borderRadius: 4,
            background: power >= t.at ? purple : "#181423" }} title={t.label} />))}
      </div>

      {/* the mix identity */}
      <SpecGrid cells={[
        { label: "Identity", value: identity, color: "power" },
        { label: "Gov share", value: `${Math.round(share * 100)}%` },
        { label: "Entanglement", value: `${Math.round(s.contracts.entanglement)}`, color: "entanglement" },
        { label: "Clearances", value: s.contracts.clearances.length ? s.contracts.clearances.join(", ") : "none" },
        { label: "Active contracts", value: `${s.contracts.active.length}` },
      ]} />

      <div style={{ fontSize: 13, lineHeight: 1.7, color: T.dim, maxWidth: 640 }}>
        {identity === "Independent" && "You owe nothing to anyone. Government doors stay shut, but so do their hooks."}
        {identity === "Government Partner" && "A trusted vendor. Steady public money, light strings — for now."}
        {identity === "National Champion" && "The state builds plans around you. The money is enormous; so is the leverage they hold."}
        {identity === "State-Entangled" && "You and the government can no longer quietly separate. Every move is strategic; every hearing is about you."}
      </div>

      {/* THE FIELD — the other titans, live */}
      <div style={{ marginTop: 28, fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5 }}>
        The field</div>
      <div style={{ marginTop: 10 }}>
        {s.rivals.map(rs => {
          const d = c.rivalDefs[rs.def_id]!;
          const standing = rivalStanding(rs, d, c.megaMeta);
          const threat = rivalThreat(rs, d, s.megas.active.map(a => a.def_id), s.claimedLegacies, c.megaMeta);
          const legacies = Object.entries(s.claimedLegacies).filter(([, o]) => o === d.id).map(([l]) => l);
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "10px 0",
              borderBottom: `1px solid ${T.line}` }}>
              <div style={{ width: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: threat === "racing_you" ? "#ff9d9d" : T.white }}>
                  {d.name}</div>
                <div style={{ fontSize: 11, color: T.label }}>{d.tagline}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: T.txt }}>{standing.headline}
                  {threat === "racing_you" && <b style={{ color: "#ff6b6b", marginLeft: 8, fontSize: 11,
                    letterSpacing: 0.5 }}>RACING YOU</b>}
                  {(rs.surge_until > s.week) && <span style={{ color: T.amber, marginLeft: 8, fontSize: 11 }}>
                    ⚡ crash program</span>}
                </div>
                <div style={{ fontSize: 11.5, color: T.dim }}>{standing.detail}
                  {legacies.length > 0 && <span style={{ color: "#e46a6a" }}>
                    {" "}· holds {legacies.map(l => `"${l.replace(/_/g, " ")}"`).join(", ")}</span>}
                </div>
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.dim }}>
                ${(rs.stature / 1000).toFixed(0)}B</div>
            </div>);
        })}
      </div>

      {/* sovereignty gates */}
      <div style={{ marginTop: 26, fontSize: 11, color: T.label, textTransform: "uppercase", letterSpacing: 0.5 }}>
        The sovereignty tier</div>
      <div style={{ fontSize: 13, color: T.dim, marginTop: 8, lineHeight: 1.7 }}>
        {c.powerEvents.filter(e => e.category === "sovereignty").map(e => {
          const gated = (e.gates.power_min ?? 0) > power || (e.gates.stature_min ?? 0) > s.stature;
          return (
            <div key={e.id}>
              <span style={{ color: gated ? T.label : purple }}>{gated ? "○" : "◈"}</span>{" "}
              <span style={{ color: gated ? T.label : T.txt }}>{e.id.replace(/_/g, " ")}</span>
              {gated && <span style={{ fontSize: 11.5 }}> — needs power {e.gates.power_min ?? 0}</span>}
            </div>);
        })}
      </div>
    </div>
  );
}
