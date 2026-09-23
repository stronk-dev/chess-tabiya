import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileDestinationReplyWitness } from "./dist/destination-reply-witness.mjs";

const comparisons = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-target-comparison-frame.json", "utf8"));
const immediate = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-destination-immediate.json", "utf8"));
const replies = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json", "utf8"));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-destination-reply-witness.json", "utf8"));

test("all 87 named destination questions have an exact arrival or typed absence", () => {
  assert.deepEqual({ ...compileDestinationReplyWitness(comparisons, immediate, replies), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 87);
  assert.equal(artifact.rows.filter((row) => row.status === "named_pawn_punishment_witness").length, 32);
  assert.equal(artifact.rows.filter((row) => row.status === "locally_safe_arrival_witness").length, 54);
  assert.equal(artifact.rows.filter((row) => row.status === "named_minor_absent").length, 1);
  for (const row of artifact.rows) {
    if (row.status === "named_pawn_punishment_witness") assert.deepEqual(row.witnessPath, [row.candidateUci, row.arrivalUci, row.namedPawnCaptureUci]);
    if (row.status === "named_minor_absent") assert.equal(row.witnessPath, null);
  }
});

test("the generic first positive capture cannot impersonate the declared pawn", () => {
  const different = artifact.rows.filter((row) => row.namedPawnCaptureUci !== null && row.genericFirstPositiveCaptureUci !== row.namedPawnCaptureUci);
  assert.deepEqual(different.map((row) => [row.rootId, row.candidateUci, row.genericFirstPositiveCaptureUci, row.namedPawnCaptureUci]), [
    ["d1023:3f3bae7705d0c126", "a7a6", "a5b5", "a6b5"],
  ]);
});

test("deleted arrival, crossed reply FEN and forged pawn identity fail", () => {
  const source = artifact.rows.find((row) => row.status === "named_pawn_punishment_witness");
  const deleted = structuredClone(replies);
  deleted.roots.find((row) => row.rootId === source.rootId).candidates.find((row) => row.candidateUci === source.candidateUci).replies = [];
  assert.throws(() => compileDestinationReplyWitness(comparisons, immediate, deleted), /Named arrival absent/u);
  const crossed = structuredClone(replies);
  crossed.roots.find((row) => row.rootId === source.rootId).candidates.find((row) => row.candidateUci === source.candidateUci).replies.find((row) => row.uci === source.arrivalUci).fen = "foreign";
  assert.throws(() => compileDestinationReplyWitness(comparisons, immediate, crossed), /Named arrival FEN/u);
  const forged = structuredClone(comparisons);
  const caseRow = artifact.rows.find((row) => row.rootId === "d1023:3f3bae7705d0c126" && row.candidateUci === "a7a6");
  forged.definitions.find((row) => row.id === caseRow.targetId).target.controllingPawn.square = "a5";
  assert.throws(() => compileDestinationReplyWitness(forged, immediate, replies), /Source candidate did not move the declared pawn/u);
});
