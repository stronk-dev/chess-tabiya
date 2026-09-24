// rfc/pack-capability-contract.md §4 — the pack side of the contract, owned by the single drill-pack
// reader (`validatePackDocument`) and the registration handshake.
//
//   * `derivePackRequirements` runs the one derivation algorithm (§2.7) against the generated
//     applicability image, the registry's `dependsOn` closure and the loaded shape/principle registry;
//   * `packRequirementIssues` makes the authored `requires` byte-equal that result — duplicate,
//     reordered, under-declared and over-declared arrays are distinct errors;
//   * `stampPackRequirements` is the one writer every emitter and Studio write calls before digesting;
//   * `runtimeSupportedCapabilities` is the configured active/deprecated identity set of this
//     deployment (§4.2/§5.1): a provider capability whose provider is not configured is unsupported
//     and absent; transient provider health never removes an identity from it.

import {
  CAPABILITY_APPLICABILITY,
  CAPABILITY_METADATA_INSTANCE_EXCLUSIONS,
  CapabilityError,
  PACK_CAPABILITIES_PROTOCOL,
  PACK_CAPABILITIES_PROTOCOL_VERSION,
  RequirementDerivationError,
  canonicalCapabilityRequirements,
  capabilityKey,
  compareCapabilityIds,
  deriveRequirements,
  memberCapabilityIndex,
  parseCanonicalRequirements,
  requirementDifference,
  resolvedShapeDependencies,
  semverCapabilityId,
  type CapabilityId,
  type CapabilityKey,
  type PackCapabilitiesPublicProjectionV1,
  type PackCapabilityPublicRowV1,
  type RequirementDerivation,
  type RequirementResolver,
} from "@chess-tabiya/schema";
import { CAPABILITY_REGISTRY, type CapabilityDeclaration, type CapabilityRegistry } from "@chess-tabiya/runtime";

import { livingPackSchema } from "../pack-schema.js";

export interface CapabilityEntryLookup {
  get(id: string): { readonly document: Readonly<Record<string, unknown>> | object } | undefined;
}

export interface PackRequirementContext {
  readonly schema: unknown;
  readonly shapes?: CapabilityEntryLookup;
  readonly principles?: CapabilityEntryLookup;
  readonly registry?: CapabilityRegistry;
}

const MEMBERS = memberCapabilityIndex(CAPABILITY_APPLICABILITY);

function versionOf(document: unknown): string | undefined {
  const version = (document as { readonly version?: unknown } | undefined)?.version;
  return typeof version === "string" ? version : undefined;
}

/**
 * Resolves a shape/principle reference against the loaded registry lookup when one is supplied, and
 * otherwise against the generated declarations (the installed content registries).
 */
export function capabilityResolver(context: PackRequirementContext): RequirementResolver {
  const registry = context.registry ?? CAPABILITY_REGISTRY;
  return {
    resolve(kind, id) {
      const lookup = kind === "shape" ? context.shapes : context.principles;
      if (lookup !== undefined) {
        const entry = lookup.get(id);
        if (entry === undefined) return undefined;
        const document = entry.document as Readonly<Record<string, unknown>>;
        const version = versionOf(document);
        if (version === undefined) return undefined;
        const capability = semverCapabilityId(`${kind}.${id}`, version);
        const declared = registry.byKey.get(capabilityKey(capability));
        const dependencies = declared?.dependsOn ?? (kind === "shape" ? resolvedShapeDependencies(context.schema, MEMBERS, document) : []);
        return { capability, dependencies };
      }
      const declared = registry.current(`${kind}.${id}`);
      return declared === undefined ? undefined : { capability: declared.id, dependencies: declared.dependsOn };
    },
  };
}

export function derivePackRequirements(document: unknown, context: PackRequirementContext): RequirementDerivation {
  const registry = context.registry ?? CAPABILITY_REGISTRY;
  return deriveRequirements(document, {
    schema: context.schema,
    applicability: CAPABILITY_APPLICABILITY,
    dependsOn: registry.dependsOn,
    excludedInstancePointers: CAPABILITY_METADATA_INSTANCE_EXCLUSIONS,
  }, capabilityResolver(context));
}

