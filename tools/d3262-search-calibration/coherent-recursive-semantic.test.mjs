import assert from "node:assert/strict";
import test from "node:test";
import { reserveEvent, compileRecursiveFrame, loadRecursiveInputs, summarizeRecursiveFrame } from "./coherent-recursive-semantic.mjs";
import { relationEventsAtHistory } from "./dist/recursive-relation-events.mjs";
import { trackTargetPath, observeTargetPath } from "./dist/coherent-bounded-targets.mjs";

test("event eligibility is independent of rank, and unranked order stays literal", () => {
  const legal = "abcdefghi".split(""), ranked = "abcdefgh".split("");
  assert.deepEqual(reserveEvent(legal, ranked, ["i"], 2).selected, ["a", "i"]);
  assert.equal(reserveEvent(legal, ranked, ["i"], 2).eventOrderAuthority, "canonical_uci_unranked_tie_not_engine_rank");
  assert.equal(reserveEvent(legal, ranked, ["i", "c"], 2).reservedUci, "c");
  assert.deepEqual(reserveEvent(legal, ranked, ["a"], 4).selected, "abcd".split(""));
  assert.deepEqual(reserveEvent(legal, ranked, [], 2).selected, ["a", "b"]);
});
test("illegal/duplicate ranks, events, short tables and changed widths refuse", () => {
  for (const [legal, ranked, events, width] of [[['a','b'],['a','a'],[],2], [['a','b'],['a','b'],['c'],2],
    [['a','b'],['a'],[],2], [['a','b'],['a','b'],[],3], [['a','b'],['a','b'],['a','a'],2]])
    assert.throws(() => reserveEvent(legal, ranked, events, width), /Invalid/u);
});

