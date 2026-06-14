import { useState } from "react";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { WealthPopover } from "./WealthPopover";
import { latestPostMoney, founderOwnership } from "@/engine/captable";
import { runwayMonths } from "@/engine/finance";
import { WEEKS_PER_MONTH, weeksToCritical } from "@/engine/tick";
import { formatMoney } from "@/engine/format";
import { industryLabel } from "@/domain/ids";
import { showsRunwayForecast } from "@/engine/difficulty";
import { Icon } from "@/ui/components/Icon";
import { FlashNum } from "@/ui/components/FlashNum";
import { usePrefs } from "@/state/prefs";

const MACRO_LABEL: Record<string, string> = {
  expansion: "Expansion",
  peak: "Peak",
  contraction: "Contraction",
  trough: "Trough",
  recovery: "Recovery",
};

function climateLabel(v: number): string {
  if (v < 20) return "Frozen";
  if (v < 40) return "Cool";
  if (v < 65) return "Normal";
  if (v < 85) return "Hot";
  return "Frothy";
}

function Gauge({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "warn" }) {
  return (
    <div className="gauge">
      <span className="gauge__label">{label}</span>
      <span className={`gauge__value num${tone ? " gauge__value--" + tone : ""}`}>{value}</span>
    </div>
  );
}

export function TopBar() {
  const game = useGame((s) => s.game);
  const tuning = useGame((s) => s.content.tuning);
  const advance = useGame((s) => s.advance);
  const openPalette = useUi((s) => s.setPaletteOpen);
  if (!game) return null;

  const { world, company, founder, clock } = game;
  const post = latestPostMoney(company.capTable);
  const nw = founderOwnership(company.capTable) * post + founder.personalCash;
  const hype = world.hype[company.industry] ?? 50;
  const runway = runwayMonths(company);

  const ipoTone = world.ipoWindow === "open" ? "up" : world.ipoWindow === "closed" ? "down" : "warn";

  const pendingDecision = game.alerts.length > 0 || game.pendingEvent != null;
  const wksCritical = weeksToCritical(game, tuning);
  // News Cycle governs how much foresight you get: the exact week forecast is an
  // "Easy" affordance; otherwise you get a qualitative read.
  const hint = pendingDecision
    ? "Decision pending"
    : runway === Infinity
      ? "Cash-flow positive"
      : wksCritical > tuning.advance.nextDecisionCapWeeks
        ? "Runway healthy"
        : showsRunwayForecast(game.difficulty)
          ? `~${wksCritical} wks to runway pressure`
          : "Runway tightening";

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__company">
          <span className="topbar__dot" style={{ background: company.color }} />
          <div>
            <div className="topbar__company-name">{company.name}</div>
            <div className="topbar__company-sub">{industryLabel(company.industry)}</div>
          </div>
        </div>
      </div>

      <div className="topbar__time" data-coach="advance">
        <button className="time-btn" onClick={() => advance({ type: "weeks", weeks: 1 })}>
          <Icon name="chevron-right" size={15} /> Week
        </button>
        <button className="time-btn" onClick={() => advance({ type: "weeks", weeks: Math.round(WEEKS_PER_MONTH) })}>
          <Icon name="chevron-right" size={15} /> Month
        </button>
        <button
          className={`time-btn time-btn--primary${pendingDecision ? " is-blocked" : ""}`}
          onClick={() => advance({ type: "nextDecision" })}
          disabled={pendingDecision}
          title={pendingDecision ? "Resolve the open decision first" : "Skip quiet weeks to the next decision"}
        >
          <Icon name="chevron-right" size={15} /> Next decision
        </button>
        <div className="time-clock num" title="Weeks since founding">
          <Icon name="clock" size={14} />
          W{clock.week}
        </div>
        <span className={`time-hint${pendingDecision ? " time-hint--alert" : ""}`}>{hint}</span>
      </div>

      <div className="topbar__gauges">
        <Gauge label="Macro" value={MACRO_LABEL[world.macroPhase] ?? world.macroPhase} />
        <Gauge label="Rates" value={`${world.interestRate.toFixed(1)}%`} />
        <Gauge label="VC Climate" value={climateLabel(world.vcClimate)} tone={world.vcClimate >= 65 ? "up" : undefined} />
        <Gauge label="IPO Window" value={cap(world.ipoWindow)} tone={ipoTone} />
        <Gauge label={`${industryLabel(company.industry)} Hype`} value={String(Math.round(hype))} tone={hype >= 70 ? "warn" : undefined} />
      </div>

      <div className="topbar__right">
        <Wealth nw={nw} />
        <div className="topbar__runway" data-coach="runway">
          <span className="topbar__networth-label">Runway</span>
          <span className={`topbar__networth-value num${runway !== Infinity && runway <= tuning.runway.criticalMonths ? " gauge__value--down" : ""}`}>
            {runway === Infinity ? "∞" : `${Math.max(0, Math.floor(runway))}mo`}
          </span>
        </div>
        <Settings />
        <button className="cmdk" title="Command palette (⌘K)" onClick={() => openPalette(true)} aria-label="Open command palette">
          <Icon name="command" size={14} />K
        </button>
      </div>
    </header>
  );
}

function Wealth({ nw }: { nw: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="topbar__wealth">
      <button className="topbar__networth" onClick={() => setOpen((o) => !o)} title="Net worth breakdown">
        <span className="topbar__networth-label">Net worth</span>
        <span className="topbar__networth-value num">
          {nw > 0 ? <FlashNum value={nw} format={(n) => formatMoney(n)} count /> : "—"}
        </span>
      </button>
      {open && <WealthPopover onClose={() => setOpen(false)} />}
    </div>
  );
}

function Settings() {
  const theme = usePrefs((s) => s.theme);
  const reduceMotion = usePrefs((s) => s.reduceMotion);
  const tutorialOn = usePrefs((s) => s.tutorialEnabled);
  const toggleTheme = usePrefs((s) => s.toggleTheme);
  const setReduceMotion = usePrefs((s) => s.setReduceMotion);
  const setTutorialEnabled = usePrefs((s) => s.setTutorialEnabled);
  const resetHints = usePrefs((s) => s.resetHints);
  return (
    <div className="topbar__settings">
      <button
        className="iconbtn"
        onClick={toggleTheme}
        title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        aria-label="Toggle theme"
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
      </button>
      <button
        className={`iconbtn${reduceMotion ? " is-on" : ""}`}
        onClick={() => setReduceMotion(!reduceMotion)}
        title={reduceMotion ? "Motion reduced — click to enable" : "Reduce motion"}
        aria-label="Toggle reduced motion"
      >
        <Icon name="motion" size={16} />
      </button>
      <button
        className={`iconbtn${tutorialOn ? " is-on" : ""}`}
        onClick={() => (tutorialOn ? setTutorialEnabled(false) : resetHints())}
        title={tutorialOn ? "Tips on — click to turn off" : "Tips off — click to replay them"}
        aria-label="Toggle onboarding tips"
      >
        <Icon name="info" size={16} />
      </button>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
