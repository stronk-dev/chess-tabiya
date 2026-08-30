import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/bounded-policy-targets.md", "utf8");
const adapters = readFileSync("packages/runtime/src/evidence-source-adapters.ts", "utf8");

test("D2202: caller manifest is absent from adapter and result identity authority", () => {
  assert.match(rfc, /createBoundedTargetBackgroundService\(input: \{[\s\S]*manifest: CompiledEvidenceManifest/);
  const identities = rfc.match(/interface BoundedTargetInputDigests[\s\S]*?type BoundedTargetBatchResult/)?.[0] ?? "";
  assert.doesNotMatch(identities, /manifest(?:Digest|Identity)/);
  assert.match(adapters, /function exact<[^>]+>\(producer: string, projection: string, payload: T\)/);
  assert.doesNotMatch(adapters, /CompiledEvidenceManifest/);
});

test("D2203: ThreatPassAnchor is public and referenced but has no exact declaration", () => {
  assert.match(rfc, /threatEvidencePassAnchor\([\s\S]*?\): ThreatPassAnchor/);
  assert.match(rfc, /readonly passAnchor: ThreatPassAnchor/);
  assert.doesNotMatch(rfc, /(?:export )?(?:interface|type) ThreatPassAnchor\b/);
});

test("D2204: new projection values are aliases without named exact constructors", () => {
  for (const alias of ["NamedMaterialTargetEvidence", "BoundedTargetImmediateEvidence", "BoundedTargetReturnEvidence"]) {
    assert.match(rfc, new RegExp(`type ${alias}\\b`));
  }
  assert.doesNotMatch(rfc, /(?:function|const) (?:declare|derive|compile)(?:NamedMaterialTarget|BoundedTargetImmediate|BoundedTargetReturn)Evidence\b/);
  assert.match(adapters, /return declareEvidence\(ref\(producer\), ref\(projection\), present\(payload, projection\)\)/);
});

test("D2205: exported service uses non-exported request and result protocol names", () => {
  assert.match(rfc, /export declare class BoundedTargetBackgroundService/);
  assert.match(rfc, /submit\([\s\S]*request: BoundedTargetBatchRequest[\s\S]*Promise<BoundedTargetBatchResult>/);
  assert.match(rfc, /interface BoundedTargetBatchRequest/);
  assert.match(rfc, /type BoundedTargetBatchResult/);
  assert.doesNotMatch(rfc, /export interface BoundedTargetBatchRequest/);
  assert.doesNotMatch(rfc, /export type BoundedTargetBatchResult/);
});
