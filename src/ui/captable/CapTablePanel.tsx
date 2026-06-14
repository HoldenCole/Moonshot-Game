import { useState } from "react";
import type { CapTable } from "@/domain/captable";
import { Panel, PanelHeader } from "@/ui/components/Panel";
import { Segmented, Tag } from "@/ui/components/controls";
import { founderOwnership } from "@/engine/captable";
import { formatPct } from "@/engine/format";
import { OverviewTab } from "./OverviewTab";
import { HoldersTab } from "./HoldersTab";
import { RoundsTab } from "./RoundsTab";
import { ExitTab } from "./ExitTab";

type Tab = "overview" | "holders" | "rounds" | "exit";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "holders", label: "Holders" },
  { value: "rounds", label: "Round History" },
  { value: "exit", label: "Exit Scenarios" },
];

export function CapTablePanel({ capTable }: { capTable: CapTable }) {
  const [tab, setTab] = useState<Tab>("overview");
  const founderPct = founderOwnership(capTable);

  return (
    <Panel className="captable" coach="captable">
      <PanelHeader
        title="Cap Table"
        sub="Who owns the company, and what it's worth to them"
        right={
          <div className="captable__head-right">
            <Tag tone={founderPct >= 0.5 ? "up" : "warn"}>You: {formatPct(founderPct)}</Tag>
            <Segmented options={TABS} value={tab} onChange={setTab} size="sm" />
          </div>
        }
      />
      <div className="captable__body">
        {tab === "overview" && <OverviewTab capTable={capTable} />}
        {tab === "holders" && <HoldersTab capTable={capTable} />}
        {tab === "rounds" && <RoundsTab capTable={capTable} />}
        {tab === "exit" && <ExitTab capTable={capTable} />}
      </div>
    </Panel>
  );
}
