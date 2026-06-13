import { useGame } from "@/state/store";
import { founderOwnership, latestPostMoney } from "@/engine/captable";
import { formatMoney, formatPct } from "@/engine/format";
import { industryLabel, subIndustryLabel } from "@/domain/ids";

/** The narrative layer (decision E/O): CEO log + relational news, text-only and
 *  generated from live state and the loaded world. Skippable by design. */
export function NarrativeRail() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  if (!game) return null;

  const { company } = game;
  const rounds = company.capTable.rounds.filter((r) => r.postMoney > 0);
  const last = rounds[rounds.length - 1];
  const founderPct = founderOwnership(company.capTable);
  const post = latestPostMoney(company.capTable);

  // Relational news: same-industry anchors, framed from their narrative hooks.
  const peers = content.companies
    .filter((c) => c.industry === company.industry && c.tier === "anchor")
    .slice(0, 3);

  return (
    <aside className="narrative">
      <section className="narrative__section">
        <h4 className="narrative__title">This Week</h4>
        <div className="ceo-log">
          {last ? (
            <p>
              Closed the <strong>{last.name}</strong> with {last.leadInvestorName} at{" "}
              <strong>{formatMoney(last.postMoney)}</strong> post. You hold{" "}
              <strong>{formatPct(founderPct)}</strong> — a stake worth{" "}
              {formatMoney(founderPct * post)}.
            </p>
          ) : (
            <p>
              You founded <strong>{company.name}</strong> in {subIndustryLabel(company.subIndustry)}.
              The cap table is clean: <strong>{formatPct(founderPct)}</strong> yours. Time to find
              your first lead.
            </p>
          )}
          <p className="ceo-log__meta">
            {company.financials.headcount} on the team · {formatMoney(company.financials.cash)} in the bank
          </p>
        </div>
      </section>

      <section className="narrative__section">
        <h4 className="narrative__title">The Street</h4>
        <ul className="news">
          {peers.map((c) => (
            <li key={c.id} className="news__item">
              <span className="news__dot" style={{ background: c.color }} />
              <div>
                <div className="news__headline">{streetHeadline(c.name, c.identity.narrative_hooks)}</div>
                <div className="news__sub">
                  {c.name} · {industryLabel(c.industry)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="narrative__section narrative__section--quiet">
        <h4 className="narrative__title">Team Activity</h4>
        <p className="narrative__placeholder">
          The activity feed, executives, and delegation reports arrive with the operating loop
          (Phase 9).
        </p>
      </section>
    </aside>
  );
}

function streetHeadline(name: string, hooks: string[]): string {
  const hook = hooks[0] ?? "is making moves";
  // Capitalize the hook into a newsroom-style line.
  const h = hook.charAt(0).toUpperCase() + hook.slice(1);
  return `${name}: ${h}`;
}
