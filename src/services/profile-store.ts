import type { SshProfile } from "../domain/connection";
import { isSecretRef } from "../domain/vault";

export interface ValidationIssue {
    field: string;
    message: string;
}

export interface ValidationResult {
    ok: boolean;
    issues: ValidationIssue[];
}

export interface ProfileStoreSnapshot {
    version: 1;
    profiles: SshProfile[];
}

export interface ProfileStore {
    list(): SshProfile[];
    get(id: string): SshProfile | undefined;
    save(profile: SshProfile): ValidationResult;
    remove(id: string): boolean;
    exportSnapshot(): ProfileStoreSnapshot;
    importSnapshot(snapshot: ProfileStoreSnapshot): ValidationResult;
}

export function validResult(): ValidationResult {
    return { ok: true, issues: [] };
}

export function invalidResult(issues: ValidationIssue[]): ValidationResult {
    return { ok: issues.length === 0, issues };
}

export function validateProfile(profile: SshProfile): ValidationResult {
    const issues: ValidationIssue[] = [];

    requireNonEmpty(profile.id, "id", issues);
    requireNonEmpty(profile.name, "name", issues);
    requireNonEmpty(profile.host, "host", issues);
    requireNonEmpty(profile.username, "username", issues);

    if (!Number.isInteger(profile.port) || profile.port < 1 || profile.port > 65535) {
        issues.push({ field: "port", message: "Port must be an integer from 1 to 65535." });
    }

    if (profile.connectTimeoutSeconds < 1) {
        issues.push({ field: "connectTimeoutSeconds", message: "Connect timeout must be at least 1 second." });
    }

    if (profile.keepAliveSeconds < 0) {
        issues.push({ field: "keepAliveSeconds", message: "Keepalive must be zero or greater." });
    }

    if (profile.auth.kind === "password" && !isSecretRef(profile.auth.secretRef)) {
        issues.push({ field: "auth.secretRef", message: "Password auth must reference a vault secret." });
    }

    if (profile.auth.kind === "privateKey" && profile.auth.keyPath.trim().length === 0) {
        issues.push({ field: "auth.keyPath", message: "Private key auth requires a key path." });
    }

    if (profile.proxy.kind === "http" || profile.proxy.kind === "socks5") {
        requireNonEmpty(profile.proxy.host ?? "", "proxy.host", issues);
        if (!Number.isInteger(profile.proxy.port) || (profile.proxy.port ?? 0) < 1 || (profile.proxy.port ?? 0) > 65535) {
            issues.push({ field: "proxy.port", message: "Proxy port must be an integer from 1 to 65535." });
        }
    }

    return invalidResult(issues);
}

export function validateSnapshot(snapshot: ProfileStoreSnapshot): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (snapshot.version !== 1) {
        issues.push({ field: "version", message: "Profile snapshot version must be 1." });
    }

    const seen = new Set<string>();
    for (const profile of snapshot.profiles) {
        const result = validateProfile(profile);
        for (const issue of result.issues) {
            issues.push({ field: `profiles.${profile.id}.${issue.field}`, message: issue.message });
        }

        if (seen.has(profile.id)) {
            issues.push({ field: `profiles.${profile.id}.id`, message: "Profile id must be unique." });
        }
        seen.add(profile.id);
    }

    return invalidResult(issues);
}

function requireNonEmpty(value: string, field: string, issues: ValidationIssue[]): void {
    if (value.trim().length === 0) {
        issues.push({ field, message: `${field} must not be empty.` });
    }
}
