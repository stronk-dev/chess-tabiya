import { makeSan } from "chessops/san";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

import { canonicalFen, positionFromFen, transposeKey } from "./chess.js";
import {
  illegalMove,
  runTerminated,
  unknownCheckpoint,
  unknownNode,
} from "./errors.js";
import { appendEvents } from "./events.js";
import type {
  Actor,
  Branch,
  CheckpointReachedEvent,
  DrillRun,
  DrillRunEvent,
  EventDraft,
  MutationResult,
  Node,
  PolicyConfig,
} from "./types.js";

const TERMINAL_OBJECTIVE_STATES = new Set(["failed", "achieved", "transitioned"]);

export interface CreateRunInput {
  readonly id: string;
  readonly packId: string;
  readonly packDigest: string;
  readonly policyConfig: PolicyConfig;
  readonly startFen: string;
  readonly seed: number;
  readonly createdAt?: string;
}

export interface CommitMoveOptions {
  readonly actor?: Actor;
  readonly at?: string;
  readonly clockState?: Readonly<Record<string, unknown>>;
}

export interface ForkOptions {
  readonly label?: string;
  readonly intent?: string;
  readonly at?: string;
}

function timestamp(at?: string): string {
  return at ?? new Date().toISOString();
}

function getNode(run: DrillRun, nodeId: string): Node {
  const node = run.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw unknownNode(nodeId);
  return node;
}

function getBranch(run: DrillRun, branchId: string): Branch {
  const branch = run.branches.find((candidate) => candidate.id === branchId);
  if (!branch) throw new TypeError(`Projection references unknown branch: ${branchId}`);
  return branch;
}

function nextAltLabel(run: DrillRun): string {
  const used = new Set(run.branches.map((branch) => branch.label));
  let index = 1;
  while (used.has(`alt-${index}`)) index += 1;
  return `alt-${index}`;
}

function nextBranch(run: DrillRun, nodeId: string, options: ForkOptions): Branch {
  const index = run.branches.length;
  const primarySeed = run.branches[0]?.seed;
  if (primarySeed === undefined) throw new TypeError("Run has no primary branch");
  const branch: Branch = {
    id: `${run.id}:branch:${index}`,
    forkNodeId: nodeId,
    label: options.label ?? nextAltLabel(run),
    seed: run.policyConfig.seedMode === "per_branch" ? primarySeed + index : primarySeed,
    ...(options.intent === undefined ? {} : { intent: options.intent }),
  };
  return branch;
}

function emittedSince(before: DrillRun, after: DrillRun): readonly DrillRunEvent[] {
  return after.events.slice(before.events.length);
}

function appendBranch(run: DrillRun, nodeId: string, options: ForkOptions): MutationResult {
  getNode(run, nodeId);
  const branch = nextBranch(run, nodeId, options);
  const next = appendEvents(run, [
    {
      type: "branch.forked",
      at: timestamp(options.at),
      data: { branch },
    },
  ]);
  return { run: next, emitted: emittedSince(run, next) };
}

function branchIsEmptyAtCursor(run: DrillRun): boolean {
  const branch = getBranch(run, run.activeCursor.branchId);
  return (
    branch.forkNodeId === run.activeCursor.nodeId &&
    !run.nodes.some(
      (node) => node.branchId === branch.id && node.id !== branch.forkNodeId,
    )
  );
}

function cursorHasChildren(run: DrillRun): boolean {
  return run.nodes.some((node) => node.parentId === run.activeCursor.nodeId);
}

export function createRun(input: CreateRunInput): DrillRun {
  const at = timestamp(input.createdAt);
  const position = positionFromFen(input.startFen);
  const fen = canonicalFen(position);
  const branchId = `${input.id}:branch:0`;
  const rootNode: Node = {
    id: `${input.id}:node:0`,
    parentId: null,
    fen,
    transposeKey: transposeKey(fen),
    moveUci: null,
    moveSan: null,
    ply: 0,
    actor: "system",
    branchId,
    checkpointRefs: [],
    objectiveState: "active",
    evidenceRefs: [],
    createdAt: at,
  };
  const branch: Branch = {
    id: branchId,
    forkNodeId: rootNode.id,
    label: "main",
    seed: input.seed,
  };
  const activeCursor = { nodeId: rootNode.id, branchId };
  const startEvent: DrillRunEvent = {
    seq: 1,
    type: "run.started",
    at,
    data: {
      id: input.id,
      packId: input.packId,
      packDigest: input.packDigest,
      policyConfig: input.policyConfig,
      rootNode,
      branch,
      activeCursor,
    },
  };

  return appendEvents(
    {
      schemaVersion: DRILL_RUN_SCHEMA_VERSION,
      id: input.id,
      packId: input.packId,
      packDigest: input.packDigest,
      policyConfig: input.policyConfig,
      nodes: [rootNode],
      branches: [branch],
      events: [],
      activeCursor,
    },
    [{ type: startEvent.type, at: startEvent.at, data: startEvent.data }],
  );
}

