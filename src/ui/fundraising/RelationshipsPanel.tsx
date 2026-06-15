import { useGame } from "@/state/store";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Tag } from "@/ui/components/controls";

type Tone = "up" | "warn" | "accent" | undefined;

function band(score: number): { label: string; tone: Tone } {
  if (score >= 70) return { label: "Warm", tone: "up" };
  if (score >= 56) return { label: "Positive", tone: "accent" };
  if (score >= 44) return { label: "Neutral", tone: undefined };
  if (score >= 30) return { label: "Cool", tone: "warn" };
  return { label: "Strained", tone: "warn" };
}

/** The two-tier investor memory, surfaced: every firm you've dealt with, your
 *  standing, and the last thing that passed between you. Drives the next deal. */
export function RelationshipsPanel() {
  const game = useGame((s) => s.game);
  const byId = useGame((s) => s.content.investorById);
  if (!game) return null;

  const entries = Object.entries(game.relationships)
    .map(([id, rel]) => ({ id, rel, firm: byId.get(id) }))
    .filter((e) => e.firm)
    .sort((a, b) => b.rel.score - a.rel.score);
  if (entries.length === 0) return null;

  return (
    <Panel className="relationships">
      <PanelHeader
        title="Your investor relationships"
        sub="Firms remember how you dealt with them — it colors the next negotiation"
      />
      <ul className="rel-list">
        {entries.map(({ id, rel, firm }) => {
          const b = band(rel.score);
          const last = rel.history[rel.history.length - 1];
          return (
            <li key={id} className="rel-item">
              <div className="rel-item__head">
                <span className="swatch swatch--sm" style={{ background: firm!.color ?? "var(--accent)" }} />
                <span className="strong">{firm!.name}</span>
                <span className="dim">{firm!.partner_name}</span>
                <Tag tone={b.tone}>{b.label}</Tag>
              </div>
              {last && <div className="rel-item__note">{last.note}</div>}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
