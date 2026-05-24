# Roadmap

## Architecture

The app is split into four layers:

1. Native shell: Perry `perry/ui` desktop windows, menus, dialogs, clipboard, tray, and keyboard shortcuts.
2. Domain model: typed profiles, transfer jobs, tunnels, terminal sessions, AI providers, and agent policies.
3. Runtime services: SSH, SFTP, local key storage, known-hosts handling, proxy/jump host routing, and audit logging.
4. Agent orchestration: tool calling, approval gates, command execution, output parsing, and rollback/task reports.

The first commit establishes layers 1 and 2. Runtime services should be added behind interfaces so the UI does not depend on a specific SSH implementation.

## Xshell Coverage

- Session manager: folders, tags, search, colors, notes, import/export, duplicate profiles.
- Authentication: password, private key, passphrase, ssh-agent, keyboard-interactive, certificate keys.
- Terminal: tabs, split panes, scrollback, search, copy modes, ANSI colors, font profiles, encoding, bell.
- Shell quality: reconnect, keepalive, resize propagation, command snippets, quick commands, session logging.
- Multi-session operations: command broadcast, group launch, startup commands, local shell tabs.
- Network: SOCKS/HTTP proxy, jump hosts, local/remote/dynamic tunnels, X11 forwarding, agent forwarding.
- Security: host key verification, key manager, encrypted vault, per-profile secret references.

## Xftp Coverage

- File panels: local/remote browser, path bar, bookmarks, hidden files, sorting, filters, previews.
- Transfers: upload, download, queue, pause, resume, retry, checksum, conflict policy, bandwidth limit.
- Remote operations: rename, chmod, chown, mkdir, delete, symlink, properties, open terminal here.
- Sync: directory compare, mirror upload/download, dry run, include/exclude rules.
- Protocols: SFTP first, SCP second, FTP/FTPS only if product requirements still justify it.

## AI Agent Coverage

- Model adapters: OpenAI-compatible HTTP, local HTTP, and custom endpoint with headers.
- Agent tools: read terminal buffer, run command, edit remote file, transfer file, manage service, collect logs.
- Guardrails: approval before command execution, denylist, max runtime, output redaction, command diff preview.
- Audit: prompt, chosen plan, commands, outputs, exit code, timestamps, profile id, and operator approvals.
- Modes: suggest-only, approve-and-run, supervised autopilot for scoped maintenance windows.

## Milestones

### M0 - Native Shell

- Perry app shell with navigation, status text, session form, file panel placeholder, and agent panel placeholder.
- Typed domain contracts for sessions, transfers, tunnels, model providers, and agent policies.
- Build and type-check scripts.

### M1 - Local Persistence

- JSON or SQLite-backed profile store.
- Encrypted secret references, not raw passwords in profile records.
- Import/export format with versioning.

Current M1 status:

- JSON profile store exists with versioned snapshots.
- In-memory store exists for UI previews and deterministic tests.
- Secret vault interface and in-memory implementation exist.
- Profile validation rejects invalid ports, empty required fields, invalid proxy config, and plaintext password references.

### M2 - SSH Terminal Runtime

- SSH connection service.
- PTY allocation, terminal resize, ANSI rendering bridge, reconnect, keepalive.
- Session logging and host key trust workflow.

### M3 - SFTP Runtime

- Remote directory listing, upload/download, queued transfers, cancel/retry.
- Conflict policy, chmod, mkdir, rename, delete.
- Directory sync planner.

### M4 - Advanced Xshell/Xftp Features

- Split panes, command broadcast, snippets, tunnels, jump hosts, proxy chains.
- Session groups, startup commands, key manager, known-hosts manager.

### M5 - AI Operations Agent

- Provider configuration UI.
- Approval-gated command tools.
- Audit log viewer.
- Scoped automated runbooks.
