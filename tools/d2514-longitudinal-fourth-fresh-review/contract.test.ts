// DISPOSABLE fresh-review falsifier — D2514-D2517. Not production code.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

const rfc = readFileSync("rfc/longitudinal-store.md", "utf8");
const application = readFileSync("apps/server/src/application.ts", "utf8");
const main = readFileSync("apps/server/src/main.ts", "utf8");
const serverPackage = JSON.parse(readFileSync("apps/server/package.json", "utf8")) as {
  readonly scripts: Readonly<Record<string, string>>;
};

function between(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  if (from < 0 || to < 0) throw new TypeError(`Missing review anchor: ${start} / ${end}`);
  return source.slice(from, to);
}

describe("D2514-D2517 longitudinal fourth-repair fresh review", () => {
  it("D2514 proves a multi-cut result has only one failure/retry/unavailable scalar", () => {
    const readContract = between(rfc, "type LongitudinalReadResult =", "readLongitudinalSnapshot(");
    const queryContract = between(rfc, "interface LongitudinalReadQuery", "type LongitudinalReadResult =");

    expect(queryContract).toContain("cuts: readonly { runId: string; requestedSeq: number }[]");
    expect(readContract.match(/failureCode:/gu)).toHaveLength(1);
    expect(readContract.match(/attempts:/gu)).toHaveLength(1);
    expect(readContract.match(/retryAt\?:/gu)).toHaveLength(1);
    expect(readContract.match(/reason:/gu)).toHaveLength(1);
    expect(readContract).not.toMatch(/cuts:\s*readonly\s*\{[^}]*status:/su);

    const actualCuts = Object.freeze([
      { runId: "bad-snapshot", state: "failed", failureCode: "snapshot_invalid", attempts: 1 },
      { runId: "bad-derive", state: "failed", failureCode: "derivation_failed", attempts: 3 },
    ] as const);
    expect(new Set(actualCuts.map((cut) => `${cut.failureCode}:${cut.attempts}`)).size).toBe(2);
  });

  it("D2515 proves independent default in-memory SQLite connections share no schema or rows", () => {
    expect(application).toContain('options.databasePath ?? ":memory:"');
    expect(rfc).toContain("the thread opens its own SQLite connection");

    const httpConnection = new DatabaseSync(":memory:");
    const workerConnection = new DatabaseSync(":memory:");
    httpConnection.exec("CREATE TABLE learner_observation_jobs(run_id TEXT PRIMARY KEY) STRICT; INSERT INTO learner_observation_jobs VALUES ('run');");
    const workerTables = workerConnection.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all();
    expect(workerTables).toEqual([]);
    httpConnection.close();
    workerConnection.close();
  });

  it("D2516 finds no shared constructor for the source digest authority", () => {
    const sourceBoundary = between(rfc, "Every persisted run mutation upserts", "A worker claims bounded batches");
    expect(sourceBoundary).toContain("The digest is SHA-256 over the canonical contiguous event prefix");
    expect(sourceBoundary).not.toMatch(/(?:function|const|class|interface)\s+\w*SourceDigest/iu);
    expect(sourceBoundary).not.toMatch(/domain(?:Separator|Prefix)|canonicalJson|utf-?8/iu);

    const authorModel = readFileSync("tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts", "utf8");
    expect(authorModel).not.toMatch(/export\s+(?:function|const)\s+\w*SourceDigest/iu);
    expect(authorModel).toContain("readonly sourceDigest: string");
  });

  it("D2517 closes neither application lifecycle/readiness nor the emitted worker artifact", () => {
    const applicationInterface = between(application, "export interface ChessTabiyaApplication", "const CONTENT_TYPES");
    expect(applicationInterface).toContain("close(): Promise<void>");
    expect(applicationInterface).not.toMatch(/\bstart\(\)|\bstop\(\)/u);
    expect(main).not.toMatch(/application\.(?:start|stop)\(/u);
    expect(application).toContain('url.pathname === "/healthz"');
    expect(application).toContain('Response.json({ status: "ok", engineMode })');

    const build = serverPackage.scripts.build ?? "";
    expect(rfc).toContain('new Worker(new URL("./longitudinal-worker-thread.js", import.meta.url))');
    expect(build).not.toContain("src/longitudinal-worker-thread.ts");
  });
});
