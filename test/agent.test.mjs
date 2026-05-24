import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryAgentAuditLog } from "../src/agent/audit-log.ts";
import { evaluateToolCall } from "../src/agent/policy.ts";
import { redactForModel } from "../src/agent/redactor.ts";
import { defaultAgentPolicy } from "../src/domain/agent.ts";

function makeToolCall(overrides = {}) {
    return {
        id: "tool-1",
        tool: "ssh.exec",
        profileId: "prod-web-01",
        input: { command: "uptime" },
        status: "planned",
        ...overrides,
    };
}

function makeRun(overrides = {}) {
    return {
        id: "run-1",
        providerId: "local-model",
        profileId: "prod-web-01",
        objective: "Check service health",
        policy: defaultAgentPolicy,
        toolCalls: [],
        auditStatus: "draft",
        ...overrides,
    };
}

describe("evaluateToolCall", () => {
    it("requires approval when the policy is approval-required", () => {
        const decision = evaluateToolCall(defaultAgentPolicy, makeToolCall(), 0);

        assert.equal(decision.kind, "require-approval");
        assert.equal(decision.reasons.some((reason) => reason.includes("requires approval")), true);
    });

    it("denies commands matching deny patterns", () => {
        const decision = evaluateToolCall(defaultAgentPolicy, makeToolCall({ input: { command: "rm -rf /" } }), 0);

        assert.equal(decision.kind, "deny");
        assert.match(decision.reasons[0], /denied pattern/);
    });

    it("denies runs that exceed the command limit", () => {
        const decision = evaluateToolCall(defaultAgentPolicy, makeToolCall(), defaultAgentPolicy.maxCommandsPerRun);

        assert.equal(decision.kind, "deny");
        assert.match(decision.reasons[0], /Command limit/);
    });

    it("allows safe commands in supervised autopilot mode", () => {
        const policy = { ...defaultAgentPolicy, mode: "supervised-autopilot" };
        const decision = evaluateToolCall(policy, makeToolCall({ input: { command: "df -h" } }), 0);

        assert.equal(decision.kind, "allow");
    });

    it("requires approval for sudo in supervised autopilot mode", () => {
        const policy = { ...defaultAgentPolicy, mode: "supervised-autopilot" };
        const decision = evaluateToolCall(policy, makeToolCall({ input: { command: "sudo systemctl restart nginx" } }), 0);

        assert.equal(decision.kind, "require-approval");
        assert.equal(decision.reasons.some((reason) => reason.includes("privileges")), true);
    });
});

describe("redactForModel", () => {
    it("redacts configured sensitive patterns", () => {
        const result = redactForModel("password=hunter2 token=abc Authorization: Bearer xyz", defaultAgentPolicy);

        assert.equal(result.text.includes("hunter2"), false);
        assert.equal(result.text.includes("abc"), false);
        assert.equal(result.text.includes("Bearer xyz"), false);
        assert.equal(result.redactions.length, 3);
    });
});

describe("InMemoryAgentAuditLog", () => {
    it("records run and tool events without exposing mutable internals", () => {
        const audit = new InMemoryAgentAuditLog();
        const run = makeRun();
        const toolCall = makeToolCall();

        audit.recordRunCreated(run);
        const record = audit.recordTool(run.id, "tool-planned", toolCall, "Planned uptime check.");
        record.summary = "mutated";

        const records = audit.list(run.id);
        assert.equal(records.length, 2);
        assert.equal(records[1].summary, "Planned uptime check.");
        assert.equal(records[1].toolCall?.input.command, "uptime");
    });
});
