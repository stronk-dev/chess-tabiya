import {
  applyObjectiveEvidenceProposal,
  appendOpponentPly,
  appendEvents,
  branchPath,
  assertActiveWriter,
  attachEvidence,
  commitMove,
  compareBranches,
  createRun,
  exportPackRunPgn,
  exportPgn,
  fork,
  feedbackDeliveryOpen,
  feedbackDisclosed,
  groupsFromEvents,
  historyFrom,
  canonicalRunStart,
  digestSessionSource,
  deriveWorkflowContext,
  exactMoveIdentity,
  isPackSession,
  lineMembership,
  MARK_BRUSHES,
  branchDecidedness,
  MAX_COMPARISON_BRANCHES,
  matchKeyPoints,
  normalizeInboundMove,
  opponentMovesFromEvents,
  permittedAssistance,
  reviewingGrant,
  revealFeedback,
  isMachineEvidenceRef,
  rewind,
  rewindToCheckpoint,
  storyMoments,
  reviewStoryTitle,
  trajectoryPolicyAt,
  RATED_OPPONENT_CALIBRATION,
  RATING_DISCLOSURES,
  publishRating,
  ratedOpponentRung,
  shapeFirings,
  type BranchComparison,
  type Decidedness,
  type BranchGroup,
  type AppendOpponentPlyOptions,
  type CommitMoveOptions,
  type CreateRunInput,
  type DrillRun,
  type DrillRunEvent,
  type EvidenceKind,
  type ForkOptions,
  type MutationResult,
  type OpponentSelection,
  type GroupResistance,
  type GroupSource,
  type RunOpponentMode,
  type RunOpponentPolicy,
  type PositionOpponentPolicy,
  type PublishedBandValue,
  type ReasoningTranscript,
  type RunMark,
  RuntimeError,
} from "@chess-tabiya/runtime";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { canonicalizeJson, normalizeShapeReferences } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";

import {
  EvidenceJobQueue,
  type EvidenceJob,
  type EvidencePage,
} from "./evidence-queue.js";
import { isRunOpponentMode } from "./capabilities.js";
import {
  projectAuthoredFeedback,
  type AuthoredFeedbackPage,
} from "./authored-feedback.js";
import { ServerError } from "./errors.js";
import {
  publicEvents,
  publicNodes,
} from "./feedback-policy.js";
import { expandPackAuthoredBoundary, orchestratePackMove, orchestratePackStart, planSignatureResolver } from "./pack-orchestrator.js";
import { applyRecordedEngineGuard, applyRulesGuard } from "./guard.js";
import {
  PackRegistry,
  type PackRecord,
  type PackSummary,
} from "./pack-registry.js";
import type { ImportedGameRecord, PublicTokenRecord, RepertoireGapRunRecord, RunDerivation, RunStorage, RunSummary, StoredRun } from "./storage.js";
import type { ProgressStorage, ScheduleRow, StoredAttempt } from "./storage.js";
import type { RatingStorage, RatedGameTerminalReason } from "./storage.js";
import type { ClassroomStorage } from "./storage.js";
import {
  projectAttempts,
  rootKey as progressRootKey,
  type AttemptOriginInput,
} from "./progress.js";
import { DEFAULT_STRONG_ENGINE_PROFILE } from "./strong-engine.js";
import { OpponentSelector, type SelectMoveRequest } from "./opponent-selector.js";
import type { TablebaseSource } from "./tablebase.js";
import { learnerCategory } from "./sourcing/tablebase-category.js";
import { countFenPieces } from "./sourcing/chess-facts.js";
import {
  mayManageGrants,
  mayWrite,
  requireRead,
  requireWrite,
  type Principal,
} from "./authorization.js";
import type { LeaseHolder, RunGrant, RunRole } from "./storage.js";
import { parsePgnMainline, PgnImportError } from "./pgn-import.js";
import { resolveImportSource, type ImportSource } from "./import-source.js";
import type { DeletionPreviewV1 } from "./account-data.js";

function ratingGroup(value: PublishedBandValue): string | number {
  if (value.kind === "below") return `below-${value.band}`;
  if (value.kind === "above") return `above-${value.band}`;
  return 1000 + Math.floor((value.value - 1000) / 150) * 150;
}
import type { ShapeRegistry } from "./shape-registry.js";
import {
  NO_PREVIOUS_REASONING,
  REASONING_HONESTY,
  keyPointViews,
  occurrenceView,
  reasoningDeliveryOpen,
  reasoningEvents,
  type ReasoningPage,
  type ReasoningPreviousView,
} from "./reasoning.js";

export interface RunViewer {
  readonly role: RunRole;
  readonly mayWrite: boolean;
  readonly holdsLease: boolean;
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
  readonly seatedInContest: boolean;
  readonly reviewing: boolean;
}

export interface RunGraph {
  readonly id: string;
  readonly viewer: RunViewer;
  readonly nodes: DrillRun["nodes"];
  readonly branches: DrillRun["branches"];
  readonly activeCursor: DrillRun["activeCursor"];
}

export interface EventsPage {
  readonly events: readonly DrillRunEvent[];
  readonly nextSeq: number;
  readonly withheld?: true;
}

export interface GuidanceAccess {
  readonly run: DrillRun;
  readonly node: DrillRun["nodes"][number];
  readonly role: RunRole;
  readonly pack?: PackRecord;
  readonly historyUci: readonly string[];
  readonly branchSeed: number;
  readonly seatedInContest: boolean;
  readonly reviewing: boolean;
  readonly workflowContext: import("@chess-tabiya/runtime").WorkflowContextId;
}

export interface DistillationAccess {
  readonly run: DrillRun;
  readonly pack?: PackRecord;
}

export interface CreateGroupInput {
  readonly source: GroupSource;
  readonly resistance?: GroupResistance;
  readonly candidates?: readonly string[];
  readonly size?: number;
  readonly at?: string;
}

export interface CreateGroupResult extends MutationResult {
  readonly group: BranchGroup;
  readonly comparison: BranchComparison;
}

export interface GroupReplyResult {
  readonly selection: OpponentSelection;
  readonly reusedFromNodeId: string | null;
}

function comparisonWithoutEngineFeedback(
  comparison: BranchComparison,
): BranchComparison {
  const publicTimeline = (
    entries: readonly import("@chess-tabiya/runtime").ObjectiveTimelineEntry[],
  ) =>
    Object.freeze(
      entries.map((entry) =>
        Object.freeze({
          ...entry,
          evidenceRefs: Object.freeze(
            entry.evidenceRefs.filter(
              (reference) => !isMachineEvidenceRef(reference),
            ),
          ),
        }),
      ),
    );
  return Object.freeze({
    ...comparison,
    objectiveTimelines: Object.freeze(Object.fromEntries(
      Object.entries(comparison.objectiveTimelines).map(([id, entries]) => [id, publicTimeline(entries)]),
    )),
    evidence: Object.freeze(Object.fromEntries(
      comparison.columns.map((column) => [column.branchId, Object.freeze([])]),
    )),
    lines: Object.freeze(Object.fromEntries(
      comparison.columns.map((column) => [column.branchId, Object.freeze([])]),
    )),
  });
}

function findSpineNode(
  nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[],
  id: string,
): import("@chess-tabiya/schema/drill-pack").SpineNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findSpineNode(node.children, id);
    if (child !== undefined) return child;
  }
  return undefined;
}

function learnerToMove(run: DrillRun, node: DrillRun["nodes"][number]): boolean {
  const turn = node.fen.split(" ")[1];
  return (turn === "w" ? "white" : "black") === run.start.side;
}

function terminalPosition(fen: string): boolean {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  // A bare FEN can carry the fifty-move counter, but repetition is path state.
  return position.isEnd() || position.halfmoves >= 100;
}

function ratedTerminalReason(run: DrillRun, nodeId: string): RatedGameTerminalReason {
  const node = run.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) throw new ServerError("STORAGE_FAILURE", "Rated outcome references a missing node");
  const position = Chess.fromSetup(parseFen(node.fen).unwrap()).unwrap();
  if (position.isCheckmate()) return "checkmate";
  if (position.isStalemate()) return "stalemate";
  if (position.isInsufficientMaterial()) return "insufficient_material";
  if (position.halfmoves >= 100) return "fifty_move";
  return "threefold";
}

function seedMoveSan(fen: string, uci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = parseUci(uci);
  if (move === undefined || !position.isLegal(move)) {
    throw new RuntimeError("ILLEGAL_MOVE", `Illegal group seed: ${uci}`);
  }
  return makeSan(position, move);
}

export function sameEngine(
  left: OpponentSelection["engine"],
  right: OpponentSelection["engine"],
): boolean {
  return left.id === right.id && left.name === right.name && left.version === right.version &&
    left.modelId === right.modelId && left.containerDigest === right.containerDigest &&
    left.seedHonored === right.seedHonored && left.eloApplied === right.eloApplied;
}

function compatibleAppliedMode(
  requested: RunOpponentMode,
  applied: OpponentSelection["policyModeApplied"],
): boolean {
  return applied === requested ||
    (requested === "theory_strict" && applied === "human_common");
}

export type RewindTarget =
  | { readonly nodeId: string; readonly branchId?: string; readonly checkpointId?: never }
  | { readonly checkpointId: string; readonly nodeId?: never; readonly branchId?: never };

export interface CreateRunRequest {
  readonly id: string;
  readonly session:
    | { readonly kind: "pack"; readonly packId: string; readonly packDigest?: string }
    | {
        readonly kind: "position";
        readonly start: { readonly fen: string; readonly side: "white" | "black" };
        readonly feedbackPolicy: "attempt_end";
        readonly opponentPolicy: {
          readonly mode: "human_common" | "strong_engine";
          readonly targetElo?: number;
          readonly temperature?: number;
          readonly topP?: number;
        };
      };
  readonly policyConfig: CreateRunInput["policyConfig"];
  readonly seed: number;
  readonly createdAt?: string;
  readonly intent?: {
    readonly origin: "fresh" | "duplicate";
    readonly scheduleId?: string;
    readonly derivedFromRunId?: string;
  };
}

export interface ImportGameRequest {
  readonly id: string;
  readonly side: "white" | "black";
  readonly opponentPolicy: PositionOpponentPolicy;
  readonly policyConfig: CreateRunInput["policyConfig"];
  readonly seed: number;
  readonly source: ImportSource;
  readonly createdAt?: string;
}

export interface CreateRatedGameRequest {
  readonly id: string;
  readonly start: { readonly fen: string };
  readonly side: "white" | "black";
  readonly band: number;
  readonly policyConfig: CreateRunInput["policyConfig"];
  readonly seed: number;
  readonly createdAt?: string;
}

