import {
  applyObjectiveEvidenceProposal,
  appendOpponentPly,
  assertActiveWriter,
  attachEvidence,
  commitMove,
  compare,
  createRun,
  exportPackRunPgn,
  exportPgn,
  fork,
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
} from "@chess-tabiya/runtime";

import {
  EvidenceJobQueue,
  type EvidenceJob,
  type EvidencePage,
} from "./evidence-queue.js";
import {
  projectAuthoredFeedback,
  type AuthoredFeedbackPage,
} from "./authored-feedback.js";
import { ServerError } from "./errors.js";
import {
  feedbackIsRevealed,
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
}

function comparisonWithoutEngineFeedback(
  comparison: BranchComparison,
): BranchComparison {
  const publicTimeline = (
    entries: BranchComparison["objectiveTimelines"]["a"],
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
    objectiveTimelines: Object.freeze({
      a: publicTimeline(comparison.objectiveTimelines.a),
      b: publicTimeline(comparison.objectiveTimelines.b),
    }),
    evidence: Object.freeze({
      a: Object.freeze([]),
      b: Object.freeze([]),
    }),
  });
}

export type RewindTarget =
  | { readonly nodeId: string; readonly checkpointId?: never }
  | { readonly checkpointId: string; readonly nodeId?: never };

export interface CreateRunRequest {
  readonly id: string;
  readonly packId: string;
  readonly policyConfig: CreateRunInput["policyConfig"];
  readonly seed: number;
  readonly createdAt?: string;
  readonly packDigest?: string;
  readonly startFen?: string;
}

export class RunService {
  readonly #storage: RunStorage;
  readonly #evidenceQueue: EvidenceJobQueue | undefined;
  readonly #packRegistry: PackRegistry | undefined;
  readonly #evidenceMovetimeMs: number;

