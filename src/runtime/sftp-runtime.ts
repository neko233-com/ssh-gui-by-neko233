import type { TransferJob } from "../domain/file-transfer";

export interface RemoteFileEntry {
    path: string;
    name: string;
    kind: "file" | "directory" | "symlink";
    size: number;
    modifiedAt: string;
    permissions: string;
}

export interface TransferQueue {
    enqueue(job: TransferJob): TransferJob;
    start(id: string): TransferJob | undefined;
    pause(id: string): TransferJob | undefined;
    complete(id: string): TransferJob | undefined;
    fail(id: string, error: string): TransferJob | undefined;
    cancel(id: string): TransferJob | undefined;
    list(): TransferJob[];
    get(id: string): TransferJob | undefined;
}

export interface SftpRuntime {
    listDirectory(profileId: string, path: string): RemoteFileEntry[];
    queue: TransferQueue;
}
