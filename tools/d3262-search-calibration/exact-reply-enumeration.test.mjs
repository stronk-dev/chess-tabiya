import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { enumerateCandidate, validateExactReplyArtifact } from "./exact-reply-enumeration.mjs";

const frame = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-root-frame.json", import.meta.url), "utf8"));
const artifact = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url), "utf8"));
function control(rootId, candidateUci) {
  return artifact.roots.find((root) => root.rootId === rootId).candidates.find((candidate) => candidate.candidateUci === candidateUci);
}

test("all selected candidates have complete, replayable reply populations", () => {
  validateExactReplyArtifact(artifact, frame);
  assert.equal(artifact.roots.length, 66);
  assert.equal(artifact.roots.flatMap((root) => root.candidates).length, 196);
  assert.equal(artifact.roots.flatMap((root) => root.candidates.flatMap((candidate) => candidate.replies)).length, 6310);
});
test("the paired fork controls retain different exact reply sets without claiming a tactic", () => {
  const survives = control("tactical:fork-survives", "e6c7");
  const parried = control("tactical:fork-parried", "e6c7");
  assert.equal(survives.replyCount, 5);
  assert.equal(parried.replyCount, 33);
  assert.ok(parried.replies.some((reply) => reply.uci === "g3c7" && reply.captures));
});
test("the bishop retreat remains a legal reply after the pawn push", () => {
  const pressure = control("pressure:bg4-h3-bh5", "h2h3");
  assert.ok(pressure.replies.some((reply) => reply.uci === "g4h5" && !reply.captures));
});
test("checkmate is terminal rather than an empty universal proof", () => {
  const mate = enumerateCandidate("rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2", "d8h4");
  assert.equal(mate.opponentInCheck, true);
  assert.equal(mate.terminal, true);
  assert.equal(mate.replyCount, 0);
});
test("a silent reply deletion and invented reply FEN are refused", () => {
  const shortened = structuredClone(artifact);
  shortened.roots[0].candidates[0].replies.pop();
  assert.throws(() => validateExactReplyArtifact(shortened, frame), /complete legal replay/u);
  const crossed = structuredClone(artifact);
  crossed.roots[0].candidates[0].replies[0].fen = crossed.roots[1].candidates[0].replies[0].fen;
  assert.throws(() => validateExactReplyArtifact(crossed, frame), /complete legal replay/u);
});
