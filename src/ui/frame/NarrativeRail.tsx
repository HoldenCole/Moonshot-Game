import { useGame } from "@/state/store";
import { founderOwnership, latestPostMoney } from "@/engine/captable";
import { runwayMonths } from "@/engine/finance";
import { formatMoney, formatPct } from "@/engine/format";
import { subIndustryLabel } from "@/domain/ids";
import type { LogEntry, LogTone } from "@/domain/log";

const TONE_COLOR: Record<LogTone, string> = {
  neutral: "var(--text-faint)",
  up: "var(--up)",
  down: "var(--down)",
  warn: "var(--warn)",
  crisis: "var(--down)",
  opportunity: "var(--data)",
};

/** The narrative layer (decision E/O): a live "This Week" standing plus the
 *  timeline of notable events. Text-only, generated from state and the world.
 *  The news ticker is load-bearing (the WSR lesson). */
export function NarrativeRail() {
  const game = useGame((s) => s.game);
  if (!game) return null;

  const { company, clock } = game;
  const rounds = company.capTable.rounds.filter((r) => r.postMoney > 0);
  const last = rounds[rounds.length - 1];
  const founderPct = founderOwnership(company.capTable);
  const post = latestPostMoney(company.capTable);
  const runway = runwayMonths(company);

  // Newest notable entries first.
  const timeline: LogEntry[] = [...game.log].slice(-14).reverse();

  return (
    <aside className="narrative">
      <section className="narrative__section">
        <h4 className="narrative__title">This Week · W{clock.week}</h4>
        <div className="ceo-log">
          {last ? (
            <p>
              You hold <strong>{formatPct(founderPct)}</strong> of {company.name} after the{" "}
              <strong>{last.name}</strong> — a stake worth {formatMoney(founderPct * post)}.
            </p>
          ) : (
            <p>
              <strong>{company.name}</strong> is in {subIndustryLabel(company.subIndustry)}. The cap
              table is clean: <strong>{formatPct(founderPct)}</strong> yours.
            </p>
          )}
          <p className="ceo-log__meta">
            {formatMoney(company.financials.cash)} in the bank ·{" "}
            {runway === Infinity ? "cash-flow positive" : `${Math.max(0, Math.floor(runway))} mo runway`} ·{" "}
            {company.financials.headcount} on the team
          </p>
        </div>
      </section>

      <section className="narrative__section">
        <h4 className="narrative__title">Timeline</h4>
        <ul className="timeline">
          {timeline.map((e) => (
            <li key={e.id} className="timeline__item">
              <span className="timeline__dot" style={{ background: TONE_COLOR[e.tone] }} />
              <div className="timeline__content">
                <div className="timeline__headline">{e.headline}</div>
                {e.detail && <div className="timeline__detail">{e.detail}</div>}
                <div className="timeline__week">Week {e.week}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="narrative__section narrative__section--quiet">
        <h4 className="narrative__title">Team Activity</h4>
        <p className="narrative__placeholder">
          Executives, delegation reports, and the team feed arrive with the operating loop (Phase 9).
        </p>
      </section>
    </aside>
  );
}
