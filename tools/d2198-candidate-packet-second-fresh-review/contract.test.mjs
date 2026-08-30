import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const semantic = readFileSync("packages/runtime/src/semantic-evidence.ts", "utf8");
const evidenceContract = readFileSync("packages/runtime/src/evidence-contract.ts", "utf8");

test("D2198: caller manifest identity is not the manifest authority used by collectors", () => {
  assert.match(rfc, /createCandidatePopulationService\(input: \{[\s\S]*manifest: CompiledEvidenceManifest/);
  assert.match(semantic, /compileSemanticEvidenceEvent\(PRIMARY_EVIDENCE_MANIFEST/g);
  assert.match(evidenceContract, /export interface CompiledEvidenceManifest \{/);
  assert.doesNotMatch(evidenceContract, /assertCompiledEvidenceManifest|COMPILED_MANIFEST_VALUES/);
});

test("D2199: available-empty results carry no projection identity", () => {
  const result = rfc.match(/export type CandidateCollectorResult[\s\S]*?export interface SealedCandidateCollectorOutcome/)?.[0] ?? "";
  assert.match(result, /kind: "available"; readonly values:/);
  assert.doesNotMatch(result, /kind: "available"; readonly projection:/);
  assert.match(result, /kind: "failed"; readonly projection: P/);
});

test("D2200: the literal registry uses operation while its declaration requires collect", () => {
  const declaration = rfc.match(/export interface CandidateCollectorDeclaration[\s\S]*?\n\}/)?.[0] ?? "";
  const registry = rfc.match(/export const CANDIDATE_COLLECTOR_EXECUTION[\s\S]*?as const satisfies/)?.[0] ?? "";
  assert.match(declaration, /readonly collect:/);
  assert.doesNotMatch(declaration, /readonly operation:/);
  assert.match(registry, /operation: structuralSemanticEvents/);
  assert.doesNotMatch(registry, /collect:/);
  assert.match(semantic, /export function structuralSemanticEvents\(beforeFen: string, moveUci: string, afterFen: string\)/);
});

test("D2201: memo, stats and receipt-reference contract types are referenced but undefined", () => {
  for (const name of ["CandidateCollectorMemo", "CandidatePopulationServiceStats", "CandidatePopulationReceiptReferences"]) {
    assert.match(rfc, new RegExp(`\\b${name}\\b`));
    assert.doesNotMatch(rfc, new RegExp(`(?:interface|type|class) ${name}\\b`));
  }
});
