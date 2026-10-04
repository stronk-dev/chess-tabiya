/**
 * Provider-exchange §1: one strict path compiler, shared by individual traversals and the
 * eventual whole-manifest image. A legacy provider leaf has no fabricated operation fallback.
 * Semantic dependsOn edges are not execution conjunctions; only literal derivation operands
 * generate paths. The existing registered provider.path.v1 constructor owns path identity.
 */
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { AvailabilityMode, CompiledEvidenceManifest, LatencyMode, ProjectionDeclaration, VersionedEvidenceId } from "./evidence-contract.js";
import { digestProviderPath } from "./provider-digest.js";
import { PROVIDER_PROTOCOL_RESOURCE } from "./provider-protocol.js";
import type { ProviderOperationId } from "./provider-types.js";

export interface CompiledProjectionExecution {
  readonly projection: VersionedEvidenceId;
  readonly own: {
    readonly availability: AvailabilityMode;
    readonly latency: LatencyMode;
    readonly providerOperation: ProviderOperationId | null;
  };
  readonly paths: readonly {
    readonly pathId: `path:sha256:${string}`;
    readonly derivationChoices: readonly {
      readonly projection: VersionedEvidenceId;
      readonly occurrence: readonly number[];
      readonly member: number;
      readonly inputs: readonly VersionedEvidenceId[];
    }[];
    readonly sourceRequirements: readonly {
      readonly occurrence: readonly number[];
      readonly projection: VersionedEvidenceId;
      readonly availability: "recorded" | "provider" | "build_time";
      readonly providerOperation: ProviderOperationId | null;
    }[];
    readonly effectiveLatency: LatencyMode;
  }[];
  readonly worstCaseLatency: LatencyMode;
}

type Choice = CompiledProjectionExecution["paths"][number]["derivationChoices"][number];
type Source = CompiledProjectionExecution["paths"][number]["sourceRequirements"][number];
type ExpandedPath = { readonly choices: readonly Choice[]; readonly sources: readonly Source[]; readonly latency: LatencyMode };
const key = (ref: VersionedEvidenceId): string => `${ref.id}@${ref.version}`;
const reference = (ref: VersionedEvidenceId): VersionedEvidenceId => Object.freeze({ id: ref.id, version: ref.version });
const LATENCIES: readonly LatencyMode[] = Object.freeze(["sync", "interactive", "background", "offline"]);
const slowest = (left: LatencyMode, right: LatencyMode): LatencyMode => LATENCIES[Math.max(LATENCIES.indexOf(left), LATENCIES.indexOf(right))]!;

// Closed type-map arms, not an operation/request image: the operation and actual factory binding
// come from PROVIDER_PROTOCOL_RESOURCE. A substring containing an operation is not a payload type.
const PROVIDER_PAYLOAD_TYPES = Object.freeze({
  "stockfish.legal_root_table@1": "StockfishLegalRootTable",
  "stockfish.position_evaluation@1": "FixedBoundPositionEvaluation",
  "stockfish.principal_variation@1": "FixedBoundPrincipalVariation",
  "maia.policy_page@1": "MaiaPolicyPage",
  "syzygy.position@1": "LiveSyzygyPosition",
  "lichess_explorer.position_page@1": "ExplorerPositionPage",
} as const satisfies Readonly<Record<ProviderOperationId, string>>);

export class EvidenceExecutionError extends TypeError {
  constructor(readonly code: "EXECUTION_SOURCE_UNREGISTERED" | "EXECUTION_SOURCE_PAYLOAD" | "EXECUTION_GRAPH_INVALID" | "EXECUTION_PATH_COLLISION", message: string) {
    super(`${code}: ${message}`);
    this.name = "EvidenceExecutionError";
  }
}

function providerOperation(projection: ProjectionDeclaration, availability: AvailabilityMode): ProviderOperationId | null {
  const protocol = PROVIDER_PROTOCOL_RESOURCE.payload.operations.find(row => row.sourceProjection === key(projection));
  if (availability !== "provider") {
    if (protocol !== undefined) throw new EvidenceExecutionError("EXECUTION_SOURCE_PAYLOAD", `${key(projection)} is a registered provider source but advertises ${availability}`);
    return null;
  }
  if (protocol === undefined) throw new EvidenceExecutionError("EXECUTION_SOURCE_UNREGISTERED", `${key(projection)} has no registered provider operation/source factory`);
  const expected = `ProviderEvidenceDelivery<${PROVIDER_PAYLOAD_TYPES[protocol.operation]},"${protocol.operation}">`;
  if (projection.payloadType.replace(/\s/gu, "") !== expected) throw new EvidenceExecutionError("EXECUTION_SOURCE_PAYLOAD", `${key(projection)} must retain the whole ${expected}`);
  return protocol.operation;
}

function compareOccurrences(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) return left[index]! - right[index]!;
  }
  return left.length - right.length;
}

/**
 * Compile one root from the authoritative semantic manifest. This does not claim the entire
 * legacy catalogue is executable. Unregistered/bare provider operands are loud refusals.
 */
