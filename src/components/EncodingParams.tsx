import {
	Card,
	CardHeader,
	Dropdown,
	Field,
	makeStyles,
	Option,
	Slider,
	Text,
	tokens,
} from "@fluentui/react-components";
import { useCallback } from "react";
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

interface DropdownOption<T extends string> {
	value: T;
	label: string;
}

const FORMAT_OPTIONS: DropdownOption<OutputFormat>[] = [
	{ value: "mp4", label: "MP4 (H.264)" },
	{ value: "mkv", label: "MKV (H.265)" },
	{ value: "avi", label: "AVI" },
	{ value: "mov", label: "MOV" },
];

const CODEC_OPTIONS: DropdownOption<VideoCodec>[] = [
	{ value: "libx264", label: "H.264 (libx264)" },
	{ value: "libx265", label: "H.265 (libx265)" },
	{ value: "copy", label: "复制原始流" },
];

const ENCODING_OPTIONS: DropdownOption<SubtitleEncoding>[] = [
	{ value: "utf8", label: "UTF-8" },
	{ value: "gbk", label: "GBK" },
	{ value: "big5", label: "Big5" },
];

const STYLE_OPTIONS: DropdownOption<SubtitleStyle>[] = [
	{ value: "default", label: "默认" },
	{ value: "custom", label: "自定义 ASS 样式" },
];

function SelectField<T extends string>({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: DropdownOption<T>[];
	value: T;
	onChange: (v: T) => void;
}) {
	const selected = options.find((o) => o.value === value);
	return (
		<Field label={label}>
			<Dropdown
				value={selected?.label}
				selectedOptions={[value]}
				onOptionSelect={(_, data) => {
					if (data.optionValue) onChange(data.optionValue as T);
				}}
			>
				{options.map((opt) => (
					<Option key={opt.value} value={opt.value}>
						{opt.label}
					</Option>
				))}
			</Dropdown>
		</Field>
	);
}

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

	const handleCrf = useCallback(
		(_: unknown, data: { value: number }) => onCrfChange(data.value),
		[onCrfChange],
	);

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
				<SelectField
					label="输出格式"
					options={FORMAT_OPTIONS}
					value={outputFormat}
					onChange={onOutputFormatChange}
				/>
				<SelectField
					label="视频编码器"
					options={CODEC_OPTIONS}
					value={videoCodec}
					onChange={onVideoCodecChange}
				/>
				<Field label={`CRF 质量 (${crf})`}>
					<div className={styles.sliderRow}>
						<Slider min={0} max={51} value={crf} onChange={handleCrf} style={{ flex: 1 }} />
						<Text weight="semibold">{crf}</Text>
					</div>
				</Field>
			</div>

			<div className={styles.grid}>
				<SelectField
					label="字幕编码"
					options={ENCODING_OPTIONS}
					value={subtitleEncoding}
					onChange={onSubtitleEncodingChange}
				/>
				<SelectField
					label="字幕样式"
					options={STYLE_OPTIONS}
					value={subtitleStyle}
					onChange={onSubtitleStyleChange}
				/>
			</div>
		</Card>
	);
}
