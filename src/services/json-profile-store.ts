import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import type { SshProfile } from "../domain/connection";
import type { ProfileStore, ProfileStoreSnapshot, ValidationResult } from "./profile-store";
import { invalidResult, validateProfile, validateSnapshot } from "./profile-store";

export class JsonProfileStore implements ProfileStore {
    private readonly filePath: string;
    private profiles = new Map<string, SshProfile>();

    constructor(filePath: string, initialProfiles: SshProfile[] = []) {
        this.filePath = filePath;
        if (existsSync(filePath)) {
            const result = this.load();
            if (!result.ok) {
                throw new Error(result.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
            }
            return;
        }

        for (const profile of initialProfiles) {
            const validation = validateProfile(profile);
            if (!validation.ok) {
                throw new Error(validation.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
            }
            this.profiles.set(profile.id, cloneProfile(profile));
        }
        this.flush();
    }

    list(): SshProfile[] {
        return Array.from(this.profiles.values()).map(cloneProfile);
    }

    get(id: string): SshProfile | undefined {
        const profile = this.profiles.get(id);
        return profile === undefined ? undefined : cloneProfile(profile);
    }

    save(profile: SshProfile): ValidationResult {
        const validation = validateProfile(profile);
        if (!validation.ok) {
            return validation;
        }

        this.profiles.set(profile.id, cloneProfile(profile));
        this.flush();
        return validation;
    }

    remove(id: string): boolean {
        const removed = this.profiles.delete(id);
        if (removed) {
            this.flush();
        }
        return removed;
    }

    exportSnapshot(): ProfileStoreSnapshot {
        return {
            version: 1,
            profiles: this.list(),
        };
    }

    importSnapshot(snapshot: ProfileStoreSnapshot): ValidationResult {
        const validation = validateSnapshot(snapshot);
        if (!validation.ok) {
            return validation;
        }

        this.profiles.clear();
        for (const profile of snapshot.profiles) {
            this.profiles.set(profile.id, cloneProfile(profile));
        }
        this.flush();
        return validation;
    }

    reload(): ValidationResult {
        return this.load();
    }

    private load(): ValidationResult {
        let parsed: ProfileStoreSnapshot;
        try {
            parsed = JSON.parse(readFileSync(this.filePath, "utf8")) as ProfileStoreSnapshot;
        } catch (error) {
            return invalidResult([{ field: "file", message: `Unable to read profile store: ${String(error)}` }]);
        }

        const validation = validateSnapshot(parsed);
        if (!validation.ok) {
            return validation;
        }

        this.profiles.clear();
        for (const profile of parsed.profiles) {
            this.profiles.set(profile.id, cloneProfile(profile));
        }
        return validation;
    }

    private flush(): void {
        const directory = dirname(this.filePath);
        if (directory.length > 0 && !existsSync(directory)) {
            mkdirSync(directory, { recursive: true });
        }

        const tempPath = `${this.filePath}.tmp`;
        const content = `${JSON.stringify(this.exportSnapshot(), null, 2)}\n`;
        writeFileSync(tempPath, content, "utf8");
        renameSync(tempPath, this.filePath);
    }
}

function cloneProfile(profile: SshProfile): SshProfile {
    return JSON.parse(JSON.stringify(profile)) as SshProfile;
}

function dirname(filePath: string): string {
    const slash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
    return slash === -1 ? "" : filePath.slice(0, slash);
}
