// ============================================================================
// components.tsx — The shared UI kit (19 Part 5): BoldTable, FilterPills,
// ViewToggle, DrillIn, ExecAdviceStrip, OutcomeButton, BigValue.
// The calibration language every data-heavy tab reuses. Anti-density rule:
// more data = another lens (filter/view), never smaller type.
// ============================================================================
import React, { useState, ReactNode } from "react";
import { T, valueColor, ValueColor } from "./tokens";

// ---- BigValue: the 18-20px bold colored figure (revenue green, power purple…)
export function BigValue({ children, color = "neutral", size = "md", suffix }: {
  children: ReactNode; color?: ValueColor; size?: "md" | "lg"; suffix?: string;
}) {
  return (
    <span style={{ fontFamily: T.mono, fontWeight: 600, color: valueColor(color),
      fontSize: size === "lg" ? T.fontValueLg : T.fontValue }}>
      {children}{suffix && <span style={{ fontSize: 12 }}>{suffix}</span>}
    </span>
  );
}

// ---- FilterPills: narrow to the slice you want (All / Commercial / Government…)
export interface Pill { id: string; label: string; dotColor?: string }
export function FilterPills({ pills, active, onChange }: {
  pills: Pill[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {pills.map(p => {
        const on = p.id === active;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={{
            fontSize: 13, padding: "7px 15px", borderRadius: 20, cursor: "pointer",
            color: on ? T.white : T.dim, background: on ? "#16203a" : "transparent",
            border: `1px solid ${on ? "#2c4680" : T.line}`, fontFamily: T.sans,
          }}>
            {p.dotColor && <span style={{ display: "inline-block", width: 7, height: 7,
              borderRadius: "50%", marginRight: 7, background: p.dotColor, verticalAlign: "middle" }} />}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- ViewToggle: re-lens the same data (By value / By entanglement / By term)
export function ViewToggle({ views, active, onChange }: {
  views: { id: string; label: string }[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "inline-flex", border: `1px solid ${T.line}`, borderRadius: 8, overflow: "hidden" }}>
      {views.map((v, i) => {
        const on = v.id === active;
        return (
          <button key={v.id} onClick={() => onChange(v.id)} style={{
            fontSize: 12.5, padding: "8px 16px", cursor: "pointer", fontFamily: T.sans,
            color: on ? T.white : T.dim, background: on ? "#131a26" : "transparent",
            border: "none", borderRight: i < views.length - 1 ? `1px solid ${T.line}` : "none",
          }}>{v.label}</button>
        );
      })}
    </div>
  );
}

// ---- BoldTable: the calibration table. Generic over row type; roomy drill-in.
export interface Column<Row> {
  key: string; header: string; numeric?: boolean; sorted?: boolean;
  render: (row: Row) => ReactNode;
}
export function BoldTable<Row extends { id: string }>({ columns, rows, renderDetail, openId, onRowClick }: {
  columns: Column<Row>[]; rows: Row[];
  renderDetail?: (row: Row) => ReactNode;         // the roomy inline drill-in panel
  openId?: string | null; onRowClick?: (row: Row) => void;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.sans }}>
      <thead>
        <tr>
          {columns.map(c => (
            <th key={c.key} style={{
              fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 500,
              color: c.sorted ? T.blue : T.label, textAlign: c.numeric ? "right" : "left",
              padding: `10px ${T.rowPadX}px`, borderBottom: `1px solid ${T.line}`,
            }}>{c.header}{c.sorted ? " ▾" : ""}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const open = openId === row.id;
          return (
            <React.Fragment key={row.id}>
              <tr onClick={() => onRowClick?.(row)} style={{
                borderBottom: `1px solid ${T.line2}`, cursor: onRowClick ? "pointer" : "default",
                background: open ? "#0b0f18" : "transparent",
              }}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: `${T.rowPadY}px ${T.rowPadX}px`,
                    textAlign: c.numeric ? "right" : "left", verticalAlign: "middle",
                    fontFamily: c.numeric ? T.mono : T.sans }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
              {open && renderDetail && (
                <tr style={{ background: "#0a0e15" }}>
                  <td colSpan={columns.length} style={{ padding: 0 }}>
                    <div style={{ padding: `20px ${T.rowPadX}px`, borderTop: `1px solid ${T.line}` }}>
                      {renderDetail(row)}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// ---- SpecGrid: the 5-cell briefed-decision breakdown (upfront/recurring/term/power/entangle)
export function SpecGrid({ cells }: { cells: { label: string; value: ReactNode; color?: ValueColor }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: 14, marginBottom: 18 }}>
      {cells.map(c => (
        <div key={c.label} style={{ border: `1px solid ${T.line2}`, borderRadius: 9, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: T.label, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontFamily: T.mono, marginTop: 6,
            color: valueColor(c.color ?? "neutral") }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---- ExecAdviceStrip: the recommendation + reasoning (advisory.ts Recommendation)
export function ExecAdviceStrip({ execName, initials, reasoning, onAccept, acceptLabel = "Take advice" }: {
  execName: string; initials: string; reasoning: string;
  onAccept?: () => void; acceptLabel?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "15px 17px",
      background: "#0d0a16", border: "1px solid #2c2448", borderRadius: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: "#1a2138", color: T.exec,
        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
        flex: "none", fontFamily: T.mono }}>{initials}</div>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: T.dim, fontFamily: T.sans }}>
        <b style={{ color: T.exec }}>{execName}:</b>{" "}
        <em style={{ color: T.txt }}>{reasoning}</em>
      </div>
      {onAccept && (
        <button onClick={onAccept} style={{ alignSelf: "center", fontSize: 12, color: "#fff",
          background: T.blue, border: "none", padding: "9px 18px", borderRadius: 7,
          fontWeight: 600, cursor: "pointer", flex: "none" }}>{acceptLabel}</button>
      )}
    </div>
  );
}

// ---- OutcomeButton: the action that states its full breakdown ("Build · $1.2M · 3wk · ships ~Q14")
export function OutcomeButton({ verb, breakdown, variant = "action", onClick, disabled }: {
  verb: string; breakdown: string[];                 // ["$1.2M", "3wk", "ships ~Q14"]
  variant?: "action" | "government" | "pass"; onClick?: () => void; disabled?: boolean;
}) {
  const bg = variant === "government" ? "#6f4fd0" : variant === "pass" ? "transparent" : T.blue;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontSize: 14, fontWeight: 600, padding: "13px 26px", borderRadius: 8, cursor: disabled ? "default" : "pointer",
      color: variant === "pass" ? T.dim : "#fff", background: bg, opacity: disabled ? 0.5 : 1,
      border: variant === "pass" ? `1px solid ${T.line}` : "none", fontFamily: T.sans,
    }}>
      {verb}{breakdown.length > 0 && <span style={{ fontWeight: 400, opacity: 0.9 }}>
        {" "}· {breakdown.join(" · ")}</span>}
    </button>
  );
}

// ---- BottleneckLine: the capacity summary w/ flag ("⚠ Compute-limited — throttled to 70%")
export function BottleneckLine({ flagged, message, pct, onExpand }: {
  flagged: boolean; message: string; pct: number; onExpand?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
      border: `1px solid ${flagged ? "#3a2e14" : T.line}`, borderRadius: 8,
      background: flagged ? "#100b06" : "transparent" }}>
      {flagged && <span style={{ color: T.amber, fontSize: 14 }}>⚠</span>}
      <span style={{ fontSize: 12, color: T.txt, flex: 1 }}>{message}</span>
      <span style={{ width: 120, height: 5, background: "#161c25", borderRadius: 3, overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${pct}%`,
          background: flagged ? T.amber : T.green }} />
      </span>
      {onExpand && <button onClick={onExpand} style={{ fontSize: 11, color: T.blue,
        border: "1px solid #2c4680", padding: "5px 12px", borderRadius: 5,
        background: "transparent", cursor: "pointer" }}>Expand ▸</button>}
    </div>
  );
}

// ---- useDrillIn: one-open-at-a-time drill-in state
export function useDrillIn(): [string | null, (id: string) => void] {
  const [open, setOpen] = useState<string | null>(null);
  return [open, (id: string) => setOpen(cur => (cur === id ? null : id))];
}
