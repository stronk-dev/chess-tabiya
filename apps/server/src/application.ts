import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import type { Move, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import type { EvidencePayload } from "@chess-tabiya/runtime";

import {
  EngineCapabilities,
} from "./capabilities.js";
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
import { MAIA3_MODEL_ID, MAIA3_SOURCE_COMMIT } from "./maia.js";
import {
  OpponentSelector,
  type SelectorEngineClient,
} from "./opponent-selector.js";
import { PackRegistry } from "./pack-registry.js";
import { createHttpServer, createRestHandler, type RestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { stockfishPlaySpec } from "./strong-engine.js";

export type EngineMode = "mock" | "maia";

export interface ApplicationOptions {
  readonly databasePath?: string;
  readonly engineMode?: EngineMode;
  readonly staticDirectory?: string;
  readonly maiaHost?: string;
  readonly maiaPort?: number;
  readonly stockfishCommand?: string;
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
    const preferred = new Map<string, string>([
      ["c1e3", "e7e6"],
      ["c1e3 e7e6 f2f3", "b7b5"],
    ]).get(history.join(" "));
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

function maiaNetworkSpec(host: string, port: number): EngineSpec {
  return Object.freeze({
    id: "maia-5m",
    kind: "opponent",
    command: "nc",
    args: Object.freeze([host, String(port)]),
    name: "Maia3",
    version: MAIA3_SOURCE_COMMIT,
    modelId: MAIA3_MODEL_ID,
    handshakeTimeoutMs: 60_000,
  });
}

function isApiPath(pathname: string): boolean {
  return (
    pathname === "/capabilities" ||
    pathname === "/packs" ||
    pathname.startsWith("/packs/") ||
    pathname === "/runs" ||
    pathname.startsWith("/runs/") ||
    pathname === "/select-move"
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
  const databasePath = options.databasePath ?? ":memory:";
  if (databasePath !== ":memory:") await mkdir(dirname(databasePath), { recursive: true });
  const registry = await PackRegistry.loadDefault();
  const storage = new SQLiteRunStorage(databasePath);
  const engineMode = options.engineMode ?? "mock";
  let supervisor: EngineSupervisor | undefined;
  let selector: OpponentSelector;
  let capabilities: EngineCapabilities;
  let evidenceExecutor: EvidenceExecutor;

  if (engineMode === "maia") {
    const stockfish = options.stockfishCommand ?? "stockfish";
    supervisor = new EngineSupervisor([
      maiaNetworkSpec(options.maiaHost ?? "maia", options.maiaPort ?? 7000),
      stockfishPlaySpec({ command: stockfish }),
      stockfishAnalysisSpec(stockfish),
    ]);
    await supervisor.startAll();
    selector = new OpponentSelector(supervisor);
    capabilities = new EngineCapabilities(supervisor, [
      "stockfish-analysis",
      "maia-5m",
    ], { engineMode: "maia" });
    evidenceExecutor = new StockfishEvidenceExecutor(supervisor);
  } else {
    const mock = new MockEngineClient();
    selector = new OpponentSelector(mock, {
      maiaEngineId: "mock-opponent",
      strongEngineId: "mock-opponent",
    });
    capabilities = new EngineCapabilities(mock, ["mock-opponent"], {
      engineMode: "mock",
    });
    evidenceExecutor = new MockEvidenceExecutor();
  }

  const evidenceQueue = new EvidenceJobQueue(evidenceExecutor, {
    maxConcurrency: 2,
  });
  const service = new RunService(storage, { evidenceQueue, packRegistry: registry });
  const api = createRestHandler(service, selector, capabilities);
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
