import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { evidenceValueReceipt } from "./evidence-contract.js";
import { pivotalMarkerEvidenceItems, renderPivotalMarker } from "./pivotal.js";
import { commitMove, createRun } from "./runtime.js";
import { transitionSemanticEvents } from "./semantic-evidence.js";
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
