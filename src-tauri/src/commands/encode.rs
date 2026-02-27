use std::path::Path;
use tauri::State;

use crate::ffmpeg::{args, runner};
use crate::state::AppState;
use crate::types::{EncodeParams, VideoInfo};

use std::process::Command;

/// 开始编码任务
#[tauri::command]
pub async fn start_encode(
    params: EncodeParams,
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // 检查是否已有任务在运行
    if state.is_running()? {
        return Err("已有编码任务在运行".to_string());
    }

    // 验证输入文件
    if !Path::new(&params.video_path).exists() {
        return Err(format!("视频文件不存在: {}", params.video_path));
    }
    if !Path::new(&params.subtitle_path).exists() {
        return Err(format!("字幕文件不存在: {}", params.subtitle_path));
    }
    if !Path::new(&params.output_dir).is_dir() {
        return Err(format!("输出目录无效: {}", params.output_dir));
    }

    // 探测视频时长
    match runner::probe_duration(&params.video_path) {
        Ok(duration) => {
            state.set_total_duration(duration)?;
        }
        Err(e) => {
            log::warn!("无法探测视频时长: {e}，进度百分比将不可用");
            state.set_total_duration(0.0)?;
        }
    }

    // 设置运行状态
    state.set_running(true)?;

    // 构建输出路径
    let output_path = args::build_output_path(&params);

    // 启动编码
    match runner::spawn_encode(&params, &output_path, &state, &app_handle) {
        Ok(()) => {
            log::info!("FFmpeg 进程已启动，输出: {output_path}");
            Ok(format!("编码已开始，输出文件: {output_path}"))
        }
        Err(e) => {
            state.set_running(false)?;
            Err(e)
        }
    }
}

/// 停止当前编码任务
#[tauri::command]
pub async fn stop_encode(state: State<'_, AppState>) -> Result<(), String> {
    if let Some(mut child) = state.take_child()? {
        child
            .kill()
            .map_err(|e| format!("终止进程失败: {e}"))?;
        log::info!("已终止编码进程");
    }
    state.set_running(false)?;
    Ok(())
}

/// 获取 FFmpeg 版本信息
#[tauri::command]
pub async fn get_ffmpeg_version() -> Result<String, String> {
    let output = std::process::Command::new(crate::ffmpeg::args::ffmpeg_bin())
        .arg("-version")
        .output()
        .map_err(|e| format!("无法执行 FFmpeg: {e}"))?;
    let version = String::from_utf8_lossy(&output.stdout);
    Ok(version.to_string())
}

/// 获取视频文件信息
#[tauri::command]
pub async fn get_video_info(path: String) -> Result<VideoInfo, String> {
    runner::probe_video_info(&path)
}

/// 获取默认输出目录（优先系统视频目录），并在其下创建 `FFSub` 子文件夹
#[tauri::command]
pub async fn get_default_output_dir() -> Result<String, String> {
    // 试图使用系统视频目录
    if let Some(mut dir) = dirs_next::video_dir() {
        dir.push("FFSub");
        std::fs::create_dir_all(&dir).map_err(|e| format!("创建目录失败: {e}"))?;
        return Ok(dir.to_string_lossy().to_string());
    }

    // 若系统视频目录不可用，尝试常见本地化名称
    if let Some(home) = dirs_next::home_dir() {
        let candidates = ["Videos", "视频", "Movies"]; // 常见英文/中文/Mac 名称
        for name in &candidates {
            let mut p = home.clone();
            p.push(name);
            if p.exists() {
                p.push("FFSub");
                std::fs::create_dir_all(&p).map_err(|e| format!("创建目录失败: {e}"))?;
                return Ok(p.to_string_lossy().to_string());
            }
        }

        // 最后回退到主目录下的 FFSub
        let mut p = home;
        p.push("FFSub");
        std::fs::create_dir_all(&p).map_err(|e| format!("创建目录失败: {e}"))?;
        return Ok(p.to_string_lossy().to_string());
    }

    Err("无法确定默认输出目录".to_string())
}

/// 在操作系统中打开指定路径（目录或文件）
#[tauri::command]
pub async fn open_path(path: String) -> Result<(), String> {
    if !Path::new(&path).exists() {
        return Err(format!("路径不存在: {}", path));
    }

    #[cfg(target_os = "windows")]
    let mut cmd = Command::new("explorer");
    #[cfg(target_os = "macos")]
    let mut cmd = Command::new("open");
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut cmd = Command::new("xdg-open");

    cmd.arg(path);
    cmd
        .spawn()
        .map_err(|e| format!("打开路径失败: {e}"))?;

    Ok(())
}
