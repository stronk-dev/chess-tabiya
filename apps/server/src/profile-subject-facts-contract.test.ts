// Literal grammar/algebra controls only. These fixtures issue no source/publication authority.
import { describe, expect, it } from "vitest";
import { parseLongitudinalSubjectObservationRow as parse, subjectObservationKey } from "./profile-subject-facts-contract.js";
import { LONGITUDINAL_INGEST_REGISTRY } from "./longitudinal-registry.js";
const context = { learnerId: "owner", runId: "run", decisionRef: { kind: "move", nodeId: "n2", eventSeq: 2 }, phase: "opening",
  decisionClass: "played", sessionKind: "position", packId: null, observedAt: "2026-11-10T00:00:00.000Z", derivedRev: 9,
  actor: "black", occurred: false, legalAlternatives: 9, matchingAlternatives: 2, comparableAlternatives: 8 };
const piece = { color: "white", role: "bishop", square: "c1" };
const subjects: Record<string, unknown> = {
  backward_pawn: { kind: "backward_pawn", color: "white", rootSquare: "b2" },
  doubled_pawn: { kind: "doubled_pawn", color: "white", file: "b" },
  half_open_file: { kind: "half_open_file", color: "black", file: "b" },
  isolated_pawn: { kind: "isolated_pawn", color: "white", file: "b" },
  king_opposition: { kind: "king_opposition", whiteRootSquare: "e2", blackRootSquare: "e5" },
  king_zone: { kind: "king_zone", color: "black", rootSquare: "e8" },
  line_blockers: { kind: "line_blockers", root: piece, direction: { df: 1, dr: 1 } },
  open_file: { kind: "open_file", file: "b" },
  passed_pawn: { kind: "passed_pawn", color: "black", rootSquare: "b7" },
  piece_count: { kind: "piece_count", color: "white", role: "knight" },
  direct_attack_count: { kind: "direct_attack_count", color: "black", square: "f3" },
  loose_piece: { kind: "loose_piece", root: piece },
  pawn_islands: { kind: "pawn_islands", color: "black" },
};
const nativeSubjects: Record<string, unknown> = {
  "rules.structural.event.king_opposition": subjects.king_opposition,
  "rules.structural.event.backward_pawn": subjects.backward_pawn,
  "derived.structural.event.pawn_file_group": { kind: "pawn_file_group", color: "black", file: "b" },
  "rules.transition.event.slider_ray": { kind: "physical_slider", root: piece, direction: { df: 1, dr: 1 } },
  "derived.activity.event.file_state": { kind: "file_state", file: "b" },
  "derived.activity.event.file_access_revealed": { kind: "file_access", piece: { color: "white", role: "queen", square: "b1" }, file: "b" },
  "rules.structural.event.pawn_islands": subjects.pawn_islands,
};
const conditionRows = LONGITUDINAL_INGEST_REGISTRY.flatMap(r => r.kind === "population" ? [{ ...context, sourceKind: "condition_relation", ...(r.family === "loose_piece" ? { actor: "white" } : {}), projectionId: r.projection.id,
  projectionVersion: r.projection.version, subject: subjects[r.family], parameters: r.family === "king_opposition" ? { holder: "white", form: "direct" }
    : r.family === "king_zone" ? { zone: "corner" } : {}, relation: r.relations[0] }] : []);
const nativeRows = LONGITUDINAL_INGEST_REGISTRY.flatMap(r => r.kind === "native" ? [{ ...context, sourceKind: "native_incidence", projectionId: r.projection.id,
  projectionVersion: r.projection.version, subject: nativeSubjects[r.projection.id], parameters: {}, sign: r.signs[0], comparableAlternatives: 9 }] : []);
const row = conditionRows.find(r => r.projectionId === "derived.semantic_avoidance.doubled_pawn")!;

