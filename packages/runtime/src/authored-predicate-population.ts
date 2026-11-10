// One source-owned AST walk. No caller-supplied boolean, leaves, trace or evaluator callback.
import type { FileName, SquareName } from "chessops/types";
import { parseSquare } from "chessops/util";
import { assertStructuralConventionSelection } from "@chess-tabiya/schema/drill-pack";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "./evidence-execution-v2.js";
import { AUTHORED_PREDICATE_REDUCTION_CONTRACT } from "./evidence-reduction-contract.js";
import type { ExactLegalMoveMap } from "./legal-moves.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { mirrorExpression, STRUCTURE_PREDICATES, type StructuralExpression, type StructuralFeature } from "./structure.js";
import { readAuthoredStructuralConditionSource, type AuthoredStructuralConditionSource, type AuthoredStructuralSourceImage } from "./internal/authored-structural-source.js";
import { invokeEvidenceValueRoute, inspectAuthoredPredicateFactoryBindings, readAuthoredStructuralInput, readLocalReadingInvocation, readStructuralPredicateInvocation } from "./internal/evidence-value-routes.js";

export type AuthoredPredicatePolicy = "predicate" | "witness";
export interface AuthoredPredicateTrace {
  readonly path: string; readonly expression: StructuralExpression; readonly matched: boolean;
  readonly leaf?: DeclaredEvidence<{ readonly fen: string; readonly feature: StructuralFeature; readonly matched: boolean }>;
}
export interface AuthoredPredicateObservation {
  readonly fen: string; readonly source: AuthoredStructuralSourceImage;
  readonly policy: AuthoredPredicatePolicy; readonly matched: boolean; readonly squares: readonly SquareName[];
  readonly trace: readonly AuthoredPredicateTrace[];
}
declare const brand: unique symbol;
export interface AuthoredPredicatePopulation { readonly [brand]: true }
interface PopulationData {
  readonly condition: DeclaredEvidence<AuthoredStructuralSourceImage>;
  readonly position: DeclaredEvidence<ExactLegalMoveMap>;
  readonly observation: AuthoredPredicateObservation;
  readonly leaves: readonly Readonly<{ path: string; value: NonNullable<AuthoredPredicateTrace["leaf"]> }>[];
}
const POPULATIONS = new WeakMap<object, PopulationData>();
class UnavailableSource extends Error {}
function available<T>(result: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T {
  if (result.kind !== "available") throw new UnavailableSource(result.reason);
  return result.value;
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
/** Explicit refs select only the three exact successors; absence alone selects a historical leaf. */
function leaf(position: DeclaredEvidence<ExactLegalMoveMap>, feature: StructuralFeature): NonNullable<AuthoredPredicateTrace["leaf"]> {
  assertStructuralConventionSelection(feature as unknown as Readonly<Record<string, unknown>>);
  const fen = position.payload.fen;
  if (!Object.hasOwn(feature, "conventionRef")) return invokeEvidenceValueRoute(`rules.structural.predicate.${feature.kind}@1`, { fen, feature });
  if (feature.kind === "king_opposition") {
    const source = available(invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position }));
    return invokeEvidenceValueRoute("rules.structural.predicate.king_opposition@2", { source, feature: feature as never });
  }
  if (feature.kind === "backward_pawn") {
    const source = available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position }));
    return invokeEvidenceValueRoute("rules.structural.predicate.backward_pawn@2", { source, feature: feature as never });
  }
  if (feature.kind === "outpost") {
    const future = available(invokeEvidenceValueRoute("derived.square.reading.future_file_challenge@1", { position }));
    const control = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen });
    const source = available(invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", { control, future }));
    return invokeEvidenceValueRoute("rules.structural.predicate.outpost@2", { source, feature: feature as never });
  }
  throw new TypeError("Unsupported explicit structural convention");
}

