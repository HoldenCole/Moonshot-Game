import { useGame } from "@/state/store";
import { usePrefs } from "@/state/prefs";
import { founderOwnership, latestPostMoney } from "@/engine/captable";
import { runwayMonths } from "@/engine/finance";
import { generateNarrative } from "@/engine/narrative";
import { climateLabel } from "@/engine/world";
import { formatMoney, formatPct } from "@/engine/format";
import { subIndustryLabel } from "@/domain/ids";
import type { FeedItem } from "@/engine/narrative";
import type { LogEntry, LogTone } from "@/domain/log";

const TONE_COLOR: Record<LogTone, string> = {
  neutral: "var(--text-faint)",
  up: "var(--up)",
  down: "var(--down)",
  warn: "var(--warn)",
  crisis: "var(--down)",
  opportunity: "var(--data)",
};

/** The narrative layer (UI_LANGUAGE §3): voiced and continuous. The week's
 *  thread — a teammate weighing their future — echoes across the CEO log and
 *  the team feed (one story, many lenses). Skippable; toggles off entirely. */
export function NarrativeRail() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const toggleRail = usePrefs((s) => s.toggleRail);
  if (!game) return null;

  const { company, clock } = game;
  const n = generateNarrative(game, content);
  const founderPct = founderOwnership(company.capTable);
  const post = latestPostMoney(company.capTable);
  const runway = runwayMonths(company);
  const rounds = company.capTable.rounds.filter((r) => r.postMoney > 0);
  const last = rounds[rounds.length - 1];
  const hype = game.world.hype[company.industry] ?? 50;
  const timeline: LogEntry[] = [...game.log].slice(-8).reverse();

  return (
    <aside className="narrative">
      <section className="narrative__section">
        <div className="narrative__head">
          <h4 className="narrative__title">This week</h4>
          <button className="narrative__skip" onClick={toggleRail} title="Hide the narrative rail" aria-label="Hide the narrative rail">
            hide ›
          </button>
        </div>
        <p className="narrative__date">Week {clock.week}</p>
        <p className="ceo-log__body">
          {last ? (
            <>
              You hold <strong>{formatPct(founderPct)}</strong> of {company.name} after the{" "}
              <strong>{last.name}</strong> — a stake worth {formatMoney(founderPct * post)}.{" "}
            </>
          ) : (
            <>
              <strong>{company.name}</strong> is taking shape in {subIndustryLabel(company.subIndustry)};
              the cap table is clean, <strong>{formatPct(founderPct)}</strong> yours.{" "}
            </>
          )}
          {runway === Infinity
            ? "You're cash-flow positive — rare air."
            : `${formatMoney(company.financials.cash)} in the bank, ${Math.max(0, Math.floor(runway))} months of runway.`}{" "}
          The market is {climateLabel(game.world.vcClimate).toLowerCase()} and {company.industry === "ai" ? "AI" : "your sector"} hype sits at {Math.round(hype)}. The thing on your
          mind: <strong>{n.thread.teammate.name}</strong> {n.thread.status}.
        </p>
      </section>

      <section className="narrative__section">
        <h4 className="narrative__title">
          <span className="live-dot" /> Team activity
        </h4>
        <Feed items={n.teamFeed} />
      </section>

      <section className="narrative__section">
        <h4 className="narrative__title">Sector news</h4>
        <Feed items={n.sectorFeed} />
      </section>

      {timeline.length > 0 && (
        <section className="narrative__section narrative__section--quiet">
          <h4 className="narrative__title">Markets &amp; macro</h4>
          <ul className="timeline">
            {timeline.map((e) => (
              <li key={e.id} className="timeline__item">
                <span className="timeline__dot" style={{ background: TONE_COLOR[e.tone] }} />
                <div className="timeline__content">
                  <div className="timeline__headline">{e.headline}</div>
                  <div className="timeline__week">Week {e.week}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

function Feed({ items }: { items: FeedItem[] }) {
  return (
    <ul className="feed">
      {items.map((it, i) => (
        <li key={i} className="feed__item">
          <div className="feed__body">
            <p className="feed__line">
              <span className="feed__who">{it.who}</span> {it.line}
              {it.fresh && <span className="feed__new">· new</span>}
            </p>
            {it.quote && <p className="feed__quote">{it.quote}</p>}
            <p className="feed__age">{it.age}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
