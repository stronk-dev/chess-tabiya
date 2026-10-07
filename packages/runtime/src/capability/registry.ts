// rfc/pack-capability-contract.md §2.2–§2.5, §3, §4.3 and §5 — the closed capability registry.
//
// `CAPABILITY_DECLARATIONS` has one declaration per (capability subject, version). The generated
// half (`declarations.generated.ts`) carries identity, meaning sources, dependencies and the
// legacy declaration marker (never recomputed from today's source); the authored half
// (`lifecycle.ts`) carries every disposition that is not "active at version 1". `CAPABILITY_HISTORIES`
// groups declarations by subject, retains obsolete versions and names exactly one current version.
// The §4.3 invariants run at module load.

import {
  capabilityEquals,
  capabilityId,
  capabilityKey,
  compareCapabilityVersions,
  type CapabilityId,
  type CapabilityKey,
} from "@chess-tabiya/schema";

import { GENERATED_CAPABILITY_DECLARATIONS } from "./declarations.generated.js";
import { CAPABILITY_LIFECYCLE } from "./lifecycle.js";

export type CapabilitySubjectKind =
  | "vocabulary_arm"
  | "expression_node"
  | "verdict_producer"
  | "convention"
  | "constant_table"
  | "projection"
  | "resolved_reference"
  | "contract_identity"
  | "assistance_surface"
  | "error_contract";

export interface SchemaMemberIdentityRef {
  readonly schemaPointer: string;
  readonly member: string | number | boolean;
}

export type CapabilitySiteRef =
  | { readonly kind: "symbol"; readonly module: string; readonly symbol: string }
  | { readonly kind: "discriminant_arm"; readonly module: string; readonly owner: string; readonly property: string; readonly value: string };

export type CapabilityMeaningSource =
  | { readonly kind: "schema_member"; readonly sourceIdentity: SchemaMemberIdentityRef }
  | { readonly kind: "ast"; readonly site: CapabilitySiteRef }
  | { readonly kind: "f1_projection"; readonly projection: CapabilityId }
  | { readonly kind: "resolved_content"; readonly registry: "shape" | "principle"; readonly entryId: string }
  | { readonly kind: "convention_entry"; readonly module: string; readonly table: string; readonly key: string }
  | { readonly kind: "package_dependency"; readonly package: string; readonly version: string; readonly integrity: string; readonly lockfile: string; readonly lockfileKey: string };

export type RefusalAuthority =
  | { readonly kind: "owner_ruling"; readonly ledgerRow: string }
  | { readonly kind: "protected_intent"; readonly document: string; readonly anchor: string }
  | { readonly kind: "accepted_rfc"; readonly document: string; readonly criterion: string };

export type WithdrawalRefusal =
  | { readonly kind: "no_migration_exists"; readonly reason: string }
  | { readonly kind: "replacement_refused"; readonly authority: RefusalAuthority };

export type SemanticDisposition =
  | { readonly kind: "active" }
  | { readonly kind: "deprecated"; readonly successor: CapabilityId; readonly reason: string; readonly reasonCode: "superseded" | "scheduled_withdrawal" }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string; readonly successor: CapabilityId }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string; readonly successor: null; readonly noSuccessor: WithdrawalRefusal }
  | { readonly kind: "refused"; readonly reason: string; readonly authority: RefusalAuthority }
  | { readonly kind: "refuted"; readonly reason: string; readonly evidenceRef: string }
  | { readonly kind: "unmeasured"; readonly experiment: string }
  | { readonly kind: "pending_decision"; readonly decisionRef: string }
  | { readonly kind: "unimplemented"; readonly implementationRef: string }
  | { readonly kind: "impossible"; readonly reason: string };

export type CapabilityAvailability = "local" | "recorded" | "provider" | "build_time";

export interface GeneratedCapabilityDeclaration {
  readonly subjectId: string;
  readonly id: CapabilityId;
  readonly subject: CapabilitySubjectKind;
  readonly sources: readonly CapabilityMeaningSource[];
  readonly dependsOn: readonly CapabilityId[];
  readonly conventionText?: string;
  /** Legacy immutable declaration marker. Not a checksum or equivalence proof of current code. */
  readonly semanticsDigest: string;
  readonly availability: CapabilityAvailability;
  /** The provider family a `provider` capability is reached through. */
  readonly providerFamily?: "opponent" | "analysis" | "corpus" | "tablebase" | "voice" | "tts";
}

