use std::path::Path;
use tauri::State;

use crate::ffmpeg::{args, runner};
use crate::state::AppState;
use crate::types::{EncodeParams, VideoInfo};

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

/// 从 ASS/SSA 字幕文件中解析可用的样式名称
#[tauri::command]
pub async fn get_subtitle_styles(path: String) -> Result<Vec<String>, String> {
    if !Path::new(&path).exists() {
        return Err(format!("字幕文件不存在: {}", path));
    }

    let content = std::fs::read_to_string(&path).map_err(|e| format!("读取字幕文件失败: {e}"))?;

    let mut names: Vec<String> = Vec::new();
    for line in content.lines() {
        let l = line.trim();
        if l.starts_with("Style:") {
            if let Some(rest) = l.splitn(2, ':').nth(1) {
                let name = rest.split(',').next().unwrap_or("").trim().to_string();
                if !name.is_empty() && !names.contains(&name) {
                    names.push(name);
                }
            }
        }
    }

    Ok(names)
}
