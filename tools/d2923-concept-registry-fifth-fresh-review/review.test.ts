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
  ReadyStorage,
  ValidatedPackArtifactSnapshot,
} from "../d2904-concept-registry-fourth-author-repair/model.js";

const fixture = JSON.parse(
  readFileSync("schemas/drill_pack.example.json", "utf8"),
) as DrillPackDefinition;

describe("concept registry fifth fresh independent review", () => {
  test("D2923 public issuance bypasses the only-startup readiness authority", () => {
    const database = db(25);
    const ready = ReadyStorage.issue(database);
    expect(ready.userVersion()).toBe(25);
  });

  test("D2924 raw migration access can commit data and strand the version outside rollback", () => {
    const database = db(25);
    expect(() =>
      finishConceptStartup({
        database,
        prerequisiteVersion: 25,
        conceptVersion: 26,
        compileRegistry: () => Object.freeze({ digest: "registry" }),
        loadPackArtifacts: () => [],
        migrateInsideTransaction: (connection) => {
          connection.exec("INSERT INTO migration_effects VALUES ('escaped')");
          connection.exec("COMMIT");
        },
      }),
    ).toThrow(/no transaction is active/u);
    expect(database.prepare("SELECT value FROM migration_effects").all()).toEqual([
      { value: "escaped" },
    ]);
    expect(userVersion(database)).toBe(26);
  });

  test("D2925 matching hashes admit a complete document that pack validation rejects", () => {
    const invalid = structuredClone(fixture) as DrillPackDefinition & {
      formatVersion: string;
    };
    invalid.formatVersion = "not-a-pack-version";
    const claimedDigest = digest(invalid);
    const snapshot = ValidatedPackArtifactSnapshot.compile([
      { source: "persisted-json", document: invalid, claimedDigest },
    ]);
    expect(snapshot.byDigest(claimedDigest)?.document.formatVersion).toBe(
      "not-a-pack-version",
    );
  });

  test("D2926 a receipt-less already-versioned database mints readiness", () => {
    const database = db(26);
    const ready = finishConceptStartup({
      database,
      prerequisiteVersion: 25,
      conceptVersion: 26,
      compileRegistry: () => Object.freeze({ digest: "registry" }),
      loadPackArtifacts: () => [],
      migrateInsideTransaction: () => undefined,
    });
    expect(ready.userVersion()).toBe(26);
    expect(
      database
        .prepare(
          "SELECT count(*) AS count FROM sqlite_master WHERE type='table' AND name='concept_migration_receipts'",
        )
        .get(),
    ).toEqual({ count: 0 });
  });

  test("D2927 the promised main-to-Svelte-to-api production chain is not traversable", () => {
    const repository = repositoryFixture("svelte_chain");
    expect(() =>
      assertReachableConsumerOperationsFromRepository(
        repository.root,
        repository.commit,
      ),
    ).toThrow(/compiler-diagnostics|unreachable-module/u);
  });

  test("D2928 every registered result may be discarded while closure passes", () => {
    const repository = repositoryFixture("discarded_results");
    const receipt = assertReachableConsumerOperationsFromRepository(
      repository.root,
      repository.commit,
    );
    expect(receipt.operations).toHaveLength(Object.keys(LIVE_CONSUMERS).length);
    expect(
      git(repository.root, ["show", `${repository.commit}:apps/server/src/main.ts`]),
    ).toMatch(/consume0\(\);/u);
    expect(
      git(repository.root, ["show", `${repository.commit}:apps/web/src/main.ts`]),
    ).toMatch(/consume5\(\);/u);
  });
});

function db(version: number): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec(
    `CREATE TABLE migration_effects (value TEXT NOT NULL) STRICT; PRAGMA user_version = ${version}`,
  );
  return database;
}

function userVersion(database: DatabaseSync): number {
  return Number(
    (database.prepare("PRAGMA user_version").get() as { user_version: number })
      .user_version,
  );
}

function digest(document: DrillPackDefinition): string {
  return `sha256:${createHash("sha256")
    .update(canonicalizeJson(document))
    .digest("hex")}`;
}

function repositoryFixture(kind: "svelte_chain" | "discarded_results") {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-fifth-review-"));
  write(
    root,
    "tsconfig.base.json",
    JSON.stringify({
      compilerOptions: {
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        target: "ES2022",
        skipLibCheck: true,
      },
    }),
  );
  write(
    root,
    "apps/server/tsconfig.json",
    JSON.stringify({ extends: "../../tsconfig.base.json" }),
  );
  write(
    root,
    "apps/web/tsconfig.json",
    JSON.stringify({ extends: "../../tsconfig.base.json" }),
  );
  write(
    root,
    "packages/runtime/src/concepts.ts",
    Object.values(LIVE_CONSUMERS)
      .map(
        (operation) =>
          `export function ${operation}(): string { return "${operation}"; }`,
      )
      .join("\n"),
  );

  const serverImports: string[] = [];
  const serverCalls: string[] = [];
  for (const [index, [file, operation]] of Object.entries(LIVE_CONSUMERS).entries()) {
    const name = `consume${index}`;
    write(
      root,
      file,
      `import { ${operation} } from "@chess-tabiya/runtime/concepts";\nexport function ${name}(): string { return ${operation}(); }\n`,
    );
    if (file.startsWith("apps/server/")) {
      serverImports.push(
        `import { ${name} } from "./${path.posix
          .relative("apps/server/src", file)
          .replace(/\.ts$/u, ".js")}";`,
      );
      serverCalls.push(`${name}();`);
    }
  }
  write(
    root,
    "apps/server/src/main.ts",
    `${serverImports.join("\n")}\n${serverCalls.join("\n")}\n`,
  );

  if (kind === "svelte_chain") {
    write(
      root,
      "apps/web/src/main.ts",
      'import App from "./App.svelte";\nvoid App;\n',
    );
    write(
      root,
      "apps/web/src/App.svelte",
      '<script lang="ts">import { consume5 } from "./lib/api.js"; consume5();</script>\n',
    );
    write(
      root,
      "apps/web/src/svelte.d.ts",
      'declare module "*.svelte" { const component: unknown; export default component; }\n',
    );
  } else {
    write(
      root,
      "apps/web/src/main.ts",
      'import { consume5 } from "./lib/api.js";\nconsume5();\n',
    );
  }

  git(root, ["init", "--quiet"]);
  git(root, ["add", "."]);
  git(root, [
    "-c",
    "user.name=Tabiya",
    "-c",
    "user.email=tabiya@example.invalid",
    "commit",
    "--quiet",
    "-m",
    "fixture",
  ]);
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