export function compileProjectionExecution(manifest: Pick<CompiledEvidenceManifest, "projections" | "producers">, root: VersionedEvidenceId): CompiledProjectionExecution {
  const projections = new Map<string, ProjectionDeclaration>();
  for (const projection of manifest.projections) {
    if (projections.has(key(projection))) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `duplicate projection ${key(projection)}`);
    projections.set(key(projection), projection);
  }
  const producers = new Map(manifest.producers.map(producer => [key(producer), producer]));
  if (producers.size !== manifest.producers.length) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", "duplicate producer");
  const active = new Set<string>();
  const ownFor = (projection: ProjectionDeclaration): CompiledProjectionExecution["own"] => {
    const producer = producers.get(key(projection.producer));
    if (producer === undefined || !LATENCIES.includes(producer.latency) || !["local", "recorded", "provider", "build_time"].includes(producer.availability)) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `${key(projection)} has no valid own producer`);
    return Object.freeze({ availability: producer.availability, latency: producer.latency, providerOperation: providerOperation(projection, producer.availability) });
  };
  const expand = (ref: VersionedEvidenceId, address: readonly number[]): readonly ExpandedPath[] => {
    const projection = projections.get(key(ref));
    if (projection === undefined) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `missing projection ${key(ref)}`);
    if (active.has(key(ref))) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `execution cycle at ${key(ref)}`);
    active.add(key(ref));
    try {
      const own = ownFor(projection);
      const derivation = projection.derivation;
      if (derivation === undefined) {
        const sources: readonly Source[] = own.availability === "local" ? [] : [Object.freeze({ occurrence: Object.freeze([...address]), projection: reference(projection), availability: own.availability, providerOperation: own.providerOperation })];
        return [{ choices: [], sources, latency: own.latency }];
      }
      const members = derivation.inputs === undefined ? derivation.anyOf : [derivation.inputs];
      if (members === undefined || members.length === 0 || members.some(member => member.length === 0) || (derivation.inputs !== undefined && derivation.anyOf !== undefined)) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `empty or crossed derivation at ${key(ref)}`);
      const identities = members.map(member => member.map(key).join("\0"));
      if (new Set(identities).size !== identities.length) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `duplicate derivation member at ${key(ref)}`);
      return members.flatMap((inputs, member) => {
        const choice: Choice = Object.freeze({ projection: reference(projection), occurrence: Object.freeze([...address]), member, inputs: Object.freeze(inputs.map(reference)) });
        let products: readonly ExpandedPath[] = [{ choices: [choice], sources: [], latency: own.latency }];
        for (let index = 0; index < inputs.length; index += 1) {
          const paths = expand(inputs[index]!, [...address, index]);
          products = products.flatMap(product => paths.map(path => ({ choices: [...product.choices, ...path.choices], sources: [...product.sources, ...path.sources], latency: slowest(product.latency, path.latency) })));
        }
        return products;
      });
    } finally {
      active.delete(key(ref));
    }
  };
  const declaration = projections.get(key(root));
  if (declaration === undefined) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `missing root ${key(root)}`);
  const seen = new Map<string, string>();
  const paths = expand(root, []).map(path => {
    const derivationChoices = Object.freeze([...path.choices].sort((a, b) => compareOccurrences(a.occurrence, b.occurrence)));
    const sourceRequirements = Object.freeze([...path.sources].sort((a, b) => compareOccurrences(a.occurrence, b.occurrence) || key(a.projection).localeCompare(key(b.projection))));
    const image = {
      projection: key(root),
      derivationChoices: derivationChoices.map(choice => ({ projection: key(choice.projection), occurrence: choice.occurrence, member: choice.member, inputs: choice.inputs.map(key) })),
      sourceRequirements: sourceRequirements.map(source => ({ ...source, projection: key(source.projection) })),
    };
    const pathId = digestProviderPath(image);
    const canonicalImage = canonicalizeJson(image);
    const prior = seen.get(pathId);
    if (prior !== undefined && prior !== canonicalImage) throw new EvidenceExecutionError("EXECUTION_PATH_COLLISION", `unequal execution images alias ${pathId}`);
    seen.set(pathId, canonicalImage);
    return Object.freeze({ pathId, derivationChoices, sourceRequirements, effectiveLatency: path.latency });
  });
  return Object.freeze({ projection: reference(root), own: ownFor(declaration), paths: Object.freeze(paths.sort((a, b) => a.pathId.localeCompare(b.pathId))), worstCaseLatency: paths.reduce((latency, path) => slowest(latency, path.effectiveLatency), "sync" as LatencyMode) });
}

/** All-or-nothing: no legacy exclusions, null provider defaults or missing execution rows. */
export function compileManifestExecution(manifest: Pick<CompiledEvidenceManifest, "projections" | "producers">): readonly CompiledProjectionExecution[] {
  return Object.freeze([...manifest.projections].sort((a, b) => key(a).localeCompare(key(b))).map(projection => compileProjectionExecution(manifest, projection)));
}
