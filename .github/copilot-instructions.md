# FFSub - 项目指南

FFSub 是一款基于 Tauri 2 的桌面字幕压制工具，使用本地 FFmpeg 将字幕烧录到视频中。

## 技术栈

- **前端**: React 19 + TypeScript + Fluent UI v9 + Vite 7
- **后端**: Rust (edition 2021) + Tauri 2.10
- **代码质量**: Biome（Tab 缩进、双引号、分号、行宽 100）
- **包管理**: pnpm

## 构建与运行

| 命令 | 用途 |
|------|------|
| `pnpm install` | 安装前端依赖 |
| `pnpm dev` | Vite dev server |
| `cargo tauri dev` | 完整开发模式（前端 + Rust） |
| `cargo tauri build` | 生产构建 |
| `pnpm check` | Biome lint + format 检查 |
| `pnpm check:fix` | Biome 自动修复 |

## 代码规范

### TypeScript / React

- 路径别名 `@/*` → `src/*`，项目内引用使用 `@/` 前缀
- 类型导入必须使用 `import type`（Biome `useImportType` 规则）
- 禁止 `any`、未使用的变量/导入
- 组件为函数式组件，Props 接口命名为 `{组件名}Props`
- 复杂状态使用 `useReducer`，简单状态使用 `useState`
- 事件处理函数用 `useCallback` 包裹
- 样式通过 Fluent UI `makeStyles()` 实现，使用 design tokens
- 组件通过 `src/components/index.ts` barrel 导出

### Rust

- Tauri command 签名：`async fn(params, State<AppState>, AppHandle) -> Result<T, String>`
- 错误处理返回 `Result<T, String>`，用 `format!()` 构造错误信息
- Serde 命名：`#[serde(rename_all = "camelCase")]` 保持前后端一致
- 日志使用 `log` crate（`log::info!()`, `log::warn!()`）
- FFmpeg 进程通过后台线程管理，事件通过 `app_handle.emit()` 推送到前端

### 前后端通信

- 前端 `src/services/tauri.ts` 封装所有 IPC 调用和事件监听
- 事件名：`encode-progress`、`encode-complete`、`encode-error`、`encode-log`
- 类型在前端 `src/types/encode.ts` 和后端 `src-tauri/src/types.rs` 中镜像定义，新增字段需两端同步

## 架构约定

- **组件**是纯展示的，业务逻辑放在 hooks 和 services 中
- **hooks** 管理状态和副作用，返回 `{ state, actions }` 形式
- **services** 封装外部交互（Tauri IPC、dialog API）
- Rust 端模块划分：`commands/`（Tauri 命令）、`ffmpeg/`（进程管理、参数构建、进度解析）、`state.rs`（共享状态）

## 安全注意事项

- FFmpeg filter 路径必须通过 `escape_filter_path()` 转义，防止命令注入
- 文件路径在传入 FFmpeg 前需验证存在性
- CSP 已配置：`default-src 'self'; style-src 'self' 'unsafe-inline'`
