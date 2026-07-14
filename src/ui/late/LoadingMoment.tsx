// Continuing a run gets its own beat: the trajectory redraws while in-world
// one-liners rotate, then the shell fades in. Same interstitial the founding
// uses, in its "loading" mode.
import { useGame } from "@/state/store";
import { useUi } from "@/state/ui";
import { FoundingInterstitial } from "./FoundingInterstitial";

export function LoadingMoment() {
  const generic = useGame((s) => s.content.lateLoading.generic);
  const setScreen = useUi((s) => s.setScreen);
  return <FoundingInterstitial mode="loading" genericLines={generic} onDone={() => setScreen("game")} />;
}
