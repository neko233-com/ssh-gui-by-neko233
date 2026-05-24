import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoProfiles } from "../src/domain/connection.ts";
import { FakeSftpRuntime } from "../src/runtime/fake-sftp-runtime.ts";
import { FakeSshRuntime } from "../src/runtime/fake-ssh-runtime.ts";
import { InMemoryTransferQueue } from "../src/runtime/in-memory-transfer-queue.ts";

function makeTransferJob(overrides = {}) {
    return {
        id: "job-1",
        protocol: "sftp",
        direction: "download",
        source: { profileId: "prod-web-01", path: "/var/log/app.log" },
        target: "./logs/app.log",
        bytesTotal: 100,
        bytesDone: 25,
        status: "queued",
        conflictPolicy: "overwrite",
        ...overrides,
    };
}

describe("FakeSshRuntime", () => {
    it("connects, resizes, executes commands, and exposes terminal buffer", () => {
        const runtime = new FakeSshRuntime();
        const session = runtime.connect({ profile: demoProfiles[0] });

        assert.equal(session.status, "open");
        assert.equal(runtime.resize(session.id, { cols: 100, rows: 40 }), true);

        const execution = runtime.execute({ profileId: demoProfiles[0].id, command: "uptime", timeoutSeconds: 30 });
        assert.equal(execution.status, "succeeded");
        assert.equal(execution.exitCode, 0);
        assert.match(execution.stdout, /uptime/);

        const buffer = runtime.readBuffer(session.id, 10);
        assert.equal(buffer.some((line) => line.text.includes("Connected")), true);
        assert.equal(buffer.some((line) => line.text.includes("uptime")), true);
    });

    it("fails commands when no session is open", () => {
        const runtime = new FakeSshRuntime();
        const execution = runtime.execute({ profileId: "missing", command: "uptime", timeoutSeconds: 30 });

        assert.equal(execution.status, "failed");
        assert.equal(execution.exitCode, 255);
    });

    it("closes sessions by profile id", () => {
        const runtime = new FakeSshRuntime();
        const session = runtime.connect({ profile: demoProfiles[0] });

        assert.equal(runtime.disconnect(demoProfiles[0].id), true);
        assert.equal(runtime.getSession(session.id)?.status, "closed");
        assert.equal(runtime.disconnect(demoProfiles[0].id), false);
    });
});

describe("InMemoryTransferQueue", () => {
    it("runs queue lifecycle from enqueue to complete", () => {
        const queue = new InMemoryTransferQueue();

        assert.equal(queue.enqueue(makeTransferJob()).status, "queued");
        assert.equal(queue.start("job-1")?.status, "running");
        assert.equal(queue.pause("job-1")?.status, "paused");
        assert.equal(queue.start("job-1")?.status, "running");
        const completed = queue.complete("job-1");
        assert.equal(completed?.status, "completed");
        assert.equal(completed?.bytesDone, 100);
    });

    it("records transfer failures and supports retry", () => {
        const queue = new InMemoryTransferQueue();
        queue.enqueue(makeTransferJob());

        const failed = queue.fail("job-1", "network reset");
        assert.equal(failed?.status, "failed");
        assert.equal(failed?.error, "network reset");

        const retried = queue.start("job-1");
        assert.equal(retried?.status, "running");
        assert.equal(retried?.error, undefined);
    });

    it("does not cancel completed jobs", () => {
        const queue = new InMemoryTransferQueue();
        queue.enqueue(makeTransferJob());
        queue.complete("job-1");

        assert.equal(queue.cancel("job-1")?.status, "completed");
    });
});

describe("FakeSftpRuntime", () => {
    it("lists deterministic remote directory entries", () => {
        const runtime = new FakeSftpRuntime();
        const entries = runtime.listDirectory("prod-web-01", "/var/www");

        assert.equal(entries.length, 3);
        assert.equal(entries[0].name, "releases");
        assert.equal(entries[0].kind, "directory");
    });
});
