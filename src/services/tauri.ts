import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { EncodeParams, EncodeProgress, VideoInfo } from "@/types/encode";

// 文件选择对话框
export const selectVideoFile = (): Promise<string | null> =>
	open({
		filters: [{ name: "视频文件", extensions: ["mp4", "mkv", "avi", "mov", "flv", "wmv", "webm"] }],
	}).then((p) => p ?? null);

export const selectSubtitleFile = (): Promise<string | null> =>
	open({
		filters: [{ name: "字幕文件", extensions: ["srt", "ass", "ssa", "vtt"] }],
	}).then((p) => p ?? null);

export const selectOutputDir = (): Promise<string | null> =>
	open({ directory: true }).then((p) => p ?? null);

// Tauri IPC 命令（简洁包装）
const invokeCommand = <T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> =>
	invoke<T>(command, args);

export const startEncode = (params: EncodeParams): Promise<string> =>
	invokeCommand<string>("start_encode", { params });

export const stopEncode = (): Promise<void> => invoke("stop_encode");

export const getVideoInfo = (path: string): Promise<VideoInfo> =>
	invokeCommand<VideoInfo>("get_video_info", { path });

export const getFFmpegVersion = (): Promise<string> => invokeCommand<string>("get_ffmpeg_version");

export const getDefaultOutputDir = (): Promise<string> =>
	invokeCommand<string>("get_default_output_dir");

export const openPath = (path: string): Promise<void> => invokeCommand("open_path", { path });

/**
 * 通用事件监听工厂函数
 * 修复竞态条件：若在 listen resolve 前就取消，立即卸载
 */
const onEvent = <T>(event: string, cb: (payload: T) => void): (() => void) => {
	let unlisten: (() => void) | undefined;
	let cancelled = false;

	listen<T>(event, (e) => cb(e.payload)).then((fn) => {
		if (cancelled) fn();
		else unlisten = fn;
	});

	return () => {
		cancelled = true;
		unlisten?.();
	};
};

// 事件监听API
export const onEncodeProgress = (cb: (p: EncodeProgress) => void) => onEvent("encode-progress", cb);
export const onEncodeComplete = (cb: (path: string) => void) => onEvent("encode-complete", cb);
export const onEncodeError = (cb: (err: string) => void) => onEvent("encode-error", cb);
export const onEncodeLog = (cb: (log: string) => void) => onEvent("encode-log", cb);
