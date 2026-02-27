use crate::types::EncodeProgress;

/// 从 FFmpeg stderr 输出行解析进度信息
///
/// FFmpeg 进度输出格式示例:
/// `frame= 1234 fps= 30.0 ... time=00:01:23.45 ... speed=2.5x`
pub fn parse_progress_line(line: &str, total_duration_secs: f64) -> Option<EncodeProgress> {
    if !line.contains("frame=") || !line.contains("time=") {
        return None;
    }

    let frame = extract_value(line, "frame=")
        .and_then(|v| v.trim().parse::<u64>().ok())
        .unwrap_or(0);

    let fps = extract_value(line, "fps=")
        .and_then(|v| v.trim().parse::<f64>().ok())
        .unwrap_or(0.0);

    let time = extract_value(line, "time=")
        .map(|v| v.trim().to_string())
        .unwrap_or_default();

    let speed = extract_value(line, "speed=")
        .map(|v| v.trim().to_string())
        .unwrap_or_default();

    let current_secs = parse_time_to_seconds(&time);
    let percentage = if total_duration_secs > 0.0 {
        ((current_secs / total_duration_secs) * 100.0).min(100.0)
    } else {
        0.0
    };

    // 四舍五入到十分位（保留一位小数）
    let percentage = (percentage * 10.0).round() / 10.0;

    Some(EncodeProgress {
        frame,
        fps,
        time,
        speed,
        percentage,
    })
}

/// 提取 `key=value` 格式的值（跳过前导空格）
fn extract_value<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    let start = line.find(key)? + key.len();
    let rest = &line[start..];
    // 跳过前导空格（FFmpeg 输出常用空格对齐）
    let trimmed = rest.trim_start();
    let end = trimmed.find(' ').unwrap_or(trimmed.len());
    Some(&trimmed[..end])
}

/// 将 HH:MM:SS.ff 格式时间转为秒数
fn parse_time_to_seconds(time_str: &str) -> f64 {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() != 3 {
        return 0.0;
    }

    let hours = parts[0].parse::<f64>().unwrap_or(0.0);
    let minutes = parts[1].parse::<f64>().unwrap_or(0.0);
    let seconds = parts[2].parse::<f64>().unwrap_or(0.0);

    hours * 3600.0 + minutes * 60.0 + seconds
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_progress() {
        let line = "frame=  120 fps= 30.0 q=28.0 size=    1024kB time=00:00:04.00 bitrate=2097.2kbits/s speed=1.5x";
        let progress = parse_progress_line(line, 10.0).unwrap();
        assert_eq!(progress.frame, 120);
        assert!((progress.fps - 30.0).abs() < f64::EPSILON);
        assert_eq!(progress.time, "00:00:04.00");
        assert_eq!(progress.speed, "1.5x");
        assert!((progress.percentage - 40.0).abs() < 0.1);
    }

    #[test]
    fn test_parse_time() {
        assert!((parse_time_to_seconds("01:30:00.00") - 5400.0).abs() < f64::EPSILON);
        assert!((parse_time_to_seconds("00:01:30.50") - 90.5).abs() < f64::EPSILON);
    }
}
