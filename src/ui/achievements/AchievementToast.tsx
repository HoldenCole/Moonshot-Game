import { useEffect } from "react";
import { useGame } from "@/state/store";
import { achievementById } from "@/engine/achievements";

/** A transient toast when achievements unlock — informative on-change motion. */
export function AchievementToast() {
  const toast = useGame((s) => s.achievementToast);
  const clear = useGame((s) => s.clearAchievementToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 4500);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast || toast.length === 0) return null;

  return (
    <div className="ach-toasts">
      {toast.map((id) => {
        const a = achievementById(id);
        if (!a) return null;
        return (
          <div key={id} className={`ach-toast ach-toast--${a.tier} rise`}>
            <span className="ach-toast__medal">★</span>
            <div>
              <div className="ach-toast__kicker">Achievement unlocked</div>
              <div className="ach-toast__name">{a.name}</div>
              <div className="ach-toast__desc">{a.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
