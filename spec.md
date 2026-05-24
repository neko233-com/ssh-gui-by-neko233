# SSH GUI by neko233 Spec

## Goal

Build a cross-platform desktop SSH operations client with TypeScript latest and Perry. The product must run on Windows, Linux, and macOS, cover the practical feature surface of Xshell and Xftp, and allow custom AI model providers to drive approval-gated SSH automation agents.

## Non-Negotiable Product Requirements

- Native desktop shell built with Perry and TypeScript.
- Windows, Linux, and macOS support as first-class targets.
- SSH terminal workflow comparable to Xshell.
- File transfer workflow comparable to Xftp.
- AI agent workflow that can connect to custom model providers and operate SSH sessions under explicit safety policy.
- Long-term implementation must be broken into testable, reviewable milestones.

## Xshell-Class Requirements

### Session Management

- Create, edit, duplicate, delete, search, tag, and group SSH profiles.
- Store profile metadata separately from secrets.
- Support import/export with a versioned schema.
- Support startup commands, reconnect policy, keepalive, connect timeout, terminal profile, proxy, and jump hosts.

### Authentication And Security

- Support password, private key, passphrase, ssh-agent, keyboard-interactive, and certificate-style key metadata.
- Verify and persist known hosts.
- Provide key manager and known-hosts manager.
- Encrypt secrets at rest through a vault abstraction.
- Never store plaintext passwords inside profile records.

### Terminal

- Support multi-tab sessions.
- Support split panes.
- Support ANSI terminal rendering, scrollback, search, copy/paste, alternate screen, resize propagation, and encoding choices.
- Support terminal themes, fonts, logging, replay metadata, snippets, broadcast commands, and local shell tabs.

### Network

- Support direct SSH, HTTP proxy, SOCKS5 proxy, jump host chains, local forwarding, remote forwarding, dynamic SOCKS forwarding, agent forwarding metadata, and X11 forwarding metadata.

## Xftp-Class Requirements

### File Browser

- Provide local and remote file panels with path navigation, sorting, filtering, hidden files, bookmarks, and properties.
- Support remote operations: mkdir, rename, delete, chmod, chown metadata, symlink metadata, and open terminal here.

### Transfers

- Support SFTP first, SCP second.
- FTP/FTPS can be added only if later product decisions still require them.
- Support queue, pause, resume where protocol permits, retry, cancel, conflict policies, checksums, bandwidth limit metadata, and transfer history.

### Sync

- Support directory compare, mirror upload, mirror download, dry run, include/exclude rules, and conflict preview.

## AI Agent Requirements

### Model Providers

- Support OpenAI-compatible HTTP providers.
- Support local HTTP providers.
- Support custom HTTP providers with configurable headers.
- Support per-provider model name, base URL, timeout, API key reference, and extra headers.

### Agent Tools

- Read terminal buffer.
- Execute commands over SSH.
- Read remote files.
- Write remote files after approval.
- Upload and download files.
- Restart services after approval.
- Collect logs and produce summaries.

### Guardrails

- Modes: suggest-only, approval-required, supervised-autopilot.
- Require approval for sudo by default.
- Require approval for remote file writes by default.
- Enforce denied command patterns.
- Enforce command runtime limits.
- Enforce maximum commands per run.
- Redact configured output patterns before sending context to models.

### Audit

- Record objective, model provider, profile id, prompt context summary, tool calls, approvals, commands, outputs, exit codes, timestamps, and final report.

## Architecture Requirements

- Keep UI, domain model, persistence, protocol runtime, and agent orchestration separated.
- Use typed interfaces between layers.
- Runtime implementations must be replaceable without rewriting the UI.
- Prefer small files with one responsibility.
- Provide verification commands for every milestone.

## Current Milestone Definition

M0 establishes a native Perry shell and typed product model.

M1 must add local persistence, schema validation, profile CRUD services, encrypted secret references, and deterministic tests.

M2 must add SSH terminal runtime contracts and an implementation path.

M3 must add SFTP runtime contracts and transfer queue service.

M4 must add advanced terminal and transfer features: panes, broadcast, snippets, tunnels, sync planner, and managers.

M5 must add AI provider execution, agent planner, approval workflow, remote tool execution, redaction, and audit log viewer.

## Definition Of Done

- `npm run check` passes.
- Relevant tests pass for the milestone.
- Perry compatibility check passes for the entrypoint.
- Native `npm run build` passes when the host has LLVM clang and platform linker installed.
- GitHub Actions runs checks on pushes and pull requests.
- GitHub Actions builds Windows, Linux, and macOS artifacts.
- GitHub Actions publishes release artifacts when a `v*` tag is pushed.
- Documentation is updated for commands, limitations, and next milestone.
