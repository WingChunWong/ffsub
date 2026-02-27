import { useCallback, useEffect, useReducer, useRef } from "react";
import {
	onEncodeComplete,
	onEncodeError,
	onEncodeLog,
	onEncodeProgress,
	startEncode as startEncodeApi,
	stopEncode as stopEncodeApi,
} from "@/services/tauri";
import type { EncodeParams, EncodeProgress, EncodeState, EncodeStatus } from "@/types/encode";

type EncodeAction =
	| { type: "START" }
	| { type: "PROGRESS"; payload: EncodeProgress }
	| { type: "LOG"; payload: string }
	| { type: "COMPLETE"; payload: string }
	| { type: "ERROR"; payload: string }
	| { type: "STOP" }
	| { type: "RESET" };

const initialState: EncodeState = {
	status: "idle",
	progress: null,
	logs: [],
	outputPath: null,
	error: null,
};

const MAX_LOGS = 500;

function encodeReducer(state: EncodeState, action: EncodeAction): EncodeState {
	switch (action.type) {
		case "START":
			return {
				...initialState,
				status: "running",
				logs: ["正在启动FFmpeg..."],
			};
		case "PROGRESS":
			return { ...state, progress: action.payload };
		case "LOG": {
			const newLogs = [...state.logs, action.payload];
			return {
				...state,
				logs: newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs,
			};
		}
		case "COMPLETE":
			return {
				...state,
				status: "completed",
				outputPath: action.payload,
				logs: [...state.logs, `✅ 压制完成！输出文件: ${action.payload}`],
				progress: state.progress ? { ...state.progress, percentage: 100 } : null,
			};
		case "ERROR":
			return {
				...state,
				status: "error",
				error: action.payload,
				logs: [...state.logs, `❌ 错误: ${action.payload}`],
			};
		case "STOP":
			return {
				...state,
				status: "stopped",
				logs: [...state.logs, "⏹️ 用户请求停止"],
			};
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

export function useEncode() {
	const [state, dispatch] = useReducer(encodeReducer, initialState);
	const statusRef = useRef<EncodeStatus>("idle");
	statusRef.current = state.status;

	useEffect(() => {
		const unlistenProgress = onEncodeProgress((progress) => {
			if (statusRef.current === "running") {
				dispatch({ type: "PROGRESS", payload: progress });
			}
		});
		const unlistenComplete = onEncodeComplete((outputPath) => {
			dispatch({ type: "COMPLETE", payload: outputPath });
		});
		const unlistenError = onEncodeError((error) => {
			dispatch({ type: "ERROR", payload: error });
		});
		const unlistenLog = onEncodeLog((log) => {
			if (statusRef.current === "running") {
				dispatch({ type: "LOG", payload: log });
			}
		});

		return () => {
			unlistenProgress();
			unlistenComplete();
			unlistenError();
			unlistenLog();
		};
	}, []);

	const start = useCallback(async (params: EncodeParams) => {
		dispatch({ type: "START" });
		try {
			await startEncodeApi(params);
		} catch (err) {
			dispatch({ type: "ERROR", payload: String(err) });
		}
	}, []);

	const stop = useCallback(async () => {
		try {
			await stopEncodeApi();
			dispatch({ type: "STOP" });
		} catch (err) {
			dispatch({ type: "ERROR", payload: `停止失败: ${String(err)}` });
		}
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "RESET" });
	}, []);

	return { state, start, stop, reset };
}
