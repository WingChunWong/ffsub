use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::time::Instant;

use tauri::{AppHandle, Emitter, Manager};

use crate::ffmpeg::args;
use crate::ffmpeg::progress::parse_progress_line;
use crate::state::AppState;
use crate::types::{EncodeParams, VideoInfo};

/// 使用 ffprobe 探测视频总时长（秒）
pub fn probe_duration(video_path: &str) -> Result<f64, String> {
    let probe_args = args::build_probe_duration_args(video_path);

    let output = Command::new(args::ffprobe_bin())
        .args(&probe_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("无法执行 ffprobe: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .trim()
        .parse::<f64>()
        .map_err(|_| "无法解析视频时长".to_string())
}

/// 使用 ffprobe 获取视频信息
pub fn probe_video_info(video_path: &str) -> Result<VideoInfo, String> {
    let probe_args = args::build_probe_info_args(video_path);

    let output = Command::new(args::ffprobe_bin())
        .args(&probe_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("无法执行 ffprobe: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("解析 ffprobe 输出失败: {e}"))?;

    // 直接使用文件扩展名作为格式（若存在），以避免 ffprobe 返回的复合 format_name 导致误判。
    if let Some(ext) = std::path::Path::new(video_path)
        .extension()
        .and_then(|s| s.to_str())
    {
        let ext_lower = ext.to_lowercase();
        let format_name = ext_lower;

        let duration_str = json["format"]["duration"]
            .as_str()
            .and_then(|d| d.parse::<f64>().ok())
            .map(format_duration)
            .unwrap_or_else(|| "-".to_string());

        let streams = json["streams"].as_array();
        let resolution = streams
            .and_then(|s| s.first())
            .map(|s| {
                let w = s["width"].as_u64().unwrap_or(0);
                let h = s["height"].as_u64().unwrap_or(0);
                format!("{w}x{h}")
            })
            .unwrap_or_else(|| "-".to_string());

        return Ok(VideoInfo {
            format: format_name,
            duration: duration_str,
            resolution,
        });
    }

    // 若无扩展名，则回退到使用 ffprobe 的 format_name 候选并按优先级选择
    let raw_format = json["format"]["format_name"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();

    let candidates: Vec<String> = raw_format
        .split(',')
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty())
        .collect();

    let preferred = ["mp4", "mkv", "mov", "webm", "avi", "flv", "wmv"];
    let format_name = if let Some(p) = preferred.iter().find(|p| candidates.contains(&p.to_string())) {
        p.to_string()
    } else {
        candidates.get(0).cloned().unwrap_or_else(|| "unknown".to_string())
    };

    let duration_str = json["format"]["duration"]
        .as_str()
        .and_then(|d| d.parse::<f64>().ok())
        .map(format_duration)
        .unwrap_or_else(|| "-".to_string());

    let streams = json["streams"].as_array();
    let resolution = streams
        .and_then(|s| s.first())
        .map(|s| {
            let w = s["width"].as_u64().unwrap_or(0);
            let h = s["height"].as_u64().unwrap_or(0);
            format!("{w}x{h}")
        })
        .unwrap_or_else(|| "-".to_string());

    Ok(VideoInfo {
        format: format_name,
        duration: duration_str,
        resolution,
    })
}

/// 启动 FFmpeg 编码进程，并在后台线程中监控 stderr 解析进度
pub fn spawn_encode(
    params: &EncodeParams,
    output_path: &str,
    state: &AppState,
    app_handle: &AppHandle,
) -> Result<(), String> {
    let encode_args = args::build_encode_args(params, output_path);

    log::info!("执行: {} {}", args::ffmpeg_bin(), encode_args.join(" "));

    let mut child = Command::new(args::ffmpeg_bin())
        .args(&encode_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动 FFmpeg 失败: {e}"))?;

    // 获取 stderr 用于进度解析
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "无法获取 FFmpeg stderr".to_string())?;

    state.store_child(child)?;

    // 后台线程：读取 stderr，解析进度并发送事件
    let total_duration = state.get_total_duration()?;
    let handle = app_handle.clone();
    let output_path_owned = output_path.to_string();

    std::thread::spawn(move || {
        let mut reader = BufReader::new(stderr);
        let mut line_buf = String::new();
        // 进度事件节流：至少间隔 200ms 发送一次，避免淹没前端
        let mut last_progress_emit = Instant::now();
        let throttle_interval = std::time::Duration::from_millis(200);

        loop {
            line_buf.clear();
            match reader.read_line(&mut line_buf) {
                Ok(0) => break,
                Ok(_) => {
                    // FFmpeg 进度行可能包含 \r
                    for segment in line_buf.split('\r') {
                        let trimmed = segment.trim();
                        if trimmed.is_empty() {
                            continue;
                        }

                        // 尝试解析进度，节流发送
                        if let Some(progress) =
                            parse_progress_line(trimmed, total_duration)
                        {
                            let now = Instant::now();
                            if now.duration_since(last_progress_emit) >= throttle_interval {
                                let _ = handle.emit("encode-progress", &progress);
                                last_progress_emit = now;
                            }
                        } else {
                            // 仅非进度行才发送日志，减少事件量
                            let _ = handle.emit("encode-log", trimmed.to_string());
                        }
                    }
                }
                Err(_) => break,
            }
        }

        // 进程结束后，取回子进程并等待其退出，以判断成功或失败
        // 注意：此时 child 可能已被 stop 取走
        let state = handle.state::<crate::state::AppState>();
        match state.take_child() {
            Ok(Some(mut child)) => {
                match child.wait() {
                    Ok(status) => {
                        if status.success() {
                            let _ = handle.emit("encode-complete", &output_path_owned);
                        } else {
                            let code = status.code();
                            let msg = format!("FFmpeg 进程异常退出: code={:?}", code);
                            let _ = handle.emit("encode-error", msg);
                        }
                    }
                    Err(e) => {
                        let _ = handle.emit("encode-error", format!("等待 FFmpeg 退出失败: {e}"));
                    }
                }
            }
            Ok(None) => {
                // 子进程已被外部取走（如 stop），这里仍然通知完成以便前端更新状态
                let _ = handle.emit("encode-complete", &output_path_owned);
            }
            Err(e) => {
                let _ = handle.emit("encode-error", format!("获取子进程失败: {e}"));
            }
        }

        // 无论如何都将运行状态重置，允许下一个任务启动
        let _ = state.set_running(false);
    });

    Ok(())
}

/// 格式化秒数为 HH:MM:SS
fn format_duration(secs: f64) -> String {
    let total = secs as u64;
    let h = total / 3600;
    let m = (total % 3600) / 60;
    let s = total % 60;
    format!("{h:02}:{m:02}:{s:02}")
}
