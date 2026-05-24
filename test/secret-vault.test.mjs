import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSecretRef } from "../src/domain/vault.ts";
import { InMemorySecretVault } from "../src/services/in-memory-secret-vault.ts";

describe("InMemorySecretVault", () => {
    it("stores secrets behind secret refs", () => {
        const vault = new InMemorySecretVault();
        const metadata = vault.put("prod password", "s3cret");

        assert.equal(isSecretRef(metadata.ref), true);
        assert.equal(vault.get(metadata.ref), "s3cret");
        assert.equal(metadata.label, "prod password");
    });

    it("does not expose secret values when listing metadata", () => {
        const vault = new InMemorySecretVault();
        vault.put("api key", "sk-test");

        const listed = vault.list();
        assert.equal(listed.length, 1);
        assert.equal("value" in listed[0], false);
        assert.equal(JSON.stringify(listed).includes("sk-test"), false);
    });

    it("deletes values and metadata together", () => {
        const vault = new InMemorySecretVault();
        const metadata = vault.put("temporary", "value");

        assert.equal(vault.delete(metadata.ref), true);
        assert.equal(vault.get(metadata.ref), undefined);
        assert.equal(vault.list().length, 0);
    });
});
