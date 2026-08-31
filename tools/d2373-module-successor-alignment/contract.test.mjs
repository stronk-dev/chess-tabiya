import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/module-registration.md", "utf8");
const value = readFileSync("rfc/evidence-value-authority.md", "utf8");
const backlog = readFileSync("design/BACKLOG.md", "utf8");

test("the module RFC consumes the value-authority successor boundary", () => {
  assert.match(rfc, /Acceptance additionally depends on `rfc\/evidence-value-authority\.md`/);
  assert.match(backlog, /D2373/);
});

test("four retired refs map set-equally to eight successors", () => {
  for (const ref of ["named_structure@1", "phase.reading@1", "endgame.reading@1", "pivotal.marker@1"]) assert.ok(rfc.includes(ref));
  for (const ref of ["named_structure@2", "phase.reading@2", "endgame.classification@1", "theory.endgame.technique_candidate@1", "pivotal.irreversibility@1", "pivotal.phase_change@1", "pivotal.human_divergence@1", "pivotal.option_collapse@1"]) {
    assert.ok(rfc.includes(ref), `missing ${ref}`);
    assert.ok(value.includes(ref), `value authority missing ${ref}`);
  }
});

test("post-successor totals preserve the two honest awaiting rows", () => {
  assert.match(rfc, /declared `215 \+ R` \/ compiled\s+`213 \+ R` \/ awaiting `2`/);
  assert.match(rfc, /unique requirement projection population is \*\*121\*\*/);
  assert.match(rfc, /No v1\/v2 pair may\s+coexist/);
});

test("sealed artifacts regenerate only after dependency landing", () => {
  assert.match(rfc, /generator.not a hand edit/u);
  assert.match(rfc, /generated execution\/binding JSON, digests, family witness, D1865 assembly fixture/u);
  assert.match(rfc, /cannot authorize implementation/);
});
