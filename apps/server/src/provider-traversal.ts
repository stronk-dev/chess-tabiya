/**
 * The one process-local operator/research door onto the provider exchange
 * (rfc/provider-exchange-and-execution.md §9). It is built into the server release and has no HTTP
 * route.
 *
 * Five named callables traverse `scheduler.get` → registered parser → the operation's exact
 * value-authority source factory → its declared projection. Source failures and the Syzygy
 * local-domain arm are returned unchanged and never become evidence. Every callable requires the
 * opaque `ProviderOperatorCapability`, which only `runProviderTraversalCli` mints after parsing
 * exactly one closed operation name and one JSON request.
 *
 * Packaged entry: `node apps/server/dist/provider-traversal.js <operation>`; repository entry:
 * `make provider-traversal OP=<operation>`; the request is read from stdin.
 */
import { basename } from "node:path";

import {
  PROVIDER_PROTOCOL_RESOURCE,
  ProviderRequestInvalid,
  providerSourceEvidence,
  type DeclaredEvidence,
  type ExplorerPositionPageRequest,
  type MaiaPolicyPageRequest,
  type ProviderCliName,
  type ProviderDelivery,
  type ProviderEvidenceDelivery,
  type ProviderLocalDomainResult,
  type ProviderOperationId,
  type ProviderOperationRequestMap,
  type ProviderOperationResultMap,
  type ProviderRequestDigest,
  type ProviderSourceFailure,
  type StockfishLegalRootTableRequest,
  type StockfishPositionEvaluationRequest,
  type StockfishPrincipalVariationRequest,
  type SyzygyPositionRequest,
  type VersionedEvidenceId,
} from "@chess-tabiya/runtime";

import { EngineSupervisor, binaryArtifactProbe, type EngineArtifactProbe, type EngineSpec } from "./engine-supervisor.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors, type ProviderEngineClient, type ProviderFetch } from "./provider-operations.js";

// ---------------------------------------------------------------------------------------------
// Source factories: one per operation, each the runtime's sole value-authority route
// ---------------------------------------------------------------------------------------------

export interface ProviderSourceFactory<K extends ProviderOperationId> {
  readonly operation: K;
  readonly projection: VersionedEvidenceId;
  readonly symbol: string;
  make(delivery: ProviderDelivery<ProviderOperationResultMap[K], K>): DeclaredEvidence<ProviderEvidenceDelivery<ProviderOperationResultMap[K], K>>;
}

export type ProviderSourceFactories = { readonly [K in ProviderOperationId]: ProviderSourceFactory<K> };

function sourceFactory<K extends ProviderOperationId>(operation: K): ProviderSourceFactory<K> {
  const row = PROVIDER_PROTOCOL_RESOURCE.payload.operations.find((candidate) => candidate.operation === operation)!;
  const [id, version] = row.sourceProjection.split("@");
  return Object.freeze({
    operation,
    projection: Object.freeze({ id: id!, version: Number(version) }),
    symbol: row.sourceFactoryId,
    make: (delivery: ProviderDelivery<ProviderOperationResultMap[K], K>) => providerSourceEvidence(operation, delivery),
  });
}

export const PROVIDER_SOURCE_FACTORIES: ProviderSourceFactories = Object.freeze({
  "stockfish.legal_root_table@1": sourceFactory("stockfish.legal_root_table@1"),
  "stockfish.position_evaluation@1": sourceFactory("stockfish.position_evaluation@1"),
  "stockfish.principal_variation@1": sourceFactory("stockfish.principal_variation@1"),
  "maia.policy_page@1": sourceFactory("maia.policy_page@1"),
  "syzygy.position@1": sourceFactory("syzygy.position@1"),
  "lichess_explorer.position_page@1": sourceFactory("lichess_explorer.position_page@1"),
});

// ---------------------------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------------------------

export interface ProviderTraversalApplication {
  readonly scheduler: ProviderExchangeScheduler;
  readonly sourceFactories: ProviderSourceFactories;
  /** The explicit operator scope budget admitted by the deployment bounds. */
  readonly operatorBudgetMs: number;
}

