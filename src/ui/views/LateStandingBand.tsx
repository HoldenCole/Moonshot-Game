// The home reframe: once the late-game slice is born, the dashboard leads with
// the empire's standing — era, stature, power, reach — rather than the
// early-game "raise a round" framing. Repo-native styling so it sits naturally
// above the operating panels. Renders nothing before Scale-Up.
import { useGame } from "@/state/store";
import { formatMoney } from "@/engine/format";
import { Panel } from "@/ui/components/Panel";
import { Stat } from "@/ui/components/controls";

export function LateStandingBand() {
  const late = useGame((s) => s.game?.late);
  const eras = useGame((s) => s.content.late.eras);
  if (!late) return null;
  const s = late.slice;
  const eraName = eras.find((e) => e.id === s.era)?.name ?? s.era;
  const reach = Object.keys(s.subEcon.instances).length;
  const monuments = Object.values(s.megas.builds).reduce((n, v) => n + v, 0);
  const pressures = s.activePressures.length;

  return (
    <Panel className="late-band">
      <div className="late-band__era">
        <span className="late-band__kicker">The Frontier</span>
        <span className="late-band__eraName">{eraName}</span>
      </div>
      <div className="late-band__stats">
        <Stat label="Stature" value={formatMoney(s.stature)} />
        <Stat label="Power" value={`${s.powerAxis.power.toFixed(0)}/7`} />
        <Stat label="Reach" value={`${reach} ${reach === 1 ? "sub-economy" : "sub-economies"}`} />
        <Stat label="Contracts" value={`${s.contracts.active.length} active`} />
        <Stat label="Monuments" value={`${monuments}`} />
        {pressures > 0 && <Stat label="Pressures" value={`${pressures}`} tone="down" />}
      </div>
    </Panel>
  );
}
