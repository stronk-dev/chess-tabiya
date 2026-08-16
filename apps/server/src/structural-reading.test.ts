import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { appendOpponentPly, commitMove, createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { objectiveRules, orchestratePackMove, planSignatureResolver } from "./pack-orchestrator.js";
import { validatePackDocument } from "./pack-validation.js";

const pack = JSON.parse(readFileSync(new URL("../../../content/drafts/carlsbad-minority-attack.json", import.meta.url), "utf8")) as DrillPackDefinition;
const carlsbad = JSON.parse(readFileSync(new URL("../../../content/shapes/carlsbad.json", import.meta.url), "utf8"));
const shapes = { get: (id: string) => id === "carlsbad" ? { document: carlsbad } : undefined };
const resolvePlan = planSignatureResolver(pack, shapes);
const at = "2026-08-14T12:00:00.000Z";

function newRun() {
  return createRun({ id: "carlsbad-structure", packId: pack.id, packDigest: `sha256:${"c".repeat(64)}`, startFen: pack.start.fen, seed: 3, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
}

describe("structural pack orchestration", () => {
  it("grades Pack B on the transition that produces both structural leaves", () => {
    expect(validatePackDocument(pack).valid).toBe(true);
    expect(objectiveRules(pack, pack.objective, "/objective", resolvePlan)).toHaveLength(3);
    let run = newRun();
    const moves = ["d7f8", "a2a3", "f6e4", "a1b1", "e4c3", "b2b4", "c8g4", "b4b5", "h7h6", "b5c6", "b7c6"];
    for (const [index, moveUci] of moves.entries()) {
      const before = run;
      const mutation = index % 2 === 0
        ? appendOpponentPly(run, { moveUci, policyModeApplied: "human_common", engine: { id: "mock", name: "Mock", version: "1", seedHonored: true } }, { at })
        : commitMove(run, moveUci, { actor: "user", at });
      run = orchestratePackMove(pack, before, mutation, resolvePlan).run;
    }
    const transitions = run.events.filter((event) => event.type === "objective.state_changed");
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({ data: { from: "active", to: "achieved", evidenceRefs: ["rules:transition-slider-lines-changed", "rules:structure-backward-pawn", "rules:structure-half-open-file"] } });
    const objectiveNode = run.nodes.find((node) => node.id === transitions[0]!.data.nodeId)!;
    expect(pack.authoredBoundary?.plyHorizon).toBeGreaterThanOrEqual(objectiveNode.ply);
  });

  it("refuses plan objectives that compile to nothing but preserves honest ungraded packs", () => {
    const empty = structuredClone(pack) as any;
    delete empty.objective.successConditions;
    expect(validatePackDocument(empty).issues).toContainEqual(expect.objectContaining({ code: "OBJECTIVE_GRADES_NOTHING", path: "/objective" }));
    empty.objective.type = "play_until_checkpoint";
    expect(validatePackDocument(empty).issues.some((issue) => issue.code === "OBJECTIVE_GRADES_NOTHING")).toBe(false);
  });

  it("refuses malformed structural expressions at load", () => {
    const invalid = structuredClone(pack) as any;
    invalid.objective.successConditions[0] = { kind: "structural_feature", feature: { kind: "feature", feature: { kind: "outpost", color: "white", square: "e2" } }, to: "achieved" };
    expect(validatePackDocument(invalid).issues).toContainEqual(expect.objectContaining({ code: "OUTPOST_RANK_OUT_OF_RANGE" }));
  });

  it("carries a quantified template kind into objective evidence refs", () => {
    const quantified = structuredClone(pack) as any;
    quantified.objective.successConditions[0] = { kind: "structural_feature", to: "achieved", feature: {
      kind: "quantified",
      quantifier: "some",
      over: { files: { from: "a", to: "h" } },
      feature: { kind: "isolated_pawn", color: "black" },
    }};
    expect(objectiveRules(quantified)[0]?.evidenceRefs).toEqual(["rules:structure-isolated-pawn"]);
  });
});
