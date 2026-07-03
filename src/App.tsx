import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { GameShell } from "@/ui/frame/GameShell";
import { NewGameScreen } from "@/ui/newgame/NewGameScreen";
import { BetweenCompanies } from "@/ui/exit/BetweenCompanies";
import { FoundingMoment } from "@/ui/late/FoundingMoment";
import { GuidedTutorial } from "@/ui/tutorial/GuidedTutorial";

export function App() {
  const game = useGame((s) => s.game);
  const justFounded = useUi((s) => s.justFounded);
  const screen = game?.runOutcome ? (
    <BetweenCompanies />
  ) : game && justFounded ? (
    <FoundingMoment />
  ) : game ? (
    <GameShell />
  ) : (
    <NewGameScreen />
  );
  // The guided tour spans the new-game screen and the shell, so it lives above
  // both rather than inside either.
  return (
    <>
      {screen}
      <GuidedTutorial />
    </>
  );
}
