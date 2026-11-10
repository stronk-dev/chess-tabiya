// Accepted longitudinal-store §A.2: closed persisted operands, never a publication authority.
import type { Color, FileName, Role, SquareName } from "chessops/types";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { NativeSubjectBySource, NativeSubjectSourceRef } from "../../../packages/runtime/src/semantic-native-subject-types.js";
import type { ParametersByFamily, RelationByFamily, SubjectByFamily, SubjectOutcomeFamily } from "../../../packages/runtime/src/semantic-subject-types.js";
import type { SemanticEventSign } from "@chess-tabiya/runtime";
import { canonicalInstant, LONGITUDINAL_PHASES, LONGITUDINAL_DECISION_CLASSES, LONGITUDINAL_SESSION_KINDS,
  parseDecisionRef, type DecisionRef, type LongitudinalPhase, type LongitudinalDecisionClass, type LongitudinalSessionKind } from "./longitudinal-contract.js";
import { LONGITUDINAL_INGEST_REGISTRY } from "./longitudinal-registry.js";

export type SubjectObservationIdentity =
  | { [F in SubjectOutcomeFamily]: Readonly<{ sourceKind: "condition_relation"; projectionId: `derived.semantic_avoidance.${F}`;
      projectionVersion: 2; subject: SubjectByFamily[F]; parameters: ParametersByFamily[F]; relation: RelationByFamily[F] }> }[SubjectOutcomeFamily]
  | { [R in NativeSubjectSourceRef]: Readonly<{ sourceKind: "native_incidence"; projectionId: R extends `${infer I}@${number}` ? I : never;
      projectionVersion: R extends `${string}@${infer V extends number}` ? V : never;
      subject: NativeSubjectBySource[R]; parameters: Readonly<Record<string, never>>; sign: SemanticEventSign }> }[NativeSubjectSourceRef];
