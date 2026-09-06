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
  CONSUMER_BOUNDARIES,
  finishConceptStartup,
  LIVE_CONSUMERS,
  readyStorageVersion,
  type ReadyStorage,
  ValidatedPackArtifactSnapshot,
} from "../d2923-concept-registry-fifth-author-repair/model.js";

const fixture = JSON.parse(readFileSync("schemas/drill_pack.example.json", "utf8")) as DrillPackDefinition;
const digestPatternValue = `sha256:${"a".repeat(64)}`;

describe("concept registry sixth fresh independent review", () => {
  test("D2960 counterfeit and dormant boundary names still satisfy consumer closure", () => {
    for (const kind of ["counterfeit_boundary", "dormant_boundary"] as const) {
      const repository = repositoryFixture(kind);
      const receipt = assertReachableConsumerOperationsFromRepository(repository.root, repository.commit);
      expect(receipt.operations).toHaveLength(Object.keys(LIVE_CONSUMERS).length);
      const main = git(repository.root, ["show", `${repository.commit}:apps/server/src/main.ts`]);
      expect(main).toMatch(/function publishConceptExport/u);
      if (kind === "dormant_boundary") expect(main).toMatch(/function dormant0/u);
    }
  });

  test("D2961 a server diagnostic is erased by the later web compiler options", () => {
    const repository = repositoryFixture("crossed_config");
    const receipt = assertReachableConsumerOperationsFromRepository(repository.root, repository.commit);
    expect(receipt.operations).toHaveLength(Object.keys(LIVE_CONSUMERS).length);
    expect(git(repository.root, ["show", `${repository.commit}:apps/server/tsconfig.json`]))
      .toContain('"noImplicitAny":true');
    expect(git(repository.root, ["show", `${repository.commit}:apps/server/src/account-data.ts`]))
      .toMatch(/leakedImplicitAny/u);
  });

  test("D2962 the same validated artifact set has an order-dependent population digest", () => {
    const second = {
      ...structuredClone(fixture),
      id: "najdorf-transition-schema-example-second",
    } as DrillPackDefinition;
    const firstOrder = ValidatedPackArtifactSnapshot.compile([
      artifact("first", fixture),
      artifact("second", second),
    ]);
    const reverseOrder = ValidatedPackArtifactSnapshot.compile([
      artifact("second", second),
      artifact("first", fixture),
    ]);
    expect(firstOrder.populationDigest).not.toBe(reverseOrder.populationDigest);
  });

  test("D2963 a digest-only structural registry mints migration and readiness", () => {
    const database = db(25);
    const ready = finishConceptStartup({
      database,
      prerequisiteVersion: 25,
      conceptVersion: 26,
      compileRegistry: () => ({ currentDigest: digestPatternValue }),
      loadPackArtifacts: validArtifacts,
      migrateInsideTransaction: (repository) => repository.insertEffect("fake-registry-authorized"),
    });
    expect(readyStorageVersion(ready)).toBe(26);
    expect(database.prepare("SELECT value FROM migration_effects").all())
      .toEqual([{ value: "fake-registry-authorized" }]);
  });

  test("D2964 failed post-commit composition leaks a privately minted ready token", () => {
    const database = db(25);
    let escaped: ReadyStorage | undefined;
    expect(() => finishConceptStartup({
      database,
      prerequisiteVersion: 25,
      conceptVersion: 26,
      compileRegistry: () => ({ currentDigest: digestPatternValue }),
      loadPackArtifacts: validArtifacts,
      migrateInsideTransaction: (repository) => repository.insertEffect("complete"),
      afterCommit: (ready) => {
        escaped = ready;
        throw new Error("service-construction-failed");
      },
    })).toThrow(/service-construction-failed/u);
    expect(escaped).toBeDefined();
    expect(readyStorageVersion(escaped!)).toBe(26);
  });

  test("D2965 rejected startup leaves its bootstrap database usable", () => {
    const database = db(25);
    expect(() => finishConceptStartup({
      database,
      prerequisiteVersion: 25,
      conceptVersion: 26,
      compileRegistry: () => ({ currentDigest: digestPatternValue }),
      loadPackArtifacts: validArtifacts,
      migrateInsideTransaction: () => {
        throw new Error("migration-failed");
      },
    })).toThrow(/migration-failed/u);
    expect(database.prepare("SELECT value FROM migration_inputs").all()).toEqual([{ value: "initial" }]);
  });
});

function artifact(source: string, document: DrillPackDefinition) {
  return { source, document, claimedDigest: packDigest(document) };
}

function validArtifacts() {
  return [artifact("built-in", fixture)];
}

function packDigest(document: DrillPackDefinition): string {
  return `sha256:${createHash("sha256").update(canonicalizeJson(document)).digest("hex")}`;
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

function repositoryFixture(kind: "counterfeit_boundary" | "dormant_boundary" | "crossed_config") {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-sixth-review-"));
  write(root, "tsconfig.base.json", JSON.stringify({ compilerOptions: {
    module: "ESNext", moduleResolution: "Bundler", strict: false, target: "ES2022", skipLibCheck: true,
  } }));
  write(root, "apps/server/tsconfig.json", JSON.stringify({
    extends: "../../tsconfig.base.json", compilerOptions: { noImplicitAny: true },
  }));
  write(root, "apps/web/tsconfig.json", JSON.stringify({
    extends: "../../tsconfig.base.json", compilerOptions: { noImplicitAny: false },
  }));
  write(root, "packages/runtime/src/concepts.ts", Object.values(LIVE_CONSUMERS)
    .map((operation) => `export function ${operation}(): string { return "${operation}"; }`).join("\n"));

  const serverImports: string[] = [];
  const serverCalls: string[] = [];
  let index = 0;
  for (const [file, operation] of Object.entries(LIVE_CONSUMERS)) {
    const wrapper = `consume${index}`;
    const implicit = kind === "crossed_config" && index === 0 ? ", leakedImplicitAny" : "";
    write(root, file, `import { ${operation} } from "@chess-tabiya/runtime/concepts";\nexport function ${wrapper}(${implicit.slice(2)}): string { void leakedImplicitAny; return ${operation}(); }\n`
      .replace("(): string { void leakedImplicitAny;", "(): string {"));
    if (file.startsWith("apps/server/")) {
      const relative = path.posix.relative("apps/server/src", file).replace(/\.ts$/u, ".js");
      const boundary = CONSUMER_BOUNDARIES[file as keyof typeof CONSUMER_BOUNDARIES];
      serverImports.push(`import { ${wrapper} } from "./${relative}";`);
      const wrapperCall = kind === "crossed_config" && index === 0 ? `${wrapper}(undefined)` : `${wrapper}()`;
      const call = `${boundary}(${wrapperCall});`;
      serverCalls.push(`function ${boundary}(value: string): void { void value; }\n${kind === "dormant_boundary" ? `function dormant${index}(): void { ${call} }` : call}`);
    }
    index += 1;
  }
  write(root, "apps/server/src/main.ts", `${serverImports.join("\n")}\n${serverCalls.join("\n")}\n`);
  write(root, "apps/web/src/main.ts", 'import App from "./App.svelte";\nvoid App;\n');
  const webBoundary = CONSUMER_BOUNDARIES["apps/web/src/lib/api.ts"];
  const webCall = `${webBoundary}(consume5());`;
  write(root, "apps/web/src/App.svelte", `<script lang="ts">import { consume5 } from "./lib/api.js"; function ${webBoundary}(value: string): void { void value; } ${kind === "dormant_boundary" ? `function dormant5(): void { ${webCall} }` : webCall}</script>\n`);

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
