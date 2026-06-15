// The Tauri application entry point. The webview loads the bundled Vite frontend
// (`frontendDist` in tauri.conf.json); the game is pure TypeScript and persists
// to the webview's localStorage, so no Rust-side commands are needed yet. The
// `mobile_entry_point` attribute keeps a future iOS/Android build a config away.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the Moonshot Inc application");
}
