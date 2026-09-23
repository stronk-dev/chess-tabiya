import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { compileExactArmForcing, replayReply } from "./exact-arm-forcing.mjs";

const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-immediate.json", "d3262-destination-reply-witness.json", "d3262-exact-replies.json", "d3262-root-frame.json"];
const inputs = names.map((name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`, "utf8")));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-arm-forcing.json", "utf8"));

test("complete opponent replies and only declared forcing triggers are counted", () => {
  assert.deepEqual({ ...compileExactArmForcing(...inputs), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.roots, 66);
  assert.equal(artifact.selectedCandidates, 196);
  assert.equal(artifact.exactReplyEdges, 6310);
  assert.equal(artifact.rows.length, 185);
  assert.equal(artifact.uniqueExpandedReplyFens, 1207);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.forcingReplyCount, 0), 1226);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.learnerEdges, 0), 36779);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.forcingPieceCount, 0), 680);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.learnerEdgesPiece, 0), 18831);
  assert.equal(artifact.rows.filter((row) => row.family === "material" && row.namedReplyTriggered).length, 53);
  assert.equal(artifact.rows.filter((row) => row.family === "destination" && row.namedReplyTriggered).length, 8);
  assert.equal(artifact.rows.filter((row) => row.family === "destination" && row.namedReplyTriggeredPiece).length, 6);
  assert.equal(artifact.rows.filter((row) => row.family === "destination" && row.namedReplyFound && !row.namedReplyTriggered).length, 78);
  assert.ok(artifact.rows.every((row) => row.forcingPieceCount <= row.forcingReplyCount && row.learnerEdgesPiece <= row.learnerEdges));
});

test("an already-attacked target does not make an unrelated reply forcing", () => {
  const before = "r3k3/8/8/8/8/8/8/R3K3 b Q - 0 1";
  const after = Chess.fromSetup(parseFen(before).unwrap()).unwrap();
  after.play(parseUci("e8e7"));
  const reply = { uci: "e8e7", fen: makeFen(after.toSetup()), givesCheck: false, captures: false };
  const definition = { family: "material", target: { target: { color: "white", role: "rook", square: "a1" } } };
  assert.equal(replayReply({ afterFen: before }, reply, definition).newAttack, false);
});

test("destination occupancy alone never licenses the extra learner ply", () => {
  const registered = new Set(inputs[3].rows.filter((row) => row.status === "named_pawn_punishment_witness").map((row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`));
  const offProfile = artifact.rows.filter((row) => row.family === "destination" && registered.has(`${row.rootId}|${row.targetId}|${row.candidateUci}`) && !row.namedReplyTriggered);
  assert.ok(offProfile.length > 0);
  assert.ok(offProfile.every((row) => row.namedReplyFound && row.namedReplyUci !== null));
});

test("deleted named reply, crossed FEN and false check flag fail", () => {
  const named = artifact.rows.find((row) => row.family === "material" && row.namedReplyFound);
  const deleted = structuredClone(inputs[4]);
  deleted.roots.find((root) => root.rootId === named.rootId).candidates.find((candidate) => candidate.candidateUci === named.candidateUci).replies = [];
  assert.throws(() => compileExactArmForcing(...inputs.slice(0, 4), deleted, inputs[5]), /Named reply omitted/u);
  const crossed = structuredClone(inputs[4]);
  crossed.roots.find((root) => root.rootId === named.rootId).candidates.find((candidate) => candidate.candidateUci === named.candidateUci).replies.find((reply) => reply.uci === named.namedReplyUci).fen = "crossed";
  assert.throws(() => compileExactArmForcing(...inputs.slice(0, 4), crossed, inputs[5]), /Crossed exact opponent reply FEN/u);
  const falseCheck = structuredClone(inputs[4]);
  const reply = falseCheck.roots.find((root) => root.rootId === named.rootId).candidates.find((candidate) => candidate.candidateUci === named.candidateUci).replies[0];
  reply.givesCheck = !reply.givesCheck;
  assert.throws(() => compileExactArmForcing(...inputs.slice(0, 4), falseCheck, inputs[5]), /Crossed exact check flag/u);
});
