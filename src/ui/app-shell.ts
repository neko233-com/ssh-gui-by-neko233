import {
    App,
    Button,
    Divider,
    HStack,
    SecureField,
    Text,
    TextArea,
    TextField,
    Toggle,
    VStack,
    alert,
    setText,
} from "perry/ui";
import { defaultAgentPolicy, demoProviders } from "../domain/agent";
import { demoProfiles, type SshProfile } from "../domain/connection";
import { defaultLocalPanel, defaultRemotePanel, demoTransferQueue } from "../domain/file-transfer";
import { agentFeatureGroups, xftpFeatureGroups, xshellFeatureGroups } from "../domain/features";
import { demoTunnels } from "../domain/tunnel";
import { FakeSftpRuntime, FakeSshRuntime } from "../runtime";
import { InMemoryProfileStore } from "../services";

type UiWidget = ReturnType<typeof Text>;

const profileStore = new InMemoryProfileStore(demoProfiles);
const sshRuntime = new FakeSshRuntime();
const sftpRuntime = new FakeSftpRuntime();
let activeSessionId = "";
let selectedProfileId = demoProfiles[0]?.id ?? "";
let draftHost = demoProfiles[0]?.host ?? "";
let draftUser = demoProfiles[0]?.username ?? "";
let draftPassword = "";
let agentObjective = "Check disk usage, inspect service health, and propose safe remediation.";
let agentEnabled = true;

function updateStatus(message: string): void {
    setText("status", message);
}

function selectedProfileName(): string {
    const profile = profileStore.get(selectedProfileId);
    return profile?.name ?? "No profile";
}

function featureSummary(): string {
    const xshellCount = xshellFeatureGroups.reduce((sum, group) => sum + group.items.length, 0);
    const xftpCount = xftpFeatureGroups.reduce((sum, group) => sum + group.items.length, 0);
    const agentCount = agentFeatureGroups.reduce((sum, group) => sum + group.items.length, 0);
    return `Coverage model: ${xshellCount} Xshell items, ${xftpCount} Xftp items, ${agentCount} AI agent items.`;
}

function createSessionList(): UiWidget {
    const rows = profileStore.list().map((profile) =>
        Button(`${profile.name}  ${profile.username}@${profile.host}:${profile.port}`, () => {
            selectedProfileId = profile.id;
            draftHost = profile.host;
            draftUser = profile.username;
            setText("selected-profile", `Selected: ${profile.name}`);
            updateStatus(`Selected ${profile.name}. Runtime SSH connection is the next milestone.`);
        }),
    );

    return VStack(8, [
        Text("Sessions"),
        Text("Folders, tags, jump hosts, proxy, keepalive, startup commands"),
        ...rows,
        Button("Import sessions", () => alert("Import", "Import/export will be implemented with a versioned profile format.")),
        Button("New folder", () => updateStatus("Folder management is modeled and ready for persistence.")),
    ]);
}

function createConnectionPanel(): UiWidget {
    return VStack(8, [
        Text("SSH Connection"),
        Text("Selected: prod-web-01", "selected-profile"),
        TextField("Host", (value: string) => {
            draftHost = value;
        }),
        TextField("Username", (value: string) => {
            draftUser = value;
        }),
        SecureField("Password or passphrase", (value: string) => {
            draftPassword = value;
        }),
        HStack(8, [
            Button("Connect", () => {
                const profile = profileStore.get(selectedProfileId);
                if (profile === undefined) {
                    updateStatus("No selected profile to connect.");
                    return;
                }
                const session = sshRuntime.connect({ profile: { ...profile, host: draftHost, username: draftUser } });
                activeSessionId = session.id;
                const secretState = draftPassword.length > 0 ? "secret entered" : "no secret entered";
                updateStatus(`Connected preview session ${session.id} for ${draftUser}@${draftHost}; ${secretState}.`);
            }),
            Button("Save profile", () => {
                const profile = profileStore.get(selectedProfileId);
                if (profile === undefined) {
                    updateStatus("No selected profile to save.");
                    return;
                }

                const updated: SshProfile = { ...profile, host: draftHost, username: draftUser };
                const result = profileStore.save(updated);
                if (result.ok) {
                    updateStatus(`Saved ${updated.name} as ${updated.username}@${updated.host}.`);
                    return;
                }

                updateStatus(`Profile validation failed: ${result.issues[0]?.message ?? "unknown issue"}`);
            }),
            Button("Open SFTP", () => {
                const entries = sftpRuntime.listDirectory(selectedProfileId, defaultRemotePanel.currentPath);
                updateStatus(`SFTP preview loaded ${entries.length} entries for ${selectedProfileName()}.`);
            }),
            Button("Start tunnel", () => updateStatus(`Tunnel service has ${demoTunnels.length} modeled rules.`)),
        ]),
    ]);
}

