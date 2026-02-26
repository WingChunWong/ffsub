import {
	Card,
	CardHeader,
	Dropdown,
	Label,
	makeStyles,
	Option,
	Slider,
	Text,
	tokens,
} from "@fluentui/react-components";
import type { OutputFormat, SubtitleEncoding, SubtitleStyle, VideoCodec } from "@/types/encode";

const useStyles = makeStyles({
	card: {
		width: "100%",
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
		gap: tokens.spacingHorizontalL,
		marginBottom: tokens.spacingVerticalL,
	},
	field: {
		display: "flex",
		flexDirection: "column",
		gap: tokens.spacingVerticalXS,
	},
	sliderRow: {
		display: "flex",
		alignItems: "center",
		gap: tokens.spacingHorizontalM,
	},
});

interface EncodingParamsProps {
	outputFormat: OutputFormat;
	videoCodec: VideoCodec;
	crf: number;
	subtitleEncoding: SubtitleEncoding;
	subtitleStyle: SubtitleStyle;
	onOutputFormatChange: (value: OutputFormat) => void;
	onVideoCodecChange: (value: VideoCodec) => void;
	onCrfChange: (value: number) => void;
	onSubtitleEncodingChange: (value: SubtitleEncoding) => void;
	onSubtitleStyleChange: (value: SubtitleStyle) => void;
}

const FORMAT_OPTIONS: Array<{ value: OutputFormat; label: string }> = [
	{ value: "mp4", label: "MP4 (H.264)" },
	{ value: "mkv", label: "MKV (H.265)" },
	{ value: "avi", label: "AVI" },
	{ value: "mov", label: "MOV" },
];

const CODEC_OPTIONS: Array<{ value: VideoCodec; label: string }> = [
	{ value: "libx264", label: "H.264 (libx264)" },
	{ value: "libx265", label: "H.265 (libx265)" },
	{ value: "copy", label: "复制原始流" },
];

const ENCODING_OPTIONS: Array<{ value: SubtitleEncoding; label: string }> = [
	{ value: "utf8", label: "UTF-8" },
	{ value: "gbk", label: "GBK" },
	{ value: "big5", label: "Big5" },
];

const STYLE_OPTIONS: Array<{ value: SubtitleStyle; label: string }> = [
	{ value: "default", label: "默认" },
	{ value: "custom", label: "自定义 ASS 样式" },
];

export function EncodingParams({
	outputFormat,
	videoCodec,
	crf,
	subtitleEncoding,
	subtitleStyle,
	onOutputFormatChange,
	onVideoCodecChange,
	onCrfChange,
	onSubtitleEncodingChange,
	onSubtitleStyleChange,
}: EncodingParamsProps) {
	const styles = useStyles();

	return (
		<Card className={styles.card}>
			<CardHeader
				header={
					<Text weight="semibold" size={400}>
						压制参数
					</Text>
				}
			/>

			<div className={styles.grid}>
				<div className={styles.field}>
					<Label>输出格式</Label>
					<Dropdown
						value={FORMAT_OPTIONS.find((o) => o.value === outputFormat)?.label}
						selectedOptions={[outputFormat]}
						onOptionSelect={(_, data) => {
							if (data.optionValue) onOutputFormatChange(data.optionValue as OutputFormat);
						}}
					>
						{FORMAT_OPTIONS.map((opt) => (
							<Option key={opt.value} value={opt.value}>
								{opt.label}
							</Option>
						))}
					</Dropdown>
				</div>

				<div className={styles.field}>
					<Label>视频编码器</Label>
					<Dropdown
						value={CODEC_OPTIONS.find((o) => o.value === videoCodec)?.label}
						selectedOptions={[videoCodec]}
						onOptionSelect={(_, data) => {
							if (data.optionValue) onVideoCodecChange(data.optionValue as VideoCodec);
						}}
					>
						{CODEC_OPTIONS.map((opt) => (
							<Option key={opt.value} value={opt.value}>
								{opt.label}
							</Option>
						))}
					</Dropdown>
				</div>

				<div className={styles.field}>
					<Label>CRF 质量 (0-51)</Label>
					<div className={styles.sliderRow}>
						<Slider
							min={0}
							max={51}
							value={crf}
							onChange={(_, data) => onCrfChange(data.value)}
							style={{ flex: 1 }}
						/>
						<Text weight="semibold">{crf}</Text>
					</div>
				</div>
			</div>

			<div className={styles.grid}>
				<div className={styles.field}>
					<Label>字幕编码</Label>
					<Dropdown
						value={ENCODING_OPTIONS.find((o) => o.value === subtitleEncoding)?.label}
						selectedOptions={[subtitleEncoding]}
						onOptionSelect={(_, data) => {
							if (data.optionValue) onSubtitleEncodingChange(data.optionValue as SubtitleEncoding);
						}}
					>
						{ENCODING_OPTIONS.map((opt) => (
							<Option key={opt.value} value={opt.value}>
								{opt.label}
							</Option>
						))}
					</Dropdown>
				</div>

				<div className={styles.field}>
					<Label>字幕样式</Label>
					<Dropdown
						value={STYLE_OPTIONS.find((o) => o.value === subtitleStyle)?.label}
						selectedOptions={[subtitleStyle]}
						onOptionSelect={(_, data) => {
							if (data.optionValue) onSubtitleStyleChange(data.optionValue as SubtitleStyle);
						}}
					>
						{STYLE_OPTIONS.map((opt) => (
							<Option key={opt.value} value={opt.value}>
								{opt.label}
							</Option>
						))}
					</Dropdown>
				</div>
			</div>
		</Card>
	);
}
