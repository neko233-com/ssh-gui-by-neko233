# ssh-gui-by-neko233

Cross-platform SSH, SFTP, tunneling, and AI operations desktop client built with TypeScript and Perry.

## Current Scope

This repository now contains the first Perry native desktop shell and the typed domain model for a full SSH GUI:

- Session manager for SSH profiles, folders, tags, jump hosts, keepalive, proxy, and terminal settings.
- XFTP-style file panel model for SFTP/SCP/FTP flows, transfer queues, sync, filters, and bookmarks.
- Xshell-style terminal capability map for tabs, panes, logs, snippets, tunnels, key manager, and automation.
- AI model adapter contract for OpenAI-compatible, local HTTP, and custom provider integrations.
- Agent execution policy model for approval gates, command limits, redaction, and audit logging.

The protocol/runtime layer is intentionally split from the UI so native Perry builds can keep the same product model on Windows, Linux, and macOS.

## Commands

```bash
npm install
npm test
npm run check
npm run build
```

Perry links native binaries through the host C/C++ toolchain. Windows requires Visual Studio Build Tools with the C++ workload; Linux requires gcc or clang; macOS requires Xcode Command Line Tools.

On Windows, Perry also needs LLVM `clang.exe` on `PATH` or `PERRY_LLVM_CLANG` set:

```bash
winget install LLVM.LLVM
```

## Product Target

The target is to cover the practical surface of Xshell and Xftp in one desktop app:

- SSH terminal, multi-tab and multi-pane workflows.
- SFTP/SCP file manager with transfer queue and directory sync.
- Tunnels, port forwarding, jump hosts, proxy support, and key management.
- Session folders, search, tagging, import/export, and encrypted secrets.
- Script snippets, command broadcast, logging, session replay, and task history.
- Pluggable AI agent that can inspect context, propose commands, request approval, execute over SSH, and produce audit records.

See [docs/roadmap.md](docs/roadmap.md) for the implementation phases.

## GitHub Actions

- `CI` runs on `main` pushes and pull requests.
- `CI` runs TypeScript, tests, Perry compatibility checks, and cross-platform builds.
- `Release` runs on tags matching `v*` and uploads Windows, Linux, and macOS binaries to a GitHub Release.

Create a release by pushing a tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Current Implementation

- Perry native UI shell with session, terminal, file transfer, and AI agent panels.
- Typed domain model for SSH profiles, transfer jobs, tunnels, AI providers, policies, and secret refs.
- In-memory profile store for UI previews and tests.
- JSON profile store with versioned snapshots and validation.
- In-memory secret vault that returns `secret://` references without exposing values in metadata lists.
- Node test suite covering profile validation, persistence, snapshot import/export, and vault behavior.
