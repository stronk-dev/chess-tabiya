import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { bishopPressureDeclaration, compileBishopPressure, evaluateBishopPressure } from "./bishop-pressure-control.mjs";

const graph = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-exact-replies.json", import.meta.url), "utf8"));
const artifact = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-bishop-pressure-control.json", import.meta.url), "utf8"));
const root = graph.roots.find((item) => item.rootId === "pressure:bg4-h3-bh5");

test("h3 harasses the bishop but ...Bh5 is one legal reply, not a forced move", () => {
  assert.deepEqual(compileBishopPressure(graph), artifact);
  assert.equal(artifact.authority, "declared_pressure_and_legal_screen_move_exposure_only");
  assert.equal(artifact.result.opponentReplyCount, 31);
  assert.equal(artifact.result.pawnAttacksBeforeRetreat, true);
  assert.equal(artifact.result.pawnAttacksAfterRetreat, false);
});
test("the retained bishop/knight/queen line has six exact legal exposure witnesses", () => {
  assert.equal(artifact.result.bishopAttacksScreenAfterRetreat, true);
  assert.equal(artifact.result.bishopDirectlyAttacksQueenAfterRetreat, false);
  assert.deepEqual(artifact.result.exposingScreenMoves, artifact.result.legalScreenMoves);
  assert.equal(artifact.result.exposingScreenMoves.length, 6);
  assert.equal(artifact.result.geometricExposureOnly, true);
});
test("a false bishop retreat or target identity is refused", () => {
  assert.throws(() => evaluateBishopPressure({ ...bishopPressureDeclaration, replyUci: "g4f5" }, root), /bishop\/screen\/queen identities fail/u);
  assert.throws(() => evaluateBishopPressure({ ...bishopPressureDeclaration, screen: { square: "f3", role: "bishop", color: "white" } }, root), /bishop\/screen\/queen identities fail/u);
});
test("an unregistered or crossed reply cannot create retained pressure", () => {
  assert.throws(() => evaluateBishopPressure({ ...bishopPressureDeclaration, replyUci: "g4g6" }, root), /not a legal reply/u);
  const crossed = structuredClone(root);
  crossed.candidates.find((item) => item.candidateUci === "h2h3").replies.find((item) => item.uci === "g4h5").fen = crossed.candidates[0].afterFen;
  assert.throws(() => evaluateBishopPressure(bishopPressureDeclaration, crossed), /bishop\/screen\/queen identities fail/u);
});