interface SubjectRowContext {
  readonly learnerId: string; readonly runId: string; readonly decisionRef: DecisionRef;
  readonly phase: LongitudinalPhase; readonly decisionClass: LongitudinalDecisionClass;
  readonly sessionKind: LongitudinalSessionKind; readonly packId: string | null;
  readonly observedAt: string; readonly derivedRev: number; readonly actor: Color;
  readonly occurred: boolean; readonly legalAlternatives: number; readonly matchingAlternatives: number; readonly comparableAlternatives: number;
}
export type LongitudinalSubjectObservationRow = SubjectRowContext & SubjectObservationIdentity;
const invalid = (): never => { throw new TypeError("LONGITUDINAL_SUBJECT_ROW_INVALID"); };
// Snapshot data properties once. Accessors, symbols, extra keys and prototype bags refuse.
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return invalid();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length !== keys.length || !keys.every(key => descriptors[key]?.enumerable && "value" in descriptors[key]!)) return invalid();
  return Object.fromEntries(keys.map(key => [key, descriptors[key]!.value]));
}
function field(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object") return invalid();
  const d = Object.getOwnPropertyDescriptor(value, key); return d?.enumerable && "value" in d ? d.value : invalid();
}
function member<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== "string" || !values.includes(value as T)) return invalid(); return value as T;
}
const string = (v: unknown): string => typeof v === "string" && v.length > 0 ? v : invalid();
const integer = (v: unknown, min: number): number => Number.isSafeInteger(v) && (v as number) >= min ? v as number : invalid();
const color = (v: unknown): Color => member(v, ["white", "black"]);
const file = (v: unknown): FileName => member(v, ["a", "b", "c", "d", "e", "f", "g", "h"]);
const square = (v: unknown): SquareName => typeof v === "string" && /^[a-h][1-8]$/u.test(v) ? v as SquareName : invalid();
const role = (v: unknown): Role => member(v, ["pawn", "knight", "bishop", "rook", "queen", "king"]);
function piece(v: unknown, heavy = false) {
  const p = object(v, ["color", "role", "square"]);
  return Object.freeze({ color: color(p.color), role: heavy ? member(p.role, ["rook", "queen"] as const) : role(p.role), square: square(p.square) });
}
function direction(v: unknown) {
  const p = object(v, ["df", "dr"]);
  if (![p.df, p.dr].every(n => n === -1 || n === 0 || n === 1) || p.df === 0 && p.dr === 0) return invalid();
  return Object.freeze({ df: p.df as -1 | 0 | 1, dr: p.dr as -1 | 0 | 1 });
}
function subject(value: unknown, kind: string): Readonly<Record<string, unknown>> {
  let parsed: Record<string, unknown>;
  switch (kind) {
    case "backward_pawn": case "passed_pawn": case "king_zone": {
      const r = object(value, ["kind", "color", "rootSquare"]); parsed = { kind, color: color(r.color), rootSquare: square(r.rootSquare) }; break;
    }
    case "doubled_pawn": case "isolated_pawn": case "half_open_file": case "pawn_file_group": {
      const r = object(value, ["kind", "color", "file"]); parsed = { kind, color: color(r.color), file: file(r.file) }; break;
    }
    case "king_opposition": {
      const r = object(value, ["kind", "whiteRootSquare", "blackRootSquare"]);
      const whiteRootSquare = square(r.whiteRootSquare), blackRootSquare = square(r.blackRootSquare);
      if (whiteRootSquare === blackRootSquare) return invalid();
      parsed = { kind, whiteRootSquare, blackRootSquare }; break;
    }
    case "line_blockers": case "physical_slider": {
      const r = object(value, ["kind", "root", "direction"]); parsed = { kind, root: piece(r.root), direction: direction(r.direction) }; break;
    }
    case "loose_piece": {
      const r = object(value, ["kind", "root"]); const root = piece(r.root);
      if (root.role === "king") return invalid();
      parsed = { kind, root }; break;
    }
    case "piece_count": {
      const r = object(value, ["kind", "color", "role"]); parsed = { kind, color: color(r.color), role: role(r.role) }; break;
    }
    case "direct_attack_count": {
      const r = object(value, ["kind", "color", "square"]); parsed = { kind, color: color(r.color), square: square(r.square) }; break;
    }
    case "pawn_islands": {
      const r = object(value, ["kind", "color"]); parsed = { kind, color: color(r.color) }; break;
    }
    case "open_file": case "file_state": {
      const r = object(value, ["kind", "file"]); parsed = { kind, file: file(r.file) }; break;
    }
    case "file_access": {
      const r = object(value, ["kind", "piece", "file"]); const heavy = piece(r.piece, true), sourceFile = file(r.file);
      if (heavy.square[0] !== sourceFile) return invalid();
      parsed = { kind, piece: heavy, file: sourceFile }; break;
    }
    default: return invalid();
  }
  if (field(value, "kind") !== kind) return invalid();
  return Object.freeze(parsed);
}
function parameters(value: unknown, family: SubjectOutcomeFamily | undefined) {
  if (family === "king_opposition") {
    const p = object(value, ["holder", "form"]);
    return Object.freeze({ holder: color(p.holder), form: member(p.form, ["direct", "distant_three", "distant_five"] as const) });
  }
  if (family === "king_zone") {
    const p = object(value, ["zone"]); return Object.freeze({ zone: member(p.zone, ["edge", "corner"] as const) });
  }
  return Object.freeze(object(value, []));
}
const nativeKinds: Readonly<Record<NativeSubjectSourceRef, string>> = Object.freeze({
  "rules.structural.event.king_opposition@2": "king_opposition", "rules.structural.event.backward_pawn@2": "backward_pawn",
  "derived.structural.event.pawn_file_group@1": "pawn_file_group", "rules.transition.event.slider_ray@2": "physical_slider",
  "derived.activity.event.file_state@1": "file_state", "derived.activity.event.file_access_revealed@1": "file_access",
  "rules.structural.event.pawn_islands@2": "pawn_islands",
});
export function parseSubjectObservationIdentity(value: unknown): SubjectObservationIdentity {
  const sourceKind = field(value, "sourceKind");
  const tested = sourceKind === "condition_relation" ? "relation" : sourceKind === "native_incidence" ? "sign" : invalid();
  const r = object(value, ["sourceKind", "projectionId", "projectionVersion", "subject", "parameters", tested]);
  const projectionId = string(r.projectionId), projectionVersion = integer(r.projectionVersion, 1);
  const declaration = LONGITUDINAL_INGEST_REGISTRY.find(row => row.projection.id === projectionId && row.projection.version === projectionVersion);
  if (sourceKind === "condition_relation") {
    if (declaration?.kind !== "population") return invalid();
    return Object.freeze({ sourceKind, projectionId, projectionVersion, subject: subject(r.subject, declaration.family),
      parameters: parameters(r.parameters, declaration.family), relation: member(r.relation, declaration.relations) }) as SubjectObservationIdentity;
  }
  if (declaration?.kind !== "native") return invalid();
  const kind = nativeKinds[`${projectionId}@${projectionVersion}` as NativeSubjectSourceRef];
  if (kind === undefined) return invalid();
  return Object.freeze({ sourceKind, projectionId, projectionVersion, subject: subject(r.subject, kind),
    parameters: parameters(r.parameters, undefined), sign: member(r.sign, declaration.signs) }) as SubjectObservationIdentity;
}
type FilterFor<I extends SubjectObservationIdentity> = I extends SubjectObservationIdentity ? Readonly<{
  sourceKind: I["sourceKind"]; projection: { readonly id: I["projectionId"]; readonly version: I["projectionVersion"] };
  actor?: Color;
}> & Partial<Omit<I, "sourceKind" | "projectionId" | "projectionVersion">> : never;
export type SubjectObservationFilter = FilterFor<SubjectObservationIdentity>;
export function parseSubjectObservationFilter(value: unknown): SubjectObservationFilter {
  const sourceKind = field(value, "sourceKind");
  const tested = sourceKind === "condition_relation" ? "relation" : sourceKind === "native_incidence" ? "sign" : invalid();
  const optional = ["subject", "parameters", "actor", tested];
  if (value === null || typeof value !== "object") return invalid();
  const keys = Reflect.ownKeys(value);
  if (keys.some(k => typeof k !== "string" || !["sourceKind", "projection", ...optional].includes(k))) return invalid();
  const r = object(value, ["sourceKind", "projection", ...optional.filter(k => Object.hasOwn(value, k))]);
  const projection = object(r.projection, ["id", "version"]), id = string(projection.id), version = integer(projection.version, 1);
  const declaration = LONGITUDINAL_INGEST_REGISTRY.find(row => row.projection.id === id && row.projection.version === version);
  if (declaration === undefined || declaration.kind !== "population" && declaration.kind !== "native") return invalid();
  if (sourceKind === "condition_relation" ? declaration.kind !== "population" : declaration.kind !== "native") return invalid();
  const family = declaration.kind === "population" ? declaration.family : undefined;
  const kind = family ?? nativeKinds[`${id}@${version}` as NativeSubjectSourceRef];
  if (kind === undefined) return invalid();
  const parsedSubject = Object.hasOwn(r, "subject") ? subject(r.subject, kind) : undefined;
  const parsedActor = Object.hasOwn(r, "actor") ? color(r.actor) : undefined;
  if (kind === "loose_piece" && parsedSubject !== undefined && parsedActor !== undefined
    && (parsedSubject.root as { color: Color }).color !== parsedActor) return invalid();
  const domain = declaration.kind === "population" ? declaration.relations : declaration.signs;
  return Object.freeze({ sourceKind, projection: Object.freeze({ id, version }),
    ...(parsedSubject === undefined ? {} : { subject: parsedSubject }),
    ...(Object.hasOwn(r, "parameters") ? { parameters: parameters(r.parameters, family) } : {}),
    ...(parsedActor === undefined ? {} : { actor: parsedActor }),
    ...(Object.hasOwn(r, tested) ? { [tested]: member(r[tested], domain) } : {}),
  }) as SubjectObservationFilter;
}
export function subjectObservationMatches(row: LongitudinalSubjectObservationRow, filter: SubjectObservationFilter): boolean {
  if (row.sourceKind !== filter.sourceKind || row.projectionId !== filter.projection.id || row.projectionVersion !== filter.projection.version
    || filter.actor !== undefined && row.actor !== filter.actor
    || filter.subject !== undefined && canonicalizeJson(row.subject) !== canonicalizeJson(filter.subject)
    || filter.parameters !== undefined && canonicalizeJson(row.parameters) !== canonicalizeJson(filter.parameters)) return false;
  if (filter.sourceKind === "condition_relation" && row.sourceKind === "condition_relation") return filter.relation === undefined || row.relation === filter.relation;
  return filter.sourceKind === "native_incidence" && row.sourceKind === "native_incidence" && (filter.sign === undefined || row.sign === filter.sign);
}

