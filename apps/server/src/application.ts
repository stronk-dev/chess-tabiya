import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { botProfileIsStartable, botProfileStartability, canonicalFen, exactLegalMoves, packConceptReferenceEvidence, PRIMARY_EVIDENCE_MANIFEST, validateValenceRegister, VALENCE_REGISTER_FORMAT, type EvidencePayload, type PolicyConfig, type ValenceRegister } from "@chess-tabiya/runtime";

import { LearnerProfileService } from "./learner-profile.js";

import {
  assertAdvertisedCapabilityDispositions,
  EngineCapabilities,
} from "./capabilities.js";
import { assertEvidenceManifest } from "./evidence-manifest.js";
import { APPLICATION_EVIDENCE_RETRY_POLICY } from "./evidence-job-store.js";
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
import { MAIA3_MODEL_ID, maiaContainerProbe, maiaNetworkSpec } from "./maia.js";
import { ProviderRegistry, type ProviderHealthLogEvent, type ProviderInstanceConfiguration } from "./provider-health.js";
import { healthReportedCorpus, healthReportedReasoningReview, healthReportedTablebase, healthReportedTts, healthReportedVoice } from "./provider-health-adapters.js";
import { ExternalHttpVoiceProvider } from "./external-voice.js";
import { ExternalHttpTtsProvider } from "./external-tts.js";
import {
  OpponentSelector,
  type SelectorEngineClient,
} from "./opponent-selector.js";
import { PackRegistry } from "./pack-registry.js";
import { validatePackDocument } from "./pack-validation.js";
import { installedConceptRegistry } from "./concept-registry-loader.js";
import { createHttpServer, createRestHandler, type RestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { ReviewAttemptOutcomeStore, ReviewEvidenceCoordinator } from "./review-evidence.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { PackStudio } from "./pack-studio.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";
import { deploymentRefusal, type DeploymentBoundary } from "./config.js";
import {
  LONGITUDINAL_WORKER_DEFAULTS,
  fileBackedDatabaseIdentity,
  validateLongitudinalWorkerConfig,
  type LongitudinalWorkerConfig,
} from "./longitudinal-worker-config.js";
import { LongitudinalProjectionWorker, type LongitudinalWorkerProgress, type LongitudinalWorkerStatus } from "./longitudinal-worker.js";
import type { LongitudinalReconciliationReceipt } from "./longitudinal-store.js";
import type { LongitudinalReadResult, ParsedLongitudinalReadQuery } from "./longitudinal-contract.js";
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
import { ClassroomService } from "./classroom.js";
import type { TtsProvider } from "./external-tts.js";
import { FixtureTablebaseSource, LichessTablebaseSource, type TablebaseSource } from "./tablebase.js";
import { loadOpeningCatalogue } from "./opening-catalogue.js";
import { TheoryLibrary } from "./theory-library.js";
import { binaryArtifactProbe } from "./engine-supervisor.js";
import { OPERATOR_PROVIDER_BOUNDS, composeProviderTraversalApplication, type ProviderExchangeBounds, type ProviderTraversalApplication } from "./provider-traversal.js";
import { BotOpponentProviders } from "./bot-opponent-operation.js";
import { BotProviderAvailability } from "./bot-opponent-source.js";
import { CampaignRegistry } from "./campaign-registry.js";
import { CampaignService } from "./campaign-service.js";
import { loadReleaseAbout, type ReleaseAboutOptions } from "./release-about.js";

/** rfc/review-evidence-compiler.md §4.1: the 1.0 Review enrichment profile (explicit bounds). */
export const REVIEW_EVIDENCE_PROFILE = Object.freeze({
  windowNodes: 4,
  maxOutstandingPerRun: 2,
  maxTrackedRuns: 64,
  maxAttemptsPerRequest: 3,
  maxTerminalAttemptOutcomes: 4_096,
  movetimeMs: 100,
  // rfc/review-map.md §7: the Analyze line records at most this many plies of the searched PV.
  linePlies: 12,
  timeoutMs: 10_000,
});

/**
 * The application's provider-exchange deployment bounds. The bot opponent is the first
 * learner-facing consumer (rfc/provider-exchange-and-execution.md §9 asks that consumer to publish
 * its defaults): a profile reply needs the Maia page and the guard's Stockfish root table at once,
 * and the two engines are separate processes (each still serializes its own exchanges), so two
 * exchanges may run concurrently. Retention and TTL are the operator values.
 */
export const APPLICATION_PROVIDER_BOUNDS: ProviderExchangeBounds = Object.freeze({
  ...OPERATOR_PROVIDER_BOUNDS,
  maxActive: 2,
  maxQueued: 8,
});

export type EngineMode = "mock" | "maia";

export interface ApplicationOptions {
  readonly databasePath?: string;
  readonly development?: boolean;
  readonly draftPackFile?: string;
  readonly draftPackFiles?: readonly string[];
  /** Development only: extra campaign documents (browser fixtures) beside content/campaigns/. */
  readonly draftCampaignFiles?: readonly string[];
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
  readonly openingCataloguePath?: string;
  /** Longitudinal worker bounds; validated against the §C closed configuration. */
  readonly longitudinalWorker?: LongitudinalWorkerConfig;
  /** Built worker-thread entry override (tests bundle it; production uses the sibling dist file). */
  readonly longitudinalWorkerEntry?: URL;
  /** rfc/skills.md §2.5 valence register; defaults to `content/valence/register.json`. */
  readonly valenceRegisterPath?: string;
  /** rfc/verifiable-runtime-distribution.md §4/§9: embedded build facts and the mounted release index. */
  readonly releaseAbout?: ReleaseAboutOptions;
  /** Structured provider-health transition log (rfc/provider-health-degradation.md §11). */
  readonly providerHealthLog?: (event: ProviderHealthLogEvent) => void;
  /**
   * rfc/storage-backup-recovery.md §6: production opens only an absent/empty or exactly current
   * database; `prepare-start` has already performed any upgrade under the storage lock.
   */
  readonly requirePreparedStorage?: boolean;
  /**
   * rfc/safe-deployment-profiles.md: the compiled transport boundary. When present it owns the
   * session cookie security/name and refuses wrong Host, proxy headers and cross-origin writes
   * before any routing.
   */
  readonly deployment?: DeploymentBoundary;
}

/**
 * The production migration authority for `storage-admin` (rfc/storage-backup-recovery.md §6): the
 * same compiled concept registry, shapes, principles and built-in pack artifacts the HTTP startup
 * would use, so a staged upgrade runs the exact chain — including the concept phase — the server
 * would. Returns a migrator that migrates one staged file to the current version and closes it.
 */
export async function createStorageMigrator(options: Pick<ApplicationOptions, "development" | "draftPackFile" | "draftPackFiles"> = {}): Promise<(path: string) => void> {
  const concepts = installedConceptRegistry();
  const shapes = await ShapeRegistry.loadDefault();
  const principles = await PrincipleRegistry.loadDefault();
  const registry = await PackRegistry.loadDefault({
    development: options.development === true,
    shapes,
    principles,
    concepts,
    ...(options.draftPackFile === undefined ? {} : { draftFile: options.draftPackFile }),
    ...(options.draftPackFiles === undefined ? {} : { draftFiles: options.draftPackFiles }),
  });
  const authority = Object.freeze({
    registry: concepts,
    builtInArtifacts: registry.artifactInventory(),
    validateStoredPack: (document: unknown) => validatePackDocument(document, { shapes, principles, concepts, packs: Object.freeze({ get: (id: string) => registry.get(id)?.document }) }),
  });
  return (path: string) => {
    new SQLiteRunStorage(path, {
      concepts: authority,
      onMigration: (entry) => console.error(`storage migration ${entry.version}: ${entry.name}`),
    }).close();
  };
}

/**
 * Loads and validates the valence register (rfc/skills.md §2.5). An absent file is the empty
 * register; an invalid one fails startup rather than crediting from an unvalidated declaration.
 */
export async function loadValenceRegister(path: string): Promise<ValenceRegister> {
  let text: string;
  try { text = await readFile(path, "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return Object.freeze({ formatVersion: VALENCE_REGISTER_FORMAT, declarations: Object.freeze([]) });
    throw error;
  }
  const value = JSON.parse(text) as unknown;
  const issues = validateValenceRegister(value, (id, version) => PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === id && projection.version === version)?.grounding);
  if (issues.length > 0) throw new TypeError(`VALENCE_REGISTER_INVALID: ${issues.map((issue) => `${issue.code} ${issue.message}`).join("; ")}`);
  return value as ValenceRegister;
}

export type LongitudinalHealth =
  | { readonly status: "ready" | "draining" | "disabled_test" }
  | { readonly status: "degraded"; readonly reason: "worker_start_failed" | "worker_exited" | "worker_protocol_invalid" };

/** The self-hosted appliance startup/upgrade receipt (rfc/longitudinal-store.md §C). */
export interface ApplicationStartupReceipt {
  readonly storageVersion: number;
  readonly databasePath: string;
  readonly longitudinal: LongitudinalReconciliationReceipt;
}

/**
 * The server-side longitudinal store handle. `read` is the sole consumer snapshot read; no HTTP route
 * or client exposes it at landing (rfc/longitudinal-store.md §Scope boundary). Consumer RFCs
 * (player-style, skills, campaign) build on this handle through their own registered operations.
 */
export interface ApplicationLongitudinal {
  health(): LongitudinalHealth;
  /** Closed worker progress totals (claimed/completed/failed/conflicts/renewals); none in disabled_test. */
  progress(): LongitudinalWorkerProgress | undefined;
  read(actorLearnerId: string, query: ParsedLongitudinalReadQuery): LongitudinalReadResult;
}

export interface ChessTabiyaApplication {
  readonly server: ReturnType<typeof createHttpServer>;
  readonly engineMode: EngineMode;
  /**
   * The one shared provider exchange (rfc/provider-exchange-and-execution.md §9): one scheduler
   * over the five operations. Process-local operator/research door only; no HTTP route.
   */
  readonly providers: ProviderTraversalApplication;
  /**
   * The one live provider-health authority (rfc/provider-health-degradation.md): snapshot,
   * operation availability, admission/settlement and release receipts. Bot policy's roster
   * availability consumes it through `BotProviderAvailability`.
   */
  readonly providerHealth: ProviderRegistry;
  readonly startupReceipt: ApplicationStartupReceipt;
  readonly longitudinal: ApplicationLongitudinal;
  close(): Promise<void>;
}

/** Composition mode: production always requires the file-backed worker. */
export type LongitudinalComposition =
  | { readonly kind: "worker" }
  | { readonly kind: "disabled_test" };

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

  return Object.freeze(exactLegalMoves(canonicalFen(position)).map((move) => move.uci));
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
  readonly instanceId = "mock-evidence";

  execute(job: EvidenceJob): Promise<EvidencePayload> {
    // Like the Stockfish executor, an eval reading records its search's first move (`bestMoveUci`);
    // the mock reports the first legal move. Only the explicit Analyze action ever renders it.
    // Each kind carries its own exact value shape (the durable settlement parser is kind-specific).
    const first = legalMoves(job.fen, [])[0];
    const bound = job.depth === undefined ? { requestedMovetimeMs: job.movetime } : { requestedDepth: job.depth };
    const values = job.kind === "wdl"
      ? { engineId: this.instanceId, ...bound, win: 0, draw: 1000, loss: 0 }
      : job.kind === "bestline"
        ? { engineId: this.instanceId, ...bound, movesUci: first === undefined ? [] : [first] }
        : { engineId: this.instanceId, ...bound, centipawns: 0, perspective: "white", ...(first === undefined ? {} : { bestMoveUci: first }) };
    return Promise.resolve(Object.freeze({ kind: job.kind, source: "engine_validated", values: Object.freeze(values) }));
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
    pathname === "/opening-identity" ||
    pathname === "/packs" ||
    pathname.startsWith("/packs/") ||
    pathname === "/shapes" ||
    pathname.startsWith("/shapes/") ||
    pathname === "/principles" ||
    pathname.startsWith("/theory/") ||
    pathname === "/runs" ||
    pathname.startsWith("/runs/") ||
    pathname === "/progress" ||
    pathname.startsWith("/progress/") ||
    pathname === "/repertoires" ||
    pathname.startsWith("/repertoires/") ||
    pathname === "/classrooms" ||
    pathname.startsWith("/classrooms/") ||
    pathname === "/assignments" ||
    pathname.startsWith("/assignments/") ||
    pathname === "/rated-games" ||
    pathname === "/rating" ||
    pathname.startsWith("/rating/") ||
    pathname === "/marks" ||
    pathname === "/learner-profile" ||
    pathname.startsWith("/learner-profile/") ||
    pathname === "/cohorts" ||
    pathname.startsWith("/cohorts/") ||
    pathname === "/campaigns" ||
    pathname.startsWith("/campaigns/") ||
    pathname === "/campaign-rewards" ||
    pathname.startsWith("/campaign-runs/") ||
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

export const DEFAULT_DATABASE_PATH = (): string => resolve(process.cwd(), "data", "chess-tabiya.sqlite");

/**
 * Production composition. The database is always file-backed (default `data/chess-tabiya.sqlite`);
 * startup reconciles longitudinal jobs and awaits the worker's ready message before returning, so
 * `main.ts` listens only after the semantic executor is live.
 */
function unready(): Response {
  return new Response(`{"status":"unready"}`, { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export async function createApplication(
  options: ApplicationOptions = {},
): Promise<ChessTabiyaApplication> {
  return composeApplication(options, { kind: "worker" });
}

/** @internal Shared by `createApplication` and the test-only in-memory helper; never by main.ts. */
export async function composeApplication(
  options: ApplicationOptions,
  composition: LongitudinalComposition,
): Promise<ChessTabiyaApplication> {
  assertEvidenceManifest();
  // A mounted release index that fails the shared v1 parser or the build/image join refuses startup
  // before any storage opens.
  const about = loadReleaseAbout({ ...(options.releaseAbout ?? {}), engineMode: options.engineMode ?? "mock" });
  const workerConfig = validateLongitudinalWorkerConfig(options.longitudinalWorker ?? LONGITUDINAL_WORKER_DEFAULTS);
  let databasePath: string;
  if (composition.kind === "worker") {
    databasePath = fileBackedDatabaseIdentity(options.databasePath ?? DEFAULT_DATABASE_PATH()).absolutePath;
    await mkdir(dirname(databasePath), { recursive: true });
  } else {
    if (options.databasePath !== undefined && options.databasePath !== ":memory:") {
      throw new TypeError("The disabled_test composition is in-memory only");
    }
    databasePath = ":memory:";
  }
  // rfc/concept-registry.md §4 startup order: every authority the concept phase needs compiles
  // first (concept registry, shapes, principles, built-in packs); only then does the storage
  // coordinator open SQLite, finish the structural migrations and run the concept phase in its own
  // transaction. A refused startup closes the database and rejects before any server exists.
  const concepts = installedConceptRegistry();
  const shapes = await ShapeRegistry.loadDefault();
  const principles = await PrincipleRegistry.loadDefault();
  const registry = await PackRegistry.loadDefault({
    development: options.development === true,
    shapes,
    principles,
    concepts,
    ...(options.draftPackFile === undefined
      ? {}
      : { draftFile: options.draftPackFile }),
    ...(options.draftPackFiles === undefined
      ? {}
      : { draftFiles: options.draftPackFiles }),
  });
  if (options.deployment !== undefined && options.cookieSecure !== undefined && options.cookieSecure !== options.deployment.secureCookie) {
    throw new TypeError("PROFILE_HYBRID_REFUSED: cookieSecure contradicts the deployment profile");
  }
  const storage = new SQLiteRunStorage(databasePath, {
    ...(options.requirePreparedStorage === true ? { requirePreparedStorage: true } : {}),
    concepts: Object.freeze({
      registry: concepts,
      builtInArtifacts: registry.artifactInventory(),
      validateStoredPack: (document: unknown) => validatePackDocument(document, { shapes, principles, concepts, packs: Object.freeze({ get: (id: string) => registry.get(id)?.document }) }),
    }),
  });
  try {
    return await composeServices(options, composition, { storage, shapes, principles, registry, workerConfig, about });
  } catch (error) {
    // Nothing composed after the coordinator may leave the database open ([[D2965]]).
    try { storage.close(); } catch { /* preserve the primary failure */ }
    throw error;
  }
}

async function composeServices(
  options: ApplicationOptions,
  composition: LongitudinalComposition,
  authorities: {
    readonly storage: SQLiteRunStorage;
    readonly shapes: ShapeRegistry;
    readonly principles: PrincipleRegistry;
    readonly registry: PackRegistry;
    readonly workerConfig: ReturnType<typeof validateLongitudinalWorkerConfig>;
    readonly about: ReturnType<typeof loadReleaseAbout>;
  },
): Promise<ChessTabiyaApplication> {
  const { storage, shapes, principles, registry, workerConfig, about } = authorities;
  const shapeStudio = new ShapeStudio(storage, shapes, () => registry.list().map((summary) => ({
    document: registry.required(summary.id).document,
    title: summary.title,
  })));
  await shapeStudio.hydrate();
  const studio = new PackStudio(storage, registry, shapes, principles);
  studio.hydrate();
  const engineMode = options.engineMode ?? "mock";
  let supervisor: EngineSupervisor | undefined;
  let selector: OpponentSelector;
  let capabilities: EngineCapabilities;
  let evidenceExecutor: EvidenceExecutor;
  // rfc/provider-health-degradation.md §1: configuration answers only "exists, with which
  // implementation". Built-in Lichess clients integrate health themselves; anything supplied from
  // outside (fixtures, test doubles) is labelled `local_fixture` and wrapped by an adapter.
  const configured: ProviderInstanceConfiguration[] = [];
  const stockfishCommand = options.stockfishCommand ?? "stockfish";
  const maiaHost = options.maiaHost ?? "maia";
  const maiaPort = options.maiaPort ?? 7000;
  if (engineMode === "maia") {
    configured.push(
      { instanceId: "stockfish-play", implementation: "uci_sidecar", endpoint: stockfishCommand, identity: "stockfish-play", options: { ...stockfishPlaySpec({ command: stockfishCommand }).options } },
      { instanceId: "stockfish-analysis", implementation: "uci_sidecar", endpoint: stockfishCommand, identity: "stockfish-analysis", options: { ...stockfishAnalysisSpec(stockfishCommand).options } },
      { instanceId: "maia-inference", implementation: "uci_sidecar", endpoint: `${maiaHost}:${maiaPort}`, identity: MAIA3_MODEL_ID },
    );
  } else {
    configured.push(
      { instanceId: "stockfish-play", implementation: "local_fixture", endpoint: "mock-opponent", identity: "deterministic mock opponent" },
      { instanceId: "stockfish-analysis", implementation: "local_fixture", endpoint: "mock-evidence", identity: "deterministic mock evidence" },
      { instanceId: "maia-inference", implementation: "local_fixture", endpoint: "mock-opponent", identity: "deterministic mock opponent" },
    );
  }
  const suppliedTablebase = options.tablebaseSource === null ? undefined : options.tablebaseSource;
  const builtInTablebase = options.tablebaseSource === undefined && engineMode === "maia";
  const fixtureTablebase = suppliedTablebase ?? (options.tablebaseSource === undefined && engineMode === "mock" ? new FixtureTablebaseSource() : undefined);
  const tablebaseConfigured = builtInTablebase || (fixtureTablebase !== undefined && !(fixtureTablebase instanceof FixtureTablebaseSource && !fixtureTablebase.configured));
  if (tablebaseConfigured) {
    configured.push(builtInTablebase || fixtureTablebase instanceof LichessTablebaseSource
      ? { instanceId: "tablebase-primary", implementation: "lichess_http", endpoint: "https://tablebase.lichess.org/standard", identity: "lichess-syzygy-7man" }
      : { instanceId: "tablebase-primary", implementation: "local_fixture", endpoint: "fixture-tablebase", identity: "fixture tablebase" });
  }
  const builtInCorpus = options.corpusSource === undefined && engineMode === "maia" && options.corpusToken !== undefined;
  const suppliedCorpus = options.corpusSource ?? (engineMode === "mock" ? new FixtureCorpusSource() : undefined);
  if (builtInCorpus || suppliedCorpus !== undefined) {
    configured.push(builtInCorpus || suppliedCorpus instanceof LichessCorpusSource
      ? { instanceId: "explorer-primary", implementation: "lichess_http", endpoint: "https://explorer.lichess.ovh/lichess", identity: "lichess-opening-explorer" }
      : { instanceId: "explorer-primary", implementation: "local_fixture", endpoint: "fixture-explorer", identity: "fixture explorer" });
  }
  if (options.voiceProvider !== undefined || options.reasoningReviewProvider !== undefined) {
    const voice = options.voiceProvider ?? options.reasoningReviewProvider;
    configured.push(voice instanceof ExternalHttpVoiceProvider
      ? { instanceId: "external-voice", implementation: "external_http", endpoint: "external-voice", identity: options.voicePersona ?? "default persona" }
      : { instanceId: "external-voice", implementation: "local_fixture", endpoint: "fixture-voice", identity: "fixture voice" });
  }
  if (options.ttsProvider !== undefined) {
    configured.push(options.ttsProvider instanceof ExternalHttpTtsProvider
      ? { instanceId: "external-tts", implementation: "external_http", endpoint: "external-tts", identity: "external tts" }
      : { instanceId: "external-tts", implementation: "local_fixture", endpoint: "fixture-tts", identity: "fixture tts" });
  }
  let exchangeArtifact: (instanceId: string) => boolean = () => true;
  const providerHealth = new ProviderRegistry({
    configured,
    exchangeArtifact: (instanceId) => exchangeArtifact(instanceId),
    ...(options.providerHealthLog === undefined ? {} : { log: options.providerHealthLog }),
  });
  const corpusSource = builtInCorpus
    ? new LichessCorpusSource({ token: options.corpusToken!, health: providerHealth })
    : suppliedCorpus === undefined ? undefined : healthReportedCorpus(suppliedCorpus, providerHealth);
  const tablebaseSource = !tablebaseConfigured
    ? undefined
    : builtInTablebase
      ? new LichessTablebaseSource({ health: providerHealth })
      : healthReportedTablebase(fixtureTablebase!, providerHealth);
  const voiceProvider = options.voiceProvider === undefined ? undefined : healthReportedVoice(options.voiceProvider, providerHealth);
  const reasoningReviewProvider = options.reasoningReviewProvider === undefined ? undefined : healthReportedReasoningReview(options.reasoningReviewProvider, providerHealth);
  const ttsProvider = options.ttsProvider === undefined ? undefined : healthReportedTts(options.ttsProvider, providerHealth);
  const openingCatalogue = await loadOpeningCatalogue(options.openingCataloguePath ?? join(process.cwd(), "apps", "server", "artifacts", "runtime-opening-catalogue.json"));
  // rfc/bot-policy.md §4.3 / D3031: profile availability is the provider-health authority's
  // snapshot and release receipt; every shared-exchange outcome settles into that registry.
  const botAvailability = new BotProviderAvailability(providerHealth);

  if (engineMode === "maia") {
    const stockfish = stockfishCommand;
    const analysisSpec = stockfishAnalysisSpec(stockfish);
    const maiaProbe = maiaContainerProbe(maiaHost, maiaPort);
    const engines = new EngineSupervisor([
      maiaNetworkSpec(maiaHost, maiaPort),
      stockfishPlaySpec({ command: stockfish }),
      analysisSpec,
    ], {
      // Provider exchanges need the launched artifact of each generation: the hashed analysis
      // binary, and the running Maia container's OCI identity reported by its sidecar.
      artifactProbe: (spec) => spec.id === analysisSpec.id ? binaryArtifactProbe(spec) : spec.id === "maia-5m" ? maiaProbe(spec) : Promise.resolve(null),
      onLifecycle: providerHealth.engineLifecycleSink({ "maia-5m": "maia-inference", "stockfish-play": "stockfish-play", "stockfish-analysis": "stockfish-analysis" }),
    });
    supervisor = engines;
    exchangeArtifact = (instanceId) => instanceId !== "maia-inference" || engines.artifact("maia-5m")?.kind === "container";
    // An optional engine that cannot start leaves its instance unavailable; it never blocks startup.
    await Promise.allSettled([engines.start("maia-5m"), engines.start("stockfish-play"), engines.start("stockfish-analysis")]);
    assertAdvertisedCapabilityDispositions([
      engines.health("stockfish-play"),
      engines.health("stockfish-analysis"),
      engines.health("maia-5m"),
    ]);
    selector = new OpponentSelector(engines, { health: providerHealth, ...(tablebaseSource === undefined ? {} : { tablebaseSource }) });
    capabilities = new EngineCapabilities(engines, [
      "stockfish-analysis",
      "maia-5m",
    ], { health: providerHealth, openingCatalogue, botAvailability: () => botAvailability.snapshot() });
    evidenceExecutor = new StockfishEvidenceExecutor(
      supervisor,
      analysisSpec.id,
      Number(analysisSpec.options?.MultiPV),
    );
  } else {
    const mock = new MockEngineClient();
    await mock.start();
    // The local mock processes complete their handshake in-process; they are `local_fixture`.
    providerHealth.recordHandshake("maia-inference");
    providerHealth.recordHandshake("stockfish-play");
    providerHealth.recordHandshake("stockfish-analysis");
    selector = new OpponentSelector(mock, {
      maiaEngineId: "mock-opponent",
      strongEngineId: "mock-opponent",
      health: providerHealth,
      ...(tablebaseSource === undefined ? {} : { tablebaseSource }),
    });
    capabilities = new EngineCapabilities(mock, ["mock-opponent"], {
      health: providerHealth, openingCatalogue, botAvailability: () => botAvailability.snapshot(),
    });
    evidenceExecutor = new MockEvidenceExecutor();
  }

  const providerFetch = (url: string, init: { readonly signal: AbortSignal; readonly headers: Readonly<Record<string, string>> }): Promise<Response> => fetch(url, { signal: init.signal, headers: { ...init.headers } });
  // Mock-engine deployments run the one real provider exchange over a labelled mock analysis engine.
  const providerEngines = supervisor ?? new MockProviderEngineClient();
  const providers = composeProviderTraversalApplication({
    engines: providerEngines,
    tablebaseFetch: builtInTablebase || fixtureTablebase instanceof LichessTablebaseSource ? providerFetch : null,
    explorerFetch: engineMode === "maia" && options.corpusToken !== undefined ? providerFetch : null,
    explorerToken: options.corpusToken ?? null,
    bounds: APPLICATION_PROVIDER_BOUNDS,
  });
  // rfc/bot-policy.md §4.1/§4.5: the opponent-ply operation's provider half. It shares the ONE
  // scheduler (no bot-only fetch, queue or cache) and feeds every outcome into the availability
  // observer; the startup probe gives the roster a first observation before any game.
  const botOpponent = new BotOpponentProviders({
    scheduler: providers.scheduler,
    stockfishEngine: async () => {
      const identity = await providerEngines.start("stockfish-analysis");
      return Object.freeze({ id: identity.id, version: identity.version });
    },
    availability: botAvailability,
  });
  const botProbe = botOpponent.probe().catch(() => undefined);
  const evidenceQueue = new EvidenceJobQueue(evidenceExecutor, {
    maxConcurrency: 2,
    retry: APPLICATION_EVIDENCE_RETRY_POLICY,
    ...(tablebaseSource === undefined ? {} : { tablebaseSource }),
  });
  // rfc/review-evidence-compiler.md §4.1: the one application-lifetime Review coordinator. It shares
  // the application's single provider scheduler and never enqueues on the evidence queue. Explicit
  // 1.0 profile bounds; no implicit unbounded default exists.
  const reviewEvidence = new ReviewEvidenceCoordinator({
    scheduler: providers.scheduler,
    requestedEngine: async () => {
      const identity = await providerEngines.start("stockfish-analysis");
      return Object.freeze({ id: identity.id, version: identity.version });
    },
    storage,
    attempts: new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: REVIEW_EVIDENCE_PROFILE.maxTerminalAttemptOutcomes, maxAttemptsPerRequest: REVIEW_EVIDENCE_PROFILE.maxAttemptsPerRequest }),
    ...REVIEW_EVIDENCE_PROFILE,
  });
  const service = new RunService(storage, {
    evidenceQueue,
    reviewEvidence,
    packRegistry: registry,
    progressStorage: storage,
    opponentSelector: selector,
    shapeRegistry: shapes,
    ...(tablebaseSource === undefined ? {} : { tablebaseSource }),
    botOpponent,
    botAvailability: () => botAvailability.snapshot(),
  });
  const identity = new IdentityService(storage, {
    cookieSecure: options.deployment?.secureCookie ?? options.cookieSecure ?? true,
  });
  const live = new LiveSessionService(storage, { runService: service });
  const repertoires = new RepertoireService(storage, service, corpusSource);
  const classrooms = new ClassroomService(storage, registry);
  let longitudinalStatus: () => string = () => "degraded";
  const conceptReferenceCache = new Map<string, ReturnType<typeof packConceptReferenceEvidence>>();
  const learnerProfile = new LearnerProfileService({
    storage,
    longitudinalStatus: () => longitudinalStatus(),
    openingCatalogue,
    packs: () => registry.list().map((summary) => Object.freeze({ id: summary.id, title: summary.title, startFen: registry.required(summary.id).document.start.fen })),
    shapes: () => shapes.list().map((summary) => Object.freeze({ id: summary.id, name: summary.name })),
    conceptReferences: () => {
      // rfc/concept-registry.md §6: a pack whose references cannot be minted (an unregistered id in a
      // stored pre-registry pack, or a digest that does not match its document) abstains by name.
      const abstained: string[] = [];
      const references = registry.list().flatMap((summary) => {
        const record = registry.required(summary.id);
        // Complete documents are immutable per digest, so their reference population is too.
        let minted = conceptReferenceCache.get(record.digest);
        if (minted === undefined) {
          try {
            minted = packConceptReferenceEvidence({ pack: record.document, packDigest: record.digest, registry: registry.concepts });
          } catch {
            abstained.push(summary.id);
            return [];
          }
          conceptReferenceCache.set(record.digest, minted);
        }
        return minted;
      });
      return Object.freeze({ registry: registry.concepts, references: Object.freeze(references), abstainedPacks: Object.freeze(abstained.sort()) });
    },
    ratedResults: (learnerId) => new Map(storage.ratedGames(learnerId).flatMap((game) => game.result === null ? [] : [[game.runId, game.result] as const])),
    valenceRegister: await loadValenceRegister(options.valenceRegisterPath ?? join(process.cwd(), "content", "valence", "register.json")),
  });
  // rfc/campaign-core.md §6.0/§7.1: the installed campaign registry (content/campaigns/ plus, in
  // development only, explicit fixture documents) and the ONE campaign service.
  if (options.draftCampaignFiles !== undefined && options.development !== true) throw new TypeError("Draft campaign files may only be loaded in development mode");
  const campaignRegistry = await CampaignRegistry.loadDefault(
    Object.freeze({ get: (id: string) => registry.get(id)?.document }),
    undefined,
    options.draftCampaignFiles ?? [],
  );
  const campaigns = new CampaignService({
    storage,
    registry: campaignRegistry,
    runs: service,
    packs: registry,
    botStartable: (entry) => botProfileIsStartable(botProfileStartability(entry, botAvailability.snapshot())),
    policyConfig: async (pack): Promise<PolicyConfig> => {
      const engines = (await capabilities.get()).engines;
      const authored = pack?.document.opponentPolicy as { readonly seedMode?: unknown } | undefined;
      const seedMode = authored?.seedMode === "per_run" || authored?.seedMode === "per_branch" ? authored.seedMode : "fixed";
      return Object.freeze({
        seedMode,
        locus: Object.freeze({
          executedAt: "server" as const,
          engineIds: Object.freeze(engines.map((engine) => ({ id: engine.id, version: engine.version }))),
          modelIds: Object.freeze(engines.flatMap((engine) => engine.modelId === undefined ? [] : [{ id: engine.modelId, version: engine.version }])),
        }),
      }) as PolicyConfig;
    },
  });
  const api = createRestHandler(service, selector, capabilities, identity, studio, live, shapes, shapeStudio, voiceProvider, options.voicePersona, corpusSource, repertoires, ttsProvider, reasoningReviewProvider, classrooms, openingCatalogue, principles, learnerProfile, new TheoryLibrary({ packs: registry, shapes, principles, openingCatalogue }), campaigns);
  const staticDirectory =
    options.staticDirectory ?? join(process.cwd(), "apps", "web", "dist");
  let healthProbe: () => Response = () => Response.json({ status: "degraded", engineMode, longitudinal: { status: "degraded", reason: "worker_start_failed" } }, { status: 503 });
  let readyProbe: () => Response = () => unready();
  const deployment = options.deployment;
  const handler: RestHandler = async (request) => {
    const url = new URL(request.url);
    if (deployment !== undefined) {
      const refused = deploymentRefusal(deployment, request);
      if (refused !== undefined) return refused;
    }
    if (url.pathname === "/healthz") {
      return healthProbe();
    }
    if (url.pathname === "/readyz") {
      return readyProbe();
    }
    const aboutResponse = about.handle(request);
    if (aboutResponse !== undefined) return aboutResponse;
    return isApiPath(url.pathname)
      ? api(request)
      : staticResponse(request, staticDirectory);
  };
  const server = createHttpServer(handler);
  // Reconcile before the worker starts: queue untouched old native/imported/shared runs, advance
  // lower high-water marks and replace wrong revisions. No semantic work runs here.
  const reconciliation = storage.reconcileLongitudinalJobs();
  let worker: LongitudinalProjectionWorker | undefined;
  if (composition.kind === "worker") {
    try {
      worker = await LongitudinalProjectionWorker.start({
        database: fileBackedDatabaseIdentity(storage.databasePath),
        storageVersion: STORAGE_VERSION,
        config: workerConfig,
        ...(options.longitudinalWorkerEntry === undefined ? {} : { threadUrl: options.longitudinalWorkerEntry }),
      });
    } catch (error) {
      await evidenceQueue.close();
      await botProbe;
      storage.close();
      await supervisor?.shutdown();
      throw error;
    }
    const started = worker;
    storage.setLongitudinalWakeListener(() => started.wake());
  }
  let draining = false;
  const longitudinalHealth = (): LongitudinalHealth => {
    if (worker === undefined) return { status: "disabled_test" };
    if (draining) return { status: "draining" };
    const status: LongitudinalWorkerStatus = worker.status();
    return status;
  };
  longitudinalStatus = () => longitudinalHealth().status;
  healthProbe = () => {
    const longitudinal = longitudinalHealth();
    const ok = longitudinal.status === "ready" || longitudinal.status === "disabled_test";
    // Process liveness: an absent or failed OPTIONAL provider is reported but never fails the probe
    // (rfc/provider-health-degradation.md §9). The body reads the registry; it probes nothing.
    const providers = providerHealth.snapshot().providers.map((row) => Object.freeze({
      instanceId: row.instanceId,
      state: row.state,
      ...(row.state === "unavailable" || row.state === "degraded_cached_only" ? { reason: row.reason } : {}),
    }));
    return Response.json({ status: ok ? "ok" : "degraded", engineMode, longitudinal, providers }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
  };
  // rfc/storage-backup-recovery.md §6 / [[D2728]]: readiness is the live route observing the live
  // storage connection — its exact current version plus one representative read — and a live
  // semantic executor. The canonical body is the only one a rehearsal or proxy accepts.
  readyProbe = () => {
    const longitudinal = longitudinalHealth();
    if (draining || (longitudinal.status !== "ready" && longitudinal.status !== "disabled_test")) return unready();
    let probe: ReturnType<SQLiteRunStorage["readinessProbe"]>;
    try { probe = storage.readinessProbe(); } catch { return unready(); }
    if (probe.storageVersion !== STORAGE_VERSION) return unready();
    return new Response(`{"representativeData":"${probe.representativeData}","status":"ready","storageVersion":${probe.storageVersion}}`, {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  };
  const startupReceipt: ApplicationStartupReceipt = Object.freeze({
    storageVersion: STORAGE_VERSION,
    databasePath: storage.databasePath,
    longitudinal: reconciliation,
  });
  return Object.freeze({
    server,
    engineMode,
    providers,
    providerHealth,
    startupReceipt,
    longitudinal: Object.freeze({
      health: longitudinalHealth,
      progress: () => worker?.totals(),
      read: (actorLearnerId: string, query: ParsedLongitudinalReadQuery) => storage.readLongitudinalSnapshot(actorLearnerId, query),
    }),
    async close() {
      draining = true;
      providerHealth.shutdown();
      await new Promise<void>((resolveClose, reject) => {
        if (!server.listening) { resolveClose(); return; }
        server.close((error) => (error === undefined ? resolveClose() : reject(error)));
      });
      storage.setLongitudinalWakeListener(undefined);
      await worker?.drain();
      // In-flight evidence leases return to retry_wait with a shutdown basis; nothing is lost.
      await evidenceQueue.close();
      await botProbe;
      await supervisor?.shutdown();
      storage.close();
    },
  });
}
