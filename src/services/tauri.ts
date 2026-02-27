import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { EncodeParams, EncodeProgress, VideoInfo } from "@/types/encode";

export async function selectVideoFile(): Promise<string | null> {
	return (
		(await open({
			filters: [
				{ name: "视频文件", extensions: ["mp4", "mkv", "avi", "mov", "flv", "wmv", "webm"] },
			],
		})) ?? null
	);
}

export async function selectSubtitleFile(): Promise<string | null> {
	return (
		(await open({
			filters: [{ name: "字幕文件", extensions: ["srt", "ass", "ssa", "vtt"] }],
		})) ?? null
	);
}

export async function selectOutputDir(): Promise<string | null> {
	return (await open({ directory: true })) ?? null;
}

export const startEncode = (params: EncodeParams): Promise<string> =>
	invoke<string>("start_encode", { params } as unknown as Record<string, unknown>);

export const stopEncode = (): Promise<void> => invoke("stop_encode");

export const getVideoInfo = (path: string): Promise<VideoInfo> =>
	invoke<VideoInfo>("get_video_info", { path });

export const getFFmpegVersion = (): Promise<string> => invoke<string>("get_ffmpeg_version");

export const getDefaultOutputDir = (): Promise<string> => invoke<string>("get_default_output_dir");

export async function openPath(path: string): Promise<void> {
	return invoke("open_path", { path } as unknown as Record<string, unknown>);
}

/** 通用事件监听，修复 unlisten 竞态：若在 listen resolve 前就取消，立即卸载 */
function onEvent<T>(event: string, cb: (payload: T) => void): () => void {
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
}

export const onEncodeProgress = (cb: (p: EncodeProgress) => void) => onEvent("encode-progress", cb);

export const onEncodeComplete = (cb: (path: string) => void) => onEvent("encode-complete", cb);

export const onEncodeError = (cb: (err: string) => void) => onEvent("encode-error", cb);

export const onEncodeLog = (cb: (log: string) => void) => onEvent("encode-log", cb);
