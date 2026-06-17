import { useState, type ReactNode } from "react";
import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import type { PlayerCompany } from "@/domain/state";
import { STAGE_LABELS, subIndustryLabel } from "@/domain/ids";
import { formatMoney } from "@/engine/format";
import { runwayMonths } from "@/engine/finance";
import { totalDebt } from "@/engine/debt";
import { Panel } from "@/ui/components/Panel";
import { Stat, Tag } from "@/ui/components/controls";
import { FlashNum } from "@/ui/components/FlashNum";
import { Icon } from "@/ui/components/Icon";
import { CapTablePanel } from "@/ui/captable/CapTablePanel";
import { NegotiationPanel } from "@/ui/fundraising/NegotiationPanel";
import { SignatureWidget } from "@/ui/operating/SignatureWidget";
import { OperationsPanel } from "@/ui/operating/OperationsPanel";
import { FinancialsPanel } from "@/ui/operating/FinancialsPanel";
import { ExitActions } from "@/ui/exit/ExitActions";
import { ActiveDecisions } from "@/ui/decisions/ActiveDecisions";
import {
  DASH_PANELS,
  DASH_PANEL_IDS,
  applyVisibleOrder,
  effectiveOrder,
  moveBefore,
  panelLabel,
  swap,
} from "./dashboardLayout";
import type { View } from "@/ui/frame/types";

function FinancialBand({ company }: { company: PlayerCompany }) {
  const f = company.financials;
  const runway = runwayMonths(company); // includes debt service
  const debt = totalDebt(company);
  return (
    <Panel className="finband" coach="company">
      <div className="finband__id">
        <span className="finband__dot" style={{ background: company.color }} />
        <div>
          <div className="finband__name">{company.name}</div>
          <div className="finband__sub">
            {subIndustryLabel(company.subIndustry)} <Tag tone="accent">{STAGE_LABELS[company.stage]}</Tag>
          </div>
        </div>
      </div>
      <div className="finband__stats">
        <Stat
          label="Cash"
          value={<FlashNum value={f.cash} format={(n) => formatMoney(n)} count />}
          tone={f.cash < 0.5 ? "warn" : "neutral"}
        />
        <Stat label="Runway" value={runway === Infinity ? "∞" : `${Math.max(0, Math.floor(runway))} mo`} />
        <Stat label="Revenue" value={f.revenue > 0 ? `${formatMoney(f.revenue)}/yr` : "Pre-rev"} />
        <Stat label="Burn" value={`${formatMoney(f.burnMonthly)}/mo`} />
        <Stat
          label="Valuation"
          value={f.valuation > 0 ? <FlashNum value={f.valuation} format={(n) => formatMoney(n)} count /> : "—"}
        />
        <Stat label="Headcount" value={String(f.headcount)} />
        {debt > 0 && <Stat label="Debt" value={formatMoney(debt)} tone="warn" />}
      </div>
    </Panel>
  );
}

/** A draggable wrapper around one dashboard panel. Only the corner handle is the
 *  drag source, so the panel's own controls keep working; the handle also takes
 *  arrow keys, so reordering is reachable without a mouse. */
function DashItem({
  id,
  dragId,
  overId,
  onPick,
  onOver,
  onDrop,
  onEnd,
  onNudge,
  children,
}: {
  id: string;
  dragId: string | null;
  overId: string | null;
  onPick: (id: string) => void;
  onOver: (id: string) => void;
  onDrop: (id: string) => void;
  onEnd: () => void;
  onNudge: (id: string, dir: number) => void;
  children: ReactNode;
}) {
  const dragging = dragId === id;
  const over = overId === id && dragId != null && dragId !== id;
  return (
    <div
      className={`dash-item${dragging ? " is-dragging" : ""}${over ? " is-over" : ""}`}
      onDragOver={(e) => {
        if (dragId == null) return;
        e.preventDefault();
        onOver(id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(id);
      }}
    >
      <button
        type="button"
        className="dash-item__handle"
        data-handle={id}
        draggable
        onDragStart={(e) => {
          onPick(id);
          e.dataTransfer.effectAllowed = "move";
          const item = (e.currentTarget as HTMLElement).closest(".dash-item");
          if (item) e.dataTransfer.setDragImage(item as HTMLElement, 16, 16);
        }}
        onDragEnd={onEnd}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onNudge(id, -1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onNudge(id, 1);
          }
        }}
        aria-label={`Reorder ${panelLabel(id)} panel — drag, or use the arrow keys`}
        title="Drag to reorder"
      >
        <Icon name="grip" size={14} />
      </button>
      {children}
    </div>
  );
}

