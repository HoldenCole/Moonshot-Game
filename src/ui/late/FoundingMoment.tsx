// Binds the founding interstitial to the freshly-created game: builds the
// articles-of-incorporation facts and clears the "just founded" moment when the
// trajectory finishes, handing the player into the shell.
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { subIndustryLabel } from "@/domain/ids";
import { formatMoney } from "@/engine/format";
import { FoundingInterstitial, type FoundingFacts, type LoadStage } from "./FoundingInterstitial";

const STAGES: LoadStage[] = [
  { at: 0, html: "filing the articles of incorporation…" },
  { at: 0.32, html: "wiring the first capital…" },
  { at: 0.62, html: "hiring the first believers…" },
  { at: 0.9, html: "opening the doors…" },
];

export function FoundingMoment() {
  const game = useGame((s) => s.game);
  const loading = useGame((s) => s.content.lateLoading);
  const setJustFounded = useUi((s) => s.setJustFounded);
  if (!game) return null;
  const c = game.company;
  const facts: FoundingFacts = {
    companyName: c.name,
    founderName: game.founder.name,
    frontierLabel: subIndustryLabel(c.subIndustry),
    cashLabel: formatMoney(c.financials.cash),
    employees: c.financials.headcount,
    eraName: "The Garage Years",
    foundingLine: loading.founding[c.subIndustry] ?? loading.generic[0] ?? "The frontier begins with a single decision.",
  };
  return <FoundingInterstitial mode="founding" facts={facts} stages={STAGES} onDone={() => setJustFounded(false)} />;
}
