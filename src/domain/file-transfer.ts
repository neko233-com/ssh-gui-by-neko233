export type TransferProtocol = "sftp" | "scp" | "ftp" | "ftps";

export type ConflictPolicy = "ask" | "overwrite" | "skip" | "rename-new" | "rename-existing";

export interface RemotePath {
    profileId: string;
    path: string;
}

export interface FilePanelState {
    side: "local" | "remote";
    currentPath: string;
    selectedPaths: string[];
    showHidden: boolean;
    filter: string;
    sortBy: "name" | "size" | "modified" | "type";
    sortDirection: "asc" | "desc";
}

export interface TransferJob {
    id: string;
    protocol: TransferProtocol;
    direction: "upload" | "download" | "remote-copy";
    source: string | RemotePath;
    target: string | RemotePath;
    bytesTotal: number;
    bytesDone: number;
    status: "queued" | "running" | "paused" | "completed" | "failed" | "canceled";
    conflictPolicy: ConflictPolicy;
    error?: string;
}

export interface SyncPlan {
    id: string;
    profileId: string;
    localRoot: string;
    remoteRoot: string;
    mode: "upload-mirror" | "download-mirror" | "two-way";
    include: string[];
    exclude: string[];
    dryRun: boolean;
}

export const defaultLocalPanel: FilePanelState = {
    side: "local",
    currentPath: "~",
    selectedPaths: [],
    showHidden: false,
    filter: "",
    sortBy: "name",
    sortDirection: "asc",
};

export const defaultRemotePanel: FilePanelState = {
    side: "remote",
    currentPath: "/var/www",
    selectedPaths: [],
    showHidden: false,
    filter: "",
    sortBy: "modified",
    sortDirection: "desc",
};

export const demoTransferQueue: TransferJob[] = [
    {
        id: "sync-config",
        protocol: "sftp",
        direction: "upload",
        source: "./deploy/nginx.conf",
        target: { profileId: "prod-web-01", path: "/etc/nginx/nginx.conf" },
        bytesTotal: 18432,
        bytesDone: 18432,
        status: "completed",
        conflictPolicy: "overwrite",
    },
    {
        id: "download-logs",
        protocol: "sftp",
        direction: "download",
        source: { profileId: "prod-web-01", path: "/var/log/nginx/access.log" },
        target: "./logs/prod-web-01/access.log",
        bytesTotal: 7340032,
        bytesDone: 2097152,
        status: "paused",
        conflictPolicy: "rename-new",
    },
];
