import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { canonicalizeJson, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, test } from "vitest";

import {
  assertReachableConsumerOperationsFromRepository,
  finishConceptStartup,
  LIVE_CONSUMERS,
  ValidatedPackArtifactSnapshot,
} from "./model.js";

const fixture = JSON.parse(readFileSync("schemas/drill_pack.example.json", "utf8")) as DrillPackDefinition;
const digest = (document: DrillPackDefinition) => `sha256:${createHash("sha256").update(canonicalizeJson(document)).digest("hex")}`;

describe("concept registry fourth author repair", () => {
  test("D2904 one two-phase boot hydrates exact artifacts before migration and mints readiness last", () => {
    const database = db();
    const events: string[] = [];
    const ready = finishConceptStartup({
      database, prerequisiteVersion: 25, conceptVersion: 26,
      compileRegistry: () => { events.push("registry"); return Object.freeze({ digest: "registry" }); },
      loadPackArtifacts: () => { events.push("packs"); return [{ source: "built-in", document: fixture, claimedDigest: digest(fixture) }]; },
      migrateInsideTransaction: (connection, _registry, packs) => {
        events.push("migration");
        expect(connection.isTransaction).toBe(true);
        expect(packs.byDigest(digest(fixture))?.document.id).toBe(fixture.id);
        connection.exec("INSERT INTO migration_effects VALUES ('complete')");
      },
      afterCommit: () => events.push("ready"),
    });
    expect(events).toEqual(["registry", "packs", "migration", "ready"]);
    expect(ready.userVersion()).toBe(26);
  });

  test("D2905 the coordinator alone owns data writes, receipt/version stamp and rollback", () => {
    const database = db();
    expect(() => finishConceptStartup({
      database, prerequisiteVersion: 25, conceptVersion: 26,
      compileRegistry: () => Object.freeze({}),
      loadPackArtifacts: () => [{ source: "built-in", document: fixture, claimedDigest: digest(fixture) }],
      migrateInsideTransaction: (connection) => {
        expect(connection.isTransaction).toBe(true);
        expect(() => connection.exec("BEGIN IMMEDIATE")).toThrow(/transaction within a transaction/u);
        connection.exec("INSERT INTO migration_effects VALUES ('partial')");
        throw new TypeError("injected");
      },
    })).toThrow(/injected/u);
    expect(database.prepare("SELECT count(*) AS count FROM migration_effects").get()).toEqual({ count: 0 });
    expect(database.prepare("PRAGMA user_version").get()).toEqual({ user_version: 25 });
  });

  test("D2906 every operation is called through a function used from the real server/web entry", () => {
    const live = repository("live");
    expect(assertReachableConsumerOperationsFromRepository(live.root, live.commit).operations).toHaveLength(Object.keys(LIVE_CONSUMERS).length);
    const dead = repository("dead");
    expect(() => assertReachableConsumerOperationsFromRepository(dead.root, dead.commit)).toThrow(/unused-operation/u);
    expect(Object.keys(LIVE_CONSUMERS)).toContain("apps/web/src/lib/api.ts");
    expect(Object.keys(LIVE_CONSUMERS)).not.toContain("apps/web/src/lib/client.ts");
  });

  test("D2907 repository compiler diagnostics fail before a reachability receipt", () => {
    const invalid = repository("type_error");
    expect(() => assertReachableConsumerOperationsFromRepository(invalid.root, invalid.commit)).toThrow(/compiler-diagnostics/u);
  });

  test("D2908 only a recomputed, cloned and sealed complete-document snapshot can resolve history", () => {
    const mutable = structuredClone(fixture);
    const actual = digest(mutable);
    expect(() => ValidatedPackArtifactSnapshot.compile([{ source: "forged", document: mutable, claimedDigest: `sha256:${"f".repeat(64)}` }])).toThrow(/pack-artifact:digest/u);
    const snapshot = ValidatedPackArtifactSnapshot.compile([{ source: "valid", document: mutable, claimedDigest: actual }]);
    (mutable as unknown as { id: string }).id = "mutated-after-compile";
    expect(snapshot.byDigest(actual)?.document.id).toBe(fixture.id);
    expect(Object.isFrozen(snapshot.byDigest(actual)?.document)).toBe(true);
  });
});

function db(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec("CREATE TABLE migration_effects (value TEXT NOT NULL) STRICT; PRAGMA user_version = 25");
  return database;
}

function repository(kind: "live" | "dead" | "type_error") {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-fourth-author-"));
  write(root, "tsconfig.base.json", JSON.stringify({ compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true, target: "ES2022", skipLibCheck: true } }));
  write(root, "apps/server/tsconfig.json", JSON.stringify({ extends: "../../tsconfig.base.json", compilerOptions: {} }));
  write(root, "apps/web/tsconfig.json", JSON.stringify({ extends: "../../tsconfig.base.json", compilerOptions: {} }));
  write(root, "packages/runtime/src/concepts.ts", Object.values(LIVE_CONSUMERS).map((operation) => `export function ${operation}(): string { return "${operation}"; }`).join("\n"));
  const serverImports: string[] = [];
  const serverCalls: string[] = [];
  for (const [index, [file, operation]] of Object.entries(LIVE_CONSUMERS).entries()) {
    const name = `consume${index}`;
    write(root, file, `import { ${operation} } from "@chess-tabiya/runtime/concepts";\nexport function ${name}(): string { return ${operation}(); }\n${kind === "type_error" && index === 0 ? "const impossible: string = 42;\n" : ""}`);
    if (file.startsWith("apps/server/")) {
      serverImports.push(`import { ${name} } from "./${path.posix.relative("apps/server/src", file).replace(/\.ts$/u, ".js")}";`);
      if (!(kind === "dead" && index === 0)) serverCalls.push(`${name}();`);
    }
  }
  write(root, "apps/server/src/main.ts", `${serverImports.join("\n")}\n${serverCalls.join("\n")}\n`);
  write(root, "apps/web/src/main.ts", "import { consume5 } from \"./lib/api.js\";\nconsume5();\n");
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
