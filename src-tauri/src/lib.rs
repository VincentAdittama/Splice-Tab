// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use image::{DynamicImage, ImageFormat, ImageReader};
use std::io::Cursor;
use tauri::Manager;
use tokio::fs;

#[tauri::command]
async fn process_drag_icon(
    image_url: String,
    pack_id: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let cache_dir = app_handle
        .path()
        .cache_dir()
        .map_err(|e| format!("Failed to get cache directory: {}", e))?;
    let icon_path = cache_dir.join(format!("{}_offset_tl.png", pack_id));

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

    // Create a larger canvas (150x150) to offset the icon
    // Assuming the OS/Plugin centers the drag image under the cursor:
    // Canvas Center: (75, 75) - this is where the cursor will be.
    // Image at (0, 0) ends at (64, 64).
    // Result: Image is fully to the top-left of the cursor with about 11px clearance.
    let mut canvas = DynamicImage::new_rgba8(150, 150);

    image::imageops::overlay(&mut canvas, &resized_img, 0, 0);

    let mut buffer = Vec::new();
    canvas
        .write_to(&mut Cursor::new(&mut buffer), ImageFormat::Png)
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
