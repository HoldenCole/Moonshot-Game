// The Tauri application: a native window around the Vite frontend, plus the
// desktop layer — file-based saves (so Steam Cloud can sync them), a native
// menu, remembered window geometry, and a single-instance lock. The game logic
// is all TypeScript; Rust only provides the save file and the menu plumbing.

use std::fs;
use tauri::menu::{Menu, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};

/// `<app-data>/save.json` — one file, easy for Steam Cloud's auto-cloud to sync.
fn save_file_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("save.json"))
}

#[tauri::command]
fn load_game(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = save_file_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(&path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_game(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    let path = save_file_path(&app)?;
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_save(app: tauri::AppHandle) -> Result<(), String> {
    let path = save_file_path(&app)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn save_path(app: tauri::AppHandle) -> Result<String, String> {
    Ok(save_file_path(&app)?.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                // A second launch just focuses the running window.
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                }
            }))
            .plugin(tauri_plugin_window_state::Builder::default().build());
    }

    builder
        .menu(|handle| {
            // First submenu becomes the macOS application menu.
            let app_menu = SubmenuBuilder::new(handle, "Moonshot Inc")
                .quit()
                .build()?;

            let new_game = MenuItemBuilder::with_id("new-game", "New Game")
                .accelerator("CmdOrCtrl+N")
                .build(handle)?;
            let save = MenuItemBuilder::with_id("save", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(handle)?;
            let game = SubmenuBuilder::new(handle, "Game")
                .item(&new_game)
                .item(&save)
                .build()?;

            let reload = MenuItemBuilder::with_id("reload", "Reload")
                .accelerator("CmdOrCtrl+R")
                .build(handle)?;
            let fullscreen = MenuItemBuilder::with_id("fullscreen", "Toggle Fullscreen")
                .accelerator("F11")
                .build(handle)?;
            let view = SubmenuBuilder::new(handle, "View")
                .item(&reload)
                .item(&fullscreen)
                .build()?;

            let about = MenuItemBuilder::with_id("about", "About Moonshot Inc").build(handle)?;
            let help = SubmenuBuilder::new(handle, "Help").item(&about).build()?;

            Menu::with_items(handle, &[&app_menu, &game, &view, &help])
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            // Fullscreen is handled natively; the rest are routed to the frontend.
            "fullscreen" => {
                if let Some(window) = app.get_webview_window("main") {
                    let now = window.is_fullscreen().unwrap_or(false);
                    let _ = window.set_fullscreen(!now);
                }
            }
            other => {
                let _ = app.emit(&format!("menu:{other}"), ());
            }
        })
        .invoke_handler(tauri::generate_handler![load_game, save_game, clear_save, save_path])
        .run(tauri::generate_context!())
        .expect("error while running the Moonshot Inc application");
}