const inputs = loadRecursiveInputs();
const piece = (color, role, square) => ({ color, role, square });
const material = (attacker, target) => ({ family: "material", target: { attacker, target } });
test("special-move tracking retains castling/promotion and never resurrects a replacement piece", () => {
  const castle = material(piece("white", "rook", "h1"), piece("black", "pawn", "h7"));
  assert.equal(trackTargetPath("4k3/7p/8/8/8/8/8/4K2R w K - 0 1", ["e1g1"], castle).tracked.attacker.square, "f1");
  const promotion = material(piece("white", "pawn", "b7"), piece("black", "king", "h8"));
  const fen = "7k/1P6/8/8/8/8/8/K7 w - - 0 1", history = ["a1a2", "h8g8"];
  assert.equal(trackTargetPath(fen, [...history, "b7b8q"], promotion).tracked.attacker.role, "queen");
  const choices = relationEventsAtHistory(fen, history, promotion).events.map((e) => e.uci);
  assert.ok(["b7b8b", "b7b8n", "b7b8q", "b7b8r"].every((uci) => choices.includes(uci)));
  const replaced = material(piece("black", "rook", "a8"), piece("white", "rook", "a2"));
  assert.equal(trackTargetPath("r6k/8/8/8/8/8/RR6/7K w - - 0 1", ["h1g1", "a8a2", "b2a2"], replaced).tracked, null);
});
test("en-passant events use the captured square, and pinned geometric attacks are not legal events", () => {
  const ep = material(piece("black", "pawn", "d4"), piece("white", "pawn", "e2"));
  const events = relationEventsAtHistory("7k/8/8/8/3p4/8/4P3/K7 w - - 0 1", ["a1a2", "h8g8", "e2e4"], ep);
  assert.ok(events.events.some((e) => e.uci === "d4e3"));
  const pin = material(piece("black", "knight", "e7"), piece("white", "pawn", "f5"));
  const pinned = relationEventsAtHistory("4k3/p3n3/8/5P2/8/8/8/4R2K w - - 0 1", ["h1h2", "a7a6", "h2h1"], pin);
  assert.equal(pinned.beforeSignature.actorAttacksTarget, true);
  assert.ok(!pinned.legal.includes("e7f5")); assert.deepEqual(pinned.events, []);
});
test("geometric capture eligibility is not filtered by positive exchange or terminal vacuity", () => {
  const fen = "3r3k/8/8/8/8/8/3P4/3Q2K1 w - - 0 1", history = ["g1h1", "h8g8", "h1g1"];
  const losing = material(piece("black", "rook", "d8"), piece("white", "pawn", "d2"));
  assert.ok(relationEventsAtHistory(fen, history, losing).events.some((e) => e.uci === "d8d2"));
  assert.equal(observeTargetPath(fen, [...history, "d8d2"], losing).executedAtFourthPly, false);
  const ended = material(piece("black", "king", "f4"), piece("white", "pawn", "e2"));
  const terminal = relationEventsAtHistory("8/8/8/8/5k2/8/4P3/K7 w - - 0 1", ["e2e3", "f4e3"], ended);
  assert.equal(terminal.status, "absorbing_terminal"); assert.ok(terminal.legal.length > 0); assert.deepEqual(terminal.events, []);
});
test("tracking-only projection matches checked identity without reading outcomes", () => {
  const [, comparison, root] = inputs.values;
  const cell = comparison.comparisons[0], definition = comparison.definitions.find((d) => d.id === cell.targetId);
  const fen = root.roots.find((r) => r.rootId === cell.rootId).fen;
  const tracked = trackTargetPath(fen, [cell.candidateUci], definition);
  const observed = observeTargetPath(fen, [cell.candidateUci], definition).snapshots[0];
  assert.deepEqual(tracked, { fen: observed.fen, terminalReason: observed.terminalReason, tracked: observed.tracked });
  const blinded = { id: definition.id, rootId: definition.rootId, family: definition.family, target: definition.target };
  for (const field of ['sources','witness','reintroducedWithin3Ply','positiveExchange','eval'])
    Object.defineProperty(blinded, field, { get() { throw new Error(`outcome leak ${field}`); } });
  const seed = inputs.values[3].rows.find((r) => r.targetId === cell.targetId && r.candidateUci === cell.candidateUci);
  const history = [cell.candidateUci, seed.arms[0].selectedReplyUcis[0]];
  const events = relationEventsAtHistory(fen, history, blinded);
  assert.ok(events.events.every((e) => events.legal.includes(e.uci)));
});
test("complete recursive frame retains all cells, widths, missing sources and offered candidates", () => {
  const frame = compileRecursiveFrame(inputs), summary = summarizeRecursiveFrame(frame);
  assert.equal(frame.rows.length, 182); assert.equal(frame.candidateCoverage.length, 193);
  assert.equal(frame.controls.length, 4); assert.equal(frame.arms.length, 18);
  assert.ok(summary.paths > 0);
  for (const row of frame.rows) for (const arm of row.arms) for (const reply of arm.replies) {
    if (reply.source !== null) assert.equal(reply.selected.length, reply.baseline.length);
  }
  assert.equal(summary.missingQueries, frame.engineJobs.reduce((n, job) => n + job.missingBudgets.length, 0));
  assert.ok(frame.finalPlyNodes.every((node) => node.source !== null || node.selected.length === 0));
});
test("provider-off keeps every cell/candidate rather than manufacturing ranks", () => {
  const frame = compileRecursiveFrame(inputs, { providerOff: true });
  assert.equal(frame.rows.length, 182); assert.equal(frame.candidateCoverage.length, 193);
  assert.equal(frame.paths.length, 0);
  assert.ok(frame.rows.every((r) => r.arms.every((a) => a.replies.every((p) =>
    p.selected.length === 0 && ["source_off", "absorbing_terminal"].includes(p.status)))));
});
test("actual source and population corruptions cannot be hidden by a green census", () => {
  const [, comparison, , seed] = inputs.values;
  const changes = [[comparison, 'comparisons', comparison.comparisons.slice(1)],
    [seed, 'arms', ['changed']], [seed.inputDigests, 'd3262-stockfish-horizon4-capture.json', 'changed'],
    [seed.rows[0].arms[0], 'selectedReplyUcis', ['illegal']],
    [inputs.values[4].source, 'executableDigest', 'changed']];
  for (const [obj, field, changed] of changes) {
    const previous = obj[field]; obj[field] = changed;
    try { assert.throws(() => compileRecursiveFrame(inputs)); } finally { obj[field] = previous; }
  }
});
