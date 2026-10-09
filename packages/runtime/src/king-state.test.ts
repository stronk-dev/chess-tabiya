import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { kingZoneEvents, kingZoneReading, type KingZoneEvent, type KingZoneReading } from "./king-state.js";
import { CANDIDATE_EVENTS_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import { parsePresentationReceipt, presentEvidenceItems, serializePresentedEvidence } from "./presentation-contract.js";
import { commitMove, createRun } from "./runtime.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("decomposed king state", () => {
  it.each([
    { fen: "4k3/8/8/8/8/8/8/4KR2 w F - 0 1", color: "white", squares: ["d1", "d2", "e2", "f2"] },
    { fen: "4kr2/8/8/8/8/8/8/4K3 b f - 0 1", color: "black", squares: ["d7", "d8", "e7", "f7"] },
    { fen: "4k3/8/8/8/8/8/8/6KR w H - 0 1", color: "white", squares: ["f1", "f2", "g2", "h2"] },
    { fen: "6kr/8/8/8/8/8/8/4K3 b h - 0 1", color: "black", squares: ["f7", "f8", "g7", "h7"] },
    { fen: "4k3/8/8/8/8/8/8/3RK3 w D - 0 1", color: "white", squares: ["d2", "e2", "f1", "f2"] },
    { fen: "3rk3/8/8/8/8/8/8/4K3 b d - 0 1", color: "black", squares: ["d7", "e7", "f7", "f8"] },
    { fen: "4k3/8/8/8/8/8/8/1RK5 w B - 0 1", color: "white", squares: ["b2", "c2", "d1", "d2"] },
    { fen: "1rk5/8/8/8/8/8/8/4K3 b b - 0 1", color: "black", squares: ["b7", "c7", "d7", "d8"] },
  ])("D3635 refuses a castling rook address as an escape: $fen", ({ fen, color, squares }) => {
    expect(kingZoneReading(fen).kings.find(entry => entry.color === color)!.escapes).toEqual({ kind: "available", squares });
  });

  it.each([
    { fen: "4k3/8/8/8/8/8/8/5K1R w H - 0 1", color: "white", squares: ["e1", "e2", "f2", "g1", "g2"] },
    { fen: "5k1r/8/8/8/8/8/8/4K3 b h - 0 1", color: "black", squares: ["e7", "e8", "f7", "g7", "g8"] },
    { fen: "4k3/8/8/8/8/8/8/5KR1 w G - 0 1", color: "white", squares: ["e1", "e2", "f2", "g1", "g2"] },
    { fen: "5kr1/8/8/8/8/8/8/4K3 b g - 0 1", color: "black", squares: ["e7", "e8", "f7", "g7", "g8"] },
  ])("D3635 retains adjacent physical landings as a set: $fen", ({ fen, color, squares }) => {
    expect(kingZoneReading(fen).kings.find(entry => entry.color === color)!.escapes).toEqual({ kind: "available", squares });
  });

  it("retains exact zone, attacker, shelter, and legal escape identities", () => {
    const value = kingZoneReading("4k3/8/8/8/8/4n3/5PPP/6K1 w - - 0 1").kings.find((entry) => entry.color === "white")!;
    expect(value.king.square).toBe("g1");
    expect(value.zone).toEqual(["f1", "h1", "f2", "g2", "h2"]);
    expect(value.attackers).toContainEqual(expect.objectContaining({ square: "e3", piece: expect.objectContaining({ role: "knight" }), zoneSquares: expect.arrayContaining(["f1", "g2"]) }));
    expect(value.shelter.map((entry) => entry.square)).toEqual(["f2", "g2", "h2"]);
    expect(value.escapes).toEqual({ kind: "available", squares: ["h1"] });
  });

  it("abstains the complete escape set on an invalid opposite-check clone", () => {
    const value = kingZoneReading("4k3/8/8/8/8/8/8/4R1K1 b - - 0 1").kings.find((entry) => entry.color === "white")!;
    expect(value.escapes).toEqual({ kind: "unavailable", reason: "invalid_turn_clone", squares: [] });
    expect(value.zone.length).toBeGreaterThan(0);
  });

  it("emits exact shelter and escape deltas without a king-state verdict", () => {
    const fen = "4k3/8/8/8/8/8/7P/6K1 w - - 0 1";
    const event = kingZoneEvents(fen, "h2h4", after(fen, "h2h4")).find((entry) => entry.color === "white")!;
    expect(event.shelter.lost).toContainEqual(expect.objectContaining({ square: "h2" }));
    expect(event.shelter.gained).toEqual([]);
    expect(event.escapes.gained).toContain("h2");
    expect(event.king.relocated).toBe(false);
  });
});

