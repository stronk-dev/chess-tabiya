// DISPOSABLE research harness — D645 objective lifecycle / authored-boundary diagnosis.
import { readFileSync, writeFileSync } from "node:fs";

import {
  appendOpponentPly,
  commitMove,
  createRun,
  type DrillRun,
  type MutationResult,
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import type { SpineNode } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import {
  orchestratePackMove,
  orchestratePackStart,
  planSignatureResolver,
  type PlanSignatureResolver,
} from "../../apps/server/src/pack-orchestrator.js";
import { PackRegistry, type PackRecord } from "../../apps/server/src/pack-registry.js";
import { PrincipleRegistry } from "../../apps/server/src/principle-registry.js";
import { ShapeRegistry } from "../../apps/server/src/shape-registry.js";

const OUT = new URL("../../planning/feedback-delivery/objective-lifecycle-diagnosis.md", import.meta.url).pathname;
const at = "2026-08-21T09:00:00.000Z";
const terminalStates = new Set(["achieved", "failed", "transitioned"]);

function leafPaths(nodes: readonly SpineNode[], prefix: readonly SpineNode[] = []): readonly (readonly SpineNode[])[] {
  return nodes.flatMap((node) => node.children.length === 0
    ? [[...prefix, node]]
    : leafPaths(node.children, [...prefix, node]));
}

function learnerToMove(fen: string, learner: "white" | "black"): boolean {
  return (fen.split(" ")[1] === "w" ? "white" : "black") === learner;
}

function selection(pack: PackRecord, moveUci: string): OpponentSelection {
  return {
    moveUci,
    policyModeApplied: pack.document.opponentPolicy.mode,
    engine: { id: "d645-objective-lifecycle", name: "Authored path driver", version: "1", seedHonored: true },
  };
}

function play(
  pack: PackRecord,
  run: DrillRun,
  moveUci: string,
  resolvePlanSignature: PlanSignatureResolver,
): MutationResult {
  const cursor = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
  const mutation = learnerToMove(cursor.fen, pack.document.start.side)
    ? commitMove(run, moveUci, { at })
    : appendOpponentPly(run, selection(pack, moveUci), { at });
  return orchestratePackMove(pack.document, run, mutation, resolvePlanSignature);
}

type Block = {
  readonly packId: string;
  readonly objectiveType: string;
  readonly spineNodeId: string;
  readonly ply: number;
  readonly to: string;
  readonly evidenceRefs: readonly string[];
  readonly remaining: number;
};

describe("D645 objective lifecycle diagnosis", () => {
  it("records every authored path hidden behind an absorbing objective transition", async () => {
    const shapes = await ShapeRegistry.loadDefault();
    const principles = await PrincipleRegistry.loadDefault();
    const registry = await PackRegistry.loadDefault({ development: true, shapes, principles });
    const blocks: Block[] = [];

    for (const summary of registry.list()) {
      const pack = registry.required(summary.id);
      const resolvePlanSignature = planSignatureResolver(pack.document, shapes);
      for (const path of leafPaths(pack.document.spine ?? [])) {
        let run = createRun({
          id: `d645-${pack.document.id}-${path.at(-1)?.id ?? "empty"}`,
          session: {
            kind: "pack",
            packId: pack.document.id,
            packDigest: pack.digest,
            start: pack.document.start,
            feedbackPolicy: pack.feedbackPolicy,
            opponentPolicy: pack.document.opponentPolicy,
          },
          sessionDigest: pack.digest,
          policyConfig: {
            seedMode: pack.document.opponentPolicy.seedMode ?? "fixed",
            locus: { executedAt: "server", engineIds: [], modelIds: [] },
          },
          seed: 29,
          createdAt: at,
        });
        run = orchestratePackStart(pack.document, run).run;
        for (const [index, spineNode] of path.entries()) {
          const mutation = play(pack, run, spineNode.moveUci, resolvePlanSignature);
          run = mutation.run;
          const transition = mutation.emitted.find((event) =>
            event.type === "objective.state_changed" && terminalStates.has(event.data.to));
          if (transition?.type === "objective.state_changed" && index < path.length - 1) {
            blocks.push({
              packId: pack.document.id,
              objectiveType: pack.document.objective.type,
              spineNodeId: spineNode.id,
              ply: index + 1,
              to: transition.data.to,
              evidenceRefs: transition.data.evidenceRefs,
              remaining: path.length - index - 1,
            });
            break;
          }
        }
      }
    }

    const grouped = new Map<string, Block[]>();
    for (const block of blocks) grouped.set(block.packId, [...(grouped.get(block.packId) ?? []), block]);
    const rows = [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([packId, entries]) => {
      const sites = [...new Map(entries.map((entry) => [
        `${entry.spineNodeId}:${entry.to}:${entry.evidenceRefs.join(",")}`,
        entry,
      ])).values()];
      return `| \`${packId}\` | ${entries[0]!.objectiveType} | ${entries.length} | ${Math.max(...entries.map((entry) => entry.remaining))} | ${sites.map((entry) => `\`${entry.spineNodeId}\` ply ${entry.ply} → **${entry.to}** (${entry.evidenceRefs.join(", ")})`).join("<br>")} |`;
    });
    const report = `# Objective lifecycle versus authored consequence — D645\n\n`+
      `Measured: 2026-08-21. Disposable harness replayed every authored leaf independently through the shipped runtime and real plan-signature resolver. A row means an objective entered an absorbing state while that same authored path still had moves remaining.\n\n`+
      `- Affected packs: ${grouped.size}/${registry.list().length}.\n`+
      `- Affected authored leaf paths: ${blocks.length}.\n`+
      `- Maximum authored plies hidden behind an absorbing objective transition: ${Math.max(0, ...blocks.map((entry) => entry.remaining))}.\n\n`+
      `| Pack | Objective | blocked leaf paths | max hidden plies | first absorbing site(s) |\n`+
      `|---|---:|---:|---:|---|\n${rows.join("\n")}\n`;

    if (process.env.UPDATE_OBJECTIVE_LIFECYCLE === "1") {
      let current = "";
      try { current = readFileSync(OUT, "utf8"); } catch { /* first measurement */ }
      if (current !== report) writeFileSync(OUT, report);
    } else {
      expect(report).toBe(readFileSync(OUT, "utf8"));
    }
    expect(grouped.size).toBe(0);
  });
});
