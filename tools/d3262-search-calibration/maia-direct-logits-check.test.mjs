import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateMaiaDirectLogits } from "./maia-direct-logits-check.mjs";

const direct = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-maia-direct-logits.json", "utf8"));
const captureBytes = readFileSync("planning/semantic-consequence-search/d3262-maia-child-capture.json");
const reconstructionBytes = readFileSync("planning/semantic-consequence-search/d3262-maia-configured-window.json");
const capture = JSON.parse(captureBytes.toString());
const reconstruction = JSON.parse(reconstructionBytes.toString());
const graph = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json", "utf8"));
const validate = (value) => validateMaiaDirectLogits(value, capture, reconstruction, graph, captureBytes, reconstructionBytes);

test("complete direct raw and configured distributions join the frozen 196 child positions", () => {
  assert.deepEqual(validate(direct), { positions: 196, rawMoves: 6310, configuredMoves: 637, topWindowMatches: 3749, stableMatches: 194, stableIntervalMatches: 619, boundedUnresolved: 2 });
});

test("a crossed input digest, model image or child position fails", () => {
  const digest = structuredClone(direct);
  digest.captureDigest = `sha256:${"0".repeat(64)}`;
  assert.throws(() => validate(digest), /source digests differ/u);
  const model = structuredClone(direct);
  model.source.modelCheckpointSha256 = `sha256:${"0".repeat(64)}`;
  assert.throws(() => validate(model), /Wrong direct Maia model source/u);
  const position = structuredClone(direct);
  position.rows[0].fen = position.rows[1].fen;
  assert.throws(() => validate(position), /Crossed direct Maia position/u);
});

test("silent legal omission, false raw mass and invented configured support fail", () => {
  const omitted = structuredClone(direct);
  omitted.rows[0].rawFullLegal.pop();
  assert.throws(() => validate(omitted), /legal set incomplete/u);
  const raw = structuredClone(direct);
  raw.rows[0].rawFullLegal[0].mass = 0.5;
  assert.throws(() => validate(raw), /Direct raw distribution not normalized/u);
  const configured = structuredClone(direct);
  configured.rows[0].configuredSupport[0].mass = 0.5;
  assert.throws(() => validate(configured), /Direct configured mass not normalized|Direct configured mass differs/u);
});
