import { readFileSync } from "node:fs";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry, type RecordedMeasurementSource } from "./pack-registry.js";
import type { EvidenceLedger, EvidenceRecord, SourceManifest } from "./sourcing/types.js";

/** Synthetic registration reports, not an engine computation or a qualified chess claim. */
export async function measurementFixture(id = "recorded-measurement-fixture") {
  const example = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
  const document = withDerivedRequires({ ...example, id });
  const digest = await digestDrillPack(document);
  const retrievedAt = "2026-10-16T00:00:00.000Z";
  const engine: EvidenceRecord = {
    kind: "engine_eval", anchor: { pointer: "/start/fen" }, sourceId: "synthetic-engine", retrievedAt,
    grounds: "machine_validation", supports: [], values: { fen: document.start.fen, centipawns: 20, depth: 8 },
  };
  const ledger: EvidenceLedger = {
    schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest,
    sourcedAt: retrievedAt,
    records: [engine, structuredClone(engine), {
      ...engine, sourceId: "synthetic-text", grounds: "citable_source", values: { fen: document.start.fen, text: "Synthetic unadmitted engine report" },
    }, {
      kind: "citable_text", anchor: { pointer: "/objective/summary" }, sourceId: "synthetic-text", retrievedAt,
      grounds: "citable_source", supports: [], values: { text: "Synthetic registry fixture, not an engine computation" },
    }],
    abstentions: [{ kind: "tablebase_result", anchor: { fen: document.start.fen }, sourceId: "synthetic-text", retrievedAt,
      reason: "out_of_range", detail: "Synthetic abstention retained without supplier selection" }],
  };
  const licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null } as const;
  // Reverse source order deliberately: an original source ordinal is not a record ordinal.
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [{
    sourceId: "synthetic-text", retrievedAt, licence,
    origin: { kind: "local-file", path: "synthetic-fixture.txt", sha256: `sha256:${"a".repeat(64)}`, bytes: 1 },
  }, {
    sourceId: "synthetic-engine", retrievedAt, licence,
    origin: { kind: "engine", engineId: "synthetic-engine", engineName: "Synthetic fixture", engineVersion: "fixture-only",
      profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: { depth: 8 }, fen: document.start.fen, evidenceKind: "engine_eval" },
  }] };
  return { document, digest, ledger, manifest };
}

export function originalMeasurement(registry: PackRegistry, digest: string) {
  const outcome = registry.resolveRecordedMeasurementSource(digest);
  if (outcome.kind !== "available") throw new Error(`Expected original measurement: ${JSON.stringify(outcome)}`);
  return { source: outcome.source, image: registry.readRecordedMeasurementSource(outcome.source) };
}

export function forgedMeasurement(value: unknown): RecordedMeasurementSource {
  return value as RecordedMeasurementSource;
}
