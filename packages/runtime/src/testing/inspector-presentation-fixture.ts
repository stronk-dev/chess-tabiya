// TEST-ONLY: real sealed evidence for the Full Inspector / Post-commit Nudge / Review Map
// presentation adapters (rfc/evidence-presentation.md Checkpoint B). Every item is minted through
// the production value routes (`invokeEvidenceValueRoute`) from FEN, edge, run and packet inputs;
// nothing here fabricates a payload. Production modules never import this file.

import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";

import { branchPath } from "../branch-path.js";
import { canonicalFen, positionFromFen } from "../chess.js";
import { compareBranches } from "../compare.js";
import type { DeclaredEvidence } from "../evidence-contract.js";
import { attachEvidence } from "../evidence.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "../internal/evidence-value-routes.js";
import type { RecordedMoveAnchor } from "../pawn-dynamics.js";
import { commitMove, createRun, fork, rewind } from "../runtime.js";
import { legalAlternativeEdges, localSemanticEventClosure, loosePieceSemanticEvents, pawnIslandSemanticEvents, structuralSemanticEvents } from "../semantic-evidence.js";
import type { DrillRun } from "../types.js";

const at = "2026-09-24T00:00:00.000Z";
const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const invoke = (route: string, inputs: unknown): unknown => invokeEvidenceValueRoute(route as EvidenceValueRoute, inputs as never);

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  position.play(normalizeMove(position, parseUci(uci)!));
  return canonicalFen(position);
}

/** Flattens any route result (single, population, availability, items) to sealed evidence. */
export function sealedItems(result: unknown): readonly DeclaredEvidence<unknown>[] {
  if (Array.isArray(result)) return result.flatMap(sealedItems);
  if (typeof result !== "object" || result === null) return [];
  const record = result as Readonly<Record<string, unknown>>;
  if ("payload" in record && "projection" in record) return [result as DeclaredEvidence<unknown>];
  if ("evidence" in record) return sealedItems(record.evidence);
  if (record.kind === "available") return sealedItems(record.value);
  return [];
}

export const INSPECTOR_FIXTURE_FENS = Object.freeze([
  INITIAL,
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
  "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  "r2q1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R2Q1RK1 w - - 0 10",
  "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10",
  "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1",
  "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1",
  "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
  "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
  "7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1",
  "4k3/1P6/8/8/8/8/8/4K3 w - - 0 1",
  "6k1/1R6/8/8/8/8/8/6K1 w - - 0 1",
  "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1",
  "4k3/8/8/2p5/1pP5/1P6/1P6/4K3 w - - 0 1",
  "4k3/pp4pp/8/2p5/1pP5/1P6/PP4PP/4K3 w - - 0 1",
  "r1bqkb1r/5ppp/p1np1n2/1p1Np3/4P3/N7/PPP2PPP/R2QKB1R w KQkq - 0 1",
  "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
  "4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1",
]);