export interface CapabilityDeclaration extends GeneratedCapabilityDeclaration {
  readonly disposition: SemanticDisposition;
}

export interface CapabilityHistory {
  readonly subjectId: string;
  readonly declarations: readonly CapabilityDeclaration[];
  readonly current: CapabilityId;
}

export interface CapabilityLifecycleRow {
  readonly subjectId: string;
  /** Every retained version, ascending; the last is current. */
  readonly versions: readonly { readonly version: CapabilityId["version"]; readonly disposition: SemanticDisposition }[];
}

/** §4.4: the generic identity a later evidence-sidecar consumer may adopt. F3 adds no sidecar field. */
export const CLAIM_BINDING_CAPABILITY_ID: CapabilityId = capabilityId("claim.binding", 1);

/** §3.1 rule 4: the three consumers that decide pack meaning at runtime. */
export const PACK_MEANING_CONSUMERS = Object.freeze(["authoring.predicate", "runtime.objective_condition", "runtime.guard_condition"] as const);

export type CapabilityRegistryErrorCode =
  | "CAPABILITY_DECLARATION_MISSING"
  | "CAPABILITY_DISPOSITION_INVALID"
  | "CAPABILITY_SOURCE_MISSING"
  | "CAPABILITY_UNDECLARED"
  | "CAPABILITY_DECLARATION_DUPLICATE"
  | "CAPABILITY_HISTORY_INVALID"
  | "CAPABILITY_SUCCESSOR_UNKNOWN"
  | "CAPABILITY_SUCCESSOR_SUBJECT_MISMATCH"
  | "CAPABILITY_SUCCESSOR_CYCLE"
  | "CAPABILITY_WITHDRAWAL_REFUSAL_MISSING"
  | "CAPABILITY_VERSION_ARM_MIXED"
  | "CAPABILITY_SOURCE_KIND_INVALID";

