// DISPOSABLE D4159 research. Existing original legal/candidate factories versus existing Profile
// math; not a production reducer, worker-decision issuer, stored row, style claim or CI gate.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { decisionTraitPopulation } from "../../packages/runtime/src/style-atoms.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";

assert.match(process.version, /^v24\./u, "use the configured Make target");
const started = performance.now();
const available = <T>(value: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T => {
  if (value.kind !== "available") throw Error(value.reason); return value.value;
};
let sampled = 0, candidates = 0;
function sample(fen: string, chosen: string) {
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  const moves = position.payload.pieces.flatMap(piece => piece.moves);
  assert.equal(new Set(moves.map(move => move.uci)).size, moves.length);
  assert.equal(moves.filter(move => move.uci === chosen).length, 1, "require one literal chosen identity");
  const facts = moves.map(move => {
    const source = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci: move.uci }));
    const center = available(invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source }));
    assert.equal(source.payload.sourcePiece.role, move.role);
    assert.equal(source.payload.candidate.uci, move.uci);
    assert.ok(center.length <= 1);
    return { uci: move.uci, pawn: source.payload.sourcePiece.role === "pawn", centerPawn: center.length === 1,
      queen: source.payload.sourcePiece.role === "queen" };
  });
  const played = facts.find(fact => fact.uci === chosen)!;
  const legacy = decisionTraitPopulation(fen, chosen);
  assert.ok(legacy);
  assert.deepEqual(new Set(legacy.legalUcis), new Set(moves.map(move => move.uci)));
  const counts = { pawn: 0, centerPawn: 0, queen: 0 };
  const residual = { pawn: 0, centerPawn: 0, queen: 0 };
  for (const trait of ["pawn", "centerPawn", "queen"] as const) {
    counts[trait] = facts.filter(fact => fact[trait]).length;
    assert.equal(legacy.played[trait], played[trait]);
    assert.equal(legacy.share[trait], counts[trait] / facts.length);
    residual[trait] = Number(played[trait]) - counts[trait] / facts.length;
  }
  sampled++; candidates += facts.length;
  return { n: facts.length, played, counts, residual };
}

const pairs = ([
  ["white", "7k/8/8/8/8/P7/8/7K w - - 0 1", "7k/8/8/8/8/P7/8/6K1 w - - 0 1", "a3a4"],
  ["black", "7k/8/p7/8/8/8/8/7K b - - 0 1", "6k1/8/p7/8/8/8/8/7K b - - 0 1", "a6a5"],
] as const).map(([color, first, second, chosen]) => {
  const a = sample(first, chosen), b = sample(second, chosen);
  assert.equal(a.n, 4); assert.equal(b.n, 6);
  for (const value of [a, b]) {
    assert.equal(value.counts.pawn, 1); assert.equal(value.played.pawn, true);
    assert.equal((value.counts.pawn - Number(value.played.pawn)) / (value.n - 1), 0);
  }
  assert.equal(a.residual.pawn, 3 / 4); assert.equal(b.residual.pawn, 5 / 6);
  return { color, legalCounts: [a.n, b.n], sameOpportunityAlgebraTuple: { opportunities: 1, occurred: 1, alternativeShareSum: 0 },
    chosenInclusiveResiduals: [a.residual.pawn, b.residual.pawn] };
});

const forced = sample("7k/8/8/8/8/8/6q1/7K w - - 0 1", "h1g2");
assert.equal(forced.n, 1); assert.equal(forced.residual.pawn, 0);
const unanimous = sample("rr5k/8/8/8/8/8/2Q5/K7 w - - 0 1", "c2a2");
assert.ok(unanimous.n > 1); assert.equal(unanimous.counts.queen, unanimous.n); assert.equal(unanimous.residual.queen, 0);
const allFalse = sample("7k/8/8/8/8/8/8/7K w - - 0 1", "h1g1");
assert.equal(allFalse.counts.pawn, 0); assert.equal(allFalse.residual.pawn, 0);
const mixed = (3 / 4 + forced.residual.pawn + allFalse.residual.pawn) / 3;
assert.equal(mixed, 1 / 4); assert.notEqual(mixed, 3 / 4, "zero observations remain in the denominator");

for (const color of ["white", "black"] as const) {
  for (const destination of ["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5", "b4", "g4", "d3", "e6"] as const) {
    const rank = Number(destination[1]) + (color === "white" ? -1 : 1);
    const rows = Array<string>(8).fill("8");
    rows[0] = "7k"; rows[7] = "K7";
    rows[8 - rank] = `${destination.charCodeAt(0) - 97 || ""}${color === "white" ? "P" : "p"}${104 - destination.charCodeAt(0) || ""}`;
    sample(`${rows.join("/")} ${color === "white" ? "w" : "b"} - - 0 1`, `${destination[0]}${rank}${destination}`);
  }
  const promotionFen = color === "white" ? "7k/2P5/8/8/8/8/8/K7 w - - 0 1" : "7k/8/8/8/8/8/2p5/K7 b - - 0 1";
  for (const suffix of ["q", "r", "b", "n"]) {
    const value = sample(promotionFen, `${color === "white" ? "c7c8" : "c2c1"}${suffix}`);
    assert.equal(value.counts.pawn, 4); assert.equal(value.played.pawn, true); assert.equal(value.played.queen, false);
  }
  const root = `r3k2r/8/8/8/8/8/8/R3K2R ${color === "white" ? "w" : "b"} KQkq - 0 1`;
  for (const wing of ["a", "h"]) sample(root, color === "white" ? `e1${wing}1` : `e8${wing}8`);
  assert.throws(() => sample(root, color === "white" ? "e1g1" : "e8g8"), /literal chosen/u);
}
for (const fen of ["7k/6Q1/6K1/8/8/8/8/8 b - - 0 1", "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"]) {
  const legal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  assert.equal(legal.payload.pieces.flatMap(piece => piece.moves).length, 0);
  assert.equal(decisionTraitPopulation(fen, "h8g8"), undefined);
}
console.log(JSON.stringify({ instrument: "disposable D4159 original source math", sampledCases: sampled,
  candidateMemberVisits: candidates, pairs, zeroDecisionsRetained: { forcedLegalCount: forced.n, unanimousLegalCount: unanimous.n,
    mixedDenominator: 3, mixedResidual: mixed }, elapsedMs: Math.round((performance.now() - started) * 100) / 100,
  limits: "Finite source arithmetic only; no worker-claimed decision issuer, persisted trait row, early-queen source-context issuance, full worker/Profile delivery, human validity or semantic/release qualification." }, null, 2));
