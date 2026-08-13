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
  canonicalRunStart,
  digestSessionSource,
  isPackSession,
  lineMembership,
  revealFeedback,
  isEngineEvidenceRef,
  rewind,
  rewindToCheckpoint,
  type BranchComparison,
  type AppendOpponentPlyOptions,
  type CommitMoveOptions,
  type CreateRunInput,
  type DrillRun,
  type DrillRunEvent,
  type EvidenceKind,
  type ForkOptions,
  type MutationResult,
  type OpponentSelection,
  type PositionOpponentPolicy,
} from "@chess-tabiya/runtime";
import { randomUUID } from "node:crypto";

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
import { orchestratePackMove } from "./pack-orchestrator.js";
import {
  PackRegistry,
  type PackRecord,
  type PackSummary,
} from "./pack-registry.js";
import type { RunStorage, RunSummary, StoredRun } from "./storage.js";
import type { ProgressStorage, ScheduleRow, StoredAttempt } from "./storage.js";
import {
  projectAttempts,
  rootKey as progressRootKey,
  type AttemptOriginInput,
} from "./progress.js";
import { DEFAULT_STRONG_ENGINE_PROFILE } from "./strong-engine.js";
import {
  mayManageGrants,
  mayWrite,
  requireRead,
  requireWrite,
  type Principal,
} from "./authorization.js";
import type { LeaseHolder, RunGrant, RunRole } from "./storage.js";

export interface RunViewer {
  readonly role: RunRole;
  readonly mayWrite: boolean;
  readonly holdsLease: boolean;
  readonly leaseHeldBy: { readonly learnerId: string; readonly handle: string };
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
              (reference) => !isEngineEvidenceRef(reference),
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

export type RewindTarget =
  | { readonly nodeId: string; readonly checkpointId?: never }
  | { readonly checkpointId: string; readonly nodeId?: never };

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

export class RunService {
  readonly #storage: RunStorage;
  readonly #evidenceQueue: EvidenceJobQueue | undefined;
  readonly #packRegistry: PackRegistry | undefined;
  readonly #evidenceMovetimeMs: number;
  readonly #progress: ProgressStorage | undefined;
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
    } = {},
  ) {
    this.#storage = storage;
    this.#evidenceQueue = options.evidenceQueue;
    this.#packRegistry = options.packRegistry;
    this.#progress = options.progressStorage;
    this.#evidenceMovetimeMs =
      options.evidenceMovetimeMs ?? DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs;
    if (!Number.isSafeInteger(this.#evidenceMovetimeMs) || this.#evidenceMovetimeMs < 1) {
      throw new TypeError("Evidence movetime must be a positive safe integer");
    }
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
    const pack = this.#requiredRegisteredPack(stored.run);
    this.#requiredEvidenceQueue();
    const committed = commitMove(stored.run, uci, options);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed);
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
    const pack = this.#requiredRegisteredPack(stored.run);
    this.#requiredEvidenceQueue();
    const committed = appendOpponentPly(stored.run, selection, options);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed);
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
    const result =
      target.nodeId === undefined
        ? rewindToCheckpoint(
            stored.run,
            target.checkpointId,
            at,
            this.#evidenceQueue,
          )
        : rewind(stored.run, target.nodeId, at, this.#evidenceQueue);
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
      }),
      nodes: publicNodes(run),
      branches: run.branches,
      activeCursor: run.activeCursor,
    });
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
    if (branchIds.length > 8) {
      throw new ServerError("TOO_MANY_BRANCHES", "At most eight branches may be compared", {
        details: { count: branchIds.length, limit: 8 },
      });
    }
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const pack = run.packId === null ? undefined : this.#requiredPackRegistry().byDigest(run.packDigest!);
    const comparison = compareBranches(run, branchIds, pack === undefined ? {} : { pack: pack.document });
    return !feedbackDisclosed(run)
      ? comparisonWithoutEngineFeedback(comparison)
      : comparison;
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
      readonly multiPv?: number;
      readonly depth?: number;
      readonly movetime?: number;
    },
  ): readonly EvidenceJob[] {
    this.#forWrite(runId, principal, writerId);
    if (input.nodeIds.length < 1 || input.nodeIds.length > 16 || new Set(input.nodeIds).size !== input.nodeIds.length) {
      throw new ServerError("INVALID_REQUEST", "analysis requires 1-16 distinct node ids");
    }
    if (input.multiPv !== undefined && (!Number.isSafeInteger(input.multiPv) || input.multiPv < 1 || input.multiPv > 8)) {
      throw new ServerError("INVALID_REQUEST", "multiPv must be an integer from 1 to 8");
    }
    return Object.freeze(input.nodeIds.map((nodeId) => this.enqueueEvidence(runId, principal, {
      nodeId,
      kind: "bestline",
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
    const memberships = lineMembership(pack.document, stored.run, current.id);
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
      comparison: compareBranches(scratch, branchIds, { pack: pack.document }),
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
    if (run.sessionKind === "position") {
      return Object.freeze({ items: Object.freeze([]), hasWithheldAuthoredContent: false });
    }
    const pack = this.#requiredRegisteredPack(run)!;
    return projectAuthoredFeedback(pack, run);
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
    const result: MutationResult = Object.freeze({
      run: upgraded.run,
      emitted: Object.freeze([
        ...attached.emitted,
        ...(upgraded === attached ? [] : upgraded.emitted),
      ]),
    });
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
    const pack = this.#requiredRegisteredPack(run);
    return pack === undefined
      ? exportPgn(run, branchIds)
      : exportPackRunPgn(pack.document, run, branchIds);
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
    const { stored, lease } = this.#forWrite(runId, principal, writerId);
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
    const request: CreateRunRequest = {
      id: input.id,
      session: isPackSession(source)
        ? { kind: "pack", packId: source.packId, packDigest: source.packDigest }
        : {
            kind: "position",
            start: source.start,
            feedbackPolicy: "attempt_end",
            opponentPolicy: (source.opponentPolicy.mode === "theory_strict"
              ? (() => { throw new ServerError("INVALID_REQUEST", "Position run cannot use theory_strict"); })()
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

  #project(
    run: DrillRun,
    learnerId: string,
    origins?: Readonly<Record<string, AttemptOriginInput>>,
  ): void {
    if (this.#progress === undefined) return;
    const pack = this.#registeredPack(run)?.document;
    const projection = projectAttempts({
      run,
      learnerId,
      ...(pack === undefined ? {} : { pack }),
      ...(origins === undefined ? {} : { origins }),
    });
    this.#progress.upsertAttempts(projection.attempts, projection.conceptTags);
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

  #enqueueMoveEvidence(run: DrillRun): void {
    const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId);
    if (node === undefined) throw new TypeError("Run active cursor has no node");
    this.#requiredEvidenceQueue().enqueue({
      runId: run.id,
      nodeId: run.activeCursor.nodeId,
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
