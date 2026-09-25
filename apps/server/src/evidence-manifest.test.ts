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
import { testProviderHealth } from "./provider-health.test-support.js";
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

  it("reports provider-off state independently for Stockfish, Syzygy, Maia and Explorer", async () => {
    const absent = evidenceManifestCapabilities(await testProviderHealth({}));
    const states = Object.fromEntries(absent.availability.map((row) => [row.producerId, row.state]));
    expect(states).toMatchObject({ "live.stockfish": "unavailable", "live.syzygy": "honest_empty", "human.maia": "unavailable", "human.explorer": "honest_empty", "theory.opening.runtime": "unavailable" });
    expect(absent.availability.find((row) => row.producerId === "theory.opening.runtime")?.reason).toBe("artifact_missing");
    const voice = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "guidance.voice")!;
    expect(voice.providerOff).toBe("available");
    expect(absent.bindings.some((binding) => binding.consumerId === "guidance.voice")).toBe(true);
  });

  it("reads the live registry state of each provider-backed producer, not configuration", async () => {
    const health = await testProviderHealth({ "stockfish-analysis": "available", "maia-inference": { failed: "process_exit" }, "tablebase-primary": "unverified", "explorer-primary": { failed: "rate_limited" } });
    const states = Object.fromEntries(evidenceManifestCapabilities(health).availability.map((row) => [row.producerId, [row.state, row.reason]]));
    expect(states["live.stockfish"]![0]).toBe("available");
    expect(states["live.syzygy"]).toEqual(["available", "tablebase-primary is ready to try (not yet verified)."]);
    expect(states["human.maia"]![0]).toBe("unavailable");
    expect(states["human.maia"]![1]).toContain("process_exit");
    // Provider-off is never worded as a domain answer.
    expect(states["human.explorer"]![0]).toBe("honest_empty");
    expect(states["human.explorer"]![1]).toContain("not a domain answer");
    expect(states["human.explorer"]![1]).not.toMatch(/no games|outside/iu);
  });

  it("exposes only consumer-safe binding summaries, never payloads or provider secrets", async () => {
    const value = evidenceManifestCapabilities(await testProviderHealth({ "stockfish-analysis": "available", "maia-inference": "available", "external-voice": "unverified", "explorer-primary": "unverified", "tablebase-primary": "unverified" }));
    expect(value.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(value.counts).toEqual({ producers: 43, projections: 273, consumers: 35, bindings: 544, semanticEvents: 78, eligibility: 78, reasons: 15, selectionPolicies: 1 });
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
