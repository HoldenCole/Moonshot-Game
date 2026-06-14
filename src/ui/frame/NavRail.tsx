import { Icon, type IconName } from "@/ui/components/Icon";
import type { View } from "./types";

const ITEMS: { view: View; icon: IconName; label: string }[] = [
  { view: "dashboard", icon: "dashboard", label: "Dashboard" },
  { view: "captable", icon: "captable", label: "Cap Table" },
  { view: "fundraising", icon: "fundraising", label: "Fundraising" },
  { view: "market", icon: "market", label: "Market" },
  { view: "world", icon: "world", label: "World" },
  { view: "team", icon: "team", label: "Team" },
  { view: "about", icon: "info", label: "About" },
];

export function NavRail({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav className="navrail">
      <div className="navrail__logo" title="Moonshot Inc">
        <Icon name="rocket" size={22} />
      </div>
      <div className="navrail__items">
        {ITEMS.map((it) => (
          <button
            key={it.view}
            className={`navrail__item${view === it.view ? " is-active" : ""}`}
            onClick={() => onChange(it.view)}
            title={it.label}
            aria-label={it.label}
            aria-current={view === it.view}
          >
            <Icon name={it.icon} />
            <span className="navrail__tip">{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
