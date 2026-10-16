import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PackRegistry } from "./pack-registry.js";
import { measurementFixture, originalMeasurement } from "./recorded-measurement.test-support.js";

// Observes real file I/O; no injected read outcomes or alternate registry issuer.
vi.mock("node:fs/promises", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readFile: vi.fn(actual.readFile) };
});

describe("installed pack measurement loading", () => {
  const directories: string[] = [];
  afterEach(async () => {
    vi.mocked(readFile).mockClear();
    await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
  });
  async function setup() {
    const f = await measurementFixture("file-measurement-fixture");
    const directory = await mkdtemp(join(tmpdir(), "tabiya-measurement-"));
    directories.push(directory);
    const paths = { pack: join(directory, "pack.json"), ledger: join(directory, "evidence.json"), manifest: join(directory, "sources.json") };
    await writeFile(paths.pack, JSON.stringify(f.document));
    return { ...f, directory, paths };
  }
  async function load(directory: string) {
    return PackRegistry.loadDefault({ development: true, draftsDirectory: directory });
  }
  it("owns the actual immutable file image with one read per sidecar, not request-time rereads", async () => {
    const f = await setup();
    await writeFile(f.paths.ledger, JSON.stringify(f.ledger));
    await writeFile(f.paths.manifest, JSON.stringify(f.manifest));
    const registry = await load(f.directory);
    const { source, image } = originalMeasurement(registry, f.digest);
    expect(image.sidecars.ledger.origin).toEqual({ kind: "file", path: f.paths.ledger });
    expect(image.sidecars.manifest.origin).toEqual({ kind: "file", path: f.paths.manifest });
    expect(image.ledger).toEqual(f.ledger);
    await writeFile(f.paths.ledger, "malformed after registration");
    await rm(f.paths.manifest);
    for (let i = 0; i < 3; i++) {
      expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "available", source });
      expect(registry.readRecordedMeasurementSource(source)).toBe(image);
    }
    for (const path of [f.paths.ledger, f.paths.manifest]) expect(vi.mocked(readFile).mock.calls.filter(args => args[0] === path)).toHaveLength(1);
    const reloaded = await load(f.directory);
    expect(reloaded.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
    expect(() => reloaded.readRecordedMeasurementSource(source)).toThrow(/foreign/);
  });

  it.each(["both-missing", "ledger-missing", "manifest-missing", "malformed", "ledger-unreadable", "manifest-unreadable", "unreadable-and-malformed"])(
    "keeps %s distinct while preserving optional-sidecar pack loading", async variant => {
      const f = await setup();
      if (!["both-missing", "ledger-missing"].includes(variant)) {
        if (["ledger-unreadable", "unreadable-and-malformed"].includes(variant)) await mkdir(f.paths.ledger);
        else await writeFile(f.paths.ledger, variant === "malformed" ? "{" : JSON.stringify(f.ledger));
      }
      if (!["both-missing", "manifest-missing"].includes(variant)) {
        if (variant === "manifest-unreadable") await mkdir(f.paths.manifest);
        else await writeFile(f.paths.manifest, variant === "unreadable-and-malformed" ? "{" : JSON.stringify(f.manifest));
      }
      const registry = await load(f.directory);
      expect(registry.required(f.document.id).assessmentGrounding).toBe("unverified");
      expect(registry.required(f.document.id).recordedEvidence).toEqual({ state: "unverified" });
      const expected = variant.includes("unreadable") ? { kind: "failed", reason: "source_lookup_failed" }
        : variant === "malformed" ? { kind: "failed", reason: "source_contract_invalid" }
          : { kind: "unavailable", reason: "source_absent" };
      expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual(expected);
    },
  );

  it("observes changed sidecars and removal only on actual registry reload, without borrowing old images", async () => {
    const f = await setup();
    await writeFile(f.paths.ledger, JSON.stringify(f.ledger));
    await writeFile(f.paths.manifest, JSON.stringify(f.manifest));
    const first = await load(f.directory);
    const a = originalMeasurement(first, f.digest);
    const changed = structuredClone(f.ledger);
    (changed.records[0]!.values as Record<string, unknown>).centipawns = 22;
    await writeFile(f.paths.ledger, JSON.stringify(changed));
    const second = await load(f.directory);
    const b = originalMeasurement(second, f.digest);
    expect(a.image.packDigest).toBe(b.image.packDigest);
    expect(a.image.ledgerDigest).not.toBe(b.image.ledgerDigest);
    expect(() => second.readRecordedMeasurementSource(a.source)).toThrow(/foreign/);
    expect(() => first.readRecordedMeasurementSource(b.source)).toThrow(/foreign/);
    await rm(f.paths.ledger);
    const missing = await load(f.directory);
    expect(missing.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "unavailable", reason: "source_absent" });
    await rm(f.paths.pack);
    const removed = await load(f.directory);
    expect(removed.byDigest(f.digest)).toBeUndefined();
    expect(removed.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(() => removed.readRecordedMeasurementSource(a.source)).toThrow(/foreign/);
    expect(first.readRecordedMeasurementSource(a.source)).toBe(a.image);
  });

  it.each(["ledger-shape", "manifest-shape", "pack-pin"])("does not report file-backed %s as absent because its counterpart is missing", async variant => {
    const f = await setup();
    if (variant === "manifest-shape") await writeFile(f.paths.manifest, "null");
    else await writeFile(f.paths.ledger, variant === "ledger-shape" ? "null" : JSON.stringify({ ...f.ledger, packId: "wrong" }));
    const registry = await load(f.directory);
    expect(registry.required(f.document.id)).toBeDefined();
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
  });

  it.each(["ledger", "manifest"] as const)("validates canonical JSON in the present %s before accepting a missing counterpart", async kind => {
    const f = await setup();
    const artifact: any = structuredClone(kind === "ledger" ? f.ledger : f.manifest);
    if (kind === "ledger") artifact.records[0].values.text = "\ud800";
    else artifact.entries[0].origin.path = "\ud800";
    await writeFile(f.paths[kind], JSON.stringify(artifact));
    const registry = await load(f.directory);
    expect(registry.required(f.document.id)).toBeDefined();
    expect(registry.resolveRecordedMeasurementSource(f.digest)).toEqual({ kind: "failed", reason: "source_contract_invalid" });
  });
});
