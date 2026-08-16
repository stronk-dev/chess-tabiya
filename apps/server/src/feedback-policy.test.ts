import {
  attachEvidence,
  createRun,
  type DrillRun,
  type DrillRunEvent,
  type SelectionCandidate,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { publicEvents, publicMutationPayload, publicNodes } from "./feedback-policy.js";

const at = "2026-08-16T00:00:00.000Z";

function run(): DrillRun {
  return createRun({
    id: "machine-withholding",
    session: {
      kind: "position",
      start: { fen: "4k3/8/8/8/8/8/7P/4K3 w - - 0 1", side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common" },
    },
    sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: at,
  });
}

describe("machine-evidence withholding", () => {
  it("withholds tablebase references from nodes and barriers its attachment event", () => {
    const base = run();
    const nodeId = base.activeCursor.nodeId;
    const attached = attachEvidence(base, nodeId, ["tablebase:exact-1"], {
      kind: "tablebase",
      source: "tablebase_exact",
      values: { fen: base.nodes[0]!.fen, pieceCount: 3, category: "draw", dtz: 0, preciseDtz: 0, sourceId: "fixture" },
    }, at).run;
    expect(publicNodes(attached)[0]!.evidenceRefs).toEqual([]);
    const page = publicEvents(attached, 0);
    expect(page.events.some((event) => event.type === "evidence.attached")).toBe(false);
    expect(page.withheld).toBe(true);
  });

  it("barriers an objective change carrying only a tablebase reference", () => {
    const base = run();
    const event: DrillRunEvent = Object.freeze({
      seq: base.events.length + 1,
      type: "objective.state_changed",
      at,
      data: Object.freeze({
        nodeId: base.activeCursor.nodeId,
        from: "active",
        to: "degraded",
        evidenceRefs: Object.freeze(["tablebase:exact-2"]),
      }),
    });
    const projected = publicEvents(Object.freeze({ ...base, events: Object.freeze([...base.events, event]) }), 0);
    expect(projected.events).not.toContainEqual(event);
    expect(projected.withheld).toBe(true);
  });

  it("keeps recorded selection measurements behind disclosure without hiding the move", () => {
    const base = run();
    const event: DrillRunEvent = Object.freeze({
      seq: base.events.length + 1,
      type: "opponent.move_selected",
      at,
      data: Object.freeze({
        nodeId: base.activeCursor.nodeId,
        branchId: base.activeCursor.branchId,
        moveUci: "e8e7",
        selection: Object.freeze({
          moveUci: "e8e7",
          policyModeApplied: "strong_engine",
          candidates: Object.freeze([Object.freeze({
            moveUci: "e8e7",
            rank: 1,
            mass: 0.4,
            scoreCp: 31,
            wdl: Object.freeze({ win: 401, draw: 500, loss: 99 }),
            futureMeasurement: 17,
          }) as SelectionCandidate & { readonly futureMeasurement: number }]),
          engine: Object.freeze({ id: "stockfish-play", name: "Stockfish", version: "18", seedHonored: false }),
        }),
      }),
    });
    const recorded = Object.freeze({ ...base, events: Object.freeze([...base.events, event]) });

    const page = publicEvents(recorded, 0);
    const selected = page.events.find((candidate) => candidate.type === "opponent.move_selected");
    if (selected?.type !== "opponent.move_selected") throw new Error("selection event is missing");
    expect(selected.data.selection.candidates?.[0]).toEqual({ moveUci: "e8e7", rank: 1, mass: 0.4 });
    expect(page.withheld).toBeUndefined();

    const mutation = publicMutationPayload({ run: recorded, emitted: [event] });
    const emitted = mutation.emitted[0];
    if (emitted?.type !== "opponent.move_selected") throw new Error("selection mutation is missing");
    expect(emitted.data.selection.candidates?.[0]).toEqual({ moveUci: "e8e7", rank: 1, mass: 0.4 });

    const disclosed = Object.freeze({ ...recorded, feedbackPolicy: "immediate_guard" as const });
    const disclosedSelection = publicEvents(disclosed, 0).events.find((candidate) => candidate.type === "opponent.move_selected");
    if (disclosedSelection?.type !== "opponent.move_selected") throw new Error("disclosed selection event is missing");
    expect(disclosedSelection.data.selection.candidates?.[0]).toMatchObject({ scoreCp: 31, wdl: { win: 401, draw: 500, loss: 99 } });
  });
});
