import { normalizeMove } from "chessops/chess";
import { parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { CANDIDATE_EVENTS_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import { commitMove, createRun } from "./runtime.js";
import { parsePresentationReceipt, presentEvidenceItems, presentedSentence, serializePresentedEvidence } from "./presentation-contract.js";
import { checkEvent, defenderDutyRelocatedEvents, doubleAttackEvent, forkSurvivesReply, loosePieceEvents, mateInOne, replyBreadth } from "./tactics.js";

function edge(beforeFen: string, moveUci: string) {
  const position = positionFromFen(beforeFen);
  const move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return { beforeFen, moveUci, afterFen: canonicalFen(position) };
}

const lostKingDuties = [
  { name: "white kingside", fen: "4k3/8/8/8/8/8/3P4/4K2R w K - 0 1", move: "e1h1", from: "e1", to: "g1", target: "d2" },
  { name: "white queenside", fen: "4k3/8/8/8/8/8/5P2/R3K3 w Q - 0 1", move: "e1a1", from: "e1", to: "c1", target: "f2" },
  { name: "black kingside", fen: "4k2r/3p4/8/8/8/8/8/4K3 b k - 0 1", move: "e8h8", from: "e8", to: "g8", target: "d7" },
  { name: "black queenside", fen: "r3k3/5p2/8/8/8/8/8/4K3 b q - 0 1", move: "e8a8", from: "e8", to: "c8", target: "f7" },
  { name: "stationary rook", fen: "4k3/8/8/8/8/8/3P4/4KR2 w F - 0 1", move: "e1f1", from: "e1", to: "g1", target: "d2" },
] as const;

const rescuedCastleRooks = [
  { name: "white ordinary king", fen: "4k3/1b6/8/8/8/8/8/4K2R w K - 0 1", move: "e1h1", from: "h1", to: "f1", color: "white" },
  { name: "white stationary king", fen: "4k3/1b6/8/8/8/8/8/6KR w K - 0 1", move: "g1h1", from: "h1", to: "f1", color: "white" },
  { name: "black ordinary king", fen: "4k2r/8/8/8/8/8/1B6/4K3 b k - 0 1", move: "e8h8", from: "h8", to: "f8", color: "black" },
] as const;

const promotionForks = [
  { name: "white queen", fen: "k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q", landing: "g8", role: "queen" },
  { name: "black queen", fen: "4k3/8/8/8/8/8/6pR/K7 b - - 0 1", move: "g2g1q", landing: "g1", role: "queen" },
  { name: "white underpromotion", fen: "8/4k1P1/7r/8/8/8/8/4K3 w - - 0 1", move: "g7g8n", landing: "g8", role: "knight" },
] as const;

describe("D3619 special-move identities at the production tactical boundary", () => {
  it.each(lostKingDuties)("retains $name king relocation and exact lost duty", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const expected = {
      move: { from: fixture.from, to: fixture.to },
      defenderBefore: expect.objectContaining({ square: fixture.from, piece: expect.objectContaining({ role: "king" }) }),
      defenderAfter: expect.objectContaining({ square: fixture.to, piece: expect.objectContaining({ role: "king" }) }),
      target: expect.objectContaining({ square: fixture.target }),
    };
    expect(defenderDutyRelocatedEvents(input.beforeFen, input.moveUci, input.afterFen)).toContainEqual(expect.objectContaining(expected));
    const sealed = invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", input);
    expect(sealed.map(item => item.payload)).toContainEqual(expect.objectContaining(expected));
    expect(evidenceValueReceipt(sealed[0]!)).toMatchObject({ factory: "createRulesTacticEventDefenderDutyRelocatedV1Evidence" });
    expect(localSemanticEvents(input.beforeFen, input.moveUci, input.afterFen).filter(event => event.projection.id === "rules.tactic.event.defender_duty_relocated").map(event => event.operands)).toContainEqual(expect.objectContaining(expected));
  });

  it("does not invent a relocation or lost duty for a stationary castling king", () => {
    const input = edge("4k3/8/8/8/8/8/7P/6KR w K - 0 1", "g1h1");
    const events = defenderDutyRelocatedEvents(input.beforeFen, input.moveUci, input.afterFen);
    expect(events.filter(event => event.defenderBefore.piece.role === "king")).toEqual([]);
    expect(events.map(event => event.defenderBefore.square)).toEqual(["h1"]);
  });

  it("retains the secondary castling rook's lost duty with the primary move identity", () => {
    const input = edge("4k3/8/8/8/8/8/7P/4K2R w K - 0 1", "e1h1");
    const expected = {
      move: { from: "e1", to: "g1" },
      defenderBefore: expect.objectContaining({ square: "h1", piece: expect.objectContaining({ role: "rook" }) }),
      defenderAfter: expect.objectContaining({ square: "f1", piece: expect.objectContaining({ role: "rook" }) }),
      target: expect.objectContaining({ square: "h2" }),
    };
    expect(defenderDutyRelocatedEvents(input.beforeFen, input.moveUci, input.afterFen)).toContainEqual(expect.objectContaining(expected));
    expect(invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", input).map(item => item.payload)).toContainEqual(expect.objectContaining(expected));
  });

  it("does not invent a lost duty for a stationary castling rook", () => {
    const input = edge("4k3/8/8/8/8/8/5P2/4KR2 w F - 0 1", "e1f1");
    expect(defenderDutyRelocatedEvents(input.beforeFen, input.moveUci, input.afterFen)).toEqual([]);
  });

  it.each(rescuedCastleRooks)("retains the $name rook's lost en-prise state", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const expected = {
      mover: { color: fixture.color, before: { square: fixture.from, role: "rook" }, after: { square: fixture.to, role: "rook" } },
      sign: "lost",
      before: expect.objectContaining({ enPrise: true }),
      after: expect.objectContaining({ enPrise: false }),
    };
    const result = loosePieceEvents(input.beforeFen, input.moveUci);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("legal castle unexpectedly abstained");
    expect(result.events).toContainEqual(expect.objectContaining(expected));
    const sealed = invokeEvidenceValueRoute("rules.tactic.event.loose_piece@1", input);
    expect(sealed.kind).toBe("available");
    if (sealed.kind !== "available") throw new Error("sealed castle unexpectedly abstained");
    expect(sealed.value.map(item => item.payload)).toContainEqual(expect.objectContaining(expected));
  });

  it("does not label a stationary castling rook's attacks as the king's double attack", () => {
    const input = edge("k7/8/8/5n2/8/8/8/1n2KR2 w F - 0 1", "e1f1");
    expect(doubleAttackEvent(input.beforeFen, input.moveUci)).toBeUndefined();
    expect(invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)).toEqual([]);
    expect(localSemanticEvents(input.beforeFen, input.moveUci, input.afterFen).filter(event => event.projection.id === "rules.tactic.event.double_attack")).toEqual([]);
  });

  it.each(promotionForks)("evaluates all legal replies using the retained $name promoted piece", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci)!;
    expect(attack).toBeDefined();
    expect(positionFromFen(attack.afterFen).board.get(parseSquare(fixture.landing)!)?.role).toBe(fixture.role);
    expect(forkSurvivesReply(attack, replyBreadth(input.beforeFen, input.moveUci))).toMatchObject({ matched: true, refutingReplies: [] });
    const doubleAttack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    expect(breadth.payload.count).toBeGreaterThan(0);
    const predicate = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack, breadth });
    expect(predicate.payload).toMatchObject({ matched: true, refutingReplies: [] });
    expect(evidenceValueReceipt(predicate).factory).toBe("createDerivedTacticForkSurvivesReplyV1Evidence");
  });

  it("retains actual promotion-fork refutations without marking every king reply refuting", () => {
    const input = edge("k6r/6P1/8/8/8/8/8/4K3 w - - 0 1", "g7g8q");
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci)!;
    expect(attack).toBeDefined();
    const result = forkSurvivesReply(attack, replyBreadth(input.beforeFen, input.moveUci));
    expect(result.matched).toBe(false);
    expect(result.refutingReplies).toContain("h8g8");
    expect(result.refutingReplies).not.toContain("a8a7");
  });

  it.each(promotionForks)("names the actual $name attacker in serialized post-commit captions", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const doubleAttack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    const predicate = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack, breadth });
    const evidence: readonly DeclaredEvidence<unknown>[] = [doubleAttack, predicate];
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 1 }, evidence));
    const wire = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    const captions = wire.filter(item => item.component.id === "fact_statement").map(presentedSentence);
    expect(captions).toHaveLength(2);
    for (const caption of captions) {
      expect(caption).toContain(`${fixture.role} on ${fixture.landing}`);
      expect(caption).not.toContain(`pawn on ${fixture.landing}`);
    }
    expect((doubleAttack.payload as { mover: { piece: { role: string } } }).mover.piece.role).toBe(fixture.role);
  });

  it("retains ordinary non-promotion fork behavior", () => {
    const input = edge("8/2k5/3r4/8/3N4/8/8/4K3 w - - 0 1", "d4b5");
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci)!;
    expect(attack.mover).toMatchObject({ piece: { role: "knight" }, before: "d4", after: "b5" });
    expect(forkSurvivesReply(attack, replyBreadth(input.beforeFen, input.moveUci)).matched).toBe(true);
  });

  it.each([
    { fen: "8/8/8/8/8/1B1N4/8/k3KR2 w F - 0 1", move: "e1f1", from: "e1" },
    { fen: "8/8/8/8/8/1B1N4/8/k5KR w K - 0 1", move: "g1h1", from: "g1" },
  ])("retains king landing separately from the checking rook in mate $move", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const expected = { moveUci: fixture.move, mover: { piece: expect.objectContaining({ color: "white", role: "king" }), from: fixture.from, to: "g1" } };
    expect(mateInOne(fixture.fen).mates).toContainEqual(expect.objectContaining(expected));
    expect(invokeEvidenceValueRoute("rules.tactic.consequence.mate_in_one@1", { fen: fixture.fen }).payload.mates).toContainEqual(expect.objectContaining(expected));
    expect(checkEvent(input.beforeFen, input.moveUci)?.checkingPieces).toEqual([{ piece: expect.objectContaining({ color: "white", role: "rook" }), square: "f1" }]);
  });

  it("retains corrected duty events through the whole legal candidate packet", () => {
    const fixture = lostKingDuties[0]!;
    const compiled = compileCandidatePopulation({ beforeFen: fixture.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    expect(compiled.kind).toBe("ready");
    if (compiled.kind !== "ready") throw new Error(JSON.stringify(compiled.error));
    const row = compiled.receipt.packet.candidates.find(candidate => candidate.moveUci === fixture.move)!;
    expect(row.events.filter(event => event.projection.id === "rules.tactic.event.defender_duty_relocated").map(event => event.operands)).toContainEqual(expect.objectContaining({
      defenderAfter: expect.objectContaining({ square: fixture.to }), target: expect.objectContaining({ square: fixture.target }),
    }));
    expect(compiled.receipt.packet.candidates).toHaveLength(compiled.receipt.packet.legalMoves.length);
  });

  it.each([lostKingDuties[0], lostKingDuties[4]])("reconstructs $name duty evidence from committed run bytes without mutation", fixture => {
    const at = "2026-10-09T00:00:00.000Z";
    const initial = createRun({ id: fixture.name, packId: "special-move-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, fixture.move, { at }).run;
    const saved = JSON.parse(JSON.stringify(run)) as typeof run;
    const child = saved.nodes.at(-1)!;
    const parent = saved.nodes.find(node => node.id === child.parentId)!;
    expect(localSemanticEvents(parent.fen, child.moveUci!, child.fen).filter(event => event.projection.id === "rules.tactic.event.defender_duty_relocated").map(event => event.operands)).toContainEqual(expect.objectContaining({
      defenderAfter: expect.objectContaining({ square: fixture.to }), target: expect.objectContaining({ square: fixture.target }),
    }));
    expect(saved).toEqual(run);
  });
});