export interface ProviderExchangeBounds {
  readonly maxActive: number;
  readonly maxQueued: number;
  readonly maxRetainedEntries: number;
  readonly maxRetainedWeight: number;
  readonly retentionTtlMs: number;
  readonly operatorBudgetMs: number;
}

/**
 * Explicit small operator/research values. The first learner-facing consumer must publish and
 * load-test its own deployment defaults; these are not blessed as production capacity.
 */
export const OPERATOR_PROVIDER_BOUNDS: ProviderExchangeBounds = Object.freeze({
  maxActive: 1,
  maxQueued: 4,
  maxRetainedEntries: 64,
  maxRetainedWeight: 4_096,
  retentionTtlMs: 600_000,
  operatorBudgetMs: 60_000,
});

export interface ProviderTraversalSources {
  readonly engines: ProviderEngineClient | null;
  readonly tablebaseFetch: ProviderFetch | null;
  readonly explorerFetch: ProviderFetch | null;
  readonly explorerToken: string | null;
  readonly bounds?: ProviderExchangeBounds;
  readonly monotonicNowMs?: () => number;
  readonly wallNow?: () => string;
}

/** One scheduler over the six operations; the application root and the CLI both use this. */
export function composeProviderTraversalApplication(sources: ProviderTraversalSources): ProviderTraversalApplication {
  const bounds = sources.bounds ?? OPERATOR_PROVIDER_BOUNDS;
  const scheduler = new ProviderExchangeScheduler({
    descriptors: providerOperationDescriptors(sources),
    maxActive: bounds.maxActive,
    maxQueued: bounds.maxQueued,
    maxRetainedEntries: bounds.maxRetainedEntries,
    maxRetainedWeight: bounds.maxRetainedWeight,
    retentionTtlMs: bounds.retentionTtlMs,
    monotonicNowMs: sources.monotonicNowMs ?? (() => performance.now()),
    wallNow: sources.wallNow ?? (() => new Date().toISOString()),
  });
  return Object.freeze({ scheduler, sourceFactories: PROVIDER_SOURCE_FACTORIES, operatorBudgetMs: bounds.operatorBudgetMs });
}

// ---------------------------------------------------------------------------------------------
// Operator capability and the five traversals
// ---------------------------------------------------------------------------------------------

declare const OPERATOR: unique symbol;
export type ProviderOperatorCapability = { readonly [OPERATOR]: true };
const CAPABILITIES = new WeakSet<object>();

function mintOperatorCapability(): ProviderOperatorCapability {
  const capability = Object.freeze(Object.create(null)) as ProviderOperatorCapability;
  CAPABILITIES.add(capability);
  return capability;
}

function assertOperatorCapability(value: unknown): asserts value is ProviderOperatorCapability {
  if (typeof value !== "object" || value === null || !CAPABILITIES.has(value)) throw new TypeError("provider traversal requires the CLI-minted operator capability");
}

export type ProviderEvidenceTraversalResult<K extends ProviderOperationId> =
  | ProviderSourceFailure<K>
  | ProviderLocalDomainResult<K>
  | Readonly<{ kind: "evidence_success"; operation: K; normalizedRequestDigest: ProviderRequestDigest; evidence: DeclaredEvidence<ProviderEvidenceDelivery<ProviderOperationResultMap[K], K>> }>;

