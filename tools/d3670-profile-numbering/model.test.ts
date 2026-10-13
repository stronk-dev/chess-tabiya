// Disposable D3670 author model: reuses production legal replay, not new chess truth.
import { describe, expect, it } from "vitest";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { projectRun } from "../../packages/runtime/src/events.js";
import { recordedEdgePayload } from "../../packages/runtime/src/recorded-edge.js";
import { commitMove, createRun, fork, rewind } from "../../packages/runtime/src/runtime.js";
import type { DrillRun } from "../../packages/runtime/src/types.js";

function initial(side: "white" | "black", number: number): DrillRun {
  return createRun({ id: `model-${side}-${number}`, seed: 1, createdAt: "2026-10-13T00:00:00.000Z",
    session: { kind: "position", start: { fen: `4k3/4p3/8/8/8/8/4P3/4K3 ${side[0]} - - 0 ${number}`, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
  });
}
function reference(run: DrillRun, nodeId: string) {
  const node = run.nodes.find(node => node.id === nodeId);
  if (node === undefined) throw new TypeError("Missing contributor node");
  const base = { runId: run.id, nodeId, ply: node.ply, moveSan: node.moveSan, observedAt: run.events.find(event => event.type === "run.started")!.at };
  if (node.parentId === null) {
    if (node.ply !== 0 || node.moveUci !== null || node.moveSan !== null) throw new TypeError("Invalid root");
    return { ...base, moveNumber: null, mover: null };
  }
  const parent = run.nodes.find(parent => parent.id === node.parentId);
  if (parent === undefined) throw new TypeError("Missing contributor parent");
  const edge = recordedEdgePayload(run, parent, node);
  const before = positionFromFen(edge.beforeFen);
  return { ...base, moveNumber: before.fullmoves, mover: before.turn };
}
function numbering(value: { moveSan: string | null; moveNumber: unknown; mover: unknown }) {
  if (value.moveSan === null) {
    if (value.moveNumber !== null || value.mover !== null) throw new TypeError("Invalid position numbering");
    return "Position";
  }
  if (!Number.isSafeInteger(value.moveNumber) || (value.moveNumber as number) < 1 || !["white", "black"].includes(value.mover as string)) throw new TypeError("Invalid move numbering");
  return `Move ${value.moveNumber}${value.mover === "white" ? "." : "…"} ${value.moveSan}`;
}

describe("D3670 draft source/wire model (not a production implementation)", () => {
  for (const side of ["white", "black"] as const) for (const number of [1, 37]) {
    it(`uses the actual ${side} parent at fullmove ${number}`, () => {
      const original = initial(side, number);
      const run = commitMove(original, side === "white" ? "e2e4" : "e7e5").run;
      const node = run.nodes.at(-1)!;
      const ref = reference(run, node.id);
      expect(ref).toMatchObject({ ply: 1, moveNumber: number, mover: side });
      expect(numbering(ref)).toBe(`Move ${number}${side === "white" ? "." : "…"} ${side === "white" ? "e4" : "e5"}`);
      expect(positionFromFen(node.fen).fullmoves).toBe(number + (side === "black" ? 1 : 0));
      expect(canonicalFen(positionFromFen(run.nodes[0]!.fen))).toBe(original.start.fen);
      expect(() => reference(projectRun(run.events.slice(0, original.events.length)), node.id)).toThrow(/Missing contributor node/u);
    });
  }
  it("distinguishes an actual root from a missing reference", () => {
    const run = initial("black", 37);
    expect(numbering(reference(run, run.nodes[0]!.id))).toBe("Position");
    expect(() => reference(run, "absent")).toThrow(/Missing contributor node/u);
  });
  it("keeps an earlier sibling's number after the cursor rewinds and plays another branch", () => {
    let run = commitMove(initial("black", 37), "e7e5").run;
    const cited = run.nodes.at(-1)!;
    const expected = reference(run, cited.id);
    run = rewind(run, run.nodes[0]!.id).run;
    run = fork(run, run.nodes[0]!.id, { label: "Other pawn push" }).run;
    run = commitMove(run, "e7e6").run;
    expect(run.activeCursor.nodeId).not.toBe(cited.id);
    expect(reference(run, cited.id)).toEqual(expected);
  });
  for (const corruption of ["parent", "fen", "uci", "san"] as const) it(`refuses a corrupt ${corruption} rather than inventing a root`, () => {
    const run = structuredClone(commitMove(initial("white", 37), "e2e4").run);
    const node = run.nodes.at(-1)!;
    if (corruption === "parent") Object.assign(node, { parentId: "absent" });
    if (corruption === "fen") Object.assign(node, { fen: node.fen.replace(" 37", " 38") });
    if (corruption === "uci") Object.assign(node, { moveUci: "e2e6" });
    if (corruption === "san") Object.assign(node, { moveSan: "e5" });
    expect(() => reference(run, node.id)).toThrow();
  });
  for (const moveNumber of [undefined, null, 0, -1, 1.5, NaN, Infinity, "37"]) it(`rejects move counter ${String(moveNumber)}`, () => {
    expect(() => numbering({ moveSan: "e5", moveNumber, mover: "black" })).toThrow();
  });
  for (const mover of [undefined, null, "b", "Black", "opponent", 1]) it(`rejects mover ${String(mover)}`, () => {
    expect(() => numbering({ moveSan: "e5", moveNumber: 37, mover })).toThrow();
  });
  it("rejects mixed-null positions instead of recovering from parity", () => {
    expect(() => numbering({ moveSan: null, moveNumber: 37, mover: null })).toThrow();
    expect(() => numbering({ moveSan: null, moveNumber: null, mover: "black" })).toThrow();
  });
});
