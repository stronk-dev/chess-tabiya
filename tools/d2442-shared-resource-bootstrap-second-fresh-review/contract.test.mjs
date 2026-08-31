// DISPOSABLE second fresh independent process/buildability review — D2442-D2444.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-resource-register-bootstrap.md", "utf8");
const presentationPlan = readFileSync("tools/d1862-presentation-adapter-plan/plan.ts", "utf8");
const presentationAuthorTest = readFileSync("tools/d2348-evidence-presentation-fourth-author-repair/contract.test.ts", "utf8");

test("D2442 versioned_registry excludes the source resource's resolver semantics", () => {
  assert.match(rfc, /exact keys\s+`id,version,digest,rows`/u);
  assert.match(rfc, /`digest` equals `sha256\(canonical\(rows\)\)`/u);
  assert.match(presentationPlan, /SOURCE_ATTRIBUTION_REGISTRY_RESOURCE = Object\.freeze\(\{[\s\S]*?resolver:[\s\S]*?rows:[\s\S]*?missingReceiptField:/u);
  assert.match(presentationPlan, /SOURCE_BOUND_CITATION_DERIVATION[\s\S]*?attributionRegistry:/u);
});

test("D2443 absent lifecycle is keyed to file absence and globally unique paths", () => {
  assert.match(rfc, /tree file and version symbol do not yet exist/u);
  assert.match(rfc, /duplicate\s+resource\/slug\/path\/symbol/u);
  assert.doesNotMatch(rfc, /selector identity[^\n]*\(path, selector\)|path \+ selector/u);
});

test("D2444 canonical rows has no named byte-level algorithm and already disagrees with its consumer", () => {
  assert.match(rfc, /sha256\(canonical\(rows\)\)/u);
  assert.doesNotMatch(rfc, /RFC-8785|canonicalJson|UTF-8|domain prefix/u);
  assert.match(presentationAuthorTest, /update\(JSON\.stringify\(SOURCE_ATTRIBUTION_REGISTRY\)\)/u);
});
