import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileIdentityControls, controls, evaluateIdentityControl } from "./fork-control-identity.mjs";

const graph = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url), "utf8"));
const artifact = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-fork-control-identity.json", import.meta.url), "utf8"));

test("declared identity controls distinguish retained from parried without a move grade", () => {
  assert.deepEqual(compileIdentityControls(graph), artifact);
  assert.equal(artifact.authority, "declared_piece_identity_and_geometric_attack_only");
  assert.equal(artifact.controls[0].allReplyRetained, false);
  assert.equal(artifact.controls[0].firstRefutation, "g3c7");
  assert.equal(artifact.controls[1].allReplyRetained, true);
  assert.equal(artifact.controls[1].firstRefutation, null);
});
test("the refuting bishop capture removes the declared knight attacker", () => {
  const parried = artifact.controls[0];
  const bishopCapture = parried.replies.find((reply) => reply.uci === "g3c7");
  assert.deepEqual(bishopCapture.retainedTargets, []);
  assert.equal(bishopCapture.retainsAny, false);
});
test("a fabricated declared attacker or target fails before reply quantification", () => {
  const root = graph.roots.find((item) => item.rootId === "tactical:fork-survives");
  assert.throws(() => evaluateIdentityControl({ ...controls[1], attacker: { ...controls[1].attacker, role: "bishop" } }, root), /attacker identity is false/u);
  assert.throws(() => evaluateIdentityControl({ ...controls[1], targets: [{ square: "a8", role: "bishop", color: "black" }] }, root), /target identity\/attack is false/u);
});
test("an empty reply population cannot pass an all-reply claim", () => {
  const root = structuredClone(graph.roots.find((item) => item.rootId === "tactical:fork-survives"));
  root.candidates.find((item) => item.candidateUci === "e6c7").replies = [];
  root.candidates.find((item) => item.candidateUci === "e6c7").replyCount = 0;
  assert.throws(() => evaluateIdentityControl(controls[1], root), /nonempty reply set missing/u);
});
