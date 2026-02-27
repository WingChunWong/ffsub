import {
	Badge,
	Card,
	CardHeader,
	makeStyles,
	ProgressBar,
	Text,
	tokens,
} from "@fluentui/react-components";
import { useEffect, useMemo, useRef } from "react";
import type { EncodeState, EncodeStatus } from "@/types/encode";

const useStyles = makeStyles({
	card: {
		width: "100%",
	},
	progressInfo: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: tokens.spacingVerticalS,
		marginBottom: tokens.spacingVerticalS,
	},
	statusRow: {
		display: "flex",
		alignItems: "center",
		gap: tokens.spacingHorizontalS,
	},
	logContainer: {
		backgroundColor: tokens.colorNeutralBackground1,
		color: tokens.colorNeutralForeground1,
		fontFamily: "'Cascadia Code', 'Consolas', monospace",
		fontSize: "12px",
		lineHeight: "18px",
		padding: tokens.spacingHorizontalM,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		maxHeight: "200px",
		overflowY: "auto",
		whiteSpace: "pre-wrap",
		marginTop: tokens.spacingVerticalM,
	},
});

interface ProgressPanelProps {
	state: EncodeState;
}

const STATUS_CONFIG: Record<
	EncodeStatus,
	{ label: string; color: "informative" | "success" | "danger" | "warning" | "important" }
> = {
	idle: { label: "就绪", color: "informative" },
	running: { label: "压制中...", color: "important" },
	completed: { label: "压制完成", color: "success" },
	error: { label: "压制失败", color: "danger" },
	stopped: { label: "已停止", color: "warning" },
};

export function ProgressPanel({ state }: ProgressPanelProps) {
	const styles = useStyles();
	const logRef = useRef<HTMLDivElement>(null);

	const logsLength = state.logs.length;
	useEffect(() => {
		if (logRef.current && logsLength > 0) {
			logRef.current.scrollTop = logRef.current.scrollHeight;
		}
	}, [logsLength]);

	const percentage = state.progress?.percentage ?? 0;
	const statusCfg = STATUS_CONFIG[state.status];

	const progressValue = useMemo(() => {
		if (state.status === "running" && percentage === 0) return undefined;
		if (state.status === "idle") return 0;
		return percentage;
	}, [state.status, percentage]);

	const progressColor =
		state.status === "error"
			? ("error" as const)
			: state.status === "completed"
				? ("success" as const)
				: ("brand" as const);

	return (
		<Card className={styles.card}>
			<CardHeader
				header={
					<Text weight="semibold" size={400}>
						压制进度
					</Text>
				}
			/>

			<ProgressBar max={100} value={progressValue} color={progressColor} />

			<div className={styles.progressInfo}>
				<div className={styles.statusRow}>
					<Badge appearance="filled" color={statusCfg.color}>
						{statusCfg.label}
					</Badge>
				</div>
				{state.progress && (
					<Text size={200}>
						{state.progress.time} | {state.progress.fps} fps | {state.progress.speed}
					</Text>
				)}
				{state.status !== "idle" && <Text weight="semibold">{percentage}%</Text>}
			</div>

			{logsLength > 0 && (
				<div ref={logRef} className={styles.logContainer}>
					{state.logs.map((log, i) => (
						<div key={`${i}-${log.slice(0, 20)}`}>{log}</div>
					))}
				</div>
			)}
		</Card>
	);
}
