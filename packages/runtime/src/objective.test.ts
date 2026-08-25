import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  ObjectiveEvidenceError,
  ObjectiveTransitionError,
  RuntimeError,
  appendEvents,
  commitMove,
  createRun,
  evaluateObjective,
  evaluateObjectivePredicate,
  materialBalanceAt,
  reachCheckpoint,
  requestObjectiveEvidence,
  transitionObjective,
  type DrillRun,
  type ObjectiveEvidenceRequest,
  type ObjectiveEvidenceUpgrader,
  type ObjectiveState,
  type ObjectiveTransitionRule,
} from "./index.js";

const at = "2026-08-12T12:00:00.000Z";

function newRun(startFen = INITIAL_FEN): DrillRun {
  return createRun({
    id: "objective-run",
    packId: "objective-pack",
    packDigest: `sha256:${"c".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen,
    seed: 11,
    createdAt: at,
  });
}

function predicateRun(fen: string): DrillRun {
  const base = newRun();
  const rootNode = { ...base.nodes[0]!, fen };
  const started = base.events[0]!;
  if (started.type !== "run.started") throw new TypeError("Expected run.started");
  return {
    ...base,
    start: { ...base.start, fen },
    nodes: [rootNode],
    events: [{
      ...started,
      data: {
        ...started.data,
        start: { ...started.data.start, fen },
        rootNode,
      },
    }],
  };
}

function runInState(state: ObjectiveState): DrillRun {
  return state === "active"
    ? newRun()
    : transitionObjective(newRun(), state, [`evidence:enter-${state}`], at).run;
}

describe("objective transition graph", () => {
  const states: readonly ObjectiveState[] = [
    "active",
    "preserved",
    "degraded",
    "failed",
    "achieved",
    "transitioned",
  ];
  const nonTerminal = new Set<ObjectiveState>(["active", "preserved", "degraded"]);

  it("allows exactly the RFC graph and no terminal outgoing edges", () => {
    for (const from of states) {
      for (const to of states) {
        const operation = () =>
          transitionObjective(runInState(from), to, [`evidence:${from}-${to}`], at);
        if (nonTerminal.has(from) && from !== to) {
          expect(operation).not.toThrow();
        } else {
          expect(operation).toThrow(ObjectiveTransitionError);
        }
      }
    }
  });

  it("allows the review-caught preserved and degraded achievement paths", () => {
    const preserved = runInState("preserved");
    const degraded = runInState("degraded");

    expect(
      transitionObjective(preserved, "achieved", ["evidence:preserved-success"], at)
        .run.nodes[0]!.objectiveState,
    ).toBe("achieved");
    expect(
      transitionObjective(degraded, "achieved", ["evidence:save-completed"], at)
        .run.nodes[0]!.objectiveState,
    ).toBe("achieved");
  });

  it("always emits evidence and projects it onto only the evaluated node", () => {
    const result = transitionObjective(
      newRun(),
      "preserved",
      ["evidence:rules-fact", "evidence:pack-claim"],
      at,
    );

    expect(result.emitted).toEqual([
      expect.objectContaining({
        type: "objective.state_changed",
        data: expect.objectContaining({
          from: "active",
          to: "preserved",
          evidenceRefs: ["evidence:rules-fact", "evidence:pack-claim"],
        }),
      }),
    ]);
    expect(result.run.nodes[0]).toMatchObject({
      objectiveState: "preserved",
      evidenceRefs: ["evidence:rules-fact", "evidence:pack-claim"],
    });
    expect(() => transitionObjective(newRun(), "preserved", [], at)).toThrow(
      ObjectiveEvidenceError,
    );
    expect(() => transitionObjective(newRun(), "preserved", [""], at)).toThrow(
      ObjectiveEvidenceError,
    );
  });

  it("rejects invalid state events during event-log replay too", () => {
    const run = newRun();
    const nodeId = run.activeCursor.nodeId;

    expect(() =>
      appendEvents(run, [
        {
          type: "objective.state_changed",
          at,
          data: {
            nodeId,
            from: "active",
            to: "active",
            evidenceRefs: ["evidence:invalid-self-loop"],
          },
        },
      ]),
    ).toThrow(ObjectiveTransitionError);
    expect(() =>
      appendEvents(run, [
        {
          type: "objective.state_changed",
          at,
          data: {
            nodeId,
            from: "active",
            to: "preserved",
            evidenceRefs: [],
          },
        },
      ]),
    ).toThrow(ObjectiveEvidenceError);
    expect(() =>
      appendEvents(run, [
        {
          type: "objective.state_changed",
          at,
          data: {
            nodeId,
            from: "degraded",
            to: "failed",
            evidenceRefs: ["evidence:wrong-source-state"],
          },
        },
      ]),
    ).toThrow(TypeError);
  });

  it("makes achieved, failed, and transitioned nodes terminal for play", () => {
    for (const state of ["achieved", "failed", "transitioned"] as const) {
      const run = transitionObjective(newRun(), state, [`evidence:${state}`], at).run;
      try {
        commitMove(run, "e2e4", { at });
        throw new Error("Expected terminal run to reject a move");
      } catch (error) {
        expect(error).toBeInstanceOf(RuntimeError);
        expect(error).toMatchObject({ code: "RUN_TERMINATED" });
      }
    }
  });
});

describe("engine-free predicates", () => {
  it("evaluates checkmate, stalemate, and board-provable draw facts", () => {
    const checkmate = predicateRun(
      "r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
    );
    expect(
      evaluateObjectivePredicate(checkmate, {
        type: "rulesFact",
        fact: "checkmate",
        winner: "white",
      }),
    ).toBe(true);
    expect(
      evaluateObjectivePredicate(checkmate, {
        type: "rulesFact",
        fact: "checkmate",
        winner: "black",
      }),
    ).toBe(false);

    const stalemate = predicateRun("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(
      evaluateObjectivePredicate(stalemate, { type: "rulesFact", fact: "stalemate" }),
    ).toBe(true);
    expect(
      evaluateObjectivePredicate(stalemate, { type: "rulesFact", fact: "draw" }),
    ).toBe(true);

    const insufficient = predicateRun("8/8/8/8/8/8/4K3/7k w - - 0 1");
    expect(
      evaluateObjectivePredicate(insufficient, { type: "rulesFact", fact: "draw" }),
    ).toBe(true);

    const fiftyMoveClaim = predicateRun("r6k/8/8/8/8/8/8/R6K w - - 100 51");
    expect(
      evaluateObjectivePredicate(fiftyMoveClaim, { type: "rulesFact", fact: "draw" }),
    ).toBe(true);
  });

  it("recognizes threefold repetition on the active run path", () => {
    let run = newRun();
    for (const uci of [
      "g1f3",
      "g8f6",
      "f3g1",
      "f6g8",
      "g1f3",
      "g8f6",
      "f3g1",
      "f6g8",
    ]) {
      run = commitMove(run, uci, { at }).run;
    }

    expect(
      evaluateObjectivePredicate(run, { type: "rulesFact", fact: "draw" }),
    ).toBe(true);
  });

  it("evaluates material balance in deterministic pawn units", () => {
    const fen = "7k/8/8/8/8/8/4KQ2/8 w - - 0 1";
    const queenUp = newRun(fen);

    expect(materialBalanceAt(fen, "white")).toBe(9);
    expect(materialBalanceAt(fen, "black")).toBe(-9);

    expect(
      evaluateObjectivePredicate(queenUp, {
        type: "materialBalance",
        perspective: "white",
        comparison: "equal",
        value: 9,
      }),
    ).toBe(true);
    expect(
      evaluateObjectivePredicate(queenUp, {
        type: "materialBalance",
        perspective: "black",
        comparison: "atMost",
        value: -9,
      }),
    ).toBe(true);
  });

  it("evaluates piece, pawn-structure, and transpose-key FEN predicates", () => {
    const run = newRun();
    const key = run.nodes[0]!.transposeKey;

    expect(
      evaluateObjectivePredicate(run, {
        type: "fenPredicate",
        predicate: {
          type: "pieceOnSquare",
          square: "e2",
          piece: { color: "white", role: "pawn" },
        },
      }),
    ).toBe(true);
    expect(
      evaluateObjectivePredicate(run, {
        type: "fenPredicate",
        predicate: {
          type: "pawnStructure",
          mode: "contains",
          white: ["d2", "e2"],
          black: ["d7", "e7"],
        },
      }),
    ).toBe(true);
    expect(
      evaluateObjectivePredicate(run, {
        type: "fenPredicate",
        predicate: { type: "transposeKey", value: key },
      }),
    ).toBe(true);
  });

  it("recognizes a checkpoint on the active path and composes predicates", () => {
    let run = reachCheckpoint(newRun(), "critical-choice", at).run;
    run = commitMove(run, "e2e4", { at }).run;
    const checkpoint = {
      type: "checkpointReached",
      checkpointId: "critical-choice",
    } as const;

    expect(evaluateObjectivePredicate(run, checkpoint)).toBe(true);
    expect(
      evaluateObjectivePredicate(run, {
        type: "all",
        predicates: [
          checkpoint,
          {
            type: "not",
            predicate: { type: "checkpointReached", checkpointId: "missing" },
          },
        ],
      }),
    ).toBe(true);
  });
});

describe("objective rule evaluation", () => {
  it("takes the first matching rule and carries its evidence into the event", () => {
    const run = reachCheckpoint(newRun(), "finish", at).run;
    const rules: readonly ObjectiveTransitionRule[] = [
      {
        id: "finish-reached",
        from: "active",
        to: "achieved",
        when: { type: "checkpointReached", checkpointId: "finish" },
        evidenceRefs: ["checkpoint:finish"],
      },
      {
        id: "later-rule",
        from: "active",
        to: "degraded",
        when: {
          type: "fenPredicate",
          predicate: { type: "transposeKey", value: run.nodes[0]!.transposeKey },
        },
        evidenceRefs: ["position:root"],
      },
    ];

    const result = evaluateObjective(run, rules, at);
    expect(result.matchedRuleId).toBe("finish-reached");
    expect(result.run.nodes[0]!.objectiveState).toBe("achieved");
    expect(result.emitted[0]).toMatchObject({
      type: "objective.state_changed",
      data: { evidenceRefs: ["checkpoint:finish"] },
    });
  });

  it("returns the original immutable run when no predicate matches", () => {
    const run = newRun();
    const result = evaluateObjective(
      run,
      [
        {
          id: "not-yet",
          from: "active",
          to: "achieved",
          when: { type: "checkpointReached", checkpointId: "finish" },
          evidenceRefs: ["checkpoint:finish"],
        },
      ],
      at,
    );

    expect(result).toEqual({ run, emitted: [], matchedRuleId: null });
    expect(result.run).toBe(run);
  });
});

describe("asynchronous evidence-upgrade boundary", () => {
  it("passes an immutable data-only request to a future worker adapter", async () => {
    const run = newRun();
    let observed: ObjectiveEvidenceRequest | undefined;
    const fake: ObjectiveEvidenceUpgrader = {
      async evaluate(request) {
        observed = request;
        return {
          nodeId: request.nodeId,
          from: request.objectiveState,
          to: "degraded",
          evidenceRefs: ["worker:future-eval"],
        };
      },
    };

    const proposal = await requestObjectiveEvidence(run, fake);

    expect(observed).toMatchObject({
      runId: run.id,
      packDigest: run.packDigest,
      nodeId: run.activeCursor.nodeId,
      objectiveState: "active",
    });
    expect(Object.isFrozen(observed)).toBe(true);
    expect(proposal).toEqual({
      nodeId: run.activeCursor.nodeId,
      from: "active",
      to: "degraded",
      evidenceRefs: ["worker:future-eval"],
    });
    expect(run.nodes[0]!.objectiveState).toBe("active");
  });
});