describe("D3635 physical king escapes through production evidence boundaries", () => {
  const fixtures = [
    { fen: "k7/8/8/8/8/8/8/4KR2 w F - 0 1", color: "white", king: "e1", phantom: "f1", move: "e1f1", squares: ["d1", "d2", "e2", "f2"] },
    { fen: "4kr2/8/8/8/8/8/8/K7 b f - 0 1", color: "black", king: "e8", phantom: "f8", move: "e8f8", squares: ["d7", "d8", "e7", "f7"] },
    { fen: "k7/8/8/8/8/8/8/6KR w H - 0 1", color: "white", king: "g1", phantom: "h1", move: "g1h1", squares: ["f1", "f2", "g2", "h2"] },
    { fen: "6kr/8/8/8/8/8/8/K7 b h - 0 1", color: "black", king: "g8", phantom: "h8", move: "g8h8", squares: ["f7", "f8", "g7", "h7"] },
  ] as const;

  it.each(fixtures)("retains $move escapes in the registered reading, event and serialized Inspector", fixture => {
    const reading = invokeEvidenceValueRoute("rules.king.reading.zone_state@1", { fen: fixture.fen });
    expect(evidenceValueReceipt(reading)).toMatchObject({ factory: "createRulesKingReadingZoneStateV1Evidence" });
    expect((reading.payload as KingZoneReading).kings.find(entry => entry.color === fixture.color)!.escapes).toEqual({ kind: "available", squares: fixture.squares });
    const input = { beforeFen: fixture.fen, moveUci: fixture.move, afterFen: after(fixture.fen, fixture.move) };
    const event = invokeEvidenceValueRoute("rules.king.event.zone_state@1", input).map(item => item.payload as KingZoneEvent).find(item => item.color === fixture.color)!;
    expect(event.escapes.before).toEqual({ kind: "available", squares: fixture.squares });
    expect(event.escapes.lost).not.toContain(fixture.phantom);
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, [reading]));
    const parsed = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    const relation = parsed.find(item => item.component.id === "relation_overlay")!;
    expect(relation).toBeDefined();
    if (relation.component.id !== "relation_overlay") throw new Error("Expected king-zone relation");
    expect(relation.component.operand.edges.filter(entry => entry.from === fixture.king && entry.relation === "moves_to").map(entry => entry.to).sort()).toEqual(fixture.squares);
  });

  it.each(fixtures)("retains $move in the complete candidate population and unchanged saved game", fixture => {
    const compiled = compileCandidatePopulation({ beforeFen: fixture.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (compiled.kind !== "ready") throw new Error(JSON.stringify(compiled.error));
    expect(compiled.receipt.packet.candidates).toHaveLength(compiled.receipt.packet.legalMoves.length);
    const candidate = compiled.receipt.packet.candidates.find(entry => entry.moveUci === fixture.move)!;
    const event = candidate.events.find(entry => entry.projection.id === "rules.king.event.zone_state" && (entry.operands as KingZoneEvent).color === fixture.color)!;
    expect((event.operands as KingZoneEvent).escapes.before).toEqual({ kind: "available", squares: fixture.squares });
    const at = "2026-10-09T00:00:00.000Z";
    const initial = createRun({ id: `king-escapes-${fixture.move}`, packId: "king-escape-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, fixture.move, { at }).run;
    const saved = JSON.parse(JSON.stringify(run)) as typeof run;
    const child = saved.nodes.at(-1)!;
    const parent = saved.nodes.find(node => node.id === child.parentId)!;
    const reconstructed = localSemanticEvents(parent.fen, child.moveUci!, child.fen).find(entry => entry.projection.id === "rules.king.event.zone_state" && (entry.operands as KingZoneEvent).color === fixture.color)!;
    expect(reconstructed.operands).toEqual(event.operands);
    expect(saved).toEqual(run);
  });
});
