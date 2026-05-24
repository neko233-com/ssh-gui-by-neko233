import type { SshProfile } from "../domain/connection";
import type { CommandExecution, TerminalBufferLine, TerminalSession, TerminalSize } from "../domain/terminal";
import type { ConnectOptions, ExecuteCommandOptions, SshRuntime } from "./ssh-runtime";

export class FakeSshRuntime implements SshRuntime {
    private sessions = new Map<string, TerminalSession>();
    private profileToSession = new Map<string, string>();
    private nextSession = 1;
    private nextCommand = 1;
    private nextLine = 1;

    connect(options: ConnectOptions): TerminalSession {
        const session: TerminalSession = {
            id: `terminal-${this.nextSession++}`,
            profileId: options.profile.id,
            title: options.profile.name,
            size: { cols: 120, rows: 32 },
            status: "open",
            buffer: [],
        };
        this.append(session, "system", `Connected to ${formatProfileTarget(options.profile)}`);
        this.sessions.set(session.id, cloneSession(session));
        this.profileToSession.set(options.profile.id, session.id);
        return cloneSession(session);
    }

    disconnect(profileId: string): boolean {
        const sessionId = this.profileToSession.get(profileId);
        if (sessionId === undefined) {
            return false;
        }

        const session = this.sessions.get(sessionId);
        if (session === undefined) {
            return false;
        }

        session.status = "closed";
        this.append(session, "system", "Disconnected");
        this.sessions.set(session.id, cloneSession(session));
        this.profileToSession.delete(profileId);
        return true;
    }

    resize(sessionId: string, size: TerminalSize): boolean {
        const session = this.sessions.get(sessionId);
        if (session === undefined || session.status !== "open") {
            return false;
        }

        session.size = { ...size };
        this.append(session, "system", `Resized terminal to ${size.cols}x${size.rows}`);
        this.sessions.set(session.id, cloneSession(session));
        return true;
    }

    execute(options: ExecuteCommandOptions): CommandExecution {
        const startedAt = new Date().toISOString();
        const session = this.sessionForProfile(options.profileId);
        const execution: CommandExecution = {
            id: `command-${this.nextCommand++}`,
            profileId: options.profileId,
            command: options.command,
            status: "running",
            startedAt,
            stdout: "",
            stderr: "",
        };

        if (session === undefined || session.status !== "open") {
            return {
                ...execution,
                status: "failed",
                finishedAt: new Date().toISOString(),
                exitCode: 255,
                stderr: "No open SSH session for profile.",
            };
        }

        this.append(session, "stdout", `$ ${options.command}`);

        if (options.timeoutSeconds <= 0) {
            execution.status = "timed-out";
            execution.exitCode = 124;
            execution.stderr = "Command timed out before execution.";
            this.append(session, "stderr", execution.stderr);
        } else if (options.command.includes("fail")) {
            execution.status = "failed";
            execution.exitCode = 1;
            execution.stderr = `Simulated failure for: ${options.command}`;
            this.append(session, "stderr", execution.stderr);
        } else {
            execution.status = "succeeded";
            execution.exitCode = 0;
            execution.stdout = `Simulated output for: ${options.command}`;
            this.append(session, "stdout", execution.stdout);
        }

        execution.finishedAt = new Date().toISOString();
        this.sessions.set(session.id, cloneSession(session));
        return { ...execution };
    }

    readBuffer(sessionId: string, maxLines: number): TerminalBufferLine[] {
        const session = this.sessions.get(sessionId);
        if (session === undefined) {
            return [];
        }
        return session.buffer.slice(Math.max(0, session.buffer.length - maxLines)).map((line) => ({ ...line }));
    }

    getSession(sessionId: string): TerminalSession | undefined {
        const session = this.sessions.get(sessionId);
        return session === undefined ? undefined : cloneSession(session);
    }

    private sessionForProfile(profileId: string): TerminalSession | undefined {
        const sessionId = this.profileToSession.get(profileId);
        return sessionId === undefined ? undefined : this.sessions.get(sessionId);
    }

    private append(session: TerminalSession, stream: TerminalBufferLine["stream"], text: string): void {
        session.buffer.push({
            sequence: this.nextLine++,
            stream,
            text,
            timestamp: new Date().toISOString(),
        });
    }
}

function formatProfileTarget(profile: SshProfile): string {
    return `${profile.username}@${profile.host}:${profile.port}`;
}

function cloneSession(session: TerminalSession): TerminalSession {
    return JSON.parse(JSON.stringify(session)) as TerminalSession;
}
