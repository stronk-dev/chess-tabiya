import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  RuntimeError,
  assertActiveWriter,
  commitMove,
  createRun,
  deriveSegments,
  eventsSince,
  fork,
  historyFrom,
  projectRun,
  reachCheckpoint,
  rewind,
  rewindToCheckpoint,
  appendEvents,
  type DrillRun,
  type JobObserver,
  type PolicyConfig,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";
const packDigest = `sha256:${"a".repeat(64)}`;

function newRun(
  startFen = INITIAL_FEN,
  seedMode: PolicyConfig["seedMode"] = "per_branch",
): DrillRun {
  return createRun({
    id: "run-1",
    packId: "pack-1",
    packDigest,
    policyConfig: {
      seedMode,
      locus: {
        executedAt: "browser",
        engineIds: [],
        modelIds: [{ id: "mock-opponent", version: "1" }],
      },
    },
    startFen,
    seed: 42,
    createdAt: at,
  });
}

function expectRuntimeError(
  operation: () => unknown,
  code: RuntimeError["code"],
  reason?: RuntimeError["reason"],
): void {
  try {
    operation();
    throw new Error("Expected operation to throw");
  } catch (error) {
    expect(error).toBeInstanceOf(RuntimeError);
    expect(error).toMatchObject({ code, ...(reason === undefined ? {} : { reason }) });
  }
}

describe("path-keyed node model", () => {
  it("keeps transposed positions as distinct nodes linked by their full path", () => {
    let run = newRun();
    for (const uci of ["g1f3", "g8f6", "f3g1", "f6g8"]) {
      run = commitMove(run, uci, { at }).run;
    }

    const root = run.nodes[0]!;
    const transposition = run.nodes.at(-1)!;
    expect(transposition.id).not.toBe(root.id);
    expect(transposition.transposeKey).toBe(root.transposeKey);
    expect(historyFrom(run, transposition.id).map((node) => node.id)).toEqual(
      run.nodes.map((node) => node.id),
    );
    expect(run.nodes.every((node) => Object.isFrozen(node))).toBe(true);
  });

  it("reconstructs the projection from the sequenced event log", () => {
    const moved = commitMove(newRun(), "e2e4", { at }).run;

    expect(projectRun(moved.events)).toEqual(moved);
    expect(moved.events.map((event) => event.seq)).toEqual([1, 2]);
    expect(eventsSince(moved, 1).map((event) => event.type)).toEqual([
      "move.committed",
    ]);
  });
});

describe("fork and rewind semantics", () => {
  it("appends a leaf move without forking", () => {
    const result = commitMove(newRun(), "e2e4", { at });

    expect(result.emitted.map((event) => event.type)).toEqual(["move.committed"]);
    expect(result.run.branches).toHaveLength(1);
    expect(result.run.activeCursor.nodeId).toBe(result.run.nodes.at(-1)!.id);
  });

  it("implicitly forks alt-N before committing at a non-leaf cursor", () => {
    let original = newRun();
    original = commitMove(original, "e2e4", { at }).run;
    original = commitMove(original, "e7e5", { at }).run;
    const originalNodes = original.nodes;
    const rootId = original.nodes[0]!.id;
    const rewound = rewind(original, rootId, at).run;

    const result = commitMove(rewound, "d2d4", { at });

    expect(result.emitted.map((event) => event.type)).toEqual([
      "branch.forked",
      "move.committed",
    ]);
    expect(result.run.branches.at(-1)).toMatchObject({
      forkNodeId: rootId,
      label: "alt-1",
      seed: 43,
    });
    expect(result.run.nodes.slice(0, originalNodes.length)).toEqual(originalNodes);
    expect(result.run.nodes.at(-1)).toMatchObject({
      parentId: rootId,
      moveUci: "d2d4",
      branchId: result.run.branches.at(-1)!.id,
    });
  });

  it("uses an explicit empty branch for the next move without a second fork", () => {
    const moved = commitMove(newRun(), "e2e4", { at }).run;
    const rootId = moved.nodes[0]!.id;
    const forked = fork(moved, rootId, {
      label: "queenside experiment",
      intent: "Claim more space",
      at,
    });

    expect(forked.run.activeCursor).toEqual({
      nodeId: rootId,
      branchId: forked.run.branches.at(-1)!.id,
    });
    const committed = commitMove(forked.run, "d2d4", { at });
    expect(committed.emitted.map((event) => event.type)).toEqual(["move.committed"]);
    expect(committed.run.branches).toHaveLength(2);
  });

  it("reuses the primary seed for fixed-mode branches", () => {
    const run = newRun(INITIAL_FEN, "fixed");
    const first = fork(run, run.nodes[0]!.id, { label: "first", at }).run;
    const second = fork(first, first.nodes[0]!.id, { label: "second", at }).run;

    expect(second.branches.map((branch) => branch.seed)).toEqual([42, 42, 42]);
  });

  it("rewind changes only the cursor and records the move", () => {
    const moved = commitMove(newRun(), "e2e4", { at }).run;
    const nodesBefore = moved.nodes;
    const result = rewind(moved, moved.nodes[0]!.id, at);

    expect(result.run.nodes).toEqual(nodesBefore);
    expect(result.run.activeCursor.nodeId).toBe(moved.nodes[0]!.id);
    expect(result.emitted).toEqual([
      expect.objectContaining({ type: "run.rewound", seq: 3 }),
    ]);
  });

  it("notifies the job observer with nodes leaving the active path", () => {
    let run = newRun();
    run = commitMove(run, "e2e4", { at }).run;
    const targetId = run.activeCursor.nodeId;
    run = commitMove(run, "e7e5", { at }).run;
    run = commitMove(run, "g1f3", { at }).run;
    const expected = run.nodes.slice(2).map((node) => node.id);
    const calls: (readonly string[])[] = [];
    const observer: JobObserver = {
      onRewound(prunedNodeIds) {
        calls.push(prunedNodeIds);
      },
    };

    const result = rewind(run, targetId, at, observer);

    expect(calls).toEqual([expected]);
    expect(Object.isFrozen(calls[0])).toBe(true);
    expect(result.run.nodes).toEqual(run.nodes);
  });

  it("does not notify the job observer when rewind validation fails", () => {
    let calls = 0;
    const observer: JobObserver = {
      onRewound() {
        calls += 1;
      },
    };

    expect(() => rewind(newRun(), "missing", at, observer)).toThrow(RuntimeError);
    expect(calls).toBe(0);
  });
});