function createTerminalPanel(): UiWidget {
    return VStack(8, [
        Text("Terminal Workspace"),
        Text("Tabs, split panes, command snippets, broadcast, logs, and reconnect are represented in the roadmap."),
        TextArea("Terminal output will stream here after the SSH runtime lands.", (_value: string) => undefined),
        HStack(8, [
            Button("New tab", () => updateStatus("Terminal tabs are part of the M2 runtime milestone.")),
            Button("Split pane", () => updateStatus("Split panes are part of the M4 advanced terminal milestone.")),
            Button("Run uptime", () => {
                const result = sshRuntime.execute({ profileId: selectedProfileId, command: "uptime", timeoutSeconds: 30 });
                updateStatus(`Command ${result.status}: ${result.stdout || result.stderr}`);
            }),
            Button("Log session", () => updateStatus("Session logging will write audit-safe terminal transcripts.")),
        ]),
    ]);
}

function createFilePanel(): UiWidget {
    const queueSummary = demoTransferQueue
        .map((job) => `${job.id}: ${job.status} ${job.bytesDone}/${job.bytesTotal}`)
        .join("\n");

    return VStack(8, [
        Text("File Transfer"),
        HStack(8, [
            VStack(4, [
                Text(`Local: ${defaultLocalPanel.currentPath}`),
                Text("deploy/"),
                Text("logs/"),
                Text("README.md"),
            ]),
            VStack(4, [
                Text(`Remote: ${defaultRemotePanel.currentPath}`),
                Text("releases/"),
                Text("shared/"),
                Text("nginx.conf"),
            ]),
        ]),
        Text(`Queue\n${queueSummary}`),
        HStack(8, [
            Button("Upload", () => updateStatus("SFTP upload queue is modeled; protocol runtime lands in M3.")),
            Button("Download", () => {
                const job = sftpRuntime.queue.enqueue(demoTransferQueue[1]);
                const running = sftpRuntime.queue.start(job.id);
                updateStatus(`Transfer ${running?.id ?? job.id} is ${running?.status ?? job.status}.`);
            }),
            Button("Sync", () => updateStatus("Directory sync planner is part of the Xftp coverage plan.")),
        ]),
    ]);
}

function createAgentPanel(): UiWidget {
    const providerNames = demoProviders.map((provider) => provider.name).join(", ");

    return VStack(8, [
        Text("AI Operations Agent"),
        Text(`Providers: ${providerNames}`),
        Toggle("Enable agent", (value: boolean) => {
            agentEnabled = value;
            updateStatus(value ? "Agent enabled with approval-required policy." : "Agent disabled.");
        }),
        TextArea("Objective", (value: string) => {
            agentObjective = value;
        }),
        HStack(8, [
            Button("Plan", () => {
                const mode = agentEnabled ? defaultAgentPolicy.mode : "disabled";
                const lines = activeSessionId === "" ? [] : sshRuntime.readBuffer(activeSessionId, 3);
                updateStatus(`Planning for ${selectedProfileName()} with policy ${mode}; context lines=${lines.length}: ${agentObjective}`);
            }),
            Button("Approve next command", () => updateStatus("Approval workflow is reserved for agent tool execution.")),
            Button("Audit", () => updateStatus("Audit log will record prompts, plans, commands, output, and approvals.")),
        ]),
    ]);
}

function createCapabilityPanel(): UiWidget {
    return VStack(8, [
        Text("Capability Map"),
        Text(featureSummary()),
        Text("Xshell: terminal, sessions, network, automation"),
        Text("Xftp: file manager, transfers, sync"),
        Text("Agent: models, tools, guardrails, audit"),
    ]);
}

function createBody(): UiWidget {
    return VStack(10, [
        HStack(12, [
            createSessionList(),
            VStack(10, [
                createConnectionPanel(),
                Divider(),
                createTerminalPanel(),
                Divider(),
                createFilePanel(),
                Divider(),
                createAgentPanel(),
                Divider(),
                createCapabilityPanel(),
            ]),
        ]),
        Text("Ready. Runtime services are intentionally behind typed interfaces.", "status"),
    ]);
}

export function runApp(): void {
    App({
        title: "Neko SSH GUI",
        width: 1280,
        height: 820,
        windowState: "normal",
        body: createBody(),
    });
}
