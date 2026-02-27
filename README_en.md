# FFSub

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Overview

FFSub is a cross‑platform desktop subtitle burn‑in (hardcode) tool built on FFmpeg, using Tauri and Rust. The frontend is implemented with React (TypeScript) to provide an intuitive graphical interface, while the backend invokes local FFmpeg processes through Tauri commands for efficient subtitle rendering and video transcoding.

One‑line description: A subtitle burn‑in tool built with FFmpeg, using Tauri + Rust.

## Key Features

- **Graphical file selection**: Single or batch selection of video and subtitle files (common formats like SRT, ASS, etc.)
- **Flexible parameter configuration**: Adjustable encoding parameters (container, codec, bitrate, etc.) and subtitle styling (font, size, color, position, shadow, time offset, etc.)
- **Real‑time progress monitoring**: Display progress bar, log output during task execution, with support for pause/cancel (if implemented)
- **Event‑driven backend communication**: Frontend communicates with Rust backend via Tauri events (`encode‑progress`, `encode‑complete`, `encode‑error`)
- **Clean user interface**: Built with Fluent UI components, offering a clear progress panel and operation guidance

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Framework**: Tauri (Rust backend)
- **Backend language**: Rust (Tauri commands)
- **Encoding/processing**: FFmpeg
- **Build & package managers**: pnpm (frontend), cargo (backend)

## Prerequisites

Before using this tool, make sure **FFmpeg** (version 5.x or later recommended) is installed and available in your PATH. You can verify with:

```bash
ffmpeg -version
```

If not installed, visit the [FFmpeg official site](https://ffmpeg.org/download.html) to download and install it.

## Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ffsub.git
   cd ffsub
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Start development mode**
   ```bash
   pnpm dev            # start Vite dev server (frontend)
   cargo tauri dev     # start Tauri backend (in another terminal)
   ```

   Alternatively, you can use Tauri's integrated dev command (it will automatically start the frontend server):
   ```bash
   cargo tauri dev
   ```

4. **Build for production**
   ```bash
   pnpm build          # build frontend assets
   cargo tauri build   # build Tauri application (generates installers)
   ```

## Installation (End Users)

### Download Pre‑compiled Binaries

Go to the [Releases page](https://github.com/your-username/ffsub/releases) and download the installer for your platform (Windows `.msi`, macOS `.dmg`, Linux `.AppImage`, etc.).

### Build from Source

If you prefer to build from source, ensure you have [Rust](https://www.rust-lang.org/), [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed, then run:

```bash
git clone https://github.com/your-username/ffsub.git
cd ffsub
pnpm install
pnpm build
cargo tauri build
```

The built artifacts will be located in `src‑tauri/target/release/bundle/`.

## Usage

1. **Launch the application** (double‑click the installed icon, or run from the command line)
2. **Select video and subtitle files**: Click “Select Video” and “Select Subtitle” buttons; multiple selection is supported
3. **Configure parameters**: Adjust output format, encoding options, subtitle styling, etc. in the right panel
4. **Start burning**: Click the “Start” button; tasks will be queued and executed
5. **Monitor progress**: View real‑time progress and logs in the progress panel; after completion the output file will be saved in the chosen directory

## Configuration & Advanced Options

- **Output format**: Supports common containers like MP4, MKV; codecs like H.264, HEVC, etc.
- **Subtitle styling**: Font file path (must be installed on the system), font size, color (hex), background, outline, position (X/Y offset)
- **Time offset**: Shift the entire subtitle track forward or backward (in seconds)
- **Video parameters**: Resolution scaling, bitrate, frame rate, etc. (for advanced control you can directly edit the FFmpeg command template)

> Note: Some paths (e.g., font files) must exist and be readable, otherwise FFmpeg will report an error.

## Contributing

We welcome Issue reports and Pull Requests to help improve FFSub.

1. **Fork the repository** and develop on a feature branch
2. **Follow the code style**:
   - Frontend uses TypeScript, follows Biome formatting and linting rules
   - Backend uses Rust, follows `cargo fmt` and `cargo clippy` conventions
3. **Run checks before submitting**:
   ```bash
   pnpm check          # frontend lint/format checks
   pnpm check:fix      # auto‑fix (if available)
   cargo fmt
   cargo clippy
   ```
4. **Create a Pull Request**: Describe the purpose of the change, testing performed, and link related Issues

Please discuss major design changes or new features in an Issue first.

## License

This project is licensed under the **GNU General Public License v3.0 (GPL‑3.0)**. See the [LICENSE](LICENSE) file or visit the [GNU website](https://www.gnu.org/licenses/gpl‑3.0.en.html) for details.

> This project is licensed under the GNU General Public License v3.0 (GPL‑3.0). See https://www.gnu.org/licenses/gpl‑3.0.en.html for details.

## Authors & Acknowledgements

FFSub is maintained by the open‑source community. Special thanks to the following projects:

- [Tauri](https://tauri.app/) – cross‑platform desktop app framework
- [FFmpeg](https://ffmpeg.org/) – powerful audio/video processing toolkit
- [React](https://react.dev/) & [Fluent UI](https://react.fluentui.dev/) – frontend UI foundation

Contributions, feedback, and sharing of experience are welcome.

## Disclaimer

- Before using this software, ensure you have the legal rights to process the video and subtitle content.
- This software is provided “as is”, and the authors and contributors are not liable for any direct or indirect damages arising from its use.
- This software depends on FFmpeg, whose usage is subject to the FFmpeg license.
