// ============================================================================
// HomeTab.tsx — the CEO log: the turn report rendered as the narrative feed
// (19 §3.2). What happened, what needs you, what's coming due.
// ============================================================================
import { T } from "./tokens";
import { BigValue } from "./components";
import { TurnReport } from "@/engine/late/turn";

const purple = "#bd9dff";

export function HomeTab({ reports, week }: { reports: TurnReport[]; week: number }) {
  const latest = [...reports].reverse();
  return (
    <div style={{ fontFamily: T.sans, color: T.txt, background: T.bg, padding: "20px 24px", maxWidth: 860 }}>
      {latest.length === 0 && (
        <div style={{ color: T.dim, fontSize: 14, padding: "30px 0" }}>
          Week {week}. The company is yours. End a turn to see the world move.
        </div>
      )}
      {latest.slice(0, 12).map(r => (
        <div key={r.week} style={{ marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.label }}>WK {r.week}</span>
            <BigValue color={r.netCash >= 0 ? "money" : "warning"}>
              {r.netCash >= 0 ? "+" : "−"}${Math.abs(r.netCash).toFixed(0)}M</BigValue>
            <span style={{ fontSize: 12, color: purple, fontFamily: T.mono }}>power {r.power}</span>
            {r.entanglement > 0 && <span style={{ fontSize: 12, color: T.amber }}>
              entangled {r.entanglement} · {r.identity}</span>}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.75, color: T.dim }}>
            {r.eraTransition && (
              <div style={{ margin: "6px 0 10px", padding: "12px 16px", borderRadius: 10,
                border: "1px solid #3a2f5e", background: "linear-gradient(180deg,#151022,#0d0a16)" }}>
                <div style={{ fontSize: 10.5, color: "#bd9dff", textTransform: "uppercase",
                  letterSpacing: 1 }}>A new era</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.white, margin: "3px 0" }}>
                  {r.eraTransition.name}</div>
                <div style={{ fontSize: 12.5, color: T.dim }}>{r.eraTransition.prose}</div>
              </div>)}
            {r.cycleShift && (
              <div style={{ color: r.cycleShift.phase === "winter" ? "#9db4d6"
                : r.cycleShift.phase === "boom" ? "#7dc4a6" : T.dim }}>
                <span>{r.cycleShift.phase === "winter" ? "❄" : r.cycleShift.phase === "boom" ? "▲" : "◦"}</span>{" "}
                {r.cycleShift.prose}</div>)}
            {r.pressuresStarted.map(p => (
              <div key={p.id} style={{ color: "#e0a86a" }}>
                <b>⊘ {p.name} begins</b> — {p.on_start}</div>))}
            {r.pressuresEnded.map(p => (
              <div key={p.id} style={{ color: "#7dc4a6" }}>
                <b>✓ {p.name} lifts</b> — {p.on_end}</div>))}
            {r.researchCompleted.map(id => (
              <div key={id}><span style={{ color: T.green }}>◆</span>{" "}
                <b style={{ color: T.white }}>{id.replace(/_/g, " ")}</b> research complete.</div>))}
            {r.megaCompleted.map(m => (
              <div key={m.def_id}><span style={{ color: purple }}>★</span>{" "}
                <b style={{ color: T.white }}>{m.def_id.replace(/_/g, " ")}</b>
                {m.copy_n > 1 ? ` #${m.copy_n}` : ""} is finished. A monument stands.</div>))}
            {r.megaBeats.filter(b => b.kind !== "milestone").map((b, i) => (
              <div key={i}><span style={{ color: b.kind === "catastrophe" ? "#e46a6a" : T.amber }}>▲</span> {b.text}</div>))}
            {r.subEconomyCrises.filter(c => c.event).map((c, i) => (
              <div key={i}><span style={{ color: T.amber }}>▲</span>{" "}
                <b style={{ color: T.txt }}>{c.event!.headline}</b>
                <span style={{ fontSize: 12.5 }}> — {c.event!.body.slice(0, 110)}…</span></div>))}
            {r.powerEventFired && (
              <div><span style={{ color: purple }}>◈</span>{" "}
                <b style={{ color: T.txt }}>{r.powerEventFired.id.replace(/_/g, " ")}</b>
                <span style={{ fontSize: 12.5, color: T.label }}> ({r.powerEventFired.category})</span></div>)}
            {r.legaciesClaimedByPlayer.map(l => (
              <div key={l} style={{ fontSize: 14 }}><span style={{ color: "#ffd700" }}>♛</span>{" "}
                <b style={{ color: "#ffd700" }}>HISTORY IS YOURS:</b>{" "}
                <b style={{ color: T.white }}>{l.replace(/_/g, " ")}</b> — claimed first, forever.</div>))}
            {r.legaciesLostToRivals.map(x => (
              <div key={x.legacy} style={{ fontSize: 13.5 }}><span style={{ color: "#e46a6a" }}>♛</span>{" "}
                <b style={{ color: "#e46a6a" }}>{x.legacy.replace(/_/g, " ")}</b> is claimed —
                someone else's name goes in the history books.</div>))}
            {r.rivalNews.map((n, i) => (
              <div key={i} style={{ color: n.kind === "legacy_claim" ? "#e46a6a" : T.dim }}>
                <span style={{ color: n.kind === "ambient" ? T.label : T.amber }}>
                  {n.kind === "ambient" ? "·" : "◆"}</span> {n.text}</div>))}
            {r.worldNews && (
              <div style={{ marginTop: 4, paddingLeft: 10, borderLeft: `2px solid ${T.line2}` }}>
                <span style={{ fontSize: 11, color: T.label, textTransform: "uppercase" }}>world</span>{" "}
                <b style={{ color: T.txt, fontSize: 13 }}>{r.worldNews.headline}</b>
                <span style={{ fontSize: 12.5 }}> — {r.worldNews.body}</span></div>)}
            {r.marketRefreshed && (
              <div><span style={{ color: T.blue }}>○</span> New deals on the table — the contract market refreshed.</div>)}
            {r.contractsExpired.map(id => (
              <div key={id}><span style={{ color: T.label }}>○</span> {id.replace(/_/g, " ")} ran its term.</div>))}
          </div>
        </div>
      ))}
    </div>
  );
}
