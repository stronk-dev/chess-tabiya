import { readdirSync, readFileSync } from "node:fs";

import { commitMove, createRun, type DrillRun, type RecordedSemanticPathResult } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { ServerError } from "./errors.js";
import { recordedSemanticPathOperation, type CompileRecordedSemanticPath } from "./recorded-semantic-path.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-09-24T00:00:00.000Z";
const ROOT = new URL("../../../", import.meta.url);
const owner = { learnerId: "learner-owner", handle: "owner" } as const;
const stranger = { learnerId: "learner-stranger", handle: "stranger" } as const;
const storages: SQLiteRunStorage[] = [];

afterEach(() => {
  for (const storage of storages.splice(0)) storage.close();
});

function fixture(): { readonly storage: SQLiteRunStorage; readonly run: DrillRun } {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
  storages.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  storage.createLearner({ id: stranger.learnerId, handle: stranger.handle, passwordHash: "!", createdAt: at });
  let run = createRun({ id: "recorded-path-run", packId: "fixture", packDigest: `sha256:${"d".repeat(64)}`, startFen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of ["b8a7", "c6a7", "e1e7"]) run = commitMove(run, move, { at }).run;
  storage.create(run, { writerId: "writer-owner", learnerId: owner.learnerId }, "Recorded path");
  return { storage, run };
}

/** Stand-ins for the injected Review and longitudinal builders: each keeps only the sealed identity. */
async function reviewBuilder(compile: CompileRecordedSemanticPath, runId: string, branchId: string) {
  const result = await compile({ principal: owner, runId, branchId });
  return result.kind === "available" ? { ids: result.events.map((event) => event.id), digest: result.digest } : result;
}
async function longitudinalBuilder(compile: CompileRecordedSemanticPath, runId: string, branchId: string) {
  const result = await compile({ principal: owner, runId, branchId });
  return result.kind === "available" ? { ids: result.events.map((event) => event.id), digest: result.digest } : result;
}

function productionSources(directory: URL): readonly { readonly path: string; readonly text: string }[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "dist") return [];
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return productionSources(child);
    return /\.(ts|svelte)$/u.test(entry.name) && !/\.test\.ts$/u.test(entry.name) ? [{ path: child.pathname, text: readFileSync(child, "utf8") }] : [];
  });
}

describe("recorded semantic path server operation", () => {
  it("[criterion 12] enforces read authority and delegates unchanged to the runtime compiler", async () => {
    const { storage, run } = fixture();
    const compile = recordedSemanticPathOperation(storage);
    expect(compile.name).toBe("compileRecordedSemanticPath");
    const result = await compile({ principal: owner, runId: run.id, branchId: run.activeCursor.branchId });
    expect(result.kind).toBe("available");
    if (result.kind === "available") expect(result.events.map((event) => `${event.projection.id}@${event.projection.version}`)).toEqual(expect.arrayContaining(["derived.tactic.deflection_observed@2", "derived.tactic.overload_exploitation_observed@2"]));
    await expect(compile({ principal: stranger, runId: run.id, branchId: run.activeCursor.branchId })).rejects.toThrowError(expect.objectContaining<Partial<ServerError>>({ code: "RUN_NOT_FOUND" }));
    await expect(compile({ principal: owner, runId: "absent", branchId: run.activeCursor.branchId })).rejects.toThrowError(expect.objectContaining<Partial<ServerError>>({ code: "RUN_NOT_FOUND" }));
    const unknown: RecordedSemanticPathResult = await compile({ principal: owner, runId: run.id, branchId: "absent" });
    expect(unknown).toMatchObject({ kind: "refused", reason: "unknown_branch" });
  });

  it("[criterion 12] exposes no public raw-evidence REST route", () => {
    const rest = readFileSync(new URL("apps/server/src/rest.ts", ROOT), "utf8");
    expect(rest).not.toMatch(/recorded-semantic-path|recordedSemanticPath|compileRecordedSemanticPath/u);
  });

  it("[criterion 11] gives Review and longitudinal builders byte-equal event identity and digest", async () => {
    const { storage, run } = fixture();
    const compile = recordedSemanticPathOperation(storage);
    const review = await reviewBuilder(compile, run.id, run.activeCursor.branchId);
    const longitudinal = await longitudinalBuilder(compile, run.id, run.activeCursor.branchId);
    expect(JSON.stringify(longitudinal)).toBe(JSON.stringify(review));
    expect("ids" in review && review.ids.length).toBeGreaterThan(0);
  });

  it("[criterion 13] keeps the RFC out of `implemented` until a production consumer call exists", () => {
    const defining = new Set([
      new URL("apps/server/src/recorded-semantic-path.ts", ROOT).pathname,
      new URL("packages/runtime/src/recorded-semantic-path.ts", ROOT).pathname,
      new URL("packages/runtime/src/index.ts", ROOT).pathname,
    ]);
    const callers = [new URL("apps/", ROOT), new URL("packages/", ROOT)]
      .flatMap(productionSources)
      .filter((source) => !defining.has(source.path) && /\b(?:recordedSemanticPathOperation|compileRecordedSemanticPath|recordedSemanticPath)\s*\(/u.test(source.text));
    const rfc = readFileSync(new URL("rfc/recorded-semantic-path.md", ROOT), "utf8");
    const status = rfc.match(/^- \*\*Status:\*\*\s*[*_`\s]*([a-z-]+)/mu)?.[1];
    expect(status).toBeDefined();
    if (callers.length === 0) expect(status).not.toBe("implemented");
    else expect(callers.map((source) => source.path)).not.toEqual([]);
  });
});
