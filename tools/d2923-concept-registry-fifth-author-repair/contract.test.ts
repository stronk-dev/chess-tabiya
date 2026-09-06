import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { canonicalizeJson, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, test } from "vitest";

import * as contract from "./model.js";
import {
  assertReachableConsumerOperationsFromRepository,
  CONSUMER_BOUNDARIES,
  finishConceptStartup,
  LIVE_CONSUMERS,
  readyStorageVersion,
  ValidatedPackArtifactSnapshot,
  type ReadyStorage,
} from "./model.js";

const fixture = JSON.parse(readFileSync("schemas/drill_pack.example.json", "utf8")) as DrillPackDefinition;
const packDigest = (document: DrillPackDefinition) => `sha256:${createHash("sha256").update(canonicalizeJson(document)).digest("hex")}`;
const registry = () => Object.freeze({ currentDigest: `sha256:${"a".repeat(64)}` });

describe("concept registry fifth author repair", () => {
  test("D2923 readiness has no public issuer and direct, cast and structural forgeries fail", () => {
    expect("ReadyStorage" in contract).toBe(false);
    expect("issueReadyStorage" in contract).toBe(false);
    const fake = { kind: "concept-storage-ready" } as ReadyStorage;
    expect(() => readyStorageVersion(fake)).toThrow(/storage:not-ready/u);
    const database = db(25);
    const ready = startup(database);
    expect(readyStorageVersion(ready)).toBe(26);
  });

  test("D2924 the migration receives only a frozen operation capability", () => {
    const database = db(25);
    const ready = finishConceptStartup({
      database,
      prerequisiteVersion: 25,
      conceptVersion: 26,
      compileRegistry: registry,
      loadPackArtifacts: validArtifacts,
      migrateInsideTransaction: (repository) => {
        expect(Object.keys(repository)).toEqual(["insertEffect"]);
        expect(Object.isFrozen(repository)).toBe(true);
        expect((repository as unknown as { exec?: unknown }).exec).toBeUndefined();
        expect((repository as unknown as { prepare?: unknown }).prepare).toBeUndefined();
        repository.insertEffect("complete");
      },
    });
    expect(readyStorageVersion(ready)).toBe(26);
    expect(database.prepare("SELECT value FROM migration_effects").all()).toEqual([{ value: "complete" }]);
  });

  test("D2925 complete pack validation precedes digest authority", () => {
    const invalid = structuredClone(fixture) as DrillPackDefinition & { formatVersion: string };
    invalid.formatVersion = "not-a-pack-version";
    expect(() => ValidatedPackArtifactSnapshot.compile([
      { source: "persisted-json", document: invalid, claimedDigest: packDigest(invalid) },
    ])).toThrow(/pack-artifact:invalid:persisted-json/u);
    const snapshot = ValidatedPackArtifactSnapshot.compile(validArtifacts());
    expect(snapshot.byDigest(packDigest(fixture))?.document.id).toBe(fixture.id);
  });

  test("D2926 restart requires and revalidates the exact canonical receipt", () => {
    const database = db(25);
    startup(database);
    expect(readyStorageVersion(startup(database))).toBe(26);

    const missing = db(26);
    expect(() => startup(missing)).toThrow(/startup:receipt-missing/u);

    database.prepare("UPDATE concept_migration_receipts SET receipt_json='{}' WHERE version=1").run();
    expect(() => startup(database)).toThrow(/startup:receipt:keys/u);

    const changed = db(25);
    startup(changed);
    changed.prepare("INSERT INTO migration_inputs VALUES ('later')").run();
    expect(() => startup(changed)).toThrow(/startup:restart-preimage-changed/u);
  });

  test("D2927 the real main to Svelte to api graph is traversed", () => {
    const live = repository("live");
    const receipt = assertReachableConsumerOperationsFromRepository(live.root, live.commit);
    expect(receipt.operations).toHaveLength(Object.keys(LIVE_CONSUMERS).length);
    expect(git(live.root, ["show", `${live.commit}:apps/web/src/main.ts`])).toMatch(/App\.svelte/u);
    expect(git(live.root, ["show", `${live.commit}:apps/web/src/App.svelte`])).toMatch(/\.\/lib\/api\.js/u);

    const disconnected = repository("disconnected_web");
    expect(() => assertReachableConsumerOperationsFromRepository(disconnected.root, disconnected.commit))
      .toThrow(/unreachable-module/u);
  });

  test("D2928 every result reaches its declared operation-specific boundary", () => {
    const live = repository("live");
    const receipt = assertReachableConsumerOperationsFromRepository(live.root, live.commit);
    expect(receipt.operations).toEqual(Object.entries(LIVE_CONSUMERS).map(([file, operation]) =>
      `${file}#${operation}->${CONSUMER_BOUNDARIES[file as keyof typeof CONSUMER_BOUNDARIES]}`).sort());

    const discarded = repository("discarded_results");
    expect(() => assertReachableConsumerOperationsFromRepository(discarded.root, discarded.commit))
      .toThrow(/operation-result-not-consumed/u);
  });
});

