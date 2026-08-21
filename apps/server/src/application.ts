import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import type { Move, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import type { EvidencePayload } from "@chess-tabiya/runtime";

import {
  assertAdvertisedCapabilityDispositions,
  EngineCapabilities,
} from "./capabilities.js";
import { assertEvidenceManifest } from "./evidence-manifest.js";
import {
  EvidenceJobQueue,
  StockfishEvidenceExecutor,
  type EvidenceExecutor,
  type EvidenceJob,
} from "./evidence-queue.js";
import {
  EngineSupervisor,
  type EngineHealth,
  type EngineIdentity,
  type EngineRequest,
  type EngineSpec,
} from "./engine-supervisor.js";
import { maiaNetworkSpec } from "./maia.js";
import {
  OpponentSelector,
  type SelectorEngineClient,
} from "./opponent-selector.js";
import { PackRegistry } from "./pack-registry.js";
import { createHttpServer, createRestHandler, type RestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { PackStudio } from "./pack-studio.js";
import { SQLiteRunStorage } from "./storage.js";
import { IdentityService } from "./identity.js";
import { stockfishPlaySpec } from "./strong-engine.js";
import { LiveSessionService } from "./live-session.js";
import { ShapeRegistry } from "./shape-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { ShapeStudio } from "./shape-studio.js";
import type { VoiceProvider } from "./guidance.js";
import type { ReasoningReviewProvider } from "./external-voice.js";
import { FixtureCorpusSource, LichessCorpusSource, type CorpusSource } from "./corpus.js";
import { RepertoireService } from "./repertoire.js";
import type { TtsProvider } from "./external-tts.js";
import { FixtureTablebaseSource, LichessTablebaseSource, type TablebaseSource } from "./tablebase.js";

export type EngineMode = "mock" | "maia";

export interface ApplicationOptions {
  readonly databasePath?: string;
  readonly development?: boolean;
  readonly draftPackFile?: string;
  readonly draftPackFiles?: readonly string[];
  readonly engineMode?: EngineMode;
  readonly staticDirectory?: string;
  readonly maiaHost?: string;
  readonly maiaPort?: number;
  readonly stockfishCommand?: string;
  readonly cookieSecure?: boolean;
  readonly voiceProvider?: VoiceProvider;
  readonly reasoningReviewProvider?: ReasoningReviewProvider;
  readonly voicePersona?: string;
  readonly corpusToken?: string;
  readonly corpusSource?: CorpusSource;
  readonly ttsProvider?: TtsProvider;
  readonly tablebaseSource?: TablebaseSource | null;
}

export interface ChessTabiyaApplication {
  readonly server: ReturnType<typeof createHttpServer>;
  readonly engineMode: EngineMode;
  close(): Promise<void>;
}

const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const CONTENT_TYPES: Readonly<Record<string, string>> = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
});

function legalMoves(fen: string, history: readonly string[]): readonly string[] {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  for (const value of history) {
    const move = parseUci(value);
    if (move === undefined || !position.isLegal(move)) {
      throw new TypeError(`Mock opponent received illegal history move ${value}`);
    }
    position.play(move);
  }

  const moves: string[] = [];
  for (const [from, destinations] of position.allDests()) {
    for (const to of destinations) {
      const reachesBackRank =
        position.board.getRole(from) === "pawn" && (to < 8 || to >= 56);
      if (reachesBackRank) {
        for (const promotion of PROMOTIONS) {
          const move: Move = { from, to, promotion };
          if (position.isLegal(move)) moves.push(makeUci(move));
        }
      } else {
        const move: Move = { from, to };
        if (position.isLegal(move)) moves.push(makeUci(move));
      }
    }
  }
  return Object.freeze(moves.sort());
}

function positionCommand(request: EngineRequest): {
  readonly fen: string;
  readonly history: readonly string[];
} {
  const command = [...request.commands]
    .reverse()
    .find((candidate) => candidate.startsWith("position fen "));
  if (command === undefined) throw new TypeError("Mock engine requires a FEN");
  const match = /^position fen (.+?)(?: moves (.*))?$/.exec(command);
  if (match === null) throw new TypeError("Mock engine received an invalid FEN command");
  return Object.freeze({
    fen: match[1]!,
    history:
      match[2] === undefined || match[2] === ""
        ? Object.freeze([])
        : Object.freeze(match[2].split(" ")),
  });
}

