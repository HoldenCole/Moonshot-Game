import { useGame } from "@/state/store";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Tag } from "@/ui/components/controls";

export function AboutView() {
  const content = useGame((s) => s.content);

  return (
    <div className="workspace-scroll">
      <Panel className="about">
        <PanelHeader title="Moonshot Inc" sub="Build status — what's playable, what's next" />
        <p className="about__lede">
          Found a frontier-tech company, raise venture capital, and build from a garage to an IPO.
          This is the V1 foundation: the four-zone frame and the <strong>cap table</strong> hero
          feature, wired to the real authored content.
        </p>

        <div className="about__cols">
          <div>
            <h4 className="about__h">In this build</h4>
            <ul className="about__list">
              <li><Tag tone="up">Done</Tag> Four-zone operating frame (top bar, nav, workspace, narrative rail)</li>
              <li><Tag tone="up">Done</Tag> Cap table: Overview, Holders, Round History, Exit Scenarios</li>
              <li><Tag tone="up">Done</Tag> Priced-round engine (pre-money option pool, dilution, exit waterfall)</li>
              <li><Tag tone="up">Done</Tag> Live fundraising negotiation preview against real VC firms</li>
              <li><Tag tone="up">Done</Tag> Content loader for all authored TOML, cross-references validated</li>
            </ul>
          </div>
          <div>
            <h4 className="about__h">Next phases</h4>
            <ul className="about__list">
              <li><Tag tone="warn">Next</Tag> Time advancement &amp; tick resolution (Phase 3)</li>
              <li><Tag>Later</Tag> 3-round negotiation flow &amp; soft signals (Phase 4)</li>
              <li><Tag>Later</Tag> Master-variable world engines (Phase 5)</li>
              <li><Tag>Later</Tag> Company relationship graph &amp; events (Phases 6–7)</li>
              <li><Tag>Later</Tag> Signature mechanics, delegation, IPO (Phases 9–10)</li>
            </ul>
          </div>
        </div>

        <h4 className="about__h">Loaded content</h4>
        <div className="about__counts">
          <CountChip label="Companies" n={content.companies.length} />
          <CountChip label="VC firms" n={content.investors.length} />
          <CountChip label="Banks" n={content.banks.length} />
          <CountChip label="Events" n={content.events.length} />
        </div>
        {content.warnings.length > 0 && (
          <p className="about__warn">{content.warnings.length} content warning(s) — see console.</p>
        )}
      </Panel>
    </div>
  );
}

function CountChip({ label, n }: { label: string; n: number }) {
  return (
    <div className="count-chip">
      <span className="count-chip__n num">{n}</span>
      <span className="count-chip__label">{label}</span>
    </div>
  );
}
