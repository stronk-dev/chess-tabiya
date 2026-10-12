// D3730: the registered batch, canonical authority and independent legal operands.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSquare, parseSquare, parseUci, opposite } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { BOUNDED_VALIDATION_FIXTURES } from "./semantic-validation-bounded-sources.js";
import { BOUNDED_TARGET_CITED_SOURCE } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const byId = new Map(raw.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const rows = BOUNDED_TARGET_CITED_SOURCE.cases;
const position = (fen: string) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();

describe("D3730 source-bound bounded material-target cases", () => {
  it.each(BOUNDED_VALIDATION_FIXTURES)("$id independently establishes the finite rule boundary", fixture => {
    const source = position(fixture.fen);
    expect(source.isCheck()).toBe(false);
    expect([...source.allDests()].flatMap(([, destinations]) => [...destinations]).length).toBeGreaterThan(0);
    const setup = source.toSetup();
    const passed = Chess.fromSetup({ ...setup, turn: opposite(source.turn), epSquare: undefined }).unwrap();
    const preserved = fixture.id.startsWith("all-candidates-preserve");
    const capture = parseUci(preserved ? fixture.reflected ? "f4h2" : "f5h7" : fixture.reflected ? "b5e2" : "b4e7")!;
    if (!("from" in capture)) throw new Error("literal normal capture required");
    expect(passed.board.get(capture.from)).toMatchObject({ color: passed.turn, role: "bishop" });
    expect(passed.board.get(capture.to)).toMatchObject({ color: source.turn, role: "knight" });
    expect(passed.isLegal(capture)).toBe(!fixture.id.startsWith("blocked-ray"));
    if (fixture.id.startsWith("blocked-ray")) {
      expect(passed.board.get(parseSquare(fixture.reflected ? "c4" : "c5")!)).toMatchObject({ color: source.turn, role: "pawn" });
    } else {
      const after = passed.clone(); after.play(capture);
      const recaptures = [...after.allDests()].flatMap(([from, destinations]) => destinations.has(capture.to) ? [{ from, to: capture.to }] : []);
      expect(recaptures.map(move => makeSquare(move.from))).toEqual(fixture.emits ? [] : [fixture.reflected ? "h2" : "h7"]);
      // Under the declared units, 3 minus 3 is zero; an unrecaptured knight is +3.
      expect(3 - (recaptures.length === 0 ? 0 : 3)).toBe(fixture.emits ? 3 : 0);
    }
    if (preserved) {
      const candidates = [...source.allDests()].flatMap(([from, destinations]) => [...destinations].map(to => ({ from, to })));
      expect(candidates.map(move => `${makeSquare(move.from)}${makeSquare(move.to)}`).sort())
        .toEqual(fixture.reflected ? ["h1g1", "h1g2"] : ["h8g7", "h8g8"]);
      for (const candidate of candidates) {
        const after = source.clone(); after.play(candidate);
        expect(after.isLegal(capture)).toBe(true);
        after.play(capture);
        expect([...after.allDests()].some(([, destinations]) => destinations.has(capture.to))).toBe(false);
      }
    } else if (fixture.id.includes("restoration")) {
      const block = parseUci(fixture.reflected ? "c3c4" : "c6c5")!;
      expect(source.isLegal(block)).toBe(true);
      source.play(block);
      expect(source.isLegal(capture)).toBe(false);
      const preparation = parseUci(fixture.reflected ? "b5c4" : "b4c5")!;
      expect(source.isLegal(preparation)).toBe(true);
      source.play(preparation);
      expect(source.isCheck()).toBe(true);
      const replies = [...source.allDests()].flatMap(([, destinations]) => [...destinations]);
      expect(replies.length === 0).toBe(fixture.id.startsWith("terminal-restoration"));
    } else if (fixture.emits) {
      const removal = parseUci(fixture.reflected ? "a3b5" : "a6b4")!;
      if (!("from" in removal)) throw new Error("literal removal required");
      expect(source.isLegal(removal)).toBe(true);
      expect(source.board.get(removal.to)).toMatchObject({ color: opposite(source.turn), role: "bishop" });
      source.play(removal);
      // Neither rook nor any later same-role piece can stand in for the captured original bishop.
      expect([...source.board].filter(([, piece]) => piece.color === passed.turn && piece.role === "bishop")).toEqual([]);
    }
  });

  it.each(rows)("$proposition.case.id executes its exact canonical authority and complete batch", async row => {
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical ${row.proposition.case.id}`).toBeDefined();
    expect(value!.input).toEqual(row.input);
    expect(value!.operation).toEqual(BOUNDED_TARGET_CITED_SOURCE.operation);
    expect(value!.expectation).toEqual(row.proposition.expectation);
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.bounded_target_batch"].invoke(row.input);
    expect(result.kind).toBe("completed");
    const targets = selectSemanticTargets(result, value!.subject);
    expect(targets.length > 0).toBe(row.arm === "positive");
    for (const target of targets) expect(evidenceValueReceipt(observationEvidence(target)).factory).toMatch(/^create.*Evidence$/);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null, targetCount: targets.length });
    if (row.arm === "positive") expect(receipt.otherCount).toBeGreaterThan(0);
    if (row.proposition.case.id.includes("bounded_return.all-candidates-preserve")) {
      expect(result.kind === "completed" && result.observations.length).toBe(6);
      expect(receipt.otherCount).toBe(6);
      expect(selectSemanticTargets(result, { kind: "reading", projection: { id: "derived.bounded_target.named_material_target", version: 1 } })).toHaveLength(2);
      const immediate = selectSemanticTargets(result, { kind: "event", projection: { id: "derived.bounded_target.immediate", version: 1 } });
      expect(immediate).toHaveLength(4);
      expect(immediate.map(observationEvidence).map(value => value.payload)).toEqual(immediate.map(() => expect.objectContaining({ outcome: expect.objectContaining({ result: "preserved" }) })));
    }
  });

  it("fills all six case cells without inventing orientation, population or learner permission", () => {
    for (const id of ["named_material_target", "immediate", "bounded_return"]) {
      const subject = rows.find(row => row.proposition.subject.projection.id === `derived.bounded_target.${id}`)!.proposition.subject;
      const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
      for (const [cell, arm] of [[profile.positive, "positive"], [profile.semanticNegative, "semantic_negative"]] as const) {
        expect(cell).toMatchObject({ disposition: "present", refs: rows.filter(row => row.arm === arm && evidenceDigest(row.proposition.subject) === evidenceDigest(subject)).map(row => ({ id: row.proposition.case.id })) });
      }
      expect(profile.orientation.disposition).toBe("required");
      expect(profile.importedPopulation.disposition).toBe("required");
      expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    }
  });

  it("refuses swapped input, kind, operation and expectation before invoking the producer", async () => {
    const value = byId.get(rows[0]!.proposition.case.id)!;
    expect(value).toBeDefined();
    for (const edit of [{ input: rows.find(row => row.arm === "semantic_negative")!.input },
      { subject: { ...value.subject, kind: "event" } },
      { operation: { id: "runtime.semantic.local_edge", version: 1 } },
      { arm: "semantic_negative", expectation: { kind: "omits" } }]) {
      // The wrong operation's input pairing is refused by the parser itself.
      if ("operation" in edit) expect(() => parseSemanticValidationCase({ ...value, ...edit })).toThrow();
      else expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("retains every predecessor case and adds exactly thirty-six explicitly source-bound cases", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    expect(raw.filter(value => ids.has(value.id as string))).toHaveLength(36);
    const prior = raw.filter(value => !ids.has(value.id as string));
    expect(prior).toHaveLength(307);
    expect(evidenceDigest(prior)).toBe("bb70a8da0f7b37bb882cb197ccf89fc8c487a0c702d87e4acc80de8eec7e6beb");
  });
});
