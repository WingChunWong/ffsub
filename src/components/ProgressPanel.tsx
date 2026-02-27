import {
	Card,
	CardHeader,
	makeStyles,
	ProgressBar,
	Text,
	tokens,
} from "@fluentui/react-components";
import { useEffect, useRef } from "react";
import type { EncodeState } from "@/types/encode";

const useStyles = makeStyles({
	card: {
		width: "100%",
	},
	progressInfo: {
		display: "flex",
		justifyContent: "space-between",
		marginTop: tokens.spacingVerticalS,
		marginBottom: tokens.spacingVerticalS,
	},
	logContainer: {
		backgroundColor: "#1e1e1e",
		color: "#d4d4d4",
		fontFamily: "'Cascadia Code', 'Consolas', monospace",
		fontSize: "12px",
		padding: tokens.spacingHorizontalM,
		borderRadius: tokens.borderRadiusMedium,
		maxHeight: "200px",
		overflowY: "auto",
		whiteSpace: "pre-wrap",
		marginTop: tokens.spacingVerticalM,
	},
});

interface ProgressPanelProps {
	state: EncodeState;
}

function statusLabel(status: EncodeState["status"]): string {
	const labels: Record<EncodeState["status"], string> = {
		idle: "就绪",
		running: "压制中...",
		completed: "压制完成",
		error: "压制失败",
		stopped: "已停止",
	};
	return labels[status];
}

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
	const color =
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

			<ProgressBar
				max={100}
				value={
					state.status === "running" && percentage === 0
						? undefined
						: state.status === "idle"
							? 0
							: percentage
				}
				color={color}
			/>

			<div className={styles.progressInfo}>
				<Text>{statusLabel(state.status)}</Text>
				{state.progress && (
					<Text>
						{state.progress.time} | {state.progress.fps} fps | {state.progress.speed}
					</Text>
				)}
				{state.status !== "idle" && <Text weight="semibold">{percentage}%</Text>}
			</div>

			{state.logs.length > 0 && (
				<div ref={logRef} className={styles.logContainer}>
					{state.logs.map((log, i) => (
						<div key={`${i}-${log.slice(0, 20)}`}>{log}</div>
					))}
				</div>
			)}
		</Card>
	);
}
