import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  commitMove,
  createRun,
  deriveSegments,
  reachCheckpoint,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { objectiveRules, orchestratePackMove, orchestratePackStart } from "./pack-orchestrator.js";
import { validatePackDocument } from "./pack-validation.js";

const at = "2026-08-12T12:00:00.000Z";
const fixture = JSON.parse(
  readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"),
) as DrillPackDefinition;

function pack(type: "win" | "hold" | "save" | "resist"): DrillPackDefinition {
  return {
    ...structuredClone(fixture),
    id: `outcome-${type}`,
    mode: "outcome",
    objective: {
      type,
      summary: `${type} fixture`,
      grading: {
        assessedBy: { kind: "authored", note: "Fixture assessment." },
        resolveAt: { kind: "checkpoint", checkpointId: "resolution" },
      },
      successConditions: [],
    },
    checkpoints: [{ id: "resolution", label: "Resolution", trigger: { atPly: 1 }, actions: [] }],
  };
}

function root(document: DrillPackDefinition): DrillRun {
  return createRun({
    id: document.id,
    session: {
      kind: "pack",
      packId: document.id,
      packDigest: `sha256:${"a".repeat(64)}`,
      start: {
        fen: document.start.fen,
        side: document.start.side === "black" ? "black" : "white",
      },
      feedbackPolicy: "delayed_checkpoint",
      opponentPolicy: { mode: "human_common" },
    },
    sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: at,
  });
}

describe("Outcome Drill grading", () => {
  it.each(["win", "hold", "save", "resist"] as const)(
    "compiles automatic rules for condition-less %s objectives",
    (type) => {
      const document = pack(type);
      delete (document.objective as { successConditions?: unknown }).successConditions;
      expect(objectiveRules(document).length).toBeGreaterThanOrEqual(6);
    },
  );

  it("grades a condition-less win when the committed move reaches mate", () => {
    const document = pack("win");
    delete (document.objective as { successConditions?: unknown }).successConditions;
    (document as { start: { fen: string; side: "white" } }).start = {
      fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
      side: "white",
    };
    const before = root(document);
    const committed = commitMove(before, "g6g7", { at });
    const result = orchestratePackMove(document, before, committed);
    expect(result.run.nodes.at(-1)?.objectiveState).toBe("achieved");
    expect(result.emitted).toContainEqual(expect.objectContaining({
      type: "objective.state_changed",
      data: expect.objectContaining({ evidenceRefs: ["rules:result-win"] }),
    }));
  });

  it.each([
    ["win", "win", "achieved"], ["win", "draw", "failed"], ["win", "loss", "failed"],
    ["hold", "win", "achieved"], ["hold", "draw", "achieved"], ["hold", "loss", "failed"],
    ["save", "win", "achieved"], ["save", "draw", "achieved"], ["save", "loss", "failed"],
  ] as const)("grades %s against %s as %s", (type, outcome, expected) => {
    const document = pack(type);
    const rules = objectiveRules(document).filter(
      (rule) => rule.when.type === "outcomeReached" && rule.when.result === outcome,
    );
    expect(rules).toHaveLength(3);
    expect(new Set(rules.map((rule) => rule.to))).toEqual(new Set([expected]));
  });

  it("grades a resist loss from path checkpoint history, not current state", () => {
    const document = pack("resist");
    const success = objectiveRules(document).filter(
      (rule) => rule.to === "achieved" && rule.when.type === "all",
    );
    expect(success).toHaveLength(3);
    expect(success.map((rule) => rule.from)).toEqual([
      "active",
      "preserved",
      "degraded",
    ]);
    expect(success[0]!.when).toEqual({
      type: "all",
      predicates: [
        { type: "outcomeReached", result: "loss" },
        { type: "checkpointReached", checkpointId: "resolution" },
      ],
    });
  });

  it("orders degradation before resolution and excludes every monotone back-edge", () => {
    const base = pack("hold");
    const document: DrillPackDefinition = {
      ...base,
      objective: {
        ...base.objective,
        successConditions: [
          {
            kind: "material_balance",
            perspective: "white",
            comparison: "atLeast",
            value: 0,
            to: "degraded",
          },
        ],
      },
    };
    const rules = objectiveRules(document);
    const degradation = rules.findIndex((rule) => rule.to === "degraded");
    const resolution = rules.findIndex((rule) => rule.to === "preserved");
    expect(degradation).toBeGreaterThanOrEqual(0);
    expect(degradation).toBeLessThan(resolution);
    expect(rules.filter((rule) => rule.to === "preserved").map((rule) => rule.from)).toEqual(["active"]);
    expect(rules.filter((rule) => rule.to === "degraded").map((rule) => rule.from)).toEqual(["active", "preserved"]);
  });

  it("rejects Pack C v0.1's root-true checkpoint and accepts v0.2", () => {
    const current = JSON.parse(readFileSync(new URL("../../../content/drafts/rook-4v3-same-side.json", import.meta.url), "utf8")) as DrillPackDefinition;
    const broken = structuredClone(current) as DrillPackDefinition;
    (broken as { version: string }).version = "0.1.0";
    (broken.checkpoints.find((checkpoint) => checkpoint.id === "still-holding") as any).trigger = {
      materialBalance: { perspective: "black", comparison: "atLeast", value: -1 },
    };
    expect(validatePackDocument(broken).issues).toContainEqual(expect.objectContaining({ code: "CHECKPOINT_TRUE_AT_ROOT" }));
    expect(validatePackDocument(current).valid).toBe(true);
  });

  it("does not emit a zero-length segment for coincident checkpoints", () => {
    let run = root(pack("hold"));
    run = reachCheckpoint(run, "first", at).run;
    run = reachCheckpoint(run, "second", at).run;
    expect(run.events.some((event) => event.type === "segment.completed")).toBe(false);
  });

  it("keeps two same-ply orchestrator checkpoints without inventing a segment", () => {
    const document = {
      ...pack("hold"),
      start: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        side: "white" as const,
      },
      checkpoints: [
        { id: "first", trigger: { atPly: 1 }, actions: [] },
        { id: "second", trigger: { atPly: 1 }, actions: [] },
      ],
    } satisfies DrillPackDefinition;
    const before = root(document);
    const committed = commitMove(before, "e2e4", { at });
    const run = orchestratePackMove(document, before, committed).run;

    expect(run.events.filter((event) => event.type === "checkpoint.reached")).toHaveLength(2);
    expect(run.events.filter((event) => event.type === "segment.completed")).toHaveLength(0);
    expect(deriveSegments(run)).toEqual([]);
  });

  it("fires an atStart checkpoint before the first move", () => {
    const document = { ...pack("hold"), checkpoints: [{ id: "root-intent", trigger: { atStart: true }, actions: [], interaction: { type: "intent_capture", planClassIds: ["hold"] } }] } as DrillPackDefinition;
    const started = orchestratePackStart(document, root(document));
    expect(started.emitted).toEqual([expect.objectContaining({ type: "checkpoint.reached", data: expect.objectContaining({ checkpointId: "root-intent", nodeId: started.run.nodes[0]!.id }) })]);
  });

  it("compiles the newly declarable draw rules fact without throwing", () => {
    const document = pack("hold");
    (document.objective as any).successConditions = [{ kind: "rules_fact", fact: "draw", to: "achieved" }];
    const validation = validatePackDocument(document);
    expect(validation.valid, JSON.stringify(validation.issues)).toBe(true);
    expect(() => objectiveRules(document)).not.toThrow();
    expect(objectiveRules(document).some((rule) => rule.evidenceRefs.includes("rules:draw"))).toBe(true);
  });
});
