import { useGame } from "@/state/store";
import { GameShell } from "@/ui/frame/GameShell";
import { NewGameScreen } from "@/ui/newgame/NewGameScreen";

export function App() {
  const game = useGame((s) => s.game);
  return game ? <GameShell /> : <NewGameScreen />;
}