class MockEngineClient implements SelectorEngineClient {
  readonly #identity: EngineIdentity = Object.freeze({
    id: "mock-opponent",
    kind: "opponent",
    name: "Deterministic mock opponent",
    version: "1",
    seedHonored: true,
    eloHonored: false,
  });

  start(): Promise<EngineIdentity> {
    return Promise.resolve(this.#identity);
  }

  health(): EngineHealth {
    return Object.freeze({
      id: this.#identity.id,
      status: "ready",
      restartCount: 0,
      identity: this.#identity,
    });
  }

  execute(_engineId: string, request: EngineRequest): Promise<readonly string[]> {
    const { fen, history } = positionCommand(request);
    const legal = legalMoves(fen, history);
    const historyKey = history.join(" ");
    const preferred =
      fen === "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3"
        ? new Map<string, string>([
            ["", "c8f5"],
            ["c8f5 g1f3", "e7e6"],
            ["c8f5 g1f3 e7e6 f1e2", "c6c5"],
          ]).get(historyKey)
        : new Map<string, string>([
            ["c1e3", "e7e6"],
            ["c1e3 e7e6 f2f3", "b7b5"],
          ]).get(historyKey);
    const move = preferred !== undefined && legal.includes(preferred) ? preferred : legal[0];
    if (move === undefined) throw new TypeError("Mock opponent has no legal move");
    return Promise.resolve(
      Object.freeze([
        `info depth 1 multipv 1 policy 1 score cp 0 pv ${move}`,
        `bestmove ${move}`,
      ]),
    );
  }
}

class MockEvidenceExecutor implements EvidenceExecutor {
  execute(job: EvidenceJob): Promise<EvidencePayload> {
    return Promise.resolve(
      Object.freeze({
        kind: job.kind,
        source: "engine_validated",
        values: Object.freeze({
          engineId: "mock-evidence",
          requestedMovetimeMs: job.movetime,
          centipawns: 0,
        }),
      }),
    );
  }
}

function stockfishAnalysisSpec(command: string): EngineSpec {
  return Object.freeze({
    id: "stockfish-analysis",
    kind: "judge",
    command,
    name: "Stockfish",
    options: Object.freeze({ Threads: 1, Hash: 16, MultiPV: 1 }),
  });
}

function isApiPath(pathname: string): boolean {
  return (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/capabilities" ||
    pathname === "/packs" ||
    pathname.startsWith("/packs/") ||
    pathname === "/shapes" ||
    pathname.startsWith("/shapes/") ||
    pathname === "/runs" ||
    pathname.startsWith("/runs/") ||
    pathname === "/progress" ||
    pathname.startsWith("/progress/") ||
    pathname === "/repertoires" ||
    pathname.startsWith("/repertoires/") ||
    pathname.startsWith("/api/shared/") ||
    pathname.startsWith("/shared/") ||
    pathname === "/select-move"
    || pathname === "/sessions"
    || pathname.startsWith("/sessions/")
  );
}

async function staticResponse(
  request: Request,
  staticDirectory: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.json(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } },
      { status: 405 },
    );
  }
  const url = new URL(request.url);
  const relative = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, "");
  const requested = resolve(staticDirectory, relative === "" ? "index.html" : relative);
  const root = resolve(staticDirectory);
  const safe = requested === root || requested.startsWith(`${root}/`);
  const candidate = safe ? requested : join(root, "index.html");
  let path = candidate;
  try {
    if (!(await stat(path)).isFile()) path = join(root, "index.html");
  } catch {
    path = join(root, "index.html");
  }
  try {
    const body = await readFile(path);
    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers: {
        "cache-control": path.endsWith("index.html")
          ? "no-cache"
          : "public, max-age=31536000, immutable",
        "content-type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream",
      },
    });
  } catch {
    return Response.json(
      { error: { code: "STATIC_NOT_BUILT", message: "Web client is not built" } },
      { status: 503 },
    );
  }
}

