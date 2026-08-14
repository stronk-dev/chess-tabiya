import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { appendOpponentPly, commitMove, createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { objectiveRules, orchestratePackMove } from "./pack-orchestrator.js";
import { validatePackDocument } from "./pack-validation.js";

const pack = JSON.parse(readFileSync(new URL("../../../content/drafts/carlsbad-minority-attack.json", import.meta.url), "utf8")) as DrillPackDefinition;
const at = "2026-08-14T12:00:00.000Z";

function newRun() {
  return createRun({ id: "carlsbad-structure", packId: pack.id, packDigest: `sha256:${"c".repeat(64)}`, startFen: pack.start.fen, seed: 3, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
}

describe("structural pack orchestration", () => {
  it("grades Pack B's minority attack from both structural leaves", () => {
    expect(validatePackDocument(pack).valid).toBe(true);
    expect(objectiveRules(pack)).toHaveLength(3);
    let run = newRun();
    const moves = ["d7f8", "a2a3", "f6e4", "a1b1", "e4c3", "b2b4", "c8g4", "b4b5", "h7h6", "b5c6", "b7c6"];
    for (const [index, moveUci] of moves.entries()) {
      const before = run;
      const mutation = index % 2 === 0
        ? appendOpponentPly(run, { moveUci, policyModeApplied: "human_common", engine: { id: "mock", name: "Mock", version: "1", seedHonored: true } }, { at })
        : commitMove(run, moveUci, { actor: "user", at });
      run = orchestratePackMove(pack, before, mutation).run;
    }
    const transitions = run.events.filter((event) => event.type === "objective.state_changed");
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({ data: { from: "active", to: "achieved", evidenceRefs: ["rules:structure-backward-pawn", "rules:structure-half-open-file"] } });
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
    invalid.objective.successConditions[0].feature = { kind: "feature", feature: { kind: "outpost", color: "white", square: "e2" } };
    expect(validatePackDocument(invalid).issues).toContainEqual(expect.objectContaining({ code: "OUTPOST_RANK_OUT_OF_RANGE" }));
  });
});
