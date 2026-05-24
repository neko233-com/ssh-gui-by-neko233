import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { InMemoryProfileStore } from "../src/services/in-memory-profile-store.ts";
import { JsonProfileStore } from "../src/services/json-profile-store.ts";
import { validateProfile } from "../src/services/profile-store.ts";

function makeProfile(overrides = {}) {
    return {
        id: "test-profile",
        name: "Test Profile",
        folder: "Tests",
        tags: ["test"],
        host: "127.0.0.1",
        port: 22,
        username: "tester",
        auth: { kind: "privateKey", keyPath: "~/.ssh/id_ed25519" },
        proxy: { kind: "none" },
        jumpHosts: [],
        terminal: {
            fontFamily: "JetBrains Mono",
            fontSize: 13,
            encoding: "utf-8",
            scrollbackLines: 10000,
            colorScheme: "dark",
            startupCommands: [],
        },
        keepAliveSeconds: 30,
        connectTimeoutSeconds: 15,
        notes: "",
        ...overrides,
    };
}

describe("profile validation", () => {
    it("accepts a valid profile", () => {
        const result = validateProfile(makeProfile());
        assert.equal(result.ok, true);
        assert.deepEqual(result.issues, []);
    });

    it("rejects an invalid port", () => {
        const result = validateProfile(makeProfile({ port: 70000 }));
        assert.equal(result.ok, false);
        assert.equal(result.issues[0].field, "port");
    });

    it("requires password auth to reference the secret vault", () => {
        const result = validateProfile(makeProfile({ auth: { kind: "password", secretRef: "plain-password" } }));
        assert.equal(result.ok, false);
        assert.equal(result.issues[0].field, "auth.secretRef");
    });
});

describe("InMemoryProfileStore", () => {
    it("saves and lists valid profiles", () => {
        const store = new InMemoryProfileStore();
        const result = store.save(makeProfile());
        assert.equal(result.ok, true);
        assert.equal(store.list().length, 1);
        assert.equal(store.get("test-profile")?.host, "127.0.0.1");
    });

    it("rejects invalid profiles without mutating the store", () => {
        const store = new InMemoryProfileStore([makeProfile()]);
        const result = store.save(makeProfile({ id: "bad", port: 0 }));
        assert.equal(result.ok, false);
        assert.equal(store.get("bad"), undefined);
        assert.equal(store.list().length, 1);
    });

    it("exports a versioned snapshot", () => {
        const store = new InMemoryProfileStore([makeProfile()]);
        const snapshot = store.exportSnapshot();
        assert.equal(snapshot.version, 1);
        assert.equal(snapshot.profiles[0].id, "test-profile");
    });

    it("protects internal state from caller mutation", () => {
        const store = new InMemoryProfileStore([makeProfile()]);
        const listed = store.list();
        listed[0].host = "mutated.example.com";
        assert.equal(store.get("test-profile")?.host, "127.0.0.1");
    });

    it("imports valid snapshots and rejects duplicate ids", () => {
        const store = new InMemoryProfileStore();
        const duplicate = makeProfile();
        const result = store.importSnapshot({ version: 1, profiles: [duplicate, duplicate] });
        assert.equal(result.ok, false);
        assert.equal(store.list().length, 0);
    });
});

describe("JsonProfileStore", () => {
    it("creates a versioned profile file from initial profiles", () => {
        const dir = makeTempDir();
        try {
            const file = join(dir, "profiles.json");
            new JsonProfileStore(file, [makeProfile()]);
            const snapshot = JSON.parse(readFileSync(file, "utf8"));
            assert.equal(snapshot.version, 1);
            assert.equal(snapshot.profiles[0].id, "test-profile");
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("loads saved profiles from disk", () => {
        const dir = makeTempDir();
        try {
            const file = join(dir, "profiles.json");
            const store = new JsonProfileStore(file, [makeProfile()]);
            store.save(makeProfile({ id: "second", host: "10.0.0.2" }));

            const reloaded = new JsonProfileStore(file);
            assert.equal(reloaded.list().length, 2);
            assert.equal(reloaded.get("second")?.host, "10.0.0.2");
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("rejects invalid snapshot files", () => {
        const dir = makeTempDir();
        try {
            const file = join(dir, "profiles.json");
            writeFileSync(file, JSON.stringify({ version: 1, profiles: [makeProfile({ port: 0 })] }), "utf8");
            assert.throws(() => new JsonProfileStore(file), /profiles\.test-profile\.port/);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it("persists removals", () => {
        const dir = makeTempDir();
        try {
            const file = join(dir, "profiles.json");
            const store = new JsonProfileStore(file, [makeProfile()]);
            assert.equal(store.remove("test-profile"), true);

            const reloaded = new JsonProfileStore(file);
            assert.equal(reloaded.list().length, 0);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});

function makeTempDir() {
    return mkdtempSync(join(tmpdir(), "ssh-gui-profile-store-"));
}
