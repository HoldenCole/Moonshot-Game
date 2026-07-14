import { Icon, type IconName } from "@/ui/components/Icon";
import { useGame } from "@/state/store";
import { play } from "@/audio/sfx";
import type { View } from "./types";

const ITEMS: { view: View; icon: IconName; label: string }[] = [
  { view: "campus", icon: "rocket", label: "Campus" },
  { view: "dashboard", icon: "dashboard", label: "Dashboard" },
  { view: "captable", icon: "captable", label: "Cap Table" },
  { view: "fundraising", icon: "fundraising", label: "Fundraising" },
  { view: "market", icon: "market", label: "Market" },
  { view: "world", icon: "world", label: "World" },
  { view: "team", icon: "team", label: "Team" },
  { view: "ledger", icon: "sliders", label: "Ledger" },
  { view: "about", icon: "info", label: "About" },
];

// The late-game (v2) surfaces — only shown once the Scale-Up slice is born.
const LATE_ITEMS: { view: View; icon: IconName; label: string }[] = [
  { view: "research", icon: "cpu", label: "Research" },
  { view: "megaprojects", icon: "rocket", label: "Megaprojects" },
  { view: "empire", icon: "market", label: "Empire" },
  { view: "executives", icon: "team", label: "Executives" },
  { view: "contracts", icon: "grip", label: "Contracts" },
  { view: "standing", icon: "sun", label: "Standing" },
  { view: "briefing", icon: "clock", label: "Briefing" },
];

export function NavRail({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const lateActive = useGame((s) => !!s.game?.late);
  const render = (it: { view: View; icon: IconName; label: string }, i?: number) => (
    <button
      key={it.view}
      className={`navrail__item${view === it.view ? " is-active" : ""}`}
      onClick={() => { if (view !== it.view) play("nav"); onChange(it.view); }}
      title={i != null && i < 9 ? `${it.label} (${i + 1})` : it.label}
      aria-label={it.label}
      aria-current={view === it.view}
      data-guide={it.view === "fundraising" ? "action-raise-round" : undefined}
    >
      <Icon name={it.icon} />
      <span className="navrail__tip">{it.label}</span>
    </button>
  );

  return (
    <nav className="navrail">
      <div className="navrail__logo" title="Moonshot Inc">
        <Icon name="rocket" size={22} />
      </div>
      <div className="navrail__items">
        {ITEMS.map(render)}
        {lateActive ? (
          <>
            <div className="navrail__divider" role="separator" title="Frontier" />
            {LATE_ITEMS.map((it) => render(it))}
          </>
        ) : (
          <>
            <div className="navrail__divider" role="separator" title="The Frontier" />
            <div
              className="navrail__item navrail__item--locked"
              title="The Frontier — research, megaprojects, executives, power. Unlocks at a $2B valuation."
              aria-label="The Frontier (locked) — unlocks at a $2B valuation"
            >
              <span className="navrail__lock">🔒</span>
              <span className="navrail__tip">The Frontier · unlocks at $2B</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