function validArtifacts() {
  return [{ source: "built-in", document: fixture, claimedDigest: packDigest(fixture) }];
}

function startup(database: DatabaseSync) {
  return finishConceptStartup({
    database,
    prerequisiteVersion: 25,
    conceptVersion: 26,
    compileRegistry: registry,
    loadPackArtifacts: validArtifacts,
    migrateInsideTransaction: (repository) => repository.insertEffect("complete"),
  });
}

function db(version: number): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE migration_inputs (value TEXT NOT NULL) STRICT;
    CREATE TABLE migration_effects (value TEXT NOT NULL) STRICT;
    CREATE TABLE concept_migration_receipts (version INTEGER PRIMARY KEY, receipt_json TEXT NOT NULL) STRICT;
    INSERT INTO migration_inputs VALUES ('initial');
    PRAGMA user_version = ${version};
  `);
  return database;
}

function repository(kind: "live" | "disconnected_web" | "discarded_results") {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-fifth-author-"));
  write(root, "tsconfig.base.json", JSON.stringify({ compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true, target: "ES2022", skipLibCheck: true } }));
  write(root, "apps/server/tsconfig.json", JSON.stringify({ extends: "../../tsconfig.base.json" }));
  write(root, "apps/web/tsconfig.json", JSON.stringify({ extends: "../../tsconfig.base.json" }));
  write(root, "packages/runtime/src/concepts.ts", Object.values(LIVE_CONSUMERS).map((operation) => `export function ${operation}(): string { return "${operation}"; }`).join("\n"));

  const serverImports: string[] = [];
  const serverCalls: string[] = [];
  for (const [index, [file, operation]] of Object.entries(LIVE_CONSUMERS).entries()) {
    const name = `consume${index}`;
    write(root, file, `import { ${operation} } from "@chess-tabiya/runtime/concepts";\nexport function ${name}(): string { return ${operation}(); }\n`);
    if (file.startsWith("apps/server/")) {
      const relative = path.posix.relative("apps/server/src", file).replace(/\.ts$/u, ".js");
      serverImports.push(`import { ${name} } from "./${relative}";`);
      const boundary = CONSUMER_BOUNDARIES[file as keyof typeof CONSUMER_BOUNDARIES];
      serverCalls.push(`function ${boundary}(value: string): void { void value; }\n${kind === "discarded_results" ? `${name}();` : `${boundary}(${name}());`}`);
    }
  }
  write(root, "apps/server/src/main.ts", `${serverImports.join("\n")}\n${serverCalls.join("\n")}\n`);
  write(root, "apps/web/src/main.ts", 'import App from "./App.svelte";\nvoid App;\n');
  const webBoundary = CONSUMER_BOUNDARIES["apps/web/src/lib/api.ts"];
  const webCall = kind === "discarded_results" ? "consume5();" : `${webBoundary}(consume5());`;
  write(root, "apps/web/src/App.svelte", kind === "disconnected_web"
    ? '<script lang="ts">const disconnected = true; void disconnected;</script>\n'
    : `<script lang="ts">import { consume5 } from "./lib/api.js"; function ${webBoundary}(value: string): void { void value; } ${webCall}</script>\n`);

  git(root, ["init", "--quiet"]);
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]).trim() };
}

function write(root: string, file: string, bytes: string): void {
  const absolute = path.join(root, file);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}
