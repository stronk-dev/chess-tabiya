// DISPOSABLE buildability model for D2521-D2523. RFC protocol only.
type Brand<T, B extends string> = T & { readonly __brand: B };
type Fen = Brand<string, "canonical_full_fen">;
type GeometryCompletion = Brand<Readonly<{ kind: "completed" }>, "geometry_completion">;
type TypedSyzygyRequest = Readonly<{
  operation: "syzygy.position@1";
  request: Readonly<{ rules: "chess"; variant: "standard"; fen: Fen; timeoutMs: number }>;
}>;

type LookupResult =
  | Readonly<{ kind: "found"; evidence: Brand<object, "recorded_tablebase"> }>
  | Readonly<{ kind: "absent" }>
  | Readonly<{ kind: "failed"; reason: "storage_unavailable" | "invalid_record" }>;

interface Dependencies {
  readonly recordedLookup: { get(fen: Fen): LookupResult };
  readonly scheduler: { get(request: TypedSyzygyRequest, scope: Readonly<{ budgetMs: number }>, signal: AbortSignal): Promise<unknown> };
  readonly sourceFactories: { readonly "syzygy.position@1": { make(delivery: object): object } };
}

interface PromotionRequest {
  readonly geometry: GeometryCompletion;
  readonly providerScope: Readonly<{ budgetMs: number }>;
  readonly signal: AbortSignal;
}

declare function collect(request: PromotionRequest, dependencies: Dependencies): Promise<unknown>;
declare const request: PromotionRequest;
declare const dependencies: Dependencies;
void collect(request, dependencies);

// @ts-expect-error an unsealed structural completion cannot enter the collector
void collect({ ...request, geometry: { kind: "completed" } }, dependencies);
// @ts-expect-error callers cannot inject a provider callable beside the exact scheduler/factory pair
const alternateProvider: Dependencies = { ...dependencies, syzygyPosition: async () => ({}) };
void alternateProvider;
