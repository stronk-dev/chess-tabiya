// DISPOSABLE author model for D2412-D2417. Not production code.
export const PROVIDER_OPERATION_EXECUTION = [
  { operationId: "opponent.stockfish_play", stages: [{ stageId: "select", instanceId: "stockfish-play", when: "always" }] },
  { operationId: "opponent.maia_inference", stages: [{ stageId: "select", instanceId: "maia-inference", when: "always" }] },
  { operationId: "evidence.stockfish_analysis", stages: [{ stageId: "analyse", instanceId: "stockfish-analysis", when: "always" }] },
  { operationId: "evidence.tablebase_probe", stages: [{ stageId: "probe", instanceId: "tablebase-primary", when: "always" }] },
  { operationId: "evidence.explorer_query", stages: [{ stageId: "query", instanceId: "explorer-primary", when: "always" }] },
  { operationId: "render.voice", stages: [{ stageId: "text", instanceId: "external-voice", when: "always" }, { stageId: "audio", instanceId: "external-tts", when: "audio_requested" }] },
  { operationId: "render.voice_compare", stages: [{ stageId: "text", instanceId: "external-voice", when: "always" }, { stageId: "audio", instanceId: "external-tts", when: "audio_requested" }] },
  { operationId: "render.voice_story", stages: [{ stageId: "text", instanceId: "external-voice", when: "always" }, { stageId: "audio", instanceId: "external-tts", when: "audio_requested" }] },
] as const;

export const PROVIDER_INSTANCE_DECLARATIONS = [
  { instanceId: "stockfish-play", familyId: "stockfish", implementations: ["uci_sidecar"], backoffGroup: null },
  { instanceId: "stockfish-analysis", familyId: "stockfish", implementations: ["uci_sidecar"], backoffGroup: null },
  { instanceId: "maia-inference", familyId: "maia", implementations: ["uci_sidecar"], backoffGroup: null },
  { instanceId: "tablebase-primary", familyId: "tablebase", implementations: ["lichess_http", "local_service"], backoffGroup: "lichess-api" },
  { instanceId: "explorer-primary", familyId: "explorer", implementations: ["lichess_http", "local_service"], backoffGroup: "lichess-api" },
  { instanceId: "external-voice", familyId: "voice", implementations: ["external_http", "local_service"], backoffGroup: "external-voice-api" },
  { instanceId: "external-tts", familyId: "tts", implementations: ["external_http", "local_service"], backoffGroup: "external-tts-api" },
] as const;

type OperationDeclaration = (typeof PROVIDER_OPERATION_EXECUTION)[number];
export type ProviderOperationId = OperationDeclaration["operationId"];
export type ProviderOperationStageRoute<D extends OperationDeclaration = OperationDeclaration> =
  D extends OperationDeclaration
    ? D["stages"][number] & { readonly operationId: D["operationId"] }
    : never;
export type StageIdFor<K extends ProviderOperationId> = Extract<ProviderOperationStageRoute, { operationId: K }>["stageId"];
export type InstanceFor<K extends ProviderOperationId, S extends string> = Extract<ProviderOperationStageRoute, { operationId: K; stageId: S }>["instanceId"];
type InstanceDeclaration = (typeof PROVIDER_INSTANCE_DECLARATIONS)[number];
export type ProviderInstanceId = InstanceDeclaration["instanceId"];
export type ProviderImplementation = InstanceDeclaration["implementations"][number] | "local_fixture";
export type ImplementationFor<I extends ProviderInstanceId> = Extract<InstanceDeclaration, { instanceId: I }>["implementations"][number] | "local_fixture";
export type ProviderBackoffGroupId = Exclude<InstanceDeclaration["backoffGroup"], null>;

export interface ProviderReceiptBase<R extends ProviderOperationStageRoute> {
  readonly operationId: R["operationId"];
  readonly stageId: R["stageId"];
  readonly instanceId: R["instanceId"];
  readonly implementation: ImplementationFor<R["instanceId"]>;
  readonly generation: string;
  readonly requestDigest: string;
}
export type ProviderOriginReceipt<R extends ProviderOperationStageRoute> = ProviderReceiptBase<R> & {
  readonly source: "provider_live" | "local_service" | "local_fixture";
};
export type ProviderAcquisitionReceipt<R extends ProviderOperationStageRoute> =
  | ProviderOriginReceipt<R>
  | (ProviderReceiptBase<R> & { readonly source: "cached_exact"; readonly cacheKeyDigest: string; readonly original: ProviderOriginReceipt<R> });
export type AnyProviderAcquisitionReceipt = ProviderOperationStageRoute extends infer R
  ? R extends ProviderOperationStageRoute
    ? ProviderAcquisitionReceipt<R>
    : never
  : never;

const operation = new Map(PROVIDER_OPERATION_EXECUTION.map((row) => [row.operationId, row] as const));
const instance = new Map(PROVIDER_INSTANCE_DECLARATIONS.map((row) => [row.instanceId, row] as const));
const originMatchesImplementation = (source: unknown, implementation: unknown): boolean =>
  source === "provider_live"
    ? implementation !== "local_service" && implementation !== "local_fixture"
    : source === implementation && (source === "local_service" || source === "local_fixture");
