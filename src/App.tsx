import { useGame } from "@/state/store";
import { GameShell } from "@/ui/frame/GameShell";
import { NewGameScreen } from "@/ui/newgame/NewGameScreen";
import { BetweenCompanies } from "@/ui/exit/BetweenCompanies";
import { GuidedTutorial } from "@/ui/tutorial/GuidedTutorial";

export function App() {
  const game = useGame((s) => s.game);
  const screen = game?.runOutcome ? <BetweenCompanies /> : game ? <GameShell /> : <NewGameScreen />;
  // The guided tour spans the new-game screen and the shell, so it lives above
  // both rather than inside either.
  return (
    <>
      {screen}
      <GuidedTutorial />
    </>
  );
}
