import {
  attachEvidence,
  createRun,
  revealFeedback,
  type DrillRun,
  type DrillRunEvent,
  type SelectionCandidate,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { publicEvents, publicMutationPayload, publicNodes, publicRunSnapshot } from "./feedback-policy.js";

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
  it.each(["events", "snapshot", "mutation"] as const)("keeps provider save/reload images private in %s while retaining disclosed readings", (surface) => {
    const base = revealFeedback(run(), at).run;
    const values = Object.freeze({
      centipawns: 32, perspective: "white", engineId: "stockfish-analysis", bestMoveUci: "e1d1",
      providerDelivery: { response: { bodyBase64: Buffer.from("info score cp 32 pv e1d1\nbestmove e1d1").toString("base64") } },
      providerLineDelivery: { response: { bodyBase64: Buffer.from("info pv e1d1 e8d8\nbestmove e1d1").toString("base64") } },
    });
    const attached = attachEvidence(base, base.activeCursor.nodeId, ["engine:private-captures"], { kind: "eval", source: "engine_validated", values }, at);
    const projected = surface === "events" ? publicEvents(attached.run, 0)
      : surface === "snapshot" ? publicRunSnapshot(attached.run)
        : publicMutationPayload(attached);
    const wire = JSON.stringify(projected);
    expect(wire.match(/providerDelivery|providerLineDelivery|bodyBase64|bestMoveUci/u)?.[0]).toBeUndefined();
    expect(wire).toContain('"centipawns":32');
    expect(wire).toContain('"engineId":"stockfish-analysis"');
    expect(attached.run.events.at(-1)).toMatchObject({ data: { payload: { values } } });
    expect(Object.keys(values)).toContain("providerLineDelivery");
  });

  it("preserves explicitly recorded bestline and other disclosed evidence fields", () => {
    let recorded = revealFeedback(run(), at).run;
    for (const payload of [
      { kind: "bestline" as const, source: "engine_validated" as const, values: { movesUci: ["e1d1", "e8d8"], depth: 12 } },
      { kind: "wdl" as const, source: "engine_validated" as const, values: { win: 100, draw: 800, loss: 100 } },
      { kind: "tablebase" as const, source: "tablebase_exact" as const, values: { category: "draw", dtz: 0 } },
    ]) {
      recorded = attachEvidence(recorded, recorded.activeCursor.nodeId, ["engine:retained-" + payload.kind], payload, at).run;
      expect(publicRunSnapshot(recorded).events.at(-1)).toMatchObject({ data: { payload } });
    }
  });

  it("projects event envelopes and data fields instead of forwarding future internals", () => {
    const base = run();
    const event = Object.freeze({
      seq: base.events.length + 1,
      type: "checkpoint.reached" as const,
      at,
      privateEnvelopeField: "do-not-publish",
      data: Object.freeze({
        checkpointId: "checkpoint-1",
        nodeId: base.activeCursor.nodeId,
        branchId: base.activeCursor.branchId,
        privateDataField: "do-not-publish",
      }),
    }) as DrillRunEvent & { readonly privateEnvelopeField: string; readonly data: { readonly privateDataField: string } };
    const recorded = Object.freeze({ ...base, events: Object.freeze([...base.events, event]) });

    const pageEvent = publicEvents(recorded, 0).events.at(-1)! as unknown as Record<string, unknown>;
    expect(pageEvent).not.toHaveProperty("privateEnvelopeField");
    expect(pageEvent.data).not.toHaveProperty("privateDataField");

    const snapshotEvent = publicRunSnapshot(recorded).events.at(-1)! as unknown as Record<string, unknown>;
    expect(snapshotEvent).not.toHaveProperty("privateEnvelopeField");
    expect(snapshotEvent.data).not.toHaveProperty("privateDataField");

    const mutation = publicMutationPayload({ run: recorded, emitted: [event] });
    expect(mutation.emitted[0]).not.toHaveProperty("privateEnvelopeField");
    expect(mutation.emitted[0]?.data).not.toHaveProperty("privateDataField");
  });

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
    expect(disclosedSelection.data.selection.candidates?.[0]).not.toHaveProperty("futureMeasurement");
  });
});
