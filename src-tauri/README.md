# Moonshot Inc — desktop shell (Tauri v2)

This wraps the Vite/React frontend in a native [Tauri v2](https://tauri.app)
window so the game ships as a desktop app (the Steam-first target). The game is
pure TypeScript and persists to the webview's `localStorage`, so there are no
Rust-side commands yet — the shell just loads the bundled frontend.

## Layout

| Path | What |
|---|---|
| `tauri.conf.json` | App config — window, bundle, and the Vite wiring (`devUrl` → `localhost:1420`, `frontendDist` → `../dist`) |
| `Cargo.toml` · `build.rs` | The Rust crate and its build script |
| `src/main.rs` · `src/lib.rs` | Entry point → `tauri::Builder` |
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

Saves currently live in the webview's `localStorage`, which persists per-app on
desktop. For Steam Cloud, the simplest path is to point the Steam depot's
auto-cloud at the app's data directory; migrating saves to a real file via a
Rust command is a clean follow-up (the save layer is already a versioned JSON
envelope, so it ports directly).

## Note on verification

The icon pipeline and the frontend build are verified. The Rust compile and the
platform bundling are **not** built in every environment (they need the Rust
toolchain, network access to crates.io, and the platform webview libs) — CI is
the source of truth for those.