export function parseAcquisitionReceipt(value: unknown): AnyProviderAcquisitionReceipt {
  if (typeof value !== "object" || value === null) throw new TypeError("PROVIDER_RECEIPT_INVALID");
  const row = value as Record<string, unknown>;
  const declaration = operation.get(row.operationId as ProviderOperationId);
  const stage = declaration?.stages.find((candidate) => candidate.stageId === row.stageId);
  const configured = instance.get(row.instanceId as ProviderInstanceId);
  if (declaration === undefined || stage === undefined || stage.instanceId !== row.instanceId || configured === undefined) throw new TypeError("PROVIDER_RECEIPT_ROUTE_MISMATCH");
  if (!configured.implementations.includes(row.implementation as never) && row.implementation !== "local_fixture") throw new TypeError("PROVIDER_RECEIPT_IMPLEMENTATION_MISMATCH");
  const sourceMatches = row.source === "cached_exact" || originMatchesImplementation(row.source, row.implementation);
  if (!sourceMatches) throw new TypeError("PROVIDER_RECEIPT_SOURCE_MISMATCH");
  for (const field of ["generation", "requestDigest"]) if (typeof row[field] !== "string" || row[field] === "") throw new TypeError("PROVIDER_RECEIPT_IDENTITY_MISSING");
  if (row.source === "cached_exact") {
    const original = row.original as Record<string, unknown> | undefined;
    if (original === undefined) throw new TypeError("PROVIDER_RECEIPT_ORIGIN_MISSING");
    for (const field of ["operationId", "stageId", "instanceId", "implementation", "generation", "requestDigest"]) if (original[field] !== row[field]) throw new TypeError("PROVIDER_RECEIPT_ORIGIN_MISMATCH");
    if (!originMatchesImplementation(original.source, original.implementation)) throw new TypeError("PROVIDER_RECEIPT_ORIGIN_SOURCE_INVALID");
    if (typeof row.cacheKeyDigest !== "string" || row.cacheKeyDigest === "") throw new TypeError("PROVIDER_RECEIPT_CACHE_KEY_MISSING");
  }
  return value as AnyProviderAcquisitionReceipt;
}

export type RecoveryState =
  | { readonly state: "unverified"; readonly generation: string }
  | { readonly state: "available"; readonly generation: string }
  | { readonly state: "unavailable"; readonly generation: string; readonly reason: string; readonly opensInWindow: number }
  | { readonly state: "recovering"; readonly generation: string; readonly priorReason: string; readonly consecutiveSuccesses: 1; readonly requiredSuccesses: 2 };
export function reduceRecovery(state: RecoveryState, event: { readonly kind: "success" } | { readonly kind: "failure"; readonly reason: string } | { readonly kind: "generation"; readonly generation: string }): RecoveryState {
  if (event.kind === "generation") return { state: "unverified", generation: event.generation };
  if (event.kind === "failure") return { state: "unavailable", generation: state.generation, reason: event.reason, opensInWindow: state.state === "unavailable" ? state.opensInWindow + 1 : 1 };
  if (state.state === "recovering") return { state: "available", generation: state.generation };
  if (state.state === "unavailable" && state.opensInWindow >= 2) return { state: "recovering", generation: state.generation, priorReason: state.reason, consecutiveSuccesses: 1, requiredSuccesses: 2 };
  return { state: "available", generation: state.generation };
}

export type CacheIdentity = ProviderOperationStageRoute extends infer R
  ? R extends ProviderOperationStageRoute
    ? { readonly operationId: R["operationId"]; readonly stageId: R["stageId"]; readonly instanceId: R["instanceId"]; readonly generation: string; readonly requestDigest: string; readonly cacheKeyDigest: string }
    : never
  : never;
const cacheIdentity = (row: CacheIdentity): string => [row.operationId, row.stageId, row.instanceId, row.generation, row.requestDigest, row.cacheKeyDigest].join("\0");
export class ExactProviderCache {
  readonly #rows = new Map<string, CacheIdentity>();
  put(row: CacheIdentity): void { this.#rows.set(cacheIdentity(row), Object.freeze({ ...row })); }
  resolve(row: CacheIdentity): CacheIdentity | null { return this.#rows.get(cacheIdentity(row)) ?? null; }
  snapshot(): readonly CacheIdentity[] { return Object.freeze([...this.#rows.values()].sort((a, b) => cacheIdentity(a).localeCompare(cacheIdentity(b)))); }
}

export class ProviderBackoffCoordinator {
  readonly #blockedUntil = new Map<ProviderBackoffGroupId, number>();
  readonly #claimed = new Set<ProviderBackoffGroupId>();
  admit(group: ProviderBackoffGroupId, now: number): boolean {
    if ((this.#blockedUntil.get(group) ?? 0) > now || this.#claimed.has(group)) return false;
    this.#claimed.add(group); return true;
  }
  rateLimited(group: ProviderBackoffGroupId, now: number, retryAfterMs: number): void {
    this.#claimed.delete(group); this.#blockedUntil.set(group, now + Math.max(60_000, retryAfterMs));
  }
  complete(group: ProviderBackoffGroupId): void { this.#claimed.delete(group); }
}

export function assertProviderClosure(): void {
  if (PROVIDER_OPERATION_EXECUTION.length !== 8 || new Set(PROVIDER_OPERATION_EXECUTION.map((row) => row.operationId)).size !== 8) throw new TypeError("PROVIDER_OPERATION_SET_MISMATCH");
  for (const row of PROVIDER_OPERATION_EXECUTION) for (const stage of row.stages) if (!instance.has(stage.instanceId)) throw new TypeError("PROVIDER_STAGE_INSTANCE_MISSING");
}
