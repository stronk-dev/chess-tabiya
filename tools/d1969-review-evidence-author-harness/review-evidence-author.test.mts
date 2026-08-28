import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const review = readFileSync(new URL("../../rfc/review-evidence-compiler.md", import.meta.url), "utf8");
const provider = readFileSync(new URL("../../rfc/provider-exchange-and-execution.md", import.meta.url), "utf8");

type RawWdl = Readonly<{ subject: "side_to_move"; win: number; draw: number; loss: number }>;

function normalizeWdl(fen: string, raw: RawWdl) {
  assert.equal(raw.subject, "side_to_move");
  assert.equal(raw.win + raw.draw + raw.loss, 1000);
  const turn = fen.split(/\s+/u)[1];
  assert.ok(turn === "w" || turn === "b");
  return Object.freeze({
    fen,
    rawSubject: turn === "w" ? "white" : "black",
    perspective: "white" as const,
    win: turn === "w" ? raw.win : raw.loss,
    draw: raw.draw,
    loss: turn === "w" ? raw.loss : raw.win,
  });
}

test("D1644/D1969: one node-free WDL normalization serves distinct recorded occurrences", () => {
  const fen = "8/8/8/8/8/8/4K3/7k b - - 0 1";
  const normalized = normalizeWdl(fen, { subject: "side_to_move", win: 700, draw: 200, loss: 100 });
  assert.deepEqual({ win: normalized.win, draw: normalized.draw, loss: normalized.loss }, { win: 100, draw: 200, loss: 700 });
  const first = Object.freeze({ nodeId: "n1", fen, normalized });
  const second = Object.freeze({ nodeId: "n9", fen, normalized });
  assert.equal(first.normalized, second.normalized);
  assert.notEqual(first.nodeId, second.nodeId);
  assert.equal(normalizeWdl("8/8/8/8/8/8/4K3/7k w - - 0 1", { subject: "side_to_move", win: 700, draw: 200, loss: 100 }).win, 700);
});

function proofLinks(
  proof: Readonly<{ version: 1 | 2; beforeFen?: string; candidate: string; afterFen?: string; proofStatus: string }>,
  edge: Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>,
): boolean {
  return proof.version === 2 && proof.proofStatus === "proved" && proof.beforeFen === edge.beforeFen &&
    proof.candidate === edge.moveUci && proof.afterFen === edge.afterFen;
}

test("D1645: proof linkage requires v2 plus the exact recorded edge", () => {
  const edge = { beforeFen: "before w - - 0 1", moveUci: "e2e4", afterFen: "after b - - 0 1" };
  const proof = { version: 2 as const, ...edge, candidate: edge.moveUci, proofStatus: "proved" };
  assert.equal(proofLinks(proof, edge), true);
  assert.equal(proofLinks({ ...proof, version: 1 }, edge), false);
  assert.equal(proofLinks({ ...proof, beforeFen: "wrong w - - 0 1" }, edge), false);
  assert.equal(proofLinks({ ...proof, candidate: "d2d4" }, edge), false);
  assert.equal(proofLinks({ ...proof, afterFen: "wrong b - - 0 1" }, edge), false);
});

async function progressiveCoverage(total: number, maxOutstanding: number, windowNodes: number) {
  let cursor = 0;
  let peak = 0;
  const completed: number[] = [];
  while (cursor < total) {
    const admitted = Array.from({ length: Math.min(windowNodes, maxOutstanding, total - cursor) }, (_, offset) => cursor + offset);
    peak = Math.max(peak, admitted.length);
    await Promise.all(admitted.map(async (node) => { await new Promise<void>((resolve) => setImmediate(resolve)); completed.push(node); }));
    cursor += admitted.length;
  }
  return { peak, completed: completed.sort((a, b) => a - b) };
}

test("D1646/D1650: bounded windows eventually cover a long game without another read", async () => {
  const result = await progressiveCoverage(257, 3, 8);
  assert.equal(result.peak, 3);
  assert.deepEqual(result.completed, Array.from({ length: 257 }, (_, index) => index));
});

test("D1648: White evidence becomes learner-relative only at Story compatibility", () => {
  const learnerCp = (whiteCp: number, side: "white" | "black") => side === "white" ? whiteCp : -whiteCp;
  assert.equal(learnerCp(-80, "white") >= -100, true);
  assert.equal(learnerCp(80, "black") >= -100, true);
  assert.equal(learnerCp(-140, "white") >= -100, false);
  assert.equal(learnerCp(140, "black") >= -100, false);
});

const receiptKeys = Object.freeze(["protocol", "runId", "branchId", "manifestDigest", "packetDigest", "completion", "families", "side", "outcome", "title", "moments", "rank"]);
function parseReceipt(value: unknown) {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value));
  const record = value as Record<string, unknown>;
  assert.deepEqual(Object.keys(record).sort(), [...receiptKeys].sort());
  assert.equal(record.protocol, "review-story@1");
  assert.equal("items" in record, false);
  assert.equal("evidence" in record, false);
  return Object.freeze({ ...record });
}

test("D1649: JSON terminates in a closed receipt and never recreates an F1 seal", () => {
  const receipt = { protocol: "review-story@1", runId: "r", branchId: "b", manifestDigest: "m", packetDigest: "p", completion: { kind: "complete" }, families: {}, side: "white", outcome: { kind: "unfinished" }, title: "A game story", moments: [], rank: [] };
  const parsed = parseReceipt(JSON.parse(JSON.stringify(receipt)));
  assert.equal(parsed.protocol, "review-story@1");
  assert.throws(() => parseReceipt({ ...receipt, items: [] }));
  assert.throws(() => parseReceipt({ ...receipt, evidence: { declared: true } }));
});

test("D1651 and dependency closure are literal in the amended RFCs", () => {
  assert.match(provider, /readonly rawWdl:\s*\{/u);
  assert.match(provider, /readonly subject: "side_to_move"/u);
  assert.match(review, /derived\.review\.wdl_white@1/u);
  assert.match(review, /derived\.review\.wdl_point@1/u);
  assert.match(review, /exactness `measured`, confidence `reported`/u);
  assert.match(review, /Every Review derivation is\s+`reported` and never more exact than `measured`/u);
  assert.match(review, /ReviewEvidenceCoordinator/u);
  assert.match(review, /renderReviewStoryReceipt/u);
  assert.doesNotMatch(review, /interface WhiteWdlPoint \{\s*readonly projectionId: "live\.stockfish\.wdl_white/u);
});
