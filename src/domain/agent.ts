export type AiProviderKind = "openai-compatible" | "local-http" | "custom-http";

export interface AiModelProvider {
    id: string;
    name: string;
    kind: AiProviderKind;
    baseUrl: string;
    model: string;
    apiKeyRef?: string;
    headers: Record<string, string>;
    timeoutSeconds: number;
}

export interface AgentPolicy {
    mode: "suggest-only" | "approval-required" | "supervised-autopilot";
    maxCommandRuntimeSeconds: number;
    maxCommandsPerRun: number;
    requireApprovalForSudo: boolean;
    requireApprovalForFileWrites: boolean;
    deniedCommandPatterns: string[];
    redactPatterns: string[];
}

export interface AgentToolCall {
    id: string;
    tool:
        | "terminal.read"
        | "ssh.exec"
        | "remote-file.read"
        | "remote-file.write"
        | "sftp.upload"
        | "sftp.download"
        | "service.restart"
        | "log.collect";
    profileId: string;
    input: Record<string, string>;
    status: "planned" | "awaiting-approval" | "running" | "succeeded" | "failed" | "denied";
    exitCode?: number;
    outputPreview?: string;
}

export interface AgentRun {
    id: string;
    providerId: string;
    profileId: string;
    objective: string;
    policy: AgentPolicy;
    toolCalls: AgentToolCall[];
    auditStatus: "draft" | "recorded" | "exported";
}

export const defaultAgentPolicy: AgentPolicy = {
    mode: "approval-required",
    maxCommandRuntimeSeconds: 60,
    maxCommandsPerRun: 8,
    requireApprovalForSudo: true,
    requireApprovalForFileWrites: true,
    deniedCommandPatterns: ["rm -rf /", "mkfs", "dd if=", ":(){ :|:& };:"],
    redactPatterns: ["password=.*", "token=.*", "Authorization: .*"],
};

export const demoProviders: AiModelProvider[] = [
    {
        id: "openai-compatible",
        name: "OpenAI-compatible endpoint",
        kind: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5",
        apiKeyRef: "secret://providers/openai-compatible/api-key",
        headers: {},
        timeoutSeconds: 120,
    },
    {
        id: "local-model",
        name: "Local HTTP model",
        kind: "local-http",
        baseUrl: "http://127.0.0.1:11434/v1",
        model: "local-ops-agent",
        headers: {},
        timeoutSeconds: 180,
    },
];
