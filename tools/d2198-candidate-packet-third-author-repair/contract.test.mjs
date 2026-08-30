// DISPOSABLE positive author contract for D2198-D2201. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

test("D2198: product construction and receipts share one exact manifest authority", () => {
  const service = section("export interface CandidatePopulationService {", "`invalid_fen`");
  const receipt = section("export interface CandidatePopulationReceipt", "export function assertCandidatePopulationReceipt");
  assert.match(service, /createCandidatePopulationService\([\s\S]*CandidatePopulationServiceOptions/u);
  assert.doesNotMatch(service, /readonly manifest: CompiledEvidenceManifest/u);
  assert.match(service, /product factory fixes `PRIMARY_EVIDENCE_MANIFEST`/u);
  assert.match(service, /unknown `manifest`, digest or collector field is rejected/u);
  assert.match(receipt, /readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST/u);
  assert.match(rfc, /stores the exact\s+manifest\/packet\/legal\/event\/reading/u);
});

test("D2199: every result arm and empty result retains its exact projection", () => {
  const result = section("export type CandidateCollectorResult", "export interface SealedCandidateCollectorOutcome");
  assert.match(result, /kind: "available"; readonly projection: P; readonly values:/u);
  assert.match(result, /kind: "unavailable";[\s\S]*readonly projection: P;[\s\S]*readonly reason:/u);
  assert.match(result, /kind: "failed"; readonly projection: P/u);

  const admit = (outputs, results) => {
    const expected = [...outputs].sort();
    const actual = results.map((value) => value.projection).sort();
    if (new Set(actual).size !== actual.length || JSON.stringify(actual) !== JSON.stringify(expected)) return false;
    return results.every((resultValue) => resultValue.kind !== "available"
      || resultValue.values.every((value) => value.projection === resultValue.projection));
  };
  assert.equal(admit(["a", "b"], [{ kind: "available", projection: "a", values: [] }, { kind: "available", projection: "b", values: [] }]), true);
  assert.equal(admit(["a", "b"], [{ kind: "available", projection: "a", values: [] }, { kind: "available", projection: "a", values: [] }]), false);
  assert.equal(admit(["a"], [{ kind: "available", projection: "a", values: [{ projection: "b" }] }]), false);
});

test("D2200: thirteen typed context adapters, not positional operations, populate the registry", () => {
  const registry = section("export const CANDIDATE_COLLECTOR_EXECUTION", "export type CandidateCollectorId");
  const rows = [...registry.matchAll(/^\s*"([^"]+)": \(\{[^\n]*?collect: (collectCandidate[A-Za-z]+)[^\n]*?dependencies: \[([^\]]*)\]/gmu)];
  assert.equal(rows.length, 13);
  assert.equal(new Set(rows.map((match) => match[1])).size, 13);
  assert.equal(new Set(rows.map((match) => match[2])).size, 13);
  assert.doesNotMatch(registry, /\boperation:/u);
  assert.equal((rfc.match(/declare function collectCandidate[A-Za-z]+\(/gu) ?? []).length, 13);
  assert.match(rfc, /zero-\s*dependency adapter's `context\.memo` has no readable key/u);
  assert.match(rfc, /calls its existing positional chess function at most once/u);
});

test("D2201: memo, stats and receipt-reference protocols are closed", () => {
  for (const name of ["CandidateCollectorMemo", "CandidatePopulationServiceStats", "CandidatePopulationReceiptReferences"]) {
    assert.match(rfc, new RegExp(`(?:interface|type) ${name}\\b`, "u"));
  }
  const memo = section("export type CandidateCollectorMemo", "export interface CandidateCollectorDeclaration");
  assert.match(memo, /\[K in D\[number\]\]/u);
  assert.doesNotMatch(memo, /\[key: string\]|Record<string/u);
  const stats = section("export interface CandidatePopulationServiceStats", "export interface CandidatePopulationServiceOptions");
  const fields = [...stats.matchAll(/^\s+readonly ([A-Za-z]+): number;/gmu)].map((match) => match[1]);
  assert.equal(fields.length, 15);
  assert.equal(new Set(fields).size, 15);
  const refs = section("interface CandidatePopulationReceiptReferences", "const CANDIDATE_POPULATION_RECEIPTS");
  for (const field of ["manifest", "packet", "legalMovesInput", "row", "events", "readings", "collectorOutcomes"]) {
    assert.match(refs, new RegExp(`readonly ${field}:`, "u"));
  }
});
