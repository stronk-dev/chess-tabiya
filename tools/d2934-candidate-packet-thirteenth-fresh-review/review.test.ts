import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  CANDIDATE_COLLECTOR_PROJECTION_KEYS,
  compileCandidatePopulation,
  createCandidatePopulationServiceForTest,
  type CandidatePopulationRequest,
  type CandidatePopulationServiceLimits,
} from "../d2885-candidate-packet-twelfth-author-repair/model.js";

const SOURCE = readFileSync(
  new URL("../d2885-candidate-packet-twelfth-author-repair/model.ts", import.meta.url),
  "utf8",
);
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const request = Object.freeze({ beforeFen: INITIAL, ruleset: "standard" as const, scope: "events" as const });
const limits = (): CandidatePopulationServiceLimits => Object.freeze({
  maxEntries: 2,
  maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
  maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  maxCollectorsPerGroup: 4,
  maxConcurrent: 1,
  maxPending: 1,
  maxQueueWaitMs: 1_000,
  maxCompileMs: 5_000,
});

function functionBody(name: string, next: string): string {
  const start = SOURCE.indexOf(name);
  const end = SOURCE.indexOf(next, start + name.length);
  if (start < 0 || end < 0) throw new TypeError(`missing source boundary ${name}`);
  return SOURCE.slice(start, end);
}

describe("candidate packet thirteenth fresh independent review", () => {
  it("D2934 passes the complete prior memo instead of the collector's declared dependency image", () => {
    const sync = functionBody("function executeCandidateSync", "async function executeCandidateCooperatively");
    const cooperative = functionBody("async function executeCandidateCooperatively", "function inputFromOutcomes");
    expect(sync).toContain("memo: seal({ ...memo })");
    expect(cooperative).toContain("memo: seal({ ...memo })");
    expect(sync).not.toContain("dependencyMemo");
    expect(cooperative).not.toContain("dependencyMemo");
  });

  it("D2935 maps a collector-wide throw to the first projection of a multi-output declaration", () => {
    expect(CANDIDATE_COLLECTOR_PROJECTION_KEYS["event.structural"].length).toBeGreaterThan(1);
    const invoke = functionBody("function invokeCollector", "function normalizeCollector");
    expect(invoke).toContain("CANDIDATE_COLLECTOR_PROJECTION_KEYS[collectorId][0]");
    expect(invoke).not.toContain("collectorId, \"threw\"");
  });

  it("D2936 lets a new caller join an abandoned active job and reports the open service as closed", async () => {
    let release!: () => void;
    let announceStart!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const started = new Promise<void>((resolve) => { announceStart = resolve; });
    const service = createCandidatePopulationServiceForTest({
      limits: limits(),
      compile: async (value) => {
        announceStart();
        await gate; // Deliberately model one cooperative group that has not observed abort yet.
        return compileCandidatePopulation(value);
      },
    });
    const firstController = new AbortController();
    const first = service.get(request, firstController.signal);
    await started;
    firstController.abort();
    await expect(first).resolves.toEqual({ kind: "cancelled", reason: "caller_aborted" });

    const second = service.get(request, new AbortController().signal);
    release();
    await expect(second).resolves.toEqual({ kind: "failed", error: { code: "service_closed" } });
    expect(service.stats()).toMatchObject({ activeUniqueJobs: 0, failed: 1, lastWaiterCancellations: 1 });
    await service.close();
  });

  it("D2937 reports valid-FEN closed-shape and scope errors as invalid_fen", async () => {
    const service = createCandidatePopulationServiceForTest({ limits: limits() });
    const unknownScope = { ...request, scope: "invented" } as unknown as CandidatePopulationRequest;
    const extraKey = { ...request, ignored: true } as unknown as CandidatePopulationRequest;
    await expect(service.get(unknownScope, new AbortController().signal)).resolves.toMatchObject({
      kind: "failed",
      error: { code: "invalid_fen" },
    });
    await expect(service.get(extraKey, new AbortController().signal)).resolves.toMatchObject({
      kind: "failed",
      error: { code: "invalid_fen" },
    });
    await service.close();
  });

  it("D2938 walks the public receipt root and therefore charges the shared manifest per cache entry", () => {
    const measure = functionBody("export function measureRetainedReceipt", "function assertReceiptForRequest");
    expect(measure).toContain("visitRetained(receipt, state)");
    expect(measure).not.toContain("candidateInputs");
    expect(measure).not.toContain("legalMovesInput");
    expect(measure).not.toContain("packet,");
  });

  it("D2939 receipt assertion checks cardinality but omits exact legal, row, UCI and child-FEN joins", () => {
    const assertion = functionBody("export function assertCandidatePopulationReceipt", "export function compileCandidatePopulation");
    expect(assertion).toContain("receipt.packet.legalMoves.length !== receipt.candidateInputs.length");
    expect(assertion).not.toContain("assertDeclaredEvidence(receipt.legalMovesInput)");
    expect(assertion).not.toContain("receipt.packet.candidates[index]");
    expect(assertion).not.toContain("legalMoves.map");
    expect(assertion).not.toContain("afterFen");
  });

  it("D2940 hand-copies child reading keys and derives the positive expectation from that same map", () => {
    const declaration = functionBody("const CHILD_READING_KEYS", "export const CANDIDATE_PACKET_ABSTENTION_REASONS");
    expect(declaration).toContain('"rules.castling.reading.rights"');
    expect(declaration).toContain('"rules.king.reading.zone_state"');
    expect(declaration).not.toContain("PRIMARY_EVIDENCE_MANIFEST");
    expect(declaration).not.toContain("assert");
  });

  it("D2941 fails the repository compiler contract hidden by the author's private strict config", () => {
    const result = spawnSync(process.execPath, [
      "node_modules/typescript/bin/tsc",
      "-p",
      "tools/d2934-candidate-packet-thirteenth-fresh-review/strict-tsconfig.json",
      "--pretty",
      "false",
    ], { cwd: process.cwd(), encoding: "utf8" });
    expect(result.status).not.toBe(0);
    const diagnostics = `${result.stdout}${result.stderr}`;
    expect(diagnostics.match(/error TS2412/gu)).toHaveLength(2);
    expect(diagnostics).toContain("d2885-candidate-packet-twelfth-author-repair/model.ts");
  });
});
