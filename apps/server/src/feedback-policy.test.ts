import {
  attachEvidence,
  createRun,
  type DrillRun,
  type DrillRunEvent,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { publicEvents, publicNodes } from "./feedback-policy.js";

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
});
