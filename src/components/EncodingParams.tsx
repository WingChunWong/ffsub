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

const OPTIONS = {
	format: [
		{ value: "mp4" as const, label: "MP4 (H.264)" },
		{ value: "mkv" as const, label: "MKV (H.265)" },
		{ value: "avi" as const, label: "AVI" },
		{ value: "mov" as const, label: "MOV" },
	],
	codec: [
		{ value: "libx264" as const, label: "H.264 (libx264)" },
		{ value: "libx265" as const, label: "H.265 (libx265)" },
		{ value: "copy" as const, label: "复制原始流" },
	],
	encoding: [
		{ value: "utf8" as const, label: "UTF-8" },
		{ value: "gbk" as const, label: "GBK" },
		{ value: "big5" as const, label: "Big5" },
	],
	style: [
		{ value: "default" as const, label: "默认" },
		{ value: "custom" as const, label: "自定义 ASS 样式" },
	],
};

interface SelectFieldProps<T extends string> {
	label: string;
	value: T;
	options: Array<{ value: T; label: string }>;
	onChange: (val: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
	const selected = options.find((o) => o.value === value)?.label;

	return (
		<Field label={label}>
			<Dropdown
				value={selected}
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
					options={OPTIONS.format}
					value={outputFormat}
					onChange={onOutputFormatChange}
				/>
				<SelectField
					label="视频编码器"
					options={OPTIONS.codec}
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
					options={OPTIONS.encoding}
					value={subtitleEncoding}
					onChange={onSubtitleEncodingChange}
				/>
				<SelectField
					label="字幕样式"
					options={OPTIONS.style}
					value={subtitleStyle}
					onChange={onSubtitleStyleChange}
				/>
			</div>
		</Card>
	);
}
