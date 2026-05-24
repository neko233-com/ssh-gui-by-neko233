import type { SshProfile } from "../domain/connection";
import type { ProfileStore, ProfileStoreSnapshot, ValidationResult } from "./profile-store";
import { validateProfile, validateSnapshot } from "./profile-store";

export class InMemoryProfileStore implements ProfileStore {
    private profiles = new Map<string, SshProfile>();

    constructor(initialProfiles: SshProfile[] = []) {
        for (const profile of initialProfiles) {
            this.profiles.set(profile.id, cloneProfile(profile));
        }
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
        return validation;
    }

    remove(id: string): boolean {
        return this.profiles.delete(id);
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

        return validation;
    }
}

function cloneProfile(profile: SshProfile): SshProfile {
    return JSON.parse(JSON.stringify(profile)) as SshProfile;
}
