# ssh-gui-by-neko233

中文 | [English](README.en.md)

`ssh-gui-by-neko233` 是一个使用 TypeScript 最新版和 Perry 构建的跨平台原生 SSH 运维客户端。目标是做成一个同时覆盖 Xshell 和 Xftp 主要工作流的桌面工具，并提供可接入自定义 AI 模型的 Agent，让 AI 在受控审批策略下执行 SSH 自动化运维。

当前仓库还不是完整可替代 Xshell/Xftp 的成品，而是已经搭好的原生桌面应用骨架、领域模型、持久化服务、SSH/SFTP runtime 接口、测试体系和 GitHub Actions 自动打包发布流程。

## 技术栈

- **语言**：TypeScript 6
- **原生编译**：Perry `@perryts/perry`
- **桌面 UI**：Perry `perry/ui`
- **测试**：Node.js built-in test runner + `tsx`
- **持久化**：JSON snapshot profile store，目前为本地文件实现，后续可替换为 SQLite 或加密存储
- **构建发布**：GitHub Actions，Windows/Linux/macOS 三平台构建和 release 打包
- **当前 runtime**：Fake SSH runtime、Fake SFTP runtime、内存 transfer queue，用于先稳定接口和 UI/Agent 调用面

## 核心架构

项目按层拆分，避免 UI、协议实现、AI Agent 互相耦合：

```text
src/
  domain/      纯类型和领域模型：SSH profile、terminal、transfer、tunnel、AI policy、secret ref
  services/    本地服务：profile store、secret vault、JSON persistence
  runtime/     SSH/SFTP runtime 接口和 fake 实现
  ui/          Perry 原生 UI shell
```

### 1. Domain 层

`src/domain/*` 定义产品能力的数据模型，例如：

- `connection.ts`：SSH profile、认证方式、代理、跳板机、终端配置
- `file-transfer.ts`：SFTP/SCP transfer job、file panel、sync plan
- `terminal.ts`：terminal session、buffer line、command execution
- `agent.ts`：AI provider、agent policy、tool call、audit run
- `vault.ts`：`secret://` 引用和 vault 接口

这些类型不依赖 Perry UI，也不依赖真实 SSH 库，因此后续换协议实现不会影响 UI 和 Agent 的基本结构。

### 2. Services 层

`src/services/*` 负责本地状态：

- `InMemoryProfileStore`：用于 UI preview 和测试
- `JsonProfileStore`：把 profile 以 versioned snapshot 写入 JSON 文件
- `validateProfile()` / `validateSnapshot()`：阻止无效端口、空字段、明文密码引用等错误数据进入 store
- `InMemorySecretVault`：返回 `secret://` 引用，列表接口不暴露 secret value

设计原则是 profile 只存 metadata 和 secret ref，不直接保存明文密码。

### 3. Runtime 层

`src/runtime/*` 是后续接真实 SSH/SFTP 协议的边界：

- `SshRuntime`：connect、disconnect、resize、execute、readBuffer
- `SftpRuntime`：listDirectory 和 transfer queue
- `FakeSshRuntime`：模拟连接、命令执行、terminal buffer，供 UI 和 Agent 流程先跑通
- `InMemoryTransferQueue`：覆盖 queued/running/paused/completed/failed/canceled/retry 状态机

现在 fake runtime 的作用是先稳定 API。后续接真实 SSH 时，只需要实现同样的接口。

### 4. UI 层

`src/ui/app-shell.ts` 使用 Perry `perry/ui` 构建原生窗口，目前包含：

- Session 列表和 profile 编辑预览
- SSH Connect preview
- Terminal workspace preview
- SFTP panel preview
- Transfer queue preview
- AI Operations Agent 面板

UI 已经接入 fake SSH/SFTP runtime，所以按钮可以触发预览状态，而不是纯静态页面。

## 当前完成度

已完成：

- Perry 原生桌面入口
- TypeScript/Perry 项目配置
- SSH/XFTP/AI Agent 领域模型
- Profile validation
- JSON profile store
- Secret vault interface 和内存实现
- SSH runtime interface 和 fake runtime
- SFTP runtime interface 和 transfer queue
- Agent policy evaluator、context redactor、in-memory audit log
- Perry UI 预览壳
- Node 测试，当前 22 个测试
- GitHub Actions CI 和 release workflow
- Windows 本地 Perry native build 验证

当前 Linux 打包说明：

- CI 仍会在 Linux 上运行 `npm run check`。
- Linux native GUI binary 暂时不构建，因为 `@perryts/perry-linux-x64@0.5.1025` 发布包里的 `libperry_stdlib.a` 引用了未定义符号 `aws_lc_0_41_0_poly_Rq_mul`。
- Windows 和 macOS native GUI binary 仍正常构建并打包。
- 等 Perry 发布修复后的 Linux 包，再恢复 Linux native binary packaging。

还未完成：

- 真实 SSH 协议连接
- 真实 PTY/ANSI terminal 渲染
- 真实 SFTP/SCP 文件传输
- 加密 vault
- known-hosts manager
- AI provider HTTP 调用
- approval-gated remote tool execution
- 完整 Xshell/Xftp 功能闭环

## 本地开发

安装依赖：

```bash
npm install
```

运行测试：

```bash
npm test
```

运行完整检查：

```bash
npm run check
```

构建当前平台 native binary：

```bash
npm run build
```

构建产物会输出到 `dist/`，例如 Windows：

```text
dist/ssh-gui-by-neko233-win32-x64.exe
```

## Perry 构建环境

Perry 会把 TypeScript 编译并链接为原生可执行文件，因此需要本机 C/C++ 工具链。

Windows：

- Visual Studio Build Tools C++ workload
- LLVM clang

```bash
winget install LLVM.LLVM
```

如果当前 shell 还没有刷新 PATH，可以临时设置：

```powershell
$env:PERRY_LLVM_CLANG='C:\Program Files\LLVM\bin\clang.exe'
npm run build
```

Linux：

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

macOS：

```bash
xcode-select --install
```

## GitHub Actions 自动打包发布

仓库包含两个 workflow：

- `.github/workflows/ci.yml`
  - main push / pull request 触发
  - 运行 TypeScript check、测试、Perry compatibility check
  - 构建 Windows/Linux/macOS 三平台产物
  - 打包为 zip 或 tar.gz 并上传 artifact

- `.github/workflows/release.yml`
  - 推送 `v*` tag 触发
  - 构建并打包三平台产物
  - 自动创建 GitHub Release
  - 上传 release assets

发布新版本：

```bash
git tag v0.1.0
git push origin v0.1.0
```

Release 包名：

```text
ssh-gui-by-neko233-windows-x64.zip
ssh-gui-by-neko233-linux-x64.tar.gz
ssh-gui-by-neko233-macos-arm64.tar.gz
```

## 实现路线

详细路线见 [docs/roadmap.md](docs/roadmap.md) 和 [spec.md](spec.md)。

短期优先级：

1. 接入真实 SSH runtime，实现 connect/exec/terminal buffer。
2. 接入 terminal 渲染组件，支持 ANSI、scrollback、resize。
3. 实现真实 SFTP list/upload/download。
4. 增加 encrypted vault 和 known-hosts trust workflow。
5. 接入 OpenAI-compatible/local/custom HTTP AI provider。
6. 实现 Agent approval workflow 和 audit log。
