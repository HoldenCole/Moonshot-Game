import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import {
  PLAYABLE_INDUSTRIES,
  SUB_INDUSTRY_LABELS,
  industryLabel,
  type Industry,
  type PlayableSubIndustry,
} from "@/domain/ids";
import { Icon } from "@/ui/components/Icon";
import { Button } from "@/ui/components/controls";
import { saveSummary } from "@/state/persist";
import { formatMoney } from "@/engine/format";

const SUBS: Record<Industry, PlayableSubIndustry[]> = {
  ai: ["frontier_model_lab", "vertical_ai_saas", "ai_chips"],
  space: ["launch_services", "satellite_constellations", "space_stations"],
  biotech: [],
  energy: [],
  defense: [],
  advanced_mfg: [],
  mobility: [],
  quantum: [],
};

const SIGNATURE: Record<PlayableSubIndustry, string> = {
  frontier_model_lab: "Twin compute + talent constraints. Commit massive training runs and live with the result.",
  vertical_ai_saas: "Race to a vertical moat before foundation models commoditize the layer beneath you.",
  ai_chips: "Multi-year fab cycles. Bet-the-company tape-outs on the next architecture.",
  launch_services: "Launch cadence. Every flight is a binary success-or-failure moment in public.",
  satellite_constellations: "A capital-heavy buildout curve. Deploy batches, then harvest recurring revenue.",
  space_stations: "Orchestrate a tenant mix in orbit — research, manufacturing, and tourism.",
};

const INDUSTRY_COLOR: Record<PlayableSubIndustry, string> = {
  frontier_model_lab: "#5b82ff",
  vertical_ai_saas: "#4c5fd5",
  ai_chips: "#7a5bff",
  launch_services: "#c84b4b",
  satellite_constellations: "#3c7dc4",
  space_stations: "#d98a3d",
};

const NAME_SUGGESTIONS: Record<PlayableSubIndustry, string> = {
  frontier_model_lab: "Helion Labs",
  vertical_ai_saas: "Brightline AI",
  ai_chips: "Tessellate Silicon",
  launch_services: "Apogee Launch",
  satellite_constellations: "Northstar Orbital",
  space_stations: "Meridian Station",
};

export function NewGameScreen() {
  const newGame = useGame((s) => s.newGame);
  const continueGame = useGame((s) => s.continueGame);
  const saved = useMemo(() => saveSummary(), []);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [sub, setSub] = useState<PlayableSubIndustry | null>(null);
  const [founderName, setFounderName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTouched, setCompanyTouched] = useState(false);

  const suggestedCompany = sub ? NAME_SUGGESTIONS[sub] : "";
  const effectiveCompany = companyTouched ? companyName : suggestedCompany;
  const ready = Boolean(industry && sub && founderName.trim() && effectiveCompany.trim());

  const subs = useMemo(() => (industry ? SUBS[industry] : []), [industry]);

  const found = () => {
    if (!industry || !sub) return;
    newGame({
      founderName: founderName.trim() || "Alex Rivera",
      companyName: effectiveCompany.trim() || suggestedCompany,
      industry,
      subIndustry: sub,
      color: INDUSTRY_COLOR[sub] ?? "#5b82ff",
      seed: Math.floor(Math.random() * 2 ** 31),
    });
  };

  return (
    <div className="newgame">
      <div className="newgame__inner rise">
        <div className="newgame__brand">
          <Icon name="rocket" size={30} />
          <span>Moonshot Inc</span>
        </div>
        {saved && (
          <button className="continue-banner" onClick={continueGame}>
            <div>
              <div className="continue-banner__k">Continue your run</div>
              <div className="continue-banner__v">
                {saved.company} · Week {saved.week}
                {saved.netWorth > 0 ? ` · ${formatMoney(saved.netWorth)} net worth` : ""}
              </div>
            </div>
            <Icon name="chevron-right" size={18} />
          </button>
        )}

        <h1 className="newgame__title">Found your company</h1>
        <p className="newgame__lede">
          Pick a frontier and a focus. You'll start in a garage with your idea and a little capital —
          the rest you build.
        </p>

        {/* Step 1 — Industry */}
        <div className="newgame__step">
          <div className="newgame__step-label">1 · Industry</div>
          <div className="industry-cards">
            {PLAYABLE_INDUSTRIES.map((ind) => (
              <button
                key={ind}
                className={`industry-card${industry === ind ? " is-active" : ""}`}
                onClick={() => {
                  setIndustry(ind);
                  setSub(null);
                }}
              >
                <div className="industry-card__name">{industryLabel(ind)}</div>
                <div className="industry-card__sub">
                  {SUBS[ind].length} sub-industries · {ind === "ai" ? "fast cycles, talent-driven" : "capital-heavy, hardware risk"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Sub-industry */}
        {industry && (
          <div className="newgame__step rise">
            <div className="newgame__step-label">2 · Focus</div>
            <div className="sub-cards">
              {subs.map((s) => (
                <button
                  key={s}
                  className={`sub-card${sub === s ? " is-active" : ""}`}
                  onClick={() => setSub(s)}
                  style={{ ["--accent-card" as string]: INDUSTRY_COLOR[s] }}
                >
                  <div className="sub-card__name">{SUB_INDUSTRY_LABELS[s]}</div>
                  <div className="sub-card__sig">{SIGNATURE[s]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Identity */}
        {sub && (
          <div className="newgame__step rise">
            <div className="newgame__step-label">3 · Identity</div>
            <div className="identity-fields">
              <label className="field">
                <span className="field__label">Founder name</span>
                <input
                  className="input"
                  placeholder="Alex Rivera"
                  value={founderName}
                  onChange={(e) => setFounderName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="field">
                <span className="field__label">Company name</span>
                <input
                  className="input"
                  placeholder={suggestedCompany}
                  value={effectiveCompany}
                  onChange={(e) => {
                    setCompanyTouched(true);
                    setCompanyName(e.target.value);
                  }}
                />
              </label>
            </div>
          </div>
        )}

        <div className="newgame__actions">
          <Button variant="primary" size="md" disabled={!ready} onClick={found}>
            Found {effectiveCompany || "your company"} <Icon name="chevron-right" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
