export type SecretRef = `secret://${string}`;

export interface SecretMetadata {
    ref: SecretRef;
    label: string;
    createdAt: string;
    updatedAt: string;
}

export interface SecretVault {
    put(label: string, value: string): SecretMetadata;
    get(ref: SecretRef): string | undefined;
    delete(ref: SecretRef): boolean;
    list(): SecretMetadata[];
}

export function isSecretRef(value: string): value is SecretRef {
    return value.startsWith("secret://");
}
