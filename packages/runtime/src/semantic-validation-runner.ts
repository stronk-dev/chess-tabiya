/**
 * The semantic-validation runner (rfc/semantic-validation-authority.md §§4.1–4.4, R1–R3).
 *
 * It validates a case's fixture bytes, resolves its independent authority through an injected
 * package-owned resolver, invokes the registered production operation exactly once, selects the
 * exact target observations, requires the sole-factory value receipt on every target, and applies
 * the closed expectation. It never accepts a callback, prebuilt evidence or result digest from a
 * case. Not exported from the runtime barrel.
 */
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { evidenceValueRouteRegistry } from "./internal/evidence-value-routes.js";
import { exactLegalMoves } from "./legal-moves.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import {
  SEMANTIC_VALIDATION_OPERATIONS,
  canonicalSemanticEdge,
  observationEvidence,
  observationSubjectKind,
  type SemanticValidationObservation,
  type SemanticValidationOperationResult,
} from "./semantic-validation-operations.js";
import {
  SemanticValidationError,
  compareSemanticMirror,
  evaluateSemanticFactConstraints,
  mirrorSemanticFen,
  mirrorSemanticUci,
  semanticFactConstraintSha256,
  semanticValidationSubjectKey,
  type SemanticEdgeInput,
  type SemanticValidationCase,
  type SemanticValidationErrorCode,
  type SemanticValidationOperationId,
  type SemanticValidationPropositionRecord,
  type SemanticValidationSubject,
} from "./semantic-validation.js";
import { executeSemanticValidationOracle, type SemanticValidationOracleWitness } from "./semantic-validation-oracles.js";

const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

// ---------------------------------------------------------------------------------------------
// Authority resolution seam: the build tool supplies fixed package-owned resolvers
// ---------------------------------------------------------------------------------------------

export interface SemanticValidationAuthorityResolvers {
  /** Resolves a case's proposition authority to the one closed proposition record, or throws. */
  readonly resolveProposition: (value: SemanticValidationCase) => SemanticValidationPropositionRecord;
  /** Resolves the sealed oracle witness row named by a rules-backed case, or throws. */
  readonly resolveWitness: (value: SemanticValidationCase) => SemanticValidationOracleWitness;
}

// ---------------------------------------------------------------------------------------------
// Execution receipts
// ---------------------------------------------------------------------------------------------

export interface SemanticTargetObservationReceipt {
  readonly projection: string;
  readonly operandDigest: string;
  readonly factory: string;
  readonly inputDigest: string;
  readonly payloadDigest: string;
  readonly sourceDigests: readonly string[];
}

export interface SemanticCaseExecutionReceipt {
  readonly case: string;
  readonly subject: string;
  readonly arm: string;
  readonly operation: SemanticValidationOperationId;
  readonly inputDigest: string;
  readonly invocations: number;
  readonly resultKind: "completed" | "unavailable" | "not_run";
  readonly unavailableReason: string | null;
  readonly targetCount: number;
  readonly otherCount: number;
  readonly targets: readonly SemanticTargetObservationReceipt[];
  readonly reach: "direct" | "multiset_retained" | "required" | "failed";
  readonly authority: { readonly kind: string; readonly propositionSha256: string | null; readonly witnessSha256: string | null; readonly resultSha256: string | null };
  readonly status: "passed" | "failed";
  readonly failure: { readonly code: SemanticValidationErrorCode | "SEMANTIC_VALIDATION_EXECUTION_FAILED"; readonly message: string } | null;
}

// ---------------------------------------------------------------------------------------------
// Fixture validity (§4.1): malformed input is an invalid fixture, never a semantic negative
// ---------------------------------------------------------------------------------------------