export interface PackRequirementIssue {
  readonly code:
    | "PACK_CAPABILITY_DUPLICATE"
    | "PACK_CAPABILITY_ORDER"
    | "PACK_CAPABILITY_INVALID"
    | "PACK_CAPABILITY_UNDER_DECLARED"
    | "PACK_CAPABILITY_OVER_DECLARED"
    | "PACK_CAPABILITY_UNDERIVABLE";
  readonly path: string;
  readonly message: string;
}

/** §4.1 / criterion 3: the authored `requires` must byte-equal the derived canonical array. */
export function packRequirementIssues(document: Readonly<Record<string, unknown>>, context: PackRequirementContext): readonly PackRequirementIssue[] {
  let declared: readonly CapabilityId[];
  try {
    declared = parseCanonicalRequirements(document.requires);
  } catch (error) {
    if (error instanceof CapabilityError) {
      const code = error.code === "PACK_CAPABILITY_DUPLICATE" || error.code === "PACK_CAPABILITY_ORDER" ? error.code : "PACK_CAPABILITY_INVALID";
      return [{ code, path: "/requires", message: error.message }];
    }
    throw error;
  }
  let derived: RequirementDerivation;
  try {
    derived = derivePackRequirements(document, context);
  } catch (error) {
    if (error instanceof RequirementDerivationError) return [{ code: "PACK_CAPABILITY_UNDERIVABLE", path: error.pointer || "/requires", message: error.message }];
    throw error;
  }
  const { missing, extra } = requirementDifference(declared, derived.requires);
  const issues: PackRequirementIssue[] = [];
  if (missing.length > 0) issues.push({ code: "PACK_CAPABILITY_UNDER_DECLARED", path: "/requires", message: `requires omits ${missing.length} derived capabilit${missing.length === 1 ? "y" : "ies"}: ${missing.map(capabilityKey).join(", ")}` });
  if (extra.length > 0) issues.push({ code: "PACK_CAPABILITY_OVER_DECLARED", path: "/requires", message: `requires declares ${extra.length} capabilit${extra.length === 1 ? "y" : "ies"} the pack does not reach: ${extra.map(capabilityKey).join(", ")}` });
  return issues;
}

/** The one writer: replaces `requires` with the derived canonical array. Pure; returns a copy. */
export function stampPackRequirements<T extends Readonly<Record<string, unknown>>>(document: T, context: PackRequirementContext): T & { readonly requires: readonly CapabilityId[] } {
  const { requires: _previous, ...rest } = document as Readonly<Record<string, unknown>>;
  void _previous;
  const derived = derivePackRequirements(rest, context);
  return { ...(structuredClone(rest) as T), requires: derived.requires.map((row) => ({ id: row.id, version: { ...row.version } })) };
}

const installedSchema = (): unknown => livingPackSchema();

/**
 * `stampPackRequirements` against the living schema and the installed registries — for writers
 * with no loaded shape registry of their own (fixtures, emitters) and for tests building packs.
 */
export function withDerivedRequires<T extends object>(document: T, context: Omit<PackRequirementContext, "schema"> = {}): T & { readonly requires: readonly CapabilityId[] } {
  return stampPackRequirements(document as unknown as Readonly<Record<string, unknown>>, { schema: installedSchema(), ...context }) as unknown as T & { readonly requires: readonly CapabilityId[] };
}

export interface DeploymentProviders {
  readonly opponent: boolean;
  readonly analysis: boolean;
  readonly corpus: boolean;
  readonly tablebase: boolean;
  readonly voice: boolean;
  readonly tts: boolean;
}

export const ALL_PROVIDERS_CONFIGURED: DeploymentProviders = Object.freeze({ opponent: true, analysis: true, corpus: true, tablebase: true, voice: true, tts: true });

const EXECUTABLE = new Set(["active", "deprecated"]);

/** Whether this deployment carries a declaration at all (the `unsupported` cause is `configured: false`). */
export function isConfigured(declaration: CapabilityDeclaration, providers: DeploymentProviders): boolean {
  if (!EXECUTABLE.has(declaration.disposition.kind)) return false;
  if (declaration.availability !== "provider") return true;
  return declaration.providerFamily !== undefined && providers[declaration.providerFamily];
}

export interface RuntimeCapabilitySupport {
  readonly supported: ReadonlySet<CapabilityKey>;
  readonly registry: CapabilityRegistry;
}

