import {
	Button,
	FluentProvider,
	makeStyles,
	Text,
	Title1,
	tokens,
	webDarkTheme,
	webLightTheme,
} from "@fluentui/react-components";
import {
	FolderOpenRegular,
	PlayRegular,
	StopRegular,
	SubtitlesRegular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useState } from "react";
import { EncodingParams, FileSelector, ProgressPanel } from "@/components";
import { useEncode } from "@/hooks/useEncode";
import {
	getDefaultOutputDir,
	getVideoInfo,
	selectOutputDir,
	selectSubtitleFile,
	selectVideoFile,
} from "@/services/tauri";
import type {
	EncodeParams,
	OutputFormat,
	SubtitleEncoding,
	SubtitleStyle,
	VideoCodec,
	VideoInfo,
} from "@/types/encode";

const useStyles = makeStyles({
	root: {
		minHeight: "100vh",
		backgroundColor: tokens.colorNeutralBackground2,
		padding: tokens.spacingVerticalXXL,
	},
	container: {
		maxWidth: "960px",
		margin: "0 auto",
		display: "flex",
		flexDirection: "column",
		gap: tokens.spacingVerticalL,
	},
	header: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		paddingBottom: tokens.spacingVerticalL,
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	headerRight: {
		display: "flex",
		alignItems: "center",
		gap: tokens.spacingHorizontalM,
	},
	subtitle: {
		color: tokens.colorNeutralForeground3,
	},
	fileGrid: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: tokens.spacingHorizontalL,
	},
	outputRow: {
		display: "flex",
		alignItems: "center",
		gap: tokens.spacingHorizontalM,
	},
	actions: {
		display: "flex",
		justifyContent: "center",
		gap: tokens.spacingHorizontalL,
	},
	footer: {
		textAlign: "center",
		paddingTop: tokens.spacingVerticalL,
		borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
	},
});

function extractExtension(path: string): string {
	const parts = path.split(".");
	return (parts[parts.length - 1] ?? "").toUpperCase();
}

function SunIcon(props: { width?: number; height?: number }) {
	const w = props.width ?? 16;
	const h = props.height ?? 16;
	return (
		<svg
			width={w}
			height={h}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			style={{ display: "block" }}
		>
			<title>太阳</title>
			<circle cx="12" cy="12" r="4" fill="currentColor" />
			<g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
				<path d="M12 2v2" />
				<path d="M12 20v2" />
				<path d="M4.93 4.93l1.41 1.41" />
				<path d="M17.66 17.66l1.41 1.41" />
				<path d="M2 12h2" />
				<path d="M20 12h2" />
				<path d="M4.93 19.07l1.41-1.41" />
				<path d="M17.66 6.34l1.41-1.41" />
			</g>
		</svg>
	);
}

function MoonIcon(props: { width?: number; height?: number }) {
	const w = props.width ?? 16;
	const h = props.height ?? 16;
	return (
		<svg
			width={w}
			height={h}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			style={{ display: "block" }}
		>
			<title>月亮</title>
			<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
		</svg>
	);
}