function assertCanonicalEdge(edge: SemanticEdgeInput, label: string): void {
  let canonical: SemanticEdgeInput;
  try {
    canonical = canonicalSemanticEdge(edge);
  } catch (error) {
    throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (canonical.beforeFen !== edge.beforeFen) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${label} before FEN is not canonical (${canonical.beforeFen})`);
  if (canonical.moveUci !== edge.moveUci) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${label} move ${edge.moveUci} is not the canonical UCI ${canonical.moveUci}`);
  if (canonical.afterFen !== edge.afterFen) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${label} after FEN is not the exact successor of ${edge.moveUci}`);
}

export function assertSemanticValidationFixture(value: SemanticValidationCase): void {
  const input = value.input;
  switch (input.kind) {
    case "edge": assertCanonicalEdge(input, value.id); return;
    case "recorded_path":
    case "recorded_sequence": {
      const path = input.kind === "recorded_path" ? input : input.path;
      path.edges.forEach((edge, index) => {
        assertCanonicalEdge(edge, `${value.id} edge ${index}`);
        if (index > 0 && path.edges[index - 1]!.afterFen !== edge.beforeFen) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${value.id} edge ${index} does not continue the recorded path`);
      });
      return;
    }
    case "bounded_target_source":
      if (canonicalFen(positionFromFen(input.sourceFen)) !== input.sourceFen) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${value.id} source FEN is not canonical`);
      return;
    case "complete_alternatives": {
      const rootFen = canonicalFen(positionFromFen(input.rootFen));
      if (rootFen !== input.rootFen) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${value.id} root FEN is not canonical`);
      const legal = exactLegalMoves(rootFen).map((move) => move.uci).sort();
      const supplied = input.alternatives.map((edge) => edge.moveUci).sort();
      if (legal.join("|") !== supplied.join("|")) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${value.id} alternative set is not the exact legal set (${supplied.length}/${legal.length})`);
      for (const edge of [input.played, ...input.alternatives]) {
        if (edge.beforeFen !== rootFen) throw new SemanticValidationError("SEMANTIC_VALIDATION_FIXTURE_INVALID", `${value.id} alternative leaves another root`);
        assertCanonicalEdge(edge, `${value.id} ${edge.moveUci}`);
      }
      return;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Target selection and value authority (§4.2, R1)
// ---------------------------------------------------------------------------------------------

let soleFactories: ReadonlyMap<string, string> | undefined;

/** The one registered factory symbol for an exact projection ref, from the central route registry. */
export function semanticValidationSoleFactory(projection: VersionedEvidenceId): string | undefined {
  soleFactories ??= new Map(evidenceValueRouteRegistry().map((meta) => [meta.route, meta.symbol]));
  return soleFactories.get(refKey(projection));
}

function observationProjection(observation: SemanticValidationObservation): VersionedEvidenceId {
  return observationEvidence(observation).projection;
}

export function selectSemanticTargets(result: SemanticValidationOperationResult, subject: SemanticValidationSubject): readonly SemanticValidationObservation[] {
  if (result.kind !== "completed") return [];
  return result.observations.filter((observation) => observationSubjectKind(observation) === subject.kind && refKey(observationProjection(observation)) === refKey(subject.projection));
}

/** The value-authority conjunct: sole factory, exact projection and reproduced payload digest. */
export function assertSemanticTargetValueAuthority(observation: SemanticValidationObservation): SemanticTargetObservationReceipt {
  const evidence = observationEvidence(observation);
  try {
    assertDeclaredEvidence(evidence);
  } catch (error) {
    throw new SemanticValidationError("SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING", `target has no value receipt: ${error instanceof Error ? error.message : String(error)}`);
  }
  const receipt = evidenceValueReceipt(evidence);
  const projection = observationProjection(observation);
  const factory = semanticValidationSoleFactory(projection);
  if (refKey(receipt.projection) !== refKey(projection)) throw new SemanticValidationError("SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING", "value receipt names another projection");
  if (factory === undefined || receipt.factory !== factory) throw new SemanticValidationError("SEMANTIC_VALIDATION_VALUE_AUTHORITY_MISSING", `target was minted by ${receipt.factory}, not the sole factory ${factory ?? "(none)"}`);
  return Object.freeze({
    projection: refKey(projection),
    operandDigest: evidenceDigest(evidence.payload),
    factory: receipt.factory,
    inputDigest: receipt.inputDigest,
    payloadDigest: receipt.payloadDigest,
    sourceDigests: Object.freeze([...receipt.sourceDigests]),
  });
}

function canonicalEventMultiset(result: SemanticValidationOperationResult, projections: readonly VersionedEvidenceId[]): readonly string[] {
  if (result.kind !== "completed") return [`unavailable:${result.reason}`];
  const keys = new Set(projections.map(refKey));
  return [
    ...result.observations
      .filter((observation) => keys.has(refKey(observationProjection(observation))))
      .map((observation) => observation.kind === "event" ? `${observation.item.id}` : evidenceValueReceipt(observation.item).payloadDigest),
    ...result.abstentions.filter((abstention) => keys.has(refKey(abstention.projection))).map((abstention) => `abstained:${refKey(abstention.projection)}:${abstention.reason}`),
  ].sort();
}

/**
 * §4.3 reach: a narrower child operation passes only when its declared projections survive
 * byte-for-byte (canonical event ids and typed abstentions) inside the application operation.
 * Replacing, filtering or erasing one child event fails.
 */
export function assertSemanticReachRetained(child: SemanticValidationOperationResult, parent: SemanticValidationOperationResult, projections: readonly VersionedEvidenceId[], label: string): void {
  const left = canonicalEventMultiset(child, projections);
  const right = canonicalEventMultiset(parent, projections);
  if (left.join("|") !== right.join("|")) throw new SemanticValidationError("SEMANTIC_VALIDATION_REACH_INVALID", `${label}: the child projections are not retained byte-for-byte by the application operation`);
}

/** The result as seen by one subject: its own typed abstention is that subject's unavailable arm. */
export function subjectSemanticResult(result: SemanticValidationOperationResult, subject: SemanticValidationSubject): SemanticValidationOperationResult {
  if (result.kind !== "completed") return result;
  const abstention = result.abstentions.find((value) => refKey(value.projection) === refKey(subject.projection));
  return abstention === undefined ? result : Object.freeze({ kind: "unavailable" as const, reason: abstention.reason });
}

/** Deep partial operand match: every expected key resolves to canonically equal bytes. */
export function semanticOperandsMatch(actual: unknown, expected: unknown): boolean {
  if (expected === null || typeof expected !== "object") return evidenceDigest({ value: actual }) === evidenceDigest({ value: expected });
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((entry, index) => semanticOperandsMatch(actual[index], entry));
  if (actual === null || typeof actual !== "object" || Array.isArray(actual)) return false;
  return Object.entries(expected).every(([key, entry]) => key in actual && semanticOperandsMatch((actual as Record<string, unknown>)[key], entry));
}

// ---------------------------------------------------------------------------------------------
// Case execution
// ---------------------------------------------------------------------------------------------

async function invoke(value: SemanticValidationCase): Promise<SemanticValidationOperationResult> {
  const declaration = SEMANTIC_VALIDATION_OPERATIONS[value.operation.id] as { readonly invoke: (input: unknown) => SemanticValidationOperationResult | Promise<SemanticValidationOperationResult> };
  return await declaration.invoke(value.input);
}

function failure(error: unknown): SemanticCaseExecutionReceipt["failure"] {
  if (error instanceof SemanticValidationError) return Object.freeze({ code: error.code, message: error.message });
  return Object.freeze({ code: "SEMANTIC_VALIDATION_EXECUTION_FAILED" as const, message: error instanceof Error ? error.message : String(error) });
}

/** The mirror partner's input must be the canonical transform of the source input (§4.1). */
export function assertSemanticMirrorPartnerInput(source: SemanticValidationCase, partner: SemanticValidationCase, geometry: "vertical" | "horizontal" | "color_and_vertical"): void {
  if (source.input.kind !== "edge" || partner.input.kind !== "edge") throw new SemanticValidationError("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", "mirror cases are one-edge inputs in v1");
  const expected = { beforeFen: mirrorSemanticFen(source.input.beforeFen, geometry), moveUci: mirrorSemanticUci(source.input.moveUci, geometry), afterFen: mirrorSemanticFen(source.input.afterFen, geometry) };
  let canonical: SemanticEdgeInput;
  try {
    canonical = canonicalSemanticEdge({ kind: "edge", ...expected });
  } catch (error) {
    throw new SemanticValidationError("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `the transformed partner edge is illegal: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (canonical.beforeFen !== partner.input.beforeFen || canonical.moveUci !== partner.input.moveUci || canonical.afterFen !== partner.input.afterFen) {
    throw new SemanticValidationError("SEMANTIC_VALIDATION_ORIENTATION_SCHEMA", `partner ${partner.id} is not the ${geometry} transform of ${source.id}`);
  }
}

