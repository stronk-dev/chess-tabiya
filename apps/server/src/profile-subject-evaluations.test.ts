// Literal coverage is not publication authority. Original source/cut validation belongs to storage.
import { describe, expect, it, vi } from "vitest";
import * as candidate from "../../../packages/runtime/src/candidate-population.js";
import { readCandidateUnavailableSources } from "../../../packages/runtime/src/semantic-source-availability.js";
import { mirrorSemanticFen } from "../../../packages/runtime/src/semantic-validation.js";
import { PROFILE_SUBJECT_PROJECTIONS } from "../../../packages/runtime/src/profile-subject-sources.js";
import { parseLongitudinalSubjectEvaluationRow as parse, parseProfileCoverageProjection,
  parseProfileUnavailableSources, subjectEvaluationKey, type ProfileCoverageProjection } from "./profile-subject-facts-contract.js";

const context = { learnerId: "owner", runId: "run", decisionRef: { kind: "move", nodeId: "n2", eventSeq: 2 }, actor: "white",
  phase: "opening", decisionClass: "played", sessionKind: "position", packId: null,
  legalAlternatives: 11, unavailable: [], observedAt: "2026-11-10T00:00:00.000Z", derivedRev: 10 };
const collector = { projection: { id: "derived.tactic.defender_exposure", version: 2 },
  cause: { kind: "candidate_collector", projection: { id: "derived.tactic.defender_exposure", version: 2 } },
  reason: "invalid_turn_clone", members: [{ kind: "child", moveUci: "a2b3" }] };
const risk = { projection: { id: "derived.semantic_avoidance.loose_piece", version: 2 },
  cause: { kind: "required_total", projection: { id: "rules.tactic.reading.mover_piece_risk", version: 1 } },
  reason: "invalid_turn_clone", members: [{ kind: "root" }, { kind: "child", moveUci: "h1h2" }] };

