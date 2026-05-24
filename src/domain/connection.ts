import type { SecretRef } from "./vault";

export type OperatingSystem = "windows" | "linux" | "macos" | "unknown";

export type AuthMethod =
    | { kind: "password"; secretRef: SecretRef }
    | { kind: "privateKey"; keyPath: string; passphraseRef?: SecretRef }
    | { kind: "agent" }
    | { kind: "keyboardInteractive" };

export interface ProxyProfile {
    kind: "none" | "socks5" | "http";
    host?: string;
    port?: number;
    username?: string;
    secretRef?: SecretRef;
}

export interface JumpHostProfile {
    profileId: string;
    mode: "direct-tcpip" | "proxy-command";
}

export interface TerminalProfile {
    fontFamily: string;
    fontSize: number;
    encoding: "utf-8" | "gbk" | "big5" | "shift-jis";
    scrollbackLines: number;
    colorScheme: "dark" | "light" | "system" | string;
    startupCommands: string[];
}

export interface SshProfile {
    id: string;
    name: string;
    folder: string;
    tags: string[];
    host: string;
    port: number;
    username: string;
    auth: AuthMethod;
    proxy: ProxyProfile;
    jumpHosts: JumpHostProfile[];
    terminal: TerminalProfile;
    keepAliveSeconds: number;
    connectTimeoutSeconds: number;
    notes: string;
}

export interface SessionRuntimeState {
    profileId: string;
    os: OperatingSystem;
    status: "idle" | "connecting" | "connected" | "reconnecting" | "failed" | "closed";
    activeTerminalId?: string;
    activeTransferQueueId?: string;
    lastError?: string;
}

export const defaultTerminalProfile: TerminalProfile = {
    fontFamily: "JetBrains Mono",
    fontSize: 13,
    encoding: "utf-8",
    scrollbackLines: 10000,
    colorScheme: "dark",
    startupCommands: [],
};

export const demoProfiles: SshProfile[] = [
    {
        id: "prod-web-01",
        name: "prod-web-01",
        folder: "Production/Web",
        tags: ["prod", "nginx"],
        host: "10.0.12.21",
        port: 22,
        username: "deploy",
        auth: { kind: "privateKey", keyPath: "~/.ssh/id_ed25519" },
        proxy: { kind: "none" },
        jumpHosts: [],
        terminal: defaultTerminalProfile,
        keepAliveSeconds: 30,
        connectTimeoutSeconds: 15,
        notes: "Demo profile used by the initial shell.",
    },
    {
        id: "staging-db",
        name: "staging-db",
        folder: "Staging/Database",
        tags: ["staging", "postgres"],
        host: "10.1.8.40",
        port: 22,
        username: "ops",
        auth: { kind: "agent" },
        proxy: { kind: "socks5", host: "127.0.0.1", port: 1080 },
        jumpHosts: [{ profileId: "prod-web-01", mode: "direct-tcpip" }],
        terminal: { ...defaultTerminalProfile, startupCommands: ["tmux attach || tmux"] },
        keepAliveSeconds: 20,
        connectTimeoutSeconds: 20,
        notes: "Demo jump-host profile.",
    },
];
