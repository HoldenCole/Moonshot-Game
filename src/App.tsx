import { useGame } from "@/state/store";
import { GameShell } from "@/ui/frame/GameShell";
import { NewGameScreen } from "@/ui/newgame/NewGameScreen";
import { BetweenCompanies } from "@/ui/exit/BetweenCompanies";

export function App() {
  const game = useGame((s) => s.game);
  if (game?.runOutcome) return <BetweenCompanies />;
  return game ? <GameShell /> : <NewGameScreen />;
}
