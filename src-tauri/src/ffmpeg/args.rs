use crate::types::EncodeParams;
use std::path::Path;
use std::process::Command;
use std::sync::OnceLock;

/// 缓存 GPU 编码器检测结果，避免每次编码都启动 FFmpeg 进程
static GPU_ENCODER_CACHE: OnceLock<Option<String>> = OnceLock::new();

/// 获取 FFmpeg 可执行文件路径
pub fn ffmpeg_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    }
}

/// 获取 ffprobe 可执行文件路径
pub fn ffprobe_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "ffprobe.exe"
    } else {
        "ffprobe"
    }
}

/// 对字幕路径进行安全转义，防止 FFmpeg filter 注入
fn escape_filter_path(path: &str) -> String {
    // For FFmpeg filtergraphs we must escape characters that are used as
    // separators in filter option parsing. Keep backslashes and escape them
    // instead of converting to forward slashes — this preserves Windows
    // drive letters like `C:` while escaping the colon and other separators.
    path.replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace(',', "\\,")
        .replace("'", "\\'")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace(';', "\\;")
}

/// 构建字幕滤镜字符串
fn build_subtitle_filter(params: &EncodeParams) -> String {
    let escaped = escape_filter_path(&params.subtitle_path);

    let mut filter = format!("subtitles='{escaped}'");

    if params.subtitle_encoding != "utf8" {
        filter.push_str(&format!(":charenc={}", params.subtitle_encoding));
    }

    if params.subtitle_style == "custom" {
        filter.push_str(":force_style='PrimaryColour=&H00FFFFFF'");
    }

    filter
}

/// 生成输出文件路径
pub fn build_output_path(params: &EncodeParams) -> String {
    let video_name = Path::new(&params.video_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");

    format!(
        "{}/{}_sub.{}",
        params.output_dir, video_name, params.output_format
    )
}

/// 为编码任务构建完整的 FFmpeg 参数列表
pub fn build_encode_args(params: &EncodeParams, output_path: &str) -> Vec<String> {
	let subtitle_filter = build_subtitle_filter(params);
	let hw = GPU_ENCODER_CACHE.get_or_init(detect_gpu_encoder).as_deref();
	let selected_codec = select_codec(params.video_codec.as_str(), hw);

	let final_codec = if selected_codec == "copy" {
		log::warn!("用户选择了 'copy' 编码，但使用了字幕滤镜，已改为 libx264 以支持滤镜");
		"libx264".to_string()
	} else {
		selected_codec
	};

	let crf_str = params.crf.to_string();
	let threads = "0";
	let mut args = vec![
		"-i".to_string(),
		params.video_path.clone(),
		"-vf".to_string(),
		subtitle_filter,
		"-c:v".to_string(),
		final_codec,
	];

	if params.video_codec != "copy" {
		let is_hw = matches!(hw, Some("nvenc" | "qsv" | "amf" | "vaapi"));
		if is_hw && !matches!(args[5].as_str(), "libx264" | "libx265") {
			args.extend(vec!["-global_quality".to_string(), crf_str]);
		} else {
			args.extend(vec!["-crf".to_string(), crf_str, "-preset".to_string(), "medium".to_string()]);
		}
	}

	args.extend(vec!["-threads".to_string(), threads.to_string(), "-c:a".to_string(), "copy".to_string()]);

	if params.output_format == "mp4" {
		args.extend(vec!["-movflags".to_string(), "+faststart".to_string()]);
	}

	args.extend(vec!["-y".to_string(), output_path.to_string()]);
	args
}

/// 选择合适的视频编码器码率（包含硬件加速支持）
fn select_codec(user_choice: &str, hw: Option<&str>) -> String {
	let codec = match (user_choice, hw) {
		("libx264", Some("nvenc")) => "h264_nvenc",
		("libx264", Some("qsv")) => "h264_qsv",
		("libx264", Some("vaapi")) => "h264_vaapi",
		("libx264", Some("amf")) => "h264_amf",
		("libx265", Some("nvenc")) => "hevc_nvenc",
		("libx265", Some("qsv")) => "hevc_qsv",
		("libx265", Some("vaapi")) => "hevc_vaapi",
		("libx265", Some("amf")) => "hevc_amf",
		_ => user_choice,
	};
	codec.to_string()
}

/// 检测系统上是否存在支持的硬件编码器（结果通过 OnceLock 缓存）
fn detect_gpu_encoder() -> Option<String> {
    let ffmpeg = ffmpeg_bin();
    let output = Command::new(ffmpeg)
        .arg("-hide_banner")
        .arg("-encoders")
        .output();

    if let Ok(output) = output {
        if let Ok(text) = String::from_utf8(output.stdout) {
            let lower = text.to_lowercase();
            if lower.contains("h264_nvenc") || lower.contains("hevc_nvenc") {
                return Some("nvenc".to_string());
            }
            if lower.contains("h264_qsv") || lower.contains("hevc_qsv") {
                return Some("qsv".to_string());
            }
            if lower.contains("h264_vaapi") || lower.contains("hevc_vaapi") {
                return Some("vaapi".to_string());
            }
            if lower.contains("h264_amf") || lower.contains("hevc_amf") {
                return Some("amf".to_string());
            }
        }
    }

    None
}

/// 构建 ffprobe 获取视频时长的参数
pub fn build_probe_duration_args(video_path: &str) -> Vec<String> {
    vec![
        "-v".to_string(),
        "error".to_string(),
        "-show_entries".to_string(),
        "format=duration".to_string(),
        "-of".to_string(),
        "default=noprint_wrappers=1:nokey=1".to_string(),
        video_path.to_string(),
    ]
}

/// 构建 ffprobe 获取视频信息的参数
pub fn build_probe_info_args(video_path: &str) -> Vec<String> {
    vec![
        "-v".to_string(),
        "error".to_string(),
        "-select_streams".to_string(),
        "v:0".to_string(),
        "-show_entries".to_string(),
        "stream=width,height,duration:format=duration,format_name".to_string(),
        "-of".to_string(),
        "json".to_string(),
        video_path.to_string(),
    ]
}
