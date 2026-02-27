mod commands;
mod ffmpeg;
mod state;
mod types;

use commands::encode;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            encode::start_encode,
            encode::stop_encode,
            encode::get_ffmpeg_version,
            encode::get_video_info,
            encode::get_default_output_dir,
            encode::open_path,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用失败");
}