export function commitMove(
  original: DrillRun,
  uci: string,
  options: CommitMoveOptions = {},
): MutationResult {
  const cursorNode = getNode(original, original.activeCursor.nodeId);
  const position = positionFromFen(cursorNode.fen);
  if (TERMINAL_OBJECTIVE_STATES.has(cursorNode.objectiveState) || position.isEnd()) {
    throw runTerminated(cursorNode.id);
  }

  const move = parseUci(uci);
  if (!move || !isNormal(move)) throw illegalMove(uci, "malformed-UCI");
  const movingColor = position.board.getColor(move.from);
  if (movingColor !== undefined && movingColor !== position.turn) {
    throw illegalMove(uci, "wrong-side");
  }
  if (!position.isLegal(move)) throw illegalMove(uci, "not-a-legal-move");

  const at = timestamp(options.at);
  let run = original;
  const emitted: DrillRunEvent[] = [];
  if (cursorHasChildren(run) && !branchIsEmptyAtCursor(run)) {
    const forked = appendBranch(run, run.activeCursor.nodeId, {
      label: nextAltLabel(run),
      at,
    });
    run = forked.run;
    emitted.push(...forked.emitted);
  }

  const san = makeSan(position, move);
  position.play(move);
  const fen = canonicalFen(position);
  const node: Node = {
    id: `${run.id}:node:${run.nodes.length}`,
    parentId: run.activeCursor.nodeId,
    fen,
    transposeKey: transposeKey(fen),
    moveUci: uci,
    moveSan: san,
    ply: cursorNode.ply + 1,
    actor: options.actor ?? "user",
    branchId: run.activeCursor.branchId,
    checkpointRefs: [],
    objectiveState: cursorNode.objectiveState,
    evidenceRefs: [],
    createdAt: at,
    ...(options.clockState === undefined ? {} : { clockState: options.clockState }),
  };
  const next = appendEvents(run, [
    { type: "move.committed", at, data: { node } },
  ]);
  emitted.push(...emittedSince(run, next));
  return { run: next, emitted };
}

export function fork(
  run: DrillRun,
  nodeId: string,
  options: ForkOptions = {},
): MutationResult {
  return appendBranch(run, nodeId, options);
}

function isAncestor(run: DrillRun, ancestorId: string, descendantId: string): boolean {
  let node: Node | undefined = getNode(run, descendantId);
  while (node) {
    if (node.id === ancestorId) return true;
    node = node.parentId === null ? undefined : getNode(run, node.parentId);
  }
  return false;
}

export function rewind(run: DrillRun, nodeId: string, at?: string): MutationResult {
  const target = getNode(run, nodeId);
  const branchId = isAncestor(run, nodeId, run.activeCursor.nodeId)
    ? run.activeCursor.branchId
    : target.branchId;
  const next = appendEvents(run, [
    {
      type: "run.rewound",
      at: timestamp(at),
      data: {
        fromNodeId: run.activeCursor.nodeId,
        toNodeId: nodeId,
        branchId,
      },
    },
  ]);
  return { run: next, emitted: emittedSince(run, next) };
}

export function rewindToCheckpoint(
  run: DrillRun,
  checkpointId: string,
  at?: string,
): MutationResult {
  const checkpoint = [...run.events]
    .reverse()
    .find(
      (event): event is CheckpointReachedEvent =>
        event.type === "checkpoint.reached" && event.data.checkpointId === checkpointId,
    );
  if (!checkpoint) throw unknownCheckpoint(checkpointId);
  return rewind(run, checkpoint.data.nodeId, at);
}

export function reachCheckpoint(
  run: DrillRun,
  checkpointId: string,
  at?: string,
): MutationResult {
  const eventAt = timestamp(at);
  const previous = [...run.events]
    .reverse()
    .find(
      (event): event is CheckpointReachedEvent =>
        event.type === "checkpoint.reached" &&
        event.data.branchId === run.activeCursor.branchId,
    );
  const checkpointDraft: EventDraft = {
    type: "checkpoint.reached",
    at: eventAt,
    data: {
      checkpointId,
      nodeId: run.activeCursor.nodeId,
      branchId: run.activeCursor.branchId,
    },
  };
  let next = appendEvents(run, [checkpointDraft]);

  if (previous) {
    const current = next.events.at(-1);
    if (current?.type !== "checkpoint.reached") {
      throw new TypeError("Checkpoint append did not project a checkpoint event");
    }
    next = appendEvents(next, [
      {
        type: "segment.completed",
        at: eventAt,
        data: {
          branchId: run.activeCursor.branchId,
          startCheckpointEventSeq: previous.seq,
          endCheckpointEventSeq: current.seq,
          startNodeId: previous.data.nodeId,
          endNodeId: current.data.nodeId,
        },
      },
    ]);
  }

  return { run: next, emitted: emittedSince(run, next) };
}

export function historyFrom(run: DrillRun, nodeId: string): readonly Node[] {
  const reversed: Node[] = [];
  let node: Node | undefined = getNode(run, nodeId);
  while (node) {
    reversed.push(node);
    node = node.parentId === null ? undefined : getNode(run, node.parentId);
  }
  return reversed.reverse();
}
