import type { TransferJob } from "../domain/file-transfer";
import type { TransferQueue } from "./sftp-runtime";

export class InMemoryTransferQueue implements TransferQueue {
    private jobs = new Map<string, TransferJob>();

    enqueue(job: TransferJob): TransferJob {
        const queued = { ...cloneJob(job), status: "queued" as const, bytesDone: 0 };
        this.jobs.set(queued.id, queued);
        return cloneJob(queued);
    }

    start(id: string): TransferJob | undefined {
        return this.update(id, (job) => {
            if (job.status === "queued" || job.status === "paused" || job.status === "failed") {
                job.status = "running";
                job.error = undefined;
            }
        });
    }

    pause(id: string): TransferJob | undefined {
        return this.update(id, (job) => {
            if (job.status === "running") {
                job.status = "paused";
            }
        });
    }

    complete(id: string): TransferJob | undefined {
        return this.update(id, (job) => {
            if (job.status === "running" || job.status === "paused" || job.status === "queued") {
                job.status = "completed";
                job.bytesDone = job.bytesTotal;
                job.error = undefined;
            }
        });
    }

    fail(id: string, error: string): TransferJob | undefined {
        return this.update(id, (job) => {
            if (job.status !== "completed" && job.status !== "canceled") {
                job.status = "failed";
                job.error = error;
            }
        });
    }

    cancel(id: string): TransferJob | undefined {
        return this.update(id, (job) => {
            if (job.status !== "completed") {
                job.status = "canceled";
            }
        });
    }

    list(): TransferJob[] {
        return Array.from(this.jobs.values()).map(cloneJob);
    }

    get(id: string): TransferJob | undefined {
        const job = this.jobs.get(id);
        return job === undefined ? undefined : cloneJob(job);
    }

    private update(id: string, mutate: (job: TransferJob) => void): TransferJob | undefined {
        const job = this.jobs.get(id);
        if (job === undefined) {
            return undefined;
        }

        const next = cloneJob(job);
        mutate(next);
        this.jobs.set(id, next);
        return cloneJob(next);
    }
}

function cloneJob(job: TransferJob): TransferJob {
    return JSON.parse(JSON.stringify(job)) as TransferJob;
}
