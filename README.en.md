# ssh-gui-by-neko233

[中文](README.md) | English

`ssh-gui-by-neko233` is a cross-platform native SSH operations client built with modern TypeScript and Perry. The long-term goal is to cover the practical workflows of Xshell and Xftp in one desktop app, with pluggable AI model providers that can drive approval-gated SSH automation.

This repository is not a finished Xshell/Xftp replacement yet. It currently provides the native desktop shell, domain model, persistence services, SSH/SFTP runtime contracts, deterministic tests, and GitHub Actions packaging pipeline needed to build the product incrementally.

## Tech Stack

- **Language**: TypeScript 6
- **Native compiler**: Perry `@perryts/perry`
- **Desktop UI**: Perry `perry/ui`
- **Testing**: Node.js built-in test runner + `tsx`
- **Persistence**: JSON snapshot profile store for now; SQLite or encrypted storage can replace it later
- **Build and release**: GitHub Actions for Windows, Linux, and macOS builds
- **Current runtime**: Fake SSH runtime, fake SFTP runtime, and in-memory transfer queue to stabilize interfaces before wiring real protocols

## Architecture

The project is split into layers so UI, protocol runtimes, persistence, and AI orchestration can evolve independently:

```text
src/
  domain/      Pure types and product model: SSH profiles, terminal, transfers, tunnels, AI policy, secret refs
  services/    Local services: profile store, secret vault, JSON persistence
  runtime/     SSH/SFTP runtime interfaces and fake implementations
  ui/          Perry native UI shell
```

### 1. Domain Layer

`src/domain/*` defines stable product data models:

- `connection.ts`: SSH profile, auth methods, proxy, jump hosts, terminal preferences
- `file-transfer.ts`: SFTP/SCP transfer jobs, file panels, sync plans
- `terminal.ts`: terminal sessions, buffer lines, command execution records
- `agent.ts`: AI providers, agent policy, tool calls, audit runs
- `vault.ts`: `secret://` references and vault interfaces

These types do not depend on Perry UI or a specific SSH library, so the runtime implementation can be replaced without rewriting the UI or agent layer.

### 2. Services Layer

`src/services/*` handles local application state:

- `InMemoryProfileStore`: preview and deterministic tests
- `JsonProfileStore`: versioned profile snapshots stored on disk
- `validateProfile()` / `validateSnapshot()`: rejects invalid ports, empty required fields, plaintext password references, and bad proxy config
- `InMemorySecretVault`: returns `secret://` refs and does not expose secret values in metadata lists

The design keeps profile metadata separate from secret values. Profiles store secret references, not plaintext credentials.

### 3. Runtime Layer

`src/runtime/*` is the boundary for real SSH/SFTP protocol implementations:

- `SshRuntime`: connect, disconnect, resize, execute, readBuffer
- `SftpRuntime`: listDirectory and transfer queue access
- `FakeSshRuntime`: simulates connections, command execution, and terminal buffers for UI/agent integration
- `InMemoryTransferQueue`: covers queued, running, paused, completed, failed, canceled, and retry transitions

The fake runtime is intentional. It lets UI and agent-facing APIs stabilize before a real SSH implementation is plugged in.

### 4. UI Layer

`src/ui/app-shell.ts` builds the native shell using Perry `perry/ui`. It currently includes:

- Session list and profile editing preview
- SSH connect preview
- Terminal workspace preview
- SFTP panel preview
- Transfer queue preview
- AI Operations Agent panel

The UI is wired to fake SSH/SFTP runtimes, so controls trigger runtime state transitions instead of being static mockups.

## Current Status

Implemented:

- Perry native desktop entrypoint
- TypeScript/Perry project configuration
- SSH/XFTP/AI Agent domain model
- Profile validation
- JSON profile store
- Secret vault interface and in-memory implementation
- SSH runtime interface and fake runtime
- SFTP runtime interface and transfer queue
- Agent policy evaluator, context redactor, and in-memory audit log
- Perry UI preview shell
- Node test suite with 22 tests
- GitHub Actions CI and release workflows
- Verified Windows native Perry build locally

Current Linux packaging note:

- CI still runs `npm run check` on Linux.
- Linux native GUI binary packaging is temporarily disabled because `@perryts/perry-linux-x64@0.5.1025` ships `libperry_stdlib.a` with an undefined reference to `aws_lc_0_41_0_poly_Rq_mul`.
- Windows and macOS native GUI binaries are still built and packaged.
- Re-enable Linux native binary packaging when Perry publishes a fixed Linux package.

Not implemented yet:

- Real SSH protocol connection
- Real PTY/ANSI terminal rendering
- Real SFTP/SCP file transfer
- Encrypted vault
- Known-hosts manager
- AI provider HTTP calls
- Approval-gated remote tool execution
- Complete Xshell/Xftp feature parity

## Local Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run the full local check:

```bash
npm run check
```

Build the native binary for the current platform:

```bash
npm run build
```

Build outputs go to `dist/`, for example on Windows:

```text
dist/ssh-gui-by-neko233-win32-x64.exe
```

## Perry Build Requirements

Perry compiles and links TypeScript into a native executable, so the host C/C++ toolchain is required.

Windows:

- Visual Studio Build Tools with the C++ workload
- LLVM clang

```bash
winget install LLVM.LLVM
```

If the current shell has not picked up the new PATH yet:

```powershell
$env:PERRY_LLVM_CLANG='C:\Program Files\LLVM\bin\clang.exe'
npm run build
```

Linux:

```bash
sudo apt-get update
sudo apt-get install -y \
  clang \
  llvm \
  build-essential \
  pkg-config \
  libgtk-4-dev \
  libshumate-dev \
  libgstreamer1.0-dev \
  libgstreamer-plugins-base1.0-dev \
  libwebkitgtk-6.0-dev \
  libpulse-dev
```

macOS:

```bash
xcode-select --install
```

## GitHub Actions Packaging And Releases

This repo includes two workflows:

- `.github/workflows/ci.yml`
  - Runs on main pushes and pull requests
  - Runs TypeScript checks, tests, and Perry compatibility checks
  - Builds Windows, Linux, and macOS binaries
  - Packages artifacts as zip or tar.gz

- `.github/workflows/release.yml`
  - Runs on `v*` tags
  - Builds and packages all three platforms
  - Creates a GitHub Release
  - Uploads release assets

Create a release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Release package names:

```text
ssh-gui-by-neko233-windows-x64.zip
ssh-gui-by-neko233-linux-x64.tar.gz
ssh-gui-by-neko233-macos-arm64.tar.gz
```

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) and [spec.md](spec.md).

Near-term priorities:

1. Plug in a real SSH runtime for connect/exec/terminal buffer.
2. Add terminal rendering with ANSI, scrollback, and resize support.
3. Implement real SFTP list/upload/download.
4. Add encrypted vault and known-hosts trust workflow.
5. Add OpenAI-compatible/local/custom HTTP AI providers.
6. Implement agent approval workflow and audit logs.
