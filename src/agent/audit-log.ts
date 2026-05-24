import type { AgentRun, AgentToolCall } from "../domain/agent";

export interface AgentAuditRecord {
    id: string;
    runId: string;
    timestamp: string;
    event: "run-created" | "tool-planned" | "tool-approved" | "tool-denied" | "tool-completed" | "run-recorded";
    summary: string;
    toolCall?: AgentToolCall;
}

export class InMemoryAgentAuditLog {
    private readonly records: AgentAuditRecord[] = [];
    private nextId = 1;

    recordRunCreated(run: AgentRun): AgentAuditRecord {
        return this.append(run.id, "run-created", `Run created for profile ${run.profileId}.`);
    }

    recordTool(runId: string, event: AgentAuditRecord["event"], toolCall: AgentToolCall, summary: string): AgentAuditRecord {
        return this.append(runId, event, summary, toolCall);
    }

    recordRunRecorded(run: AgentRun): AgentAuditRecord {
        return this.append(run.id, "run-recorded", `Run audit status is ${run.auditStatus}.`);
    }

    list(runId?: string): AgentAuditRecord[] {
        return this.records
            .filter((record) => runId === undefined || record.runId === runId)
            .map((record) => cloneRecord(record));
    }

    private append(
        runId: string,
        event: AgentAuditRecord["event"],
        summary: string,
        toolCall?: AgentToolCall,
    ): AgentAuditRecord {
        const record: AgentAuditRecord = {
            id: `audit-${this.nextId++}`,
            runId,
            timestamp: new Date().toISOString(),
            event,
            summary,
            toolCall: toolCall === undefined ? undefined : cloneToolCall(toolCall),
        };
        this.records.push(record);
        return cloneRecord(record);
    }
}

function cloneRecord(record: AgentAuditRecord): AgentAuditRecord {
    return JSON.parse(JSON.stringify(record)) as AgentAuditRecord;
}

function cloneToolCall(toolCall: AgentToolCall): AgentToolCall {
    return JSON.parse(JSON.stringify(toolCall)) as AgentToolCall;
}
