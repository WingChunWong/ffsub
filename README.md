# FFSub

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## 简介

FFSub 是一款基于 FFmpeg 的跨平台桌面字幕压制（硬编码）工具，使用 Tauri + Rust 构建。前端采用 React (TypeScript) 提供直观的图形界面，后端通过 Tauri 命令调用本地 FFmpeg 进程，实现高效的字幕烧录与视频转码。

一句话简介：一个基于 FFmpeg 并使用 Tauri + Rust 构建的字幕压制软件。

## 主要功能

- **图形界面选择文件**：支持单文件或批量选择视频与字幕文件（SRT、ASS 等常见格式）
- **灵活的参数配置**：可调整编码参数（容器、编码器、比特率等）与字幕样式（字体、大小、颜色、位置、阴影、时间偏移等）
- **实时进度监控**：任务执行过程中显示进度条、日志输出，支持暂停/取消（若实现）
- **事件驱动的后端通信**：前端通过 Tauri 事件 (`encode-progress`, `encode-complete`, `encode-error`) 与 Rust 后端交互
- **简洁的用户界面**：基于 Fluent UI 组件，提供清晰的进度面板与操作指引

## 技术栈

- **前端**：React + TypeScript + Vite
- **框架**：Tauri（Rust 后端）
- **后端语言**：Rust（Tauri commands）
- **编码/处理工具**：FFmpeg
- **构建与包管理**：pnpm（前端）、cargo（后端）

## 前提条件

使用本工具前，请确保系统已安装 **FFmpeg**（版本 5.x 或更高推荐）并已添加到 PATH 环境变量。你可以通过以下命令检查：

```bash
ffmpeg -version
```

若未安装，请访问 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载并安装。

## 快速开始（开发）

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/ffsub.git
   cd ffsub
   ```

2. **安装前端依赖**
   ```bash
   pnpm install
   ```

3. **启动开发模式**
   ```bash
   pnpm dev            # 启动 Vite 开发服务器（前端）
   cargo tauri dev     # 启动 Tauri 后端（另一终端）
   ```

   或者直接使用 Tauri 的集成开发命令（会自动启动前端服务器）：
   ```bash
   cargo tauri dev
   ```

4. **构建生产包**
   ```bash
   pnpm build          # 构建前端资源
   cargo tauri build   # 构建 Tauri 应用（生成安装包）
   ```

## 安装（终端用户）

### 下载预编译二进制

前往 [Releases 页面](https://github.com/your-username/ffsub/releases) 下载对应平台的安装包（Windows `.msi`、macOS `.dmg`、Linux `.AppImage` 等）。

### 从源码构建

若希望自行构建，请确保已安装 [Rust](https://www.rust-lang.org/)、[Node.js](https://nodejs.org/) 与 [pnpm](https://pnpm.io/)，然后执行：

```bash
git clone https://github.com/your-username/ffsub.git
cd ffsub
pnpm install
pnpm build
cargo tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 使用说明

1. **启动应用程序**（安装后双击图标，或从命令行运行）
2. **选择视频与字幕文件**：点击“选择视频”与“选择字幕”按钮，支持多选
3. **配置参数**：在右侧面板调整输出格式、编码参数、字幕样式等
4. **开始压制**：点击“开始”按钮，任务将排队执行
5. **监控进度**：在进度面板查看实时进度、日志，任务完成后输出文件将保存在指定目录

## 配置与高级选项

- **输出格式**：支持 MP4、MKV 等常见容器，编码器可选 H.264、HEVC 等
- **字幕样式**：字体文件路径（需系统已安装）、字体大小、颜色（十六进制）、背景、描边、位置（X/Y 偏移）
- **时间偏移**：可设置字幕整体提前或延后时间（秒）
- **视频参数**：分辨率缩放、比特率、帧率等（若需高级控制，可直接编辑 FFmpeg 命令模板）

> 注意：部分路径（如字体文件）需确保存在且可读，否则 FFmpeg 会报错。

## 贡献指南

欢迎提交 Issue 或 Pull Request 来帮助改进 FFSub。

1. **Fork 仓库**，并在 feature 分支上开发
2. **遵循代码规范**：
   - 前端使用 TypeScript，遵循 Biome 格式化与检查规则
   - 后端使用 Rust，遵循 `cargo fmt` 与 `cargo clippy` 规范
3. **提交前运行检查**：
   ```bash
   pnpm check          # 前端检查
   pnpm check:fix      # 自动修复（若支持）
   cargo fmt
   cargo clippy
   ```
4. **创建 Pull Request**：描述变更目的、测试情况，并关联相关 Issue

重大功能变更建议先在 Issue 中讨论。

## 许可证

本项目采用 **GNU General Public License v3.0 (GPL-3.0)** 许可。详情请参阅 [LICENSE](LICENSE) 文件或访问 [GNU 官网](https://www.gnu.org/licenses/gpl-3.0.en.html)。

> This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See https://www.gnu.org/licenses/gpl-3.0.en.html for details.

## 作者与致谢

FFSub 由开源社区维护。特别感谢以下项目：

- [Tauri](https://tauri.app/) – 提供跨平台桌面应用框架
- [FFmpeg](https://ffmpeg.org/) – 强大的音视频处理工具链
- [React](https://react.dev/) & [Fluent UI](https://react.fluentui.dev/) – 前端界面基础

欢迎贡献代码、反馈问题或分享使用经验。

## 免责声明

- 使用本软件前，请确保您拥有处理相关视频与字幕的合法权利。
- 本软件按“原样”提供，作者及贡献者不对因使用本软件而产生的任何直接或间接损失承担责任。
- 本软件依赖 FFmpeg，其使用受 FFmpeg 许可证约束。
