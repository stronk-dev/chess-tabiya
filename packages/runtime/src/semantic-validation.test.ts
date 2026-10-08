// rfc/semantic-validation-authority.md — acceptance criteria and §10 able-to-fail fixtures.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS } from "./evidence-catalog.js";
import { compileEvidenceManifest, declareEvidence, identitySealedEvidenceWithoutValueReceipt, type EvidenceManifestError, type VersionedEvidenceId } from "./evidence-contract.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import {
  SEMANTIC_VALIDATION_REPOSITORY_ROOT,
  SEMANTIC_VALIDATION_RESOLVERS,
  resolveSemanticValidationProposition,
  semanticValidationImportClosure,
} from "./semantic-validation-authorities.js";
import { semanticValidationLawProfile } from "./semantic-validation-law.js";
import { SEMANTIC_VALIDATION_OPERATIONS, type SemanticValidationOperationResult } from "./semantic-validation-operations.js";
import { executeSemanticValidationOracle, type SemanticValidationOracleWitness } from "./semantic-validation-oracles.js";
import { SEMANTIC_VALIDATION_PROFILES, SEMANTIC_VALIDATION_ROOTS, admitValidatedSemanticInstance, semanticValidationSummary, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { SEMANTIC_VALIDATION_RECEIPT } from "./semantic-validation-receipt.generated.js";
import { assertSemanticReachRetained, executeSemanticValidationCase, subjectSemanticResult } from "./semantic-validation-runner.js";
import {
  SEMANTIC_READING_VALIDATION_DECLARATIONS,
  SEMANTIC_VALIDATION_ARMS,
  SemanticValidationError,
  assertSemanticValidationFourWayEquality,
  assertSemanticValidationOwnerTransition,
  assertSemanticValidationRegistryJoins,
  compareSemanticMirror,
  compileSemanticValidationVerdict,
  evaluateSemanticFactConstraints,
  mirrorSemanticFen,
  mirrorSemanticUci,
  parseSemanticValidationCase,
  parseSemanticValidationFactConstraints,
  parseSemanticValidationOwnerAuthorityStore,
  parseSemanticValidationProfile,
  semanticFactConstraintSha256,
  semanticLegalSetDigest,
  semanticPopulationProjectionDigest,
  semanticRecordedPathDigest,
  semanticValidationRoots,
  semanticValidationSubjectKey,
  type SemanticValidationCase,
  type SemanticValidationRegistryRow,
  type SemanticValidationSubject,
  type SemanticValidationVerdictTable,
} from "./semantic-validation.js";

const ROOT = SEMANTIC_VALIDATION_REPOSITORY_ROOT;
const casesJson = (): { readonly cases: readonly Record<string, unknown>[] } => JSON.parse(readFileSync(resolve(ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8"));
const CASES = casesJson().cases.map(parseSemanticValidationCase);
const CASE_MAP = new Map(CASES.map((value) => [value.id, value]));
const rawCase = (id: string): Record<string, unknown> => JSON.parse(JSON.stringify(casesJson().cases.find((value) => value.id === id)));
const code = (run: () => unknown): string | undefined => {
  try {
    run();
    return undefined;
  } catch (error) {
    return (error as { readonly code?: string }).code ?? (error instanceof Error ? error.message : String(error));
  }
};
const event = (id: string, version = 1): SemanticValidationSubject => ({ kind: "event", projection: { id, version } });
const run = (value: SemanticValidationCase) => executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, CASE_MAP);

describe("semantic-validation roots, profiles and verdicts", () => {
  it("[1] derives live roots from production projections and proves four-way equality at import", () => {
    expect(SEMANTIC_VALIDATION_ROOTS.length).toBe(SEMANTIC_VALIDATION_PROFILES.length);
    expect(SEMANTIC_VALIDATION_ROOTS.length).toBe(SEMANTIC_VALIDATION_RECEIPT.verdicts.length);
    expect(SEMANTIC_VALIDATION_ROOTS.map(semanticValidationSubjectKey)).toEqual(SEMANTIC_VALIDATION_PROFILES.map((profile) => semanticValidationSubjectKey(profile.subject)).sort());
    // Provider-reported live.* events are source reports, not repository predicates (changelog 2026-09-24).
    expect(SEMANTIC_VALIDATION_ROOTS.some((subject) => subject.projection.id.startsWith("live."))).toBe(false);
    const roots = SEMANTIC_VALIDATION_ROOTS;
    const declarations = [...SEMANTIC_EVENT_DECLARATIONS.map((declaration) => declaration.validation.profile), ...SEMANTIC_READING_VALIDATION_DECLARATIONS.map((declaration) => declaration.subject)];
    const profiles = SEMANTIC_VALIDATION_PROFILES.map((profile) => profile.subject);
    const verdicts = SEMANTIC_VALIDATION_RECEIPT.verdicts.map((row) => row.subject);
    expect(() => assertSemanticValidationFourWayEquality({ roots, declarations, profiles, verdicts })).not.toThrow();
    // A declaration and profile that mutually omit the same live event still fail against the roots.
    const omitted = semanticValidationSubjectKey(roots[0]!);
    const without = <T extends SemanticValidationSubject>(values: readonly T[]) => values.filter((value) => semanticValidationSubjectKey(value) !== omitted);
    expect(code(() => assertSemanticValidationFourWayEquality({ roots, declarations: without(declarations), profiles: without(profiles), verdicts }))).toBe("SEMANTIC_VALIDATION_ROOT_MISMATCH");
    // The held promotion-race event (or any new root) cannot land without its profile and verdict.
    const held = event("derived.pawn.promotion_race_tablebase");
    expect(code(() => assertSemanticValidationFourWayEquality({ roots: [...roots, held], declarations: [...declarations, held], profiles, verdicts }))).toBe("SEMANTIC_VALIDATION_ROOT_MISMATCH");
  });

  it("[33] rejects a duplicate in each of the four equal populations before any set is built", () => {
    const roots = SEMANTIC_VALIDATION_ROOTS;
    const populations = { roots, declarations: roots, profiles: roots, verdicts: roots };
    for (const label of ["roots", "declarations", "profiles", "verdicts"] as const) {
      expect(code(() => assertSemanticValidationFourWayEquality({ ...populations, [label]: [...roots, roots[3]!] })), label).toBe("SEMANTIC_VALIDATION_DUPLICATE");
    }
  });

  it("[2] carries a profile reference only — no generated label, positives, hard negatives or population token", () => {
    for (const declaration of SEMANTIC_EVENT_DECLARATIONS) expect(declaration.validation).toEqual({ profile: { kind: "event", projection: declaration.projection } });
    const bytes = JSON.stringify(SEMANTIC_EVENT_DECLARATIONS);
    expect(bytes).not.toMatch(/semantic-event:|"positives"|"hardNegatives"|"externalPopulation"/u);
  });

  it("[3] requires all six arms per profile; empty refs, unknown reasons and crossed refs fail", () => {
    const profile = JSON.parse(JSON.stringify(readProfile("rules.transition.event.castled")));
    expect(() => parseSemanticValidationProfile(profile)).not.toThrow();
    const drop = { ...profile }; delete drop.externalLabel;
    expect(code(() => parseSemanticValidationProfile(drop))).toBe("SEMANTIC_VALIDATION_CASE_INVALID");
    expect(code(() => parseSemanticValidationProfile({ ...profile, positive: { disposition: "present", refs: [] } }))).toBe("SEMANTIC_VALIDATION_PROFILE_INVALID");
    expect(code(() => parseSemanticValidationProfile({ ...profile, orientation: { disposition: "not_applicable", reason: "too_hard" } }))).toBe("SEMANTIC_VALIDATION_PROFILE_INVALID");
    // [28] A population ref in a case cell and a case ref in a population/external cell fail.
    const population = profile.importedPopulation.refs[0];
    expect(code(() => parseSemanticValidationProfile({ ...profile, positive: { disposition: "present", refs: [population] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationProfile({ ...profile, importedPopulation: { disposition: "present", refs: [profile.positive.refs[0]] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationProfile({ ...profile, externalLabel: { disposition: "present", refs: [population] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    // [9]/[28] stale input/result versions and the retired R2 token dialect fail.
    expect(code(() => parseSemanticValidationProfile({ ...profile, importedPopulation: { disposition: "present", refs: [{ ...population, inputVersion: 2 }] } }))).toBe("SEMANTIC_VALIDATION_POPULATION_STALE");
    expect(code(() => parseSemanticValidationProfile({ ...profile, importedPopulation: { disposition: "present", refs: [{ ...population, resultVersion: 2 }] } }))).toBe("SEMANTIC_VALIDATION_POPULATION_STALE");
    expect(code(() => parseSemanticValidationProfile({ ...profile, importedPopulation: { disposition: "present", refs: [{ ...population, id: "r2-imported-sample@1" }] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    // [12]/[23] a stale event version, crossed arm and crossed subject fail their strict parser.
    const caseRef = profile.positive.refs[0];
    expect(code(() => parseSemanticValidationProfile({ ...profile, positive: { disposition: "present", refs: [{ ...caseRef, subject: { kind: "event", projection: { id: "rules.transition.event.castled", version: 2 } } }] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationProfile({ ...profile, positive: { disposition: "present", refs: [{ ...caseRef, arm: "semantic_negative" }] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationProfile({ ...profile, positive: { disposition: "present", refs: [{ ...caseRef, version: 2 }] } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
  });

  it("[4][14][27] joins every present ref to exactly one registry row; dead, missing and cross-subject rows fail", () => {
    const rows: SemanticValidationRegistryRow[] = [
      ...CASES.map((value) => ({ kind: "case" as const, id: value.id, subject: value.subject, arm: value.arm })),
      ...SEMANTIC_VALIDATION_PROFILES.flatMap((profile) => profile.importedPopulation.disposition === "present" ? profile.importedPopulation.refs.map((ref) => ({ kind: "population_receipt" as const, id: ref.id, subject: ref.subject, arm: "imported_population" as const })) : []),
      ...SEMANTIC_VALIDATION_PROFILES.flatMap((profile) => profile.externalLabel.disposition === "present" ? profile.externalLabel.refs.map((ref) => ({ kind: "external_disagreement_receipt" as const, id: ref.id, subject: ref.subject, arm: "external_label" as const })) : []),
    ];
    expect(() => assertSemanticValidationRegistryJoins(SEMANTIC_VALIDATION_ROOTS, SEMANTIC_VALIDATION_PROFILES, rows)).not.toThrow();
    // A plausible generated label with no case row.
    expect(code(() => assertSemanticValidationRegistryJoins(SEMANTIC_VALIDATION_ROOTS, SEMANTIC_VALIDATION_PROFILES, rows.filter((row) => row.id !== CASES[0]!.id)))).toBe("SEMANTIC_VALIDATION_CASE_MISSING");
    // An extra dead case referenced by no present cell.
    expect(code(() => assertSemanticValidationRegistryJoins(SEMANTIC_VALIDATION_ROOTS, SEMANTIC_VALIDATION_PROFILES, [...rows, { kind: "case", id: "dead.extra", subject: CASES[0]!.subject, arm: "positive" }]))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    // A case whose subject is outside the live roots.
    expect(code(() => assertSemanticValidationRegistryJoins(SEMANTIC_VALIDATION_ROOTS, SEMANTIC_VALIDATION_PROFILES, [...rows, { kind: "case", id: "outside", subject: event("not.a.root"), arm: "positive" }]))).toBe("SEMANTIC_VALIDATION_ROOT_MISMATCH");
    // A duplicate row cannot disappear into a map.
    expect(code(() => assertSemanticValidationRegistryJoins(SEMANTIC_VALIDATION_ROOTS, SEMANTIC_VALIDATION_PROFILES, [...rows, rows[0]!]))).toBe("SEMANTIC_VALIDATION_DUPLICATE");
  });

  it("[27] keeps a debt-only root honest: zero cases, every arm required, verdict unvalidated", () => {
    const debt = SEMANTIC_VALIDATION_PROFILES.find((profile) => profile.subject.projection.id === "derived.semantic_avoidance.isolated_pawn")!;
    expect(SEMANTIC_VALIDATION_ARMS.filter((arm) => arm !== "external_label").every((arm) => {
      const key = ({ positive: "positive", semantic_negative: "semanticNegative", orientation: "orientation", counterfactual: "counterfactual", imported_population: "importedPopulation" } as const)[arm as Exclude<typeof arm, "external_label">];
      const cell = debt[key];
      return cell.disposition === "required" && cell.owner === "D1716";
    })).toBe(true);
    expect(CASES.some((value) => value.subject.projection.id === debt.subject.projection.id)).toBe(false);
    expect(semanticValidationVerdict(debt.subject)?.verdict).toBe("unvalidated");
    const opposition = SEMANTIC_VALIDATION_PROFILES.find((profile) => profile.subject.projection.id === "rules.structural.event.king_opposition")!;
    expect(opposition.positive).toMatchObject({ disposition: "required", owner: "D1717" });
  });

  it("[21] keeps the literal profiles equal to the §3.2 requirement-law exhibit", () => {
    const external = JSON.parse(readFileSync(resolve(ROOT, "packages/runtime/src/semantic-validation-external.json"), "utf8")) as { readonly receipts: readonly { readonly id: string; readonly subject: SemanticValidationSubject }[] };
    const externalIds = new Map(external.receipts.map((row) => [semanticValidationSubjectKey(row.subject), row.id]));
    const derived = semanticValidationRoots(PRIMARY_EVIDENCE_MANIFEST).map((subject) => semanticValidationLawProfile(subject, CASES, externalIds));
    expect(JSON.parse(JSON.stringify(SEMANTIC_VALIDATION_PROFILES))).toEqual(JSON.parse(JSON.stringify(derived)));
  });

  it("[25] reports passed/open subjects by arm rather than one blended percentage", () => {
    const summary = semanticValidationSummary();
    expect(summary.subjects).toBe(SEMANTIC_VALIDATION_ROOTS.length);
    // Slice A lands with zero passing verdicts: orientation has no emitter-level authority anywhere.
    expect(summary.passed).toBe(0);
    expect(summary.openByArm.orientation).toBe(SEMANTIC_VALIDATION_ROOTS.length);
    const verdict = compileSemanticValidationVerdict(event("x"), SEMANTIC_VALIDATION_ARMS.map((arm) => ({ arm, status: "passed" as const, refs: ["a"] })));
    expect(verdict.verdict).toBe("passed");
    expect(compileSemanticValidationVerdict(event("x"), SEMANTIC_VALIDATION_ARMS.map((arm) => arm === "orientation" ? { arm, status: "required" as const, owner: "o", discharge: "d" } : { arm, status: "passed" as const, refs: ["a"] })).open).toEqual(["orientation"]);
  });
});

function readProfile(id: string): unknown {
  const document = JSON.parse(readFileSync(resolve(ROOT, "packages/runtime/src/semantic-validation-profiles.json"), "utf8")) as { readonly profiles: readonly { readonly subject: SemanticValidationSubject }[] };
  return document.profiles.find((profile) => profile.subject.projection.id === id && profile.subject.projection.version === 1)!;
}

describe("semantic-validation cases and execution", () => {
  it("resolves pinned independent castling positives and nearby negatives through the production emitter", async () => {
    for (const id of ["cited.python-chess.king-to-rook.castled", "cited.python-chess.king-step.no-castle"]) {
      const value = CASE_MAP.get(id)!;
      expect(value, id).toBeDefined();
      expect(resolveSemanticValidationProposition(value)).toMatchObject({ subject: value.subject, case: { id, version: 1 }, expectation: value.expectation });
      const receipt = await run(value);
      expect(receipt, id).toMatchObject({ status: "passed", invocations: 1 });
      expect(receipt.targetCount).toBe(value.arm === "positive" ? 1 : 0);
    }
  });

  it.each([
    ["unknown source", { sourceId: "not-registered" }],
    ["different revision", { sourceRevision: "next-release" }],
    ["different licence", { licence: "CC0-1.0" }],
    ["different proposition", { propositionSha256: "0".repeat(64) }],
    ["different span digest", { span: { start: 0, end: 385, textSha256: "0".repeat(64) } }],
    ["different span bounds", { span: { start: 1, end: 385, textSha256: "2053e402dfeba29ec24cec387308af4d6b03507a5a3545f5df1a08efc326b650" } }],
    ["span past retained bytes", { span: { start: 0, end: 386, textSha256: "2053e402dfeba29ec24cec387308af4d6b03507a5a3545f5df1a08efc326b650" } }],
  ])("rejects a cited reference with %s before production invocation", async (_name, edit) => {
    const base = rawCase("cited.python-chess.king-to-rook.castled");
    const value = parseSemanticValidationCase({ ...base, authority: { ...(base.authority as object), ...edit } });
    expect((await run(value))).toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
  });

  it("binds a citation to its exact case, subject, expectation and legal input rather than laundering a reference", async () => {
    const base = rawCase("cited.python-chess.king-to-rook.castled");
    const negative = rawCase("cited.python-chess.king-step.no-castle");
    for (const edit of [
      { id: "cited.another-case" },
      { subject: event("rules.transition.event.capture") },
      { arm: "semantic_negative", expectation: { kind: "omits" } },
      { input: negative.input },
    ]) {
      const value = parseSemanticValidationCase({ ...base, ...edit });
      expect(await run(value)).toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("cannot pass a castling negative by invoking an unrelated emitter or recategorizing its arm", async () => {
    const base = rawCase("cited.python-chess.king-step.no-castle");
    for (const edit of [
      { operation: { id: "runtime.semantic.structural_edge", version: 1 } },
      { arm: "counterfactual" },
    ]) {
      const value = parseSemanticValidationCase({ ...base, ...edit });
      expect(await run(value)).toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("[16][21] executes every migrated D1713 emitter case through its production operation", async () => {
    const receipts = await Promise.all(CASES.map(run));
    expect(receipts.filter((receipt) => receipt.status !== "passed").map((receipt) => `${receipt.case}: ${receipt.failure?.message}`)).toEqual([]);
    for (const receipt of receipts) {
      expect(receipt.invocations).toBe(1);
      if (receipt.arm === "positive") expect(receipt.targetCount).toBeGreaterThan(0);
      else expect(receipt.targetCount).toBe(0);
      for (const target of receipt.targets) expect(target.factory).toMatch(/^create[A-Z]/u);
    }
    expect(receipts.filter((receipt) => receipt.arm === "positive")).toHaveLength(30);
    expect(receipts.filter((receipt) => receipt.arm === "semantic_negative")).toHaveLength(10);
  });

  it("[5][27] refuses callbacks, prebuilt evidence, forged keys, generated ids and @-suffixed dialects", () => {
    const base = rawCase("transition.short-castle.castled");
    expect(code(() => parseSemanticValidationCase({ ...base, execute: "() => []" }))).toBe("SEMANTIC_VALIDATION_CASE_INVALID");
    expect(code(() => parseSemanticValidationCase({ ...base, expectedEvidence: {} }))).toBe("SEMANTIC_VALIDATION_CASE_INVALID");
    expect(code(() => parseSemanticValidationCase({ ...base, id: "semantic-event:rules.transition.event.castled:positive" }))).toMatch(/SEMANTIC_VALIDATION_CASE/u);
    expect(code(() => parseSemanticValidationCase({ ...base, id: "castled-e1g1@1" }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationCase({ ...base, version: 2 }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationCase({ ...base, operation: { id: "runtime.semantic.transition_edge@1", version: 1 } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
    expect(code(() => parseSemanticValidationCase({ ...base, operation: { id: "runtime.semantic.transition_edge", version: 2 } }))).toBe("SEMANTIC_VALIDATION_CASE_REF_STALE");
  });

  it("[6][22] refuses every wrong operation/input pairing and an incomplete legal set before execution", () => {
    const base = rawCase("transition.short-castle.castled");
    const edge = base.input as Record<string, unknown>;
    const path = { kind: "recorded_path", pathReceipt: { id: "run.record.edge", version: 1 }, edges: [edge], pathDigest: semanticRecordedPathDigest([edge as never]) };
    expect(code(() => parseSemanticValidationCase({ ...base, operation: { id: "runtime.semantic.recorded_path", version: 1 } }))).toBe("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
    expect(code(() => parseSemanticValidationCase({ ...base, input: path }))).toBe("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
    expect(code(() => parseSemanticValidationCase({ ...base, operation: { id: "runtime.semantic.recorded_sequence", version: 1 }, input: { kind: "recorded_sequence", path, family: "deflection", fromPly: 0, horizon: 7 } }))).toBe("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
    expect(code(() => parseSemanticValidationCase({ ...base, operation: { id: "runtime.semantic.recorded_sequence", version: 1 }, input: { kind: "recorded_sequence", path, family: "fork", fromPly: 0, horizon: 2 } }))).toBe("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
    expect(code(() => parseSemanticValidationCase({ ...base, input: { ...path, pathDigest: "0".repeat(64) }, operation: { id: "runtime.semantic.recorded_path", version: 1 } }))).toBe("SEMANTIC_VALIDATION_OPERATION_INPUT_INVALID");
    // An incomplete complete-alternative population (one legal move missing) is an invalid fixture.
    const alternatives = [{ ...edge }];
    const incomplete = parseSemanticValidationCase({ ...base, arm: "counterfactual", expectation: { kind: "omits" }, operation: { id: "runtime.semantic.complete_alternatives", version: 1 }, input: { kind: "complete_alternatives", rootFen: edge.beforeFen, played: edge, alternatives, legalSetDigest: semanticLegalSetDigest(String(edge.beforeFen), ["e1h1"]) } });
    return run(incomplete).then((receipt) => {
      expect(receipt.failure?.code).toBe("SEMANTIC_VALIDATION_FIXTURE_INVALID");
      expect(receipt.invocations).toBe(0);
    });
  });

  it("[7][8] fails a positive that reaches its operation empty and a negative with an illegal or non-successor edge", async () => {
    const negative = rawCase("transition.king-steps-e2.no-castle");
    const disguised = parseSemanticValidationCase({ ...negative, arm: "positive", expectation: { kind: "emits", minimum: 1 } });
    const empty = await executeSemanticValidationCase(disguised, { ...SEMANTIC_VALIDATION_RESOLVERS, resolveProposition: (value) => ({ subject: value.subject, case: { id: value.id, version: 1 }, factConstraint: [], factConstraintSha256: semanticFactConstraintSha256([]), expectation: value.expectation }) }, CASE_MAP);
    expect(empty.failure?.code).toBe("SEMANTIC_VALIDATION_POSITIVE_EMPTY");
    expect(empty.invocations).toBe(1);
    const illegal = parseSemanticValidationCase({ ...negative, input: { ...(negative.input as object), moveUci: "e1e3" } });
    const illegalReceipt = await run(illegal);
    expect(illegalReceipt.failure?.code).toBe("SEMANTIC_VALIDATION_FIXTURE_INVALID");
    expect(illegalReceipt.invocations).toBe(0);
    const wrongSuccessor = parseSemanticValidationCase({ ...negative, input: { ...(negative.input as object), afterFen: (negative.input as { readonly beforeFen: string }).beforeFen } });
    expect((await run(wrongSuccessor)).failure?.code).toBe("SEMANTIC_VALIDATION_FIXTURE_INVALID");
    // [9] a valid negative records one invocation and zero targets while unrelated events fire.
    const valid = await run(CASE_MAP.get("transition.king-steps-e2.no-castle")!);
    expect(valid).toMatchObject({ status: "passed", invocations: 1, targetCount: 0 });
    expect(valid.otherCount).toBeGreaterThan(0);
  });

  it("[16][25] resolves only an unchanged moved assertion; an edited expectation, owner ref or cited ref fails", async () => {
    const base = CASE_MAP.get("transition.short-castle.castled")!;
    expect(() => resolveSemanticValidationProposition(base)).not.toThrow();
    const weakened = parseSemanticValidationCase({ ...rawCase("local.french-exchange.blockers-lost"), expectation: { kind: "emits", minimum: 1 } });
    expect(code(() => resolveSemanticValidationProposition(weakened))).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    expect((await run(weakened)).failure?.code).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    const wrongRow = parseSemanticValidationCase({ ...rawCase("transition.short-castle.castled"), authority: { ...(rawCase("transition.short-castle.castled").authority as object), matrixRow: "NEGATIVE:rules.transition.event.castled" } });
    expect(code(() => resolveSemanticValidationProposition(wrongRow))).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    const owner = parseSemanticValidationCase({ ...rawCase("transition.short-castle.castled"), authority: { kind: "owner_authored", id: "castled-short", version: 1 } });
    expect(resolveError(owner)).toMatch(/protected owner store is absent/u);
    const cited = parseSemanticValidationCase({ ...rawCase("transition.short-castle.castled"), authority: { kind: "cited_proposition", sourceId: "fide-laws", sourceRevision: "2023", licence: "CC-BY", span: { start: 0, end: 10, textSha256: "0".repeat(64) }, propositionSha256: "1".repeat(64) } });
    expect(resolveError(cited)).toMatch(/no registered immutable source manifest/u);
  });

  it("records a stray exception as SEMANTIC_VALIDATION_EXECUTION_FAILED, never as a pass or negative", async () => {
    const receipt = await executeSemanticValidationCase(CASE_MAP.get("transition.short-castle.castled")!, { ...SEMANTIC_VALIDATION_RESOLVERS, resolveProposition: () => { throw new Error("store unreadable"); } }, CASE_MAP);
    expect(receipt).toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_EXECUTION_FAILED" } });
  });

  it("[17] maps an unavailable child to that subject's abstention — never an empty completed result", () => {
    const completed: SemanticValidationOperationResult = { kind: "completed", observations: [], abstentions: [{ projection: { id: "rules.tactic.event.loose_piece", version: 1 }, reason: "source_predicate_unavailable" }] };
    expect(subjectSemanticResult(completed, event("rules.tactic.event.loose_piece"))).toEqual({ kind: "unavailable", reason: "source_predicate_unavailable" });
    expect(subjectSemanticResult(completed, event("rules.tactic.event.check")).kind).toBe("completed");
  });

  it("[18] fails reach when the application operation filters, replaces or erases one child event", () => {
    const fen = "4k3/8/5p2/4q3/3P4/8/8/4K3 w - - 0 1";
    const edge = { kind: "edge" as const, beforeFen: fen, moveUci: "d4e5", afterFen: "4k3/8/5p2/4P3/8/8/8/4K3 b - - 0 1" };
    const child = SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.transition_edge"].invoke(edge) as SemanticValidationOperationResult;
    const parent = SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(edge) as SemanticValidationOperationResult;
    const projections = (SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.transition_edge"].reach as { readonly projections: readonly VersionedEvidenceId[] }).projections;
    expect(() => assertSemanticReachRetained(child, parent, projections, "transition")).not.toThrow();
    if (parent.kind !== "completed") throw new Error("expected completed");
    const filtered = { ...parent, observations: parent.observations.filter((observation) => observation.kind !== "event" || observation.item.projection.id !== "rules.transition.event.clock_reset") };
    expect(code(() => assertSemanticReachRetained(child, filtered, projections, "transition"))).toBe("SEMANTIC_VALIDATION_REACH_INVALID");
    expect(code(() => assertSemanticReachRetained(child, { kind: "unavailable", reason: "source_predicate_unavailable" }, projections, "transition"))).toBe("SEMANTIC_VALIDATION_REACH_INVALID");
  });

  it("[15] registers only production symbols with direct callers or multiset reach; compiler/mint targets are refused", () => {
    for (const declaration of Object.values(SEMANTIC_VALIDATION_OPERATIONS)) {
      expect(["compileSemanticEvidenceEvent", "declareEvidence"]).not.toContain(declaration.productionSymbol);
      if (declaration.reach.kind === "direct") for (const caller of declaration.reach.callers) {
        const source = readFileSync(resolve(ROOT, caller), "utf8");
        expect(source, `${caller} calls ${declaration.productionSymbol}`).toMatch(new RegExp(`\\b${declaration.productionSymbol.split(".").at(-1)}\\(`, "u"));
        expect(caller).not.toMatch(/\.test\.ts$/u);
      }
    }
    expect(SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.complete_alternatives"].reach).toMatchObject({ kind: "required", owner: "D1716" });
  });

  it("[16] digests a complete local import closure, so a new imported source cannot hide", () => {
    const closure = semanticValidationImportClosure(["packages/runtime/src/semantic-evidence.ts"]);
    expect(closure).toContain("packages/runtime/src/semantic-evidence.ts");
    expect(closure).toContain("packages/runtime/src/tactics.ts");
    expect(closure).toContain("packages/runtime/src/evidence-factories.ts");
    expect(code(() => semanticValidationImportClosure(["packages/runtime/src/not-a-file.ts"]))).toBe("SEMANTIC_VALIDATION_REACH_INVALID");
  });

  it("[20][13] changes the projected input digest when one sampled edge is omitted under the same PGN digest", () => {
    const base = { pgnSha256: "a".repeat(64), manifestSha256: "b".repeat(64), reader: 1 };
    const identities = [["s1", 8, "f1", "e2e4", "f2"], ["s1", 16, "f3", "d2d4", "f4"]] as const;
    const full = semanticPopulationProjectionDigest(base, "sampled_edges", identities);
    expect(semanticPopulationProjectionDigest(base, "sampled_edges", identities.slice(1))).not.toBe(full);
    expect(semanticPopulationProjectionDigest(base, "recorded_paths", identities)).not.toBe(full);
  });
});

function resolveError(value: SemanticValidationCase): string {
  try {
    resolveSemanticValidationProposition(value);
    return "resolved";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

describe("semantic-validation orientation", () => {
  it("[11][26] rejects zero/zero, zero/non-zero, duplicate, unmatched and ambiguous mirror populations; reordered passes", () => {
    const rules = [
      { sourcePath: ["square"], partnerPath: ["square"], value: "square" as const, collection: "scalar" as const },
      { sourcePath: ["color"], partnerPath: ["color"], value: "color" as const, collection: "scalar" as const },
    ];
    const projection = { id: "p", version: 1 };
    const a = { projection, sign: "gained", operands: { square: "e2", color: "white" } };
    const b = { projection, sign: "gained", operands: { square: "d4", color: "white" } };
    const mirrorA = { projection, sign: "gained", operands: { square: "e7", color: "black" } };
    const mirrorB = { projection, sign: "gained", operands: { square: "d5", color: "black" } };
    expect(() => compareSemanticMirror([a, b], [mirrorB, mirrorA], "color_and_vertical", rules)).not.toThrow();
    expect(code(() => compareSemanticMirror([], [], "color_and_vertical", rules))).toBe("SEMANTIC_VALIDATION_MIRROR_EMPTY");
    expect(code(() => compareSemanticMirror([a], [], "color_and_vertical", rules))).toBe("SEMANTIC_VALIDATION_MIRROR_MISMATCH");
    expect(code(() => compareSemanticMirror([a, a], [mirrorA, mirrorA], "color_and_vertical", rules))).toBe("SEMANTIC_VALIDATION_MIRROR_AMBIGUOUS");
    expect(code(() => compareSemanticMirror([a], [mirrorB], "color_and_vertical", rules))).toBe("SEMANTIC_VALIDATION_MIRROR_UNMATCHED");
    // Aggregate count preserved but one sign changed cannot pass.
    expect(code(() => compareSemanticMirror([a], [{ ...mirrorA, sign: "lost" }], "color_and_vertical", rules))).toBe("SEMANTIC_VALIDATION_MIRROR_UNMATCHED");
  });

  it("[10][19] rejects an uncovered nested scalar and an overlapping wildcard rule", () => {
    const projection = { id: "p", version: 1 };
    const source = { projection, sign: "state", operands: { squares: ["e2", "d2"], nested: { file: 1 } } };
    const partner = { projection, sign: "state", operands: { squares: ["e7", "d7"], nested: { file: 1 } } };
    const complete = [
      { sourcePath: ["squares", "*"], partnerPath: ["squares", "*"], value: "square" as const, collection: "canonical_set" as const },
      { sourcePath: ["nested", "file"], partnerPath: ["nested", "file"], value: "signed_file_delta" as const, collection: "scalar" as const },
    ];
    expect(() => compareSemanticMirror([source], [partner], "vertical", complete)).not.toThrow();
    expect(code(() => compareSemanticMirror([source], [partner], "vertical", complete.slice(0, 1)))).toBe("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA");
    expect(code(() => compareSemanticMirror([source], [partner], "vertical", [...complete, { sourcePath: ["squares", "*"], partnerPath: ["squares", "*"], value: "identity", collection: "ordered" }]))).toBe("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA");
  });

  it("[10] binds a mirror partner to the canonical transform of its source input", () => {
    expect(mirrorSemanticFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "color_and_vertical")).toBe("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1");
    expect(mirrorSemanticUci("e1h1", "color_and_vertical")).toBe("e8h8");
    expect(mirrorSemanticUci("a7a8q", "horizontal")).toBe("h7h8q");
    expect(mirrorSemanticFen("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "horizontal")).toBe("3k4/8/8/3Pp3/8/8/8/3K4 w - e6 0 1");
  });

  it("[7] fails a one-sided orientation case and a crossed partner before any comparison", async () => {
    const base = rawCase("transition.short-castle.castled");
    const oneSided = parseSemanticValidationCase({ ...base, id: "castled.one-sided", arm: "orientation", expectation: { kind: "mirrors", partnerCase: { kind: "case", id: "castled.missing-partner", version: 1, subject: base.subject, arm: "orientation" }, geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: [{ sourcePath: ["move_uci"], partnerPath: ["move_uci"], value: "identity", collection: "scalar" }] } });
    const resolvers = { ...SEMANTIC_VALIDATION_RESOLVERS, resolveProposition: (value: SemanticValidationCase) => ({ subject: value.subject, case: { id: value.id, version: 1 as const }, factConstraint: [], factConstraintSha256: semanticFactConstraintSha256([]), expectation: value.expectation }) };
    expect((await executeSemanticValidationCase(oneSided, resolvers, CASE_MAP)).failure?.code).toBe("SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE");
    // A partner that is a registered orientation case but not the transformed edge is crossed.
    const crossedPartner = parseSemanticValidationCase({ ...base, id: "castled.crossed-partner", arm: "orientation", expectation: { ...oneSided.expectation, partnerCase: { kind: "case", id: "castled.one-sided", version: 1, subject: base.subject, arm: "orientation" } } });
    const map = new Map([...CASE_MAP, [oneSided.id, oneSided], [crossedPartner.id, crossedPartner]]);
    const crossedSource = parseSemanticValidationCase({ ...base, id: "castled.crossed-source", arm: "orientation", expectation: { ...oneSided.expectation, partnerCase: { kind: "case", id: "castled.crossed-partner", version: 1, subject: base.subject, arm: "orientation" } } });
    expect((await executeSemanticValidationCase(crossedSource, resolvers, map)).failure?.code).toBe("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA");
  });
});

describe("semantic-validation rules oracles and propositions", () => {
  const witness = (request: unknown, oracle = "rules.attack_map"): SemanticValidationOracleWitness => ({ id: "w", version: 1, oracle: { id: oracle, version: 1 }, case: { id: "c", version: 1 }, subject: event("x"), request } as never);

  it("[28][31] returns a neutral fact constrained only by whole-collection equality", () => {
    const fact = executeSemanticValidationOracle(witness({ kind: "attack_map", fen: "4k3/8/8/8/8/8/8/R3K2R w - - 0 1", square: "f1", by: "white" }));
    expect(fact).toEqual({ kind: "attack_map", attacked: true, attackers: ["e1", "h1"] });
    expect(() => evaluateSemanticFactConstraints(fact, parseSemanticValidationFactConstraints([{ path: ["attackers"], comparison: "canonical_multiset", equals: ["h1", "e1"] }]))).not.toThrow();
    expect(code(() => evaluateSemanticFactConstraints(fact, parseSemanticValidationFactConstraints([{ path: ["attackers"], comparison: "ordered", equals: ["h1", "e1"] }])))).toBe("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED");
    expect(code(() => evaluateSemanticFactConstraints(fact, parseSemanticValidationFactConstraints([{ path: ["attackers"], comparison: "canonical_multiset", equals: ["e1"] }])))).toBe("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED");
    expect(code(() => evaluateSemanticFactConstraints(fact, parseSemanticValidationFactConstraints([{ path: ["attackers"], comparison: "canonical_multiset", equals: ["e1", "e1", "h1"] }])))).toBe("SEMANTIC_VALIDATION_FACT_CONSTRAINT_UNSATISFIED");
    expect(code(() => evaluateSemanticFactConstraints(fact, []))).toBe("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    expect(code(() => parseSemanticValidationFactConstraints([{ path: ["attackers", "*"], comparison: "scalar", equals: "e1" }]))).toBe("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    expect(code(() => evaluateSemanticFactConstraints({ ...fact, expectation: { kind: "emits" } }, parseSemanticValidationFactConstraints([{ path: ["attacked"], comparison: "scalar", equals: true }])))).toBe("SEMANTIC_VALIDATION_FACT_CONSTRAINT_INVALID");
    expect(executeSemanticValidationOracle(witness({ kind: "line_occupancy", fen: "4k3/8/8/8/8/8/8/R3K2R w - - 0 1", from: "a1", to: "h1" }, "rules.line_occupancy"))).toEqual({ kind: "line_occupancy", aligned: true, blockers: ["e1"] });
  });

  it("[29] keeps the oracle import closure free of every semantic predicate, case and constructor", () => {
    const closure = semanticValidationImportClosure(["packages/runtime/src/semantic-validation-oracles.ts"]);
    for (const forbidden of ["semantic-evidence.ts", "semantic-validation-cases.json", "evidence-factories.ts", "semantic-validation-operations.ts", "tactics.ts", "semantic-validation-runner.ts"]) {
      expect(closure.some((file) => file.endsWith(forbidden)), forbidden).toBe(false);
    }
  });

  it("[29] resolves no unsealed witness", () => {
    const base = rawCase("transition.short-castle.castled");
    const rules = parseSemanticValidationCase({ ...base, authority: { kind: "rules_and_proposition", oracle: { id: "rules.legal_successor", version: 1 }, witness: { id: "missing", version: 1, oracle: { id: "rules.legal_successor", version: 1 }, case: { id: base.id, version: 1 }, subject: base.subject }, proposition: base.authority, factConstraint: [{ path: ["legal"], comparison: "scalar", equals: true }] } });
    expect(code(() => SEMANTIC_VALIDATION_RESOLVERS.resolveWitness(rules))).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    // A witness naming another case or oracle grain fails at the parser.
    expect(code(() => parseSemanticValidationCase({ ...base, authority: { ...(rules.authority as object), witness: { id: "w", version: 1, oracle: { id: "rules.attack_map", version: 1 }, case: { id: base.id, version: 1 }, subject: base.subject } } }))).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    // An existing-assertion proposition carries no constraint, so a rules case built on it cannot resolve.
    expect(code(() => resolveSemanticValidationProposition(rules))).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
  });
});

describe("semantic-validation owner authority store", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({ id: "castled-short", version: 1, subject: event("rules.transition.event.castled"), case: { id: "transition.short-castle.castled", version: 1 }, expectation: { kind: "emits", minimum: 1 }, factConstraint: [], ruling: "ledger:D9001", authoredBy: "OWNER", authoredAt: "2026-09-24", ...overrides });

  it("[29][34] parses only exact, sorted, unique, owner-authored, ruling-cited rows", () => {
    expect(parseSemanticValidationOwnerAuthorityStore({ schemaVersion: 1, authorities: [] }).authorities).toEqual([]);
    expect(() => parseSemanticValidationOwnerAuthorityStore({ schemaVersion: 1, authorities: [row()] })).not.toThrow();
    for (const bad of [row({ authoredBy: "CODEX" }), row({ ruling: "D9001" }), row({ id: "castled-short@1" }), row({ version: 2 }), row({ extra: true })]) {
      expect(code(() => parseSemanticValidationOwnerAuthorityStore({ schemaVersion: 1, authorities: [bad] }))).toMatch(/SEMANTIC_VALIDATION_(OWNER_STORE_INVALID|CASE_REF_STALE)/u);
    }
    expect(code(() => parseSemanticValidationOwnerAuthorityStore({ schemaVersion: 1, authorities: [row({ id: "b" }), row({ id: "a" })] }))).toBe("SEMANTIC_VALIDATION_OWNER_STORE_INVALID");
    expect(code(() => parseSemanticValidationOwnerAuthorityStore({ schemaVersion: 1, authorities: [row(), row()] }))).toBe("SEMANTIC_VALIDATION_OWNER_STORE_INVALID");
  });

  it("[32] derives owner admissions from base/candidate trees and rejects mutation, removal and same-change admission", () => {
    const store = (rows: readonly unknown[]) => JSON.stringify({ schemaVersion: 1, authorities: rows });
    const profiles = readFileSync(resolve(ROOT, "packages/runtime/src/semantic-validation-profiles.json"), "utf8");
    const cases = readFileSync(resolve(ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8");
    const ownerCases = JSON.parse(cases) as { cases: Record<string, unknown>[] };
    const castled = ownerCases.cases.find((value) => value.id === "transition.short-castle.castled")!;
    castled.authority = { kind: "owner_authored", id: "castled-short", version: 1 };
    const tree = (files: Readonly<Record<string, string>>) => (path: string) => files[path];
    const rulings = () => new Set(["D9001"]);
    const base = tree({ "packages/runtime/src/semantic-validation-profiles.json": profiles, "packages/runtime/src/semantic-validation-cases.json": cases });
    // Same-change owner row plus present case admission fails.
    const sameChange = tree({ "design/research/semantic-validation-owner-authorities.json": store([row()]), "packages/runtime/src/semantic-validation-profiles.json": profiles, "packages/runtime/src/semantic-validation-cases.json": JSON.stringify(ownerCases) });
    expect(code(() => assertSemanticValidationOwnerTransition(base, sameChange, rulings))).toBe("SEMANTIC_VALIDATION_OWNER_TRANSITION");
    // Appending only the row (no admission) passes; admitting in the next change passes.
    const rowOnly = tree({ "design/research/semantic-validation-owner-authorities.json": store([row()]), "packages/runtime/src/semantic-validation-profiles.json": profiles, "packages/runtime/src/semantic-validation-cases.json": cases });
    expect(() => assertSemanticValidationOwnerTransition(base, rowOnly, rulings)).not.toThrow();
    expect(() => assertSemanticValidationOwnerTransition(rowOnly, sameChange, rulings)).not.toThrow();
    // Mutation, removal and an uncited ruling fail.
    expect(code(() => assertSemanticValidationOwnerTransition(rowOnly, tree({ "design/research/semantic-validation-owner-authorities.json": store([row({ authoredAt: "2026-09-25" })]) }), rulings))).toBe("SEMANTIC_VALIDATION_OWNER_TRANSITION");
    expect(code(() => assertSemanticValidationOwnerTransition(rowOnly, tree({ "design/research/semantic-validation-owner-authorities.json": store([]) }), rulings))).toBe("SEMANTIC_VALIDATION_OWNER_TRANSITION");
    expect(code(() => assertSemanticValidationOwnerTransition(base, rowOnly, () => new Set()))).toBe("SEMANTIC_VALIDATION_OWNER_TRANSITION");
  });

  it("[34] the protected store is absent: the D0 bootstrap is an owner discharge, never created here", () => {
    expect(resolveError(parseSemanticValidationCase({ ...rawCase("transition.short-castle.castled"), authority: { kind: "owner_authored", id: "any", version: 1 } }))).toMatch(/D0/u);
  });
});

describe("semantic-validation bounded-target roots (R1, criterion 26)", () => {
  it("[26] admits both readings and the inspector-only immediate event through one batch operation", async () => {
    const keys = SEMANTIC_VALIDATION_ROOTS.map(semanticValidationSubjectKey);
    expect(keys).toEqual(expect.arrayContaining(["reading:derived.bounded_target.named_material_target@1", "reading:derived.bounded_target.bounded_return@1", "event:derived.bounded_target.immediate@1"]));
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.bounded_target_batch"].invoke({ kind: "bounded_target_source", sourceFen: "8/8/8/7k/n7/8/2B5/4K3 b - - 0 1" });
    if (result.kind !== "completed") throw new Error("expected completed");
    const kinds = new Set(result.observations.map((observation) => `${observation.kind}:${observation.item.projection.id}`));
    expect([...kinds].sort()).toEqual(["declared_event:derived.bounded_target.immediate", "reading:derived.bounded_target.bounded_return", "reading:derived.bounded_target.named_material_target"]);
    // An event subject cannot be answered by a reading observation, nor a reading by an event.
    const asReading = { kind: "reading" as const, projection: { id: "derived.bounded_target.immediate", version: 1 } };
    expect(result.observations.filter((observation) => observation.kind === "reading" && observation.item.projection.id === asReading.projection.id)).toHaveLength(0);
    for (const subject of SEMANTIC_VALIDATION_ROOTS.filter((root) => root.projection.id.startsWith("derived.bounded_target."))) {
      const verdict = semanticValidationVerdict(subject)!;
      expect(verdict.verdict).toBe("unvalidated");
      expect(verdict.open).toEqual(expect.arrayContaining(["positive", "semantic_negative", "orientation", "imported_population"]));
    }
    expect(SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.bounded_target_batch"].reach.kind).toBe("required");
  });
});

describe("semantic-validation consumer eligibility", () => {
  it("[14][19] compiles research_only only for an operator analysis consumer; a learner role fails", () => {
    expect(PRIMARY_EVIDENCE_MANIFEST.eligibility.every((row) => row.semanticValidation === "research_only")).toBe(true);
    const learnerConsumers = EVIDENCE_CONTRACT_DECLARATIONS.consumers.map((consumer) => consumer.id === "research.semantic_selection" ? { ...consumer, roles: ["learner" as const] } : consumer);
    expect(() => compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, consumers: learnerConsumers })).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_EVENT_UNVALIDATED" }));
    // [15] The same incomplete event, declared `required`, refuses at compile time.
    const required = EVIDENCE_CONTRACT_DECLARATIONS.eligibility!.map((row) => ({ ...row, semanticValidation: "required" as const }));
    expect(() => compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, eligibility: required })).toThrowError(/event_unvalidated/u);
  });

  it("[18][24] admits an instance only with a passed verdict and the sole-factory value receipt", () => {
    const edge = CASE_MAP.get("transition.queen-g7.checkmate")!.input as { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string };
    const mate = localSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen).find((value) => value.projection.id === "rules.transition.event.checkmate")!;
    const unvalidated = admitValidatedSemanticInstance("event", mate.evidence);
    expect(unvalidated).toMatchObject({ kind: "refused", reason: "event_unvalidated" });
    const passedTable: SemanticValidationVerdictTable = { schemaVersion: 1, receiptSha256: "0", verdicts: [{ subject: event("rules.transition.event.checkmate"), verdict: "passed", open: [] }] };
    expect(admitValidatedSemanticInstance("event", mate.evidence, passedTable)).toMatchObject({ kind: "admitted" });
    const missing = identitySealedEvidenceWithoutValueReceipt(mate.evidence.producer, mate.evidence.projection, mate.evidence.payload);
    expect(admitValidatedSemanticInstance("event", missing, passedTable)).toMatchObject({ kind: "refused", reason: "event_value_unverified" });
    const alternate = declareEvidence(mate.evidence.producer, mate.evidence.projection, mate.evidence.payload, { factory: "test:alternate-route", inputDigest: "0".repeat(64), sourceDigests: [] });
    expect(admitValidatedSemanticInstance("event", alternate, passedTable)).toMatchObject({ kind: "refused", reason: "event_value_unverified" });
    // [20] a new event version starts without a verdict.
    expect(admitValidatedSemanticInstance("event", { ...mate.evidence, projection: { id: "rules.transition.event.checkmate", version: 2 } } as never, passedTable)).toMatchObject({ kind: "refused", reason: "event_unvalidated" });
  });

  it("[23] keeps fixture registries, runner, operations, oracles and authority stores out of the production import graph", () => {
    const closure = semanticValidationImportClosure(["packages/runtime/src/index.ts"]);
    for (const forbidden of ["semantic-validation-cases.json", "semantic-validation-runner.ts", "semantic-validation-operations.ts", "semantic-validation-oracles.ts", "semantic-validation-authorities.ts", "semantic-validation-cited-sources.ts", "semantic-validation-receipt.generated.json", "semantic-validation-external.json"]) {
      expect(closure.some((file) => file.endsWith(forbidden)), forbidden).toBe(false);
    }
    expect(closure).toContain("packages/runtime/src/semantic-validation-registry.ts");
  });

  it("[20] validates derived events on their own profile only", () => {
    const captureClass = semanticValidationVerdict(event("derived.exchange.capture_class"));
    const capture = semanticValidationVerdict(event("rules.transition.event.capture"));
    expect(captureClass?.open).toContain("semantic_negative");
    expect(capture?.open).not.toContain("positive");
    expect(semanticValidationVerdict(event("derived.exchange.capture_class", 2))).toBeUndefined();
  });

  void SemanticValidationError;
});