export async function createApplication(
  options: ApplicationOptions = {},
): Promise<ChessTabiyaApplication> {
  assertEvidenceManifest();
  const databasePath = options.databasePath ?? ":memory:";
  if (databasePath !== ":memory:") await mkdir(dirname(databasePath), { recursive: true });
  const storage = new SQLiteRunStorage(databasePath);
  const shapes = await ShapeRegistry.loadDefault();
  const principles = await PrincipleRegistry.loadDefault();
  const shapeStudio = new ShapeStudio(storage, shapes);
  await shapeStudio.hydrate();
  const registry = await PackRegistry.loadDefault({
    development: options.development === true,
    shapes,
    principles,
    ...(options.draftPackFile === undefined
      ? {}
      : { draftFile: options.draftPackFile }),
    ...(options.draftPackFiles === undefined
      ? {}
      : { draftFiles: options.draftPackFiles }),
  });
  const studio = new PackStudio(storage, registry, shapes);
  studio.hydrate();
  const engineMode = options.engineMode ?? "mock";
  let supervisor: EngineSupervisor | undefined;
  let selector: OpponentSelector;
  let capabilities: EngineCapabilities;
  let evidenceExecutor: EvidenceExecutor;
  const corpusSource = options.corpusSource ?? (engineMode === "mock" ? new FixtureCorpusSource() : options.corpusToken === undefined ? undefined : new LichessCorpusSource({ token: options.corpusToken }));
  const candidateTablebaseSource = options.tablebaseSource === null
    ? undefined
    : options.tablebaseSource ?? (engineMode === "mock" ? new FixtureTablebaseSource() : new LichessTablebaseSource());
  const tablebaseSource = candidateTablebaseSource instanceof FixtureTablebaseSource
    && !candidateTablebaseSource.configured
    ? undefined
    : candidateTablebaseSource;

  if (engineMode === "maia") {
    const stockfish = options.stockfishCommand ?? "stockfish";
    const analysisSpec = stockfishAnalysisSpec(stockfish);
    supervisor = new EngineSupervisor([
      maiaNetworkSpec(options.maiaHost ?? "maia", options.maiaPort ?? 7000),
      stockfishPlaySpec({ command: stockfish }),
      analysisSpec,
    ]);
    await supervisor.startAll();
    assertAdvertisedCapabilityDispositions([
      supervisor.health("stockfish-play"),
      supervisor.health("stockfish-analysis"),
      supervisor.health("maia-5m"),
    ]);
    selector = new OpponentSelector(supervisor, tablebaseSource === undefined ? {} : { tablebaseSource });
    capabilities = new EngineCapabilities(supervisor, [
      "stockfish-analysis",
      "maia-5m",
    ], { engineMode: "maia", llmAvailable: options.voiceProvider !== undefined, corpus: corpusSource === undefined ? "none" : "lichess-explorer", tts: options.ttsProvider === undefined ? "none" : "external", tablebase: tablebaseSource?.kind ?? "none" });
    evidenceExecutor = new StockfishEvidenceExecutor(
      supervisor,
      analysisSpec.id,
      Number(analysisSpec.options?.MultiPV),
    );
  } else {
    const mock = new MockEngineClient();
    selector = new OpponentSelector(mock, {
      maiaEngineId: "mock-opponent",
      strongEngineId: "mock-opponent",
      ...(tablebaseSource === undefined ? {} : { tablebaseSource }),
    });
    capabilities = new EngineCapabilities(mock, ["mock-opponent"], {
      engineMode: "mock", llmAvailable: options.voiceProvider !== undefined, corpus: "mock", tts: options.ttsProvider === undefined ? "none" : "external", tablebase: tablebaseSource?.kind ?? "none",
    });
    evidenceExecutor = new MockEvidenceExecutor();
  }

  const evidenceQueue = new EvidenceJobQueue(evidenceExecutor, {
    maxConcurrency: 2,
    ...(tablebaseSource === undefined ? {} : { tablebaseSource }),
  });
  const service = new RunService(storage, {
    evidenceQueue,
    packRegistry: registry,
    progressStorage: storage,
    opponentSelector: selector,
    shapeRegistry: shapes,
    ...(tablebaseSource === undefined ? {} : { tablebaseSource }),
  });
  const identity = new IdentityService(storage, {
    cookieSecure: options.cookieSecure ?? true,
  });
  const live = new LiveSessionService(storage, { runService: service });
  const repertoires = new RepertoireService(storage, service, corpusSource);
  const api = createRestHandler(service, selector, capabilities, identity, studio, live, shapes, shapeStudio, options.voiceProvider, options.voicePersona, corpusSource, repertoires, options.ttsProvider, options.reasoningReviewProvider);
  const staticDirectory =
    options.staticDirectory ?? join(process.cwd(), "apps", "web", "dist");
  const handler: RestHandler = async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return Response.json({ status: "ok", engineMode });
    }
    return isApiPath(url.pathname)
      ? api(request)
      : staticResponse(request, staticDirectory);
  };
  const server = createHttpServer(handler);
  return Object.freeze({
    server,
    engineMode,
    async close() {
      await new Promise<void>((resolveClose, reject) => {
        server.close((error) => (error === undefined ? resolveClose() : reject(error)));
      });
      storage.close();
      await supervisor?.shutdown();
    },
  });
}
