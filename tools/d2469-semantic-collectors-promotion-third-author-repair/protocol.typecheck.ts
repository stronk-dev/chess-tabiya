// DISPOSABLE buildability model for D2469-D2472. RFC protocol only; not production evidence.
type Brand<T, B extends string> = T & { readonly __brand: B };
type Fen = Brand<string, "full_fen">;
type Contacts = Brand<Readonly<{ fen: Fen }>, "contacts">;
type Geometry = Brand<Readonly<{ fen: Fen }>, "geometry">;
type LegalMoves = Brand<Readonly<{ fen: Fen }>, "legal_moves">;
type Recorded = Brand<Readonly<{ fen: Fen; category: "win" | "draw" | "loss" }>, "recorded">;
type Output = Brand<Readonly<{ category: "win" | "draw" | "loss" }>, "output">;

type ContactsInput =
  | Readonly<{ kind: "evidence"; evidence: Contacts }>
  | Readonly<{ kind: "unavailable"; reason: "not_collected" | "upstream_unavailable" }>;

type GeometryResult =
  | Readonly<{ kind: "completed"; output: Readonly<{ kind: "evidence"; input: Contacts; item: Geometry }> }>
  | Readonly<{ kind: "completed"; output: Readonly<{ kind: "no_evidence"; reason: "no_opposing_passed_clear_paths"; input: Contacts }> }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; missing: readonly ["contacts"]; upstreamReason: "not_collected" | "upstream_unavailable" }>;

declare const recordedResolutionBrand: unique symbol;
type RecordedResolution = (
  | Readonly<{ kind: "recorded"; fen: Fen; evidence: Recorded }>
  | Readonly<{ kind: "absent"; fen: Fen }>
) & { readonly [recordedResolutionBrand]: true };

type LegalResolution =
  | Readonly<{ kind: "evidence"; evidence: LegalMoves }>
  | Readonly<{ kind: "unavailable"; reason: "not_collected" | "upstream_unavailable" }>;

interface PromotionRequest {
  readonly geometry: GeometryResult;
  readonly providerScope: Brand<string, "scope">;
  readonly signal: AbortSignal;
}

interface Dependencies {
  readonly resolveRecorded: (fen: Fen) => RecordedResolution;
  readonly resolveLegalMoves: (fen: Fen) => LegalResolution;
  readonly syzygyPosition: (fen: Fen, signal: AbortSignal) => Promise<Readonly<{ kind: "success" | "outside_domain" | "source_failure" }>>;
}

type Result =
  | Readonly<{ kind: "evidence"; item: Output }>
  | Readonly<{ kind: "completed"; output: Readonly<{ kind: "no_evidence"; reason: "no_opposing_passed_clear_paths"; input: Contacts }> }>
  | Readonly<{ kind: "unavailable"; reason: "outside_tablebase_domain" | "provider_unavailable" | "input_abstained" }>;

declare function collect(request: PromotionRequest, dependencies: Dependencies): Promise<Result>;
declare const geometry: GeometryResult;
declare const scope: PromotionRequest["providerScope"];
declare const dependencies: Dependencies;
const request: PromotionRequest = { geometry, providerScope: scope, signal: new AbortController().signal };
void collect(request, dependencies);

// @ts-expect-error a valid no-witness is completed, never unavailable
const falseAbsence: GeometryResult = { kind: "unavailable", reason: "no_opposing_passed_clear_paths", input: {} as Contacts };
void falseAbsence;
// @ts-expect-error source selection is not a caller field
const callerSelectsLive: PromotionRequest = { ...request, source: { kind: "live" } };
void callerSelectsLive;
// @ts-expect-error success-only legal moves are resolved lazily by dependencies, not required by the request
const eagerLegalMap: PromotionRequest = { ...request, legalMoves: {} as LegalMoves };
void eagerLegalMap;
// @ts-expect-error only the authoritative resolver can create the branded recorded resolution
const forgedAbsent: RecordedResolution = { kind: "absent", fen: "fen" as Fen };
void forgedAbsent;
