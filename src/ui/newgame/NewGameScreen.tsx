import { useMemo, useState, type ReactNode } from "react";
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
import { Icon, type IconName } from "@/ui/components/Icon";
import { Button, Segmented, Slider } from "@/ui/components/controls";
import { saveSummary } from "@/state/persist";
import { formatMoney } from "@/engine/format";
import { emitGuided } from "@/ui/tutorial/guidedBus";

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

const INDUSTRY_ICON: Partial<Record<Industry, IconName>> = { ai: "cpu", space: "rocket" };
const INDUSTRY_TAG: Partial<Record<Industry, string>> = {
  ai: "fast cycles, talent-driven",
  space: "capital-heavy, hardware risk",
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
const TILT_BUDGET = 14;
const NEUTRAL_ATTRS: Record<CustomKey, number> = { reputation: 0, warmth: 0, integrity: 0, signature: 0, exec: 0 };

type StepId = "welcome" | "frontier" | "founder" | "difficulty" | "reinvest" | "launch";

export function NewGameScreen() {
  const newGame = useGame((s) => s.newGame);
  const continueGame = useGame((s) => s.continueGame);
  const founders = useGame((s) => s.content.founders);
  const carryOver = useGame((s) => s.carryOver);
  const saved = useMemo(() => saveSummary(), []);

  const [industry, setIndustry] = useState<Industry | null>(null);
  const [sub, setSub] = useState<PlayableSubIndustry | null>(null);
  const [archetypeId, setArchetypeId] = useState<string | null>(null);
  const [customAttrs, setCustomAttrs] = useState<Record<CustomKey, number>>(NEUTRAL_ATTRS);
  const [relaxedBudget, setRelaxedBudget] = useState(false);
  const [age, setAge] = useState(35);
  const [founderName, setFounderName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTouched, setCompanyTouched] = useState(false);
  const [axes, setAxes] = useState<DifficultyAxes>(PRESET_AXES.realistic);
  const [newsCycle, setNewsCycle] = useState<NewsCycle>("medium");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const carriedCash = carryOver?.personalCash ?? 0;
  const hasCarry = carriedCash > 0;
  const [reinvest, setReinvest] = useState(carriedCash);

  const STEPS = useMemo<StepId[]>(
    () => ["welcome", "frontier", "founder", "difficulty", ...(hasCarry ? (["reinvest"] as StepId[]) : []), "launch"],
    [hasCarry],
  );
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx]!;

  const preset = matchingPreset(axes);
  const suggestedCompany = sub ? NAME_SUGGESTIONS[sub] : "";
  const effectiveCompany = companyTouched ? companyName : suggestedCompany;
  const tiltUsed = CUSTOM_ATTRS.reduce((s, a) => s + customAttrs[a.key], 0);
  const overBudget = archetypeId === "custom" && !relaxedBudget && tiltUsed > TILT_BUDGET;
  const subs = useMemo(() => (industry ? SUBS[industry] : []), [industry]);

  const archMult = archetypeId === "custom" ? 1 : founders.find((f) => f.id === archetypeId)?.modifiers.starting_cash_mult ?? 1;
  const baseCash = Math.round(0.75 * axes.startingCapital * archMult * 100) / 100;

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

  const selectArchetype = (id: string) => {
    const next = archetypeId === id ? null : id;
    setArchetypeId(next);
    if (next) emitGuided("founder_archetype_selected");
  };

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
      ...(hasCarry ? { reinvest } : {}),
    });
  };

  const canAdvance = step === "frontier" ? Boolean(industry && sub) : step === "founder" ? !overBudget : true;
  const goNext = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const goBack = () => setStepIdx((i) => Math.max(0, i - 1));

  const contentSteps = STEPS.slice(1);
  const contentIdx = stepIdx - 1;

  return (
    <div className={`ng ng--${step}`}>
      <div className="ng__backdrop" aria-hidden>
        <span className="ng__aurora" />
        <span className="ng__stars" />
      </div>

      <div className="ng__frame">
        <header className="ng__top">
          <div className="ng__brand">
            <Icon name="rocket" size={20} /> <span>Moonshot Inc</span>
          </div>
          {step !== "welcome" && (
            <div className="ng-progress" role="tablist" aria-label="Setup steps">
              {contentSteps.map((s, i) => (
                <button
                  key={s}
                  className={`ng-progress__dot${i === contentIdx ? " is-active" : ""}${i < contentIdx ? " is-done" : ""}`}
                  onClick={() => i <= contentIdx && setStepIdx(i + 1)}
                  disabled={i > contentIdx}
                  aria-label={`Step ${i + 1}`}
                  aria-selected={i === contentIdx}
                />
              ))}
            </div>
          )}
        </header>

        <main className="ng__stage" key={step}>
          {step === "welcome" && (
            <div className="ng-welcome">
              <div className="ng-welcome__halo">
                <Icon name="rocket" size={46} />
              </div>
              <h1 className="ng-welcome__title">Moonshot Inc</h1>
              <p className="ng-welcome__tag">
                Found a frontier-tech company, raise the money, and build the thing — from a garage to the bell at the
                exchange.
              </p>
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
              <Button variant="primary" size="md" className="ng-welcome__cta" onClick={goNext}>
                {saved ? "Start a new company" : "Found a company"} <Icon name="chevron-right" size={16} />
              </Button>
            </div>
          )}

          {step === "frontier" && (
            <>
              <StepHead kicker="Frontier" title="Choose your arena" sub="Two playable frontiers — pick where you'll build." />
              <div className="industry-cards">
                {PLAYABLE_INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    className={`industry-card ng-ind ng-ind--${ind}${industry === ind ? " is-active" : ""}`}
                    onClick={() => {
                      setIndustry(ind);
                      setSub(null);
                    }}
                  >
                    <span className="ng-ind__icon">
                      <Icon name={INDUSTRY_ICON[ind] ?? "world"} size={24} />
                    </span>
                    <div className="industry-card__name">{industryLabel(ind)}</div>
                    <div className="industry-card__sub">
                      {SUBS[ind].length} focuses · {INDUSTRY_TAG[ind] ?? ""}
                    </div>
                  </button>
                ))}
              </div>
              {industry && (
                <div className="ng-substep rise">
                  <div className="ng-substep__label">Pick your focus — it sets your signature mechanic</div>
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
            </>
          )}

          {step === "founder" && (
            <>
              <StepHead kicker="Founder" title="Who are you?" sub="Your background tilts how you start — no wrong choice." />
              {founders.length > 0 && (
                <>
                  <div className="founder-cards" data-guide="founder-step-archetype">
                    {founders.map((f) => (
                      <button
                        key={f.id}
                        className={`founder-card${archetypeId === f.id ? " is-active" : ""}`}
                        onClick={() => selectArchetype(f.id)}
                      >
                        <div className="founder-card__name">{f.name}</div>
                        <div className="founder-card__hint">{f.playstyle_hint}</div>
                      </button>
                    ))}
                    <button
                      className={`founder-card founder-card--custom${archetypeId === "custom" ? " is-active" : ""}`}
                      onClick={() => selectArchetype("custom")}
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
                              width: relaxedBudget ? "100%" : `${Math.max(0, Math.min(100, (tiltUsed / TILT_BUDGET) * 100))}%`,
                              background: overBudget ? "var(--down)" : relaxedBudget ? "var(--text-faint)" : "var(--accent)",
                            }}
                          />
                        </span>
                        <span className={`founder-custom__budget-val${overBudget ? " down" : ""}`}>
                          {relaxedBudget ? `${tiltUsed} · free` : `${tiltUsed} / ${TILT_BUDGET}`}
                        </span>
                      </div>
                      <label className="founder-custom__relaxed">
                        <input type="checkbox" checked={relaxedBudget} onChange={(e) => setRelaxedBudget(e.target.checked)} />
                        <span>
                          Relaxed budget <em>— ignore the cap (easier; min-max your founder)</em>
                        </span>
                      </label>
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
                  <input className="input" placeholder="Alex Rivera" value={founderName} onChange={(e) => setFounderName(e.target.value)} autoFocus />
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
            </>
          )}

          {step === "difficulty" && (
            <>
              <StepHead kicker="World" title="Set the difficulty" sub="Presets pre-fill the world; tune any axis under Advanced." />
              <div className="difficulty-cards">
                {PRESETS.map((p) => (
                  <button key={p.id} className={`difficulty-card${preset === p.id ? " is-active" : ""}`} onClick={() => setAxes(PRESET_AXES[p.id])}>
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
                  <Segmented size="sm" value={newsCycle} onChange={(v) => setNewsCycle(v as NewsCycle)} options={NEWS_CYCLES.map((n) => ({ value: n.id, label: n.label }))} />
                  <div className="difficulty-news__blurb">{NEWS_CYCLES.find((n) => n.id === newsCycle)?.blurb}</div>
                </div>
              </div>
              <button className={`difficulty-advanced-toggle${advancedOpen ? " is-open" : ""}`} onClick={() => setAdvancedOpen((o) => !o)} aria-expanded={advancedOpen}>
                <Icon name="chevron-right" size={13} />
                Advanced — tune each axis
              </button>
              {advancedOpen && (
                <div className="difficulty-sliders">
                  {AXES.map((a) => (
                    <Slider key={a.key} label={a.label} value={axes[a.key]} min={a.min} max={a.max} step={0.05} onChange={(v) => setAxes({ ...axes, [a.key]: v })} format={(v) => `${v.toFixed(2)}×`} hint={a.hint} />
                  ))}
                </div>
              )}
            </>
          )}

          {step === "reinvest" && (
            <>
              <StepHead
                kicker="Reinvest"
                title="Put your fortune to work"
                sub={`You walked away from your last company with ${formatMoney(carriedCash)}. Pour some into ${effectiveCompany || "the new company"} — or keep it personal.`}
              />
              <div className="ng-reinvest">
                <Slider
                  label="Reinvest into the company"
                  value={Math.min(reinvest, carriedCash)}
                  min={0}
                  max={carriedCash}
                  step={Math.max(0.1, Math.round((carriedCash / 20) * 10) / 10)}
                  onChange={setReinvest}
                  format={(v) => formatMoney(v)}
                  hint="It becomes the new company's starting cash — non-dilutive, all yours."
                />
                <div className="ng-reinvest__split">
                  <div className="ng-reinvest__cell">
                    <span className="ng-reinvest__k">Company starts with</span>
                    <span className="ng-reinvest__v num">{formatMoney(baseCash + Math.min(reinvest, carriedCash))}</span>
                  </div>
                  <div className="ng-reinvest__cell">
                    <span className="ng-reinvest__k">You keep personal</span>
                    <span className="ng-reinvest__v num">{formatMoney(carriedCash - Math.min(reinvest, carriedCash))}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === "launch" && (
            <>
              <StepHead kicker="Launch" title={`Found ${effectiveCompany || "your company"}?`} sub="One last look, then you're in the garage." />
              <div className="ng-review">
                <ReviewRow k="Company" v={effectiveCompany || suggestedCompany || "—"} />
                <ReviewRow k="Frontier" v={industry && sub ? `${industryLabel(industry)} · ${SUB_INDUSTRY_LABELS[sub]}` : "—"} />
                <ReviewRow k="Founder" v={`${founderName.trim() || "Alex Rivera"}${archetypeLabel(archetypeId, founders) ? ` · ${archetypeLabel(archetypeId, founders)}` : ""}`} />
                <ReviewRow k="Difficulty" v={`${PRESETS.find((p) => p.id === preset)?.label ?? "Custom"} · ${newsCycle} news`} />
                <ReviewRow k="Starting cash" v={formatMoney(baseCash + (hasCarry ? Math.min(reinvest, carriedCash) : 0))} />
              </div>
            </>
          )}
        </main>

        {step !== "welcome" && (
          <footer className="ng__nav">
            <button className="ng__back" onClick={goBack}>
              ‹ Back
            </button>
            <div className="ng__nav-right">
              {industry && sub && step !== "launch" && (
                <button className="ng__quick" onClick={found} title="Found now with these choices and defaults for the rest">
                  Quick start
                </button>
              )}
              {step === "launch" ? (
                <Button variant="primary" size="md" data-guide="new-game-confirm" onClick={found}>
                  Found {effectiveCompany || suggestedCompany} <Icon name="chevron-right" size={16} />
                </Button>
              ) : (
                <Button variant="primary" size="md" disabled={!canAdvance} onClick={goNext}>
                  Continue <Icon name="chevron-right" size={16} />
                </Button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function archetypeLabel(id: string | null, founders: FounderContent[]): string {
  if (!id) return "";
  if (id === "custom") return "Custom founder";
  return founders.find((f) => f.id === id)?.name ?? "";
}

function StepHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="ng-head">
      <div className="ng-head__kicker">{kicker}</div>
      <h2 className="ng-head__title">{title}</h2>
      {sub && <p className="ng-head__sub">{sub}</p>}
    </div>
  );
}

function ReviewRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="ng-review__row">
      <span className="ng-review__k">{k}</span>
      <span className="ng-review__v">{v}</span>
    </div>
  );
}