describe("D4200 per-decision coverage storage grammar", () => {
  it.each([false, true])("roundtrips genuine original source failures without acquiring another graph (mirrored=%s)", mirrored => {
    for (const fen of ["k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", "7k/8/8/8/8/8/8/r6K w - - 0 1"]) {
      const original = candidate.compileCandidatePopulation({ beforeFen: mirrored ? mirrorSemanticFen(fen, "color_and_vertical") : fen,
        ruleset: "standard", scope: candidate.CANDIDATE_WIDE_SCOPE });
      if (original.kind !== "ready") throw Error("Original availability fixture required");
      const unavailable = readCandidateUnavailableSources(original.receipt);
      expect(unavailable.length).toBeGreaterThan(0);
      const input = { ...context, actor: mirrored ? "black" : "white", legalAlternatives: original.receipt.packet.candidates.length - 1, unavailable };
      const compile = vi.spyOn(candidate, "compileCandidatePopulation");
      try {
        const row = parse(input);
        expect(row).toEqual(input);
        expect(row).not.toBe(input);
        expect(row.unavailable).not.toBe(unavailable);
        expect(Object.isFrozen(row)).toBe(true);
        expect(Object.isFrozen(row.unavailable)).toBe(true);
        for (const failed of row.unavailable) {
          expect(Object.isFrozen(failed.projection)).toBe(true);
          expect(Object.isFrozen(failed.cause.projection)).toBe(true);
          expect(Object.isFrozen(failed.members)).toBe(true);
          expect(failed.members.every(Object.isFrozen)).toBe(true);
        }
        expect(compile).not.toHaveBeenCalled();
      } finally { compile.mockRestore(); }
    }
  });

  it("retains evaluated empty/forced decisions and rejects missing coverage", () => {
    expect(parse({ ...context, legalAlternatives: 0 })).toMatchObject({ legalAlternatives: 0, unavailable: [] });
    const { unavailable: _omitted, ...omitted } = context;
    expect(() => parse(omitted)).toThrow();
    for (const unavailable of [null, undefined, false, {}, "[]"]) expect(() => parse({ ...context, unavailable })).toThrow();
    for (const legalAlternatives of [-1, 0.5, NaN, Infinity]) expect(() => parse({ ...context, legalAlternatives })).toThrow();
  });

  it("admits exactly the existing54 source refs and rejects widened type/alias domains", () => {
    expect(PROFILE_SUBJECT_PROJECTIONS).toHaveLength(54);
    for (const source of PROFILE_SUBJECT_PROJECTIONS) expect(parseProfileCoverageProjection(source)).toEqual(source);
    const bad: ProfileCoverageProjection[] = [
      // @ts-expect-error The persisted source union never admits an arbitrary version.
      { id: "rules.structural.event.king_opposition", version: 99 },
      // @ts-expect-error A recorded trade is not a Profile coverage source.
      { id: "derived.exchange.trade_completed", version: 1 },
      // @ts-expect-error There is no arbitrary projection/prefix fallback.
      { id: "derived.future.unqualified", version: 1 },
    ];
    bad.forEach(source => expect(() => parseProfileCoverageProjection(source)).toThrow());
    expect(() => parseProfileCoverageProjection({ ...PROFILE_SUBJECT_PROJECTIONS[0], extra: true })).toThrow();
  });

  it("closes failure refs, cause pairs and reasons independently of source membership", () => {
    for (const change of [
      { projection: { id: "rules.structural.event.king_opposition", version: 2 } },
      { projection: { ...collector.projection, version: 1 } },
      { cause: { ...collector.cause, kind: "required_total" } },
      { cause: { ...collector.cause, projection: { id: "rules.tactic.event.loose_piece", version: 1 } } },
      { reason: "unknown" }, { extra: true },
    ]) expect(() => parseProfileUnavailableSources([{ ...collector, ...change }])).toThrow();
    expect(parseProfileUnavailableSources([risk, collector])).toEqual([risk, collector]);
    expect(() => parseProfileUnavailableSources([collector, risk])).toThrow();
    expect(() => parseProfileUnavailableSources([collector, collector])).toThrow();
    expect(() => parseProfileUnavailableSources([{ ...risk, cause: collector.cause }])).toThrow();
  });

  it("requires unique nonempty dense members and the exact root/child shapes", () => {
    for (const members of [[], [{ kind: "root" }], [{ kind: "child", moveUci: "a2b3" }, { kind: "child", moveUci: "a2b3" }],
      [{ kind: "child", moveUci: "a9b3" }], [{ kind: "child", moveUci: "a2b3K" }], [{ kind: "child", moveUci: "a2b3", extra: true }],
      [{ kind: "other", moveUci: "a2b3" }], [{ kind: "child" }], Array(1)]) {
      expect(() => parseProfileUnavailableSources([{ ...collector, members }])).toThrow();
    }
    expect(() => parseProfileUnavailableSources([{ ...risk, members: [{ kind: "child", moveUci: "h1h2" }, { kind: "root" }] }])).toThrow();
    expect(() => parseProfileUnavailableSources([{ ...risk, members: [{ kind: "root", moveUci: "h1h2" }] }])).toThrow();
    const decorated = Object.assign([collector], { extra: true });
    expect(() => parseProfileUnavailableSources(decorated)).toThrow();
  });

  it("captures data without invoking accessors and refuses symbols/prototype bags", () => {
    const getter = vi.fn(() => []);
    expect(() => parse(Object.defineProperty({ ...context }, "unavailable", { enumerable: true, get: getter }))).toThrow();
    const array = [collector];
    Object.defineProperty(array, "0", { enumerable: true, get: getter });
    expect(() => parseProfileUnavailableSources(array)).toThrow();
    expect(() => parseProfileUnavailableSources([{ ...collector, cause: Object.defineProperty({}, "kind", { enumerable: true, get: getter }) }])).toThrow();
    expect(getter).not.toHaveBeenCalled();
    expect(() => parse({ ...context, [Symbol("hidden")]: true })).toThrow();
    expect(() => parse(Object.assign(Object.create(context), context))).toThrow();
  });

  it("reuses decision/cohort grammar and cannot restore a projected DTO as a full storage row", () => {
    for (const change of [{ actor: "purple" }, { phase: "unknown" }, { derivedRev: 0 }, { decisionClass: "predicted" },
      { decisionClass: "game" }, { sessionKind: "pack" }, { packId: "unsourced-pack" }, { observedAt: "2026-11-10" },
      { decisionRef: { ...context.decisionRef, extra: true } }]) expect(() => parse({ ...context, ...change })).toThrow();
    expect(parse({ ...context, sessionKind: "pack", packId: "authored-pack" }).packId).toBe("authored-pack");
    expect(parse({ ...context, decisionClass: "game", sessionKind: "imported" }).decisionClass).toBe("game");
    const { learnerId: _learner, observedAt: _at, derivedRev: _revision, ...projected } = context;
    expect(() => parse(projected)).toThrow();
    const row = parse(context);
    expect(subjectEvaluationKey(row)).not.toBe(subjectEvaluationKey({ ...row, runId: "other" }));
    expect(subjectEvaluationKey(row)).toBe(subjectEvaluationKey({ ...row, unavailable: parseProfileUnavailableSources([collector]) }));
  });
});
