// DISPOSABLE type-level author model for D2548-D2551, strengthened by D2606-D2607.
// Not production code.
type Brand<T, B extends string> = T & { readonly __brand: B };
type Fen = Brand<string, "canonical-fen">;
type Digest = Brand<string, "provider-request-digest">;
type TablebaseCategory = "win" | "draw" | "loss" | "unknown";
type Perspective = "side_to_move";
type Pawn = Readonly<{ square: string; color: "white" | "black"; role: "pawn" }>;
type Move = Readonly<{ uci: string; from: string; to: string; role: string; promotion?: "queen" | "rook" | "bishop" | "knight" }>;
type Geometry = Readonly<{ fen: Fen; ordering: readonly Readonly<{ arrivalPly: number; pawns: readonly Pawn[] }>[] }>;
type ExactLegalMoveMap = Readonly<{
  fen: Fen;
  pieces: readonly Readonly<{ moves: readonly Move[] }>[];
}>;
type RecordedSource = Readonly<{
  kind: "recorded";
  fen: Fen;
  perspective: Perspective;
  values: Readonly<{ category: TablebaseCategory; dtz: number | null; preciseDtz: number | null }>;
}>;
type LiveSource = Readonly<{
  kind: "live";
  fen: Fen;
  perspective: Perspective;
  position: Readonly<{ category: TablebaseCategory; dtz: number | null; preciseDtz?: number | null }>;
}>;
type Source = RecordedSource | LiveSource;
type ProviderRequest = Readonly<{ operation: "syzygy.position@1"; request: Readonly<{ fen: Fen }> }>;
type Result = Readonly<{ kind: "success" | "local_domain_result" | "source_failure"; normalizedRequestDigest: Digest }>;

interface Scheduler {
  normalizedRequestDigest(request: ProviderRequest): Digest;
  get(request: ProviderRequest): Promise<Result>;
}

interface ReadingValue {
  readonly fen: Fen;
  readonly perspective: Perspective;
  readonly geometry: Geometry;
  readonly source: Source;
  readonly category: TablebaseCategory;
  readonly dtz: number | null;
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

function mapReading(geometry: Geometry, source: Source, legalMoves: ExactLegalMoveMap): ReadingValue {
  const sourcePosition = source.kind === "recorded" ? source.values : source.position;
  const immediatePromotion = legalMoves.pieces.flatMap((piece) => piece.moves)
    .filter((move) => move.promotion !== undefined)
    .sort((left, right) => left.uci.localeCompare(right.uci));
  return {
    fen: geometry.fen,
    perspective: source.perspective,
    geometry,
    source,
    category: sourcePosition.category,
    dtz: sourcePosition.dtz,
    preciseDtz: sourcePosition.preciseDtz ?? null,
    immediatePromotion,
    promotionFirst: geometry.ordering[0]?.pawns ?? [],
  };
}

declare const scheduler: Scheduler;
declare const request: ProviderRequest;
declare const geometry: Geometry;
declare const source: Source;
declare const moves: ExactLegalMoveMap;
void correlate(scheduler, request);
void mapReading(geometry, source, moves);

// @ts-expect-error a colour summary cannot replace exact tied pawn identities
const summarized: ReadingValue = { fen: geometry.fen, perspective: "side_to_move", geometry, source, category: "win", dtz: 1, preciseDtz: null, immediatePromotion: [], promotionFirst: "white" };
void summarized;

// @ts-expect-error category is a closed source projection, never caller prose
const inventedCategory: ReadingValue = { fen: geometry.fen, perspective: "side_to_move", geometry, source, category: "winning", dtz: 1, preciseDtz: null, immediatePromotion: [], promotionFirst: [] };
void inventedCategory;