export class RunService {
  readonly #storage: RunStorage;
  readonly #evidenceQueue: EvidenceJobQueue | undefined;
  readonly #packRegistry: PackRegistry | undefined;
  readonly #evidenceMovetimeMs: number;
  readonly #progress: ProgressStorage | undefined;
  readonly #rating: RatingStorage | undefined;
  readonly #classrooms: ClassroomStorage | undefined;
  readonly #opponentSelector: OpponentSelector | undefined;
  readonly #importFetch: typeof fetch;
  readonly #shapes: ShapeRegistry | undefined;
  readonly #tablebase: TablebaseSource | undefined;
  readonly #simulations = new Map<string, {
    readonly runId: string;
    readonly sourceNodeId: string;
    readonly scratch: DrillRun;
    readonly branchIds: readonly string[];
    readonly moves: readonly (readonly string[])[];
    readonly createdAt: number;
  }>();

  constructor(
    storage: RunStorage,
    options: {
      readonly evidenceQueue?: EvidenceJobQueue;
      readonly packRegistry?: PackRegistry;
      readonly evidenceMovetimeMs?: number;
      readonly progressStorage?: ProgressStorage;
      readonly ratingStorage?: RatingStorage;
      readonly classroomStorage?: ClassroomStorage;
      readonly opponentSelector?: OpponentSelector;
      readonly importFetch?: typeof fetch;
      readonly shapeRegistry?: ShapeRegistry;
      readonly tablebaseSource?: TablebaseSource;
    } = {},
  ) {
    this.#storage = storage;
    this.#evidenceQueue = options.evidenceQueue;
    this.#packRegistry = options.packRegistry;
    this.#progress = options.progressStorage;
    this.#rating = options.ratingStorage ?? (
      "createRatedRun" in storage && "ratedGame" in storage
        ? storage as RunStorage & RatingStorage
        : undefined
    );
    this.#classrooms = options.classroomStorage ?? (
      "classroomMember" in storage && "classroom" in storage
        ? storage as RunStorage & ClassroomStorage
        : undefined
    );
    this.#opponentSelector = options.opponentSelector;
    this.#importFetch = options.importFetch ?? fetch;
    this.#shapes = options.shapeRegistry;
    this.#tablebase = options.tablebaseSource;
    this.#evidenceMovetimeMs =
      options.evidenceMovetimeMs ?? DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs;
    if (!Number.isSafeInteger(this.#evidenceMovetimeMs) || this.#evidenceMovetimeMs < 1) {
      throw new TypeError("Evidence movetime must be a positive safe integer");
    }
  }

  validateOpponentPolicy(policy: Pick<import("@chess-tabiya/runtime").RunOpponentPolicy, "mode" | "targetElo">): void {
    this.#opponentSelector?.validatePolicy(policy);
  }

  marks(runId: string, principal: Principal): readonly RunMark[] {
    requireRead(this.#storage, runId, principal);
    return Object.freeze(this.#storage.runMarks(runId, principal.learnerId).map(({ scope, scopeKey, brush, orig, dest, at }) =>
      Object.freeze({ scope, scopeKey, brush, orig, ...(dest === undefined ? {} : { dest }), at })));
  }

  replaceMarks(runId: string, principal: Principal, input: {
    readonly nodeId: string;
    readonly branchId: string;
    readonly scope: "position" | "branch";
    readonly shapes: readonly Pick<RunMark, "brush" | "orig" | "dest">[];
  }): readonly RunMark[] {
    const { stored } = requireRead(this.#storage, runId, principal);
    const node = stored.run.nodes.find((candidate) => candidate.id === input.nodeId);
    if (node === undefined) throw new ServerError("INVALID_REQUEST", "Unknown mark node");
    if (input.shapes.length > 64) throw new ServerError("INVALID_REQUEST", "A position may hold at most 64 marks");
    for (const shape of input.shapes) {
      if (!MARK_BRUSHES.includes(shape.brush) || !/^[a-h][1-8]$/.test(shape.orig) || (shape.dest !== undefined && !/^[a-h][1-8]$/.test(shape.dest))) {
        throw new ServerError("INVALID_REQUEST", "A mark must use an exportable brush and board squares");
      }
    }
    let scopeKey: string;
    if (input.scope === "position") scopeKey = node.transposeKey;
    else {
      let path;
      try { path = branchPath(stored.run, input.branchId); }
      catch { throw new ServerError("INVALID_REQUEST", "Unknown mark branch"); }
      if (!path.some((candidate) => candidate.id === node.id)) throw new ServerError("INVALID_REQUEST", "Mark node is not on the named branch");
      scopeKey = `${input.branchId}:${node.id}`;
    }
    const session = this.#storage.liveSessionByRun?.(runId);
    const relayed = session !== undefined && session.kind !== "match" && stored.activeWriterLearnerId === principal.learnerId;
    return Object.freeze(this.#storage.replaceRunMarks({ runId, learnerId: principal.learnerId, scope: input.scope, scopeKey, shapes: input.shapes, relayed, at: new Date().toISOString() }).map(({ scope, scopeKey: key, brush, orig, dest, at }) =>
      Object.freeze({ scope, scopeKey: key, brush, orig, ...(dest === undefined ? {} : { dest }), at })));
  }

  rescopeMarks(runId:string,principal:Principal,input:{readonly nodeId:string;readonly branchId:string;readonly fromScope:"position"|"branch";readonly toScope:"position"|"branch"}):readonly RunMark[]{
    const {stored}=requireRead(this.#storage,runId,principal);
    const node=stored.run.nodes.find((candidate)=>candidate.id===input.nodeId);if(node===undefined)throw new ServerError("INVALID_REQUEST","Unknown mark node");
    let branchOnPath=false;try{branchOnPath=branchPath(stored.run,input.branchId).some((candidate)=>candidate.id===node.id);}catch{/* translated below */}
    if(!branchOnPath)throw new ServerError("INVALID_REQUEST","Mark node is not on the named branch");
    const key=(scope:"position"|"branch")=>scope==="position"?node.transposeKey:`${input.branchId}:${node.id}`;
    return Object.freeze(this.#storage.rescopeRunMarks({runId,learnerId:principal.learnerId,fromScope:input.fromScope,fromKey:key(input.fromScope),toScope:input.toScope,toKey:key(input.toScope)}).map(({scope,scopeKey,brush,orig,dest,at})=>Object.freeze({scope,scopeKey,brush,orig,...(dest===undefined?{}:{dest}),at})));
  }

  async create(input: CreateRunRequest, leaseInput: LeaseHolder | string): Promise<DrillRun> {
    const lease = this.#lease(leaseInput);
    if (lease.learnerId === "__legacy") this.#principal("legacy-create");
    const packRequest = input.session.kind === "pack" ? input.session : undefined;
    const pack = packRequest !== undefined
      ? packRequest.packDigest === undefined
        ? this.#requiredPackRegistry().required(packRequest.packId)
        : this.#requiredPackRegistry().byDigest(packRequest.packDigest)
      : undefined;
    if (packRequest !== undefined && pack === undefined) {
      throw new ServerError("PACK_NOT_FOUND", `Unknown pack bytes: ${packRequest.packId}`);
    }
    if (pack !== undefined && pack.document.id !== packRequest?.packId) {
      throw new ServerError("INVALID_REQUEST", "Pack digest belongs to another pack id");
    }
    if (pack !== undefined && packRequest?.packDigest !== undefined && packRequest.packDigest !== pack.digest) {
      throw new ServerError("INVALID_REQUEST", "Client pack digest is stale");
    }
    let run: DrillRun;
    try {
      const session = pack === undefined
        ? {
            kind: "position" as const,
            start: canonicalRunStart(input.session.kind === "position" ? input.session.start : (() => { throw new TypeError("Invalid session"); })()),
            feedbackPolicy: "attempt_end" as const,
            opponentPolicy: input.session.kind === "position" ? input.session.opponentPolicy : (() => { throw new TypeError("Invalid session"); })(),
          }
        : (() => {
            const side = pack.document.start.side;
            if (side !== "white" && side !== "black") {
              throw new ServerError("INVALID_REQUEST", `Pack ${pack.document.id} does not declare start.side`);
            }
            const authored = pack.document.opponentPolicy as Record<string, unknown>;
            const mode = authored.mode;
            if (!isRunOpponentMode(mode)) {
              throw new ServerError("INVALID_REQUEST", `Pack ${pack.document.id} has an unsupported opponent mode`);
            }
            const opponentPolicy: import("@chess-tabiya/runtime").RunOpponentPolicy = {
              mode,
              ...(typeof authored.targetElo === "number" ? { targetElo: authored.targetElo } : {}),
              ...(typeof authored.temperature === "number" ? { temperature: authored.temperature } : {}),
              ...(typeof authored.topP === "number" ? { topP: authored.topP } : {}),
            };
            if (opponentPolicy.targetElo !== undefined && !Number.isSafeInteger(opponentPolicy.targetElo)) {
              throw new ServerError("INVALID_REQUEST", `Pack ${pack.document.id} has invalid opponentPolicy.targetElo`);
            }
            if ((opponentPolicy.temperature ?? 0) < 0) {
              throw new ServerError("INVALID_REQUEST", `Pack ${pack.document.id} has invalid opponentPolicy.temperature`);
            }
            if ((opponentPolicy.topP ?? 0) < 0 || (opponentPolicy.topP ?? 0) > 1) {
              throw new ServerError("INVALID_REQUEST", `Pack ${pack.document.id} has invalid opponentPolicy.topP`);
            }
            return {
              kind: "pack" as const,
              packId: pack.document.id,
              packDigest: pack.digest,
              start: canonicalRunStart({ fen: pack.document.start.fen, side }),
              feedbackPolicy: pack.feedbackPolicy,
              opponentPolicy,
            };
          })();
      this.validateOpponentPolicy(session.opponentPolicy);
      const sessionDigest = await digestSessionSource(session);
      run = createRun({
        id: input.id,
        session,
        sessionDigest,
        policyConfig: input.policyConfig,
        seed: input.seed,
        ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      });
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw new ServerError("INVALID_REQUEST", "Run definition is invalid", {
        cause: error,
      });
    }
    if (pack !== undefined) run = orchestratePackStart(pack.document, run, planSignatureResolver(pack.document, this.#shapes)).run;
    const title = pack?.document.title;
    const root = run.nodes[0]!;
    const key = progressRootKey(run.sessionKind, run.packId ?? null, root.transposeKey);
    const pending = this.#progress?.pendingScheduleForRoot(lease.learnerId, key);
    if (input.intent?.scheduleId !== undefined && pending?.id !== input.intent.scheduleId) {
      throw new ServerError("RUN_NOT_FOUND", `Unknown pending schedule: ${input.intent.scheduleId}`);
    }
    this.#storage.create(
      run,
      lease,
      typeof title === "string" ? title : "Position session",
    );
    const origin: AttemptOriginInput = {
      origin: input.intent?.scheduleId !== undefined ? "scheduled" : (input.intent?.origin ?? "fresh"),
      ...(input.intent?.scheduleId === undefined ? {} : { scheduleId: input.intent.scheduleId }),
      ...(pending === undefined ? {} : { rootDueAtStart: pending.dueAt }),
      ...(input.intent?.derivedFromRunId === undefined ? {} : { derivedFromRunId: input.intent.derivedFromRunId }),
    };
    this.#project(run, lease.learnerId, { [run.branches[0]!.id]: origin });
    if (input.intent?.scheduleId !== undefined) {
      this.#progress?.markScheduleStarted(input.intent.scheduleId, lease.learnerId, run.id);
    }
    return run;
  }

  async createRatedGame(input: CreateRatedGameRequest, leaseInput: LeaseHolder | string): Promise<DrillRun> {
    const lease = this.#lease(leaseInput);
    if (lease.learnerId === "__legacy") this.#principal("legacy-rated-game");
    const rating = this.#rating;
    if (rating === undefined || this.#opponentSelector === undefined) {
      throw new ServerError("RATING_OPPONENT_UNCALIBRATED", "The calibrated rated opponent is unavailable");
    }
    rating.expireRatedGames(input.createdAt ?? new Date().toISOString());
    const rung = ratedOpponentRung(input.band);
    if (rung === undefined) {
      throw new ServerError("RATING_BAND_NOT_ON_LADDER", `Band ${input.band} is not a measured rated-opponent rung`);
    }
    const pieceCount = countFenPieces(input.start.fen);
    if (pieceCount < RATED_OPPONENT_CALIBRATION.minStartPieceCount) {
      throw new ServerError("RATING_MATERIAL_OUT_OF_RANGE", "Rated games require at least 21 pieces at the start");
    }
    let identity: import("@chess-tabiya/runtime").SelectionEngineIdentity;
    try {
      this.#opponentSelector.validatePolicy({ mode: "human_common", targetElo: rung.band });
      identity = this.#opponentSelector.identityFor("human_common", rung.band);
    } catch (cause) {
      throw new ServerError("RATING_OPPONENT_UNCALIBRATED", "The calibrated rated opponent handshake failed", { cause });
    }
    if (
      identity.id !== RATED_OPPONENT_CALIBRATION.engine.id ||
      identity.modelId !== RATED_OPPONENT_CALIBRATION.engine.modelId ||
      identity.containerDigest !== RATED_OPPONENT_CALIBRATION.engine.containerDigest ||
      identity.eloHonored !== true ||
      identity.eloApplied !== rung.band
    ) {
      throw new ServerError("RATING_OPPONENT_UNCALIBRATED", "The live opponent identity does not match the measured calibration");
    }
    const startedAt = input.createdAt ?? new Date().toISOString();
    const session = {
      kind: "position" as const,
      start: canonicalRunStart({ fen: input.start.fen, side: input.side }),
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: { mode: "human_common" as const, targetElo: rung.band },
    };
    let run: DrillRun;
    try {
      run = createRun({
        id: input.id,
        session,
        sessionDigest: await digestSessionSource(session),
        policyConfig: input.policyConfig,
        seed: input.seed,
        createdAt: startedAt,
      });
    } catch (cause) {
      throw new ServerError("INVALID_REQUEST", "Rated-game definition is invalid", { cause });
    }
    rating.createRatedRun(run, lease, "Rated game", Object.freeze({
      runId: run.id,
      learnerId: lease.learnerId,
      calibrationId: RATED_OPPONENT_CALIBRATION.id,
      opponentBand: rung.band,
      opponentRating: rung.rating,
      opponentRd: rung.rd,
      learnerSide: input.side,
      startPieceCount: pieceCount,
      engineIdentityDigest: RATED_OPPONENT_CALIBRATION.engine.containerDigest,
      state: "open",
      startedAt,
    }));
    this.#project(run, lease.learnerId, { [run.branches[0]!.id]: { origin: "fresh" } });
    return run;
  }

  rating(principal: Principal) {
    const storage = this.#rating;
    if (storage === undefined) throw new ServerError("STORAGE_FAILURE", "Rating storage is not configured");
    const state = storage.learnerRating(principal.learnerId);
    if (state === undefined) return Object.freeze({ rating: null, disclosures: RATING_DISCLOSURES });
    const closed = [...storage.ratingPeriods(principal.learnerId)].reverse().find((period) => period.closedAt !== null);
    const periodGames = closed === undefined
      ? []
      : storage.ratedGames(principal.learnerId).filter((game) => game.periodNo === closed.periodNo && game.state === "sealed");
    const scoreSaturation = periodGames.length > 0 && periodGames.every((game) => game.opponentBand === 2200 && game.result === "win")
      ? "high" as const
      : periodGames.length > 0 && periodGames.every((game) => game.opponentBand === 1000 && game.result === "loss")
        ? "low" as const
        : undefined;
    return Object.freeze({
      rating: publishRating(state, scoreSaturation === undefined ? {} : { scoreSaturation }),
      internal: Object.freeze({ calibrationId: state.calibrationId, periodNo: state.periodNo }),
      disclosures: RATING_DISCLOSURES,
    });
  }

  ratingHistory(principal: Principal) {
    const storage = this.#rating;
    if (storage === undefined) throw new ServerError("STORAGE_FAILURE", "Rating storage is not configured");
    return Object.freeze({
      periods: storage.ratingPeriods(principal.learnerId),
      games: storage.ratedGames(principal.learnerId).filter((game) => game.state !== "open"),
    });
  }

  learnerMarks(principal: Principal) {
    const storage = this.#rating;
    if (storage === undefined) throw new ServerError("STORAGE_FAILURE", "Rating storage is not configured");
    return storage.learnerMarks(principal.learnerId);
  }

  openCohortStanding(principal: Principal, classroomId: string, input: {
    readonly windowFrom: string;
    readonly windowTo?: string;
    readonly at?: string;
  }) {
    const { ratings } = this.#standingAccess(classroomId, principal, true);
    const openedAt = input.at ?? new Date().toISOString();
    this.#assertStandingWindow(input.windowFrom, input.windowTo);
    return ratings.createCohortStanding(Object.freeze({
      classroomId,
      openedByLearnerId: principal.learnerId,
      windowFrom: input.windowFrom,
      windowTo: input.windowTo ?? null,
      openedAt,
      closedAt: null,
    }));
  }

  configureCohortStanding(principal: Principal, classroomId: string, input:
    | { readonly op: "close"; readonly at?: string }
    | { readonly op: "window"; readonly windowFrom: string; readonly windowTo?: string }
  ) {
    const { ratings } = this.#standingAccess(classroomId, principal, true);
    if (input.op === "close") return ratings.closeCohortStanding(classroomId, input.at ?? new Date().toISOString());
    this.#assertStandingWindow(input.windowFrom, input.windowTo);
    return ratings.updateCohortStandingWindow(classroomId, input.windowFrom, input.windowTo ?? null);
  }

  publishCohortStanding(principal: Principal, classroomId: string, at = new Date().toISOString()) {
    const { ratings } = this.#standingAccess(classroomId, principal);
    return ratings.publishStandingMember(Object.freeze({
      classroomId,
      learnerId: principal.learnerId,
      showRecord: true,
      showRating: false,
      publishedAt: at,
    }));
  }

  setCohortStandingVisibility(principal: Principal, classroomId: string, field: "record" | "rating", visible: boolean) {
    const { ratings } = this.#standingAccess(classroomId, principal);
    return ratings.setStandingMemberVisibility(classroomId, principal.learnerId, field, visible);
  }

  withdrawCohortStanding(principal: Principal, classroomId: string): void {
    const { ratings } = this.#standingAccess(classroomId, principal);
    ratings.withdrawStandingMember(classroomId, principal.learnerId);
  }

  cohortStanding(principal: Principal, classroomId: string) {
    const { ratings, classrooms } = this.#standingAccess(classroomId, principal);
    const standing = ratings.cohortStanding(classroomId);
    if (standing === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown classroom: ${classroomId}`);
    const insideWindow = (value: string | null) => value !== null && value >= standing.windowFrom && (standing.windowTo === null || value <= standing.windowTo);
    const entries = ratings.standingMembers(classroomId).flatMap((entry) => {
      const membership = classrooms.classroomMember(classroomId, entry.learnerId);
      if (membership?.state !== "active") return [];
      const games = ratings.ratedGames(entry.learnerId).filter((game) => game.state === "sealed" && insideWindow(game.sealedAt));
      const wins = games.filter((game) => game.result === "win").length;
      const draws = games.filter((game) => game.result === "draw").length;
      const losses = games.filter((game) => game.result === "loss").length;
      const abandoned = ratings.ratedGames(entry.learnerId).filter((game) => game.voidReason === "abandoned" && insideWindow(game.sealedAt)).length;
      const byOpponentBand = Object.freeze([...new Set(games.map((game) => game.opponentBand))]
        .sort((left, right) => left - right)
        .map((opponentBand) => {
          const bandGames = games.filter((game) => game.opponentBand === opponentBand);
          const bandWins = bandGames.filter((game) => game.result === "win").length;
          const bandDraws = bandGames.filter((game) => game.result === "draw").length;
          const bandLosses = bandGames.filter((game) => game.result === "loss").length;
          return Object.freeze({
            opponentBand,
            wins: bandWins,
            draws: bandDraws,
            losses: bandLosses,
            games: bandGames.length,
            points: bandWins + bandDraws / 2,
          });
        }));
      const record = Object.freeze({ wins, draws, losses, games: games.length, points: wins + draws / 2, abandoned, byOpponentBand });
      const state = ratings.learnerRating(entry.learnerId);
      const published = state === undefined ? undefined : publishRating(state);
      const marks = ratings.learnerMarks(entry.learnerId).map((mark) => Object.freeze({
        mark: mark.mark,
        band: mark.mark === "bronze" ? 1400 : mark.mark === "silver" ? 1800 : 2200,
        calibrationId: mark.calibrationId,
        earnedAt: mark.earnedAt,
      }));
      return [Object.freeze({
        learnerId: entry.learnerId,
        handle: membership.handle,
        marks: Object.freeze(marks),
        ...(entry.showRecord ? { record } : {}),
        ...(entry.showRating && published?.pointEstimate !== undefined
          ? { rating: Object.freeze({ ...published, group: ratingGroup(published.pointEstimate) }) }
          : {}),
        _order: record,
      })];
    }).sort((left, right) =>
      right._order.points - left._order.points ||
      right._order.games - left._order.games ||
      left.handle.localeCompare(right.handle),
    ).map(({ _order: _ignored, ...entry }) => Object.freeze(entry));
    return Object.freeze({
      standing,
      limitation: "These games were played alone against a bot and nobody witnessed them.",
      entries: Object.freeze(entries),
    });
  }

  #standingAccess(classroomId: string, principal: Principal, teacher = false): {
    readonly ratings: RatingStorage;
    readonly classrooms: ClassroomStorage;
  } {
    const ratings = this.#rating;
    const classrooms = this.#classrooms;
    const classroom = classrooms?.classroom(classroomId);
    const membership = classrooms?.classroomMember(classroomId, principal.learnerId);
    if (ratings === undefined || classrooms === undefined || classroom === undefined || classroom.archivedAt !== null || membership?.state !== "active" || (teacher && membership.memberRole !== "teacher")) {
      throw new ServerError("RUN_NOT_FOUND", `Unknown classroom: ${classroomId}`);
    }
    return Object.freeze({ ratings, classrooms });
  }

  #assertStandingWindow(windowFrom: string, windowTo?: string): void {
    const from = Date.parse(windowFrom);
    const to = windowTo === undefined ? undefined : Date.parse(windowTo);
    if (!Number.isFinite(from) || (to !== undefined && (!Number.isFinite(to) || to < from))) {
      throw new ServerError("INVALID_REQUEST", "Standing window must be valid and ordered");
    }
  }

  expireRatedGames(at = new Date().toISOString()) {
    const storage = this.#rating;
    if (storage === undefined) throw new ServerError("STORAGE_FAILURE", "Rating storage is not configured");
    return storage.expireRatedGames(at);
  }

  async importGame(
    input: ImportGameRequest,
    leaseInput: LeaseHolder | string,
  ): Promise<{ readonly run: DrillRun; readonly importRecord: ImportedGameRecord; readonly evidencePass: { readonly jobs: number } }> {
    const lease = this.#lease(leaseInput);
    if (lease.learnerId === "__legacy") this.#principal("legacy-import");
    const source = await resolveImportSource(input.source, this.#importFetch);
    if (new TextEncoder().encode(source.pgn).byteLength > 65_536) {
      throw new ServerError("IMPORT_INVALID_PGN", "PGN exceeds the 64 KiB import limit");
    }
    let parsed;
    try { parsed = parsePgnMainline(source.pgn, { requireMoves: true }); }
    catch (error) {
      if (error instanceof PgnImportError) throw new ServerError("IMPORT_INVALID_PGN", error.message);
      throw error;
    }
    const movetextDigest = `sha256:${createHash("sha256").update(canonicalizeJson({
      rootFen: parsed.rootFen,
      uci: parsed.moves.map((move) => move.uci),
    })).digest("hex")}`;
    const session = {
      kind: "imported" as const,
      start: canonicalRunStart({ fen: parsed.rootFen, side: input.side }),
      movetextDigest,
      feedbackPolicy: "attempt_end" as const,
      opponentPolicy: input.opponentPolicy,
    };
    this.validateOpponentPolicy(session.opponentPolicy);
    let run: DrillRun;
    try {
      run = createRun({
        id: input.id,
        session,
        sessionDigest: await digestSessionSource(session),
        policyConfig: input.policyConfig,
        seed: input.seed,
        ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      });
      for (const move of parsed.moves) {
        const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
        const actor = node.fen.split(" ")[1] === input.side[0] ? "user" : "system";
        run = commitMove(run, move.uci, { actor, ...(input.createdAt === undefined ? {} : { at: input.createdAt }) }).run;
      }
    } catch (error) {
      throw new ServerError(
        "IMPORT_INVALID_PGN",
        error instanceof Error ? error.message : "Imported PGN is invalid",
        { cause: error },
      );
    }
    const importedAt = input.createdAt ?? new Date().toISOString();
    const record: ImportedGameRecord = Object.freeze({
      runId: run.id,
      sourceKind: source.sourceKind,
      sourceUrl: source.sourceUrl,
      movetextDigest,
      headers: parsed.headers,
      result: parsed.result,
      pgn: source.pgn,
      licenceNote: source.licenceNote,
      importedAt,
    });
    const title = parsed.headers.White !== undefined && parsed.headers.Black !== undefined
      ? `${parsed.headers.White} – ${parsed.headers.Black} (${parsed.result})`
      : "Imported game";
    if (this.#storage.createImportedRun === undefined) {
      throw new ServerError("STORAGE_FAILURE", "Imported-game storage is not configured");
    }
    this.#storage.createImportedRun(run, lease, title, record);
    const jobs = this.#ensureStoryEvidence(run, run.branches[0]!.id).enqueued;
    return Object.freeze({ run, importRecord: record, evidencePass: Object.freeze({ jobs }) });
  }

  importRecord(runId: string, principal: Principal): ImportedGameRecord {
    const run = requireRead(this.#storage, runId, principal).stored.run;
    if (run.sessionKind !== "imported" || this.#storage.importedGame === undefined) {
      throw new ServerError("RUN_NOT_FOUND", `Run ${runId} is not an imported game`);
    }
    const record = this.#storage.importedGame(runId);
    if (record === undefined) throw new ServerError("STORAGE_FAILURE", "Imported run has no import record");
    return record;
  }

  story(runId: string, principal: Principal, requestedBranchId?: string) {
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const outcomeEvents = run.events.filter((event): event is Extract<DrillRunEvent,{type:"outcome.reached"}> => event.type === "outcome.reached");
    const defaultBranch = run.sessionKind === "imported" ? run.branches[0]?.id : [...outcomeEvents].reverse().map((event)=>run.nodes.find((node)=>node.id===event.data.nodeId)?.branchId).find((id)=>id!==undefined);
    const branchId = requestedBranchId ?? defaultBranch;
    const importedMainline = run.sessionKind === "imported" && branchId === run.branches[0]?.id;
    const branchOutcome = outcomeEvents.find((event)=>run.nodes.find((node)=>node.id===event.data.nodeId)?.branchId===branchId);
    if (branchId === undefined || (!importedMainline && branchOutcome === undefined)) throw new ServerError("STORY_UNAVAILABLE","This branch has no terminal story");
    if (!feedbackDisclosed(run)) throw new ServerError("ASSISTANCE_WITHHELD", "Reveal the finished game before opening its story");
    const record = run.sessionKind === "imported" ? this.importRecord(runId, principal) : undefined;
    const pass = this.#ensureStoryEvidence(run, branchId);
    const shapes = this.#shapes?.list().map((summary) => {
      const document = this.#shapes!.required(summary.id).document;
      return { id: document.id, trigger: document.trigger };
    });
    const projection = storyMoments(run, branchId, {
      ...(record===undefined?{}:{recordedResult: record.result}),
      ...(shapes === undefined ? {} : { shapes }),
    });
    const terminal = branchOutcome !== undefined;
    return Object.freeze({
      ready: pass.ready,
      pendingEvidence: pass.pending,
      branchId,
      side: run.start.side,
      source: record===undefined?Object.freeze({kind:"native" as const}):Object.freeze({ kind: record.sourceKind, ...(record.sourceUrl === null ? {} : { url: record.sourceUrl }), headers: record.headers, result: record.result, importedAt: record.importedAt }),
      outcome: Object.freeze(terminal
        ? { kind: "board_terminal" as const, result: branchOutcome.data.outcome }
        : record?.result === "*" || record===undefined
          ? { kind: "unfinished" as const }
          : { kind: "recorded_result" as const, result: record.result }),
      ...projection,
    });
  }

  share(runId:string,principal:Principal,branchId:string,at=new Date().toISOString()){
    const {role}=requireRead(this.#storage,runId,principal); if(!mayManageGrants(role))throw new ServerError("FORBIDDEN","Only the host may share a story");
    this.story(runId,principal,branchId);
    if(this.#storage.createPublicToken===undefined)throw new ServerError("STORAGE_FAILURE","Public token storage is unavailable");
    const token=randomBytes(32).toString("base64url"),record:PublicTokenRecord={id:`share-${randomUUID()}`,tokenHash:createHash("sha256").update(token).digest("hex"),scope:"story_read",runId,branchId,createdBy:principal.learnerId,createdAt:at,revokedAt:null};
    this.#storage.createPublicToken(record); return Object.freeze({id:record.id,token,url:`/shared/${token}`});
  }
  shares(runId:string,principal:Principal){const {role}=requireRead(this.#storage,runId,principal);if(!mayManageGrants(role))throw new ServerError("FORBIDDEN","Only the host may list shares");return this.#storage.publicTokens?.(runId,principal.learnerId).map(({tokenHash,...record})=>record)??[];}
  revokeShare(runId:string,principal:Principal,tokenId:string,at=new Date().toISOString()){const {role}=requireRead(this.#storage,runId,principal);if(!mayManageGrants(role))throw new ServerError("FORBIDDEN","Only the host may revoke shares");this.#storage.revokePublicToken?.(runId,tokenId,principal.learnerId,at);}
  publicStory(token:string){const record=this.#storage.publicTokenByHash?.(createHash("sha256").update(token).digest("hex"));if(record?.scope!=="story_read")throw new ServerError("RUN_NOT_FOUND","Shared story not found");const learner=this.#storage.learnerById(record.createdBy);if(learner===undefined)throw new ServerError("RUN_NOT_FOUND","Shared story not found");const story=this.story(record.runId,{learnerId:learner.id,handle:learner.handle},record.branchId);return Object.freeze({title:reviewStoryTitle(story),outcome:story.outcome,moments:story.moments.slice(0,8).map((moment)=>Object.freeze({nodeId:moment.nodeId,ply:moment.ply,san:moment.san,fen:moment.fen,sentences:moment.sentences})),productLink:"/"});}

  async flip(runId:string,principal:Principal,nodeId:string,resistance?:"human_common"|"strong_engine"){
    const access=requireRead(this.#storage,runId,principal);if(!mayWrite(access.role))throw new ServerError("FORBIDDEN","This learner may not create a replay from this run");
    const source=access.stored.run;this.#refuseWhileMatchLive(runId,source);const node=source.nodes.find((item)=>item.id===nodeId);if(node===undefined)throw new ServerError("RUN_NOT_FOUND",`Unknown run: ${runId}`);
    if(this.#storage.createDerivedRun===undefined)throw new ServerError("STORAGE_FAILURE","Run derivation storage is unavailable");
    const id=`flip-${randomUUID()}`,writerId=`writer-${randomUUID()}`,mode=resistance??(source.opponentPolicy.mode==="strong_engine"?"strong_engine":"human_common"),createdAt=new Date().toISOString();
    const session={kind:"position" as const,start:canonicalRunStart({fen:node.fen,side:source.start.side==="white"?"black":"white"}),feedbackPolicy:"attempt_end" as const,opponentPolicy:{mode,...(mode==="human_common"&&source.opponentPolicy.targetElo!==undefined?{targetElo:source.opponentPolicy.targetElo}:{})}};
    this.validateOpponentPolicy(session.opponentPolicy);const run=createRun({id,session,sessionDigest:await digestSessionSource(session),policyConfig:source.policyConfig,seed:Math.floor(Math.random()*2_147_483_647),createdAt});
    const derivation:RunDerivation={derivedRunId:id,sourceRunId:runId,sourceBranchId:node.branchId,sourceNodeId:nodeId,kind:"flip_sides",createdAt};
    this.#storage.createDerivedRun(run,{writerId,learnerId:principal.learnerId},"Opposite-side replay",derivation);this.#project(run,principal.learnerId,{[run.branches[0]!.id]:{origin:"fresh",derivedFromRunId:runId}});return Object.freeze({run,writerId,derivation});
  }

  async createRepertoireGapRun(input:{readonly repertoireId:string;readonly gapKey:string;readonly fen:string;readonly side:"white"|"black";readonly targetElo:number;readonly resistance:"human_common"|"strong_engine";readonly learnerId:string}){
    if(!this.#opponentSelector?.availableModes().includes(input.resistance))throw new ServerError("POLICY_MODE_UNSUPPORTED",`Policy mode is not available: ${input.resistance}`);
    if(this.#storage.createRepertoireGapRun===undefined)throw new ServerError("STORAGE_FAILURE","Repertoire gap-run storage is unavailable");
    const id=`gap-${randomUUID()}`,writerId=`writer-${randomUUID()}`,createdAt=new Date().toISOString(),session={kind:"position" as const,start:canonicalRunStart({fen:input.fen,side:input.side}),feedbackPolicy:"attempt_end" as const,opponentPolicy:{mode:input.resistance,...(input.resistance==="human_common"?{targetElo:input.targetElo}:{})}},policyConfig={seedMode:"fixed" as const,locus:{executedAt:"server" as const,engineIds:Object.freeze([]),modelIds:Object.freeze([])}};this.validateOpponentPolicy(session.opponentPolicy);
    const run=createRun({id,session,sessionDigest:await digestSessionSource(session),policyConfig,seed:Math.floor(Math.random()*2_147_483_647),createdAt}),lease={writerId,learnerId:input.learnerId},link:RepertoireGapRunRecord={runId:id,repertoireId:input.repertoireId,gapKey:input.gapKey,createdAt};
    this.#storage.createRepertoireGapRun(run,lease,"Repertoire gap",link);this.#project(run,input.learnerId,{[run.branches[0]!.id]:{origin:"fresh"}});return Object.freeze({runId:id,writerId,run});
  }

  derivations(runId:string,principal:Principal){requireRead(this.#storage,runId,principal);return Object.freeze({source:this.#storage.derivationFor?.(runId)??null,derived:this.#storage.derivationsFrom?.(runId)??[]});}

  milestones(principal:Principal){
    const rows=[...this.progress(principal)].sort((a,b)=>a.endedAt.localeCompare(b.endedAt)||a.runId.localeCompare(b.runId));const output:any[]=[];const add=(kind:string,row:StoredAttempt,sentence:string)=>{if(!output.some((item)=>item.kind===kind))output.push({kind,occurredAt:row.endedAt,sentence,link:{runId:row.runId,branchId:row.branchId}});};
    for(const row of rows){if(row.countable)add("first_attempt",row,"First preserved attempt.");if(row.graded&&row.verdict==="stable")add("first_stable",row,"First stable graded attempt.");if(row.objectiveState==="achieved")add("first_objective_achieved",row,"First achieved objective.");if(row.countable&&row.result==="win")add("first_win",row,"First recorded win.");if(row.origin==="scheduled")add("first_scheduled_return",row,"First return when due.");if(row.attemptNo===10)add("ten_attempts_one_root",row,"Ten attempts on one root.");if(this.#storage.derivationFor?.(row.runId)!==undefined)add("first_flip_sides",row,"First opposite-side replay.");}
    return Object.freeze(output.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)));
  }

  move(
    runId: string,
    principalOrWriter: Principal | string,
    writerOrUci: string,
    uciOrOptions: string | CommitMoveOptions = {},
    maybeOptions: CommitMoveOptions = {},
  ): MutationResult {
    const principal = this.#principal(principalOrWriter);
    const writerId = typeof principalOrWriter === "string" ? principalOrWriter : writerOrUci;
    const uci = typeof principalOrWriter === "string" ? writerOrUci : uciOrOptions as string;
    const options = typeof principalOrWriter === "string" ? uciOrOptions as CommitMoveOptions : maybeOptions;
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseImportedMainlineExtension(stored.run);
    const guardedOptions=this.#matchMoveOptions(runId,principal,stored.run,options);
    const pack = this.#requiredRegisteredPack(stored.run);
    this.#requiredEvidenceQueue();
    const committed = commitMove(stored.run, uci, guardedOptions);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed, planSignatureResolver(pack.document, this.#shapes));
    this.#storage.save(result.run, lease);
    this.#project(result.run, lease.learnerId);
    this.#enqueueMoveEvidence(result.run);
    return result;
  }

  opponentPly(
    runId: string,
    principalOrWriter: Principal | string,
    writerOrSelection: string | OpponentSelection,
    selectionOrOptions: OpponentSelection | AppendOpponentPlyOptions = {},
    maybeOptions: AppendOpponentPlyOptions = {},
  ): MutationResult {
    const principal = this.#principal(principalOrWriter);
    const writerId = typeof principalOrWriter === "string" ? principalOrWriter : writerOrSelection as string;
    const selection = typeof principalOrWriter === "string" ? writerOrSelection as OpponentSelection : selectionOrOptions as OpponentSelection;
    const options = typeof principalOrWriter === "string" ? selectionOrOptions as AppendOpponentPlyOptions : maybeOptions;
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseImportedMainlineExtension(stored.run);
    if(this.#matchContext(runId)!==undefined)throw new ServerError("INVALID_REQUEST","Native matches do not accept opponent selections");
    const pack = this.#requiredRegisteredPack(stored.run);
    this.#requiredEvidenceQueue();
    const committed = appendOpponentPly(stored.run, selection, options);
    let result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed, planSignatureResolver(pack.document, this.#shapes));
    if (pack !== undefined && result.run.feedbackPolicy === "immediate_guard") {
      const consequence = result.run.nodes.find(
        (candidate) => candidate.id === result.run.activeCursor.nodeId,
      );
      if (consequence !== undefined) {
        const guarded = applyRulesGuard(pack.document, result.run, consequence.id, consequence.createdAt);
        result = Object.freeze({
          run: guarded.run,
          emitted: Object.freeze([...result.emitted, ...guarded.emitted]),
        });
      }
    }
    this.#storage.save(result.run, lease);
    this.#project(result.run, lease.learnerId);
    this.#enqueueMoveEvidence(result.run);
    return result;
  }

  rewind(
    runId: string,
    principalOrWriter: Principal | string,
    writerOrTarget: string | RewindTarget,
    targetOrAt?: RewindTarget | string,
    maybeAt?: string,
  ): MutationResult {
    const principal = this.#principal(principalOrWriter);
    const writerId = typeof principalOrWriter === "string" ? principalOrWriter : writerOrTarget as string;
    const target = typeof principalOrWriter === "string" ? writerOrTarget as RewindTarget : targetOrAt as RewindTarget;
    const at = typeof principalOrWriter === "string" ? targetOrAt as string | undefined : maybeAt;
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    const result =
      target.nodeId === undefined
        ? rewindToCheckpoint(
            stored.run,
            target.checkpointId,
            at,
            this.#evidenceQueue,
          )
        : (() => {
            if (target.branchId !== undefined && !branchPath(stored.run, target.branchId).some((node) => node.id === target.nodeId)) {
              throw new ServerError("INVALID_REQUEST", "Rewind node is not on the named branch");
            }
            return rewind(stored.run, target.nodeId, at, this.#evidenceQueue, target.branchId);
          })();
    this.#storage.save(result.run, lease);
    this.#project(result.run, lease.learnerId);
    return result;
  }

  fork(
    runId: string,
    principalOrWriter: Principal | string,
    writerOrNode: string,
    nodeOrOptions: string | ForkOptions = {},
    maybeOptions: ForkOptions = {},
  ): MutationResult {
    const principal = this.#principal(principalOrWriter);
    const writerId = typeof principalOrWriter === "string" ? principalOrWriter : writerOrNode;
    const nodeId = typeof principalOrWriter === "string" ? writerOrNode : nodeOrOptions as string;
    const options = typeof principalOrWriter === "string" ? nodeOrOptions as ForkOptions : maybeOptions;
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    const result = fork(stored.run, nodeId, options);
    this.#storage.save(result.run, lease);
    this.#project(result.run, lease.learnerId);
    return result;
  }

  graph(runId: string, principalInput?: Principal, writerId?: string): RunGraph {
    const principal = principalInput ?? this.#principal("legacy-reader");
    const { stored, role } = requireRead(this.#storage, runId, principal);
    const run = stored.run;
    const holder = this.#storage.learnerById(stored.activeWriterLearnerId);
    if (holder === undefined) {
      throw new ServerError("STORAGE_FAILURE", "Run lease holder is missing");
    }
    const assistance = this.#assistanceContext(runId, principal, run, role);
    return Object.freeze({
      id: run.id,
      viewer: Object.freeze({
        role,
        mayWrite: mayWrite(role),
        holdsLease:
          writerId !== undefined &&
          stored.activeWriterId === writerId &&
          stored.activeWriterLearnerId === principal.learnerId,
        leaseHeldBy: Object.freeze({ learnerId: holder.id, handle: holder.handle }),
        seatedInContest: assistance.seatedInContest,
        reviewing: assistance.reviewing,
      }),
      nodes: publicNodes(run),
      branches: run.branches,
      activeCursor: run.activeCursor,
    });
  }

  guidanceAccess(runId: string, principal: Principal, nodeId: string): GuidanceAccess {
    this.#refuseRatedAssistance(runId);
    const { stored, role } = requireRead(this.#storage, runId, principal);
    const run = stored.run;
    const node = run.nodes.find((candidate) => candidate.id === nodeId);
    if (node === undefined) throw new ServerError("INVALID_REQUEST", `Unknown guidance node: ${nodeId}`);
    const branch = run.branches.find((candidate) => candidate.id === node.branchId);
    if (branch === undefined) throw new ServerError("STORAGE_FAILURE", `Node ${nodeId} has no branch`);
    const pack = this.#requiredRegisteredPack(run);
    const assistance = this.#assistanceContext(runId, principal, run, role);
    return Object.freeze({
      run,
      node,
      role,
      ...(pack === undefined ? {} : { pack }),
      historyUci: Object.freeze(historyFrom(run, nodeId).flatMap((item) => item.moveUci === null ? [] : [item.moveUci])),
      branchSeed: branch.seed,
      seatedInContest: assistance.seatedInContest,
      reviewing: assistance.reviewing,
      workflowContext: assistance.workflowContext,
    });
  }

  distillationAccess(runId: string, principal: Principal): DistillationAccess {
    const { stored, role } = requireRead(this.#storage, runId, principal);
    if (!mayManageGrants(role)) throw new ServerError("FORBIDDEN", "Only the host may distill a run");
    const pack = this.#requiredRegisteredPack(stored.run);
    return Object.freeze({ run: stored.run, ...(pack === undefined ? {} : { pack }) });
  }

  shapeRecommendations(principal: Principal) {
    if (this.#shapes === undefined || this.#packRegistry === undefined || this.#progress === undefined) return Object.freeze([]);
    const attemptedShapes = new Set<string>();
    for (const attempt of this.#progress.progress(principal.learnerId)) {
      if (!attempt.countable || attempt.packId === null) continue;
      for (const shape of normalizeShapeReferences(this.#packRegistry.get(attempt.packId)?.document.shapes)) attemptedShapes.add(shape.shape);
    }
    const triggers = this.#shapes.list().map((summary) => ({ id: summary.id, trigger: this.#shapes!.required(summary.id).document.trigger }));
    const encountered = new Map<string, Set<string>>();
    for (const summary of this.#storage.list(principal.learnerId, 50, 0)) {
      const run = this.#storage.read(summary.id)?.run; if (run === undefined) continue;
      const ids = new Set(run.branches.flatMap((branch) => shapeFirings(triggers, branchPath(run, branch.id)).map((firing) => firing.entryId)));
      for (const id of ids) { const runs = encountered.get(id) ?? new Set<string>(); runs.add(run.id); encountered.set(id, runs); }
    }
    return Object.freeze([...encountered].filter(([id]) => !attemptedShapes.has(id)).map(([id, runIds]) => {
      const shape = this.#shapes!.required(id).summary;
      const packIds = this.#packRegistry!.list().filter((pack) => normalizeShapeReferences(this.#packRegistry!.get(pack.id)?.document.shapes).some((shape) => shape.shape === id)).map((pack) => pack.id).sort();
      return Object.freeze({ kind: "shape_encounter" as const, shapeId: id, shapeName: shape.name, runCount: runIds.size, runIds: Object.freeze([...runIds].sort()), packIds: Object.freeze(packIds), sentence: `You met ${shape.name} in ${runIds.size} of your preserved runs and have no countable attempt recorded in any pack that names it.` });
    }).sort((left, right) => right.runCount - left.runCount || left.shapeId.localeCompare(right.shapeId)).slice(0, 10));
  }

  async createGroup(
    runId: string,
    principal: Principal,
    writerId: string,
    input: CreateGroupInput,
  ): Promise<CreateGroupResult> {
    const { stored, role, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    this.#requiredEvidenceQueue();
    const pack = this.#requiredRegisteredPack(stored.run);
    const sourceNode = stored.run.nodes.find((node) => node.id === stored.run.activeCursor.nodeId)!;
    if (terminalPosition(sourceNode.fen) || ["achieved", "failed", "transitioned"].includes(sourceNode.objectiveState)) {
      throw new ServerError("INVALID_REQUEST", "A group cannot start from a terminal node");
    }
    const resistance = input.resistance ?? "fixed";
    const requestedSize = input.size ?? 4;
    if (!Number.isSafeInteger(requestedSize) || requestedSize < 2 || requestedSize > 8) {
      throw new ServerError("INVALID_REQUEST", "Group size must be an integer from 2 to 8");
    }
    if (input.source === "hand_picked" && input.size !== undefined) {
      throw new ServerError("INVALID_REQUEST", "Hand-picked groups derive size from candidates");
    }
    if (input.source !== "hand_picked" && input.candidates !== undefined) {
      throw new ServerError("INVALID_REQUEST", "Only hand-picked groups accept candidates");
    }

    let distribution: OpponentSelection | undefined;
    let candidates: readonly string[];
    if (input.source === "hand_picked") {
      candidates = Object.freeze([...(input.candidates ?? [])]);
    } else if (input.source === "authored") {
      if (pack === undefined) {
        throw new ServerError("NO_AUTHORED_VARIATIONS", "Position sessions have no authored variations");
      }
      const membership = lineMembership(
        expandPackAuthoredBoundary(
          pack.document,
          planSignatureResolver(pack.document, this.#shapes),
        ),
        stored.run,
        sourceNode.id,
      );
      const spineId = membership.at(-1)?.spineNodeId;
      const choices = (spineId === undefined
        ? pack.document.spine
        : findSpineNode(pack.document.spine ?? [], spineId)?.children) ?? [];
      candidates = Object.freeze(choices.slice(0, requestedSize).map((choice) =>
        normalizeInboundMove(sourceNode.fen, choice.moveUci, "pack_move_uci").moveUci,
      ));
    } else {
      const permission = permittedAssistance({
        sessionKind: stored.run.sessionKind,
        deliveryOpen: feedbackDeliveryOpen(stored.run),
        role,
        ...this.#assistanceContext(runId, principal, stored.run, role),
      });
      if (permission.humanSplit === "locked_off") {
        throw new ServerError("ASSISTANCE_WITHHELD", "Machine-seeded groups are withheld in this context");
      }
      if (input.source === "human_replies" && learnerToMove(stored.run, sourceNode)) {
        throw new ServerError("GROUP_SEEDS_UNAVAILABLE", "Human replies are resistance, not learner move advice");
      }
      const selector = this.#requiredOpponentSelector();
      const mode = input.source === "human_replies" ? "human_common" : "strong_engine";
      const request = this.#selectionRequest(stored.run, sourceNode.id, pack, Object.freeze({ ...stored.run.opponentPolicy, mode }), stored.run.branches[0]!.seed);
      distribution = input.source === "human_replies"
        ? await selector.select(request)
        : await selector.enumerate(request, requestedSize);
      candidates = Object.freeze((distribution.candidates ?? []).filter((candidate) => candidate.offWindow !== true).slice(0, requestedSize).map((candidate) => candidate.moveUci));
    }
    if (candidates.length < 2) {
      throw new ServerError("GROUP_SEEDS_UNAVAILABLE", "At least two group seeds are required");
    }
    candidates = Object.freeze(candidates.map((moveUci) => exactMoveIdentity(sourceNode.fen, moveUci)));
    if (candidates.length > 8) {
      throw new ServerError("TOO_MANY_BRANCHES", "At most eight branches may be grouped", { details: { count: candidates.length, limit: 8 } });
    }
    if (new Set(candidates).size !== candidates.length) {
      throw new ServerError("INVALID_REQUEST", "Group seed moves must be distinct");
    }

    const groupedBranches = new Set(groupsFromEvents(stored.run).flatMap((group) => group.members.map((member) => member.branchId)));
    let scratch = stored.run;
    const members: { branchId: string; seedMoveUci: string }[] = [];
    const evidenceNodeIds: string[] = [];
    for (const moveUci of candidates) {
      const existing = scratch.nodes.find((node) => node.parentId === sourceNode.id && node.moveUci === moveUci);
      if (existing !== undefined) {
        if (groupedBranches.has(existing.branchId)) {
          throw new ServerError("INVALID_REQUEST", `Branch ${existing.branchId} already belongs to a group`);
        }
        members.push({ branchId: existing.branchId, seedMoveUci: moveUci });
        continue;
      }
      scratch = fork(scratch, sourceNode.id, {
        label: seedMoveSan(sourceNode.fen, moveUci),
        ...(input.at === undefined ? {} : { at: input.at }),
      }).run;
      const beforeCommit = scratch;
      const opponentSide = !learnerToMove(stored.run, sourceNode);
      const committed = opponentSide && distribution !== undefined
        ? appendOpponentPly(scratch, {
            ...distribution,
            moveUci,
            policyModeApplied: "enumerated",
          }, input.at === undefined ? {} : { at: input.at })
        : commitMove(scratch, moveUci, {
            actor: input.source === "hand_picked" && !opponentSide ? "user" : "system",
            ...(input.at === undefined ? {} : { at: input.at }),
          });
      const orchestrated = pack === undefined
        ? committed
        : orchestratePackMove(pack.document, beforeCommit, committed, planSignatureResolver(pack.document, this.#shapes));
      scratch = orchestrated.run;
      members.push({ branchId: scratch.activeCursor.branchId, seedMoveUci: moveUci });
      evidenceNodeIds.push(scratch.activeCursor.nodeId);
    }
    if (new Set(members.map((member) => member.branchId)).size !== members.length) {
      throw new ServerError("INVALID_REQUEST", "Two seeds resolve to the same branch");
    }
    const firstLeaf = branchPath(scratch, members[0]!.branchId).at(-1)!;
    scratch = rewind(scratch, firstLeaf.id, input.at).run;
    const groupId = `${scratch.id}:group:${groupsFromEvents(scratch).length + 1}`;
    scratch = appendEvents(scratch, [{
      type: "group.created",
      at: input.at ?? new Date().toISOString(),
      data: {
        groupId,
        sourceNodeId: sourceNode.id,
        source: input.source,
        resistance,
        members,
        ...(distribution === undefined ? {} : { distribution }),
      },
    }]);
    this.#storage.save(scratch, lease);
    this.#project(scratch, lease.learnerId);
    for (const nodeId of evidenceNodeIds) this.#enqueueMoveEvidence(scratch, nodeId);
    const group = groupsFromEvents(scratch).at(-1)!;
    return Object.freeze({
      group,
      run: scratch,
      emitted: scratch.events.slice(stored.run.events.length),
      comparison: compareBranches(scratch, members.map((member) => member.branchId), pack === undefined ? {} : {
        pack: expandPackAuthoredBoundary(
          pack.document,
          planSignatureResolver(pack.document, this.#shapes),
        ),
      }),
    });
  }

  async groupReply(
    runId: string,
    principal: Principal,
    writerId: string,
    groupId: string,
  ): Promise<GroupReplyResult> {
    const { stored } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    const group = groupsFromEvents(stored.run).find((candidate) => candidate.groupId === groupId);
    if (group === undefined) throw new ServerError("UNKNOWN_GROUP", `Unknown group: ${groupId}`);
    const memberIndex = group.members.findIndex((member) => member.branchId === stored.run.activeCursor.branchId);
    if (memberIndex < 0) throw new ServerError("INVALID_REQUEST", "The active branch is not a member of this group");
    const node = stored.run.nodes.find((candidate) => candidate.id === stored.run.activeCursor.nodeId)!;
    if (terminalPosition(node.fen)) throw new ServerError("INVALID_REQUEST", "The active group position is terminal");
    const pack = this.#requiredRegisteredPack(stored.run);
    const selector = this.#requiredOpponentSelector();
    const available = selector.availableModes();
    const policy = this.#policyAt(stored.run, node.id, pack);
    const mode = policy.mode;
    if (!available.includes(mode)) throw new ServerError("POLICY_MODE_UNSUPPORTED", `Policy mode is unavailable for the active trajectory leg: ${mode}`, { details: { policyMode: mode } });
    const identity = selector.identityFor(mode, policy.targetElo);
    if (group.resistance === "fixed") {
      const memberIds = new Set(group.members.map((member) => member.branchId));
      const sourcePly = stored.run.nodes.find((candidate) => candidate.id === group.sourceNodeId)!.ply;
      for (const move of opponentMovesFromEvents(stored.run.events)) {
        if (!memberIds.has(move.branchId)) continue;
        const parent = stored.run.nodes.find((candidate) => candidate.id === move.parentNodeId);
        if (parent === undefined || parent.ply < sourcePly || parent.transposeKey !== node.transposeKey) continue;
        if (!compatibleAppliedMode(mode, move.policyModeApplied) || !sameEngine(move.engine, identity)) continue;
        const event = stored.run.events[move.selectionSeq - 1];
        if (event?.type !== "opponent.move_selected") continue;
        return Object.freeze({ selection: event.data.selection, reusedFromNodeId: move.parentNodeId });
      }
    }
    const seed = group.resistance === "fixed"
      ? stored.run.branches[0]!.seed
      : stored.run.branches[0]!.seed + memberIndex + 1;
    const request = this.#selectionRequest(stored.run, node.id, pack, policy, seed);
    return Object.freeze({ selection: await selector.select(request), reusedFromNodeId: null });
  }

  deletionPreview(runId: string, principal: Principal, at = new Date().toISOString()): DeletionPreviewV1 {
    return this.#storage.deletionPreview(principal.learnerId, { kind: "run", runId }, at);
  }

  deleteRun(runId: string, principal: Principal, previewDigest: string, at = new Date().toISOString()): void {
    this.#storage.deleteOwnedRun(principal.learnerId, runId, at, previewDigest);
  }

  runs(principal: Principal, limit: number, offset: number): readonly RunSummary[];
  runs(limit: number, offset: number): readonly RunSummary[];
  runs(principalOrLimit: Principal | number, limitOrOffset: number, maybeOffset?: number): readonly RunSummary[] {
    const principal = typeof principalOrLimit === "number" ? this.#principal("legacy-reader") : principalOrLimit;
    const limit = typeof principalOrLimit === "number" ? principalOrLimit : limitOrOffset;
    const offset = typeof principalOrLimit === "number" ? limitOrOffset : maybeOffset!;
    return this.#storage.list(principal.learnerId, limit, offset);
  }

  compare(runId: string, principalOrBranches: Principal | readonly string[], maybeBranches?: readonly string[]): BranchComparison {
    const principal = Array.isArray(principalOrBranches)
      ? this.#principal("legacy-reader")
      : principalOrBranches as Principal;
    const branchIds = Array.isArray(principalOrBranches) ? principalOrBranches : maybeBranches!;
    if (branchIds.length < 2 || new Set(branchIds).size !== branchIds.length) {
      throw new ServerError("INVALID_REQUEST", "compare requires at least two distinct branch ids");
    }
    if (branchIds.length > MAX_COMPARISON_BRANCHES) {
      throw new ServerError("TOO_MANY_BRANCHES", "At most eight branches may be compared", {
        details: { count: branchIds.length, limit: MAX_COMPARISON_BRANCHES },
      });
    }
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const pack = run.packId === null ? undefined : this.#requiredPackRegistry().byDigest(run.packDigest!);
    const comparison = compareBranches(run, branchIds, pack === undefined ? {} : {
      pack: expandPackAuthoredBoundary(
        pack.document,
        planSignatureResolver(pack.document, this.#shapes),
      ),
    });
    return !feedbackDisclosed(run)
      ? comparisonWithoutEngineFeedback(comparison)
      : comparison;
  }

  async branchDecidedness(runId: string, principal: Principal, branchIds: readonly string[]): Promise<Readonly<Record<string, Decidedness>>> {
    if (branchIds.length < 1 || branchIds.length > MAX_COMPARISON_BRANCHES || new Set(branchIds).size !== branchIds.length) {
      throw new ServerError(branchIds.length > MAX_COMPARISON_BRANCHES ? "TOO_MANY_BRANCHES" : "INVALID_REQUEST", "branch-decidedness requires one to eight distinct branch ids", { details: { count: branchIds.length, limit: MAX_COMPARISON_BRANCHES } });
    }
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const known = new Set(run.branches.map((branch) => branch.id));
    if (branchIds.some((id) => !known.has(id))) throw new ServerError("INVALID_REQUEST", "branch-decidedness contains an unknown branch id");
    const pack = run.packId === null ? undefined : this.#requiredPackRegistry().byDigest(run.packDigest!);
    const objectiveValue = pack?.document.objective.type;
    const objective = objectiveValue === "win" || objectiveValue === "hold" || objectiveValue === "save" || objectiveValue === "resist" ? objectiveValue : undefined;
    const tablebase: Record<string, { category: import("./tablebase.js").TablebaseCategory; pieces: number; sourceId: string }> = {};
    const unresolved: Record<string, "out_of_range" | "not_probed" | "provider_unavailable" | "withheld"> = {};
    const free = branchDecidedness(run, { ...(objective === undefined ? {} : { objective }) });
    for (const branchId of branchIds) {
      if (free[branchId]?.state === "decided") continue;
      if (!feedbackDisclosed(run)) { unresolved[branchId] = "withheld"; continue; }
      const path = branchPath(run, branchId), leaf = path.at(-1)!;
      const pieces = countFenPieces(leaf.fen);
      if (pieces > 7) { unresolved[branchId] = "out_of_range"; continue; }
      if (this.#tablebase === undefined) { unresolved[branchId] = "provider_unavailable"; continue; }
      try {
        const raw = await this.#tablebase.probe(leaf.fen);
        const sideToMove = leaf.fen.split(" ")[1] === "b" ? "black" : "white";
        const category = learnerCategory(sideToMove, raw.category, run.start.side);
        tablebase[branchId] = { category, pieces, sourceId: "syzygy" };
      } catch {
        unresolved[branchId] = "provider_unavailable";
      }
    }
    const projected = branchDecidedness(run, { ...(objective === undefined ? {} : { objective }), tablebase, unresolved });
    return Object.freeze(Object.fromEntries(branchIds.map((id) => [id, projected[id]!])));
  }

  events(runId: string, principalOrSeq?: Principal | number, maybeSeq = 0): EventsPage {
    const principal = typeof principalOrSeq === "object" ? principalOrSeq : this.#principal("legacy-reader");
    const sinceSeq = typeof principalOrSeq === "number" ? principalOrSeq : maybeSeq;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    return publicEvents(run, sinceSeq);
  }

  packs(): readonly PackSummary[] {
    return this.#requiredPackRegistry().list();
  }

  pack(packId: string): PackRecord {
    return this.#requiredPackRegistry().required(packId);
  }

  enqueueEvidence(
    runId: string,
    principalOrInput: Principal | {
      readonly nodeId: string;
      readonly kind: EvidenceKind;
      readonly depth?: number;
      readonly movetime?: number;
      readonly multiPv?: number;
    },
    maybeInput?: {
      readonly nodeId: string;
      readonly kind: EvidenceKind;
      readonly depth?: number;
      readonly movetime?: number;
      readonly multiPv?: number;
    },
  ): EvidenceJob {
    const principal = "learnerId" in principalOrInput ? principalOrInput : this.#principal("legacy-reader");
    const input = "learnerId" in principalOrInput ? maybeInput! : principalOrInput;
    const queue = this.#requiredEvidenceQueue();
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const node = run.nodes.find((candidate) => candidate.id === input.nodeId);
    if (node === undefined) {
      throw new ServerError("INVALID_REQUEST", `Unknown evidence node: ${input.nodeId}`);
    }
    return queue.enqueue({
      runId,
      nodeId: node.id,
      fen: node.fen,
      kind: input.kind,
      ...(input.depth === undefined ? {} : { depth: input.depth }),
      ...(input.movetime === undefined ? {} : { movetime: input.movetime }),
      ...(input.multiPv === undefined ? {} : { multiPv: input.multiPv }),
      ...(isPackSession(run) ? {
        objectiveRequest: Object.freeze({
          runId: run.id,
          packId: run.packId,
          packDigest: run.packDigest,
          nodeId: node.id,
          fen: node.fen,
          objectiveState: node.objectiveState,
          evidenceRefs: node.evidenceRefs,
          policyConfig: run.policyConfig,
        }),
      } : {}),
    });
  }

  analysis(
    runId: string,
    principal: Principal,
    writerId: string,
    input: {
      readonly nodeIds: readonly string[];
      readonly kind?: "bestline" | "eval" | "wdl";
      readonly multiPv?: number;
      readonly depth?: number;
      readonly movetime?: number;
    },
  ): readonly EvidenceJob[] {
    this.#refuseRatedAssistance(runId);
    this.#forWrite(runId, principal, writerId);
    if (input.nodeIds.length < 1 || input.nodeIds.length > 16 || new Set(input.nodeIds).size !== input.nodeIds.length) {
      throw new ServerError("INVALID_REQUEST", "analysis requires 1-16 distinct node ids");
    }
    if (input.multiPv !== undefined && (!Number.isSafeInteger(input.multiPv) || input.multiPv < 1 || input.multiPv > 8)) {
      throw new ServerError("INVALID_REQUEST", "multiPv must be an integer from 1 to 8");
    }
    return Object.freeze(input.nodeIds.map((nodeId) => this.enqueueEvidence(runId, principal, {
      nodeId,
      kind: input.kind ?? "bestline",
      ...(input.multiPv === undefined ? {} : { multiPv: input.multiPv }),
      ...(input.depth === undefined ? {} : { depth: input.depth }),
      ...(input.movetime === undefined ? {} : { movetime: input.movetime }),
    })));
  }

  recordPrediction(
    runId: string,
    principal: Principal,
    writerId: string,
    input: {
      readonly nodeId: string;
      readonly checkpointId: string;
      readonly predictedUci: string;
      readonly distribution: OpponentSelection;
      readonly at?: string;
    },
  ): MutationResult {
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    const pack = this.#requiredRegisteredPack(stored.run);
    if (pack === undefined || !pack.document.checkpoints.some((checkpoint) => checkpoint.id === input.checkpointId && checkpoint.interaction?.type === "prediction")) {
      throw new ServerError("INVALID_REQUEST", "Unknown prediction checkpoint");
    }
    if (stored.run.activeCursor.nodeId !== input.nodeId) {
      throw new ServerError("INVALID_REQUEST", "Prediction node is not the active cursor");
    }
    const candidates = input.distribution.candidates ?? [];
    const candidate = candidates.find((entry) => entry.moveUci === input.predictedUci);
    const next = appendEvents(stored.run, [{
      type: "prediction.recorded",
      at: input.at ?? new Date().toISOString(),
      data: {
        nodeId: input.nodeId,
        checkpointId: input.checkpointId,
        predictedUci: input.predictedUci,
        predictedMass: candidate?.mass ?? null,
        predictedRank: candidate?.rank ?? null,
        candidateCount: candidates.length,
        distribution: input.distribution,
      },
    }]);
    this.#storage.save(next, lease);
    return { run: next, emitted: next.events.slice(stored.run.events.length) };
  }

  recordReasoning(
    runId: string,
    principal: Principal,
    writerId: string,
    input: {
      readonly nodeId: string;
      readonly checkpointEventSeq: number;
      readonly transcript?: ReasoningTranscript;
      readonly skipped?: true;
      readonly at?: string;
    },
  ): MutationResult & { readonly reasoning: ReasoningPage } {
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId, stored.run);
    const pack = this.#requiredRegisteredPack(stored.run);
    if (pack === undefined) throw new ServerError("INVALID_REQUEST", "Stated reasoning requires a pack run");
    if (stored.run.activeCursor.nodeId !== input.nodeId) throw new ServerError("INVALID_REQUEST", "Reasoning node is not the active cursor");
    const checkpointEvent = stored.run.events[input.checkpointEventSeq - 1];
    if (checkpointEvent?.type !== "checkpoint.reached" || checkpointEvent.data.nodeId !== input.nodeId) throw new ServerError("INVALID_REQUEST", "Unknown reasoning checkpoint occurrence");
    const checkpoint = pack.document.checkpoints.find((candidate) => candidate.id === checkpointEvent.data.checkpointId);
    if (checkpoint?.interaction?.type !== "stated_reasoning") throw new ServerError("INVALID_REQUEST", "Unknown stated-reasoning checkpoint");
    const pathIds = new Set(historyFrom(stored.run, stored.run.activeCursor.nodeId).map((node) => node.id));
    const latest = stored.run.events.filter((event) => event.type === "checkpoint.reached" && event.data.checkpointId === checkpoint.id && pathIds.has(event.data.nodeId)).at(-1);
    if (latest?.seq !== checkpointEvent.seq) throw new ServerError("INVALID_REQUEST", "Reasoning checkpoint occurrence is stale");
    if (stored.run.events.some((event) => event.type === "reasoning.recorded" && event.data.checkpointEventSeq === checkpointEvent.seq)) throw new ServerError("INVALID_REQUEST", "Reasoning was already recorded for this occurrence");
    const skipped = input.skipped === true;
    if (skipped === (input.transcript !== undefined)) throw new ServerError("INVALID_REQUEST", "Submit either a transcript or skipped: true");
    let transcript: ReasoningTranscript | null = null;
    if (!skipped) {
      const value = input.transcript!;
      if (!Array.isArray(value.candidates) || value.candidates.length > 8 || value.candidates.some((item) => typeof item !== "string" || item.length < 1 || item.length > 120) || typeof value.plan !== "string" || value.plan.trim().length === 0 || value.plan.length > 1000 || typeof value.fears !== "string" || value.fears.length > 500) throw new ServerError("INVALID_REQUEST", "Reasoning transcript exceeds its closed field limits");
      transcript = Object.freeze({ candidates: Object.freeze([...value.candidates]), plan: value.plan, fears: value.fears });
    }
    const detections = transcript === null ? Object.freeze([]) : matchKeyPoints(checkpoint.interaction.keyPoints, transcript, stored.run.nodes.find((node) => node.id === input.nodeId)!.fen);
    const next = appendEvents(stored.run, [{
      type: "reasoning.recorded",
      at: input.at ?? new Date().toISOString(),
      data: { nodeId: input.nodeId, checkpointId: checkpoint.id, checkpointEventSeq: checkpointEvent.seq, skipped, transcript, matcherVersion: 1, detections },
    }]);
    this.#storage.save(next, lease);
    this.#project(next, lease.learnerId);
    return Object.freeze({ run: next, emitted: Object.freeze(next.events.slice(stored.run.events.length)), reasoning: this.reasoning(runId, principal, checkpoint.id) });
  }

  reasoning(runId: string, principal: Principal, checkpointId: string): ReasoningPage {
    const access = requireRead(this.#storage, runId, principal);
    const run = access.stored.run;
    const pack = this.#requiredRegisteredPack(run);
    if (pack === undefined) throw new ServerError("INVALID_REQUEST", "Stated reasoning requires a pack run");
    const current = reasoningEvents(run, checkpointId);
    const occurrences = Object.freeze(current.map((event) => occurrenceView(run, pack, event, this.#shapes)));
    let previous: ReasoningPreviousView | null = null;
    if (current.length > 1) {
      const event = current[current.length - 2]!;
      previous = Object.freeze({ runId, eventSeq: event.seq, skipped: event.data.skipped, transcript: event.data.transcript, detections: event.data.detections });
    } else if (this.#storage.ownerLearnerId?.(runId) === principal.learnerId && run.packId !== null && run.packDigest !== null) {
      const candidates = this.#progress?.progress(principal.learnerId).filter((attempt) => attempt.runId !== runId && attempt.packId === run.packId && attempt.packDigest === run.packDigest) ?? [];
      for (const candidateRunId of [...new Set(candidates.map((attempt) => attempt.runId))].slice(0, 5)) {
        const candidate = this.#storage.read(candidateRunId)?.run;
        if (candidate === undefined) continue;
        const event = reasoningEvents(candidate, checkpointId).at(-1);
        if (event === undefined) continue;
        previous = Object.freeze({ runId: candidate.id, eventSeq: event.seq, skipped: event.data.skipped, transcript: event.data.transcript, detections: event.data.detections });
        break;
      }
    }
    return Object.freeze({ checkpointId, occurrences, previous, absenceSentence: NO_PREVIOUS_REASONING, honestySentence: REASONING_HONESTY });
  }

  reasoningReviewAccess(runId: string, principal: Principal, checkpointEventSeq: number) {
    const access = requireRead(this.#storage, runId, principal);
    const run = access.stored.run;
    const pack = this.#requiredRegisteredPack(run);
    if (pack === undefined) throw new ServerError("INVALID_REQUEST", "Stated reasoning requires a pack run");
    const event = run.events.find((candidate) => candidate.type === "reasoning.recorded" && candidate.data.checkpointEventSeq === checkpointEventSeq);
    if (event === undefined || event.type !== "reasoning.recorded" || event.data.skipped || event.data.transcript === null) throw new ServerError("INVALID_REQUEST", "Recorded reasoning is unavailable for review");
    if (!reasoningDeliveryOpen(run, checkpointEventSeq)) throw new ServerError("FEEDBACK_WITHHELD", "Reasoning key points are still withheld");
    const node = run.nodes.find((candidate) => candidate.id === event.data.nodeId);
    const checkpoint = pack.document.checkpoints.find((candidate) => candidate.id === event.data.checkpointId);
    if (node === undefined || checkpoint?.interaction?.type !== "stated_reasoning") throw new ServerError("INVALID_REQUEST", "Reasoning occurrence is not resolvable");
    return Object.freeze({ run, node, pack, event, keyPoints: checkpoint.interaction.keyPoints });
  }

  simulate(
    runId: string,
    principal: Principal,
    writerId: string,
    options: { readonly maxBranches?: number; readonly maxPlies?: number; readonly at?: string } = {},
  ): {
    readonly simulationId: string;
    readonly comparison: BranchComparison;
    readonly branches: readonly { index: number; label: string; leafFen: string; plies: number }[];
  } {
    const { stored } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    const pack = this.#requiredRegisteredPack(stored.run);
    if (pack === undefined) throw new ServerError("NO_AUTHORED_VARIATIONS", "Position sessions have no authored variations");
    const maxBranches = options.maxBranches ?? 4;
    const maxPlies = options.maxPlies ?? 12;
    if (!Number.isSafeInteger(maxBranches) || maxBranches < 1 || maxBranches > 4 || !Number.isSafeInteger(maxPlies) || maxPlies < 1 || maxPlies > 12) {
      throw new ServerError("SIMULATE_TOO_LARGE", "Simulation is limited to 4 branches and 12 plies");
    }
    const find = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[], id: string): import("@chess-tabiya/schema/drill-pack").SpineNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const child = find(node.children, id);
        if (child) return child;
      }
      return undefined;
    };
    const current = stored.run.nodes.find((node) => node.id === stored.run.activeCursor.nodeId)!;
    const memberships = lineMembership(
      expandPackAuthoredBoundary(
        pack.document,
        planSignatureResolver(pack.document, this.#shapes),
      ),
      stored.run,
      current.id,
    );
    const currentSpineId = memberships.at(-1)?.spineNodeId;
    const choices = (currentSpineId === undefined ? pack.document.spine : find(pack.document.spine ?? [], currentSpineId)?.children) ?? [];
    if (choices.length < 2) throw new ServerError("NO_AUTHORED_VARIATIONS", "This position has fewer than two authored variations");
    const selected = choices.slice(0, maxBranches);
    let scratch = stored.run;
    const branchIds: string[] = [];
    const moves: string[][] = [];
    const sourceNodeId = current.id;
    for (const [choiceIndex, choice] of selected.entries()) {
      if (choiceIndex > 0) scratch = rewind(scratch, sourceNodeId, options.at).run;
      scratch = fork(scratch, sourceNodeId, {
        label: `simulation-${choiceIndex + 1}`,
        origin: "simulated",
        ...(options.at === undefined ? {} : { at: options.at }),
      }).run;
      const branchId = scratch.activeCursor.branchId;
      const line: string[] = [];
      let node: import("@chess-tabiya/schema/drill-pack").SpineNode | undefined = choice;
      while (node !== undefined && line.length < maxPlies) {
        scratch = commitMove(scratch, node.moveUci, {
          actor: "system",
          ...(options.at === undefined ? {} : { at: options.at }),
        }).run;
        line.push(node.moveUci);
        node = node.children.length === 1 ? node.children[0] : undefined;
      }
      branchIds.push(branchId);
      moves.push(line);
    }
    const simulationId = randomUUID();
    this.#simulations.set(simulationId, { runId, sourceNodeId, scratch, branchIds, moves, createdAt: Date.now() });
    return Object.freeze({
      simulationId,
      comparison: compareBranches(scratch, branchIds, {
        pack: expandPackAuthoredBoundary(
          pack.document,
          planSignatureResolver(pack.document, this.#shapes),
        ),
      }),
      branches: Object.freeze(branchIds.map((branchId, indexValue) => ({
        index: indexValue,
        label: scratch.branches.find((branch) => branch.id === branchId)!.label,
        leafFen: branchPath(scratch, branchId).at(-1)!.fen,
        plies: moves[indexValue]!.length,
      }))),
    });
  }

  enterSimulation(
    runId: string,
    principal: Principal,
    writerId: string,
    simulationId: string,
    branchIndex: number,
    at?: string,
  ): MutationResult {
    const simulation = this.#simulations.get(simulationId);
    if (!simulation || simulation.runId !== runId || Date.now() - simulation.createdAt > 10 * 60_000) {
      throw new ServerError("SIMULATION_EXPIRED", "Simulation is missing or expired");
    }
    const moves = simulation.moves[branchIndex];
    if (!moves) throw new ServerError("INVALID_REQUEST", "Unknown simulation branch");
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    let result = fork(stored.run, simulation.sourceNodeId, {
      label: `simulation-${branchIndex + 1}`,
      origin: "simulated",
      ...(at === undefined ? {} : { at }),
    });
    const emitted = [...result.emitted];
    for (const uci of moves) {
      const committed = commitMove(result.run, uci, {
        actor: "system",
        ...(at === undefined ? {} : { at }),
      });
      result = committed;
      emitted.push(...committed.emitted);
    }
    this.#storage.save(result.run, lease);
    this.#project(result.run, lease.learnerId);
    return { run: result.run, emitted: Object.freeze(emitted) };
  }

  evidence(runId: string, principalOrSeq?: Principal | number, maybeSeq = 0): EvidencePage {
    const principal = typeof principalOrSeq === "object" ? principalOrSeq : this.#principal("legacy-reader");
    const sinceSeq = typeof principalOrSeq === "number" ? principalOrSeq : maybeSeq;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    if (!feedbackDeliveryOpen(run)) {
      return Object.freeze({ results: Object.freeze([]), nextSeq: sinceSeq });
    }
    return this.#requiredEvidenceQueue().page(runId, sinceSeq);
  }

  authoredFeedback(runId: string, principalInput?: Principal): AuthoredFeedbackPage {
    const principal = principalInput ?? this.#principal("legacy-reader");
    const run = requireRead(this.#storage, runId, principal).stored.run;
    if (!isPackSession(run)) {
      return Object.freeze({ items: Object.freeze([]), hasWithheldAuthoredContent: false });
    }
    const pack = this.#requiredRegisteredPack(run)!;
    return projectAuthoredFeedback(pack, run, this.#shapes);
  }

  applyEvidence(
    runId: string,
    principalOrWriter: Principal | string,
    writerOrSeq: string | number,
    seqOrAt?: number | string,
    maybeAt = new Date().toISOString(),
  ): MutationResult {
    const principal = this.#principal(principalOrWriter);
    const writerId = typeof principalOrWriter === "string" ? principalOrWriter : writerOrSeq as string;
    const resultSeq = typeof principalOrWriter === "string" ? writerOrSeq as number : seqOrAt as number;
    const at = typeof principalOrWriter === "string" ? (seqOrAt as string | undefined) ?? new Date().toISOString() : maybeAt;
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    if (!feedbackDeliveryOpen(stored.run)) {
      throw new ServerError(
        "FEEDBACK_WITHHELD",
        "Evidence is withheld by the run feedback policy",
      );
    }
    const queue = this.#requiredEvidenceQueue();
    const staged = queue.result(runId, resultSeq);
    if (staged === undefined) {
      throw new ServerError(
        "EVIDENCE_RESULT_NOT_FOUND",
        `Unknown staged evidence result: ${resultSeq}`,
      );
    }

    const attached = attachEvidence(
      stored.run,
      staged.nodeId,
      staged.evidenceRefs,
      staged.payload,
      at,
    );
    const upgraded =
      staged.objectiveProposal === undefined
        ? attached
        : applyObjectiveEvidenceProposal(
            attached.run,
            staged.objectiveProposal,
            at,
          );
    let result: MutationResult = Object.freeze({
      run: upgraded.run,
      emitted: Object.freeze([
        ...attached.emitted,
        ...(upgraded === attached ? [] : upgraded.emitted),
      ]),
    });
    const pack = this.#requiredRegisteredPack(result.run);
    if (pack !== undefined && result.run.feedbackPolicy === "immediate_guard") {
      const guarded = applyRecordedEngineGuard(
        pack.document,
        result.run,
        staged.nodeId,
        staged.evidenceRefs,
        at,
      );
      result = Object.freeze({
        run: guarded.run,
        emitted: Object.freeze([...result.emitted, ...guarded.emitted]),
      });
    }
    this.#storage.save(result.run, lease);
    this.#project(result.run, lease.learnerId);
    queue.consume(runId, resultSeq);
    return result;
  }

  async pgn(runId: string, principalOrBranches?: Principal | readonly string[], maybeBranches?: readonly string[]): Promise<string> {
    const principal = Array.isArray(principalOrBranches) || principalOrBranches === undefined
      ? this.#principal("legacy-reader")
      : principalOrBranches as Principal;
    const branchIds = Array.isArray(principalOrBranches) ? principalOrBranches : maybeBranches;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const marks = this.marks(runId, principal);
    const headers = { TabiyaMarks: `own (${marks.length}); other authors' marks are not exported` };
    const pack = this.#requiredRegisteredPack(run);
    if (run.sessionKind === "imported") {
      const record = this.#storage.importedGame?.(run.id);
      if (record === undefined) throw new ServerError("STORAGE_FAILURE", "Imported run has no import record");
      const importedHeaders: Record<string, string> = {
        ...(record.headers.White === undefined ? {} : { White: record.headers.White }),
        ...(record.headers.Black === undefined ? {} : { Black: record.headers.Black }),
        ...(record.headers.Date === undefined ? {} : { Date: record.headers.Date }),
        Result: record.result,
        ...(record.headers.Event === undefined ? {} : { SourceEvent: record.headers.Event }),
        ...(record.headers.Site === undefined ? {} : { SourceSite: record.headers.Site }),
      };
      return exportPgn(run, branchIds, { ...importedHeaders, ...headers }, marks);
    }
    return pack === undefined
      ? exportPgn(run, branchIds, headers, marks)
      : exportPackRunPgn(pack.document, run, branchIds, marks, headers);
  }

  reveal(runId: string, writerId: string, at?: string): MutationResult;
  reveal(runId: string, principal: Principal, writerId: string, at?: string): MutationResult;
  reveal(
    runId: string,
    principalOrWriter: Principal | string,
    writerOrAt?: string,
    maybeAt?: string,
  ): MutationResult {
    const principal = this.#principal(principalOrWriter);
    const writerId = typeof principalOrWriter === "string" ? principalOrWriter : writerOrAt!;
    const at = typeof principalOrWriter === "string" ? writerOrAt : maybeAt;
    this.#refuseRatedAssistance(runId);
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    this.#refuseWhileMatchLive(runId,stored.run);
    if (stored.run.feedbackPolicy !== "attempt_end") {
      throw new ServerError(
        "INVALID_REQUEST",
        `Run ${runId} reveals feedback by its ${stored.run.feedbackPolicy} policy`,
      );
    }
    const result = revealFeedback(stored.run, at);
    if (result.emitted.length > 0) {
      this.#storage.save(result.run, lease);
      this.#project(result.run, lease.learnerId);
    }
    return result;
  }

  progress(principal: Principal): readonly StoredAttempt[] {
    return this.#requiredProgress().progress(principal.learnerId);
  }

  due(principal: Principal, at = new Date().toISOString()): readonly ScheduleRow[] {
    return this.#requiredProgress().dueSchedules(principal.learnerId, at);
  }

  dismissSchedule(scheduleId: string, principal: Principal): void {
    this.#requiredProgress().dismissSchedule(scheduleId, principal.learnerId);
  }

  related(runId: string, nodeId: string, principal: Principal) {
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const node = run.nodes.find((candidate) => candidate.id === nodeId);
    if (node === undefined) throw new ServerError("INVALID_REQUEST", `Unknown node: ${nodeId}`);
    return this.#requiredProgress().related(principal.learnerId, runId, node.transposeKey);
  }

  progressMetrics(principal: Principal) {
    return this.#requiredProgress().metrics(principal.learnerId);
  }

  async duplicate(
    sourceRunId: string,
    principal: Principal,
    input: {
      readonly id: string;
      readonly writerId: string;
      readonly seed: number;
      readonly scheduleId?: string;
      readonly createdAt?: string;
    },
  ): Promise<DrillRun> {
    const source = requireRead(this.#storage, sourceRunId, principal).stored.run;
    this.#refuseWhileMatchLive(sourceRunId,source);
    const request: CreateRunRequest = {
      id: input.id,
      session: isPackSession(source)
        ? { kind: "pack", packId: source.packId, packDigest: source.packDigest }
        : {
            kind: "position",
            start: source.start,
            feedbackPolicy: "attempt_end",
            opponentPolicy: (source.opponentPolicy.mode === "theory_strict" || source.opponentPolicy.mode === "perfect_tablebase"
              ? (() => { throw new ServerError("INVALID_REQUEST", "Position run cannot use a pack-only opponent mode"); })()
              : source.opponentPolicy) as PositionOpponentPolicy,
          },
      policyConfig: source.policyConfig,
      seed: input.seed,
      ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      intent: {
        origin: "duplicate",
        ...(input.scheduleId === undefined ? {} : { scheduleId: input.scheduleId }),
        derivedFromRunId: sourceRunId,
      },
    };
    return this.create(request, { writerId: input.writerId, learnerId: principal.learnerId });
  }

  schedule(
    runId: string,
    principal: Principal,
    writerId: string,
    input: {
      readonly nodeId: string;
      readonly kind: "blocked" | "varied";
      readonly variant?: string;
      readonly dueAt?: string;
      readonly at?: string;
    },
  ): { readonly schedule: ScheduleRow; readonly result: MutationResult } {
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
    const node = stored.run.nodes.find((candidate) => candidate.id === input.nodeId);
    if (node === undefined) {
      throw new ServerError("INVALID_REQUEST", `Unknown node: ${input.nodeId}`);
    }
    if (stored.run.sessionKind === "imported") {
      throw new ServerError("INVALID_REQUEST", "Imported games enter progression by creating a position run from a story moment");
    }
    const at = input.at ?? new Date().toISOString();
    const scheduleId = randomUUID();
    const schedule = this.#requiredProgress().createSchedule({
      id: scheduleId,
      learnerId: principal.learnerId,
      rootKey: progressRootKey(stored.run.sessionKind, stored.run.packId ?? null, node.transposeKey),
      sessionKind: stored.run.sessionKind,
      packId: stored.run.packId ?? null,
      rootTransposeKey: node.transposeKey,
      kind: input.kind,
      variant: input.variant ?? null,
      origin: "learner",
      dueAt: input.dueAt ?? at,
      createdAt: at,
      sourceRunId: runId,
      sourceNodeId: node.id,
    });
    const nextRun = appendEvents(stored.run, [{
      type: "transfer.scheduled",
      at,
      data: { nodeId: node.id, scheduleId },
    }]);
    const result: MutationResult = Object.freeze({
      run: nextRun,
      emitted: Object.freeze([nextRun.events.at(-1)!]),
    });
    try {
      this.#storage.save(result.run, lease);
    } catch (error) {
      this.#requiredProgress().dismissSchedule(scheduleId, principal.learnerId);
      throw error;
    }
    this.#project(result.run, lease.learnerId);
    return Object.freeze({ schedule, result });
  }

  #ensureStoryEvidence(run: DrillRun, branchId: string): { readonly ready: boolean; readonly pending: number; readonly enqueued: number } {
    const path = branchPath(run, branchId);
    const durable = new Set(run.events.flatMap((event) =>
      event.type === "evidence.attached" && event.data.payload.kind === "eval" &&
      event.data.payload.source === "engine_validated"
        ? [event.data.nodeId]
        : [],
    ));
    const queue = this.#evidenceQueue;
    if (queue === undefined) {
      return Object.freeze({ ready: false, pending: path.filter((node) => !durable.has(node.id)).length, enqueued: 0 });
    }
    const failed = new Set(queue.failures(run.id).filter((failure) => failure.kind === "eval").map((failure) => failure.nodeId));
    const outstanding = new Set(queue.outstanding(run.id).filter((job) => job.kind === "eval").map((job) => job.nodeId));
    let enqueued = 0;
    for (const node of path) {
      if (durable.has(node.id) || failed.has(node.id) || outstanding.has(node.id)) continue;
      queue.enqueue({ runId: run.id, nodeId: node.id, fen: node.fen, kind: "eval", movetime: this.#evidenceMovetimeMs });
      outstanding.add(node.id);
      enqueued += 1;
    }
    const ready = path.every((node) => durable.has(node.id) || failed.has(node.id));
    return Object.freeze({ ready, pending: path.filter((node) => !durable.has(node.id) && !failed.has(node.id)).length, enqueued });
  }

  #required(runId: string): StoredRun {
    const stored = this.#storage.read(runId);
    if (!stored) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
    return stored;
  }

  #requiredProgress(): ProgressStorage {
    if (this.#progress === undefined) {
      throw new ServerError("STORAGE_FAILURE", "Progress storage is not configured");
    }
    return this.#progress;
  }

  #matchContext(runId:string){
    const session=this.#storage.liveSessionByRun?.(runId);
    if(session?.boardControl!=="match")return undefined;
    const state=this.#storage.matchState?.(session.id);
    if(state===undefined)throw new ServerError("STORAGE_FAILURE","Native match state is missing");
    return Object.freeze({session,state});
  }

  #assistanceContext(runId: string, principal: Principal, run: DrillRun, _role: RunRole) {
    const session = this.#storage.liveSessionByRun?.(runId);
    const liveSessionOpen = session !== undefined && session.closedAt === undefined;
    const match = session === undefined ? undefined : this.#storage.matchState?.(session.id);
    const seatedInContest = liveSessionOpen && match !== undefined &&
      (match.whiteLearnerId === principal.learnerId || match.blackLearnerId === principal.learnerId);
    return Object.freeze({
      seatedInContest,
      workflowContext: deriveWorkflowContext({ sessionKind: run.sessionKind, feedbackPolicy: run.feedbackPolicy, ...(session === undefined ? {} : { liveKind: session.kind }) }),
      reviewing: reviewingGrant({
        run,
        grantMintedBySubmission: this.#storage.grantMintedBySubmission(runId, principal.learnerId),
        liveSessionOpen,
      }),
    });
  }

  #refuseWhileMatchLive(runId:string,run:DrillRun):void{
    const context=this.#matchContext(runId);if(context===undefined||context.state.pausedAt!==null)return;
    const node=run.nodes.find((candidate)=>candidate.id===run.activeCursor.nodeId);
    if(node!==undefined&&terminalPosition(node.fen))return;
    throw new ServerError("MATCH_LIVE","Pause the match before rehearsing or revealing");
  }

  #refuseImportedMainlineExtension(run: DrillRun): void {
    if (run.sessionKind !== "imported") return;
    const primary = run.branches[0];
    if (primary === undefined || run.activeCursor.branchId !== primary.id) return;
    const hasPrimaryChild = run.nodes.some((node) =>
      node.branchId === primary.id && node.parentId === run.activeCursor.nodeId,
    );
    if (!hasPrimaryChild) {
      throw new ServerError(
        "INVALID_REQUEST",
        "The imported source mainline is immutable; rewind before creating a rehearsal branch",
      );
    }
  }

  #matchMoveOptions(runId:string,principal:Principal,run:DrillRun,options:CommitMoveOptions):CommitMoveOptions{
    const context=this.#matchContext(runId);if(context===undefined)return options;
    if(options.actor!==undefined||options.selection!==undefined)throw new ServerError("INVALID_REQUEST","Native match moves derive their actor from the seated player");
    const node=run.nodes.find((candidate)=>candidate.id===run.activeCursor.nodeId);if(node===undefined)throw new ServerError("STORAGE_FAILURE","Match cursor node is missing");
    const primary=run.branches[0]!,tip=run.nodes.filter((candidate)=>candidate.branchId===primary.id).sort((a,b)=>b.ply-a.ply)[0]!;
    if(context.state.pausedAt!==null){
      if(run.activeCursor.nodeId===tip.id&&run.activeCursor.branchId===primary.id)throw new ServerError("MATCH_MAINLINE_LOCKED","Resume the match before extending its main line");
    }else{
      if(run.activeCursor.nodeId!==tip.id||run.activeCursor.branchId!==primary.id)throw new ServerError("MATCH_LIVE","Live match play must continue from the main line");
      const whiteToMove=node.fen.split(" ")[1]==="w",expected=whiteToMove?context.state.whiteLearnerId:context.state.blackLearnerId;
      if(expected===null||expected!==principal.learnerId)throw new ServerError("BOARD_HELD","It is another learner's move");
    }
    const moverSide=node.fen.split(" ")[1]==="w"?"white":"black";
    return Object.freeze({...options,actor:moverSide===run.start.side?"user":"system"});
  }

  #project(
    run: DrillRun,
    learnerId: string,
    origins?: Readonly<Record<string, AttemptOriginInput>>,
  ): void {
    if (this.#progress !== undefined) {
      const pack = this.#registeredPack(run)?.document;
      const projection = projectAttempts({
        run,
        learnerId,
        ...(pack === undefined ? {} : { pack }),
        ...(pack === undefined ? {} : { resolvePlanSignature: planSignatureResolver(pack, this.#shapes) }),
        ...(origins === undefined ? {} : { origins }),
      });
      const match=this.#matchContext(run.id);
      const primary=run.branches[0]?.id;
      const attempts=match===undefined||primary===undefined?projection.attempts:Object.freeze(projection.attempts.map((attempt)=>attempt.branchId===primary?Object.freeze({...attempt,countable:false}):attempt));
      this.#progress.upsertAttempts(attempts, projection.conceptTags);
    }
    this.#projectRatedGame(run);
  }

  #projectRatedGame(run: DrillRun): void {
    const rating = this.#rating;
    const game = rating?.ratedGame(run.id);
    if (rating === undefined || game?.state !== "open") return;
    const rewound = run.events.find((event) => event.type === "run.rewound");
    if (rewound !== undefined) {
      rating.voidRatedGame(run.id, "rewound", rewound.at);
      return;
    }
    const forked = run.events.find((event) => event.type === "branch.forked");
    if (run.branches.length !== 1 || forked !== undefined) {
      rating.voidRatedGame(run.id, "forked", forked?.at ?? new Date().toISOString());
      return;
    }
    const engineChanged = run.events.find((event) => {
      if (event.type !== "opponent.move_selected") return false;
      const engine = event.data.selection.engine;
      return engine.id !== RATED_OPPONENT_CALIBRATION.engine.id ||
        engine.modelId !== RATED_OPPONENT_CALIBRATION.engine.modelId ||
        engine.containerDigest !== game.engineIdentityDigest ||
        engine.eloHonored !== true || engine.eloApplied !== game.opponentBand;
    });
    if (engineChanged !== undefined) {
      rating.voidRatedGame(run.id, "engine_changed", engineChanged.at);
      return;
    }
    const outcome = run.events.find((event) => event.type === "outcome.reached");
    if (outcome?.type !== "outcome.reached") return;
    const node = run.nodes.find((candidate) => candidate.id === outcome.data.nodeId);
    if (node === undefined) throw new ServerError("STORAGE_FAILURE", "Rated outcome references a missing node");
    rating.sealRatedGame({
      runId: run.id,
      result: outcome.data.outcome,
      terminalReason: ratedTerminalReason(run, node.id),
      plyCount: node.ply,
      sealedAt: outcome.at,
    });
  }

  #refuseRatedAssistance(runId: string): void {
    if (this.#rating?.ratedGame(runId)?.state === "open") {
      throw new ServerError("ASSISTANCE_WITHHELD", "Server-routed assistance is withheld until the rated game ends");
    }
  }

  #principal(value: Principal | string): Principal {
    if (typeof value !== "string") return value;
    if (this.#storage.learnerById("__legacy") === undefined) {
      this.#storage.createLearner({
        id: "__legacy",
        handle: "__legacy",
        createdAt: new Date(0).toISOString(),
        passwordHash: "!",
      });
    }
    return Object.freeze({ learnerId: "__legacy", handle: "__legacy" });
  }

  #lease(value: LeaseHolder | string): LeaseHolder {
    if (typeof value !== "string") return value;
    const principal = this.#principal(value);
    return Object.freeze({ writerId: value, learnerId: principal.learnerId });
  }

  grants(runId: string, principal: Principal): readonly RunGrant[] {
    const { role } = requireRead(this.#storage, runId, principal);
    if (!mayManageGrants(role)) {
      throw new ServerError("FORBIDDEN", "Only a host may manage grants");
    }
    return this.#storage.grants(runId);
  }

  updateGrant(
    runId: string,
    principal: Principal,
    writerId: string,
    operation:
      | { readonly op: "grant"; readonly handle: string; readonly role: RunRole }
      | { readonly op: "revoke"; readonly handle: string },
    at = new Date().toISOString(),
  ): readonly RunGrant[] {
    const { role } = requireRead(this.#storage, runId, principal);
    if (!mayManageGrants(role)) {
      throw new ServerError("FORBIDDEN", "Only a host may manage grants");
    }
    const target = this.#storage.learnerByHandle(operation.handle.toLowerCase());
    if (target === undefined || target.id === "__legacy") {
      throw new ServerError("INVALID_REQUEST", `Unknown learner handle: ${operation.handle}`);
    }
    const actor = Object.freeze({ writerId, learnerId: principal.learnerId });
    if (operation.op === "grant") {
      this.#storage.grantRole(runId, target.id, operation.role, actor, at);
    } else {
      this.#storage.revokeGrant(runId, target.id, actor);
    }
    return this.#storage.grants(runId);
  }

  claimLease(runId: string, principal: Principal, writerId: string, expectedHolderLearnerId?: string): void {
    const { role } = requireRead(this.#storage, runId, principal);
    if (!mayWrite(role)) {
      throw new ServerError("FORBIDDEN", "This learner may not claim the run lease");
    }
    this.#storage.claimLease(runId, { writerId, learnerId: principal.learnerId }, expectedHolderLearnerId);
  }

  #forWrite(runId: string, principal: Principal, writerId: string) {
    return requireWrite(this.#storage, runId, principal, writerId);
  }

  #registeredPack(run: DrillRun): PackRecord | undefined {
    if (!isPackSession(run)) return undefined;
    return this.#packRegistry?.byDigest(run.packDigest);
  }

  #requiredRegisteredPack(run: DrillRun): PackRecord | undefined {
    if (!isPackSession(run)) return undefined;
    const pack = this.#registeredPack(run);
    if (pack === undefined) {
      throw new ServerError("PACK_UNRESOLVABLE", `Run ${run.id} references unavailable pack bytes`, {
        details: { runId: run.id, packId: run.packId, digest: run.packDigest },
      });
    }
    return pack;
  }

  #enqueueMoveEvidence(run: DrillRun, nodeId = run.activeCursor.nodeId): void {
    const node = run.nodes.find((candidate) => candidate.id === nodeId);
    if (node === undefined) throw new TypeError("Run active cursor has no node");
    const queue = this.#requiredEvidenceQueue();
    if (this.#tablebase !== undefined && countFenPieces(node.fen) <= 7 &&
      !queue.outstanding(run.id).some((job) => job.nodeId === node.id && job.kind === "tablebase") &&
      !run.events.some((event) => event.type === "evidence.attached" && event.data.nodeId === node.id && event.data.payload.kind === "tablebase")) {
      queue.enqueueProducer({ runId: run.id, nodeId: node.id, fen: node.fen, kind: "tablebase" });
    }
    queue.enqueue({
      runId: run.id,
      nodeId,
      fen: node.fen,
      kind: "eval",
      movetime: this.#evidenceMovetimeMs,
      ...(isPackSession(run) ? {
        objectiveRequest: Object.freeze({
          runId: run.id,
          packId: run.packId,
          packDigest: run.packDigest,
          nodeId: node.id,
          fen: node.fen,
          objectiveState: node.objectiveState,
          evidenceRefs: node.evidenceRefs,
          policyConfig: run.policyConfig,
        }),
      } : {}),
    });
  }

  #selectionRequest(
    run: DrillRun,
    nodeId: string,
    pack: PackRecord | undefined,
    authored: RunOpponentPolicy,
    seed: number,
  ): SelectMoveRequest {
    return Object.freeze({
      startFen: run.start.fen,
      historyUci: Object.freeze(historyFrom(run, nodeId).flatMap((node) => node.moveUci === null ? [] : [node.moveUci])),
      policy: Object.freeze({
        mode: authored.mode,
        policyConfigDigest: run.sessionDigest,
        ...(authored.targetElo === undefined ? {} : { targetElo: authored.targetElo }),
        ...(authored.temperature === undefined ? {} : { temperature: authored.temperature }),
        ...(authored.topP === undefined ? {} : { topP: authored.topP }),
        ...(pack?.document.spine === undefined ? {} : { spine: pack.document.spine }),
      }),
      seed,
      ...(pack === undefined ? {} : { packId: pack.document.id }),
    });
  }

  #policyAt(run: DrillRun, nodeId: string, pack: PackRecord | undefined): RunOpponentPolicy {
    if (pack === undefined) return run.opponentPolicy;
    return trajectoryPolicyAt(pack.document, run, nodeId)?.policy ?? run.opponentPolicy;
  }

  #requiredOpponentSelector(): OpponentSelector {
    if (this.#opponentSelector === undefined) {
      throw new ServerError("ENGINE_UNAVAILABLE", "Opponent selector is not configured", {
        details: { engineId: "opponent-selector", retryAfterMs: 0 },
      });
    }
    return this.#opponentSelector;
  }

  #requiredPackRegistry(): PackRegistry {
    if (this.#packRegistry === undefined) {
      throw new ServerError("PACK_NOT_FOUND", "Pack registry is not configured");
    }
    return this.#packRegistry;
  }

  #requiredEvidenceQueue(): EvidenceJobQueue {
    if (this.#evidenceQueue === undefined) {
      throw new ServerError(
        "EVIDENCE_UNAVAILABLE",
        "Evidence queue is not configured",
      );
    }
    return this.#evidenceQueue;
  }
}
