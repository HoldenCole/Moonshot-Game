import { useMemo } from "react";
import { useGame } from "@/state/store";
import type { Autonomy, ExecArea } from "@/domain/state";
import { AREAS, AREA_LABEL, generateCandidates } from "@/engine/delegation";
import { makeRng } from "@/engine/rng";
import { formatMoney } from "@/engine/format";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Button, Segmented } from "@/ui/components/controls";

const AUTONOMY_OPTS: { value: Autonomy; label: string }[] = [
  { value: "decide", label: "I'll decide" },
  { value: "recommend", label: "Recommend" },
  { value: "handle", label: "Handle it" },
];

/** Light delegation (Phase 9): hire an exec per area and set its autonomy.
 *  "Handle it" auto-resolves that area's events on advance — the cadence valve. */
export function TeamView() {
  const game = useGame((s) => s.game);
  if (!game) return null;

  return (
    <div className="workspace-scroll">
      <Panel className="team">
        <PanelHeader
          title="Your Executives"
          sub="Delegate an area and its decisions resolve themselves on advance — the pressure valve that makes a hands-off pace viable."
        />
        <div className="team-list">
          {AREAS.map((area) => (
            <AreaRow key={area} area={area} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AreaRow({ area }: { area: ExecArea }) {
  const game = useGame((s) => s.game)!;
  const hireExec = useGame((s) => s.hireExec);
  const hireExecWithStock = useGame((s) => s.hireExecWithStock);
  const setAutonomy = useGame((s) => s.setAutonomy);
  const exec = game.company.executives[area];
  const autonomy = game.company.delegation[area];
  const valuation = game.company.financials.valuation;

  const candidates = useMemo(
    () => generateCandidates(area, game, makeRng((game.meta.seed ^ (AREAS.indexOf(area) * 2654435761)) >>> 0)),
    [area, game.meta.seed, game.company.financials.valuation],
  );

  return (
    <div className="area-row">
      <div className="area-row__head">
        <div>
          <div className="area-row__name">{AREA_LABEL[area]}</div>
          <div className="area-row__role">{exec ? exec.role : "Unfilled"}</div>
        </div>
        {exec && (
          <Segmented
            size="sm"
            value={autonomy}
            onChange={(v) => setAutonomy(area, v)}
            options={AUTONOMY_OPTS}
          />
        )}
      </div>

      {exec ? (
        <div className="exec-card">
          <span className="avatar">{initials(exec.name)}</span>
          <div className="exec-card__id">
            <div className="exec-card__name">{exec.name}</div>
            <div className="qbar qbar--inline">
              <span className="qbar__label">Quality</span>
              <span className="qbar__track">
                <span className="qbar__fill" style={{ width: `${exec.quality}%` }} />
              </span>
              <span className="qbar__val num">{exec.quality}</span>
            </div>
          </div>
          <div className="exec-card__auto">
            {autonomy === "handle" ? "Handles this area's calls for you." : autonomy === "recommend" ? "Surfaces with a recommendation." : "Surfaces every decision to you."}
          </div>
        </div>
      ) : (
        <div className="hire-row">
          {candidates.map((c, i) => {
            const afford = game.company.financials.cash >= c.cost;
            const baseExec = { name: c.name, role: c.role, area: c.area, quality: c.quality };
            // Stock comp prices the same package against the live mark; offered
            // only when there's a real valuation and the grant stays under half.
            const equityPct = valuation > 0 ? c.cost / valuation : Infinity;
            const canStock = equityPct > 0 && equityPct < 0.5;
            return (
              <div key={i} className="hire-card">
                <div className="hire-card__name">{c.name}</div>
                <div className="qbar qbar--inline">
                  <span className="qbar__track">
                    <span className="qbar__fill" style={{ width: `${c.quality}%` }} />
                  </span>
                  <span className="qbar__val num">{c.quality}</span>
                </div>
                <div className="hire-card__offers">
                  <Button variant="subtle" size="sm" disabled={!afford} onClick={() => hireExec(baseExec, c.cost)}>
                    Cash · {formatMoney(c.cost)}
                  </Button>
                  <Button variant="subtle" size="sm" disabled={!canStock} title={canStock ? `Grant ${formatPct(equityPct)} equity instead of cash` : "Needs a real valuation to grant stock"} onClick={() => hireExecWithStock(baseExec, c.cost)}>
                    Stock · {canStock ? formatPct(equityPct) : "—"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/** A compact equity percentage — "0.4%" for small grants, "12%" for larger. */
function formatPct(frac: number): string {
  const pct = frac * 100;
  return `${pct < 1 ? pct.toFixed(2) : pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;
}
