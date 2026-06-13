import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// The Vite config doubles as the Tauri frontend config. When the Tauri
// shell is added (Phase 11 / packaging), `tauri.conf.json` points its
// `devUrl` at this dev server and its `frontendDist` at `dist/`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // `content/` lives at the repo root, outside `src/`. Allow Vite's dev
  // server to read it so `import.meta.glob('/content/**/*.toml')` resolves.
  server: {
    port: 1420,
    strictPort: false,
    fs: {
      allow: [".."],
    },
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
});
