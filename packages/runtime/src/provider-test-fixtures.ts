/**
 * Test-only builders for provider captures (rfc/provider-exchange-and-execution.md). Imported only by
 * `*.test.ts` files; absent from the package barrel. Nothing here constructs a receipt or seal.
 */
import { exactLegalMoves } from "./legal-moves.js";
import { digestEngineBinary, digestEngineContainer, digestEngineOptionImage, providerUtf8 } from "./provider-digest.js";
import { maiaCommandImage, normalizeProviderRequest } from "./provider-requests.js";
import type {
  ExplorerPositionPageRequest,
  MaiaPolicyPageRequest,
  ProviderEndpointMap,
  ProviderExecutionCapture,
  ProviderRequestedIdentityMap,
  StockfishLegalRootTableRequest,
  StockfishPositionEvaluationRequest,
  SyzygyPositionRequest,
} from "./provider-types.js";

export const FIXTURE_AT = "2026-09-24T12:00:00.000Z";
export const FIXTURE_LATER = "2026-09-24T12:00:05.000Z";
export const STOCKFISH_ENDPOINT: ProviderEndpointMap["stockfish.legal_root_table@1"] = Object.freeze({ kind: "uci_supervisor", engineId: "stockfish-analysis" });
export const MAIA_ENDPOINT: ProviderEndpointMap["maia.policy_page@1"] = Object.freeze({ kind: "uci_supervisor", engineId: "maia-5m" });
export const SYZYGY_ENDPOINT: ProviderEndpointMap["syzygy.position@1"] = Object.freeze({ kind: "https", origin: "https://tablebase.lichess.org", path: "/standard" });
export const EXPLORER_ENDPOINT: ProviderEndpointMap["lichess_explorer.position_page@1"] = Object.freeze({ kind: "https", origin: "https://explorer.lichess.org", path: "/lichess" });

