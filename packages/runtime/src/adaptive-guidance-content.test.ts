import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyPhase, commitMove, createRun, endgameClassification, pivotalMarkers, type DrillRun, type Node } from "./index.js";
const at = "2026-08-14T00:00:00.000Z";
const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
function node(id: string, fen: string, ply: number): Node {
  return Object.freeze({ id, parentId: ply === 0 ? null : `n${ply - 1}`, fen, transposeKey: fen.split(" ", 4).join(" "), moveUci: null, moveSan: null, ply, actor: ply === 0 ? "system" : "user", branchId: "main", checkpointRefs: [], objectiveState: "active", evidenceRefs: [], createdAt: at });
}

function run(fens: readonly string[], events: DrillRun["events"] = []): DrillRun {
  const nodes = fens.map((fen, index) => node(`n${index}`, fen, index));
  const branch = { id: "main", forkNodeId: "n0", label: "Main", seed: 1, origin: "played" } as const;
  const header = { id: "adaptive", sessionKind: "position", packId: null, packDigest: null, sessionDigest: "sha256:test", start: { fen: fens[0]!, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } } as const;
  // The total branch-path authority requires the run.started root declaration every real run carries.
  const started = { seq: 0, type: "run.started", at, data: { ...header, rootNode: nodes[0]!, branch, activeCursor: { nodeId: nodes[0]!.id, branchId: "main" } } } as const;
  return Object.freeze({ schemaVersion: "0.19", ...header, nodes, branches: [branch], events: [started, ...events], activeCursor: { nodeId: nodes.at(-1)!.id, branchId: "main" } } satisfies DrillRun);
}

describe("adaptive guidance runtime", { timeout: 5_000 }, () => {
  it("records the combined guidance envelope over Pack B and a 60-ply position run without gating it", () => {
    const pack = JSON.parse(readFileSync(new URL(resolvePackPath("carlsbad-minority-attack"), import.meta.url), "utf8")) as { id: string; start: { fen: string }; spine: readonly { moveUci: string; children?: readonly unknown[] }[] };
    const root = createRun({ id: "adaptive-pack-envelope", packId: pack.id, packDigest: `sha256:${"a".repeat(64)}`, startFen: pack.start.fen, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const packRuns: DrillRun[] = [root];
    const walk = (nodes: readonly { moveUci: string; children?: readonly unknown[] }[], parent: DrillRun): void => {
      for (const entry of nodes) {
        const next = commitMove(parent, entry.moveUci, { at }).run;
        packRuns.push(next);
        walk((entry.children ?? []) as readonly { moveUci: string; children?: readonly unknown[] }[], next);
      }
    };
    walk(pack.spine, root);
    const sixty = run(Array.from({ length: 61 }, (_, index) => index % 2 === 0 ? start : start.replace(" w ", " b ")));
    const durations: number[] = [];
    for (let sample = 0; sample < 20; sample += 1) {
      const started = performance.now();
      for (const candidate of packRuns) {
        const active = candidate.nodes.find((item) => item.id === candidate.activeCursor.nodeId)!;
        classifyPhase(active.fen);
        pivotalMarkers(candidate, candidate.activeCursor.branchId);
        endgameClassification(active.fen);
      }
      classifyPhase(sixty.nodes.at(-1)!.fen);
      pivotalMarkers(sixty, "main");
      endgameClassification(sixty.nodes.at(-1)!.fen);
      durations.push(performance.now() - started);
    }
    durations.sort((left, right) => left - right);
    const medianMs = durations[Math.floor(durations.length / 2)]!;
    const maxMs = durations.at(-1)!;
    console.log(`ADAPTIVE_GUIDANCE_LATENCY ${JSON.stringify({ packBSpineRuns: packRuns.length, justPlayPlies: sixty.nodes.length - 1, samples: durations.length, medianMs: Number(medianMs.toFixed(3)), maxMs: Number(maxMs.toFixed(3)) })}`);
    expect(packRuns.length).toBeGreaterThan(1);
    expect(sixty.nodes).toHaveLength(61);
    expect(Number.isFinite(maxMs)).toBe(true);
  });
});