/**
 * The configured active/deprecated identity set. Resolved shape/principle capabilities are carried by
 * the registries this deployment loaded, so the loaded entries are added by exact version.
 */
export function runtimeSupportedCapabilities(options: {
  readonly providers?: DeploymentProviders;
  readonly registry?: CapabilityRegistry;
  readonly shapes?: Iterable<{ readonly id: string; readonly version: string }>;
  readonly principles?: Iterable<{ readonly id: string; readonly version: string }>;
} = {}): RuntimeCapabilitySupport {
  const registry = options.registry ?? CAPABILITY_REGISTRY;
  const providers = options.providers ?? ALL_PROVIDERS_CONFIGURED;
  const supported = new Set<CapabilityKey>();
  for (const declaration of registry.declarations) {
    if (declaration.subject === "resolved_reference" && (declaration.subjectId.startsWith("shape.") || declaration.subjectId.startsWith("principle."))) continue;
    if (isConfigured(declaration, providers)) supported.add(capabilityKey(declaration.id));
  }
  const resolved = (kind: "shape" | "principle", entries: Iterable<{ readonly id: string; readonly version: string }> | undefined): void => {
    if (entries === undefined) {
      for (const declaration of registry.declarations) if (declaration.subjectId.startsWith(`${kind}.`) && EXECUTABLE.has(declaration.disposition.kind)) supported.add(capabilityKey(declaration.id));
      return;
    }
    for (const entry of entries) supported.add(capabilityKey(semverCapabilityId(`${kind}.${entry.id}`, entry.version)));
  };
  resolved("shape", options.shapes);
  resolved("principle", options.principles);
  return Object.freeze({ supported, registry });
}

/** §4.3: `unmet = pack.requires \ runtimeSupported`, canonical. */
export function unmetRequirements(requires: readonly CapabilityId[], support: RuntimeCapabilitySupport): readonly CapabilityId[] {
  return canonicalCapabilityRequirements(requires.filter((row) => !support.supported.has(capabilityKey(row))));
}

export interface ProviderReachability {
  /** Health of a configured provider family at request time; absent means reachable. */
  readonly unreachable?: Partial<Record<keyof DeploymentProviders, { readonly retryAfterMs?: number }>>;
}

/**
 * §4.2: the SUPPORTED projection — configured `active`/`deprecated` declarations only, each with its
 * deployment reachability. Refused, withdrawn, unmeasured and impossible declarations and unconfigured
 * capabilities are absent. Private deployment facts (provider ids, endpoints, diagnostics) never
 * enter a row.
 */
export function projectPackCapabilities(support: RuntimeCapabilitySupport, reachability: ProviderReachability = {}): PackCapabilitiesPublicProjectionV1 {
  const rows: PackCapabilityPublicRowV1[] = [];
  for (const key of support.supported) {
    const declaration = support.registry.byKey.get(key);
    if (declaration === undefined) continue;
    const disposition = declaration.disposition;
    if (disposition.kind !== "active" && disposition.kind !== "deprecated") continue;
    const unreachable = declaration.availability === "provider" && declaration.providerFamily !== undefined ? reachability.unreachable?.[declaration.providerFamily] : undefined;
    rows.push(Object.freeze({
      capability: declaration.id,
      semanticDisposition: disposition.kind === "active"
        ? Object.freeze({ kind: "active" as const })
        : Object.freeze({ kind: "deprecated" as const, successor: disposition.successor, reasonCode: disposition.reasonCode }),
      availability: declaration.availability,
      reachability: unreachable === undefined
        ? Object.freeze({ kind: "supported" as const })
        : Object.freeze({ kind: "temporarily_unavailable" as const, providerFamily: declaration.providerFamily!, ...(unreachable.retryAfterMs === undefined ? {} : { retryAfterMs: unreachable.retryAfterMs }) }),
    }));
  }
  const published = new Set(rows.map((row) => capabilityKey(row.capability)));
  const lawful = rows.filter((row) => row.semanticDisposition.kind !== "deprecated" || published.has(capabilityKey(row.semanticDisposition.successor)));
  lawful.sort((left, right) => compareCapabilityIds(left.capability, right.capability));
  return Object.freeze({ protocol: PACK_CAPABILITIES_PROTOCOL, protocolVersion: PACK_CAPABILITIES_PROTOCOL_VERSION, rows: Object.freeze(lawful) });
}