export const STOCKFISH_VERSION = "19";
export const MAIA_MODEL = Object.freeze({ id: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe", version: "1e13597c42d4858b7cfd7cfdae01e297263364b2" });

export const stockfishActual = (version = STOCKFISH_VERSION) => Object.freeze({
  id: "stockfish-analysis",
  name: "Stockfish",
  version,
  binaryDigest: digestEngineBinary(providerUtf8("fixture stockfish executable")),
  uciOptionsDigest: digestEngineOptionImage({ advertisedUciOptionLines: ["option name MultiPV type spin default 1 min 1 max 500"], appliedSetoptionCommands: ["setoption name Threads value 1"] }),
});

export const maiaActual = () => Object.freeze({
  id: "maia-5m",
  kind: "opponent" as const,
  name: "Maia3",
  version: MAIA_MODEL.version,
  modelId: MAIA_MODEL.id,
  containerDigest: digestEngineContainer({ runtime: "oci", imageId: "sha256:" + "1".repeat(64), manifestDigest: `sha256:${"2".repeat(64)}`, configDigest: `sha256:${"3".repeat(64)}` }),
  seedHonored: false,
  eloHonored: true as const,
  optionImageDigest: digestEngineOptionImage({ advertisedUciOptionLines: ["option name Elo type spin default 1500 min 1000 max 2600"], appliedSetoptionCommands: [] }),
});

/** Standard UCI spelling (king destination) of an exact king-takes-rook identity. */
export function engineSpelling(fen: string, identity: string): string {
  const move = exactLegalMoves(fen).find((candidate) => candidate.uci === identity);
  if (move === undefined) return identity;
  return `${move.from}${move.to}${identity.length === 5 ? identity[4] : ""}`;
}

export function transcript(commands: readonly string[], received: readonly string[]): Uint8Array {
  return providerUtf8([...commands.map((command) => `> ${command}`), ...received.map((line) => `< ${line}`)].join("\n"));
}

export function legalRootRequest(fen: string, depth = 8): StockfishLegalRootTableRequest {
  return { fen, bound: { kind: "depth", value: depth }, requestedWidth: "all_legal", moveIdentity: "chessops-king-takes-rook@1", requestedEngine: { id: "stockfish-analysis", version: STOCKFISH_VERSION }, timeoutMs: 5_000 };
}

export type RootLine = { readonly move: string; readonly score: string; readonly depth?: number; readonly extra?: string; readonly index?: number; readonly pv?: readonly string[] };

/** One info line per row at the requested depth, then bestmove. Row moves are exact identities. */
export function legalRootLines(fen: string, rows: readonly RootLine[], depth: number): readonly string[] {
  const lines = rows.map((row, position) => {
    const pv = row.pv ?? [engineSpelling(fen, row.move)];
    return `info depth ${row.depth ?? depth} seldepth ${depth + 2} multipv ${row.index ?? position + 1} score ${row.score}${row.extra === undefined ? "" : ` ${row.extra}`} nodes 100 pv ${pv.join(" ")}`;
  });
  return [...lines, `bestmove ${engineSpelling(fen, rows[0]!.move)}`];
}

export function legalRootCapture(identity: ProviderRequestedIdentityMap["stockfish.legal_root_table@1"], received: readonly string[], generation = 1): ProviderExecutionCapture<"stockfish.legal_root_table@1"> {
  return { endpoint: STOCKFISH_ENDPOINT, actualIdentity: stockfishActual(identity.request.requestedEngine.version), generation, contentEncoding: "uci-utf8", transport: null, responseBytes: transcript(identity.command.commands, received) };
}

export function allLegalRows(fen: string): readonly RootLine[] {
  return exactLegalMoves(fen).map((move, index) => ({ move: move.uci, score: `cp ${index * 3 - 10}` }));
}

export function evaluationRequest(fen: string, bound: StockfishPositionEvaluationRequest["bound"] = { kind: "depth", requestedDepth: 12 }): StockfishPositionEvaluationRequest {
  return { fen, requestedEngine: { id: "stockfish-analysis", version: STOCKFISH_VERSION }, bound, timeoutMs: 5_000 };
}

export function evaluationCapture(identity: ProviderRequestedIdentityMap["stockfish.position_evaluation@1"], received: readonly string[], generation = 1): ProviderExecutionCapture<"stockfish.position_evaluation@1"> {
  return { endpoint: STOCKFISH_ENDPOINT, actualIdentity: stockfishActual(identity.request.requestedEngine.version), generation, contentEncoding: "uci-utf8", transport: null, responseBytes: transcript(identity.command.commands, received) };
}

export function maiaRequest(position: MaiaPolicyPageRequest["position"], overrides: Partial<MaiaPolicyPageRequest> = {}): MaiaPolicyPageRequest {
  return { position, requestedModel: { ...MAIA_MODEL }, band: 1500, temperature: 1, topP: 1, requestedWidth: 3, timeoutMs: 5_000, ...overrides };
}

export function maiaCapture(identity: ProviderRequestedIdentityMap["maia.policy_page@1"], received: readonly string[], generation = 1): ProviderExecutionCapture<"maia.policy_page@1"> {
  return { endpoint: MAIA_ENDPOINT, actualIdentity: maiaActual(), generation, contentEncoding: "uci-utf8", transport: null, responseBytes: transcript(maiaCommandImage(identity.request), received) };
}

export function syzygyRequest(fen: string): SyzygyPositionRequest {
  return { rules: "chess", variant: "standard", fen, timeoutMs: 5_000 };
}

export function httpCapture<K extends "syzygy.position@1" | "lichess_explorer.position_page@1">(operation: K, body: unknown, etag: string | null = "\"fixture-etag\""): ProviderExecutionCapture<K> {
  const endpoint = operation === "syzygy.position@1" ? SYZYGY_ENDPOINT : EXPLORER_ENDPOINT;
  return {
    endpoint,
    actualIdentity: operation === "syzygy.position@1" ? { source: "lichess_syzygy", endpoint, apiVersion: "standard-v1" } : { source: "lichess_explorer", endpoint, apiVersion: "lichess-v1" },
    generation: null,
    contentEncoding: "http-body",
    transport: { statusCode: 200, headers: { etag } },
    responseBytes: providerUtf8(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as ProviderExecutionCapture<K>;
}

/** Lichess tablebase body listing every legal move with one category. */
export function syzygyBody(fen: string, category = "win", moveCategory = "loss"): unknown {
  return {
    category,
    dtz: 5,
    precise_dtz: 5,
    moves: exactLegalMoves(fen).map((move) => ({ uci: engineSpelling(fen, move.uci), san: move.uci, category: moveCategory, dtz: -4, precise_dtz: -4 })),
  };
}

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function explorerRequest(overrides: Partial<ExplorerPositionPageRequest> = {}): ExplorerPositionPageRequest {
  return {
    rules: "chess",
    setupFamily: "standard_start",
    variant: "standard",
    positionFen4: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -",
    requestFen6: START_FEN,
    ratingBuckets: [1600, 1800],
    speeds: ["blitz", "rapid"],
    since: "2024-01",
    until: "2026-08",
    moveWidth: 4,
    history: { kind: "disabled" },
    topWidth: 0,
    recentWidth: 0,
    timeoutMs: 5_000,
    ...overrides,
  };
}

export function explorerBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    white: 20, draws: 7, black: 10,
    moves: [
      { uci: "e2e4", san: "e4", averageRating: 1720, white: 12, draws: 3, black: 5 },
      { uci: "d2d4", san: "d4", averageRating: 1705, white: 6, draws: 3, black: 4 },
    ],
    opening: null,
    ...overrides,
  };
}

export function normalized<K extends Parameters<typeof normalizeProviderRequest>[0]>(operation: K, request: Parameters<typeof normalizeProviderRequest<K>>[1]): ProviderRequestedIdentityMap[K] {
  return normalizeProviderRequest(operation, request);
}
