import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mergeHorizon4Captures } from "./stockfish-horizon4-merge.mjs";

const bytes = readFileSync("planning/semantic-consequence-search/d3262-horizon4-frontier.json");
const frontier = JSON.parse(bytes);
const reference = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-stockfish-child-capture.json", "utf8"));

test("an incomplete or misordered chunk set cannot become a full source artifact", () => {
  assert.throws(() => mergeHorizon4Captures(frontier, bytes, reference, []), /Incomplete horizon-four capture/u);
  const crossed = Array.from({ length: 88 }, () => ({ file: "wrong.json", bytes: "{}" }));
  assert.throws(() => mergeHorizon4Captures(frontier, bytes, reference, crossed), /Missing or crossed interval/u);
});
