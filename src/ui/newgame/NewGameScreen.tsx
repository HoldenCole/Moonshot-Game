import { useMemo, useState } from "react";
import { useGame } from "@/state/store";
import {
  PLAYABLE_INDUSTRIES,
  SUB_INDUSTRY_LABELS,
  industryLabel,
  type Industry,
  type PlayableSubIndustry,
} from "@/domain/ids";
import type { DifficultyAxes, NewsCycle } from "@/domain/state";
import type { FounderContent } from "@/domain/content";
import { AXES, NEWS_CYCLES, PRESET_AXES, PRESETS, matchingPreset, previewBars } from "@/engine/difficulty";
import { Icon } from "@/ui/components/Icon";
import { Button, Segmented, Slider } from "@/ui/components/controls";
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

// The custom-founder builder exposes the same dimensions the presets tune, under
// friendly labels. A net-advantage "tilt budget" bounds a hand-built founder so
// it can't out-tilt the curated archetypes; weaknesses (negatives) buy strengths.
const CUSTOM_ATTRS = [
  { key: "reputation", label: "Reputation", min: -5, max: 10, hint: "How known you are — affects hiring and the investor signal." },
  { key: "warmth", label: "Investor Network", min: -10, max: 12, hint: "Rapport with VCs — warms every negotiation." },
  { key: "integrity", label: "Integrity", min: -8, max: 8, hint: "Your ethics baseline — the hidden risk meter." },
  { key: "signature", label: "Technical Credibility", min: -5, max: 10, hint: "A head start in the lab / on the pad." },
  { key: "exec", label: "Team Builder", min: 0, max: 10, hint: "The quality of your first executive hires." },
] as const;
type CustomKey = (typeof CUSTOM_ATTRS)[number]["key"];
const TILT_BUDGET = 22;
const NEUTRAL_ATTRS: Record<CustomKey, number> = { reputation: 0, warmth: 0, integrity: 0, signature: 0, exec: 0 };

