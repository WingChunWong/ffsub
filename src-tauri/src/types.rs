use serde::{Deserialize, Serialize};

/// FFmpeg 编码参数，前端通过 IPC 传入
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodeParams {
    pub video_path: String,
    pub subtitle_path: String,
    pub output_dir: String,
    pub output_format: String,
    pub video_codec: String,
    pub crf: i32,
    pub subtitle_encoding: String,
    pub subtitle_style: String,
    pub subtitle_style_name: Option<String>,
}

/// 编码进度信息，通过事件推送到前端
#[derive(Debug, Clone, Serialize)]
pub struct EncodeProgress {
    pub frame: u64,
    pub fps: f64,
    pub time: String,
    pub speed: String,
    pub percentage: f64,
}

/// 视频文件信息
#[derive(Debug, Clone, Serialize)]
pub struct VideoInfo {
    pub format: String,
    pub duration: String,
    pub resolution: String,
}
