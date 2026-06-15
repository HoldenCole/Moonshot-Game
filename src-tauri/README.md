# Moonshot Inc — desktop shell (Tauri v2)

This wraps the Vite/React frontend in a native [Tauri v2](https://tauri.app)
window so the game ships as a desktop app (the Steam-first target). The game
logic is all TypeScript; the Rust side provides the desktop layer.

## The desktop layer

- **File-based saves** — under the desktop build, saves are a JSON file in the
  OS app-data dir (`save_game` / `load_game` / `clear_save` commands) instead of
  `localStorage`, so Steam Cloud can sync them. The TS save layer reads the file
  into memory once at boot (`src/state/saveBackend.ts`) and falls back to
  `localStorage` on the web build.
- **Native menu** — a real menu bar with accelerators (New Game ⌘/Ctrl+N, Save
  ⌘/Ctrl+S, Reload ⌘/Ctrl+R, Toggle Fullscreen F11, About, Quit). Fullscreen is
  handled in Rust; the rest emit `menu:*` events the frontend listens for
  (`src/state/desktop.ts`).
- **Window state** — size and position are remembered across launches
  (`tauri-plugin-window-state`).
- **Single instance** — a second launch focuses the running window
  (`tauri-plugin-single-instance`).

## Layout

| Path | What |
|---|---|
| `tauri.conf.json` | App config — window, bundle, and the Vite wiring (`devUrl` → `localhost:1420`, `frontendDist` → `../dist`) |
| `Cargo.toml` · `build.rs` | The Rust crate and its build script |
| `src/main.rs` · `src/lib.rs` | Entry point → save commands, the native menu, and the desktop plugins |
| `capabilities/default.json` | Window permissions (core defaults) |
| `icons/app-icon.png` | The 1024² source icon; the desktop set beside it is generated from it |

## Build it

Prerequisites: [Rust](https://rustup.rs) and your platform's
[Tauri system dependencies](https://tauri.app/start/prerequisites/) (on Linux:
`libwebkit2gtk-4.1-dev`, `librsvg2-dev`, `patchelf`, …).

```bash
npm install
npm run tauri dev      # hot-reloading dev window
npm run tauri build    # produce the installer for the current OS
```

Regenerate the icon set after changing `icons/app-icon.png`:

```bash
npm run tauri icon src-tauri/icons/app-icon.png
```

## CI

`.github/workflows/release.yml` builds macOS (Apple Silicon + Intel), Windows,
and Linux installers and attaches them to a **draft** GitHub release. It runs on
a `v*` tag push, or on demand via *workflow_dispatch* to verify the build.

## Saves & Steam Cloud

The desktop build writes `save.json` to the OS app-data directory (e.g.
`~/Library/Application Support/Moonshot Inc/` on macOS,
`%APPDATA%\Moonshot Inc\` on Windows). Point the Steam depot's auto-cloud at
that directory and saves sync. The file is the same versioned JSON envelope the
web build uses, so saves move between platforms unchanged.

## Note on verification

The icon pipeline and the frontend build are verified. The Rust compile and the
platform bundling are **not** built in every environment (they need the Rust
toolchain, network access to crates.io, and the platform webview libs) — CI is
the source of truth for those.
