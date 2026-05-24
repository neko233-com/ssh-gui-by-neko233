export interface TerminalSize {
    cols: number;
    rows: number;
}

export interface TerminalBufferLine {
    sequence: number;
    stream: "stdout" | "stderr" | "system";
    text: string;
    timestamp: string;
}

export interface TerminalSession {
    id: string;
    profileId: string;
    title: string;
    size: TerminalSize;
    status: "opening" | "open" | "closed" | "failed";
    buffer: TerminalBufferLine[];
}

export interface CommandExecution {
    id: string;
    profileId: string;
    command: string;
    status: "queued" | "running" | "succeeded" | "failed" | "canceled" | "timed-out";
    startedAt: string;
    finishedAt?: string;
    exitCode?: number;
    stdout: string;
    stderr: string;
}
