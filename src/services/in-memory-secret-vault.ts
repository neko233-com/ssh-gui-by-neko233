import type { SecretMetadata, SecretRef, SecretVault } from "../domain/vault";

export class InMemorySecretVault implements SecretVault {
    private readonly values = new Map<SecretRef, string>();
    private readonly metadata = new Map<SecretRef, SecretMetadata>();
    private nextId = 1;

    put(label: string, value: string): SecretMetadata {
        const now = new Date().toISOString();
        const ref = `secret://memory/${this.nextId++}` as SecretRef;
        const metadata: SecretMetadata = {
            ref,
            label,
            createdAt: now,
            updatedAt: now,
        };

        this.values.set(ref, value);
        this.metadata.set(ref, metadata);
        return { ...metadata };
    }

    get(ref: SecretRef): string | undefined {
        return this.values.get(ref);
    }

    delete(ref: SecretRef): boolean {
        const valueRemoved = this.values.delete(ref);
        const metadataRemoved = this.metadata.delete(ref);
        return valueRemoved || metadataRemoved;
    }

    list(): SecretMetadata[] {
        return Array.from(this.metadata.values()).map((item) => ({ ...item }));
    }
}
