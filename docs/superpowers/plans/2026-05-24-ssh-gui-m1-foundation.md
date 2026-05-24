# SSH GUI M1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local profile persistence, schema validation, secret references, and deterministic tests for the SSH GUI foundation.

**Architecture:** Keep Perry UI code independent from persistence and runtime services. Domain files define stable data contracts; services provide pure TypeScript operations that can be tested under Node and compiled by Perry.

**Tech Stack:** TypeScript 6, Perry 0.5, Node test runner, JSON persistence for M1, filesystem abstraction for tests.

---

## File Structure

- `spec.md`: root product specification and definition of done.
- `src/domain/connection.ts`: SSH profile contracts and defaults.
- `src/domain/vault.ts`: secret reference and vault interfaces.
- `src/services/profile-store.ts`: profile validation, serialization, CRUD, import/export helpers.
- `src/services/in-memory-profile-store.ts`: deterministic in-memory store used by tests and UI previews.
- `test/profile-store.test.mjs`: Node tests for profile store behavior.
- `package.json`: scripts for type-checking and tests.
- `docs/roadmap.md`: milestone notes updated with M1 scope.

## Task 1: Add Vault Contracts

**Files:**
- Create: `src/domain/vault.ts`
- Modify: `src/domain/connection.ts`

- [ ] **Step 1: Create `src/domain/vault.ts`**

```ts
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
```

- [ ] **Step 2: Update connection auth types to use `SecretRef`**

Import `SecretRef` from `./vault` and replace plain secret reference strings on auth/proxy types with `SecretRef`.

- [ ] **Step 3: Run type check**

Run: `npm run check`

Expected: TypeScript and Perry check pass, or only native environment build remains blocked by missing clang.

## Task 2: Add Profile Store Service

**Files:**
- Create: `src/services/profile-store.ts`
- Create: `src/services/in-memory-profile-store.ts`

- [ ] **Step 1: Create validation result types**

`profile-store.ts` must export:

```ts
import type { SshProfile } from "../domain/connection";

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
```

- [ ] **Step 2: Implement `validateProfile(profile)`**

Rules:
- `id`, `name`, `host`, and `username` must be non-empty after trim.
- `port` must be an integer from 1 to 65535.
- `connectTimeoutSeconds` must be at least 1.
- `keepAliveSeconds` must be at least 0.
- password auth `secretRef` must start with `secret://`.
- private key auth `keyPath` must be non-empty.
- proxy with `http` or `socks5` must include host and valid port.

- [ ] **Step 3: Implement in-memory store**

`InMemoryProfileStore` must clone profile data on read/write using JSON serialization to prevent tests from mutating internal state.

- [ ] **Step 4: Add barrel exports**

Create `src/services/index.ts` exporting profile store modules if useful for UI imports.

## Task 3: Add Deterministic Tests

**Files:**
- Create: `test/profile-store.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add test scripts**

Set package scripts:

```json
"test": "node --test test/*.test.mjs",
"check": "tsc --noEmit && npm test && perry check src/main.ts"
```

- [ ] **Step 2: Write tests**

Use dynamic import from compiled-free TypeScript is not available under Node without a runner, so tests should validate equivalent store behavior through a small JS fixture only if no transpiler is added. Prefer adding `tsx` dev dependency if tests need to import TypeScript directly.

Expected tests:
- valid profile saves and lists.
- invalid port is rejected.
- password secret must be a `secret://` ref.
- exported snapshot is versioned.
- mutating listed profiles does not mutate store internals.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: all profile store tests pass.

## Task 4: Wire Store Into UI Preview

**Files:**
- Modify: `src/ui/app-shell.ts`

- [ ] **Step 1: Instantiate `InMemoryProfileStore` with demo profiles**

Replace direct list access in session list with store-backed `profileStore.list()`.

- [ ] **Step 2: Add save draft action**

Add a button that writes edited host/user into the selected profile through `profileStore.save()`, then reports validation status through `setText("status", ...)`.

- [ ] **Step 3: Run verification**

Run: `npm run check`

Expected: TypeScript, tests, and Perry check pass.

## Self-Review

Spec coverage:
- M1 persistence foundations are covered.
- Secret references are covered.
- Profile CRUD and validation are covered.
- Deterministic tests are covered.

Placeholder scan:
- No task contains TBD or undefined future implementation language.

Type consistency:
- `SecretRef`, `SshProfile`, `ProfileStore`, and `ValidationResult` names are consistent across tasks.