async function traverse<K extends ProviderOperationId>(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, operation: K, request: ProviderOperationRequestMap[K]): Promise<ProviderEvidenceTraversalResult<K>> {
  assertOperatorCapability(capability);
  const result = await application.scheduler.get({ operation, request } as never, { id: `operator:${operation}`, budgetMs: application.operatorBudgetMs }, new AbortController().signal);
  if (result.kind !== "success") return result as ProviderEvidenceTraversalResult<K>;
  if (result.operation !== operation) throw new TypeError(`scheduler returned ${result.operation} for ${operation}`);
  const factory = application.sourceFactories[operation] as ProviderSourceFactory<K>;
  const evidence = factory.make(result.delivery as ProviderDelivery<ProviderOperationResultMap[K], K>);
  if (evidence.projection.id !== factory.projection.id || evidence.projection.version !== factory.projection.version) throw new TypeError(`${operation} reached ${evidence.projection.id}@${evidence.projection.version}`);
  return Object.freeze({ kind: "evidence_success", operation, normalizedRequestDigest: result.normalizedRequestDigest, evidence });
}

export function providerTraversalStockfishLegalRoots(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: StockfishLegalRootTableRequest): Promise<ProviderEvidenceTraversalResult<"stockfish.legal_root_table@1">> {
  return traverse(application, capability, "stockfish.legal_root_table@1", request);
}

export function providerTraversalStockfishPositionEvaluation(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: StockfishPositionEvaluationRequest): Promise<ProviderEvidenceTraversalResult<"stockfish.position_evaluation@1">> {
  return traverse(application, capability, "stockfish.position_evaluation@1", request);
}

export function providerTraversalStockfishPrincipalVariation(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: StockfishPrincipalVariationRequest): Promise<ProviderEvidenceTraversalResult<"stockfish.principal_variation@1">> {
  return traverse(application, capability, "stockfish.principal_variation@1", request);
}

export function providerTraversalMaiaPolicyPage(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: MaiaPolicyPageRequest): Promise<ProviderEvidenceTraversalResult<"maia.policy_page@1">> {
  return traverse(application, capability, "maia.policy_page@1", request);
}

export function providerTraversalSyzygyPosition(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: SyzygyPositionRequest): Promise<ProviderEvidenceTraversalResult<"syzygy.position@1">> {
  return traverse(application, capability, "syzygy.position@1", request);
}

export function providerTraversalExplorerPositionPage(application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: ExplorerPositionPageRequest): Promise<ProviderEvidenceTraversalResult<"lichess_explorer.position_page@1">> {
  return traverse(application, capability, "lichess_explorer.position_page@1", request);
}

type Traversal = (application: ProviderTraversalApplication, capability: ProviderOperatorCapability, request: never) => Promise<ProviderEvidenceTraversalResult<ProviderOperationId>>;

/** The closed CLI names, each bound to exactly one callable (census-checked against the resource). */
export const PROVIDER_TRAVERSALS: { readonly [Name in ProviderCliName]: { readonly operation: ProviderOperationId; readonly traverse: Traversal } } = Object.freeze({
  "stockfish-legal-roots": Object.freeze({ operation: "stockfish.legal_root_table@1", traverse: providerTraversalStockfishLegalRoots as unknown as Traversal }),
  "stockfish-position-evaluation": Object.freeze({ operation: "stockfish.position_evaluation@1", traverse: providerTraversalStockfishPositionEvaluation as unknown as Traversal }),
  "stockfish-principal-variation": Object.freeze({ operation: "stockfish.principal_variation@1", traverse: providerTraversalStockfishPrincipalVariation as unknown as Traversal }),
  "maia-policy-page": Object.freeze({ operation: "maia.policy_page@1", traverse: providerTraversalMaiaPolicyPage as unknown as Traversal }),
  "syzygy-position": Object.freeze({ operation: "syzygy.position@1", traverse: providerTraversalSyzygyPosition as unknown as Traversal }),
  "explorer-position-page": Object.freeze({ operation: "lichess_explorer.position_page@1", traverse: providerTraversalExplorerPositionPage as unknown as Traversal }),
});

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

export interface ProviderTraversalOutput {
  write(text: string): void;
}

async function readAll(stdin: string | AsyncIterable<string | Uint8Array>): Promise<string> {
  if (typeof stdin === "string") return stdin;
  let text = "";
  const decoder = new TextDecoder();
  for await (const chunk of stdin) text += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
  return text + decoder.decode();
}