export class CapabilityRegistryError extends TypeError {
  readonly code: CapabilityRegistryErrorCode;
  constructor(code: CapabilityRegistryErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

const SOURCE_KINDS: Readonly<Record<CapabilitySubjectKind, readonly CapabilityMeaningSource["kind"][]>> = Object.freeze({
  vocabulary_arm: ["schema_member", "ast", "package_dependency"],
  expression_node: ["schema_member", "ast", "package_dependency"],
  verdict_producer: ["ast", "package_dependency"],
  convention: ["convention_entry"],
  constant_table: ["ast", "package_dependency"],
  projection: ["f1_projection"],
  resolved_reference: ["resolved_content", "ast", "package_dependency"],
  contract_identity: ["ast"],
  assistance_surface: ["ast"],
  error_contract: ["ast"],
});

const EXECUTABLE = new Set<SemanticDisposition["kind"]>(["active", "deprecated"]);

export interface CapabilityRegistry {
  readonly declarations: readonly CapabilityDeclaration[];
  readonly histories: readonly CapabilityHistory[];
  readonly byKey: ReadonlyMap<CapabilityKey, CapabilityDeclaration>;
  readonly dependsOn: ReadonlyMap<CapabilityKey, readonly CapabilityId[]>;
  current(subjectId: string): CapabilityDeclaration | undefined;
}

/**
 * Follows successor edges from `start`. Non-current rows advance within their own subject; only a
 * current row may name another subject (a replacement), and that target must be active.
 * Returns the terminal active declaration, or the typed no-successor refusal.
 */
export function followSuccessors(
  start: CapabilityId,
  byKey: ReadonlyMap<CapabilityKey, CapabilityDeclaration>,
  histories: ReadonlyMap<string, CapabilityHistory>,
): { readonly kind: "current"; readonly declaration: CapabilityDeclaration } | { readonly kind: "refusal"; readonly declaration: CapabilityDeclaration; readonly refusal: WithdrawalRefusal } {
  const seen = new Set<CapabilityKey>();
  let cursor = start;
  for (;;) {
    const key = capabilityKey(cursor);
    if (seen.has(key)) throw new CapabilityRegistryError("CAPABILITY_SUCCESSOR_CYCLE", [...seen, key].join(" -> "));
    seen.add(key);
    const declaration = byKey.get(key);
    if (declaration === undefined) throw new CapabilityRegistryError("CAPABILITY_SUCCESSOR_UNKNOWN", `${key} is not a declared capability`);
    const disposition = declaration.disposition;
    if (disposition.kind === "active") return { kind: "current", declaration };
    if (disposition.kind === "withdrawn" && disposition.successor === null) return { kind: "refusal", declaration, refusal: disposition.noSuccessor };
    if (disposition.kind !== "deprecated" && disposition.kind !== "withdrawn") return { kind: "current", declaration };
    const history = histories.get(declaration.subjectId);
    const isCurrent = history !== undefined && capabilityEquals(history.current, declaration.id);
    if (!isCurrent && disposition.successor.id !== declaration.subjectId) {
      throw new CapabilityRegistryError("CAPABILITY_SUCCESSOR_SUBJECT_MISMATCH", `${key} is not current and names ${capabilityKey(disposition.successor)} in another subject`);
    }
    cursor = disposition.successor;
  }
}

/** Builds and checks a registry. Every invariant is a module-load TypeError at the call site. */
export function buildCapabilityRegistry(
  generated: readonly GeneratedCapabilityDeclaration[],
  lifecycle: readonly CapabilityLifecycleRow[],
): CapabilityRegistry {
  const byKey = new Map<CapabilityKey, CapabilityDeclaration>();
  const lifecycleBySubject = new Map<string, CapabilityLifecycleRow>();
  for (const row of lifecycle) {
    if (lifecycleBySubject.has(row.subjectId)) throw new CapabilityRegistryError("CAPABILITY_DECLARATION_DUPLICATE", `lifecycle row ${row.subjectId} repeats`);
    lifecycleBySubject.set(row.subjectId, row);
  }
  const subjects = new Set(generated.map((row) => row.subjectId));
  for (const row of lifecycle) if (!subjects.has(row.subjectId)) throw new CapabilityRegistryError("CAPABILITY_UNDECLARED", `lifecycle row ${row.subjectId} describes no declared capability`);
  for (const row of generated) {
    if (row.id.id !== row.subjectId) throw new CapabilityRegistryError("CAPABILITY_HISTORY_INVALID", `${row.subjectId} declares id ${row.id.id}`);
    const key = capabilityKey(row.id);
    if (byKey.has(key)) throw new CapabilityRegistryError("CAPABILITY_DECLARATION_DUPLICATE", `${key} is declared twice`);
    const versions = lifecycleBySubject.get(row.subjectId)?.versions;
    const version = versions?.find((candidate) => compareCapabilityVersions(candidate.version, row.id.version) === 0);
    if (versions !== undefined && version === undefined) throw new CapabilityRegistryError("CAPABILITY_UNDECLARED", `${key} has no lifecycle row in its declared history`);
    const disposition: SemanticDisposition = version?.disposition ?? { kind: "active" };
    const allowed = SOURCE_KINDS[row.subject];
    for (const source of row.sources) if (!allowed.includes(source.kind)) throw new CapabilityRegistryError("CAPABILITY_SOURCE_KIND_INVALID", `${key} (${row.subject}) cannot carry a ${source.kind} source`);
    if (EXECUTABLE.has(disposition.kind) && row.sources.length === 0) throw new CapabilityRegistryError("CAPABILITY_SOURCE_MISSING", `${key} is ${disposition.kind} and names no meaning source`);
    byKey.set(key, Object.freeze({ ...row, disposition }));
  }
  const grouped = new Map<string, CapabilityDeclaration[]>();
  for (const declaration of byKey.values()) {
    const rows = grouped.get(declaration.subjectId) ?? [];
    rows.push(declaration);
    grouped.set(declaration.subjectId, rows);
  }
  const histories = new Map<string, CapabilityHistory>();
  for (const [subjectId, rows] of grouped) {
    rows.sort((left, right) => compareCapabilityVersions(left.id.version, right.id.version));
    if (new Set(rows.map((row) => row.id.version.kind)).size > 1) throw new CapabilityRegistryError("CAPABILITY_VERSION_ARM_MIXED", `${subjectId} mixes integer and semver versions`);
    const declaredVersions = lifecycleBySubject.get(subjectId)?.versions;
    if (declaredVersions !== undefined && declaredVersions.length !== rows.length) {
      throw new CapabilityRegistryError("CAPABILITY_DECLARATION_MISSING", `${subjectId} lifecycle names ${declaredVersions.length} versions and ${rows.length} are declared`);
    }
    const current = rows.at(-1)!;
    if (current.disposition.kind !== "active" && !(current.disposition.kind === "deprecated" && current.disposition.successor.id !== subjectId) && !(!EXECUTABLE.has(current.disposition.kind) && rows.length === 1)) {
      throw new CapabilityRegistryError("CAPABILITY_HISTORY_INVALID", `${subjectId} current version is ${current.disposition.kind}; a current row is active, a cross-subject replacement, or a single non-executable declaration`);
    }
    for (const row of rows.slice(0, -1)) {
      // F1 publishes parallel projection versions that consumers bind exactly; its manifest owns
      // their lifecycle, so an older projection version may stay active beside the current one.
      if (row.disposition.kind === "active" && row.subject === "projection") continue;
      if (row.disposition.kind === "active") throw new CapabilityRegistryError("CAPABILITY_HISTORY_INVALID", `${subjectId} has more than one active version`);
      if (row.disposition.kind !== "deprecated" && row.disposition.kind !== "withdrawn") throw new CapabilityRegistryError("CAPABILITY_HISTORY_INVALID", `${capabilityKey(row.id)} is an obsolete version and must be deprecated or withdrawn`);
      if (row.disposition.kind === "withdrawn" && row.disposition.successor === null && row.disposition.noSuccessor === undefined) throw new CapabilityRegistryError("CAPABILITY_WITHDRAWAL_REFUSAL_MISSING", `${capabilityKey(row.id)} is withdrawn without a successor or a typed refusal`);
    }
    histories.set(subjectId, Object.freeze({ subjectId, declarations: Object.freeze(rows), current: current.id }));
  }
  for (const declaration of byKey.values()) {
    const disposition = declaration.disposition;
    if (disposition.kind === "withdrawn" && disposition.successor === null && (disposition as { noSuccessor?: unknown }).noSuccessor === undefined) {
      throw new CapabilityRegistryError("CAPABILITY_WITHDRAWAL_REFUSAL_MISSING", `${capabilityKey(declaration.id)} is withdrawn without a typed refusal`);
    }
    if (disposition.kind === "deprecated" || (disposition.kind === "withdrawn" && disposition.successor !== null)) {
      const successor = disposition.successor as CapabilityId;
      if (successor.id === declaration.subjectId && compareCapabilityVersions(successor.version, declaration.id.version) <= 0) {
        throw new CapabilityRegistryError("CAPABILITY_HISTORY_INVALID", `${capabilityKey(declaration.id)} successor does not advance`);
      }
      const terminal = followSuccessors(declaration.id, byKey, histories);
      if (terminal.kind === "current" && terminal.declaration.disposition.kind !== "active") {
        throw new CapabilityRegistryError("CAPABILITY_DISPOSITION_INVALID", `${capabilityKey(declaration.id)} successor chain ends at ${terminal.declaration.disposition.kind}`);
      }
    }
    for (const dependency of declaration.dependsOn) {
      if (!byKey.has(capabilityKey(dependency))) throw new CapabilityRegistryError("CAPABILITY_DECLARATION_MISSING", `${capabilityKey(declaration.id)} depends on undeclared ${capabilityKey(dependency)}`);
    }
  }
  const declarations = Object.freeze([...byKey.values()].sort((left, right) => (capabilityKey(left.id) < capabilityKey(right.id) ? -1 : 1)));
  const dependsOn = new Map<CapabilityKey, readonly CapabilityId[]>(declarations.map((row) => [capabilityKey(row.id), row.dependsOn]));
  const historyList = Object.freeze([...histories.values()].sort((left, right) => (left.subjectId < right.subjectId ? -1 : 1)));
  return Object.freeze({
    declarations,
    histories: historyList,
    byKey,
    dependsOn,
    current: (subjectId: string) => {
      const history = histories.get(subjectId);
      return history === undefined ? undefined : byKey.get(capabilityKey(history.current));
    },
  });
}

export const CAPABILITY_REGISTRY: CapabilityRegistry = buildCapabilityRegistry(GENERATED_CAPABILITY_DECLARATIONS, CAPABILITY_LIFECYCLE);
export const CAPABILITY_DECLARATIONS: readonly CapabilityDeclaration[] = CAPABILITY_REGISTRY.declarations;
export const CAPABILITY_HISTORIES: readonly CapabilityHistory[] = CAPABILITY_REGISTRY.histories;