declare const shapePreflightBrand: unique symbol;
export interface RegisteredShapePredicatePreflight { readonly [shapePreflightBrand]: true }
const SHAPE_PREFLIGHTS = new WeakMap<object, Readonly<{
  bindings: ReturnType<typeof inspectAuthoredPredicateFactoryBindings>;
  plans: readonly ReturnType<typeof compileProjectionExecutionV2>[];
}>>();
export function prepareRegisteredShapePredicatePreflight(): RegisteredShapePredicatePreflight {
  const expected = AUTHORED_PREDICATE_REDUCTION_CONTRACT.elements;
  const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "theory.shapes.firing" && row.version === 3);
  const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
  const declared = projection?.dependsOn?.map(key).sort();
  if (expected.length !== 23 || new Set(expected.map(key)).size !== 23
    || JSON.stringify(declared) !== JSON.stringify(expected.map(key).sort())) throw new TypeError("Current shape firing lost its exact23 dependencies");
  const plans = expected.map(ref => {
    const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, ref);
    if (plan.kind !== "fixed" || plan.execution.own.providerOperation !== null
      || plan.execution.paths.length !== 1 || plan.execution.paths[0]!.derivationChoices.length !== 0
      || plan.execution.own.availability !== (ref.id === "authored.structural_condition.input" ? "recorded" : "local")) throw new TypeError("Current shape predicate dependency lost its fixed source binding");
    return plan;
  });
  const bindings = inspectAuthoredPredicateFactoryBindings();
  if (bindings.length !== expected.length || bindings.some((binding, index) => binding.route !== key(expected[index]!))) throw new TypeError("Shape preflight lost an eligible callable");
  const token = Object.freeze({}) as RegisteredShapePredicatePreflight;
  SHAPE_PREFLIGHTS.set(token, Object.freeze({ bindings, plans: Object.freeze(plans) }));
  assertRegisteredShapePredicatePreflight(token); return token;
}
export function assertRegisteredShapePredicatePreflight(token: RegisteredShapePredicatePreflight): void {
  const data = token !== null && typeof token === "object" ? SHAPE_PREFLIGHTS.get(token) : undefined;
  if (data === undefined) throw new TypeError("Current shape scan lacks original dependency preflight");
  const now = inspectAuthoredPredicateFactoryBindings();
  if (now.length !== data.bindings.length || now.some((value, index) => value.route !== data.bindings[index]!.route
    || value.callable !== data.bindings[index]!.callable)) throw new TypeError("Current shape predicate callable changed");
  for (const plan of data.plans) executionPlanDigest(plan);
}
export function captureAuthoredPredicatePopulation(source: AuthoredStructuralConditionSource, position: DeclaredEvidence<ExactLegalMoveMap>, policy: AuthoredPredicatePolicy = "predicate") {
  // Aggregate2 owns this reduction-plan check; a native shape scan is not an aggregate mint.
  compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "derived.structural.predicate_result", version: 2 });
  return capturePopulation(source, position, policy);
}
/** Package-private shape operation: only its original preflight selects this finite entry. */
export function captureRegisteredShapePredicatePopulation(source: AuthoredStructuralConditionSource, position: DeclaredEvidence<ExactLegalMoveMap>, preflight: RegisteredShapePredicatePreflight) {
  assertRegisteredShapePredicatePreflight(preflight);
  return capturePopulation(source, position, "predicate");
}
function capturePopulation(source: AuthoredStructuralConditionSource, position: DeclaredEvidence<ExactLegalMoveMap>, policy: AuthoredPredicatePolicy):
  { readonly kind: "available"; readonly value: AuthoredPredicatePopulation } | { readonly kind: "unavailable"; readonly reason: "source_dependency_unavailable" } {
  if (policy !== "predicate" && policy !== "witness") throw new TypeError("Unknown authored predicate visitation policy");
  const root = readLocalReadingInvocation(position);
  if (root.kind !== "fen" || position.projection.id !== "rules.mobility.reading.legal_moves" || position.projection.version !== 1
    || canonicalFen(positionFromFen(root.fen)) !== position.payload.fen) throw new TypeError("Authored predicate requires its exact genuine legal-position invocation");
  const image = readAuthoredStructuralConditionSource(source);
  const condition = invokeEvidenceValueRoute("authored.structural_condition.input@2", { source });
  const trace: AuthoredPredicateTrace[] = [], leaves: PopulationData["leaves"][number][] = [];
  const board = positionFromFen(position.payload.fen).board;
  type Result = { readonly matched: boolean; readonly squares: readonly SquareName[] };
  const visit = (node: StructuralExpression, path: string): Result => {
    let matched: boolean, squares: readonly SquareName[] = [];
    if (node.kind === "all" || node.kind === "any") {
      matched = node.kind === "all";
      const positive: SquareName[] = [];
      for (const [index, child] of node.of.entries()) {
        const result = visit(child, `${path}/of/${index}`);
        if (result.matched) positive.push(...result.squares);
        if (node.kind === "all" && !result.matched) { matched = false; break; }
        if (node.kind === "any" && result.matched) { matched = true; if (policy === "predicate") break; }
      }
      if (matched) squares = positive;
    } else if (node.kind === "not") matched = !visit(node.of, `${path}/of`).matched;
    else if (node.kind === "mirrored") {
      const result = visit(mirrorExpression(node.of, node.axis), `${path}/mirror/${node.axis}`);
      matched = result.matched; squares = result.squares;
    } else if (node.kind === "pieceOnSquare") {
      const square = parseSquare(node.square);
      if (square === undefined) throw new TypeError("Invalid authored square");
      const piece = board.get(square);
      matched = node.piece === null ? piece === undefined : piece?.color === node.piece.color && piece.role === node.piece.role;
      if (matched && node.piece !== null) squares = [node.square];
    } else if (node.kind === "feature") {
      const value = leaf(position, node.feature);
      leaves.push(freeze({ path, value }));
      trace.push(freeze({ path, expression: node, matched: value.payload.matched, leaf: value }));
      if (node.feature.kind === "named_structure") {
        const definition = STRUCTURE_PREDICATES[node.feature.id];
        if (definition === undefined) throw new TypeError("Unknown named-structure definition");
        const expanded = visit(definition, `${path}/named/${node.feature.id}`);
        if (expanded.matched !== value.payload.matched) throw new TypeError("Named-structure factory and owned witness expansion disagree");
        return expanded;
      }
      return { matched: value.payload.matched, squares: [] };
    } else if (node.kind === "quantified") {
      const files = "abcdefgh".split("") as FileName[], domain = "files" in node.over ? node.over.files : node.over.squares.files;
      const start = files.indexOf(domain.from), end = files.indexOf(domain.to);
      if (start < 0 || end < start) throw new TypeError("Invalid authored quantifier file domain");
      const members: StructuralExpression[] = [];
      for (const file of files.slice(start, end + 1)) {
        if ("files" in node.over) members.push({ kind: "feature", feature: { ...node.feature, file } as StructuralFeature });
        else {
          const ranks = node.over.squares.ranks;
          if (ranks.from < 1 || ranks.to > 8 || ranks.from > ranks.to) throw new TypeError("Invalid authored quantifier rank domain");
          for (let rank = ranks.from; rank <= ranks.to; rank++) {
            const square = `${file}${rank}` as SquareName;
            members.push(node.feature.kind === "piece" ? { kind: "pieceOnSquare", square, piece: node.feature.piece }
              : { kind: "feature", feature: { ...node.feature, square } as StructuralFeature });
          }
        }
      }
      matched = node.quantifier === "every";
      for (const [index, member] of members.entries()) {
        const result = visit(member, `${path}/expanded/${index}`);
        if (node.quantifier === "some" && result.matched) { matched = true; if (policy === "predicate") break; }
        if (node.quantifier === "every" && !result.matched) { matched = false; if (policy === "predicate") break; }
      }
    } else throw new TypeError("Unresolved authored plan signature");
    const result = { matched, squares: matched ? squares : [] };
    trace.push(freeze({ path, expression: node, matched })); return result;
  };
  try {
    const result = visit(image.effectiveExpression, image.pointer);
    const observation = freeze({ fen: position.payload.fen, source: image, policy, matched: result.matched,
      squares: [...new Set(result.squares)].sort(), trace });
    const population = Object.freeze({}) as AuthoredPredicatePopulation;
    POPULATIONS.set(population, Object.freeze({ condition, position, observation, leaves: Object.freeze(leaves) }));
    return Object.freeze({ kind: "available", value: population });
  } catch (error) {
    if (!(error instanceof UnavailableSource)) throw error;
    return Object.freeze({ kind: "unavailable", reason: "source_dependency_unavailable" });
  }
}
export function readAuthoredPredicatePopulation(source: AuthoredPredicatePopulation): PopulationData {
  const data = source !== null && typeof source === "object" ? POPULATIONS.get(source) : undefined;
  if (data === undefined) throw new TypeError("Authored predicate population is not original owned evaluation");
  readAuthoredStructuralInput(data.condition); readLocalReadingInvocation(data.position);
  for (const occurrence of data.leaves) {
    const invocation = readStructuralPredicateInvocation(occurrence.value);
    if (invocation.fen !== data.observation.fen) throw new TypeError("Authored predicate leaf crosses its root FEN");
    evidenceValueReceipt(occurrence.value);
  }
  return data;
}
