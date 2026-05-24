export interface FeatureGroup {
    title: string;
    items: string[];
}

export const xshellFeatureGroups: FeatureGroup[] = [
    {
        title: "Terminal",
        items: ["Tabs", "Split panes", "Scrollback", "Search", "Encoding", "Color schemes", "Session logging"],
    },
    {
        title: "Sessions",
        items: ["Folders", "Tags", "Import/export", "Startup commands", "Reconnect", "Keepalive"],
    },
    {
        title: "Network",
        items: ["Jump hosts", "Proxy chains", "Local tunnels", "Remote tunnels", "Dynamic SOCKS", "Agent forwarding"],
    },
    {
        title: "Automation",
        items: ["Snippets", "Command broadcast", "Runbooks", "History", "Audit trail"],
    },
];

export const xftpFeatureGroups: FeatureGroup[] = [
    {
        title: "File Manager",
        items: ["Local panel", "Remote panel", "Bookmarks", "Hidden files", "Filters", "Properties"],
    },
    {
        title: "Transfers",
        items: ["Queue", "Pause/resume", "Retry", "Conflict rules", "Bandwidth limit", "Checksums"],
    },
    {
        title: "Sync",
        items: ["Directory compare", "Mirror upload", "Mirror download", "Dry run", "Include/exclude rules"],
    },
];

export const agentFeatureGroups: FeatureGroup[] = [
    {
        title: "Models",
        items: ["OpenAI-compatible", "Local HTTP", "Custom headers", "Per-workspace model choice"],
    },
    {
        title: "Guardrails",
        items: ["Approval gate", "Denylist", "Timeouts", "Redaction", "Command limits", "Audit logs"],
    },
];
