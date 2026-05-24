import type { SshProfile } from "../domain/connection";
import type { CommandExecution, TerminalBufferLine, TerminalSession, TerminalSize } from "../domain/terminal";

export interface ConnectOptions {
    profile: SshProfile;
}

export interface ExecuteCommandOptions {
    profileId: string;
    command: string;
    timeoutSeconds: number;
}

export interface SshRuntime {
    connect(options: ConnectOptions): TerminalSession;
    disconnect(profileId: string): boolean;
    resize(sessionId: string, size: TerminalSize): boolean;
    execute(options: ExecuteCommandOptions): CommandExecution;
    readBuffer(sessionId: string, maxLines: number): TerminalBufferLine[];
    getSession(sessionId: string): TerminalSession | undefined;
}
