import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { boardTerminalReason, validateMaiaHorizon4PathCapture } from "./maia-horizon4-path-check.mjs";

const directory = "planning/semantic-consequence-search";
const bytes = (name) => readFileSync(`${directory}/${name}.json`);
const frameBytes = bytes("d3262-maia-horizon4-path-frame");
const directBytes = bytes("d3262-maia-direct-logits");
const childBytes = bytes("d3262-maia-history-replay");
const frame = JSON.parse(frameBytes), direct = JSON.parse(directBytes), child = JSON.parse(childBytes);
const capture = JSON.parse(bytes("d3262-maia-horizon4-path-capture"));
const verify = (value) => validateMaiaHorizon4PathCapture(frame, frameBytes, direct, directBytes, child, childBytes, value);

test("path-keyed Maia capture preserves the one same-FEN pair as distinct policies", () => {
  const result = verify(capture);
  assert.equal(result.positions, 2189);
  assert.equal(result.uniqueFens, 2188);
  assert.equal(result.terminal, 0);
  assert.equal(result.legalMoves, 65694);
  assert.equal(result.configuredSupport, 8034);
  assert.ok(result.sameFenRawTotalVariation > 0.02);
  assert.equal(result.sameFenConfiguredTotalVariation, 1);
});

test("crossed path, legal denominator, support mass and fabricated terminal refuse", () => {
  const crossed = structuredClone(capture);
  crossed.rows[0].historyUci = [];
  assert.throws(() => verify(crossed), /Crossed Maia path row/u);

  const legal = structuredClone(capture);
  legal.rows[0].legalUcis.pop();
  assert.throws(() => verify(legal), /legal denominator mismatch/u);

  const mass = structuredClone(capture);
  mass.rows[0].configuredSupport[0].mass = 2;
  assert.throws(() => verify(mass), /Invalid configured Maia path/u);

  const terminal = structuredClone(capture);
  terminal.rows[0].terminal = true;
  terminal.rows[0].terminalReason = "CHECKMATE";
  assert.throws(() => verify(terminal), /manufactured policy/u);
});

test("empty policy cannot launder a forged board-terminal reason", () => {
  for (const reason of ["CHECKMATE", "STALEMATE", "INSUFFICIENT_MATERIAL", "SEVENTYFIVE_MOVES", "FIVEFOLD_REPETITION", "invented"]) {
    const terminal = structuredClone(capture);
    terminal.rows[0].terminal = true;
    terminal.rows[0].terminalReason = reason;
    terminal.rows[0].rawFullLegal = [];
    terminal.rows[0].configuredSupport = [];
    assert.throws(() => verify(terminal), /terminal.*board|board.*terminal/u, reason);
  }
});

test("board-terminal authority preserves mate/stalemate, material and automatic-move boundaries", () => {
  assert.equal(boardTerminalReason("7k/6Q1/5K2/8/8/8/8/8 b - - 150 1"), "CHECKMATE");
  assert.equal(boardTerminalReason("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1"), "STALEMATE");
  assert.equal(boardTerminalReason("4k3/8/8/8/8/8/8/4K3 w - - 0 1"), "INSUFFICIENT_MATERIAL");
  assert.equal(boardTerminalReason("4k3/8/8/8/8/8/8/R3K3 w - - 149 1"), null);
  assert.equal(boardTerminalReason("4k3/8/8/8/8/8/8/R3K3 w - - 150 1"), "SEVENTYFIVE_MOVES");
});
