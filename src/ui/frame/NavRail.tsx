import { Icon, type IconName } from "@/ui/components/Icon";
import { useGame } from "@/state/store";
import type { View } from "./types";

const ITEMS: { view: View; icon: IconName; label: string }[] = [
  { view: "campus", icon: "rocket", label: "Campus" },
  { view: "dashboard", icon: "dashboard", label: "Dashboard" },
  { view: "captable", icon: "captable", label: "Cap Table" },
  { view: "fundraising", icon: "fundraising", label: "Fundraising" },
  { view: "market", icon: "market", label: "Market" },
  { view: "world", icon: "world", label: "World" },
  { view: "team", icon: "team", label: "Team" },
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
  const render = (it: { view: View; icon: IconName; label: string }) => (
    <button
      key={it.view}
      className={`navrail__item${view === it.view ? " is-active" : ""}`}
      onClick={() => onChange(it.view)}
      title={it.label}
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
        {lateActive && (
          <>
            <div className="navrail__divider" role="separator" title="Frontier" />
            {LATE_ITEMS.map(render)}
          </>
        )}
      </div>
    </nav>
  );
}
