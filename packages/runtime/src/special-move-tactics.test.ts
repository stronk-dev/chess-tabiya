import { normalizeMove } from "chessops/chess";
import { parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { CANDIDATE_EVENTS_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { legalCaptureMovesTo } from "./exchange.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import { pieceDestinationEvents } from "./mobility.js";
import { commitMove, createRun } from "./runtime.js";
import { parsePresentationReceipt, presentEvidenceItems, presentedSentence, serializePresentedEvidence } from "./presentation-contract.js";
import { checkEvent, defenderDutyRelocatedEvents, doubleAttackEvent, forkSurvivesReply, loosePieceEvents, loosePieceReading, mateInOne, replyBreadth } from "./tactics.js";

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

describe("D3626 castling-rook mobility at production boundaries", () => {
  it.each(rescuedCastleRooks)("retains $name mobility through factory and semantic-event collection", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const expected = { moved: true, piece: { before: { square: fixture.from, role: "rook" }, after: { square: fixture.to, role: "rook" } } };
    expect(pieceDestinationEvents(input.beforeFen, input.moveUci, input.afterFen).events).toContainEqual(expect.objectContaining(expected));
    const declared = invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", input);
    expect(declared.map(item => item.payload)).toContainEqual(expect.objectContaining(expected));
    expect(evidenceValueReceipt(declared[0]!)).toMatchObject({ factory: "createRulesMobilityEventPieceDestinationsV1Evidence" });
    expect(localSemanticEvents(input.beforeFen, input.moveUci, input.afterFen).filter(item => item.projection.id === "rules.mobility.event.piece_destinations").map(item => item.operands)).toContainEqual(expect.objectContaining(expected));
  });

  it.each([rescuedCastleRooks[0], rescuedCastleRooks[2]])("presents $name mobility through the serialized Inspector", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const declared = invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", input).filter(item => item.payload.piece.before.square === fixture.from);
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, declared));
    const wire = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    expect(wire).toHaveLength(2); // The registered Inspector retains its square caption and recorded line.
    const squares = wire.find(item => item.component.id === "square_set")!;
    expect(squares).toBeDefined();
    expect(presentedSentence(squares)).toContain(`rook on ${fixture.to}`);
    if (squares.component.id !== "square_set") throw new Error("Expected mobility squares");
    expect(squares.component.operand.squares).toContain(fixture.to);
    const line = wire.find(item => item.component.id === "move_path")!;
    expect(line).toBeDefined();
    expect(presentedSentence(line)).toContain("O-O");
    for (const item of wire) {
      expect(item.evidenceRef?.projection).toMatchObject({ id: "rules.mobility.event.piece_destinations", version: 1 });
    }
  });

  it.each([rescuedCastleRooks[0], rescuedCastleRooks[2]])("retains $name mobility through complete candidates and saved runs", fixture => {
    const compiled = compileCandidatePopulation({ beforeFen: fixture.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    if (compiled.kind !== "ready") throw new Error(JSON.stringify(compiled.error));
    expect(compiled.receipt.packet.candidates).toHaveLength(compiled.receipt.packet.legalMoves.length);
    const expected = { moved: true, piece: { before: { square: fixture.from, role: "rook" }, after: { square: fixture.to, role: "rook" } } };
    const candidate = compiled.receipt.packet.candidates.find(item => item.moveUci === fixture.move)!;
    expect(candidate.events.filter(item => item.projection.id === "rules.mobility.event.piece_destinations").map(item => item.operands)).toContainEqual(expect.objectContaining(expected));
    const at = "2026-10-09T00:00:00.000Z";
    const initial = createRun({ id: `mobility-${fixture.name}`, packId: "special-move-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, fixture.move, { at }).run;
    const saved = JSON.parse(JSON.stringify(run)) as typeof run;
    const child = saved.nodes.at(-1)!;
    const parent = saved.nodes.find(node => node.id === child.parentId)!;
    expect(localSemanticEvents(parent.fen, child.moveUci!, child.fen).filter(item => item.projection.id === "rules.mobility.event.piece_destinations").map(item => item.operands)).toContainEqual(expect.objectContaining(expected));
    expect(saved).toEqual(run);
  });
});

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

const promotionDuties = [
  { name: "white quiet", fen: "2R4r/1P6/7k/8/8/8/8/K7 w - - 0 1", from: "b7", to: "b8", target: "c8", color: "white" },
  { name: "black quiet", fen: "k7/8/8/8/8/7K/1p6/2r4R b - - 0 1", from: "b2", to: "b1", target: "c1", color: "black" },
  { name: "white capture", fen: "r1R4r/1P6/7k/8/8/8/5K2/8 w - - 0 1", from: "b7", to: "a8", target: "c8", color: "white" },
  { name: "black capture", fen: "8/5k2/8/8/8/7K/1p6/R1r4R b - - 0 1", from: "b2", to: "a1", target: "c1", color: "black" },
] as const;
const promotionDutyCases = promotionDuties.flatMap(fixture => [
  { ...fixture, promotion: "n", role: "knight", losesDuty: true },
  { ...fixture, promotion: "b", role: "bishop", losesDuty: true },
  { ...fixture, promotion: "q", role: "queen", losesDuty: false },
  { ...fixture, promotion: "r", role: "rook", losesDuty: false },
] as const);

function expectedPromotionDuty(fixture: typeof promotionDutyCases[number]) {
  return {
    move: { from: fixture.from, to: fixture.to },
    defenderBefore: { square: fixture.from, piece: expect.objectContaining({ role: "pawn", color: fixture.color }) },
    defenderAfter: { square: fixture.to, piece: expect.objectContaining({ role: fixture.role, color: fixture.color }) },
    target: { square: fixture.target, piece: expect.objectContaining({ role: "rook", color: fixture.color }) },
  };
}

describe("D3622 promotion defender identity at the production boundary", () => {
  it.each(promotionDutyCases)("retains the exact $name $role duty outcome", fixture => {
    const input = edge(fixture.fen, `${fixture.from}${fixture.to}${fixture.promotion}`);
    const events = defenderDutyRelocatedEvents(input.beforeFen, input.moveUci, input.afterFen);
    const sealed = invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", input);
    const semantic = localSemanticEvents(input.beforeFen, input.moveUci, input.afterFen)
      .filter(event => event.projection.id === "rules.tactic.event.defender_duty_relocated");
    if (!fixture.losesDuty) {
      expect(events).toEqual([]);
      expect(sealed).toEqual([]);
      expect(semantic).toEqual([]);
      return;
    }
    const expected = expectedPromotionDuty(fixture);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject(expected);
    expect(sealed).toHaveLength(1);
    expect(sealed[0]!.payload).toMatchObject(expected);
    expect(evidenceValueReceipt(sealed[0]!).factory).toBe("createRulesTacticEventDefenderDutyRelocatedV1Evidence");
    expect(semantic.map(event => event.operands)).toEqual([expect.objectContaining(expected)]);
  });

  it.each(promotionDutyCases.filter(fixture => fixture.losesDuty))("presents the $name $role's lost defence in Inspector, not Nudge", fixture => {
    const input = edge(fixture.fen, `${fixture.from}${fixture.to}${fixture.promotion}`);
    const evidence = invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", input);
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 1 }, evidence).items).toEqual([]);
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, evidence));
    const wire = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    const statements = wire.filter(item => item.component.id === "fact_statement");
    expect(statements).toHaveLength(1);
    const caption = presentedSentence(statements[0]!);
    expect(caption).toContain(fixture.from);
    expect(caption).toContain(fixture.to);
    expect(caption).toContain(fixture.target);
    expect(caption).not.toMatch(/deflection|attraction/iu);
  });

  it.each(promotionDuties)("retains every $name promotion in the complete candidate packet", fixture => {
    const compiled = compileCandidatePopulation({ beforeFen: fixture.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    expect(compiled.kind).toBe("ready");
    if (compiled.kind !== "ready") throw new Error(JSON.stringify(compiled.error));
    expect(compiled.receipt.packet.candidates).toHaveLength(compiled.receipt.packet.legalMoves.length);
    for (const choice of promotionDutyCases.filter(item => item.name === fixture.name)) {
      const row = compiled.receipt.packet.candidates.find(item => item.moveUci === `${choice.from}${choice.to}${choice.promotion}`)!;
      expect(row).toBeDefined();
      const events = row.events.filter(item => item.projection.id === "rules.tactic.event.defender_duty_relocated");
      expect(events.map(item => item.operands)).toEqual(choice.losesDuty ? [expect.objectContaining(expectedPromotionDuty(choice))] : []);
    }
  });

  it.each(promotionDutyCases.filter(fixture => fixture.losesDuty))("reconstructs the saved $name $role transition without altering play", fixture => {
    const at = "2026-10-09T00:00:00.000Z";
    const initial = createRun({ id: `${fixture.name}-${fixture.role}`, packId: "special-move-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, `${fixture.from}${fixture.to}${fixture.promotion}`, { at }).run;
    const saved = JSON.parse(JSON.stringify(run)) as typeof run;
    const child = saved.nodes.at(-1)!;
    const parent = saved.nodes.find(node => node.id === child.parentId)!;
    expect(localSemanticEvents(parent.fen, child.moveUci!, child.fen)
      .filter(item => item.projection.id === "rules.tactic.event.defender_duty_relocated")
      .map(item => item.operands)).toEqual([expect.objectContaining(expectedPromotionDuty(fixture))]);
    expect(saved).toEqual(run);
  });

  it("refuses a promoted after-position that does not follow the legal edge", () => {
    const fixture = promotionDuties[0]!;
    const knight = edge(fixture.fen, "b7b8n");
    const bishop = edge(fixture.fen, "b7b8b");
    expect(() => defenderDutyRelocatedEvents(knight.beforeFen, knight.moveUci, bishop.afterFen)).toThrow("After FEN does not match");
    expect(() => invokeEvidenceValueRoute("rules.tactic.event.defender_duty_relocated@1", { ...knight, afterFen: bishop.afterFen })).toThrow();
  });
});

const enPassantPushes = [
  { name: "black", fen: "4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1", move: "d7d5", victim: "d5", capturer: "e5", capture: "e5d6", landing: "d6" },
  { name: "white", fen: "4k3/8/8/8/4p3/8/3P4/4K3 w - - 0 1", move: "d2d4", victim: "d4", capturer: "e4", capture: "e4d3", landing: "d3" },
] as const;

describe("D3620 en-passant victim identity at the production tactical boundary", () => {
  it.each(enPassantPushes)("reads the legal capturer of the $name pawn on its occupied square", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const reading = loosePieceReading(input.afterFen);
    const victim = reading.pieces.find(item => item.piece.square === fixture.victim)!;
    expect(victim).toMatchObject({
      piece: { occupant: { role: "pawn", color: fixture.name } }, enPrise: true,
      legalCapturers: [{ square: fixture.capturer, captureUci: fixture.capture, exchange: {
        captured: { square: fixture.victim }, landingSquare: fixture.landing, resultUnits: 1,
      } }],
    });
  });

  it.each(enPassantPushes)("retains the $name victim/capture/landing through the sealed reading factory", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const reading = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen: input.afterFen });
    expect(reading.payload.pieces.find(item => item.piece.square === fixture.victim)).toMatchObject({
      enPrise: true,
      legalCapturers: [{ captureUci: fixture.capture, exchange: { captured: { square: fixture.victim }, landingSquare: fixture.landing } }],
    });
    expect(evidenceValueReceipt(reading).factory).toBe("createRulesTacticReadingLoosePieceV1Evidence");
  });

  it.each(enPassantPushes)("emits a gained exposure for the actual $name double-pushed pawn", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const result = loosePieceEvents(input.beforeFen, input.moveUci);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("a legal double push unexpectedly abstained");
    expect(result.events).toContainEqual(expect.objectContaining({
      sign: "gained", mover: expect.objectContaining({ after: { square: fixture.victim, role: "pawn" } }),
      before: expect.objectContaining({ enPrise: false }), after: expect.objectContaining({ enPrise: true }),
    }));
  });

  it.each(enPassantPushes)("presents the $name pawn's actual exposure through serialized Post-commit Nudge", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const result = invokeEvidenceValueRoute("rules.tactic.event.loose_piece@1", input);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("the legal double push unexpectedly abstained");
    const values = result.value;
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ sign: "gained", mover: { after: { square: fixture.victim, role: "pawn" } }, after: { legalCapturers: [{ captureUci: fixture.capture }] } });
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 1 }, values));
    const wire = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    expect(wire).toHaveLength(1);
    const caption = presentedSentence(wire[0]!);
    expect(caption).toContain(`pawn on ${fixture.victim}`);
    expect(caption).toContain(`capturable from ${fixture.capturer}`);
    expect(caption).not.toContain(`pawn on ${fixture.landing}`);
  });

  it.each(enPassantPushes)("retains the $name double-push exposure in the complete legal candidate packet", fixture => {
    const compiled = compileCandidatePopulation({ beforeFen: fixture.fen, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
    expect(compiled.kind).toBe("ready");
    if (compiled.kind !== "ready") throw new Error(JSON.stringify(compiled.error));
    const candidate = compiled.receipt.packet.candidates.find(item => item.moveUci === fixture.move)!;
    expect(candidate.events.filter(item => item.projection.id === "rules.tactic.event.loose_piece").map(item => item.operands)).toContainEqual(expect.objectContaining({
      sign: "gained", mover: expect.objectContaining({ after: { square: fixture.victim, role: "pawn" } }),
    }));
    expect(compiled.receipt.packet.candidates).toHaveLength(compiled.receipt.packet.legalMoves.length);
  });

  it.each(enPassantPushes)("reconstructs $name en-passant exposure from committed run bytes", fixture => {
    const at = "2026-10-09T00:00:00.000Z";
    const initial = createRun({ id: `ep-${fixture.name}`, packId: "special-move-boundary", packDigest: `sha256:${"0".repeat(64)}`, startFen: fixture.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const run = commitMove(initial, fixture.move, { at }).run;
    const saved = JSON.parse(JSON.stringify(run)) as typeof run;
    const child = saved.nodes.at(-1)!;
    const parent = saved.nodes.find(node => node.id === child.parentId)!;
    expect(localSemanticEvents(parent.fen, child.moveUci!, child.fen).filter(item => item.projection.id === "rules.tactic.event.loose_piece").map(item => item.operands)).toContainEqual(expect.objectContaining({
      sign: "gained", after: expect.objectContaining({ legalCapturers: [expect.objectContaining({ captureUci: fixture.capture })] }),
    }));
    expect(saved).toEqual(run);
  });

  it.each([
    { name: "white", fen: "4r1k1/8/8/3pP3/8/8/8/4K3 w - d6 0 1", victim: "d5", capture: "e5d6" },
    { name: "black", fen: "4k3/8/8/8/3Pp3/8/8/4R1K1 b - d3 0 1", victim: "d4", capture: "e4d3" },
  ])("refuses a king-exposing $name en-passant capture", fixture => {
    expect(positionFromFen(fixture.fen).isLegal(parseUci(fixture.capture)!)).toBe(false);
    const value = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen: fixture.fen });
    expect(value.payload.pieces.find(item => item.piece.square === fixture.victim)).toMatchObject({ legalCapturers: [], enPrise: false });
  });

  it.each(enPassantPushes)("does not invent expired rights for the $name victim", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const fields = input.afterFen.split(" ");
    fields[3] = "-";
    const fen = fields.join(" ");
    expect(positionFromFen(fen).isLegal(parseUci(fixture.capture)!)).toBe(false);
    const value = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen });
    expect(value.payload.pieces.find(item => item.piece.square === fixture.victim)).toMatchObject({ legalCapturers: [], enPrise: false });
  });

  it.each([
    { name: "white", fen: "3rk3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", victim: "d5", capture: "e5d6", landing: "d6" },
    { name: "black", fen: "4k3/8/8/8/3Pp3/8/8/3RK3 b - d3 0 1", victim: "d4", capture: "e4d3", landing: "d3" },
  ])("retains an equal $name en-passant exchange without calling the pawn en prise", fixture => {
    const value = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen: fixture.fen });
    expect(value.payload.pieces.find(item => item.piece.square === fixture.victim)).toMatchObject({
      enPrise: false, underDefended: false,
      legalCapturers: [{ captureUci: fixture.capture, exchange: { captured: { square: fixture.victim }, landingSquare: fixture.landing, resultUnits: 0 } }],
    });
  });

  it("retains ordinary and en-passant captures of one pawn once each", () => {
    const fen = "4k3/8/8/3pP3/8/8/6B1/4K3 w - d6 0 1";
    const reading = invokeEvidenceValueRoute("rules.tactic.reading.loose_piece@1", { fen });
    const captures = reading.payload.pieces.find(item => item.piece.square === "d5")!.legalCapturers;
    expect(captures.map(item => item.captureUci)).toEqual(["e5d6", "g2d5"]);
    expect(captures.map(item => item.exchange.captured.square)).toEqual(["d5", "d5"]);
    expect(captures.map(item => item.exchange.landingSquare)).toEqual(["d6", "d5"]);
  });

  it("keeps the shared recapture helper landing-based rather than victim-based", () => {
    const position = positionFromFen("4k3/8/8/3pP3/8/8/6B1/4K3 w - d6 0 1");
    expect(legalCaptureMovesTo(position, parseSquare("d5")!).map(move => move.to)).toEqual([parseSquare("d5")]);
    expect(legalCaptureMovesTo(position, parseSquare("d6")!).map(move => move.to)).toEqual([parseSquare("d6")]);
  });
});
