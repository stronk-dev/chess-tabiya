// D3639: legal rule facts, not new strategic judgements. The independent GPL source
// excerpts are pinned in semantic-validation-cited-sources; every case executes the
// registered production operation, including nearby negatives that emit other events.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pawnAttacks, rookAttacks } from "chessops/attacks";
import { opposite, parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";
import { positionFromFen } from "./position-cache.js";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";
import { BOUNDED_TARGET_CITED_SOURCE, KING_ZONE_CITED_SOURCE, DISCOVERED_CITED_SOURCE, ATTACK_CITED_SOURCES, CAPTURE_DEPENDENT_NEGATIVE_FAMILIES, PAWN_DYNAMICS_CITED_SOURCE, RECORDED_CITED_SOURCES, RULE_STATE_CITED_SOURCES } from "./semantic-validation-literal-sources.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const cases = raw.map(parseSemanticValidationCase);
const byId = new Map(cases.map(value => [value.id, value]));

const pawnAbsenceFamilies = ["backward_pawn", "isolated_pawn", "doubled_pawn", "passed_pawn", "open_file", "half_open_file"] as const;
const pawnAbsenceRows = pawnAbsenceFamilies.flatMap(family => ["white", "black"].map(color => ({
  family, color, caseId: `cited.python-chess.pawn-absence.${family}.${color}`,
})));

const pawnPositiveRows = pawnAbsenceFamilies.flatMap(family => ["gained", "lost", "preserved"].flatMap(sign =>
  ["white", "black"].map(color => ({ family, sign, color,
    caseId: `cited.stockfish.pawn-files.${family}.${sign}.${color}` }))));

describe("D3685 source-bound pawn/file membership", () => {
  it.each(pawnPositiveRows)("$caseId retains the exact membership through legal production play", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing canonical positive ${row.caseId}`).toBeDefined();
    expect(value!.arm).toBe("positive");
    expect(value!.operation).toEqual({ id: "runtime.semantic.structural_edge", version: 1 });
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    expect(receipt.targetCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    const targets = selectSemanticTargets(result, value!.subject);
    const expectedSquare = row.color === "white" ? "c4" : "c5";
    const subject = { kind: row.family, ...(row.family === "open_file" ? {} : { color: row.color }),
      ...(row.family === "passed_pawn" ? { squares: [expectedSquare] } : { file: "c", squares: [] }) };
    const expected = { family: row.family, before: row.sign === "gained" ? null : subject,
      after: row.sign === "lost" ? null : subject };
    const matching = targets.filter(target => {
      const payload = observationEvidence(target).payload as { before: unknown; after: unknown };
      return evidenceDigest(payload.before) === evidenceDigest(expected.before) &&
        evidenceDigest(payload.after) === evidenceDigest(expected.after);
    });
    expect(matching).toHaveLength(1);
    expect(observationEvidence(matching[0]!).payload).toMatchObject(expected);
    expect(matching[0]!.kind).toBe("event");
    if (matching[0]!.kind === "event") expect(matching[0]!.item.sign).toBe(row.sign);
    if (value!.input.kind !== "edge") throw new Error("pawn fixture must be a played edge");
    // Retained neutral operands, independently of the structural classifier:
    // occupancy, files, relative ranks and pawn attack direction only. This
    // finite check does not grade a move or adopt Stockfish's evaluation scores.
    const membership = [value!.input.beforeFen, value!.input.afterFen].map(fen => {
      const position = positionFromFen(fen), color = row.color as "white" | "black";
      const own = [...position.board.pawn.intersect(position.board[color])];
      const enemy = [...position.board.pawn.intersect(position.board[opposite(color)])];
      const cPawns = own.filter(square => square % 8 === 2);
      if (row.family === "open_file") return [...own, ...enemy].every(square => square % 8 !== 2);
      if (row.family === "half_open_file") return cPawns.length === 0 && enemy.some(square => square % 8 === 2);
      if (row.family === "isolated_pawn") return cPawns.length > 0 && own.every(square => ![1, 3].includes(square % 8));
      if (row.family === "doubled_pawn") {
        if (cPawns.length === 2) expect(Math.abs(cPawns[0]! - cPawns[1]!)).toBe(8);
        return cPawns.length === 2;
      }
      const forward = color === "white" ? 1 : -1;
      if (row.family === "passed_pawn") {
        const square = parseSquare(expectedSquare)!;
        expect(position.board.get(square)).toMatchObject({ role: "pawn", color });
        return enemy.every(other => Math.abs(other % 8 - 2) > 1 ||
          (Math.floor(other / 8) - Math.floor(square / 8)) * forward <= 0);
      }
      const square = parseSquare(color === "white" ? "c3" : "c6")!;
      const stop = square + 8 * forward;
      expect(position.board.get(square)).toMatchObject({ role: "pawn", color });
      expect(position.board.get(stop)).toBeUndefined();
      expect(own.filter(other => [1, 3].includes(other % 8))).toEqual([parseSquare(color === "white" ? "d4" : "d5")]);
      return enemy.some(other => pawnAttacks(opposite(color), other).has(stop));
    });
    expect(membership).toEqual([row.sign !== "gained", row.sign !== "lost"]);
  });

  it.each(pawnAbsenceFamilies)("%s closes its positive arm and rejects borrowed inputs/operands", async family => {
    const subject = { kind: "event" as const, projection: { id: `rules.structural.event.${family}`, version: 1 } };
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.positive).toMatchObject({ disposition: "present", refs: pawnPositiveRows.filter(row => row.family === family)
      .map(row => ({ id: row.caseId })) });
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const value = byId.get(`cited.stockfish.pawn-files.${family}.gained.white`)!;
    const lost = byId.get(`cited.stockfish.pawn-files.${family}.lost.white`)!;
    for (const edit of [{ input: lost.input }, { expectation: lost.expectation },
      { operation: { id: "runtime.semantic.transition_edge", version: 1 } },
      { subject: { kind: "event", projection: { id: "rules.structural.event.piece_count", version: 1 } } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("retains all 139 predecessor records alongside 36 new positives", () => {
    const laterIds = new Set([...BOUNDED_TARGET_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...DISCOVERED_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...ATTACK_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...RULE_STATE_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...PAWN_DYNAMICS_CITED_SOURCE.cases.map(row => row.proposition.case.id)]);
    expect(cases.filter(value => pawnPositiveRows.some(row => row.caseId === value.id))).toHaveLength(36);
    expect(cases.filter(value => !laterIds.has(value.id) && !pawnPositiveRows.some(row => row.caseId === value.id))).toHaveLength(139);
    expect(evidenceDigest(raw.filter(value => !laterIds.has(value.id as string) && !pawnPositiveRows.some(row => row.caseId === value.id))))
      .toBe("5859d9a11f0a7b32c8f7175e86c7caf79d38215ded671f9275e7dc4336573f69");
  });
});

describe("D3676 populated pawn-structure absence", () => {
  it.each(pawnAbsenceRows)("$caseId omits the exact family after completed legal play", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing populated canonical negative ${row.caseId}`).toBeDefined();
    expect(value!.arm).toBe("semantic_negative");
    expect(value!.subject).toEqual({ kind: "event", projection: { id: `rules.structural.event.${row.family}`, version: 1 } });
    expect(value!.operation).toEqual({ id: "runtime.semantic.structural_edge", version: 1 });
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, targetCount: 0, failure: null });
    expect(receipt.otherCount).toBeGreaterThan(0);
    if (value!.input.kind !== "edge") throw new Error("pawn absence fixture must be a played edge");
    // Independent literal arithmetic, not the classifier under test: each colour
    // occupies every file exactly once on its initial pawn rank. Every pawn has
    // an adjacent friendly pawn, and an opposing pawn further along its file.
    for (const fen of [value!.input.beforeFen, value!.input.afterFen]) {
      const position = positionFromFen(fen);
      for (const color of ["white", "black"] as const) {
        const own = [...position.board.pawn.intersect(position.board[color])];
        const enemy = [...position.board.pawn.intersect(position.board[opposite(color)])];
        expect(own).toHaveLength(8);
        expect(enemy).toHaveLength(8);
        expect(new Set(own.map(square => square % 8)).size).toBe(8);
        for (const square of own) {
          expect(Math.floor(square / 8)).toBe(color === "white" ? 1 : 6);
          expect(own.some(other => Math.abs(other % 8 - square % 8) === 1)).toBe(true);
          expect(enemy.some(other => other % 8 === square % 8 &&
            (other - square) * (color === "white" ? 1 : -1) > 0)).toBe(true);
        }
      }
    }
  });

  it.each(pawnAbsenceFamilies)("%s retains its omission arm and refuses borrowed authority", async family => {
    const subject = { kind: "event" as const, projection: { id: `rules.structural.event.${family}`, version: 1 } };
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: [
      { id: `cited.python-chess.pawn-absence.${family}.white` },
      { id: `cited.python-chess.pawn-absence.${family}.black` },
    ] });
    expect(profile.positive.disposition).toBe("present");
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const value = byId.get(`cited.python-chess.pawn-absence.${family}.white`)!;
    const other = byId.get(`cited.python-chess.pawn-absence.${family}.black`)!;
    for (const edit of [{ input: other.input }, { expectation: { kind: "emits", minimum: 1 }, arm: "positive" },
      { subject: { kind: "event", projection: { id: "rules.structural.event.piece_count", version: 1 } } },
      { operation: { id: "runtime.semantic.local_edge", version: 1 } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("adds twelve absence cases without retiring any of the 127 prior cases", () => {
    const laterIds = new Set([...BOUNDED_TARGET_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...DISCOVERED_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...ATTACK_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...RULE_STATE_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...PAWN_DYNAMICS_CITED_SOURCE.cases.map(row => row.proposition.case.id)]);
    expect(cases.filter(value => pawnAbsenceRows.some(row => value.id === row.caseId))).toHaveLength(12);
    expect(cases.filter(value => !laterIds.has(value.id) && !pawnAbsenceRows.some(row => value.id === row.caseId) &&
      !pawnPositiveRows.some(row => value.id === row.caseId))).toHaveLength(127);
  });
});

const positiveContacts = ["occupied_attack", "occupied_defence", "slider_ray", "defended_duty"] as const;
const contactTransitions = positiveContacts.flatMap(family => ["gained", "lost", "populated-negative"].flatMap(sign =>
  ["white", "black"].map(color => ({ family, sign, color,
    caseId: `cited.python-chess.${family}.${sign}.${color}` }))));

describe("D3667 exact contact transitions", () => {
  it.each(contactTransitions)("$caseId retains its actor, targets and direction through real play", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing canonical transition ${row.caseId}`).toBeDefined();
    const negative = row.sign === "populated-negative";
    expect(value!.arm).toBe(negative ? "semantic_negative" : "positive");
    expect(value!.subject).toEqual({ kind: "event", projection: {
      id: `rules.transition.event.${row.family}`, version: 1,
    } });
    expect(value!.operation).toEqual({ id: "runtime.semantic.transition_edge", version: 1 });
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1,
      targetCount: negative ? 0 : 1, failure: null });
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    if (negative) {
      expect(receipt.otherCount).toBeGreaterThan(0);
      expect(selectSemanticTargets(result, { kind: "event", projection: {
        id: "rules.transition.event.clock_reset", version: 1,
      } })).toHaveLength(1);
      if (value!.input.kind !== "edge") throw new Error("contact fixture must be a played edge");
      const before = positionFromFen(value!.input.beforeFen), after = positionFromFen(value!.input.afterFen);
      const color = row.color as "white" | "black", white = color === "white";
      if (row.family === "occupied_attack" || row.family === "occupied_defence") {
        const actor = parseSquare(white ? "c2" : "c7")!, target = parseSquare(
          row.family === "occupied_attack" ? white ? "d3" : "d6" : white ? "b3" : "b6")!;
        for (const position of [before, after]) {
          expect(position.board.get(actor)).toEqual({ color, role: "pawn", promoted: false });
          expect(position.board.get(target)).toEqual({ color: row.family === "occupied_defence" ? color : opposite(color), role: "knight", promoted: false });
          expect(pawnAttacks(color, actor).has(target)).toBe(true);
        }
        if (row.family === "occupied_defence") {
          expect(pawnAttacks(color, parseSquare(white ? "a2" : "a7")!).has(target)).toBe(true);
          expect(pawnAttacks(color, parseSquare(white ? "a3" : "a6")!).has(target)).toBe(false);
        }
      } else if (row.family === "slider_ray") {
        for (const position of [before, after]) {
          const rook = parseSquare(white ? "a2" : "a7")!, blocker = parseSquare(white ? "c2" : "c7")!;
          expect(position.board.get(rook)).toEqual({ color, role: "rook", promoted: false });
          expect(position.board.get(blocker)).toEqual({ color, role: "pawn", promoted: false });
          expect(rookAttacks(rook, position.board.occupied).has(parseSquare(white ? "d2" : "d7")!)).toBe(false);
        }
      } else {
        const defender = parseSquare(white ? "c3" : "c6")!;
        const targets = [parseSquare(white ? "b4" : "b5")!, parseSquare(white ? "d4" : "d5")!];
        const attackerSquares = [parseSquare(white ? "e6" : "e3")!, parseSquare(white ? "e5" : "e4")!];
        [before, after].forEach((position, index) => {
          expect(position.board.get(defender)).toEqual({ color, role: "pawn", promoted: false });
          expect(targets.every(square => pawnAttacks(color, defender).has(square))).toBe(true);
          expect(position.board.get(attackerSquares[index]!)).toEqual({ color: opposite(color), role: "pawn", promoted: false });
          expect(targets.filter(square => pawnAttacks(opposite(color), attackerSquares[index]!).has(square))).toHaveLength(index);
        });
      }
      return;
    }
    const payload = observationEvidence(selectSemanticTargets(result, value!.subject)[0]!).payload;
    const white = row.color === "white", gained = row.sign === "gained";
    const targets = row.family === "defended_duty" ? white ? ["b4", "d4"] : ["b5", "d5"]
      : row.family === "slider_ray" ? [white ? gained ? "c2" : "c3" : gained ? "c7" : "c6"]
      : [white ? "a3" : "a6"];
    expect(payload).toMatchObject({ family: row.family, sign: row.sign });
    if (row.family === "defended_duty") {
      expect(payload).toMatchObject({ subject: { piece: white ? "c3" : "c6", color: row.color, role: "pawn" },
        targets_before: gained ? [targets[0]] : targets,
        targets_after: gained ? targets : [targets[0]] });
    } else if (row.family === "slider_ray") {
      expect(payload).toMatchObject({ subject: { slider: white ? gained ? "a2" : "a3" : gained ? "a7" : "a6",
        color: row.color, role: "rook", endpoint: white ? gained ? "h2" : "h3" : gained ? "h7" : "h6" },
        targets_before: gained ? targets : [], targets_after: gained ? [] : targets });
    } else {
      expect(payload).toMatchObject({ subject: { color: row.color, target: white ? "b4" : "b5",
        occupant: { color: row.family === "occupied_defence" ? row.color : white ? "black" : "white", role: "knight" } },
        targets_before: gained ? [] : targets, targets_after: gained ? targets : [] });
    }
  });

  it.each(positiveContacts)("%s closes its positive arm without borrowing another operation or expectation", async family => {
    const subject = { kind: "event" as const, projection: { id: `rules.transition.event.${family}`, version: 1 } };
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.positive).toMatchObject({ disposition: "present", refs: ["gained", "lost"].flatMap(sign =>
      ["white", "black"].map(color => ({ id: `cited.python-chess.${family}.${sign}.${color}` }))) });
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const positive = byId.get(`cited.python-chess.${family}.gained.white`)!;
    const negative = byId.get(`cited.python-chess.${family}.populated-negative.white`)!;
    for (const edit of [{ input: negative.input }, { expectation: { kind: "omits" }, arm: "semantic_negative" },
      { subject: { kind: "event", projection: { id: "rules.transition.event.clock_reset", version: 1 } } },
      { operation: { id: "runtime.semantic.local_edge", version: 1 } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...positive, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("retains every prior canonical case while adding exactly sixteen positives and eight negatives", () => {
    expect(contactTransitions).toHaveLength(24);
    expect(cases.filter(value => contactTransitions.some(row => value.id === row.caseId))).toHaveLength(24);
    const laterIds = new Set([...BOUNDED_TARGET_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...DISCOVERED_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...ATTACK_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...RULE_STATE_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...PAWN_DYNAMICS_CITED_SOURCE.cases.map(row => row.proposition.case.id)]);
    expect(cases.filter(value => !laterIds.has(value.id) && !contactTransitions.some(row => value.id === row.caseId) &&
      !pawnAbsenceRows.some(row => value.id === row.caseId) &&
      !pawnPositiveRows.some(row => value.id === row.caseId))).toHaveLength(103);
  });
});

// D3666: a played pawn advance resets the clock but creates no occupied contacts
// when the only other pieces are distant kings. These are completed legal
// negatives, not invalid input or an omitted helper argument.
const contactFamilies = ["occupied_attack", "occupied_defence", "slider_ray", "pawn_contact", "defended_duty"] as const;
const contactRows = contactFamilies.flatMap(family => ["white", "black"].map(color => ({
  family, color, caseId: `cited.python-chess.${family}.isolated-push.${color}`,
})));

describe("D3666 completed contact negatives", () => {
  it.each(contactRows)("$caseId records the played pawn advance without inventing contacts", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing source-bound case ${row.caseId}`).toBeDefined();
    expect(value!.subject).toEqual({ kind: "event", projection: {
      id: `rules.transition.event.${row.family}`, version: 1,
    } });
    expect(value!.arm).toBe("semantic_negative");
    expect(value!.operation).toEqual({ id: "runtime.semantic.transition_edge", version: 1 });
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1,
      targetCount: 0, failure: null });
    expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    const clock = selectSemanticTargets(result, { kind: "event", projection: {
      id: "rules.transition.event.clock_reset", version: 1,
    } });
    expect(clock).toHaveLength(1);
    expect(observationEvidence(clock[0]!).payload).toMatchObject({
      mover: { color: row.color, role: "pawn" }, detail: { pawnMove: true, capture: false },
    });
  });

  it.each(contactFamilies)("%s binds its negatives without waiving other validation arms", async family => {
    const projection = { id: `rules.transition.event.${family}`, version: 1 };
    const subject = { kind: "event" as const, projection };
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: expect.arrayContaining([
      { id: `cited.python-chess.${family}.isolated-push.white` },
      { id: `cited.python-chess.${family}.isolated-push.black` },
    ].map(ref => expect.objectContaining(ref))) });
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const value = byId.get(`cited.python-chess.${family}.isolated-push.white`)!;
    const capture = byId.get("cited.python-chess.capture.direct.white")!;
    for (const edit of [{ input: capture.input }, { subject: capture.subject },
      { arm: "positive", expectation: { kind: "emits", minimum: 1 } },
      { operation: { id: "runtime.semantic.local_edge", version: 1 } }]) {
      const forged = parseSemanticValidationCase({ ...value, ...edit });
      expect(await executeSemanticValidationCase(forged, SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });
});

