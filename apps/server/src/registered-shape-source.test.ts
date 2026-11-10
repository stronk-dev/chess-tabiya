import { afterEach, describe, expect, it, vi } from "vitest";
import * as runtime from "@chess-tabiya/runtime";
import * as schema from "@chess-tabiya/schema/shape-entry";
import * as validation from "./shape-validation.js";
import * as currentPredicate from "../../../packages/runtime/src/structural-evidence.js";
import { readAuthoredStructuralConditionSource } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import * as firings from "../../../packages/runtime/src/shape-firing.js";
import * as providerJson from "../../../packages/runtime/src/provider-digest.js";
import { assertRegisteredShapeRecordsCurrent, createRegisteredShapeSourceOwner, readRegisteredShapeSource, snapshotRegisteredShapeRecords, type RegisteredShapeRecordImage, type RegisteredShapeSource } from "../../../packages/runtime/src/registered-shape-source.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { ShapeRegistry } from "./shape-registry.js";

afterEach(() => vi.restoreAllMocks());
const signal = () => new AbortController().signal;
async function fixture(id = "mechanical-knight-location") {
  const registry = new ShapeRegistry(), document = registeredShapeFixture(id);
  expect(validation.validateShapeEntry(document).valid).toBe(true);
  const record = await registry.add(document, "official"); return { registry, document, record };
}

