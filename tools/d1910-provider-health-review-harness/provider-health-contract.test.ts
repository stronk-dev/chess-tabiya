// DISPOSABLE buildability harness — D1910–D1915. Not production code.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { EVIDENCE_MANIFEST } from "../../apps/server/src/evidence-manifest.js";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/provider-health-degradation.md");

describe("provider-health draft against live contracts", () => {
  it("has two production Stockfish identities but only one health key", () => {
    const application = read("apps/server/src/application.ts");
    expect(application).toContain("stockfishPlaySpec");
    expect(application).toContain("stockfish-analysis");
    expect(application).toContain("stockfish-play");
    const providerIds = rfc.match(/type ProviderId =[\s\S]*?;/u)?.[0] ?? "";
    expect(providerIds.match(/"stockfish"/gu)).toHaveLength(1);
    expect(rfc).not.toMatch(/providerInstanceId|engineId: string/u);
  });

  it("cannot represent a not-configured provider without inventing implementation and generation", () => {
    const snapshot = rfc.match(/interface ProviderHealthSnapshot \{[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(snapshot).toContain("implementation: ProviderImplementation");
    expect(snapshot).toContain("generation: string");
    expect(snapshot).not.toMatch(/implementation: ProviderImplementation \| null/u);
    expect(snapshot).not.toMatch(/generation: string \| null/u);
  });

  it("has no F1 field that can bind voice or TTS provider dependencies", () => {
    const contract = read("packages/runtime/src/evidence-contract.ts");
    const consumer = contract.match(/export interface ConsumerDeclaration \{[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(consumer).not.toMatch(/providerDependencies|providers:/u);
    const voice = EVIDENCE_MANIFEST.consumers.find((row) => row.id === "guidance.voice");
    expect(voice).toBeDefined();
    expect(voice).not.toHaveProperty("providers");
    expect(EVIDENCE_MANIFEST.producers.some((row) => row.id === "voice" || row.id === "tts")).toBe(false);
  });

  it("requires a run-schema change if acquisition receipts remain reviewable", () => {
    const schema = JSON.parse(read("schemas/drill_run.schema.json")) as {
      readonly $defs: Readonly<Record<string, { readonly properties?: Readonly<Record<string, unknown>>; readonly additionalProperties?: boolean }>>;
    };
    const selection = schema.$defs.opponentSelection!;
    expect(selection.additionalProperties).toBe(false);
    expect(selection.properties).not.toHaveProperty("receipt");
    expect(read("packages/runtime/src/types.ts").match(/export interface OpponentSelection \{[\s\S]*?\n\}/u)?.[0]).not.toMatch(/receipt/u);
    expect(rfc).toMatch(/Review\s+and export can therefore say what actually selected the move/u);
  });

  it("publishes an unverified provider state but no unverified policy-mode state", () => {
    const providerState = rfc.match(/type ProviderState =[\s\S]*?;/u)?.[0] ?? "";
    const policyModeState = rfc.match(/readonly state: "available" \| "cached_exact_only" \| "unavailable";/u)?.[0] ?? "";
    expect(providerState).toContain('"unverified"');
    expect(policyModeState).not.toContain("unverified");
  });

  it("leaves success, failure and fallback combinations open inside one receipt", () => {
    const receipt = rfc.match(/interface ProviderOperationReceipt \{[\s\S]*?\n\}/u)?.[0] ?? "";
    expect(receipt).toContain('source: "live" | "cached_exact" | "local_fixture" | "deterministic_fallback"');
    expect(receipt).toContain("reason?: ProviderFailureReason");
    expect(receipt).not.toMatch(/kind: "success"|kind: "failure"/u);
  });
});
