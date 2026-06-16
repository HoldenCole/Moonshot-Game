import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// The Vite config doubles as the Tauri frontend config: `src-tauri/tauri.conf.json`
// points `devUrl` at this dev server (port 1420, fixed) and `frontendDist` at `dist/`.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  // Project GitHub Pages serve from a `/<repo>/` subpath; the Pages workflow sets
  // BASE_PATH. Dev and the Tauri build leave it unset (served from root).
  base: process.env.BASE_PATH || "/",
  // Tauri expects a fixed dev port and quieter output.
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    // `content/` lives at the repo root, outside `src/`. Allow Vite's dev
    // server to read it so `import.meta.glob('/content/**/*.toml')` resolves.
    fs: { allow: [".."] },
    // Don't rebuild the frontend when the Rust shell changes.
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    // The Tauri webviews are modern (WebView2 / WKWebView / WebKitGTK).
    // safari14 is the floor: the content layer (smol-toml) uses BigInt literals,
    // unavailable in Safari 13 / macOS 10.15.
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari14",
    outDir: "dist",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
  },
});
