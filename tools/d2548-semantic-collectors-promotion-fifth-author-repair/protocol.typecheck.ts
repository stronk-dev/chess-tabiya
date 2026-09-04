// DISPOSABLE type-level author model for D2548-D2551. Not production code.
type Brand<T, B extends string> = T & { readonly __brand: B };
type Fen = Brand<string, "canonical-fen">;
type Digest = Brand<string, "provider-request-digest">;
type Pawn = Readonly<{ square: string; color: "white" | "black"; role: "pawn" }>;
type Move = Readonly<{ uci: string; from: string; to: string; role: string; promotion?: "queen" | "rook" | "bishop" | "knight" }>;
type Geometry = Readonly<{ fen: Fen; ordering: readonly Readonly<{ arrivalPly: number; pawns: readonly Pawn[] }>[] }>;
type Source = Readonly<{ kind: "recorded" | "live"; preciseDtz?: number | null }>;
type ProviderRequest = Readonly<{ operation: "syzygy.position@1"; request: Readonly<{ fen: Fen }> }>;
type Result = Readonly<{ kind: "success" | "local_domain_result" | "source_failure"; normalizedRequestDigest: Digest }>;

interface Scheduler {
  normalizedRequestDigest(request: ProviderRequest): Digest;
  get(request: ProviderRequest): Promise<Result>;
}

interface ReadingValue {
  readonly fen: Fen;
  readonly geometry: Geometry;
  readonly source: Source;
  readonly preciseDtz: number | null;
  readonly immediatePromotion: readonly Move[];
  readonly promotionFirst: readonly Pawn[];
}

async function correlate(scheduler: Scheduler, request: ProviderRequest): Promise<Result> {
  const expected = scheduler.normalizedRequestDigest(request);
  const result = await scheduler.get(request);
  if (result.normalizedRequestDigest !== expected) throw new TypeError("REQUEST_RESULT_MISMATCH");
  return result;
}

function mapReading(geometry: Geometry, source: Source, legalMoves: readonly Move[]): ReadingValue {
  return {
    fen: geometry.fen,
    geometry,
    source,
    preciseDtz: source.preciseDtz ?? null,
    immediatePromotion: legalMoves.filter((move) => move.promotion !== undefined),
    promotionFirst: geometry.ordering[0]?.pawns ?? [],
  };
}

declare const scheduler: Scheduler;
declare const request: ProviderRequest;
declare const geometry: Geometry;
declare const source: Source;
declare const moves: readonly Move[];
void correlate(scheduler, request);
void mapReading(geometry, source, moves);

// @ts-expect-error a colour summary cannot replace exact tied pawn identities
const summarized: ReadingValue = { fen: geometry.fen, geometry, source, preciseDtz: null, immediatePromotion: [], promotionFirst: "white" };
void summarized;

// @ts-expect-error optional provider DTZ must be normalized before entering the exact output ABI
const optionalDtz: ReadingValue = { fen: geometry.fen, geometry, source, preciseDtz: source.preciseDtz, immediatePromotion: [], promotionFirst: [] };
void optionalDtz;