/**
 * Executes one registered case. Every failure — invalid fixture, unresolved authority, missing
 * value receipt, empty positive, emitted negative, mirror mismatch, stray exception — is a failed
 * receipt with its closed code; nothing is interpreted as an empty or negative result.
 */
export async function executeSemanticValidationCase(value: SemanticValidationCase, resolvers: SemanticValidationAuthorityResolvers, cases: ReadonlyMap<string, SemanticValidationCase>): Promise<SemanticCaseExecutionReceipt> {
  const declaration = SEMANTIC_VALIDATION_OPERATIONS[value.operation.id];
  const base = {
    case: value.id,
    subject: semanticValidationSubjectKey(value.subject),
    arm: value.arm,
    operation: value.operation.id,
    inputDigest: evidenceDigest(value.input),
  };
  let invocations = 0;
  let result: SemanticValidationOperationResult | undefined;
  let targets: readonly SemanticTargetObservationReceipt[] = [];
  let targetCount = 0;
  let otherCount = 0;
  let reach: SemanticCaseExecutionReceipt["reach"] = declaration.reach.kind === "required" ? "required" : declaration.reach.kind === "direct" ? "direct" : "multiset_retained";
  const authority: { kind: string; propositionSha256: string | null; witnessSha256: string | null; resultSha256: string | null } = { kind: value.authority.kind, propositionSha256: null, witnessSha256: null, resultSha256: null };
  const finish = (status: "passed" | "failed", error?: unknown): SemanticCaseExecutionReceipt => Object.freeze({
    ...base,
    invocations,
    resultKind: result === undefined ? "not_run" as const : result.kind,
    unavailableReason: result?.kind === "unavailable" ? result.reason : null,
    targetCount,
    otherCount,
    targets: Object.freeze(targets),
    reach,
    authority: Object.freeze(authority),
    status,
    failure: status === "passed" ? null : failure(error),
  });
  try {
    assertSemanticValidationFixture(value);
    const mirrorPartner = value.expectation.kind === "mirrors" ? cases.get(value.expectation.partnerCase.id) : undefined;
    if (value.expectation.kind === "mirrors") {
      if (mirrorPartner === undefined || mirrorPartner.arm !== "orientation" || semanticValidationSubjectKey(mirrorPartner.subject) !== base.subject) throw new SemanticValidationError("SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE", `mirror partner ${value.expectation.partnerCase.id} is not a registered same-subject orientation case`);
      assertSemanticMirrorPartnerInput(value, mirrorPartner, value.expectation.geometry);
    }
    // Authority: proposition first (the one closed record), then the neutral oracle when rules-backed.
    const proposition = resolvers.resolveProposition(value);
    if (semanticValidationSubjectKey(proposition.subject) !== semanticValidationSubjectKey(value.subject) || proposition.case.id !== value.id || proposition.case.version !== value.version || evidenceDigest(proposition.expectation) !== evidenceDigest(value.expectation)) {
      throw new SemanticValidationError("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "the resolved proposition binds another subject, case or expectation");
    }
    if (proposition.factConstraintSha256 !== semanticFactConstraintSha256(proposition.factConstraint)) throw new SemanticValidationError("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "the proposition constraint digest is not its own constraint bytes");
    authority.propositionSha256 = evidenceDigest(proposition);
    if (value.authority.kind === "rules_and_proposition") {
      if (semanticFactConstraintSha256(value.authority.factConstraint) !== proposition.factConstraintSha256) throw new SemanticValidationError("SEMANTIC_VALIDATION_AUTHORITY_INVALID", "the case constraint differs from its proposition's constraint");
      const witness = resolvers.resolveWitness(value);
      const fact = executeSemanticValidationOracle(witness);
      authority.witnessSha256 = evidenceDigest(witness);
      authority.resultSha256 = evidenceDigest(fact);
      evaluateSemanticFactConstraints(fact, value.authority.factConstraint);
    }
    invocations += 1;
    const raw = await invoke(value);
    result = subjectSemanticResult(raw, value.subject);
    const selected = selectSemanticTargets(result, value.subject);
    targetCount = selected.length;
    otherCount = result.kind === "completed" ? result.observations.length - selected.length : 0;
    targets = selected.map(assertSemanticTargetValueAuthority);
    if (declaration.reach.kind === "exact_projection_multiset") {
      const through = SEMANTIC_VALIDATION_OPERATIONS[declaration.reach.through.id] as { readonly invoke: (input: unknown) => SemanticValidationOperationResult | Promise<SemanticValidationOperationResult> };
      const parent = await through.invoke(value.input);
      try {
        assertSemanticReachRetained(raw, parent, declaration.reach.projections, `${value.operation.id} → ${declaration.reach.through.id}`);
      } catch (error) {
        reach = "failed";
        throw error;
      }
    }
    const expectation = value.expectation;
    switch (expectation.kind) {
      case "emits":
        if (result.kind !== "completed") throw new SemanticValidationError("SEMANTIC_VALIDATION_EXPECTATION_UNMET", `positive abstained (${result.reason})`);
        if (targetCount < 1) throw new SemanticValidationError("SEMANTIC_VALIDATION_POSITIVE_EMPTY", `${value.id} reached ${value.operation.id} and emitted no ${base.subject}`);
        if (!selected.some((observation) => (expectation.sign === undefined || (observation.kind === "event" ? observation.item.sign : "state") === expectation.sign) && (expectation.operandMatch === undefined || semanticOperandsMatch(observationEvidence(observation).payload, expectation.operandMatch)))) {
          throw new SemanticValidationError("SEMANTIC_VALIDATION_POSITIVE_EMPTY", `${value.id} emitted ${targetCount} ${base.subject} but none with the moved sign/operands`);
        }
        break;
      case "omits":
        if (result.kind !== "completed") throw new SemanticValidationError("SEMANTIC_VALIDATION_EXPECTATION_UNMET", `negative abstained (${result.reason}); abstention is not omission`);
        if (targetCount > 0) throw new SemanticValidationError("SEMANTIC_VALIDATION_NEGATIVE_EMITTED", `${value.id} emitted ${targetCount} ${base.subject}`);
        break;
      case "abstains":
        if (result.kind !== "unavailable" || result.reason !== expectation.reason) throw new SemanticValidationError("SEMANTIC_VALIDATION_EXPECTATION_UNMET", `expected abstention ${expectation.reason}`);
        break;
      case "mirrors": {
        // The preflight above rejects a missing/crossed partner before either collector runs.
        if (mirrorPartner === undefined) throw new SemanticValidationError("SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE", "mirror partner preflight did not resolve a case");
        const partnerResult = subjectSemanticResult(await invoke(mirrorPartner), value.subject);
        invocations += 1;
        const partnerTargets = selectSemanticTargets(partnerResult, value.subject);
        partnerTargets.forEach(assertSemanticTargetValueAuthority);
        const shape = (observation: SemanticValidationObservation) => ({ projection: observationProjection(observation), sign: observation.kind === "event" ? observation.item.sign : "state", operands: observationEvidence(observation).payload });
        compareSemanticMirror(selected.map(shape), partnerTargets.map(shape), expectation.geometry, expectation.operandRules);
        break;
      }
    }
    return finish("passed");
  } catch (error) {
    return finish("failed", error);
  }
}
