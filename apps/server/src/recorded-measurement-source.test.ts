import { createHash } from "node:crypto";
import { canonicalizeJson, digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { buildPositionEvidenceIndex } from "./position-evidence.js";
import { forgedMeasurement, measurementFixture, originalMeasurement } from "./recorded-measurement.test-support.js";

describe("registry-owned original measurement artifacts", () => {
  it("retains all original rows, source links and abstentions independently of objective grading", async () => {
    const f = await measurementFixture();
    const registry = await PackRegistry.fromDocuments([{ source: "provided", value: f.document, ledger: f.ledger, manifest: f.manifest }]);
    const { source, image } = originalMeasurement(registry, f.digest);
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "available", source });
    expect(registry.readRecordedMeasurementSource(source)).toBe(image);
    expect(image.document).toBe(registry.required(f.document.id).document);
    expect(image.document).not.toBe(f.document);
    expect(image.ledger).toEqual(f.ledger);
    expect(image.manifest).toEqual(f.manifest);
    expect(image.ledger).not.toBe(f.ledger);
    expect(image.sidecars).toMatchObject({ ledger: { origin: { kind: "provided" }, read: { kind: "loaded", value: image.ledger } }, manifest: { read: { kind: "loaded" } } });
    expect(image.records.map(row => [row.ordinal, row.sourceOrdinal])).toEqual([[0, 1], [1, 1], [2, 0], [3, 0]]);
    for (const row of image.records) {
      expect(row.record).toBe(image.ledger.records[row.ordinal]);
      expect(row.source).toBe(image.manifest.entries[row.sourceOrdinal]);
      expect(Object.isFrozen(row.record.values)).toBe(true);
    }
    expect(image.records[0]!.record).not.toBe(image.records[1]!.record);
    expect(image.records[2]!.record.grounds).toBe("citable_source");
    expect(image.abstentions[0]).toEqual({ ordinal: 0, abstention: f.ledger.abstentions[0], sourceOrdinal: 0, source: f.manifest.entries[0] });
    expect(image.abstentions[0]!.abstention).toBe(image.ledger.abstentions[0]);
    for (const value of [source, image, image.records, image.records[0], image.ledger, image.manifest, image.document.start]) expect(Object.isFrozen(value)).toBe(true);
    expect(image.ledgerDigest).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(image.manifestDigest).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(registry.required(f.document.id).assessmentGrounding).toBe("unverified");
    expect(registry.required(f.document.id).recordedEvidence).toEqual({ state: "unverified" });
    expect(registry.required(f.document.id).positionEvidence.size).toBe(0);
  });

  it("detaches artifacts without freezing the caller and refuses copies, casts and other registries", async () => {
    const f = await measurementFixture();
    const input = { source: "provided", value: f.document, ledger: f.ledger, manifest: f.manifest };
    const registry = await PackRegistry.fromDocuments([input]);
    const other = await PackRegistry.fromDocuments([input]);
    const { source, image } = originalMeasurement(registry, f.digest);
    const saved = structuredClone(image);
    f.document.title = "Changed caller";
    (f.ledger.records[0]!.values as Record<string, unknown>).centipawns = 999;
    (f.manifest.entries[0] as unknown as { sourceId: string }).sourceId = "changed-caller";
    expect(image).toEqual(saved);
    expect(Object.isFrozen(f.document)).toBe(false);
    expect(Object.isFrozen(f.ledger)).toBe(false);
    for (const fake of [null, {}, { ...source }, JSON.parse(JSON.stringify(source)), Object.create(source), image, registry.required(f.document.id), originalMeasurement(other, f.digest).source]) {
      expect(() => registry.readRecordedMeasurementSource(forgedMeasurement(fake))).toThrow(/foreign/);
    }
    expect(() => other.readRecordedMeasurementSource(source)).toThrow(/foreign/);
  });

  it.each(["packId", "packVersion", "packDigest"] as const)("requires an exact %s, not just validator shape", async key => {
    for (const missing of [false, true]) {
      const f = await measurementFixture();
      const ledger = { ...f.ledger, [key]: "wrong" };
      if (missing) delete ledger[key];
      const registry = await PackRegistry.fromDocuments([{ source: "provided", value: f.document, ledger, manifest: f.manifest }]);
      expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
      expect(registry.required(f.document.id)).toBeDefined();
    }
  });

  it.each([
    "ledger-shape", "manifest-shape", "source-link", "timestamp", "duplicate-source", "licence", "unused-source", "non-json",
  ])("retains %s as invalid, never absence or boot failure", async variant => {
    const f = await measurementFixture();
    let ledger: any = structuredClone(f.ledger), manifest: any = structuredClone(f.manifest);
    if (variant === "ledger-shape") ledger = null;
    if (variant === "manifest-shape") manifest = null;
    if (variant === "source-link") ledger.records[0].sourceId = "unlinked";
    if (variant === "timestamp") ledger.records[0].retrievedAt = "2026-10-15T00:00:00.000Z";
    if (variant === "duplicate-source") manifest.entries.push(structuredClone(manifest.entries[0]));
    if (variant === "licence") manifest.entries[0].licence.spdx = "unlicensed";
    if (variant === "unused-source") manifest.entries.push({ ...manifest.entries[0], sourceId: "unused" });
    if (variant === "non-json") ledger.records[0].values.notJson = undefined;
    const registry = await PackRegistry.fromDocuments([{ source: "provided", value: f.document, ledger, manifest }]);
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
    expect(registry.required(f.document.id).assessmentGrounding).toBe("unverified");
  });

  it("uses only the actual final registration's artifact state and never same-id or supplied verification flags", async () => {
    const f = await measurementFixture();
    for (const sidecars of [{}, { ledger: f.ledger }, { manifest: f.manifest }]) {
      const registry = await PackRegistry.fromDocuments([{ source: "missing", value: f.document, ...sidecars, verified: true, failure: "read_failed" } as any]);
      expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "unavailable", reason: "source_absent" });
    }
    const registry = await PackRegistry.fromDocuments([
      { source: "initial", value: f.document, ledger: f.ledger, manifest: f.manifest },
      { source: "replacement", value: f.document },
    ], { replaceDuplicates: true });
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "unavailable", reason: "source_absent" });
    const official = await PackRegistry.fromDocuments([
      { source: "official", value: f.document, ledger: f.ledger, manifest: f.manifest },
      { source: "ignored-community", value: f.document, channel: "community" },
    ]);
    expect(originalMeasurement(official, f.digest).image.ledger).toEqual(f.ledger);
    expect(official.resolveRecordedMeasurementSource(`sha256:${"f".repeat(64)}`)).toEqual({ kind: "unavailable", reason: "source_absent" });
    for (const key of [f.document.id, "sha256:short", f.digest.toUpperCase(), undefined]) expect(() => official.resolveRecordedMeasurementSource(key as string)).toThrow(/exact pack digest/);
  });

  it.each(["function", "symbol", "symbol-key", "hidden", "getter", "cycle", "map", "set", "date", "sparse-array", "array-subclass", "array-prototype"])(
    "refuses supplied %s artifacts without boot failure, normalization or accessor execution", async variant => {
      const f = await measurementFixture();
      const ledger = structuredClone(f.ledger);
      const values = ledger.records[0]!.values as Record<string | symbol, unknown>;
      let executions = 0;
      if (variant === "function") values.extra = () => { executions++; };
      if (variant === "symbol") values.extra = Symbol("not-json");
      if (variant === "symbol-key") values[Symbol("not-json")] = true;
      if (variant === "hidden") Object.defineProperty(values, "extra", { value: true });
      if (variant === "getter") Object.defineProperty(values, "extra", { enumerable: true, get: () => { executions++; return 1; } });
      if (variant === "cycle") values.extra = ledger;
      if (variant === "map") values.extra = new Map([["mutable", 1]]);
      if (variant === "set") values.extra = new Set([1]);
      if (variant === "date") values.extra = new Date("2026-10-16T00:00:00Z");
      if (variant === "sparse-array") values.extra = new Array(2);
      if (variant === "array-subclass") {
        class ExecutableArray extends Array { override map(..._args: any[]): any { executions++; return []; } }
        const extra = new ExecutableArray();
        extra.push(1, 2);
        values.extra = extra;
      }
      if (variant === "array-prototype") {
        const extra = [1, 2];
        Object.setPrototypeOf(extra, Object.create(Array.prototype, { map: { get: () => { executions++; return Array.prototype.map; } } }));
        values.extra = extra;
      }
      const registry = await PackRegistry.fromDocuments([{ source: "provided", value: f.document, ledger, manifest: f.manifest }]);
      expect(registry.required(f.document.id)).toBeDefined();
      expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
      expect(executions).toBe(0);
    },
  );

  it.each(["ledger-shape", "manifest-shape", "pack-pin"])("does not let a missing counterpart hide %s", async variant => {
    const f = await measurementFixture();
    const sidecars = variant === "manifest-shape" ? { manifest: null }
      : { ledger: variant === "ledger-shape" ? null : { ...f.ledger, packVersion: "wrong" } };
    const registry = await PackRegistry.fromDocuments([{ source: "provided", value: f.document, ...sidecars }]);
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
  });

  it.each(["community", "playtest"] as const)("retires an old same-digest source on actual %s insertion without inventing sidecars", async kind => {
    const f = await measurementFixture();
    const registry = await PackRegistry.fromDocuments([{ source: "initial", value: f.document, ledger: f.ledger, manifest: f.manifest }]);
    const { source } = originalMeasurement(registry, f.digest);
    if (kind === "community") registry.addCommunity(f.document, f.digest, "author");
    else registry.addPlaytest(f.document, f.digest);
    expect(registry.byDigest(f.digest)).toBeDefined();
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(() => registry.readRecordedMeasurementSource(source)).toThrow(/no longer/);
  });

  it("keeps equal document digests with changed sidecar contents as separate owned images", async () => {
    const f = await measurementFixture();
    const first = await PackRegistry.fromDocuments([{ source: "first", value: f.document, ledger: f.ledger, manifest: f.manifest }]);
    const changed = structuredClone(f.ledger);
    (changed.records[0]!.values as Record<string, unknown>).centipawns = 21;
    const second = await PackRegistry.fromDocuments([{ source: "second", value: f.document, ledger: changed, manifest: f.manifest }]);
    const a = originalMeasurement(first, f.digest), b = originalMeasurement(second, f.digest);
    expect(a.image.packDigest).toBe(b.image.packDigest);
    expect(a.image.ledgerDigest).not.toBe(b.image.ledgerDigest);
    expect(a.image.manifestDigest).toBe(b.image.manifestDigest);
    expect(() => first.readRecordedMeasurementSource(b.source)).toThrow(/foreign/);
    expect(() => second.readRecordedMeasurementSource(a.source)).toThrow(/foreign/);
  });

  it("preserves genuinely verified predecessor grading, JSON-order digest and recorded readings", async () => {
    const f = await measurementFixture("graded-synthetic-measurement");
    const document = withDerivedRequires({ ...f.document, objective: { ...f.document.objective,
      grading: { assessedBy: { kind: "engine", score: { kind: "cp", centipawns: 20 }, perspective: "white", depth: 22,
        engineId: "synthetic-engine", engineVersion: "fixture-only", sourceId: "synthetic-engine", retrievedAt: f.ledger.sourcedAt },
      resolveAt: { kind: "terminal" } },
    } });
    const digest = await digestDrillPack(document);
    const engine = { ...f.ledger.records[0]!, anchor: { fen: document.start.fen }, supports: ["/start/fen"],
      values: { fen: document.start.fen, centipawns: 20, depth: 22, perspective: "white", multiPv: 1, engineId: "synthetic-engine", engineName: "Synthetic fixture", engineVersion: "fixture-only" } };
    const ledger = { ...f.ledger, packDigest: digest, records: [engine, ...f.ledger.records.slice(2)] };
    const manifest = { ...f.manifest, entries: f.manifest.entries.map(entry => entry.origin.kind === "engine"
      ? { ...entry, origin: { ...entry.origin, budget: { depth: 22 } } } : entry) };
    const oldDigest = `sha256:${createHash("sha256").update(JSON.stringify(ledger)).digest("hex")}`;
    const canonicalDigest = `sha256:${createHash("sha256").update(canonicalizeJson(ledger)).digest("hex")}`;
    expect(oldDigest).not.toBe(canonicalDigest); // Fails if insertion-order preservation is not exercised.
    const registry = await PackRegistry.fromDocuments([{ source: "graded fixture", value: document, ledger, manifest }]);
    const record = registry.required(document.id);
    expect(record.assessmentGrounding).toBe("ledger_verified");
    expect(record.recordedEvidence).toEqual({ state: "verified", ledgerDigest: oldDigest });
    const predecessor = buildPositionEvidenceIndex({ ledger, grounding: "ledger_verified", packDigest: digest });
    expect(predecessor.size).toBe(1);
    expect(record.positionEvidence).toEqual(predecessor);
    expect(originalMeasurement(registry, digest).image.ledgerDigest).toBe(canonicalDigest);
  });
});
