// Disposable D3768 research: characterize the current rule, not qualify or change it.
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { evidenceForConsumer, evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { compileHintDisclosure, hintSentence } from "../../packages/runtime/src/hint-distance.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { forcedMateAfterMove } from "../../packages/runtime/src/mate-proof.js";
import { presentEvidenceItems, presentedSentence } from "../../packages/runtime/src/presentation-contract.js";
import { doubleAttackEvent, forkSurvivesReply, promotionPressureReading, replyBreadth } from "../../packages/runtime/src/tactics.js";
import { selectFixture } from "../../packages/runtime/src/testing/hint-fixture.js";

const terminal = [
  { name: "white checkmate", fen: "R5rk/5Q2/6K1/8/8/8/8/8 w - - 0 1", move: "f7g7", check: true },
  { name: "black checkmate", fen: "8/8/8/8/8/6k1/5q2/r5RK b - - 0 1", move: "f2g2", check: true },
  { name: "white stalemate", fen: "5K1k/6pp/7R/6Q1/3B4/8/8/8 w - - 0 1", move: "g5g6", check: false },
  { name: "black stalemate", fen: "8/8/8/3b4/6q1/7r/6PP/5k1K b - - 0 1", move: "g4g3", check: false },
] as const;

function edge(fen: string, moveUci: string) {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return { beforeFen: fen, moveUci, afterFen: canonicalFen(position) };
}

describe("D3768 terminal all-reply predicate research", () => {
  it.each(terminal)("characterizes $name at collector and factory boundaries", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const after = positionFromFen(input.afterFen);
    expect(after.isEnd()).toBe(true);
    expect(after.isCheck()).toBe(fixture.check);
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci);
    expect(attack).toBeDefined();
    const breadth = replyBreadth(input.beforeFen, input.moveUci);
    expect(breadth).toMatchObject({ terminal: true, check: fixture.check, count: 0, replies: [] });
    // This assertion records the existing vacuous result; it is not an expected chess verdict.
    expect(forkSurvivesReply(attack!, breadth)).toMatchObject({ matched: true, refutingReplies: [] });
    const doubleAttack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const declaredBreadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    const result = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack, breadth: declaredBreadth });
    expect(result.payload).toMatchObject({ matched: true, replyBreadth: { terminal: true, count: 0 }, refutingReplies: [] });
    expect(evidenceValueReceipt(result).factory).toBe("createDerivedTacticForkSurvivesReplyV1Evidence");
  });

  it.each(terminal)("retains $name in admitted registered presentation", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const doubleAttack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    const result = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack, breadth });
    const admitted = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 1 }, [result]);
    const captions = presentEvidenceItems(admitted).filter(item => item.component.id === "fact_statement").map(presentedSentence);
    expect(captions).toHaveLength(1);
    expect(captions[0]).toContain("0");
  });

  it.each(terminal)("measures actual candidate-to-hint selection for $name", fixture => {
    // A controlled provider exchange exercises source admission, not real Stockfish advice.
    const selection = selectFixture(fixture.fen, [fixture.move]);
    expect(selection.kind).toBe("selected");
    if (selection.kind !== "selected") throw new Error("terminal candidate was not selected");
    expect(selection.horizon.payload.family).toBe(fixture.check ? "mate_in_one" : "fork_survives_reply");
    const disclosure = compileHintDisclosure(selection.horizon, "pattern");
    expect(hintSentence(disclosure.payload)).toContain(fixture.check ? "mate" : "after every reply");
  });

  it.each(terminal)("keeps the mate proof's explicit $name result", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const breadth = replyBreadth(input.beforeFen, input.moveUci);
    expect(forcedMateAfterMove(input.beforeFen, input.moveUci, 1, breadth)).toMatchObject({
      kind: "proof", proof: { rootReplies: [], proofStatus: fixture.check ? "proved" : "refuted", terminalNonMate: !fixture.check },
    });
  });

  it.each([
    { name: "white", fen: "5K1k/P5pp/7R/6Q1/3B4/8/8/8 w - - 0 1", move: "g5g6", pawn: "a7" },
    { name: "black", fen: "8/8/8/3b4/6q1/7r/p5PP/5k1K b - - 0 1", move: "g4g3", pawn: "a2" },
  ])("keeps $name promotion persistence false after stalemate", fixture => {
    const input = edge(fixture.fen, fixture.move);
    expect(replyBreadth(input.beforeFen, input.moveUci)).toMatchObject({ terminal: true, check: false, count: 0 });
    const pawn = promotionPressureReading(input.afterFen).pawns.find(value => value.pawn.square === fixture.pawn);
    expect(pawn).toMatchObject({ passAvailability: { kind: "available", value: true }, replyPersistence: { kind: "available", value: false } });
  });

  it.each([
    { name: "white positive", fen: "k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q", matched: true },
    { name: "black positive", fen: "4k3/8/8/8/8/8/6pR/K7 b - - 0 1", move: "g2g1q", matched: true },
    { name: "white refutable", fen: "k6r/6P1/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q", matched: false },
    { name: "black refutable", fen: "4k3/8/8/8/8/8/6p1/K6R b - - 0 1", move: "g2g1q", matched: false },
  ])("keeps the nonterminal $name control", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci);
    expect(attack).toBeDefined();
    const breadth = replyBreadth(input.beforeFen, input.moveUci);
    expect(breadth.terminal).toBe(false);
    expect(breadth.count).toBeGreaterThan(0);
    const result = forkSurvivesReply(attack!, breadth);
    expect(result.matched).toBe(fixture.matched);
    expect(result.refutingReplies.length === 0).toBe(fixture.matched);
    expect(result.refutingReplies.every(reply => breadth.replies.includes(reply))).toBe(true);
  });
});