const families = [
  { id: "capture", projection: "rules.transition.event.capture", operation: "runtime.semantic.transition_edge", examples: ["direct", "en-passant", "castle-negative"] },
  { id: "zeroing", projection: "rules.transition.event.clock_reset", operation: "runtime.semantic.transition_edge", examples: ["pawn", "capture", "castle-negative"] },
  { id: "check", projection: "rules.tactic.event.check", operation: "runtime.semantic.local_edge", examples: ["direct", "discovered", "blocked-negative"] },
  { id: "rights", projection: "rules.castling.event.rights_lost", operation: "runtime.semantic.local_edge", examples: ["rook", "king", "absent-negative"] },
] as const;
const rows = families.flatMap(family => family.examples.flatMap(example => ["white", "black"].map(color => ({ ...family, example, color, caseId: `cited.python-chess.${family.id}.${example}.${color}` }))));

describe("source-grounded literal event validation", () => {
  it.each(rows)("$caseId reaches exact production facts or a completed legal negative", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing canonical case ${row.caseId}`).toBeDefined();
    expect(value!.subject).toEqual({ kind: "event", projection: { id: row.projection, version: 1 } });
    expect(value!.operation).toEqual({ id: row.operation, version: 1 });
    const negative = row.example.endsWith("negative");
    expect(value!.arm).toBe(negative ? "semantic_negative" : "positive");
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    expect(receipt.targetCount).toBe(negative ? 0 : row.id === "rights" && row.example === "king" ? 2 : 1);
    if (negative) expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    const targets = selectSemanticTargets(result, value!.subject);
    if (row.id === "rights" && row.example === "king") expect(targets.map(target => (observationEvidence(target).payload as { wing: string }).wing).sort()).toEqual(["kingside", "queenside"]);
    for (const target of targets) {
      const payload = observationEvidence(target).payload;
      if (row.id === "capture") expect(payload).toMatchObject({ mover: { color: row.color }, captured: { color: row.color === "white" ? "black" : "white", role: row.example === "en-passant" ? "pawn" : "knight" }, enPassant: row.example === "en-passant" });
      if (row.id === "zeroing") expect(payload).toMatchObject({ mover: { color: row.color }, detail: { pawnMove: row.example === "pawn", capture: row.example === "capture" } });
      if (row.id === "check") expect(payload).toMatchObject({ checkingPieces: [{ piece: { color: row.color, role: "rook" }, square: row.example === "discovered" ? row.color === "white" ? "e1" : "e8" : row.color === "white" ? "a8" : "a1" }], checkedKing: { piece: { color: row.color === "white" ? "black" : "white", role: "king" }, square: row.color === "white" ? "e8" : "e1" } });
      if (row.id === "rights") expect(payload).toMatchObject({ color: row.color, cause: row.example === "king" ? "king_moved" : "rook_moved" });
    }
  });

  it.each(families)("$id rejects borrowed inputs, subjects, expectations and operations before invocation", async family => {
    const positive = byId.get(`cited.python-chess.${family.id}.${family.examples[0]}.white`)!;
    const negative = byId.get(`cited.python-chess.${family.id}.${family.examples[2]}.white`)!;
    expect(positive).toBeDefined(); expect(negative).toBeDefined();
    for (const edit of [
      { input: negative.input },
      { subject: { kind: "event", projection: { id: "rules.transition.event.promotion", version: 1 } } },
      { arm: "semantic_negative", expectation: { kind: "omits" } },
      { operation: { id: "runtime.semantic.structural_edge", version: 1 } },
    ]) {
      const forged = parseSemanticValidationCase({ ...positive, ...edit });
      expect(await executeSemanticValidationCase(forged, SEMANTIC_VALIDATION_RESOLVERS, byId)).toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("closes only the four legal-negative cells; preserves all prior cases and orientation debt", () => {
    expect(rows).toHaveLength(24);
    expect(cases.filter(value => rows.some(row => row.caseId === value.id))).toHaveLength(24);
    const added = new Set([...BOUNDED_TARGET_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...CAPTURE_DEPENDENT_NEGATIVE_FAMILIES.flatMap(family =>
      ["white", "black"].map(color => `cited.python-chess.${family.id}.castle-negative.${color}`)),
      ...contactRows.map(row => row.caseId), ...contactTransitions.map(row => row.caseId),
      ...pawnAbsenceRows.map(row => row.caseId), ...pawnPositiveRows.map(row => row.caseId),
      ...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...DISCOVERED_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...ATTACK_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...RULE_STATE_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...PAWN_DYNAMICS_CITED_SOURCE.cases.map(row => row.proposition.case.id)]);
    expect(cases.filter(value => !rows.some(row => row.caseId === value.id) && !added.has(value.id))).toHaveLength(63);
    for (const family of families) {
      const subject = { kind: "event" as const, projection: { id: family.projection, version: 1 } };
      const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
      expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: [
        { id: `cited.python-chess.${family.id}.${family.examples[2]}.white` },
        { id: `cited.python-chess.${family.id}.${family.examples[2]}.black` },
      ] });
      expect(profile.orientation.disposition).toBe("required");
      expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    }
  });
});

describe("D3663 capture-dependent legal negatives", () => {
  const rows = CAPTURE_DEPENDENT_NEGATIVE_FAMILIES.flatMap(family =>
    ["white", "black"].map(color => ({ ...family, color,
      caseId: `cited.python-chess.${family.id}.castle-negative.${color}` })));
  it.each(rows)("$caseId completes the operation without removing or exchanging a piece", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing source-bound case ${row.caseId}`).toBeDefined();
    expect(value!.subject).toEqual({ kind: "event", projection: { id: row.projection, version: 1 } });
    expect(value!.operation).toEqual({ id: row.operation, version: 1 });
    expect(value!.arm).toBe("semantic_negative");
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1,
      targetCount: 0, failure: null });
    expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    const castling = selectSemanticTargets(result, { kind: "event", projection: {
      id: "rules.transition.event.castled", version: 1 } });
    expect(castling).toHaveLength(1);
    expect(observationEvidence(castling[0]!).payload).toMatchObject({ mover: { color: row.color, role: "king" } });
  });
  it.each(CAPTURE_DEPENDENT_NEGATIVE_FAMILIES)("$id rejects borrowing a capture-positive or another event's authority", async family => {
    const value = byId.get(`cited.python-chess.${family.id}.castle-negative.white`)!;
    expect(value).toBeDefined();
    const capture = byId.get("cited.python-chess.capture.direct.white")!;
    for (const edit of [{ input: capture.input }, { subject: capture.subject },
      { arm: "positive", expectation: { kind: "emits", minimum: 1 } }]) {
      const forged = parseSemanticValidationCase({ ...value, ...edit });
      expect(await executeSemanticValidationCase(forged, SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });
  it("closes exactly three negative arms while retaining existing positives and orientation debt", () => {
    expect(rows).toHaveLength(6);
    expect(cases.filter(value => rows.some(row => row.caseId === value.id))).toHaveLength(6);
    for (const family of CAPTURE_DEPENDENT_NEGATIVE_FAMILIES) {
      const subject = { kind: "event" as const, projection: { id: family.projection, version: 1 } };
      const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
      expect(profile.positive.disposition).toBe("present");
      expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: [
        { id: `cited.python-chess.${family.id}.castle-negative.white` },
        { id: `cited.python-chess.${family.id}.castle-negative.black` },
      ] });
      expect(profile.orientation.disposition).toBe("required");
      expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    }
  });
});
