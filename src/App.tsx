import {
	Button,
	FluentProvider,
	makeStyles,
	Text,
	Title1,
	ToolbarButton,
	Tooltip,
	tokens,
	webDarkTheme,
	webLightTheme,
} from "@fluentui/react-components";
import {
	FolderOpenRegular,
	PlayRegular,
	StopRegular,
	SubtitlesRegular,
	WeatherMoonRegular,
	WeatherSunnyRegular,
} from "@fluentui/react-icons";
import { useCallback, useMemo, useState } from "react";
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
		transition: "background-color 200ms ease",
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
	titleRow: {
		display: "flex",
		alignItems: "center",
		gap: tokens.spacingHorizontalS,
	},
	subtitle: {
		color: tokens.colorNeutralForeground3,
	},
	fileGrid: {
		display: "grid",
		gridTemplateColumns: "1fr 1fr",
		gap: tokens.spacingHorizontalL,
	},
	actions: {
		display: "flex",
		justifyContent: "center",
		gap: tokens.spacingHorizontalL,
		paddingTop: tokens.spacingVerticalS,
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

export default function App() {
	const styles = useStyles();

	const [isDark, setIsDark] = useState(() => {
		try {
			const stored = localStorage.getItem("theme");
			if (stored) return stored === "dark";
			return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
		} catch {
			return false;
		}
	});

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
				setVideoInfo(await getVideoInfo(path));
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

		// persist chosen output dir (including default) so "打开输出目录" 可用
		setOutputDir(finalOutput);

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
		// prefer actual encode output file if present, otherwise use selected/outputDir or default
		let targetDir = "";
		if (encodeState.outputPath) {
			const p = encodeState.outputPath;
			const idx = p.lastIndexOf("\\");
			if (idx !== -1) targetDir = p.substring(0, idx);
			else targetDir = p;
		} else if (outputDir) {
			targetDir = outputDir;
		} else {
			try {
				const d = await getDefaultOutputDir();
				setOutputDir(d);
				targetDir = d;
			} catch {
				return;
			}
		}

		if (!targetDir) return;
		try {
			// call Rust command to open path to avoid JS-side scoped-argument regex
			try {
				const { openPath } = await import("@/services/tauri");
				await openPath(targetDir);
			} catch {
				// fallback to plugin-shell if Rust command not available
				const { open } = await import("@tauri-apps/plugin-shell");
				await open(targetDir);
			}
		} catch (err) {
			try {
				// show user-friendly message
				window.alert(`打开目录失败: ${String(err)}`);
			} catch {
				// ignore if alert not available
			}
		}
	}, [outputDir, encodeState.outputPath]);

	const theme = useMemo(() => (isDark ? webDarkTheme : webLightTheme), [isDark]);

	const videoInfoItems = useMemo(
		() => [
			{
				label: "格式",
				value: videoInfo?.format ?? (videoPath ? extractExtension(videoPath) : "-"),
			},
			{ label: "时长", value: videoInfo?.duration ?? "-" },
			{ label: "分辨率", value: videoInfo?.resolution ?? "-" },
		],
		[videoInfo, videoPath],
	);

	const subtitleInfoItems = useMemo(
		() => [
			{ label: "格式", value: subtitlePath ? extractExtension(subtitlePath) : "-" },
			{ label: "编码", value: "UTF-8" },
		],
		[subtitlePath],
	);

	return (
		<FluentProvider theme={theme}>
			<div className={styles.root}>
				<div className={styles.container}>
					<div className={styles.header}>
						<div>
							<div className={styles.titleRow}>
								<SubtitlesRegular fontSize={28} />
								<Title1>FFSub 字幕压制工具</Title1>
							</div>
							<Text className={styles.subtitle} block>
								快速、高效地将字幕压制到视频中，支持 SRT、ASS、SSA 等格式
							</Text>
						</div>
						<Tooltip content={isDark ? "切换到亮色主题" : "切换到暗色主题"} relationship="label">
							<ToolbarButton
								aria-label="切换主题"
								icon={isDark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
								onClick={toggleTheme}
							/>
						</Tooltip>
					</div>

					<div className={styles.fileGrid}>
						<FileSelector
							title="视频文件"
							path={videoPath}
							onBrowse={handleSelectVideo}
							placeholder="点击选择视频文件"
							infoItems={videoInfoItems}
						/>
						<FileSelector
							title="字幕文件"
							path={subtitlePath}
							onBrowse={handleSelectSubtitle}
							placeholder="点击选择字幕文件"
							infoItems={subtitleInfoItems}
						/>
					</div>

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

					<FileSelector
						title="输出目录"
						path={outputDir}
						onBrowse={handleSelectOutput}
						placeholder="选择输出目录（默认 视频/FFSub）"
						infoItems={[]}
					/>

					<ProgressPanel state={encodeState} />

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
							disabled={!(outputDir || encodeState.outputPath)}
							onClick={handleOpenFolder}
						>
							打开输出目录
						</Button>
					</div>
				</div>
			</div>
		</FluentProvider>
	);
}
