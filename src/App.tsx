import {
	Button,
	FluentProvider,
	makeStyles,
	Text,
	Title1,
	tokens,
	webLightTheme,
} from "@fluentui/react-components";
import {
	FolderOpenRegular,
	PlayRegular,
	StopRegular,
	SubtitlesRegular,
} from "@fluentui/react-icons";
import { useCallback, useState } from "react";
import { EncodingParams, FileSelector, ProgressPanel } from "@/components";
import { useEncode } from "@/hooks/useEncode";
import { selectOutputDir, selectSubtitleFile, selectVideoFile } from "@/services/tauri";
import type {
	EncodeParams,
	OutputFormat,
	SubtitleEncoding,
	SubtitleStyle,
	VideoCodec,
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
		textAlign: "center",
		paddingBottom: tokens.spacingVerticalL,
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
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

export default function App() {
	const styles = useStyles();

	const [videoPath, setVideoPath] = useState("");
	const [subtitlePath, setSubtitlePath] = useState("");
	const [outputDir, setOutputDir] = useState("");

	const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp4");
	const [videoCodec, setVideoCodec] = useState<VideoCodec>("libx264");
	const [crf, setCrf] = useState(23);
	const [subtitleEncoding, setSubtitleEncoding] = useState<SubtitleEncoding>("utf8");
	const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>("default");

	const { state: encodeState, start, stop } = useEncode();
	const isRunning = encodeState.status === "running";

	const handleSelectVideo = useCallback(async () => {
		const path = await selectVideoFile();
		if (path) setVideoPath(path);
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

		const params: EncodeParams = {
			videoPath,
			subtitlePath,
			outputDir: outputDir || videoPath.substring(0, videoPath.lastIndexOf("\\")),
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

	return (
		<FluentProvider theme={webLightTheme}>
			<div className={styles.root}>
				<div className={styles.container}>
					{/* Header */}
					<div className={styles.header}>
						<Title1>
							<SubtitlesRegular /> FFSub 字幕压制工具
						</Title1>
						<Text className={styles.subtitle} block>
							快速、高效地将字幕压制到视频中，支持 SRT、ASS、SSA 等格式
						</Text>
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
									value: videoPath ? extractExtension(videoPath) : "-",
								},
								{ label: "时长", value: "-" },
								{ label: "分辨率", value: "-" },
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
								{ label: "语言", value: "-" },
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
						placeholder="选择输出目录（默认与视频同目录）"
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
