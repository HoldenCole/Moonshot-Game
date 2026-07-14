import { useEffect } from "react";
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { GameShell } from "@/ui/frame/GameShell";
import { TitleScreen } from "@/ui/title/TitleScreen";
import { NewGameScreen } from "@/ui/newgame/NewGameScreen";
import { BetweenCompanies } from "@/ui/exit/BetweenCompanies";
import { FoundingMoment } from "@/ui/late/FoundingMoment";
import { LoadingMoment } from "@/ui/late/LoadingMoment";
import { SettingsModal } from "@/ui/settings/SettingsModal";
import { GuidedTutorial } from "@/ui/tutorial/GuidedTutorial";

export function App() {
  const game = useGame((s) => s.game);
  const screen = useUi((s) => s.screen);
  const setScreen = useUi((s) => s.setScreen);
  const justFounded = useUi((s) => s.justFounded);

  // A run appearing outside the title flow (wizard finished, save loaded)
  // lands the player in the game once the founding moment has played.
  useEffect(() => {
    if (game && !justFounded && screen === "newgame") setScreen("game");
  }, [game, justFounded, screen, setScreen]);

  // The window carries the run: "Helion Labs · W34 — Moonshot Inc".
  useEffect(() => {
    document.title = game && screen === "game" ? `${game.company.name} · W${game.clock.week} — Moonshot Inc` : "Moonshot Inc";
  }, [game, screen]);

  const body =
    game && justFounded ? (
      <FoundingMoment />
    ) : screen === "title" ? (
      <TitleScreen />
    ) : screen === "newgame" ? (
      <NewGameScreen />
    ) : game && screen === "loading" ? (
      <LoadingMoment />
    ) : game?.runOutcome ? (
      <BetweenCompanies />
    ) : game ? (
      <GameShell />
    ) : (
      // screen says "game" but no run exists (post-run reset) — back to the wizard.
      <NewGameScreen />
    );

  // The guided tour spans the new-game screen and the shell, so it lives above
  // both rather than inside either. Settings is reachable from title + pause.
  return (
    <>
      {body}
      <SettingsModal />
      <GuidedTutorial />
    </>
  );
}