describe("node-local evidence", () => {
  it("starts a committed node with no inherited evidence", () => {
    const run = newRun();
    const root = run.nodes[0]!;
    const evidenced = appendEvents(run, [
      {
        type: "objective.state_changed",
        at,
        data: {
          nodeId: root.id,
          from: "active",
          to: "preserved",
          evidenceRefs: ["evidence:root-evaluation"],
        },
      },
    ]);

    expect(evidenced.nodes[0]!.evidenceRefs).toEqual(["evidence:root-evaluation"]);
    expect(commitMove(evidenced, "e2e4", { at }).run.nodes.at(-1)!.evidenceRefs).toEqual(
      [],
    );
  });

  it("projects typed evidence attachments onto only the named node", () => {
    const moved = commitMove(newRun(), "e2e4", { at }).run;
    const root = moved.nodes[0]!;
    const child = moved.nodes[1]!;
    const attached = appendEvents(moved, [
      {
        type: "evidence.attached",
        at,
        data: {
          nodeId: root.id,
          evidenceRefs: ["analysis:stockfish:1"],
          payload: {
            kind: "eval",
            source: "engine_validated",
            values: { centipawns: 24, depth: 18 },
          },
        },
      },
    ]);

    expect(attached.nodes[0]!.evidenceRefs).toEqual(["analysis:stockfish:1"]);
    expect(attached.nodes[1]!.evidenceRefs).toEqual(child.evidenceRefs);
    expect(attached.events.at(-1)).toMatchObject({
      type: "evidence.attached",
      data: {
        payload: { source: "engine_validated", values: { centipawns: 24 } },
      },
    });
    expect(() =>
      appendEvents(moved, [
        {
          type: "evidence.attached",
          at,
          data: {
            nodeId: "missing-node",
            evidenceRefs: ["analysis:missing"],
            payload: {
              kind: "wdl",
              source: "human_model_predicted",
              values: { win: 0.4, draw: 0.3, loss: 0.3 },
            },
          },
        },
      ]),
    ).toThrowError(RuntimeError);
  });
});