  constructor(
    storage: RunStorage,
    options: {
      readonly evidenceQueue?: EvidenceJobQueue;
      readonly packRegistry?: PackRegistry;
      readonly evidenceMovetimeMs?: number;
    } = {},
  ) {
    this.#storage = storage;
    this.#evidenceQueue = options.evidenceQueue;
    this.#packRegistry = options.packRegistry;
    this.#evidenceMovetimeMs =
      options.evidenceMovetimeMs ?? DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs;
    if (!Number.isSafeInteger(this.#evidenceMovetimeMs) || this.#evidenceMovetimeMs < 1) {
      throw new TypeError("Evidence movetime must be a positive safe integer");
    }
  }

  create(input: CreateRunRequest, leaseInput: LeaseHolder | string): DrillRun {
    const lease = this.#lease(leaseInput);
    if (lease.learnerId === "__legacy") this.#principal("legacy-create");
    const pack = this.#packRegistry?.required(input.packId);
    if (
      pack !== undefined &&
      input.packDigest !== undefined &&
      input.packDigest !== pack.digest
    ) {
      throw new ServerError("INVALID_REQUEST", "Client pack digest is stale");
    }
    if (
      pack !== undefined &&
      input.startFen !== undefined &&
      input.startFen !== pack.document.start.fen
    ) {
      throw new ServerError("INVALID_REQUEST", "Client pack start FEN is stale");
    }
    const packDigest = pack?.digest ?? input.packDigest;
    const startFen = pack?.document.start.fen ?? input.startFen;
    if (packDigest === undefined || startFen === undefined) {
      throw new ServerError(
        "INVALID_REQUEST",
        "Pack-blind run creation requires packDigest and startFen",
      );
    }
    let run: DrillRun;
    try {
      run = createRun({
        id: input.id,
        packId: input.packId,
        packDigest,
        policyConfig: input.policyConfig,
        startFen,
        seed: input.seed,
        ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      });
    } catch (error) {
      throw new ServerError("INVALID_REQUEST", "Run definition is invalid", {
        cause: error,
      });
    }
    const title = pack?.document.title;
    this.#storage.create(
      run,
      lease,
      typeof title === "string" ? title : input.packId,
    );
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
    const pack = this.#registeredPack(stored.run);
    if (pack !== undefined) this.#requiredEvidenceQueue();
    const committed = commitMove(stored.run, uci, options);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed);
    this.#storage.save(result.run, lease);
    if (pack !== undefined) this.#enqueueMoveEvidence(result.run);
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
    const pack = this.#registeredPack(stored.run);
    if (pack !== undefined) this.#requiredEvidenceQueue();
    const committed = appendOpponentPly(stored.run, selection, options);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed);
    this.#storage.save(result.run, lease);
    if (pack !== undefined) this.#enqueueMoveEvidence(result.run);
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
    return result;
  }

  graph(runId: string, principalInput?: Principal, writerId?: string): RunGraph {
    const principal = principalInput ?? this.#principal("legacy-reader");
    const { stored, role } = requireRead(this.#storage, runId, principal);
    const run = stored.run;
    const pack = this.#registeredPack(run);
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
      nodes: publicNodes(pack, run),
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

  compare(runId: string, principalOrA: Principal | string, branchAOrB: string, maybeB?: string): BranchComparison {
    const principal = this.#principal(principalOrA);
    const branchAId = typeof principalOrA === "string" ? principalOrA : branchAOrB;
    const branchBId = typeof principalOrA === "string" ? branchAOrB : maybeB!;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const comparison = compare(run, branchAId, branchBId);
    const pack = this.#registeredPack(run);
    return pack !== undefined && !feedbackIsRevealed(pack, run)
      ? comparisonWithoutEngineFeedback(comparison)
      : comparison;
  }

  events(runId: string, principalOrSeq?: Principal | number, maybeSeq = 0): EventsPage {
    const principal = typeof principalOrSeq === "object" ? principalOrSeq : this.#principal("legacy-reader");
    const sinceSeq = typeof principalOrSeq === "number" ? principalOrSeq : maybeSeq;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    return publicEvents(this.#registeredPack(run), run, sinceSeq);
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
    },
    maybeInput?: {
      readonly nodeId: string;
      readonly kind: EvidenceKind;
      readonly depth?: number;
      readonly movetime?: number;
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
    });
  }

  evidence(runId: string, principalOrSeq?: Principal | number, maybeSeq = 0): EvidencePage {
    const principal = typeof principalOrSeq === "object" ? principalOrSeq : this.#principal("legacy-reader");
    const sinceSeq = typeof principalOrSeq === "number" ? principalOrSeq : maybeSeq;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const pack = this.#registeredPack(run);
    if (pack !== undefined && !feedbackIsRevealed(pack, run)) {
      return Object.freeze({ results: Object.freeze([]), nextSeq: sinceSeq });
    }
    return this.#requiredEvidenceQueue().page(runId, sinceSeq);
  }

  authoredFeedback(runId: string, principalInput?: Principal): AuthoredFeedbackPage {
    const principal = principalInput ?? this.#principal("legacy-reader");
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const pack = this.#registeredPack(run);
    if (pack === undefined) {
      throw new ServerError(
        "PACK_NOT_FOUND",
        `Run ${runId} has no matching registered pack for authored feedback`,
      );
    }
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
    const pack = this.#registeredPack(stored.run);
    if (pack !== undefined && !feedbackIsRevealed(pack, stored.run)) {
      throw new ServerError(
        "FEEDBACK_WITHHELD",
        "Evidence is withheld by the pack feedback policy",
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
    queue.consume(runId, resultSeq);
    return result;
  }

  async pgn(runId: string, principalOrBranches?: Principal | readonly string[], maybeBranches?: readonly string[]): Promise<string> {
    const principal = Array.isArray(principalOrBranches) || principalOrBranches === undefined
      ? this.#principal("legacy-reader")
      : principalOrBranches as Principal;
    const branchIds = Array.isArray(principalOrBranches) ? principalOrBranches : maybeBranches;
    const run = requireRead(this.#storage, runId, principal).stored.run;
    const pack = this.#registeredPack(run);
    return pack === undefined
      ? exportPgn(run, branchIds)
      : exportPackRunPgn(pack.document, run, branchIds);
  }

  #required(runId: string): StoredRun {
    const stored = this.#storage.read(runId);
    if (!stored) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
    return stored;
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

  claimLease(runId: string, principal: Principal, writerId: string): void {
    const { role } = requireRead(this.#storage, runId, principal);
    if (!mayWrite(role)) {
      throw new ServerError("FORBIDDEN", "This learner may not claim the run lease");
    }
    this.#storage.claimLease(runId, { writerId, learnerId: principal.learnerId });
  }

  #forWrite(runId: string, principal: Principal, writerId: string) {
    return requireWrite(this.#storage, runId, principal, writerId);
  }

  #registeredPack(run: DrillRun): PackRecord | undefined {
    const pack = this.#packRegistry?.get(run.packId);
    return pack?.digest === run.packDigest ? pack : undefined;
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