const contextKeys = ["learnerId", "runId", "decisionRef", "phase", "decisionClass", "sessionKind", "packId", "observedAt", "derivedRev", "actor", "occurred", "legalAlternatives", "matchingAlternatives", "comparableAlternatives"] as const;
export function parseLongitudinalSubjectObservationRow(value: unknown): LongitudinalSubjectObservationRow {
  const tested = field(value, "sourceKind") === "condition_relation" ? "relation" : "sign";
  const identityKeys = ["sourceKind", "projectionId", "projectionVersion", "subject", "parameters", tested];
  const r = object(value, [...contextKeys, ...identityKeys]);
  const identity = parseSubjectObservationIdentity(Object.fromEntries(identityKeys.map(k => [k, r[k]])));
  const legalAlternatives = integer(r.legalAlternatives, 1), matchingAlternatives = integer(r.matchingAlternatives, 0), comparableAlternatives = integer(r.comparableAlternatives, 0);
  if (typeof r.occurred !== "boolean" || matchingAlternatives > comparableAlternatives || comparableAlternatives > legalAlternatives
    || (r.occurred ? comparableAlternatives <= matchingAlternatives : matchingAlternatives === 0)
    || identity.sourceKind === "native_incidence" && comparableAlternatives !== legalAlternatives) return invalid();
  const actor = color(r.actor);
  if (identity.sourceKind === "condition_relation" && identity.subject.kind === "loose_piece" && identity.subject.root.color !== actor) return invalid();
  const sessionKind = member(r.sessionKind, LONGITUDINAL_SESSION_KINDS), decisionRefKind = field(r.decisionRef, "kind");
  const ref = object(r.decisionRef, decisionRefKind === "move" ? ["kind", "nodeId", "eventSeq"] : ["kind", "nodeId", "checkpointId", "eventSeq"]);
  const decisionRef = parseDecisionRef(ref), decisionClass = member(r.decisionClass, LONGITUDINAL_DECISION_CLASSES);
  if ((decisionClass === "predicted") !== (decisionRef.kind === "prediction") || decisionClass === "game" && sessionKind !== "imported") return invalid();
  if (sessionKind === "pack" ? typeof r.packId !== "string" || r.packId.length === 0 : r.packId !== null) return invalid();
  return Object.freeze({ ...identity, learnerId: string(r.learnerId), runId: string(r.runId), decisionRef,
    phase: member(r.phase, LONGITUDINAL_PHASES), decisionClass, sessionKind, packId: r.packId as string | null,
    observedAt: canonicalInstant(r.observedAt, "LONGITUDINAL_SUBJECT_ROW_INVALID"), derivedRev: integer(r.derivedRev, 1), actor,
    occurred: r.occurred, legalAlternatives, matchingAlternatives, comparableAlternatives });
}
/** Exact literal SQL key parts; no hash or cross-decision invented piece identity. */
export function subjectObservationKey(row: LongitudinalSubjectObservationRow): string {
  return canonicalizeJson([row.learnerId, row.runId, row.decisionRef, row.sourceKind, row.projectionId, row.projectionVersion,
    row.subject, row.parameters, row.sourceKind === "condition_relation" ? `relation:${row.relation}` : `sign:${row.sign}`]);
}