/**
 * The single capability-minting door. Exit codes: 0 evidence or local-domain result, 3 a typed
 * source failure, 64 a usage/request error (nothing reached the scheduler).
 */
export async function runProviderTraversalCli(application: ProviderTraversalApplication, argv: readonly string[], stdin: string | AsyncIterable<string | Uint8Array>, stdout: ProviderTraversalOutput): Promise<number> {
  const usage = (message: string): number => {
    stdout.write(`${JSON.stringify({ kind: "usage_error", message })}\n`);
    return 64;
  };
  if (argv.length !== 1) return usage(`expected exactly one operation: ${Object.keys(PROVIDER_TRAVERSALS).join(" | ")}`);
  const entry = (PROVIDER_TRAVERSALS as Readonly<Record<string, { readonly operation: ProviderOperationId; readonly traverse: Traversal }>>)[argv[0]!];
  if (entry === undefined || !Object.hasOwn(PROVIDER_TRAVERSALS, argv[0]!)) return usage(`unknown operation ${argv[0]}`);
  let request: unknown;
  try {
    request = JSON.parse(await readAll(stdin));
  } catch {
    return usage("stdin must be exactly one JSON request");
  }
  let result: ProviderEvidenceTraversalResult<ProviderOperationId>;
  try {
    result = await entry.traverse(application, mintOperatorCapability(), request as never);
  } catch (error) {
    if (error instanceof ProviderRequestInvalid) return usage(error.message);
    throw error;
  }
  if (result.kind === "evidence_success") {
    const delivery = result.evidence.payload;
    stdout.write(`${JSON.stringify({
      kind: "evidence_success",
      operation: result.operation,
      projection: `${result.evidence.projection.id}@${result.evidence.projection.version}`,
      normalizedRequestDigest: result.normalizedRequestDigest,
      delivery: delivery.kind,
      responseDigest: delivery.acquisition.responseDigest,
      parser: delivery.payloadReceipt.parser,
      payloadDigest: delivery.payloadReceipt.payloadDigest,
      generation: delivery.acquisition.generation,
      retrievedAt: delivery.acquisition.retrievedAt,
    })}\n`);
    return 0;
  }
  stdout.write(`${JSON.stringify(result)}\n`);
  return result.kind === "local_domain_result" ? 0 : 3;
}

/** Build-time composition for the packaged CLI: real providers from explicit environment. */
export function providerTraversalEngineSpecs(environment: Readonly<Record<string, string | undefined>>): readonly EngineSpec[] {
  const specs: EngineSpec[] = [];
  const stockfish = environment.STOCKFISH_COMMAND ?? "stockfish";
  specs.push(Object.freeze({ id: "stockfish-analysis", kind: "judge", command: stockfish, name: "Stockfish", options: Object.freeze({ Threads: 1, Hash: 16, MultiPV: 1 }) }));
  return Object.freeze(specs);
}

async function main(): Promise<void> {
  const environment = process.env;
  const probe: EngineArtifactProbe = binaryArtifactProbe;
  const supervisor = new EngineSupervisor(providerTraversalEngineSpecs(environment), { artifactProbe: probe });
  const network = environment.PROVIDER_TRAVERSAL_OFFLINE === "1" ? null : ((url: string, init: { readonly signal: AbortSignal; readonly headers: Readonly<Record<string, string>> }) => fetch(url, { signal: init.signal, headers: { ...init.headers } }));
  const application = composeProviderTraversalApplication({
    engines: supervisor,
    tablebaseFetch: network,
    explorerFetch: network,
    explorerToken: environment.LICHESS_EXPLORER_TOKEN ?? null,
  });
  try {
    process.exitCode = await runProviderTraversalCli(application, process.argv.slice(2), process.stdin, process.stdout);
  } finally {
    await supervisor.shutdown();
  }
}

const invokedAs = basename(process.argv[1] ?? "");
if (invokedAs === "provider-traversal.js" || invokedAs === "provider-traversal.ts") {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 70;
  });
}
