// Synthetic retained reports, real registry/SQLite/RunService delivery. No provider truth or
// authored-content qualification is inferred from these deliberately fixed report values.
import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePresentationReceipt, presentedSentence } from "../../../packages/runtime/src/presentation-contract.js";
import { RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY, readRecordedReviewLedgerSource } from "../../../packages/runtime/src/recorded-review-ledger.js";
import { assertReviewMapResponse } from "../../web/src/lib/review-response.js";

import { recordedReviewLedgerFixture } from "./recorded-review-ledger.test-support.js";
import type { SQLiteRunStorage } from "./storage.js";

const AT = "2026-11-02T00:00:00.000Z";
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
async function fixture(...input: Parameters<typeof recordedReviewLedgerFixture>) {
  const result = await recordedReviewLedgerFixture(...input); stores.push(result.storage); return result;
}

describe("independent pinned Review ledger delivery", () => {
  it.each(["white", "black"] as const)("stages %s's complete original reports one projection at a time without publishing partial work", async side => {
    const f = await fixture(side), original = readRecordedReviewLedgerSource(f.service.resolveReviewMeasurementSource(f.context));
    const collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    const handle = f.service.beginReviewMeasurementSource(f.context);
    expect(collect).not.toHaveBeenCalled();
    expect(() => readRecordedReviewLedgerSource(handle as never)).toThrow(/owner/u);
    expect(() => f.service.finishReviewMeasurementSource(handle)).toThrow(/incomplete/u);
    for (let index = 0; index < f.run.nodes.length * 2; index++) {
      expect(f.service.advanceReviewMeasurementSource(handle)).toEqual({ nodeId: f.run.nodes[Math.floor(index / 2)]!.id,
        projection: index % 2 === 0 ? "recorded.engine.eval@1" : "recorded.tablebase.result@1",
        completedSubjects: Math.floor((index + 1) / 2), totalSubjects: f.run.nodes.length, complete: index === f.run.nodes.length * 2 - 1 });
      expect(collect).toHaveBeenCalledTimes(index + 1);
      if (index < f.run.nodes.length * 2 - 1) expect(() => f.service.finishReviewMeasurementSource(handle)).toThrow(/incomplete/u);
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    const source = f.service.finishReviewMeasurementSource(handle), actual = readRecordedReviewLedgerSource(source);
    expect(collect).toHaveBeenCalledTimes(6); // Complete issuance/read validates retained populations; it never recollects.
    expect(actual.boundary).toBe(original.boundary);
    expect(actual.permission).toEqual(original.permission);
    for (const [index, row] of actual.rows.entries()) {
      expect(row.position).toBe(original.rows[index]!.position);
      for (const [ordinal, slot] of row.slots.entries()) {
        expect(slot.outcome).toEqual(original.rows[index]!.slots[ordinal]!.outcome);
        expect(slot.data).toEqual(original.rows[index]!.slots[ordinal]!.data);
        for (const record of slot.data!.records) {
          expect(record.record).toBe(slot.data!.artifact.ledger.records[record.ordinal]);
          expect(record.source).toBe(slot.data!.artifact.manifest.entries[record.sourceOrdinal]);
        }
      }
    }
    expect(f.service.resolveReviewMeasurementSource(f.context)).toBe(source);
    expect(() => f.service.advanceReviewMeasurementSource(handle)).toThrow(/retired/u);
    expect(() => f.service.finishReviewMeasurementSource(handle)).toThrow(/retired/u);
    expect(f.service.cancelReviewMeasurementSource(handle)).toBe(false);
  });

  it.each(["empty", "absent", "invalid", "lookup_failed"] as const)("staged capture preserves the original %s outcome", async variant => {
    const f = await fixture("white", variant === "lookup_failed" ? "mixed" : variant);
    if (variant === "lookup_failed") vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockImplementation(() => { throw new Error("Synthetic registry failure"); });
    const handle = f.service.beginReviewMeasurementSource(f.context);
    for (let i = 0; i < 6; i++) f.service.advanceReviewMeasurementSource(handle);
    const image = readRecordedReviewLedgerSource(f.service.finishReviewMeasurementSource(handle));
    for (const row of image.rows) for (const slot of row.slots) expect(slot.outcome).toEqual(variant === "empty" ? { kind: "no_witness" }
      : variant === "absent" ? { kind: "unavailable", reason: "source_absent" }
      : { kind: "failed", reason: variant === "invalid" ? "source_contract_invalid" : "source_lookup_failed" });
  });

  it.each(["abort", "storage", "registry", "revoke", "role"] as const)("retires staged work when actual %s authority changes during acquisition", async change => {
    const f = await fixture(), reader = { learnerId: "staged-ledger-reader", handle: "staged-ledger-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: AT });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, AT);
    const context = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, f.signal.signal);
    const handle = f.service.beginReviewMeasurementSource(context), realCollect = f.registry.collectRecordedMeasurements.bind(f.registry);
    const collect = vi.spyOn(f.registry, "collectRecordedMeasurements").mockImplementation(input => {
      const population = realCollect(input);
      if (change === "abort") f.signal.abort();
      else if (change === "storage") vi.spyOn(f.storage, "read").mockReturnValue(undefined);
      else if (change === "registry") vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockReturnValue({ kind: "unavailable", reason: "source_absent" });
      else if (change === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      else f.storage.grantRole(f.run.id, reader.learnerId, "participant", f.lease, AT);
      return population;
    });
    expect(() => f.service.advanceReviewMeasurementSource(handle)).toThrow();
    expect(collect).toHaveBeenCalledTimes(1);
    expect(() => f.service.finishReviewMeasurementSource(handle)).toThrow(/retired/u);
    expect(f.service.cancelReviewMeasurementSource(handle)).toBe(false);
  });

  it("checks authority again during complete issuance, without allowing a cached source generation reset", async () => {
    const f = await fixture(), handle = f.service.beginReviewMeasurementSource(f.context);
    for (let i = 0; i < 6; i++) f.service.advanceReviewMeasurementSource(handle);
    const realRead = f.registry.readRecordedMeasurements.bind(f.registry);
    vi.spyOn(f.registry, "readRecordedMeasurements").mockImplementation(population => {
      const result = realRead(population); f.signal.abort(); return result;
    });
    expect(() => f.service.finishReviewMeasurementSource(handle)).toThrow();
    expect(f.service.cancelReviewMeasurementSource(handle)).toBe(false);
    const cached = await fixture(); cached.service.resolveReviewMeasurementSource(cached.context);
    vi.spyOn(cached.registry, "resolveRecordedMeasurementSource").mockReturnValue({ kind: "unavailable", reason: "source_absent" });
    expect(() => cached.service.beginReviewMeasurementSource(cached.context)).toThrow(/changed/u);
  });

  it("cancels incomplete work and rejects forged or foreign handles before collecting", async () => {
    const f = await fixture(), other = await fixture("black"), collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    const handle = f.service.beginReviewMeasurementSource(f.context);
    expect(() => other.service.advanceReviewMeasurementSource(handle)).toThrow(/foreign/u);
    expect(() => f.service.advanceReviewMeasurementSource({} as never)).toThrow(/foreign/u);
    expect(collect).not.toHaveBeenCalled();
    expect(f.service.cancelReviewMeasurementSource(handle)).toBe(true);
    expect(f.service.cancelReviewMeasurementSource(handle)).toBe(false);
    expect(() => f.service.advanceReviewMeasurementSource(handle)).toThrow(/retired/u);
    expect(collect).not.toHaveBeenCalled();
  });

  it.each(["white", "black"] as const)("delivers %s's historical measurements without modern or gradeable endpoints", async side => {
    const f = await fixture(side, "mixed", false), review = await f.service.review(f.run.id, f.principal);
    expect(review.coverage).toMatchObject({ evaluated: 0, positions: 3 });
    for (const row of review.rows) {
      expect(row.grade).toBeUndefined();
      const items = parsePresentationReceipt(row.packet);
      expect(items.filter(item => item.adapter.projection.id === "recorded.engine.eval")).toHaveLength(2);
      expect(items.filter(item => item.adapter.projection.id === "recorded.tablebase.result")).toHaveLength(1);
    }
    expect(review.accuracy.white.evaluated).toBe(0); expect(review.accuracy.black.evaluated).toBe(0);
    expect(f.registry.required(f.document.id).assessmentGrounding).toBe("unverified");
  });

  it("keeps an actual registry lookup failure distinct from absence without discarding modern facts", async () => {
    const f = await fixture();
    vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockImplementation(() => { throw new Error("Synthetic original registry lookup failure"); });
    const image = readRecordedReviewLedgerSource(f.service.resolveReviewMeasurementSource(f.context));
    for (const row of image.rows) for (const slot of row.slots) expect(slot.outcome).toEqual({ kind: "failed", reason: "source_lookup_failed" });
    const review = await f.service.review(f.run.id, f.principal);
    expect(review.coverage).toMatchObject({ evaluated: 3, positions: 3 });
    expect(review.rows[0]!.facts.join(" ")).toContain("source lookup failed");
  });

  it.each(["white", "black"] as const)("delivers all %s reports beside modern evidence with no grading promotion or mutation", async side => {
    const f = await fixture(side), before = JSON.stringify(f.storage.read(f.run.id)!.run);
    expect(f.registry.required(f.document.id).assessmentGrounding).toBe("unverified");
    const review = await f.service.review(f.run.id, f.principal);
    const wire: unknown = JSON.parse(JSON.stringify(review));
    expect(() => assertReviewMapResponse(wire, { runId: f.run.id, branchId: f.run.activeCursor.branchId })).not.toThrow();
    expect(JSON.stringify(wire)).not.toMatch(/synthetic-records\.json|sourceOrdinal|manifestDigest|ledgerDigest/u);
    expect(review.rows).toHaveLength(2);
    expect(review.coverage).toMatchObject({ evaluated: 3, positions: 3 });
    for (const row of review.rows) {
      const items = parsePresentationReceipt(row.packet);
      const engine = items.filter(item => item.adapter.projection.id === "recorded.engine.eval");
      const tablebase = items.filter(item => item.adapter.projection.id === "recorded.tablebase.result");
      expect(engine).toHaveLength(2); expect(tablebase).toHaveLength(1);
      expect(engine.map(presentedSentence)[0]).toBe(engine.map(presentedSentence)[1]); // duplicates stay
      expect(tablebase.map(presentedSentence).join(" ")).toContain("side to move");
      expect(tablebase.map(presentedSentence).join(" ")).not.toContain("White");
      expect([...engine, ...tablebase].every(item => item.adapter.consumer.id === "module.review_map" && item.adapter.consumer.version === 2)).toBe(true);
      expect(row.facts.join(" ")).toContain("1 historical engine reports and 1 recorded source abstentions");
      expect(row.facts.join(" ")).not.toMatch(/source_unavailable|ledger_record_not_admitted|recorded\.engine|\{\s*"/u);
    }
    expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(before);
  });

  it("retains root and all ordinals, factory refusals and abstentions without retargeting the root", async () => {
    const f = await fixture(), source = f.service.resolveReviewMeasurementSource(f.context), image = readRecordedReviewLedgerSource(source);
    expect(image.rows.map(row => row.position.payload.nodeId)).toEqual(f.run.nodes.map(node => node.id));
    for (const row of image.rows) {
      expect(row.slots.map(slot => slot.projection)).toEqual(["recorded.engine.eval@1", "recorded.tablebase.result@1"]);
      expect(row.slots[0]!.data!.counts).toMatchObject({ matchedRecords: 3, admittedRecords: 2, notAdmittedRecords: 1, abstentions: { source_unavailable: 1 } });
      expect(row.slots[0]!.data!.records.map(record => record.invocation.result.kind)).toEqual(["available", "available", "unavailable"]);
      for (const slot of row.slots) for (const record of slot.data!.records) {
        expect(record.record).toBe(slot.data!.artifact.ledger.records[record.ordinal]);
        expect(record.source).toBe(slot.data!.artifact.manifest.entries[record.sourceOrdinal]);
      }
    }
    expect((await f.service.review(f.run.id, f.principal)).rows.flatMap(row => parsePresentationReceipt(row.packet))
      .filter(item => item.adapter.projection.id === "recorded.engine.eval")).toHaveLength(4); // not root's extra two
  });

  it.each(["empty", "absent", "invalid"] as const)("keeps the actual %s source state and unrelated modern facts", async variant => {
    const f = await fixture("white", variant), image = readRecordedReviewLedgerSource(f.service.resolveReviewMeasurementSource(f.context));
    for (const row of image.rows) for (const slot of row.slots) expect(slot.outcome).toEqual(variant === "empty" ? { kind: "no_witness" }
      : variant === "absent" ? { kind: "unavailable", reason: "source_absent" } : { kind: "failed", reason: "source_contract_invalid" });
    const review = await f.service.review(f.run.id, f.principal);
    expect(review.coverage).toMatchObject({ evaluated: 3, positions: 3 });
    expect(review.rows.flatMap(row => parsePresentationReceipt(row.packet)).some(item => item.adapter.projection.id === "recorded.engine.eval")).toBe(false);
    expect(review.rows[0]!.facts.join(" ").includes("source records are invalid")).toBe(variant === "invalid");
  });

  it("rejects retained copies, cancelled reads, changed storage and replaced source artifacts", async () => {
    const f = await fixture(), source = f.service.resolveReviewMeasurementSource(f.context);
    expect(() => readRecordedReviewLedgerSource({ ...source })).toThrow(/owner/u);
    f.signal.abort(); expect(() => readRecordedReviewLedgerSource(source)).toThrow();
    const changed = await fixture(), retained = changed.service.resolveReviewMeasurementSource(changed.context);
    const read = vi.spyOn(changed.storage, "read").mockReturnValue(undefined);
    expect(() => readRecordedReviewLedgerSource(retained)).toThrow(); read.mockRestore();
    const swapped = await fixture(), original = swapped.service.resolveReviewMeasurementSource(swapped.context);
    vi.spyOn(swapped.registry, "resolveRecordedMeasurementSource").mockReturnValue({ kind: "unavailable", reason: "source_absent" });
    expect(() => readRecordedReviewLedgerSource(original)).toThrow(/changed/u);
  });

  it.each(["revoke", "role"] as const)("checks the real current %s before retained reports or absence can be published", async change => {
    const f = await fixture("white", change === "role" ? "absent" : "mixed");
    const reader = { learnerId: "review-ledger-reader", handle: "review-ledger-reader" };
    f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: AT });
    f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, AT);
    const context = f.service.resolveGradeRecordedContext(f.run.id, reader, null, f.query, f.signal.signal);
    const source = f.service.resolveReviewMeasurementSource(context);
    expect(readRecordedReviewLedgerSource(source).rows).toHaveLength(3);
    if (change === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    else f.storage.grantRole(f.run.id, reader.learnerId, "participant", f.lease, AT);
    expect(() => readRecordedReviewLedgerSource(source)).toThrow();
    expect(() => f.service.resolveReviewMeasurementSource(context)).toThrow();
  });

  it("requires the complete original positions and both refs under the genuine Review permission", async () => {
    const f = await fixture(), source = f.service.resolveReviewMeasurementSource(f.context);
    const image = readRecordedReviewLedgerSource(source), owned = f.service.readGradeRecordedContext(f.context);
    const capture: Parameters<typeof RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue>[0] = { boundary: owned.boundary,
      permission: owned.permission, signal: owned.signal, rows: image.rows.map(row => ({ position: row.position,
        slots: row.slots.map(slot => ({ projection: slot.projection, source: { kind: "population", read: slot.read! } })) })) };
    const check = () => { f.service.readGradeRecordedContext(f.context); };
    expect(readRecordedReviewLedgerSource(RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue(capture, check)).rows).toHaveLength(3);
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue(capture, () => true)).toThrow(/owner/u);
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ ...capture, rows: capture.rows.slice(1) }, check)).toThrow(/root/u);
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ ...capture, rows: [...capture.rows].reverse() }, check)).toThrow();
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ ...capture, rows: capture.rows.map(row => ({ ...row, slots: [...row.slots].reverse() })) }, check)).toThrow(/both/u);
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ ...capture, permission: { ...capture.permission, timing: "post_commit" } }, check)).toThrow(/Review/u);
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ ...capture, rows: capture.rows.map(row => ({ ...row, position: { ...row.position } })) }, check)).toThrow();
    const crossed = { ...capture, rows: capture.rows.map((row, index) => index !== 1 ? row : { ...row, slots: row.slots.map((slot, ordinal) => ordinal !== 0 ? slot : {
      ...slot, source: { kind: "population" as const, read: () => {
        const data = image.rows[index]!.slots[ordinal]!.data!;
        return { ...data, records: data.records.map((record, i) => i !== 0 ? record : { ...record, invocation: data.records[1]!.invocation }) };
      } },
    }) }) };
    expect(() => RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue(crossed, check)).toThrow(/lineage/u);
  });
});
