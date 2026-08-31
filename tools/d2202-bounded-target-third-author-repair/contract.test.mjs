// DISPOSABLE positive author contract for D2202-D2205. RFC shape only; not production evidence.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/bounded-policy-targets.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

test("D2202: one fixed primary manifest owns construction and request identity", () => {
  const operation = section("export interface BoundedTargetRequestIdentity", "### 4.1 Execution class");
  assert.match(operation, /manifestDigest: typeof PRIMARY_EVIDENCE_MANIFEST\.digest/u);
  assert.match(operation, /takes no manifest argument, reads the imported\s+`PRIMARY_EVIDENCE_MANIFEST\.digest`/u);
  assert.doesNotMatch(operation, /createBoundedTargetBackgroundService\([\s\S]{0,180}CompiledEvidenceManifest/u);
  assert.match(rfc, /unknown\s+manifest, digest, scheduler, adapter or hook fails/u);
  assert.match(rfc, /changing the\s+primary authority changes identities/u);

  const requestIdentity = ({ manifestDigest, exchanges }) => JSON.stringify({
    domain: "tabiya:bounded-target-request@1",
    manifestDigest,
    kind: "source_position_batch",
    threat: "threat",
    exchanges: [...exchanges].sort(),
    sourcePosition: "source",
  });
  assert.equal(requestIdentity({ manifestDigest: "m1", exchanges: ["b", "a"] }), requestIdentity({ manifestDigest: "m1", exchanges: ["a", "b"] }));
  assert.notEqual(requestIdentity({ manifestDigest: "m1", exchanges: ["a"] }), requestIdentity({ manifestDigest: "m2", exchanges: ["a"] }));
});

test("D2203: the pass convention has one exact sealed available/unavailable protocol", () => {
  const anchor = section("export interface ThreatPassAnchor", "export type ThreatEvidence");
  assert.match(anchor, /conventionId: typeof THREAT_CONVENTION/u);
  assert.match(anchor, /sourceFen: string/u);
  assert.match(anchor, /passedFen: string/u);
  assert.match(anchor, /kind: "unavailable";[\s\S]*reason: "pass_while_in_check";[\s\S]*sourceFen: string/u);
  assert.match(anchor, /WeakSet<ThreatPassAnchor>/u);
  assert.match(anchor, /assertThreatPassAnchor[\s\S]*asserts value is ThreatPassAnchor/u);
  assert.match(rfc, /plain\/spread\/JSON\/double-cast value[\s\S]{0,80}fail/u);

  const seals = new WeakSet();
  const create = (sourceFen, passedFen) => {
    const value = Object.freeze({ conventionId: "threat@1", sourceFen, passedFen });
    seals.add(value);
    return value;
  };
  const value = create("source", "passed");
  assert.equal(seals.has(value), true);
  assert.equal(seals.has({ ...value }), false);
});

test("D2204: each projection has one named compute route and central value receipt", () => {
  const operation = section("export type NamedMaterialTargetEvidence", "export interface BoundedTargetBatchRequest");
  const factories = [
    "makeNamedMaterialTargetEvidence",
    "makeBoundedTargetImmediateEvidence",
    "makeBoundedTargetReturnEvidence",
  ];
  const assertions = [
    "assertNamedMaterialTargetEvidence",
    "assertBoundedTargetImmediateEvidence",
    "assertBoundedTargetReturnEvidence",
  ];
  for (const symbol of factories) assert.match(operation, new RegExp(`export declare function ${symbol}\\(`, "u"));
  for (const symbol of assertions) assert.match(operation, new RegExp(`declare function ${symbol}\\(`, "u"));
  assert.match(rfc, /sole package-private mint boundary atomically stores the central `EvidenceValueReceipt`/u);
  assert.match(rfc, /generic `declareEvidence` call with the same id[\s\S]{0,180}fails/u);
  assert.match(rfc, /Semantic-validation profiles are set-equal to these three routes/u);
  assert.doesNotMatch(operation, /makeNamedMaterialTargetEvidence\([\s\S]{0,180}(?:payload|result|cause|afterFen|witness|visitedPositions):/u);
  assert.doesNotMatch(operation, /makeBoundedTargetImmediateEvidence\([\s\S]{0,180}(?:payload|result|cause|afterFen|witness|visitedPositions):/u);
});

test("D2205: the entire consumer protocol is public while mint authorities remain private", () => {
  const publicNames = [
    "BoundedTargetBatchRequest",
    "BoundedTargetBatchResult",
    "BoundedTargetBatchCompleted",
    "BoundedTargetBatchAbstained",
    "BoundedTargetBatchCancelled",
    "BoundedTargetBatchFailed",
    "TargetDerivation",
    "CandidateDerivation",
    "ReturnDerivation",
    "BoundedTargetRequestIdentity",
    "BoundedTargetResultIdentity",
    "BoundedTargetServiceLimits",
    "BoundedTargetServiceOptions",
  ];
  for (const name of publicNames) {
    assert.match(rfc, new RegExp(`export (?:interface|type) ${name}\\b`, "u"), `missing public ${name}`);
  }
  for (const name of ["BoundedTargetTraversalAuthority", "BoundedTargetBatchCounterAuthority"]) {
    assert.match(rfc, new RegExp(`interface ${name}\\b`, "u"));
    assert.doesNotMatch(rfc, new RegExp(`export interface ${name}\\b`, "u"));
  }
  for (const name of ["makeNamedMaterialTargetEvidence", "makeBoundedTargetImmediateEvidence", "makeBoundedTargetReturnEvidence"]) {
    assert.match(rfc, new RegExp(`export declare function ${name}\\b`, "u"));
  }
  assert.match(rfc, /absent from the runtime barrel,[\s\S]{0,120}package\.json.*export\/subpath/u);
  assert.match(rfc, /sole non-test importer/u);
  assert.match(rfc, /compile fixture imports only the package subpath and exhaustively switches every top-/u);
});