describe("actual registered shape source admission and ownership", () => {
  it("D4083 checks unchanged frozen record identity without serializing the whole registry on every retained read", async () => {
    const f = await fixture(), source = await f.registry.captureRegisteredTriggers(signal());
    readRegisteredShapeSource(source);
    const canonical = vi.spyOn(providerJson, "canonicalProviderJson");
    for (let index = 0; index < 20; index++) expect(readRegisteredShapeSource(source)[0]!.recordIdentity).toBe(f.record);
    expect(canonical).not.toHaveBeenCalled();
    await f.registry.add(f.document, "official");
    expect(() => readRegisteredShapeSource(source)).toThrow(/no longer current/);
  });

  it("D4083 immutable identity reuse still rejects changed projected bytes and metadata under the same record", async () => {
    const f = await fixture();
    const row: RegisteredShapeRecordImage = { recordIdentity: f.record, document: f.record.document, digest: f.record.digest,
      summary: { id: f.record.document.id, version: f.record.document.version, digest: f.record.digest }, channel: "official", publisherHandle: null };
    const captured = snapshotRegisteredShapeRecords([row]);
    assertRegisteredShapeRecordsCurrent(captured, [row]);
    for (const changed of [
      { ...row, document: Object.freeze({ ...row.document, name: "Changed projected bytes" }) },
      { ...row, channel: "community" as const }, { ...row, publisherHandle: "another-author" },
      { ...row, summary: { ...row.summary, version: "1.0.1" } },
    ]) expect(() => assertRegisteredShapeRecordsCurrent(captured, [changed])).toThrow();
  });

  it("admits the complete immutable active registry, preserving source attribution and original identity", async () => {
    const f = await fixture(), second = registeredShapeFixture("another-fixture"); await f.registry.add(second, "community", "test-author");
    const fire = vi.spyOn(firings, "shapeFirings"), source = await f.registry.captureRegisteredTriggers(signal()), rows = readRegisteredShapeSource(source);
    expect(rows.map(row => row.document.id)).toEqual([second.id, f.document.id]);
    expect(rows[1]!.recordIdentity).toBe(f.record); expect(rows[1]!.document).not.toBe(f.record.document);
    expect(rows[1]!.document).toEqual(f.record.document); expect(rows[1]!.publisherHandle).toBeNull();
    expect(rows[0]).toMatchObject({ channel: "community", publisherHandle: "test-author" });
    expect(Object.isFrozen(rows)).toBe(true); expect(Object.isFrozen(rows[1]!.document.trigger)).toBe(true);
    expect(fire).not.toHaveBeenCalled(); f.registry.assertRegisteredTriggersCurrent(source);
  });

  it("admits an actual installed empty registry instead of fabricating absence", async () => {
    const registry = new ShapeRegistry(), source = await registry.captureRegisteredTriggers(signal());
    expect(readRegisteredShapeSource(source)).toEqual([]); registry.assertRegisteredTriggersCurrent(source);
  });

  it("uses active records, not obsolete byDigest records or shadowed community additions", async () => {
    const f = await fixture(), old = f.record, document = { ...f.document, version: "1.0.1" };
    const current = await f.registry.add(document, "official"); await f.registry.add({ ...document, name: "Shadowed" }, "community", "other");
    expect(f.registry.byDigest(old.digest)).toBe(old);
    const rows = readRegisteredShapeSource(await f.registry.captureRegisteredTriggers(signal()));
    expect(rows).toHaveLength(1); expect(rows[0]!.recordIdentity).toBe(current); expect(rows[0]!.document.version).toBe("1.0.1");
  });

  it("checks all document digests before any validator admission probe", async () => {
    const f = await fixture("a-valid"); await f.registry.add(registeredShapeFixture("z-invalid-digest"), "official", undefined, `sha256:${"0".repeat(64)}`);
    const validate = vi.spyOn(validation, "validateShapeEntry"), probe = vi.spyOn(runtime, "evaluateAuthoredStructuralPredicate"), fire = vi.spyOn(firings, "shapeFirings");
    await expect(f.registry.captureRegisteredTriggers(signal())).rejects.toThrow(/digest mismatch/u);
    expect(validate).not.toHaveBeenCalled(); expect(probe).not.toHaveBeenCalled(); expect(fire).not.toHaveBeenCalled();
  });

  it("refuses a schema-invalid record at add admission and still probes the unchanged valid registry", async () => {
    const f = await fixture("a-valid");
    await expect(f.registry.add({ ...registeredShapeFixture("z-invalid-schema"), version: "not-semver" }, "official")).rejects.toMatchObject({ code: "PACK_INVALID" });
    expect(f.registry.get("z-invalid-schema")).toBeUndefined();
    const validate = vi.spyOn(validation, "validateShapeEntry"), probe = vi.spyOn(currentPredicate, "declareCurrentStructuralPredicateEvidence"), fire = vi.spyOn(firings, "shapeFirings");
    const source = await f.registry.captureRegisteredTriggers(signal());
    expect(readRegisteredShapeSource(source).map(row => row.document.id)).toEqual(["a-valid"]);
    expect(validate.mock.calls.map(row => (row[0] as { id: string }).id)).toEqual(["a-valid"]);
    expect(probe.mock.calls.some(row => readAuthoredStructuralConditionSource(row[1]).origin.documentId === "a-valid")).toBe(true); expect(fire).not.toHaveBeenCalled();
  });

  it.each(["replace", "add", "cancel"] as const)("refuses actual %s during the first asynchronous digest", async fault => {
    const f = await fixture(), controller = new AbortController(), document = registeredShapeFixture("another-fixture"), digest = await schema.digestShapeEntry(document);
    const validate = vi.spyOn(validation, "validateShapeEntry");
    const pending = f.registry.captureRegisteredTriggers(controller.signal);
    if (fault === "replace") await f.registry.add(f.document, "official", undefined, f.record.digest);
    if (fault === "add") await f.registry.add(document, "official", undefined, digest);
    if (fault === "cancel") controller.abort();
    await expect(pending).rejects.toThrow();
    // The concurrent add validates its own input. The retired capture never reaches its probes.
    expect(validate).toHaveBeenCalledTimes(fault === "cancel" ? 0 : 1);
  });

  it("revalidates after the existing admission validator before issuing", async () => {
    const f = await fixture(), validate = validation.validateShapeEntry;
    vi.spyOn(validation, "validateShapeEntry").mockImplementationOnce((...args) => {
      const result = validate(...args); void f.registry.add(f.document, "official", undefined, f.record.digest); return result;
    });
    await expect(f.registry.captureRegisteredTriggers(signal())).rejects.toThrow(/no longer current/u);
  });

  it("independently checks digest/currentness in the runtime owner, not a reader approval", async () => {
    const f = await fixture(), recordIdentity = {}, wrong: RegisteredShapeRecordImage = { recordIdentity, document: f.document,
      digest: `sha256:${"0".repeat(64)}`, summary: { id: f.document.id, version: f.document.version, digest: `sha256:${"0".repeat(64)}` }, channel: "official", publisherHandle: null };
    const owner = createRegisteredShapeSourceOwner({ capture: async () => [wrong], current: () => [wrong] });
    await expect(owner.capture(signal())).rejects.toThrow(/digest mismatch/u);
    const right = { ...wrong, digest: f.record.digest, summary: { ...wrong.summary, digest: f.record.digest } };
    let current = right;
    const actual = createRegisteredShapeSourceOwner({ capture: async () => [right], current: () => [current] });
    const pending = actual.capture(signal()); current = { ...right, recordIdentity: {} };
    await expect(pending).rejects.toThrow(/no longer current/u);
    expect(Object.isFrozen(recordIdentity)).toBe(false);
  });

  it("rejects copies and a genuine same-byte foreign registry before source use", async () => {
    const f = await fixture(), other = await fixture(), source = await f.registry.captureRegisteredTriggers(signal());
    const foreign = await other.registry.captureRegisteredTriggers(signal());
    expect(readRegisteredShapeSource(source).map(row => row.digest)).toEqual(readRegisteredShapeSource(foreign).map(row => row.digest));
    expect(() => f.registry.assertRegisteredTriggersCurrent(foreign)).toThrow(/foreign registry/u);
    for (const copy of [{ ...source }, Object.create(source), readRegisteredShapeSource(source)]) expect(() => readRegisteredShapeSource(copy as RegisteredShapeSource)).toThrow();
  });

  it.each(["replace", "add"] as const)("retires retained sources on actual %s, even equal bytes", async fault => {
    const f = await fixture(), source = await f.registry.captureRegisteredTriggers(signal());
    if (fault === "replace") await f.registry.add(f.document, "official"); else await f.registry.add(registeredShapeFixture("another-fixture"), "official");
    expect(() => f.registry.assertRegisteredTriggersCurrent(source)).toThrow(/no longer current/u);
    expect(() => readRegisteredShapeSource(source)).toThrow(/no longer current/u);
  });

  it("rejects pre-cancelled and missing signals before admission work", async () => {
    const f = await fixture(), controller = new AbortController(); controller.abort(); const validate = vi.spyOn(validation, "validateShapeEntry");
    await expect(f.registry.captureRegisteredTriggers(controller.signal)).rejects.toThrow();
    await expect(f.registry.captureRegisteredTriggers(undefined as unknown as AbortSignal)).rejects.toThrow(); expect(validate).not.toHaveBeenCalled();
  });

  it("refuses incomplete, duplicate, mismatched and accessor-bearing record envelopes", async () => {
    const f = await fixture(), rows = readRegisteredShapeSource(await f.registry.captureRegisteredTriggers(signal())), row = rows[0]!;
    const sparse = Array<RegisteredShapeRecordImage>(1), accessor = Object.defineProperty({ ...row }, "digest", { get: () => row.digest });
    for (const invalid of [sparse, [row, row], [{ ...row, summary: { ...row.summary, id: "wrong" } }], [accessor]]) expect(() => snapshotRegisteredShapeRecords(invalid)).toThrow();
  });
});
