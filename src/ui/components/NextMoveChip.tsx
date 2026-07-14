// The coach's chip: one suggested move, one button. Quiet whenever the game is
// already asking for something.
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { subContentFor } from "@/engine/productsRuntime";
import { nextMove } from "@/engine/nextAction";
import { Button } from "@/ui/components/controls";
import { play } from "@/audio/sfx";

export function NextMoveChip() {
  const game = useGame((s) => s.game);
  const content = useGame((s) => s.content);
  const setView = useUi((s) => s.setView);
  const setFocusPanel = useUi((s) => s.setFocusPanel);
  if (!game) return null;
  const sub = subContentFor(content, game.company.subIndustry);
  const move = nextMove(game, sub);
  if (!move) return null;

  return (
    <div className="nextmove">
      <span className="nextmove__kicker">Next move</span>
      <div className="nextmove__body">
        <div className="nextmove__label">{move.label}</div>
        <div className="nextmove__detail">{move.detail}</div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          play("nav");
          if (move.panel) setFocusPanel(move.panel);
          setView(move.view);
        }}
      >
        Go
      </Button>
    </div>
  );
}
