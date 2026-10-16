import { afterEach, describe, expect, it, vi } from "vitest";
import { createRun } from "./runtime.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeRecordedMeasurementReading, recordedMeasurementPosition } from "./recorded-measurement.js";
import { invokeRunRecordPosition } from "./evidence-operations.js";
import * as routes from "./internal/evidence-value-routes.js";
import type { SourcingLedgerRecord } from "./recorded-reading.js";

const fen = "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1";
const pin = `sha256:${"a".repeat(64)}`;
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
function packRun(digest = pin) {
  return createRun({ id: "measurement-origin", session: { kind: "pack", packId: "synthetic", packDigest: digest,
    start: { fen, side: "white" }, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } },
  sessionDigest: digest, policyConfig, seed: 1 });
}
function report(kind: "engine_eval" | "tablebase_result", grounds = "machine_validation"): SourcingLedgerRecord {
  return { kind, anchor: { fen }, sourceId: "synthetic-report", retrievedAt: "2026-10-16T00:00:00.000Z", grounds, supports: [],
    values: kind === "engine_eval" ? { centipawns: 20, perspective: "white", depth: 8, multiPv: 1, engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture" }
      : { category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 4, checkmate: false, stalemate: false, insufficient_material: false } };
}
afterEach(() => vi.restoreAllMocks());

describe("original recorded measurement invocations, not source or access issuance", () => {
  it("retains the sole position mint's original pack pin and run/head/node without changing its payload", () => {
    const run = packRun(), position = invokeRunRecordPosition(run, run.activeCursor.nodeId);
    const origin = recordedMeasurementPosition(position);
    expect(origin).toMatchObject({ runId: run.id, nodeId: run.activeCursor.nodeId, pack: { id: "synthetic", digest: pin } });
    expect(position.payload).toEqual({ nodeId: run.activeCursor.nodeId, ply: 0, fen });
    expect(recordedMeasurementPosition(position)).toBe(origin);
    expect(Object.isFrozen(origin)).toBe(true);
    expect(Object.isFrozen(origin.pack)).toBe(true);
    const other = packRun(`sha256:${"b".repeat(64)}`);
    expect(recordedMeasurementPosition(invokeRunRecordPosition(other, other.activeCursor.nodeId)).pack?.digest).not.toBe(origin.pack?.digest);
    for (const forged of [{ ...position }, JSON.parse(JSON.stringify(position)), {}, null, invokeRecordedMeasurementReading(report("engine_eval")).ledger]) {
      expect(() => recordedMeasurementPosition(forged as typeof position)).toThrow();
    }
  });

  it("retains genuine non-pack position identity without borrowing an installed pack", () => {
    const run = createRun({ id: "native-measurement", session: { kind: "position", start: { fen, side: "white" },
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: pin, policyConfig, seed: 1 });
    expect(recordedMeasurementPosition(invokeRunRecordPosition(run, run.activeCursor.nodeId)).pack).toBeNull();
  });

  it.each(["engine_eval", "tablebase_result"] as const)("retains actual %s ledger, available result and refusal", kind => {
    const record = report(kind), a = invokeRecordedMeasurementReading(record);
    const b = invokeRecordedMeasurementReading(structuredClone(record));
    expect(a.ledger.payload).toBe(record);
    expect(a.ledger).not.toBe(b.ledger);
    expect(a.result).not.toBe(b.result);
    expect(routes.readRecordedReadingInvocation(a.result).ledger).toBe(a.ledger);
    expect(routes.readRecordedReadingInvocation(b.result).ledger).toBe(b.ledger);
    expect(a.result.kind).toBe("available");
    if (a.result.kind !== "available") throw new Error("synthetic report must be admitted");
    expect(evidenceValueReceipt(a.result.value).sourceDigests).toEqual([evidenceValueReceipt(a.ledger).payloadDigest]);
    const refused = invokeRecordedMeasurementReading(report(kind, "citable_source"));
    expect(refused.result).toEqual({ kind: "unavailable", reason: "ledger_record_not_admitted" });
    expect(routes.readRecordedReadingInvocation(refused.result).ledger).toBe(refused.ledger);
  });

  it.each(["engine_eval", "tablebase_result"] as const)("rejects crossed or copied %s invocation results even when payload digests agree", kind => {
    const record = report(kind), original = invokeRecordedMeasurementReading(record);
    const equal = structuredClone(record);
    const actual = routes.invokeEvidenceValueRoute;
    const expected = kind === "engine_eval" ? "recorded.engine.eval@1" : "recorded.tablebase.result@1";
    for (const result of [original.result, { ...original.result }]) {
      const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) =>
        route === expected ? result : actual(route as never, input)) as typeof actual);
      try { expect(() => invokeRecordedMeasurementReading(equal)).toThrow(/invocation|lineage/); }
      finally { spy.mockRestore(); }
    }
    const refused = invokeRecordedMeasurementReading(report(kind, "citable_source"));
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) =>
      route === expected ? refused.result : actual(route as never, input)) as typeof actual);
    try { expect(() => invokeRecordedMeasurementReading(report(kind, "citable_source"))).toThrow(/lineage/); }
    finally { spy.mockRestore(); }
  });

  it("rejects an unsupported kind before either factory", () => {
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => invokeRecordedMeasurementReading({ ...report("engine_eval"), kind: "citable_text" })).toThrow(/exact engine/);
    expect(spy).not.toHaveBeenCalled();
  });
});
