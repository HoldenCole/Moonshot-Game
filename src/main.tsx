import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadContent } from "@/content/load";
import { initSaveBackend } from "@/state/saveBackend";
import { setupDesktopMenu } from "@/state/desktop";
import "./styles/tokens.css";
import "./styles/app.css";

// Surface any content cross-reference warnings early (content QA).
const db = loadContent();
if (db.warnings.length > 0) {
  console.warn(`[content] ${db.warnings.length} warning(s):`);
  for (const w of db.warnings) console.warn("  •", w);
}

// Load the on-disk save into memory before first paint (desktop only; resolves
// immediately on web), then mount and wire the native menu.
initSaveBackend().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  void setupDesktopMenu();
});
