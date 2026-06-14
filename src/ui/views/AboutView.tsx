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
          This is the V1 foundation: the four-zone frame, the two hero features — the{" "}
          <strong>cap table</strong> and the <strong>fundraising negotiation</strong> — and the{" "}
          <strong>Advance heartbeat</strong>, wired to the real authored content.
        </p>

        <div className="about__cols">
          <div>
            <h4 className="about__h">In this build</h4>
            <ul className="about__list">
              <li><Tag tone="up">Done</Tag> Four-zone operating frame (top bar, nav, workspace, narrative rail)</li>
              <li><Tag tone="up">Done</Tag> Cap table: Overview, Holders, Round History, Exit Scenarios</li>
              <li><Tag tone="up">Done</Tag> Priced-round engine (pre-money option pool, dilution, exit waterfall)</li>
              <li><Tag tone="up">Done</Tag> 3-round fundraising negotiation with axis-driven counters &amp; soft signals</li>
              <li><Tag tone="up">Done</Tag> Eval help: color-coded terms, Comparable Rounds, live preview, relationship memory</li>
              <li><Tag tone="up">Done</Tag> Advance heartbeat — deterministic ticks, world drift, runway alerts, milestones</li>
              <li><Tag tone="up">Done</Tag> Six master-variable world engines + the World view (Phase 5)</li>
              <li><Tag tone="up">Done</Tag> Public market — ~70 companies, live pricing, relationship graph (Phase 6)</li>
              <li><Tag tone="up">Done</Tag> Events engine + the 50 templates, slot-filled from the real market (Phase 7)</li>
              <li><Tag tone="up">Done</Tag> Personal wealth &amp; the net-worth ladder (Phase 8)</li>
              <li><Tag tone="up">Done</Tag> Signature mechanics + light delegation / auto-decisions (Phase 9)</li>
            </ul>
          </div>
          <div>
            <h4 className="about__h">Next phases</h4>
            <ul className="about__list">
              <li><Tag tone="warn">Next</Tag> 3-act IPO, acquisition exits, achievements (Phase 10)</li>
              <li><Tag>Later</Tag> Steam playtest prep, save migration (Phase 11)</li>
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