function ThemeToggleButton({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
	const size = 36;
	const btnStyle: React.CSSProperties = {
		width: size,
		height: size,
		minWidth: size,
		padding: 0,
		lineHeight: 0,
		borderRadius: "50%",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		transition: "background-color 220ms, color 220ms, transform 180ms",
		backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
	};

	const iconStyle: React.CSSProperties = {
		transition: "transform 220ms cubic-bezier(.2,.9,.2,1), opacity 180ms",
		transform: isDark ? "rotate(0deg) scale(1)" : "rotate(0deg) scale(1)",
	};

	const sunTransform = isDark ? "rotate(20deg) scale(1.05)" : "rotate(0deg) scale(1)";
	const moonTransform = isDark ? "rotate(0deg) scale(1)" : "rotate(-20deg) scale(1.05)";

	return (
		<Button
			appearance="subtle"
			aria-label="切换主题"
			aria-pressed={isDark}
			onClick={onToggle}
			style={btnStyle}
		>
			{isDark ? (
				<span
					style={{
						...iconStyle,
						transform: sunTransform,
						display: "flex",
						width: "100%",
						height: "100%",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<SunIcon width={18} height={18} />
				</span>
			) : (
				<span
					style={{
						...iconStyle,
						transform: moonTransform,
						display: "flex",
						width: "100%",
						height: "100%",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<MoonIcon width={18} height={18} />
				</span>
			)}
		</Button>
	);
}

export default function App() {
	const styles = useStyles();

	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		try {
			const stored = localStorage.getItem("theme");
			if (stored) {
				setIsDark(stored === "dark");
				return;
			}
			const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
			setIsDark(Boolean(prefersDark));
		} catch {
			// ignore
		}
	}, []);

	const toggleTheme = useCallback(() => {
		setIsDark((prev) => {
			const next = !prev;
			try {
				localStorage.setItem("theme", next ? "dark" : "light");
			} catch {
				// ignore
			}
			return next;
		});
	}, []);

	const [videoPath, setVideoPath] = useState("");
	const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
	const [subtitlePath, setSubtitlePath] = useState("");
	const [outputDir, setOutputDir] = useState("");

	const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp4");
	const [videoCodec, setVideoCodec] = useState<VideoCodec>("libx264");
	const [crf, setCrf] = useState(18);
	const [subtitleEncoding, setSubtitleEncoding] = useState<SubtitleEncoding>("utf8");
	const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>("default");

	const { state: encodeState, start, stop } = useEncode();
	const isRunning = encodeState.status === "running";

	const handleSelectVideo = useCallback(async () => {
		const path = await selectVideoFile();
		if (path) {
			setVideoPath(path);
			try {
				const info = await getVideoInfo(path);
				setVideoInfo(info);
			} catch {
				setVideoInfo(null);
			}
		} else {
			setVideoPath("");
			setVideoInfo(null);
		}
	}, []);

	const handleSelectSubtitle = useCallback(async () => {
		const path = await selectSubtitleFile();
		if (path) setSubtitlePath(path);
	}, []);

	const handleSelectOutput = useCallback(async () => {
		const dir = await selectOutputDir();
		if (dir) setOutputDir(dir);
	}, []);

	const handleStart = useCallback(async () => {
		if (!videoPath || !subtitlePath) return;

		let finalOutput = outputDir;
		if (!finalOutput) {
			try {
				finalOutput = await getDefaultOutputDir();
			} catch {
				finalOutput = videoPath.substring(0, videoPath.lastIndexOf("\\"));
			}
		}

		const params: EncodeParams = {
			videoPath,
			subtitlePath,
			outputDir: finalOutput,
			outputFormat,
			videoCodec,
			crf,
			subtitleEncoding,
			subtitleStyle,
		};

		await start(params);
	}, [
		videoPath,
		subtitlePath,
		outputDir,
		outputFormat,
		videoCodec,
		crf,
		subtitleEncoding,
		subtitleStyle,
		start,
	]);

	const handleOpenFolder = useCallback(async () => {
		if (!outputDir) return;
		const { open } = await import("@tauri-apps/plugin-shell");
		await open(outputDir);
	}, [outputDir]);

	const theme = isDark ? webDarkTheme : webLightTheme;

	return (
		<FluentProvider theme={theme}>
			<div className={styles.root} style={{ transition: "background-color 300ms, color 300ms" }}>
				<div className={styles.container}>
					{/* Header */}
					<div className={styles.header}>
						<div>
							<Title1>
								<SubtitlesRegular /> FFSub 字幕压制工具
							</Title1>
							<Text className={styles.subtitle} block>
								快速、高效地将字幕压制到视频中，支持 SRT、ASS、SSA 等格式
							</Text>
						</div>
						<div className={styles.headerRight}>
							<ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />
						</div>
					</div>

					{/* File Selection */}
					<div className={styles.fileGrid}>
						<FileSelector
							title="视频文件"
							path={videoPath}
							onBrowse={handleSelectVideo}
							placeholder="点击选择视频文件"
							infoItems={[
								{
									label: "格式",
									value: videoInfo?.format ?? (videoPath ? extractExtension(videoPath) : "-"),
								},
								{ label: "时长", value: videoInfo?.duration ?? "-" },
								{ label: "分辨率", value: videoInfo?.resolution ?? "-" },
							]}
						/>
						<FileSelector
							title="字幕文件"
							path={subtitlePath}
							onBrowse={handleSelectSubtitle}
							placeholder="点击选择字幕文件"
							infoItems={[
								{
									label: "格式",
									value: subtitlePath ? extractExtension(subtitlePath) : "-",
								},
								{ label: "编码", value: "UTF-8" },
							]}
						/>
					</div>

					{/* Encoding Parameters */}
					<EncodingParams
						outputFormat={outputFormat}
						videoCodec={videoCodec}
						crf={crf}
						subtitleEncoding={subtitleEncoding}
						subtitleStyle={subtitleStyle}
						onOutputFormatChange={setOutputFormat}
						onVideoCodecChange={setVideoCodec}
						onCrfChange={setCrf}
						onSubtitleEncodingChange={setSubtitleEncoding}
						onSubtitleStyleChange={setSubtitleStyle}
					/>

					{/* Output Directory */}
					<FileSelector
						title="输出目录"
						path={outputDir}
						onBrowse={handleSelectOutput}
						placeholder="选择输出目录（默认 视频/FFSub）"
						infoItems={[]}
					/>

					{/* Progress */}
					<ProgressPanel state={encodeState} />

					{/* Actions */}
					<div className={styles.actions}>
						<Button
							appearance="primary"
							icon={<PlayRegular />}
							size="large"
							disabled={isRunning || !videoPath || !subtitlePath}
							onClick={handleStart}
						>
							开始压制
						</Button>
						<Button
							appearance="secondary"
							icon={<StopRegular />}
							size="large"
							disabled={!isRunning}
							onClick={stop}
						>
							停止
						</Button>
						<Button
							appearance="subtle"
							icon={<FolderOpenRegular />}
							size="large"
							disabled={!outputDir}
							onClick={handleOpenFolder}
						>
							打开输出目录
						</Button>
					</div>

					{/* Footer */}
					<div className={styles.footer}>
						<Text className={styles.subtitle}>基于 FFmpeg 构建，支持 Windows、macOS 和 Linux</Text>
					</div>
				</div>
			</div>
		</FluentProvider>
	);
}
