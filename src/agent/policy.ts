import type { AgentPolicy, AgentToolCall } from "../domain/agent";

export type PolicyDecisionKind = "allow" | "require-approval" | "deny";

export interface PolicyDecision {
    kind: PolicyDecisionKind;
    reasons: string[];
}

export function evaluateToolCall(policy: AgentPolicy, toolCall: AgentToolCall, commandCountInRun: number): PolicyDecision {
    const reasons: string[] = [];

    if (commandCountInRun >= policy.maxCommandsPerRun) {
        return { kind: "deny", reasons: [`Command limit ${policy.maxCommandsPerRun} reached.`] };
    }

    const command = toolCall.input.command ?? "";
    for (const pattern of policy.deniedCommandPatterns) {
        if (matchesPattern(command, pattern)) {
            return { kind: "deny", reasons: [`Command matches denied pattern: ${pattern}`] };
        }
    }

    if (policy.mode === "suggest-only") {
        return { kind: "require-approval", reasons: ["Policy is suggest-only; execution is not automatic."] };
    }

    if (policy.requireApprovalForSudo && requiresSudoApproval(command)) {
        reasons.push("Command uses sudo or escalates privileges.");
    }

    if (policy.requireApprovalForFileWrites && writesRemoteFiles(toolCall)) {
        reasons.push("Tool may write remote files.");
    }

    if (toolCall.tool === "service.restart") {
        reasons.push("Service restart requires operator approval.");
    }

    if (policy.mode === "approval-required") {
        reasons.push("Policy requires approval before execution.");
    }

    if (reasons.length > 0) {
        return { kind: "require-approval", reasons };
    }

    return { kind: "allow", reasons: [] };
}

function requiresSudoApproval(command: string): boolean {
    return /\bsudo\b|\bsu\s+-|\bdoas\b/.test(command);
}

function writesRemoteFiles(toolCall: AgentToolCall): boolean {
    if (toolCall.tool === "remote-file.write" || toolCall.tool === "sftp.upload") {
        return true;
    }

    const command = toolCall.input.command ?? "";
    return />|>>|\btee\b|\bmv\b|\bcp\b|\brm\b|\bchmod\b|\bchown\b/.test(command);
}

function matchesPattern(value: string, pattern: string): boolean {
    if (pattern.length === 0) {
        return false;
    }

    try {
        return new RegExp(pattern).test(value);
    } catch {
        return value.includes(pattern);
    }
}