function CustomizeMenu({
  hidden,
  onToggle,
  onReset,
  onClose,
}: {
  hidden: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="popover-scrim" onClick={onClose} />
      <div className="dash-customize__menu" role="menu">
        <div className="dash-customize__head">Dashboard panels</div>
        {DASH_PANELS.map((p) => (
          <label key={p.id} className="dash-customize__row">
            <input type="checkbox" checked={!hidden.includes(p.id)} onChange={() => onToggle(p.id)} />
            <span>{p.label}</span>
          </label>
        ))}
        <button type="button" className="dash-customize__reset" onClick={onReset}>
          Reset layout
        </button>
      </div>
    </>
  );
}

export function Dashboard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const game = useGame((s) => s.game);
  const savedOrder = usePrefs((s) => s.dashboardOrder);
  const hidden = usePrefs((s) => s.dashboardHidden);
  const setOrder = usePrefs((s) => s.setDashboardOrder);
  const toggle = usePrefs((s) => s.toggleDashboardPanel);
  const reset = usePrefs((s) => s.resetDashboard);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  if (!game) return null;

  const order = effectiveOrder(savedOrder, DASH_PANEL_IDS);
  const visible = order.filter((id) => !hidden.includes(id));

  const renderPanel = (id: string): ReactNode => {
    switch (id) {
      case "financials":
        return <FinancialBand company={game.company} />;
      case "statement":
        return <FinancialsPanel />;
      case "signature":
        return <SignatureWidget />;
      case "operations":
        return <OperationsPanel />;
      case "captable":
        return <CapTablePanel capTable={game.company.capTable} />;
      case "fundraising":
        return <NegotiationPanel />;
      default:
        return null;
    }
  };

  // Reorder operations run on the visible list, then write back onto the full
  // order so hidden panels keep their slots.
  const commitVisible = (nextVisible: string[]) => setOrder(applyVisibleOrder(order, hidden, nextVisible));

  return (
    <div className="workspace-scroll">
      <ActiveDecisions onNavigate={onNavigate} />
      <ExitActions />
      <div className="dash-toolbar">
        <div className="dash-customize">
          <button
            type="button"
            className="dash-customize__btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Icon name="sliders" size={13} /> Customize
          </button>
          {menuOpen && (
            <CustomizeMenu
              hidden={hidden}
              onToggle={toggle}
              onReset={() => {
                reset();
                setMenuOpen(false);
              }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="dash-empty">
          Every panel is hidden.{" "}
          <button type="button" className="dash-empty__reset" onClick={reset}>
            Restore them
          </button>
          .
        </div>
      ) : (
        visible.map((id) => (
          <DashItem
            key={id}
            id={id}
            dragId={dragId}
            overId={overId}
            onPick={setDragId}
            onOver={setOverId}
            onEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDrop={(target) => {
              if (dragId) commitVisible(moveBefore(visible, dragId, target));
              setDragId(null);
              setOverId(null);
            }}
            onNudge={(pid, dir) => {
              commitVisible(swap(visible, pid, dir));
              // Keep focus on the handle after the list reorders, so arrow-key
              // reordering works repeatedly without re-tabbing.
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-handle="${pid}"]`)?.focus());
            }}
          >
            {renderPanel(id)}
          </DashItem>
        ))
      )}
    </div>
  );
}