describe("closed subject observation storage grammar", () => {
  it.each([...conditionRows, ...nativeRows])("retains exact subject/parameters, actor and tested outcome: $projectionId", literal => {
    const parsed = parse(literal);
    expect(parsed).toEqual(literal);
    expect(parsed).not.toBe(literal);
    expect(Object.isFrozen(parsed.subject)).toBe(true);
    expect(Object.isFrozen(parsed.parameters)).toBe(true);
  });
  it("keeps true and false opportunities and counts incomparable alternatives in the full denominator", () => {
    expect(parse(row)).toMatchObject({ occurred: false, matchingAlternatives: 2, comparableAlternatives: 8, legalAlternatives: 9 });
    expect(parse({ ...row, occurred: true })).toMatchObject({ occurred: true, matchingAlternatives: 2 });
    for (const change of [
      { legalAlternatives: 0 }, { legalAlternatives: 1.5 }, { legalAlternatives: NaN }, { legalAlternatives: Infinity },
      { matchingAlternatives: -1 }, { matchingAlternatives: 9 }, { comparableAlternatives: 10 }, { comparableAlternatives: 1 },
      { occurred: 1 }, { occurred: false, matchingAlternatives: 0 }, { occurred: true, matchingAlternatives: 8 },
    ]) expect(() => parse({ ...row, ...change })).toThrow("LONGITUDINAL_SUBJECT_ROW_INVALID");
    expect(() => parse({ ...nativeRows[0]!, comparableAlternatives: 8 })).toThrow();
  });
  it("rejects legacy, current prevalence, paths, wrong versions, family swaps and invented parameters", () => {
    for (const change of [
      { projectionVersion: 1 }, { projectionVersion: 3 }, { projectionId: "rules.structural.event.king_zone" },
      { projectionId: "derived.exchange.trade_completed" }, { sourceKind: "native_incidence" },
      { subject: subjects.passed_pawn }, { parameters: { strength: 3 } }, { relation: "avoided" },
      { relation: "increase" }, { subject: { kind: "doubled_pawn", color: "purple", file: "b" } },
      { subject: { kind: "doubled_pawn", color: "white", file: "i" } },
    ]) expect(() => parse({ ...row, ...change })).toThrow();
    expect(() => parse({ ...row, sign: "gained" })).toThrow();
    expect(() => parse({ ...nativeRows[0]!, relation: "true_to_false" })).toThrow();
  });
  it("rejects false piece/square/direction/native parameter domains", () => {
    const ray = nativeRows.find(r => r.projectionId === "rules.transition.event.slider_ray")!;
    for (const subject of [
      { kind: "physical_slider", root: { ...piece, square: "a9" }, direction: { df: 1, dr: 0 } },
      { kind: "physical_slider", root: piece, direction: { df: 0, dr: 0 } },
      { kind: "physical_slider", root: piece, direction: { df: 2, dr: 0 } },
      { kind: "physical_slider", root: { ...piece, role: "horse" }, direction: { df: 1, dr: 0 } },
    ]) expect(() => parse({ ...ray, subject })).toThrow();
    const access = nativeRows.find(r => r.projectionId === "derived.activity.event.file_access_revealed")!;
    expect(() => parse({ ...access, subject: { kind: "file_access", piece, file: "b" } })).toThrow();
    expect(() => parse({ ...nativeRows[0]!, parameters: { holder: "white", form: "direct" } })).toThrow();
  });
  it("retains exact loose-piece mover/nonking and stationary access-file source correlations", () => {
    const loose = conditionRows.find(r => r.projectionId === "derived.semantic_avoidance.loose_piece")!;
    expect(() => parse({ ...loose, actor: "black" })).toThrow();
    expect(() => parse({ ...loose, subject: { kind: "loose_piece", root: { ...piece, role: "king" } } })).toThrow();
    const access = nativeRows.find(r => r.projectionId === "derived.activity.event.file_access_revealed")!;
    expect(() => parse({ ...access, subject: { kind: "file_access", piece: { color: "white", role: "queen", square: "b1" }, file: "c" } })).toThrow();
  });
  it("refuses accessor/symbol/prototype/extra fields instead of executing or preserving them", () => {
    let reads = 0;
    const getter = { ...row }; Object.defineProperty(getter, "actor", { enumerable: true, get: () => { reads++; return "white"; } });
    expect(() => parse(getter)).toThrow(); expect(reads).toBe(0);
    expect(() => parse({ ...row, [Symbol("hidden")]: 1 })).toThrow();
    expect(() => parse(Object.assign(Object.create({ inherited: true }), row))).toThrow();
    expect(() => parse({ ...row, sourceDigest: "caller claim" })).toThrow();
    expect(() => parse({ ...row, decisionRef: { ...context.decisionRef, actor: "black" } })).toThrow();
  });
  it("enforces decision/class/cohort consistency and immutable-time syntax", () => {
    for (const change of [{ actor: "viewer" }, { phase: "late" }, { sessionKind: "pack" }, { packId: "p" },
      { decisionClass: "game" }, { decisionClass: "predicted" }, { derivedRev: 0 }, { observedAt: "2026-11-10T00:00:00Z" }]) expect(() => parse({ ...row, ...change })).toThrow();
    expect(parse({ ...row, sessionKind: "imported", decisionClass: "game" }).decisionClass).toBe("game");
    expect(parse({ ...row, decisionClass: "predicted", decisionRef: { kind: "prediction", nodeId: "n2", checkpointId: "p", eventSeq: 3 } }).decisionClass).toBe("predicted");
    expect(parse({ ...row, sessionKind: "pack", packId: "p" }).packId).toBe("p");
  });
  it("uses literal canonical identity parts without collapsing subjects, parameters, tested outcomes or decisions", () => {
    const original = parse(row), key = subjectObservationKey(original);
    expect(subjectObservationKey(parse(JSON.parse(JSON.stringify(row))))).toBe(key);
    for (const change of [{ subject: { kind: "doubled_pawn", file: "c", color: "white" } }, { relation: "false_to_false" },
      { decisionRef: { ...context.decisionRef, eventSeq: 4 } }, { runId: "other" }]) expect(subjectObservationKey(parse({ ...row, ...change }))).not.toBe(key);
    const opposition = conditionRows.find(r => r.projectionId === "derived.semantic_avoidance.king_opposition")!;
    expect(subjectObservationKey(parse(opposition))).not.toBe(subjectObservationKey(parse({ ...opposition, parameters: { holder: "black", form: "direct" } })));
    // Actor is a separately validated decision-root operand, never inferred from subject color.
    expect(original.actor).toBe("black"); expect(original.subject).toMatchObject({ color: "white" });
  });
});