export function NewGameScreen() {
  const newGame = useGame((s) => s.newGame);
  const continueGame = useGame((s) => s.continueGame);
  const founders = useGame((s) => s.content.founders);
  const saved = useMemo(() => saveSummary(), []);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [sub, setSub] = useState<PlayableSubIndustry | null>(null);
  const [archetypeId, setArchetypeId] = useState<string | null>(null);
  const [customAttrs, setCustomAttrs] = useState<Record<CustomKey, number>>(NEUTRAL_ATTRS);
  const [age, setAge] = useState(35);
  const [founderName, setFounderName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTouched, setCompanyTouched] = useState(false);
  const [axes, setAxes] = useState<DifficultyAxes>(PRESET_AXES.realistic);
  const [newsCycle, setNewsCycle] = useState<NewsCycle>("medium");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const preset = matchingPreset(axes); // derived: which card is lit, or "custom"

  const suggestedCompany = sub ? NAME_SUGGESTIONS[sub] : "";
  const effectiveCompany = companyTouched ? companyName : suggestedCompany;
  const tiltUsed = CUSTOM_ATTRS.reduce((s, a) => s + customAttrs[a.key], 0);
  const overBudget = archetypeId === "custom" && tiltUsed > TILT_BUDGET;
  const ready = Boolean(industry && sub && founderName.trim() && effectiveCompany.trim() && !overBudget);

  const subs = useMemo(() => (industry ? SUBS[industry] : []), [industry]);

  /** Build a FounderContent from the custom sliders — same shape as a preset, so
   *  createNewGame can't tell them apart. Cash comes from the difficulty axis
   *  (one source of truth), so the multiplier stays neutral. */
  const customFounder = (): FounderContent => ({
    id: "custom",
    name: "Custom Founder",
    blurb: "A founder of your own design.",
    playstyle_hint: "Custom",
    modifiers: {
      starting_reputation: customAttrs.reputation,
      starting_cash_mult: 1.0,
      investor_warmth: customAttrs.warmth,
      integrity_baseline: customAttrs.integrity,
      signature_lean: customAttrs.signature,
      exec_quality_floor: customAttrs.exec,
      sub_system_lean: "custom",
    },
  });

  const found = () => {
    if (!industry || !sub) return;
    const custom = archetypeId === "custom";
    newGame({
      founderName: founderName.trim() || "Alex Rivera",
      companyName: effectiveCompany.trim() || suggestedCompany,
      industry,
      subIndustry: sub,
      color: INDUSTRY_COLOR[sub] ?? "#5b82ff",
      seed: Math.floor(Math.random() * 2 ** 31),
      difficulty: { preset, newsCycle, axes },
      archetype: custom ? customFounder() : founders.find((f) => f.id === archetypeId),
      ...(custom ? { age } : {}),
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

        {/* Step 3 — Founder */}
        {sub && (
          <div className="newgame__step rise">
            <div className="newgame__step-label">3 · Founder</div>
            {founders.length > 0 && (
              <>
                <div className="founder-cards">
                  {founders.map((f) => (
                    <button
                      key={f.id}
                      className={`founder-card${archetypeId === f.id ? " is-active" : ""}`}
                      onClick={() => setArchetypeId(archetypeId === f.id ? null : f.id)}
                    >
                      <div className="founder-card__name">{f.name}</div>
                      <div className="founder-card__hint">{f.playstyle_hint}</div>
                    </button>
                  ))}
                  <button
                    className={`founder-card founder-card--custom${archetypeId === "custom" ? " is-active" : ""}`}
                    onClick={() => setArchetypeId(archetypeId === "custom" ? null : "custom")}
                  >
                    <div className="founder-card__name">Custom</div>
                    <div className="founder-card__hint">Build your own founder — set the tilts by hand.</div>
                  </button>
                </div>

                {archetypeId === "custom" ? (
                  <div className="founder-custom">
                    <div className="founder-custom__budget">
                      <span className="founder-custom__budget-label">Tilt budget</span>
                      <span className="founder-custom__track">
                        <span
                          className="founder-custom__fill"
                          style={{
                            width: `${Math.max(0, Math.min(100, (tiltUsed / TILT_BUDGET) * 100))}%`,
                            background: overBudget ? "var(--down)" : "var(--accent)",
                          }}
                        />
                      </span>
                      <span className={`founder-custom__budget-val${overBudget ? " down" : ""}`}>
                        {tiltUsed} / {TILT_BUDGET}
                      </span>
                    </div>
                    <div className="founder-custom__sliders">
                      {CUSTOM_ATTRS.map((a) => (
                        <Slider
                          key={a.key}
                          label={a.label}
                          value={customAttrs[a.key]}
                          min={a.min}
                          max={a.max}
                          step={1}
                          onChange={(v) => setCustomAttrs({ ...customAttrs, [a.key]: v })}
                          format={(v) => (v > 0 ? `+${v}` : `${v}`)}
                          hint={a.hint}
                        />
                      ))}
                      <Slider
                        label="Starting capital"
                        value={Math.round(0.75 * axes.startingCapital * 100) / 100}
                        min={0.4}
                        max={1.35}
                        step={0.05}
                        onChange={(v) => setAxes({ ...axes, startingCapital: v / 0.75 })}
                        format={(v) => formatMoney(v)}
                        hint="Your founder/F&F capital — shared with the Starting Capital difficulty slider."
                      />
                      <Slider
                        label="Age"
                        value={age}
                        min={22}
                        max={70}
                        step={1}
                        onChange={setAge}
                        format={(v) => `${v}`}
                        hint="Flavor for now — seeds the lifespan clock if a mortal/Dynasty mode is on."
                      />
                    </div>
                    {overBudget && (
                      <p className="founder-custom__warn">
                        Over the tilt budget — dial back a strength, or take a weakness to afford it.
                      </p>
                    )}
                  </div>
                ) : archetypeId ? (
                  <p className="founder-blurb">{founders.find((f) => f.id === archetypeId)?.blurb}</p>
                ) : null}
              </>
            )}
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

        {/* Step 4 — Difficulty */}
        {sub && (
          <div className="newgame__step rise">
            <div className="newgame__step-label">4 · Difficulty</div>
            <div className="difficulty-cards">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`difficulty-card${preset === p.id ? " is-active" : ""}`}
                  onClick={() => setAxes(PRESET_AXES[p.id])}
                >
                  <div className="difficulty-card__name">{p.label}</div>
                  <div className="difficulty-card__tag">{p.tagline}</div>
                </button>
              ))}
            </div>

            <div className="difficulty-preview">
              <div className="difficulty-preview__bars">
                <div className="difficulty-preview__cap">
                  The world this builds
                  {preset === "custom" && <span className="difficulty-custom-tag">Custom</span>}
                </div>
                {previewBars(axes).map((b) => (
                  <div key={b.label} className="profilebar" title={b.hint}>
                    <span className="profilebar__label">{b.label}</span>
                    <span className="profilebar__track">
                      <span className="profilebar__fill" style={{ width: `${Math.round(b.fill * 100)}%` }} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="difficulty-news">
                <div className="difficulty-news__label">News cycle</div>
                <Segmented
                  size="sm"
                  value={newsCycle}
                  onChange={(v) => setNewsCycle(v as NewsCycle)}
                  options={NEWS_CYCLES.map((n) => ({ value: n.id, label: n.label }))}
                />
                <div className="difficulty-news__blurb">{NEWS_CYCLES.find((n) => n.id === newsCycle)?.blurb}</div>
              </div>
            </div>

            <button
              className={`difficulty-advanced-toggle${advancedOpen ? " is-open" : ""}`}
              onClick={() => setAdvancedOpen((o) => !o)}
              aria-expanded={advancedOpen}
            >
              <Icon name="chevron-right" size={13} />
              Advanced — tune each axis
            </button>
            {advancedOpen && (
              <div className="difficulty-sliders">
                {AXES.map((a) => (
                  <Slider
                    key={a.key}
                    label={a.label}
                    value={axes[a.key]}
                    min={a.min}
                    max={a.max}
                    step={0.05}
                    onChange={(v) => setAxes({ ...axes, [a.key]: v })}
                    format={(v) => `${v.toFixed(2)}×`}
                    hint={a.hint}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="newgame__actions">
          <Button variant="primary" size="md" disabled={!(industry && sub)} onClick={found}>
            {ready ? `Found ${effectiveCompany}` : "Quick start"} <Icon name="chevron-right" size={16} />
          </Button>
          {industry && sub && !ready && (
            <p className="newgame__quickstart-note">
              Quick start founds with a default founder name and Realistic difficulty — or fill in the details above to customize.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
