export type TunnelMode = "local" | "remote" | "dynamic";

export interface PortForwardRule {
    id: string;
    profileId: string;
    name: string;
    mode: TunnelMode;
    bindHost: string;
    bindPort: number;
    targetHost: string;
    targetPort: number;
    autoStart: boolean;
    status: "stopped" | "starting" | "running" | "failed";
    lastError?: string;
}

export const demoTunnels: PortForwardRule[] = [
    {
        id: "db-local",
        profileId: "staging-db",
        name: "Postgres local tunnel",
        mode: "local",
        bindHost: "127.0.0.1",
        bindPort: 15432,
        targetHost: "127.0.0.1",
        targetPort: 5432,
        autoStart: false,
        status: "stopped",
    },
    {
        id: "socks-dev",
        profileId: "prod-web-01",
        name: "Dynamic SOCKS tunnel",
        mode: "dynamic",
        bindHost: "127.0.0.1",
        bindPort: 1088,
        targetHost: "",
        targetPort: 0,
        autoStart: false,
        status: "stopped",
    },
];
