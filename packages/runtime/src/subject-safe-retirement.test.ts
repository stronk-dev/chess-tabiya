import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_PROJECTION_REFS } from "./evidence-catalog.js";
import { SEMANTIC_VALIDATION_PROFILES } from "./semantic-validation-registry.js";
import liveCases from "./semantic-validation-cases.json" with { type: "json" };
import { parseSemanticValidationCase } from "./semantic-validation.js";
import { resolveSemanticValidationProposition, semanticFrozenExpectationSha256, sha256Text } from "./semantic-validation-authorities.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { compileSemanticEvidenceEvent, pawnIslandSemanticEvents } from "./semantic-evidence.js";
import { pawnConnectivityReading } from "./structure.js";
import { SUBJECT_SAFE_RETIRED_CASES, SUBJECT_SAFE_RETIRED_ASSERTION_BODIES, SUBJECT_SAFE_RETIRED_PROFILES,
  SUBJECT_SAFE_RETIRED_POPULATIONS } from "./testing/subject-safe-retired-semantic-cases.js";

const keys = ["rules.structural.event.backward_pawn@1", "rules.structural.event.king_opposition@1", "rules.structural.event.pawn_islands@1",
  "rules.structural.event.isolated_pawn@1", "rules.structural.event.doubled_pawn@1", "rules.structural.event.open_file@1",
  "rules.structural.event.half_open_file@1", "rules.structural.event.line_blockers@1", "rules.transition.event.slider_ray@1"];
const key = (projection: { id: string; version: number }) => `${projection.id}@${projection.version}`;

describe("unchanged custody of retired public semantic event meanings", () => {
  it("moves all51 original cases,9 profiles and8 population receipts without retagging their authority", () => {
    expect(SUBJECT_SAFE_RETIRED_CASES).toHaveLength(51);
    expect(evidenceDigest(SUBJECT_SAFE_RETIRED_CASES)).toBe("0aaf779329c5fb13649021b56b10ae429832a43ba21bbf63fda24a1357dd274b");
    expect(SUBJECT_SAFE_RETIRED_PROFILES).toHaveLength(9); expect(SUBJECT_SAFE_RETIRED_POPULATIONS).toHaveLength(8);
    for (const row of SUBJECT_SAFE_RETIRED_CASES) expect(liveCases.cases.some(value => value.id === row.id)).toBe(false);
    for (const route of keys) {
      expect(SEMANTIC_EVENT_PROJECTION_REFS.some(value => key(value) === route)).toBe(false);
      expect(SEMANTIC_VALIDATION_PROFILES.some(value => key(value.subject.projection) === route)).toBe(false);
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some(value => key(value.projection) === route)).toBe(false);
    }
  });

  it.each(SUBJECT_SAFE_RETIRED_CASES.map(parseSemanticValidationCase))("$id retains the exact original proposition/assertion", value => {
    const crossed = { ...value, subject: { ...value.subject, projection: { ...value.subject.projection, version: 2 } } };
    if (value.authority.kind === "existing_assertion") {
      const body = SUBJECT_SAFE_RETIRED_ASSERTION_BODIES[value.authority.testSite]; expect(body).toBeDefined();
      expect(sha256Text(body!)).toBe(value.authority.sourceSha256);
      expect(semanticFrozenExpectationSha256(value)).toBe(value.authority.frozenExpectationSha256);
      expect(semanticFrozenExpectationSha256(crossed)).not.toBe(value.authority.frozenExpectationSha256);
    } else {
      expect(resolveSemanticValidationProposition(value)).toMatchObject({ subject: value.subject, case: { id: value.id, version: 1 }, expectation: value.expectation });
      expect(() => resolveSemanticValidationProposition(crossed)).toThrow();
    }
  });

  it("keeps a rank-only pawn advance's old count meaning without emitting a current topology change", () => {
    const before = "4k3/8/8/8/8/8/PP1P4/4K3 w - - 0 1", after = "4k3/8/8/8/1P6/8/P2P4/4K3 b - - 0 1";
    expect(pawnConnectivityReading(before).colors.find(value => value.color === "white")!.islandCount).toBe(2);
    expect(pawnConnectivityReading(after).colors.find(value => value.color === "white")!.islandCount).toBe(2);
    const original = SUBJECT_SAFE_RETIRED_CASES.map(parseSemanticValidationCase).find(value => value.id === "structural.b-pawn-double.islands")!;
    expect(original.expectation).toEqual({ kind: "emits", minimum: 1, sign: "preserved" });
    expect(pawnIslandSemanticEvents(before, "b2b4", after)).toEqual([]);
  });

  it("keeps target-bearing slider1 callable only as a private raw prerequisite, never a semantic wrapper", () => {
    const original = SUBJECT_SAFE_RETIRED_CASES.map(parseSemanticValidationCase).find(value => value.id === "cited.python-chess.slider_ray.gained.white")!;
    const input = original.input; if (input.kind !== "edge") throw Error("Expected original edge");
    const values = invokeEvidenceValueRoute("rules.transition.event.slider_ray@1", { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen });
    expect(values.length).toBeGreaterThan(0);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === "rules.transition.event.slider_ray@1")!;
    expect(declaration.disposition?.kind).toBe("operator_only");
    expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: values[0]!, anchor: { beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen, side: input.beforeFen.split(" ")[1] === "w" ? "white" : "black" }, sign: "gained" })).toThrow();
  });
});
