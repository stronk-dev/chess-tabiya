// DISPOSABLE third fresh independent review harness — D2340-D2342. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const bounded = read("rfc/bounded-policy-targets.md");
const validation = read("rfc/semantic-validation-authority.md");
const authorTest = read("tools/d2202-bounded-target-third-author-repair/contract.test.mjs");
const typeFixture = read("tools/d2202-bounded-target-third-author-repair/protocol.typecheck.ts");

test("D2340: three required route profiles meet an event-only validation inventory", () => {
  assert.match(bounded, /Semantic-validation profiles are set-equal to these three routes/u);
  assert.match(validation, /projection\.role === "event"/u);
  assert.match(bounded, /3\.2 `derived\.bounded_target\.named_material_target@1`[\s\S]*?role \/ plane \| `reading`/u);
  assert.match(bounded, /3\.3 `derived\.bounded_target\.immediate@1`[\s\S]*?role \/ plane \| `event`/u);
  assert.match(bounded, /3\.4 `derived\.bounded_target\.bounded_return@1`[\s\S]*?role \/ plane \| `reading`/u);
});

test("D2341: the claimed runtime-subpath fixture is a divergent local protocol", () => {
  assert.doesNotMatch(typeFixture, /^import\s/mu);
  assert.match(typeFixture, /type Immediate =/u);
  assert.match(typeFixture, /result: "preserved"; cause: null/u);
  assert.match(typeFixture, /"attacker_moved"/u);
  assert.match(bounded, /readonly result: "preserved";[\s\S]*?readonly cause: "preserved"/u);
  assert.match(bounded, /"target_moved"[\s\S]*?"capture_illegal"/u);
  assert.doesNotMatch(bounded, /"attacker_moved"/u);
});

test("D2342: internal registry import conflicts with non-exported factory declarations", () => {
  assert.match(bounded, /`evidence-value-authority` registers exactly three bounded-target routes[\s\S]*?literal factory symbols/u);
  assert.match(bounded, /exported only\s+from the package-internal factory module/u);
  for (const name of [
    "makeNamedMaterialTargetEvidence",
    "makeBoundedTargetImmediateEvidence",
    "makeBoundedTargetReturnEvidence",
  ]) {
    assert.match(bounded, new RegExp(`declare function ${name}\\(`, "u"));
    assert.doesNotMatch(bounded, new RegExp(`export declare function ${name}\\(`, "u"));
  }
  assert.match(
    authorTest,
    /for \(const name of \["makeNamedMaterialTargetEvidence", "makeBoundedTargetImmediateEvidence", "makeBoundedTargetReturnEvidence"\]\)[\s\S]*?assert\.doesNotMatch\(rfc/u,
  );
});
