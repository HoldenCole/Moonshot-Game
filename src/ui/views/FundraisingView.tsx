import { useGame } from "@/state/store";
import { STAGE_LABELS, industryLabel } from "@/domain/ids";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Tag } from "@/ui/components/controls";
import { RaiseRoundPanel } from "@/ui/captable/RaiseRoundPanel";

export function FundraisingView() {
  const content = useGame((s) => s.content);

  return (
    <div className="workspace-scroll">
      <RaiseRoundPanel />

      <Panel className="investors" flush>
        <PanelHeader
          title="Investor Directory"
          sub={`${content.investors.length} firms — the counterparties you'll negotiate against`}
        />
        <div className="investor-grid">
          {content.investors.map((f) => (
            <article key={f.id} className="investor-card">
              <header className="investor-card__head">
                <span className="swatch" style={{ background: f.color ?? "var(--accent)" }} />
                <div>
                  <div className="investor-card__name">{f.name}</div>
                  <div className="investor-card__partner">
                    {f.partner_name}
                    {f.partner_title ? ` · ${f.partner_title}` : ""}
                  </div>
                </div>
                <span className="investor-card__rep num" title="Reputation">
                  {f.identity.reputation}
                </span>
              </header>
              <p className="investor-card__thesis">“{f.identity.thesis}”</p>
              <div className="firm-tags">
                {f.identity.trait_tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div className="investor-card__meta">
                <span>{industryLabel(f.focus.primary_sector)}</span>
                <span className="dot-sep">·</span>
                <span>{STAGE_LABELS[f.focus.primary_stage]} lead</span>
                <span className="dot-sep">·</span>
                <span className="num">
                  {formatMoney(f.fund.check_min)}–{formatMoney(f.fund.check_max)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