export const INSPECTOR_FIXTURE_EDGE_SEEDS: readonly (readonly [string, string])[] = Object.freeze([
  [INITIAL, "e2e4"], [INITIAL, "g1f3"], [INITIAL, "b1a3"],
  ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1"], ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "h1h2"],
  ["4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", "e2e7"], ["4k3/p7/8/4p3/3P4/8/8/4K3 w - - 0 1", "d4e5"],
  ["4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5"], ["4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q"],
  ["r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1", "b7a8q"], ["7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4"],
  ["4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "e1d1"], ["6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", "a1a8"],
  ["4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1", "d2e2"], ["1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7"],
  ["4k3/8/3p4/8/8/8/P7/R3K3 w - - 0 1", "a1d1"], ["4k3/8/8/8/8/8/P7/R3K3 w - - 0 1", "a1d1"],
  ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f1b5"],
  ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f3e5"],
  ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f1c4"],
  ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "d2d4"],
  ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "e1e2"],
  ["r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "e1g1"],
  ["r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "b2b4"],
  ["r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "c4f7"],
  ["r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "d2d4"],
  ["rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f3e5"],
  ["4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", "e2e4"], ["4k3/1n6/8/8/8/8/1P6/4K3 w - - 0 1", "b2b4"],
  ["4k3/8/1n6/8/8/8/8/4K3 b - - 0 1", "b6d7"], ["r1bqkbnr/pppppppp/2n5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2", "d4d5"],
  ["8/5k2/8/8/8/8/2K5/8 w - - 0 1", "c2d3"], ["6k1/5pp1/7p/8/8/8/5PPP/3R2K1 w - - 0 1", "d1d8"],
  ["6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", "d1d8"],
  ["4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2"], ["8/8/8/4k3/8/8/4K3/8 w - - 0 1", "e2e3"],
  ["4k3/8/8/3p4/2P5/2P5/8/4K3 w - - 0 1", "c4d5"], ["r1bqkb1r/5ppp/p1np1n2/1p2p3/4P3/N7/PPP2PPP/R2QKB1R b KQkq - 0 1", "d6d5"],
  ["r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"], ["4k3/8/8/2Pp4/8/8/8/4K3 w - d6 0 1", "c5d6"],
  ["r3k2r/ppp2ppp/2n5/3qp3/1b1P4/2N2N2/PP3PPP/R2QKB1R w KQkq - 0 9", "d4e5"],
  ["r2q1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R2Q1RK1 w - - 0 10", "a1c1"],
  ["r4rk1/1pp2ppp/p1np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 9", "g5f6"],
  ["4k3/8/8/3q4/8/8/3R4/3K4 w - - 0 1", "d2d5"],
  ["8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", "e2e3"],
  ["4k3/8/8/8/8/8/P1P5/4K3 w - - 0 1", "e1d1"],
  ["4k3/pp4pp/8/2p5/1pP5/1P6/PP4PP/4K3 w - - 0 1", "e1d2"],
]);

export const inspectorFixtureEdges = () => INSPECTOR_FIXTURE_EDGE_SEEDS.map(([fen, move]) => ({ beforeFen: canonicalFen(positionFromFen(fen)), moveUci: move, afterFen: after(fen, move) }));

/**
 * Every sealed item the fixtures can mint, keyed by exact projection `id@version`. FEN readings run
 * over the fixture FENs, edge readings over the fixture edges, and the derived/recorded/provider
 * projections through the same authority inputs as the permanent value-authority profiles.
 */
export function inspectorFixtureEvidence(routes: readonly string[]): ReadonlyMap<string, readonly DeclaredEvidence<unknown>[]> {
  const found = new Map<string, DeclaredEvidence<unknown>[]>();
  const push = (items: readonly DeclaredEvidence<unknown>[]) => {
    for (const item of items) {
      const key = `${item.projection.id}@${item.projection.version}`;
      if (!routes.includes(key)) continue;
      const list = found.get(key) ?? [];
      if (list.length < 12) list.push(item);
      found.set(key, list);
    }
  };
  const tryPush = (route: string, inputs: unknown) => { try { push(sealedItems(invoke(route, inputs))); } catch (error) { if (!(error instanceof TypeError)) throw error; } };
  const edges = inspectorFixtureEdges();
  for (const route of routes) {
    for (const fen of INSPECTOR_FIXTURE_FENS) tryPush(route, { fen });
    for (const edge of edges) tryPush(route, edge);
  }
  // Post-commit closure (the Post-commit Nudge acquisition path).
  for (const edge of edges) push(localSemanticEventClosure(edge.beforeFen, edge.moveUci, edge.afterFen).events.map((event) => event.evidence));

  const edge = (fen: string, move: string) => ({ beforeFen: fen, moveUci: move, afterFen: after(fen, move) });
  const sealedOne = (route: string, inputs: unknown) => sealedItems(invoke(route, inputs))[0]!;
  // Sealed-input derivations.
  const doubleAttackEdge = edge("4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", "b4c2");
  tryPush("derived.tactic.fork_survives_reply@1", { doubleAttack: sealedOne("rules.tactic.event.double_attack@1", doubleAttackEdge), breadth: sealedOne("rules.tactic.consequence.reply_breadth@1", doubleAttackEdge) });
  const conflictEdge = edge("1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7");
  tryPush("derived.tactic.overloaded_defender_response_conflict@1", { duties: sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: conflictEdge.beforeFen }), capture: sealedOne("rules.transition.event.capture@1", conflictEdge) });
  const discoveredEdge = edge("7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4");
  tryPush("derived.tactic.discovered_executed@1", { latency: sealedOne("rules.tactic.reading.discovered_latency@1", { fen: discoveredEdge.beforeFen }), rays: sealedItems(invoke("rules.transition.event.slider_ray@1", discoveredEdge)) });
  const mateFen = "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1";
  const breadth = sealedOne("rules.tactic.consequence.reply_breadth@1", edge(mateFen, "f7g7"));
  tryPush("rules.tactic.consequence.forced_mate_after_move@1", { beforeFen: mateFen, breadth, maxAttackerMoves: 1 });
  tryPush("rules.tactic.consequence.forced_mate_after_move@2", { beforeFen: mateFen, breadth, maxAttackerMoves: 1 });
  const captureEdge = edge("r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "f3e5");
  tryPush("derived.exchange.capture_class@1", { capture: sealedOne("rules.transition.event.capture@1", captureEdge), exchange: sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: captureEdge.beforeFen, captureUci: "f3e5" }) });

  // Recorded path: v1 over validated anchors, v2 over exact run edges.
  const anchorsOf = (fen: string, moves: readonly string[]): RecordedMoveAnchor[] => { let current = canonicalFen(positionFromFen(fen)); return moves.map((moveUci, index) => { const next = after(current, moveUci); const anchor = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen: next }; current = next; return anchor; }); };
  const movesOf = (anchors: readonly RecordedMoveAnchor[]) => anchors.map((_, offset) => invoke("run.record.move@1", { path: anchors, offset }) as DeclaredEvidence<unknown>);
  const capturesOf = (anchors: readonly RecordedMoveAnchor[]) => anchors.flatMap((anchor) => sealedItems(invoke("rules.transition.event.capture@1", { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen })));
  const lineEdges = (id: string, fen: string, moves: readonly string[]): readonly DeclaredEvidence<unknown>[] => {
    let line = createRun({ id, packId: "p", packDigest: `sha256:${"b".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig });
    for (const move of moves) line = commitMove(line, move, { at }).run;
    const path = branchPath(line, line.activeCursor.branchId);
    return path.slice(1).map((child, index) => invoke("run.record.edge@1", { run: line, parent: path[index], child }) as DeclaredEvidence<unknown>);
  };
  const tradeAnchors = anchorsOf("4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", ["e4d5", "e6d5"]);
  const [firstCapture, secondCapture] = capturesOf(tradeAnchors);
  const tradeMoves = movesOf(tradeAnchors);
  tryPush("derived.exchange.trade_completed@1", { first: firstCapture, second: secondCapture, firstMove: tradeMoves[0], secondMove: tradeMoves[1] });
  const contactFen = "4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1";
  tryPush("derived.pawn.sequence.contact_timing@1", { moves: movesOf(anchorsOf(contactFen, ["e2e4", "e8f7"])) });
  tryPush("derived.pawn.sequence.contact_timing@2", { edges: lineEdges("contact", contactFen, ["e2e4", "e8f7"]) });
  const harassFen = "rn1qkb1r/ppp1pppp/5n2/3p4/3P2b1/4PN2/PPP2PPP/RNBQKB1R w KQkq - 1 4";
  tryPush("derived.pawn.sequence.harassment_pressure@1", { moves: movesOf(anchorsOf(harassFen, ["h2h3", "g4h5"])) });
  tryPush("derived.pawn.sequence.harassment_pressure@2", { edges: lineEdges("harass", harassFen, ["h2h3", "g4h5"]) });
  const deflectionFen = "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1";
  const deflection = anchorsOf(deflectionFen, ["b8a7", "c6a7", "e1e7"]);
  const deflectionInputs = { duty: sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: deflection[0]!.beforeFen }), captures: capturesOf(deflection), exchange: sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: deflection[2]!.beforeFen, captureUci: "e1e7" }) };
  tryPush("derived.tactic.deflection_observed@1", { moves: movesOf(deflection), ...deflectionInputs });
  tryPush("derived.tactic.deflection_observed@2", { edges: lineEdges("deflection", deflectionFen, ["b8a7", "c6a7", "e1e7"]), ...deflectionInputs });
  tryPush("derived.tactic.sequence.defender_consequence@1", { moves: movesOf(deflection) });
  tryPush("derived.tactic.sequence.defender_consequence@2", { edges: lineEdges("deflection", deflectionFen, ["b8a7", "c6a7", "e1e7"]) });
  const interferenceFen = "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1";
  const interference = anchorsOf(interferenceFen, ["b6a6", "e8d7", "a6a5"]);
  const interferenceInputs = { duty: sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: interference[0]!.beforeFen }), exchange: sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: interference[2]!.beforeFen, captureUci: "a6a5" }) };
  tryPush("derived.tactic.interference_observed@1", { moves: movesOf(interference), ...interferenceInputs });
  tryPush("derived.tactic.interference_observed@2", { edges: lineEdges("interference", interferenceFen, ["b6a6", "e8d7", "a6a5"]), ...interferenceInputs });
  const rayFen = "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1";
  const ray = anchorsOf(rayFen, ["a4b6", "e8f7", "a1a8"]);
  const rayExchange = sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: ray[2]!.beforeFen, captureUci: "a1a8" });
  tryPush("derived.tactic.line_blocker_clearance_observed@1", { moves: movesOf(ray), exchange: rayExchange });
  tryPush("derived.tactic.line_blocker_clearance_observed@2", { edges: lineEdges("ray", rayFen, ["a4b6", "e8f7", "a1a8"]), exchange: rayExchange });
  const squareFen = "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1";
  tryPush("derived.tactic.square_clearance_observed@1", { moves: movesOf(anchorsOf(squareFen, ["b1c3", "e8d7", "a1b1"])) });
  tryPush("derived.tactic.square_clearance_observed@2", { edges: lineEdges("square", squareFen, ["b1c3", "e8d7", "a1b1"]) });
  const kingFen = "4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1";
  const king = anchorsOf(kingFen, ["e6d7", "e8d7", "a1d1"]);
  const kingInputs = { captures: capturesOf(king), check: sealedOne("rules.tactic.event.check@1", { beforeFen: king[2]!.beforeFen, moveUci: king[2]!.moveUci, afterFen: king[2]!.afterFen }) };
  tryPush("derived.tactic.attraction_observed@1", { moves: movesOf(king), ...kingInputs });
  tryPush("derived.tactic.attraction_observed@2", { edges: lineEdges("attraction", kingFen, ["e6d7", "e8d7", "a1d1"]), ...kingInputs });
  const overloadFen = "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1";
  const overload = anchorsOf(overloadFen, ["b8a7", "c6a7", "e1e7"]);
  const overloadInputs = { duty: sealedOne("rules.tactic.reading.defender_duty_set@1", { fen: overload[0]!.beforeFen }), captures: capturesOf(overload), exchange: sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: overload[2]!.beforeFen, captureUci: "e1e7" }) };
  tryPush("derived.tactic.overload_exploitation_observed@1", { moves: movesOf(overload), ...overloadInputs });
  tryPush("derived.tactic.overload_exploitation_observed@2", { edges: lineEdges("overload", overloadFen, ["b8a7", "c6a7", "e1e7"]), ...overloadInputs });
  const zFen = "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1";
  const zc = anchorsOf(zFen, ["b4c3", "d1h5", "e8f8", "b2c3"]);
  const zInputs = { capture: sealedOne("rules.transition.event.capture@1", { beforeFen: zc[0]!.beforeFen, moveUci: zc[0]!.moveUci, afterFen: zc[0]!.afterFen }), check: sealedOne("rules.tactic.event.check@1", { beforeFen: zc[1]!.beforeFen, moveUci: zc[1]!.moveUci, afterFen: zc[1]!.afterFen }), exchange: sealedOne("rules.exchange.predicate.legal_exchange@1", { fen: zc[3]!.beforeFen, captureUci: zc[3]!.moveUci }) };
  tryPush("derived.tactic.check_zwischenzug_observed@1", { moves: movesOf(zc), ...zInputs });
  tryPush("derived.tactic.check_zwischenzug_observed@2", { edges: lineEdges("zwischenzug", zFen, ["b4c3", "d1h5", "e8f8", "b2c3"]), ...zInputs });

  // Counterfactual absence over complete sealed alternative populations.
  const playedEdges = [edge("r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1", "e1g1"), edge("4k3/pp4pp/8/2p5/1pP5/1P6/PP4PP/4K3 w - - 0 1", "e1d2"), edge("r1bqkb1r/5ppp/p1np1n2/1p2p3/4P3/N7/PPP2PPP/R2QKB1R b KQkq - 0 1", "h7h6"), edge("4k3/8/8/8/8/8/P1P5/4K3 w - - 0 1", "e1d1")];
  const alternativesByEdge = playedEdges.map((played) => ({ played, events: legalAlternativeEdges(played.beforeFen, played.moveUci).flatMap((alternative) => [
    ...structuralSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen),
    ...pawnIslandSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen),
    ...(loosePieceSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen) ?? []),
  ]) }));
  for (const route of routes.filter((value) => value.startsWith("derived.semantic_avoidance."))) {
    const family = route.replace("derived.semantic_avoidance.", "").replace("@1", "");
    const projection = family === "loose_piece" ? "rules.tactic.event.loose_piece" : family === "pawn_islands" ? "rules.structural.event.pawn_islands" : `rules.structural.event.${family}`;
    const hit = alternativesByEdge.map(({ played, events }) => ({ played, candidates: events.filter((event) => event.projection.id === projection) })).find((entry) => entry.candidates.length > 0);
    const sign = hit?.candidates[0]?.sign;
    if (hit === undefined || sign === undefined) continue;
    const events = [...new Map(hit.candidates.filter((event) => event.sign === sign).map((event) => [event.anchor.moveUci, event])).values()];
    tryPush(route, { ...hit.played, sign, events });
  }

  // Recorded runs: comparison, consequence, objective transition, imported result, opening, pivotal.
  let run = createRun({ id: "inspector", packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: "r3k2r/pppq1ppp/2npbn2/4p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 0 1", seed: 1, createdAt: at, policyConfig });
  const root = run.activeCursor.nodeId;
  for (const move of ["e1g1", "e8c8", "c4e6", "d7e6", "c3d5", "f6d5", "e4d5"]) run = commitMove(run, move, { at }).run;
  const main = run.activeCursor.branchId;
  run = rewind(run, root, at).run;
  run = fork(run, root, { at }).run;
  for (const move of ["a2a3", "e8g8"]) run = commitMove(run, move, { at }).run;
  const alternative = run.activeCursor.branchId;
  const mainPath = branchPath(run, main);
  run = attachEvidence(run, mainPath[1]!.id, ["engine:a"], { kind: "eval", source: "engine_validated", values: { centipawns: 10, engineId: "sf" } }).run;
  run = attachEvidence(run, mainPath[2]!.id, ["engine:b"], { kind: "eval", source: "engine_validated", values: { centipawns: -400, engineId: "sf" } }).run;
  const seq = run.events.length;
  const recorded = { ...run, events: [...run.events,
    { seq, type: "checkpoint.reached", at, data: { checkpointId: "cp-e6", nodeId: mainPath[3]!.id, branchId: main } },
    { seq: seq + 1, type: "objective.state_changed", at, data: { nodeId: mainPath[3]!.id, from: "active", to: "preserved", evidenceRefs: [] } },
  ] } as unknown as DrillRun;
  const comparison = compareBranches(recorded, [main, alternative]);
  for (const route of ["derived.compare.eval_delta@1", "derived.compare.structure_delta@1", "run.record.objective_transition@1", "run.record.consequence@1"]) {
    tryPush(route, { run: recorded, comparison, branchId: main });
    tryPush(route, { run: recorded, comparison, branchId: alternative });
  }
  tryPush("run.record.consequence@1", { run: recorded, branchId: main });
  tryPush("run.record.imported_result@1", { run: recorded, branchId: main, recordedResult: "0-1" });
  tryPush("derived.opening.deepest_reached@1", { run: recorded, branchId: main });
  let italian = createRun({ id: "opening", packId: "p", packDigest: `sha256:${"e".repeat(64)}`, startFen: INITIAL, seed: 1, createdAt: at, policyConfig });
  for (const move of ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"]) italian = commitMove(italian, move, { at }).run;
  tryPush("derived.opening.deepest_reached@1", { run: italian, branchId: italian.activeCursor.branchId });
  for (const fen of INSPECTOR_FIXTURE_FENS) tryPush("theory.opening.catalogue_membership@1", { fen });
  for (const node of branchPath(italian, italian.activeCursor.branchId)) tryPush("theory.opening.catalogue_membership@1", { fen: node.fen });
  for (const [kind, fixture] of Object.entries(pivotalFixtures())) tryPush(`derived.pivotal.${kind}@1`, fixture);
  tryPush("theory.shapes.firing@1", { entries: [{ id: "open-a", trigger: { kind: "feature", feature: { kind: "open_file", file: "a" } } }], path: [{ id: "n1", fen: "rnbqkbnr/1ppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1" }] });
  tryPush("theory.endgame.setup_match@1", { fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", convention: { id: "lucena-setup", version: 1 } });

  // Provider, model, corpus and ledger sources.
  const packet = (kind: string, source: string, values: Record<string, unknown>) => ({ packet: { kind, source, values } });
  tryPush("live.stockfish.eval@1", packet("eval", "engine_validated", { centipawns: 20, perspective: "white", engineId: "sf", depth: 18 }));
  tryPush("live.stockfish.eval@1", packet("eval", "engine_validated", { mateIn: -3, engineName: "Stockfish", engineVersion: "17", depth: 22 }));
  tryPush("live.stockfish.wdl@1", packet("wdl", "engine_validated", { win: 300, draw: 600, loss: 100, engineId: "sf" }));
  tryPush("live.stockfish.pv@1", packet("bestline", "engine_validated", { movesUci: ["e2e4", "e7e5", "g1f3"], engineId: "sf", depth: 12 }));
  tryPush("live.syzygy.result@1", packet("tablebase", "tablebase_exact", { category: "win", dtz: 3, pieceCount: 4 }));
  tryPush("live.syzygy.category@1", packet("tablebase", "tablebase_exact", { category: "draw" }));
  tryPush("live.syzygy.distance@1", packet("tablebase", "tablebase_exact", { category: "win", dtz: 3 }));
  const page = { nodeId: "n1", engine: { id: "maia", name: "Maia", version: "2" }, targetElo: 1500, candidates: [{ moveUci: "e2e4", rank: 1, mass: 0.6, wdl: { win: 1, draw: 2, loss: 3 } }, { moveUci: "d2d4", rank: 2, mass: 0.25 }] };
  tryPush("human.maia.policy@1", { page });
  tryPush("human.maia.candidate_wdl@1", { page });
  const population = { source: "lichess-explorer", ratings: [1500], speeds: ["rapid"], since: "2024-01", until: "2024-12" };
  tryPush("human.explorer.population@1", { page: { nodeId: "n1", result: { kind: "abstention", reason: "no_data_at_band", detail: "fixture", population }, committedMoveSan: null } });
  const moves = [{ san: "e4", uci: "e2e4", playedCount: 900, sharePct: 60, white: 400, draws: 150, black: 350 }, { san: "d4", uci: "d2d4", playedCount: 450, sharePct: 30, white: 200, draws: 100, black: 150 }];
  tryPush("human.explorer.population@1", { page: { nodeId: "n1", result: { kind: "stats", total: 1500, white: 650, draws: 300, black: 550, moves, recency: { kind: "month", lastPlayedMonth: "2024-12" }, population }, committedMoveSan: "e4" } });
  const ledgerRecord = (kind: string, values: Record<string, unknown>) => ({ record: { kind, anchor: { fen: INITIAL }, sourceId: "fixture-source", retrievedAt: "2026-01-01T00:00:00Z", grounds: "machine_validation", values, supports: [] } });
  tryPush("recorded.engine.eval@1", { ledger: sealedOne("sourcing.ledger.engine_eval@1", ledgerRecord("engine_eval", { centipawns: 20, depth: 20, multiPv: 1, perspective: "white", engineId: "sf", engineName: "Stockfish", engineVersion: "17" })) });
  tryPush("recorded.tablebase.result@1", { ledger: sealedOne("sourcing.ledger.tablebase_result@1", ledgerRecord("tablebase_result", { category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 3, checkmate: false, stalemate: false, insufficient_material: true })) });
  const evalPacket = (centipawns: number) => sealedOne("live.stockfish.eval@1", packet("eval", "engine_validated", { centipawns, perspective: "white", engineId: "sf", requestedMovetimeMs: 100 }));
  tryPush("derived.grade.move_quality@1", { before: evalPacket(20), after: evalPacket(-300), mover: "white", context: "drill" });
  return found;
}

/** Recorded runs with exactly one kind of pivotal marker each (the value-authority fixtures). */
function pivotalFixtures(): Readonly<Record<"irreversibility" | "phase_change" | "human_divergence" | "option_collapse", { readonly run: DrillRun; readonly branchId: string }>> {
  let queen = createRun({ id: "pivotal-queen", packId: "p", packDigest: `sha256:${"c".repeat(64)}`, startFen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", seed: 1, createdAt: at, policyConfig });
  queen = commitMove(queen, "e2e7", { at }).run;
  let trade = createRun({ id: "pivotal-phase", packId: "p", packDigest: `sha256:${"d".repeat(64)}`, startFen: "r2qk2r/8/8/8/8/8/8/R2QK2R w - - 0 1", seed: 1, createdAt: at, policyConfig });
  for (const move of ["d1d8", "e8d8"]) trade = commitMove(trade, move, { at }).run;
  const synthetic = (id: string, fens: readonly string[], events: DrillRun["events"] = []): DrillRun => {
    const nodes = fens.map((fen, index) => Object.freeze({ id: `n${index}`, parentId: index === 0 ? null : `n${index - 1}`, fen, transposeKey: fen.split(" ", 4).join(" "), moveUci: null, moveSan: null, ply: index, actor: index === 0 ? "system" : "user", branchId: "main", checkpointRefs: [], objectiveState: "active", evidenceRefs: [], createdAt: at }));
    const branch = { id: "main", forkNodeId: "n0", label: "Main", seed: 1, origin: "played" } as const;
    const header = { id, sessionKind: "position", packId: null, packDigest: null, sessionDigest: "sha256:test", start: { fen: fens[0]!, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig } as const;
    const started = { seq: 0, type: "run.started", at, data: { ...header, rootNode: nodes[0]!, branch, activeCursor: { nodeId: nodes[0]!.id, branchId: "main" } } } as const;
    return Object.freeze({ schemaVersion: "0.17", ...header, nodes, branches: [branch], events: [started, ...events], activeCursor: { nodeId: nodes.at(-1)!.id, branchId: "main" } }) as unknown as DrillRun;
  };
  const collapse = synthetic("pivotal-collapse", ["4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "4k3/8/8/8/8/8/3r4/3K4 w - - 0 1"]);
  const engine = { id: "maia2", name: "Maia", version: "2", seedHonored: true };
  const divergence = synthetic("pivotal-divergence", [INITIAL, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"], [{ seq: 1, type: "opponent.move_selected", at, data: { nodeId: "n1", branchId: "main", moveUci: "e7e5", selection: { moveUci: "e7e5", policyModeApplied: "human_common", engine, candidates: [{ moveUci: "e7e5", mass: 0.34, rank: 1 }, { moveUci: "c7c5", mass: 0.33, rank: 2 }, { moveUci: "e7e6", mass: 0.33, rank: 3 }] } } }] as unknown as DrillRun["events"]);
  return {
    irreversibility: { run: queen, branchId: queen.activeCursor.branchId },
    phase_change: { run: trade, branchId: trade.activeCursor.branchId },
    human_divergence: { run: divergence, branchId: "main" },
    option_collapse: { run: collapse, branchId: "main" },
  };
}
