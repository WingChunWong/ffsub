export type OutputFormat = "mp4" | "mkv" | "avi" | "mov";

export type VideoCodec = "libx264" | "libx265" | "copy";

export type SubtitleEncoding = "utf8" | "gbk" | "big5";

export type SubtitleStyle = "default" | "custom";

export interface EncodeParams {
	videoPath: string;
	subtitlePath: string;
	outputDir: string;
	outputFormat: OutputFormat;
	videoCodec: VideoCodec;
	crf: number;
	subtitleEncoding: SubtitleEncoding;
	subtitleStyle: SubtitleStyle;
}

export interface VideoInfo {
	format: string;
	duration: string;
	resolution: string;
}

export interface SubtitleInfo {
	format: string;
	encoding: string;
	language: string;
}

export type EncodeStatus = "idle" | "running" | "completed" | "error" | "stopped";

export interface EncodeProgress {
	frame: number;
	fps: number;
	time: string;
	speed: string;
	percentage: number;
}

export interface EncodeState {
	status: EncodeStatus;
	progress: EncodeProgress | null;
	logs: string[];
	outputPath: string | null;
	error: string | null;
}
