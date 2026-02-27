import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import type { EncodeParams, EncodeProgress, VideoInfo } from "@/types/encode";

export async function selectVideoFile(): Promise<string | null> {
	const selected = await open({
		filters: [
			{
				name: "视频文件",
				extensions: ["mp4", "mkv", "avi", "mov", "flv", "wmv", "webm"],
			},
		],
	});
	return selected ?? null;
}

export async function selectSubtitleFile(): Promise<string | null> {
	const selected = await open({
		filters: [
			{
				name: "字幕文件",
				extensions: ["srt", "ass", "ssa", "vtt"],
			},
		],
	});
	return selected ?? null;
}

export async function selectOutputDir(): Promise<string | null> {
	const selected = await open({ directory: true });
	return selected ?? null;
}

export async function startEncode(params: EncodeParams): Promise<string> {
	// wrap params under the key `params` to match the Rust command signature
	return invoke<string>("start_encode", { params } as unknown as Record<string, unknown>);
}

export async function stopEncode(): Promise<void> {
	return invoke("stop_encode");
}

export async function getVideoInfo(path: string): Promise<VideoInfo> {
	return invoke<VideoInfo>("get_video_info", { path });
}

export async function getFFmpegVersion(): Promise<string> {
	return invoke<string>("get_ffmpeg_version");
}

export async function getDefaultOutputDir(): Promise<string> {
	return invoke<string>("get_default_output_dir");
}

export function onEncodeProgress(callback: (progress: EncodeProgress) => void): () => void {
	let unlisten: (() => void) | undefined;
	listen<EncodeProgress>("encode-progress", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});
	return () => unlisten?.();
}

export function onEncodeComplete(callback: (outputPath: string) => void): () => void {
	let unlisten: (() => void) | undefined;
	listen<string>("encode-complete", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});
	return () => unlisten?.();
}

export function onEncodeError(callback: (error: string) => void): () => void {
	let unlisten: (() => void) | undefined;
	listen<string>("encode-error", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});
	return () => unlisten?.();
}

export function onEncodeLog(callback: (log: string) => void): () => void {
	let unlisten: (() => void) | undefined;
	listen<string>("encode-log", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});
	return () => unlisten?.();
}
