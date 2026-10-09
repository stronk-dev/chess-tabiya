import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { CANDIDATE_EVENTS_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { castlingLegality, castlingRightsLost } from "./castling.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { parsePresentationReceipt, presentEvidenceItems, presentedSentence, serializePresentedEvidence } from "./presentation-contract.js";
import { pivotalMarkerEvidenceItems, renderPivotalMarker } from "./pivotal.js";
import { commitMove, createRun } from "./runtime.js";
import { castlingSemanticEvents, localSemanticEvents, transitionSemanticEvents } from "./semantic-evidence.js";
import { irreversibility, matchesTransitionFeature, transitionReading, transitionSemanticFacts } from "./transition.js";

// Independent rules boundary: python-chess 1.11.2 is_castling also recognizes a
// king move to its own rook, even with a one-file displacement (D3616).
// https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L3341-L3346
const fixtures = [
  { name: "white adjacent kingside", fen: "4k3/8/8/8/8/8/8/4KR2 w F - 0 1", move: "e1f1", landing: "g1", quiet: "e1e2", side: "white", san: "O-O" },
  { name: "white stationary kingside", fen: "4k3/8/8/8/8/8/8/6KR w K - 0 1", move: "g1h1", landing: "g1", quiet: "g1f2", side: "white", san: "O-O" },
  { name: "white adjacent queenside", fen: "4k3/8/8/8/8/8/8/2RK4 w C - 0 1", move: "d1c1", landing: "c1", quiet: "d1d2", side: "white", san: "O-O-O" },
  { name: "black adjacent kingside", fen: "4kr2/8/8/8/8/8/8/4K3 b f - 0 1", move: "e8f8", landing: "g8", quiet: "e8e7", side: "black", san: "O-O" },
  { name: "black stationary kingside", fen: "6kr/8/8/8/8/8/8/4K3 b k - 0 1", move: "g8h8", landing: "g8", quiet: "g8f7", side: "black", san: "O-O" },
  { name: "black adjacent queenside", fen: "2rk4/8/8/8/8/8/8/4K3 b c - 0 1", move: "d8c8", landing: "c8", quiet: "d8d7", side: "black", san: "O-O-O" },
] as const;
const at = "2026-10-09T00:00:00.000Z";

function after(fen: string, uci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return makeFen(position.toSetup());
}

describe("shared castling evidence follows legal identity, not file displacement", () => {
  it.each(fixtures)("D3640 retains $name castling as the exact rights-loss cause", fixture => {
    const successor = after(fixture.fen, fixture.move);
    const expected = { color: fixture.side, wing: fixture.san === "O-O" ? "kingside" : "queenside", cause: "castled" };
    const facts = castlingRightsLost(fixture.fen, fixture.move, successor);
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject(expected);
    const events = castlingSemanticEvents(fixture.fen, fixture.move, successor);
    expect(events).toHaveLength(1);
    expect(events[0]!.operands).toMatchObject(expected);
    expect(evidenceValueReceipt(events[0]!.evidence).factory).toBe("createRulesCastlingEventRightsLostV1Evidence");
  });

  it.each(fixtures)("D3640 keeps $name ordinary king-step loss distinct", fixture => {
    const facts = castlingRightsLost(fixture.fen, fixture.quiet, after(fixture.fen, fixture.quiet));
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({ color: fixture.side, cause: "king_moved" });
  });

  it.each(fixtures)("D3640 explains $name cause through the registered Review adapter", fixture => {
    const events = castlingSemanticEvents(fixture.fen, fixture.move, after(fixture.fen, fixture.move));
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 1 }, events.map(item => item.evidence)));
    const wire = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    expect(wire).toHaveLength(1);
    expect(wire[0]!.evidenceRef?.projection).toEqual({ id: "rules.castling.event.rights_lost", version: 1 });
    expect(presentedSentence(wire[0]!)).toBe(`After ${fixture.san}, ${fixture.side === "white" ? "White" : "Black"} can no longer castle ${fixture.san === "O-O" ? "kingside" : "queenside"}: that side castled.`);
  });

  it.each(fixtures)("D3641 returns finite legal path reasons for $name", fixture => {
    const reading = castlingLegality(fixture.fen);
    expect(reading).toHaveLength(1);
    expect(reading[0]).toMatchObject({ color: fixture.side, legalNow: true, inCheck: false, blockedSquares: [], attackedSquares: [] });
  });

  it.each([
    { fen: "7k/8/8/8/8/8/8/rRK5 w B - 0 1", side: "white", square: "c1" },
    { fen: "Rrk5/8/8/8/8/8/8/7K b b - 0 1", side: "black", square: "c8" },
  ])("D3641 names the exposed stationary $side king instead of inventing a castle", fixture => {
    expect(castlingLegality(fixture.fen)).toEqual([{
      color: fixture.side, wing: "queenside", kingSquare: fixture.square,
      rookSquare: fixture.side === "white" ? "b1" : "b8", legalNow: false,
      inCheck: false, blockedSquares: [], attackedSquares: [fixture.square],
    }]);
  });

  it.each(fixtures)("D3640 retains $name cause through complete candidates and saved play", fixture => {
    const population = compileCandidatePopulation({ beforeFen: fixture.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (population.kind !== "ready") throw new Error(JSON.stringify(population.error));
    expect(population.receipt.packet.candidates).toHaveLength(population.receipt.packet.legalMoves.length);
    const candidate = population.receipt.packet.candidates.find(item => item.moveUci === fixture.move)!;
    const expected = { color: fixture.side, cause: "castled" };
    const candidateEvents = candidate.events.filter(item => item.projection.id === "rules.castling.event.rights_lost");
    expect(candidateEvents).toHaveLength(1);
    expect(candidateEvents[0]!.operands).toMatchObject(expected);
    const initial = createRun({ id: `rights-${fixture.name}`, packId: "castling-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, fixture.move, { at }).run;
    const saved = JSON.parse(JSON.stringify(run)) as typeof run;
    const child = saved.nodes.at(-1)!;
    const parent = saved.nodes.find(node => node.id === child.parentId)!;
    const recordedEvents = localSemanticEvents(parent.fen, child.moveUci!, child.fen).filter(item => item.projection.id === "rules.castling.event.rights_lost");
    expect(recordedEvents).toHaveLength(1);
    expect(recordedEvents[0]!.operands).toMatchObject(expected);
    expect(saved).toEqual(run);
  });

  it.each(fixtures)("retains $name in the real event factory and pack condition", fixture => {
    const successor = after(fixture.fen, fixture.move);
    expect(irreversibility(fixture.fen, fixture.move, successor)).toEqual({ subkind: "castled", color: fixture.side });
    expect(matchesTransitionFeature(fixture.fen, fixture.move, successor, { kind: "move_irreversibility", subkind: "castled" })).toBe(true);
    expect(transitionReading(fixture.fen, fixture.move, successor)?.observations).toContainEqual(expect.objectContaining({ kind: "move_irreversibility", subkind: "castled", color: fixture.side }));
    const events = transitionSemanticEvents(fixture.fen, fixture.move, successor).filter(event => event.projection.id === "rules.transition.event.castled");
    expect(events).toHaveLength(1);
    const event = events[0]!;
    expect(event.operands).toMatchObject({ family: "castled", move_uci: fixture.move, to: fixture.landing, detail: { resultingKingSquare: fixture.landing } });
    expect(evidenceValueReceipt(event.evidence).factory).toBe("createRulesTransitionEventCastledV1Evidence");
    expect(event.valence).toBeUndefined();
  });

  it.each(fixtures)("keeps nearby ordinary king moves negative: $name", fixture => {
    const successor = after(fixture.fen, fixture.quiet);
    expect(irreversibility(fixture.fen, fixture.quiet, successor)).toBeUndefined();
    expect(matchesTransitionFeature(fixture.fen, fixture.quiet, successor, { kind: "move_irreversibility", subkind: "castled" })).toBe(false);
    expect(transitionSemanticFacts(fixture.fen, fixture.quiet, successor).filter(fact => fact.family === "castled")).toEqual([]);
    expect(transitionSemanticEvents(fixture.fen, fixture.quiet, successor).filter(event => event.projection.id === "rules.transition.event.castled")).toEqual([]);
  });

  it.each(fixtures)("retains $name through committed recording and the marker factory", fixture => {
    const initial = createRun({ id: fixture.name, packId: "castling-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, fixture.move, { at }).run;
    const recorded = structuredClone(run);
    const node = run.nodes.at(-1)!;
    expect(node).toMatchObject({ moveUci: fixture.move, moveSan: fixture.san, fen: after(fixture.fen, fixture.move) });
    const markers = pivotalMarkerEvidenceItems(run, run.activeCursor.branchId).filter(item => item.payload.kind === "irreversibility");
    expect(markers).toHaveLength(1);
    expect(markers[0]!.payload).toMatchObject({ nodeId: node.id, detail: { subkind: "castled", color: fixture.side } });
    expect(renderPivotalMarker(markers[0]!.payload)).toEqual([`${fixture.side} castled.`]);
    expect(evidenceValueReceipt(markers[0]!).factory).toBe("createDerivedPivotalIrreversibilityV1Evidence");
    expect(run).toEqual(recorded);
  });
});
