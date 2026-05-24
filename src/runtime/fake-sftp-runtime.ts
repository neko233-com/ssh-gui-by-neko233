import type { RemoteFileEntry, SftpRuntime } from "./sftp-runtime";
import { InMemoryTransferQueue } from "./in-memory-transfer-queue";

export class FakeSftpRuntime implements SftpRuntime {
    readonly queue = new InMemoryTransferQueue();
    private readonly directories = new Map<string, RemoteFileEntry[]>();

    constructor() {
        this.directories.set("prod-web-01:/var/www", [
            makeEntry("/var/www/releases", "releases", "directory", 0),
            makeEntry("/var/www/shared", "shared", "directory", 0),
            makeEntry("/var/www/nginx.conf", "nginx.conf", "file", 18432),
        ]);
    }

    listDirectory(profileId: string, path: string): RemoteFileEntry[] {
        return (this.directories.get(`${profileId}:${path}`) ?? []).map((entry) => ({ ...entry }));
    }
}

function makeEntry(path: string, name: string, kind: RemoteFileEntry["kind"], size: number): RemoteFileEntry {
    return {
        path,
        name,
        kind,
        size,
        modifiedAt: new Date(0).toISOString(),
        permissions: kind === "directory" ? "drwxr-xr-x" : "-rw-r--r--",
    };
}
