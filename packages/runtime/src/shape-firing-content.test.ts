import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import { commitMove, createRun } from "./runtime.js";

describe("shapeFirings", { timeout: 5_000 }, () => {
  it("records the four-entry firing envelope over every Pack B spine node without gating it", () => {
    const pack = JSON.parse(readFileSync(new URL(resolvePackPath("carlsbad-minority-attack"), import.meta.url), "utf8"));
    const entries = ["carlsbad", "iqp-white", "iqp-black", "rook-4v3-same-side"].map((id) => JSON.parse(readFileSync(new URL(`../../../content/shapes/${id}.json`, import.meta.url), "utf8")) as ShapeTriggerSource);
    const root = createRun({ id: "shape-envelope", packId: pack.id, packDigest: `sha256:${"a".repeat(64)}`, startFen: pack.start.fen, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: "2026-08-14T00:00:00.000Z" });
    const positions: { id: string; fen: string }[] = [{ id: root.nodes[0]!.id, fen: root.nodes[0]!.fen }];
    const walk = (nodes: readonly any[], run: typeof root): void => { for (const node of nodes) { const next = commitMove(run, node.moveUci, { at: "2026-08-14T00:00:00.000Z" }).run; const active = next.nodes.find((candidate) => candidate.id === next.activeCursor.nodeId)!; positions.push({ id: active.id, fen: active.fen }); walk(node.children ?? [], next); } };
    walk(pack.spine, root);
    const durations: number[] = [];
    for (let sample = 0; sample < 20; sample += 1) { const started = performance.now(); for (const position of positions) shapeFirings(entries, [position]); durations.push(performance.now() - started); }
    durations.sort((a, b) => a - b); const medianMs = durations[Math.floor(durations.length / 2)]!, maxMs = durations.at(-1)!;
    console.log(`SHAPE_LATENCY ${JSON.stringify({ entries: entries.length, spineNodes: positions.length, samples: durations.length, medianMs: Number(medianMs.toFixed(3)), maxMs: Number(maxMs.toFixed(3)) })}`);
    expect(positions.length).toBeGreaterThan(1); expect(Number.isFinite(maxMs)).toBe(true);
  });
});