describe("checkpoint segments", () => {
  it("derives spans from consecutive checkpoint events on the branch", () => {
    let run = reachCheckpoint(newRun(), "start", at).run;
    run = commitMove(run, "e2e4", { at }).run;
    const completed = reachCheckpoint(run, "choice", at);
    const segments = deriveSegments(completed.run);

    expect(completed.emitted.map((event) => event.type)).toEqual([
      "checkpoint.reached",
      "segment.completed",
    ]);
    expect(segments).toEqual([
      expect.objectContaining({
        startCheckpointId: "start",
        endCheckpointId: "choice",
        startNodeId: completed.run.nodes[0]!.id,
        endNodeId: completed.run.nodes[1]!.id,
      }),
    ]);
    expect(completed.run.nodes[0]!.checkpointRefs).toEqual(["start"]);
    expect(completed.run.nodes[1]!.checkpointRefs).toEqual(["choice"]);
    expect(rewindToCheckpoint(completed.run, "start", at).run.activeCursor.nodeId).toBe(
      completed.run.nodes[0]!.id,
    );
  });

  it("does not derive a segment for coincident checkpoints", () => {
    let run = reachCheckpoint(newRun(), "first", at).run;
    const second = reachCheckpoint(run, "second", at);

    expect(second.emitted.map((event) => event.type)).toEqual(["checkpoint.reached"]);
    expect(deriveSegments(second.run)).toEqual([]);
  });

  it("preserves pre-guard zero-length segment events", () => {
    let run = reachCheckpoint(newRun(), "first", at).run;
    run = reachCheckpoint(run, "second", at).run;
    const checkpoints = run.events.filter((event) => event.type === "checkpoint.reached");
    const first = checkpoints[0]!;
    const second = checkpoints[1]!;
    run = appendEvents(run, [{
      type: "segment.completed",
      at,
      data: {
        branchId: first.data.branchId,
        startCheckpointEventSeq: first.seq,
        endCheckpointEventSeq: second.seq,
        startNodeId: first.data.nodeId,
        endNodeId: second.data.nodeId,
      },
    }]);

    expect(deriveSegments(run)).toEqual([expect.objectContaining({
      startCheckpointId: "first",
      endCheckpointId: "second",
      startNodeId: first.data.nodeId,
      endNodeId: first.data.nodeId,
    })]);
  });

  it("rejects forged segment scope, ordering, and adjacency", () => {
    let run = reachCheckpoint(newRun(), "first", at).run;
    run = commitMove(run, "e2e4", { at }).run;
    run = reachCheckpoint(run, "second", at).run;
    const segment = run.events.find((event) => event.type === "segment.completed")!;
    const replaceSegment = (data: typeof segment.data) => run.events.map((event) =>
      event.type === "segment.completed" ? { ...event, data } : event,
    );

    expect(() => projectRun(replaceSegment({ ...segment.data, branchId: "forged" }))).toThrow(/does not match/u);
    expect(() => projectRun(replaceSegment({ ...segment.data, endNodeId: run.nodes[0]!.id }))).toThrow(/does not match/u);
    expect(() => projectRun(replaceSegment({ ...segment.data, startCheckpointEventSeq: segment.data.endCheckpointEventSeq }))).toThrow(/ordering/u);

    const beforeSegment = run.events.slice(0, -1);
    const spacer = { seq: segment.seq, type: "feedback.generated" as const, at, data: { nodeId: run.activeCursor.nodeId, evidenceRefs: ["rules:spacer"] } };
    const displaced = { ...segment, seq: segment.seq + 1 };
    expect(() => projectRun([...beforeSegment, spacer, displaced])).toThrow(/immediately follow/u);
  });

  it("rejects feedback.generated without an existing node and non-empty grounds", () => {
    const run = newRun();
    expect(() => appendEvents(run, [{ type: "feedback.generated", at, data: { nodeId: "missing", evidenceRefs: ["rules:material"] } }])).toThrow(/Unknown node/u);
    expect(() => appendEvents(run, [{ type: "feedback.generated", at, data: { nodeId: run.activeCursor.nodeId, evidenceRefs: [] } }])).toThrow(/requires evidence references/u);
  });
});

describe("typed errors", () => {
  it("surfaces every §1 error category without silent no-ops", () => {
    const run = newRun();
    expectRuntimeError(() => commitMove(run, "not-uci"), "ILLEGAL_MOVE", "malformed-UCI");
    expectRuntimeError(() => commitMove(run, "e7e5"), "ILLEGAL_MOVE", "wrong-side");
    expectRuntimeError(
      () => commitMove(run, "e2e5"),
      "ILLEGAL_MOVE",
      "not-a-legal-move",
    );
    expectRuntimeError(() => rewind(run, "missing"), "UNKNOWN_NODE");
    expectRuntimeError(
      () => rewindToCheckpoint(run, "missing"),
      "UNKNOWN_CHECKPOINT",
    );
    expectRuntimeError(
      () => assertActiveWriter("writer-a", "writer-b"),
      "NOT_ACTIVE_WRITER",
    );

    expectRuntimeError(
      () => newRun(
        "r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
      ),
      "TERMINAL_START_POSITION",
    );
  });
});
