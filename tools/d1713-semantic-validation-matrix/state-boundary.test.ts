// DISPOSABLE D3745/D3687 contract research. These are production-operation observations,
// not registered authority cases, a new validator or permission to change source semantics.
import { describe, expect, it } from "vitest";
import { makeUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/position-cache.js";
import { SEMANTIC_VALIDATION_OPERATIONS, canonicalSemanticEdge, observationEvidence } from "../../packages/runtime/src/semantic-validation-operations.js";
import { selectSemanticTargets } from "../../packages/runtime/src/semantic-validation-runner.js";
import { SEMANTIC_VALIDATION_PROFILES } from "../../packages/runtime/src/semantic-validation-registry.js";

const roots = [
  ["rules.structural.event.piece_count", 12],
  ["rules.structural.event.pawn_islands", 2],
  ["rules.king.event.zone_state", 2],
  ["rules.tactic.consequence.reply_breadth", 1],
  ["rules.square.event.control", null],
] as const;
const subject = (id: string) => ({ kind: "event", projection: { id, version: 1 } } as const);
const starts = [
  ["initial-white", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
  ["initial-black", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"],
  ["bare-kings", "8/8/5k2/8/8/2K5/8/8 w - - 0 1"],
  ["en-passant", "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1"],
  ["promotion", "4k3/P7/8/8/8/8/8/4K3 w - - 0 1"],
  ["castling", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"],
  ["bishop", "4k3/8/8/8/8/8/2B5/4K3 w - - 0 1"],
  ["queen", "k7/8/1QK5/8/8/8/8/8 w - - 0 1"],
] as const;
const invoke = (input: ReturnType<typeof canonicalSemanticEdge>) => SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(input);

describe("D3745 current whole-event omission boundary", () => {
  it.each(roots)("%s still requires whole-event omission", (id) => {
    const profile = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.projection.id === id && row.subject.projection.version === 1);
    expect(profile?.semanticNegative.disposition).toBe("required");
  });

  it.each(starts)("every legal successor from %s retains the five target families", async (name, fen) => {
    const position = positionFromFen(fen), edges = [...position.allDests()].flatMap(([from, destinations]) =>
      [...destinations].flatMap(to => position.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)
        ? (["queen", "rook", "bishop", "knight"] as const).map(promotion => ({ from, to, promotion }))
        : [{ from, to }]));
    expect(edges.length).toBeGreaterThan(0);
    for (const move of edges) {
      const input = canonicalSemanticEdge({ kind: "edge", beforeFen: canonicalFen(position), moveUci: makeUci(move), afterFen: "recomputed" });
      const result = await invoke(input);
      expect(result.kind).toBe("completed");
      for (const [id, arity] of roots) {
        const targets = selectSemanticTargets(result, subject(id));
        if (arity === null) {
          // This family is sparse deltas, NOT a complete-state snapshot. The real move
          // nevertheless changes at least one pseudo-controller identity/edge.
          expect(targets.length, `${name}/${input.moveUci}/${id}`).toBeGreaterThan(0);
          expect(targets.map(observationEvidence).some(value => (value.payload as { mode: string }).mode === "pseudo")).toBe(true);
        } else expect(targets, `${name}/${input.moveUci}/${id}`).toHaveLength(arity);
      }
    }
    console.info(`D3745 ${name}: ${edges.length} complete legal edges; all five families nonempty`);
  }, 30_000);

  it("zero pawns and zero legal replies are valid populated state, not omission", async () => {
    const input = canonicalSemanticEdge({ kind: "edge", beforeFen: "k7/8/1QK5/8/8/8/8/8 w - - 0 1", moveUci: "b6b7", afterFen: "recomputed" });
    const result = await invoke(input);
    expect(result.kind).toBe("completed");
    const islands = selectSemanticTargets(result, subject("rules.structural.event.pawn_islands")).map(observationEvidence);
    expect(islands).toHaveLength(2);
    for (const value of islands) expect(value.payload).toMatchObject({ before: 0, after: 0 });
    const counts = selectSemanticTargets(result, subject("rules.structural.event.piece_count")).map(observationEvidence);
    const pawns = counts.filter(value => (value.payload as { before: { role: string } }).before.role === "pawn");
    expect(pawns).toHaveLength(2);
    for (const value of pawns) expect(value.payload).toMatchObject({ before: { count: 0 }, after: { count: 0 } });
    const breadth = selectSemanticTargets(result, subject("rules.tactic.consequence.reply_breadth")).map(observationEvidence);
    expect(breadth).toHaveLength(1);
    expect(positionFromFen(input.afterFen).hasDests()).toBe(false);
    expect(breadth[0]!.payload).toMatchObject({ replies: [], count: 0, terminal: true });
    // A genuinely conditional event supplies a control for the same operation/selector.
    expect(selectSemanticTargets(result, subject("rules.tactic.event.check"))).toHaveLength(1);
    const quiet = canonicalSemanticEdge({ kind: "edge", beforeFen: starts[0][1], moveUci: "e2e4", afterFen: "recomputed" });
    expect(selectSemanticTargets(await invoke(quiet), subject("rules.tactic.event.check"))).toEqual([]);
  });

  it("a null move cannot supply a legal whole-event negative", async () => {
    const input = { kind: "edge", beforeFen: starts[0][1], moveUci: "0000", afterFen: starts[0][1] } as const;
    await expect(async () => invoke(input)).rejects.toThrow();
  });

  it("an unchanged after position cannot hide the controller changes of a real move", async () => {
    const input = { kind: "edge", beforeFen: starts[0][1], moveUci: "e2e4", afterFen: starts[0][1] } as const;
    await expect(async () => invoke(input)).rejects.toThrow();
  });
});
