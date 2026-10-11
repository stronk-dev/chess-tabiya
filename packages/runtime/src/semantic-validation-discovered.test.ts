// D3710: exact local execution, not latent potential, strategic value or a forced continuation.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Role, Square } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { KING_ZONE_CITED_SOURCE, DISCOVERED_CITED_SOURCE, RECORDED_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const byId = new Map(raw.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const rows = DISCOVERED_CITED_SOURCE.cases;
const subject = rows[0]!.proposition.subject;
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }

// Independent integer geometry and raw occupancy, not attacks(), between(), latency,
// transition rays, exchange predicates or the discovered-execution implementation.
function interior(from: Square, to: Square, role: Role): Square[] | undefined {
  const dx = to % 8 - from % 8, dy = Math.floor(to / 8) - Math.floor(from / 8);
  const diagonal = Math.abs(dx) === Math.abs(dy), straight = dx === 0 || dy === 0;
  if (from === to || !(role === "bishop" ? diagonal : role === "rook" ? straight : role === "queen" && (diagonal || straight))) return undefined;
  const step = Math.sign(dx) + 8 * Math.sign(dy), squares: Square[] = [];
  for (let square = from + step; square !== to; square += step) squares.push(square as Square);
  return squares;
}

describe("D3710 source-bound discovered execution", () => {
  it.each(rows)("$proposition.case.id independently checks identities and a completed operation", async row => {
    const before = position(row.input.beforeFen), move = parseUci(row.input.moveUci);
    if (move === undefined || !("from" in move)) throw new Error("ordinary move required");
    expect(before.isLegal(move)).toBe(true);
    const mover = before.board.get(move.from)!;
    const after = before.clone(); after.play(move);
    expect(makeFen(after.toSetup())).toBe(row.input.afterFen);
    // Every enemy piece in this finite population is the king. The oracle can therefore
    // prove the complete target population without smuggling in an exchange judgement.
    expect([...before.board[opposite(mover.color)]]).toHaveLength(1);
    const targetSquare = before.board.kingOf(opposite(mover.color))!;
    const targetPiece = before.board.get(targetSquare)!;
    const expected = [...before.board].flatMap(([sliderSquare, sliderPiece]) => {
      if (sliderPiece.color !== mover.color || sliderSquare === move.from) return [];
      const ray = interior(sliderSquare, targetSquare, sliderPiece.role);
      if (ray === undefined) return [];
      const blockers = ray.filter(square => before.board.has(square));
      if (blockers.length !== 1 || blockers[0] !== move.from || ray.some(square => after.board.has(square))) return [];
      expect(after.board.get(sliderSquare)).toEqual(sliderPiece);
      expect(after.board.get(targetSquare)).toEqual(targetPiece);
      return [{ screen: { square: makeSquare(move.from), piece: mover }, slider: { square: makeSquare(sliderSquare), piece: sliderPiece },
        target: { square: makeSquare(targetSquare), occupant: targetPiece }, raySquares: ray.sort((a, b) => a - b).map(makeSquare), discoveredCheck: true }];
    });
    expect(expected).toHaveLength(row.arm === "positive" ? 1 : 0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(row.input);
    expect(result.kind).toBe("completed");
    const targets = selectSemanticTargets(result, subject);
    expect(targets).toHaveLength(expected.length);
    expect(targets.map(observationEvidence).map(value => value.payload)).toEqual(expected.map(value => expect.objectContaining(value)));
    if (row.arm === "positive") {
      expect(before.isCheck()).toBe(false); expect(after.isCheck()).toBe(true);
      for (const target of targets) expect(target).toMatchObject({ kind: "event", item: { sign: "gained", derivationInputs: [
        { projection: { id: "rules.tactic.reading.discovered_latency", version: 1 } },
        { projection: { id: "rules.transition.event.slider_ray", version: 1 } },
      ] } });
    } else if (row.proposition.case.id.includes("direct-check")) {
      // There IS a check, but it belongs to the moved rook, not an unmasked stationary one.
      expect(after.isCheck()).toBe(true);
      expect(selectSemanticTargets(result, { kind: "event", projection: { id: "rules.tactic.event.check", version: 1 } })).toHaveLength(1);
    }
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.input).toEqual(row.input);
    expect(value!.expectation).toEqual(row.proposition.expectation);
    expect(value!.operation).toEqual(DISCOVERED_CITED_SOURCE.operation);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    expect(receipt.otherCount).toBeGreaterThan(0);
  });

  it("adds its negative arm without discarding the earlier positive or granting qualification", () => {
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.positive).toMatchObject({ disposition: "present", refs: expect.arrayContaining([{ id: "local.knight-unmasks-g2.discovered", version: 1, kind: "case", subject, arm: "positive" }]) });
    expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: rows.filter(row => row.arm === "semantic_negative").map(row => ({ id: row.proposition.case.id })) });
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
  });

  it("rejects borrowed input, expectation, subject and operation before invoking a producer", async () => {
    const value = byId.get(rows.find(row => row.arm === "positive")!.proposition.case.id);
    expect(value).toBeDefined();
    for (const edit of [{ input: rows[1]!.input }, { arm: "semantic_negative", expectation: { kind: "omits" } },
      { subject: { kind: "event", projection: { id: "rules.tactic.event.check", version: 1 } } },
      { operation: { id: "runtime.semantic.transition_edge", version: 1 } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("preserves the entire 249-case predecessor and adds sixteen independent cases", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    const added = raw.filter(value => ids.has(value.id as string));
    expect(added).toHaveLength(16);
    expect(added.filter(value => value.arm === "positive")).toHaveLength(6);
    const later = new Set([...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.filter(source => source.sourceId === "python-chess.recorded.pressure").flatMap(source => source.cases.map(row => row.proposition.case.id))]);
    const prior = raw.filter(value => !ids.has(value.id as string) && !later.has(value.id as string));
    expect(prior).toHaveLength(249);
    expect(evidenceDigest(prior)).toBe("b6d4a66c8f02c639dce94ab0d2702df2efdb90e9dc1be889221cf77fd4c14e71");
  });
});
