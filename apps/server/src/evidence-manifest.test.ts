import { describe, expect, it } from "vitest";

import { EVIDENCE_CONTRACT_DECLARATIONS } from "@chess-tabiya/runtime";

import {
  EVIDENCE_MANIFEST,
  PACKET_FIELD_PROJECTION_MAP,
  RECORDED_READING_PROJECTION_MAP,
  RUNTIME_EVENT_PROJECTION_MAP,
  SOURCING_PROJECTION_MAP,
  assertEvidenceManifest,
  evidenceManifestCapabilities,
} from "./evidence-manifest.js";
import { RECORDED_READING_DISPOSITIONS } from "./position-evidence.js";
import { EVIDENCE_KINDS } from "./sourcing/types.js";
import { CAPABILITY_DISPOSITIONS } from "./capabilities.js";

describe("server evidence manifest aggregate", () => {
  it("uses the shared catalogue and closes current runtime, sourcing, recorded and packet vocabularies", () => {
    expect(assertEvidenceManifest()).toBe(EVIDENCE_MANIFEST);
    expect(EVIDENCE_MANIFEST.producers).toHaveLength(EVIDENCE_CONTRACT_DECLARATIONS.producers.length);
    expect(Object.keys(RUNTIME_EVENT_PROJECTION_MAP).sort()).toEqual(["bestline", "eval", "tablebase", "wdl"]);
    expect(Object.keys(SOURCING_PROJECTION_MAP).sort()).toEqual([...EVIDENCE_KINDS].sort());
    expect(Object.keys(RECORDED_READING_PROJECTION_MAP).sort()).toEqual(RECORDED_READING_DISPOSITIONS.filter((row) => row.disposition === "admitted").map((row) => row.kind).sort());
    expect(Object.keys(PACKET_FIELD_PROJECTION_MAP).sort()).toEqual(["authored", "endgame", "markers", "observations", "phase", "plans", "readings", "structures"]);
  });

  it("reports provider-off state independently for Stockfish, Syzygy, Maia and Explorer", () => {
    const absent = evidenceManifestCapabilities({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
    const states = Object.fromEntries(absent.availability.map((row) => [row.producerId, row.state]));
    expect(states).toMatchObject({ "live.stockfish": "unavailable", "live.syzygy": "honest_empty", "human.maia": "unavailable", "human.explorer": "honest_empty" });
    const voice = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "guidance.voice")!;
    expect(voice.providerOff).toBe("available");
    expect(absent.bindings.some((binding) => binding.consumerId === "guidance.voice")).toBe(true);
  });

  it("exposes only consumer-safe binding summaries, never payloads or provider secrets", () => {
    const value = evidenceManifestCapabilities({ opponent: "mock", judge: "mock", llm: "external", corpus: "mock", tts: "none", tablebase: "mock" });
    expect(value.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(value.counts).toEqual({ producers: 35, projections: 189, consumers: 25, bindings: 210, semanticEvents: 67, eligibility: 67, reasons: 15, selectionPolicies: 1 });
    expect(JSON.stringify(value)).not.toMatch(/bestMoveUci|principalVariation|apiKey|authoredText/);
    expect(value.bindings.every((binding) => binding.consumerId.length > 0 && binding.projectionId.length > 0)).toBe(true);
  });

  it("joins evidence-relevant engine capability rows to exact manifest ids", () => {
    const producers = new Set(EVIDENCE_MANIFEST.producers.map((producer) => producer.id));
    const consumers = new Set(EVIDENCE_MANIFEST.consumers.map((consumer) => consumer.id));
    const joined = CAPABILITY_DISPOSITIONS.filter((row) => row.evidence !== undefined);
    expect(joined.length).toBeGreaterThanOrEqual(4);
    for (const row of joined) {
      expect(producers.has(row.evidence!.producerId), row.capability).toBe(true);
      expect(row.evidence!.consumerIds.every((id) => consumers.has(id)), row.capability).toBe(true);
    }
  });
});
