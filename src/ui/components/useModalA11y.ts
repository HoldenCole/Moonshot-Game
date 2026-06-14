import { useEffect, type RefObject } from "react";

interface Options {
  /** Called on Escape (when closeOnEsc) and available for backdrop clicks. */
  onClose?: () => void;
  /** Escape closes the dialog (default true). */
  closeOnEsc?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Make a modal dialog keyboard-correct: focus moves inside on open, Tab cycles
 *  within (focus trap), Escape closes, and focus returns to the trigger on
 *  close. The dialog element should carry role="dialog", aria-modal, and a
 *  tabIndex of -1 as the fallback focus target. */
export function useModalA11y(ref: RefObject<HTMLElement | null>, { onClose, closeOnEsc = true }: Options = {}) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const restoreTo = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    (focusables()[0] ?? node).focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && closeOnEsc) {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusables();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const first = els[0]!;
      const last = els[els.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      restoreTo?.focus?.();
    };
  }, [ref, onClose, closeOnEsc]);
}
