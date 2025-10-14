// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use image::{ImageReader, ImageFormat};
use std::io::Cursor;
use tauri::Manager;
use tokio::fs;

#[tauri::command]
async fn process_drag_icon(
    image_url: String,
    pack_id: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let cache_dir = app_handle.path().cache_dir().map_err(|e| format!("Failed to get cache directory: {}", e))?;
    let icon_path = cache_dir.join(format!("{}.png", pack_id));

    if icon_path.exists() {
        return Ok(icon_path.to_string_lossy().into_owned());
    }

    let response = reqwest::get(&image_url)
        .await
        .map_err(|e| format!("Failed to fetch image: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read image bytes: {}", e))?;

    let img = ImageReader::new(Cursor::new(response))
        .with_guessed_format()
        .map_err(|e| format!("Failed to guess image format: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let resized_img = img.resize_exact(64, 64, image::imageops::FilterType::Lanczos3);

    let mut buffer = Vec::new();
    resized_img.write_to(&mut Cursor::new(&mut buffer), ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image to PNG: {}", e))?;

    fs::write(&icon_path, buffer)
        .await
        .map_err(|e| format!("Failed to write icon file: {}", e))?;

    Ok(icon_path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_drag::init())
        .invoke_handler(tauri::generate_handler![process_drag_icon])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
