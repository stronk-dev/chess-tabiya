import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  AUTHORABLE_TEMPO_VERDICTS,
  TEMPO_GRADEABLE_VERDICTS,
  TEMPO_VERDICTS,
  commitMove,
  createRun,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { objectiveRules, orchestratePackMove } from "./pack-orchestrator.js";
import { validatePackDocument } from "./pack-validation.js";

const example = JSON.parse(readFileSync(
  new URL("../../../schemas/drill_pack.example.json", import.meta.url),
  "utf8",
)) as DrillPackDefinition;

function runFor(pack: DrillPackDefinition): DrillRun {
  return createRun({
    id: `tempo-${pack.id}`,
    packId: pack.id,
    packDigest: `sha256:${"4".repeat(64)}`,
    startFen: pack.start.fen,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: "2026-08-15T12:00:00.000Z",
  });
}

function play(pack: DrillPackDefinition, moves: readonly string[]): DrillRun {
  let run = runFor(pack);
  for (const move of moves) {
    const before = run;
    const committed = commitMove(run, move);
    run = orchestratePackMove(pack, before, committed).run;
  }
  return run;
}

describe("tempo vocabulary integration", () => {
  it("binds schema authorability and deployment gradeability to runtime constants", () => {
    const schema = JSON.parse(readFileSync(
      new URL("../../../schemas/drill_pack.schema.json", import.meta.url),
      "utf8",
    )) as any;
    expect(schema.$defs.tempoVerdict.enum).toEqual(AUTHORABLE_TEMPO_VERDICTS);
    expect(TEMPO_VERDICTS).toEqual(["unopened", ...AUTHORABLE_TEMPO_VERDICTS]);
    expect(TEMPO_GRADEABLE_VERDICTS.every((verdict) => TEMPO_VERDICTS.includes(verdict))).toBe(true);
  });

  it("fires the example atWindow checkpoint and grades its authored condition", () => {
    const run = play(example, ["c1e3", "e7e6", "f2f3", "b7b5"]);
    expect(run.events).toContainEqual(expect.objectContaining({
      type: "checkpoint.reached",
      data: expect.objectContaining({ checkpointId: "timing-window" }),
    }));
    expect(run.nodes.at(-1)).toMatchObject({ objectiveState: "achieved" });
  });

  it("compiles preserve_plan_window defaults with persisted tempo evidence", () => {
    const pack = structuredClone(example) as any;
    pack.objective = { type: "preserve_plan_window", summary: "Keep the race." };
    const rules = objectiveRules(pack);
    expect(rules.some((rule) => rule.evidenceRefs.includes("tempo:najdorf-race.in-time"))).toBe(true);
    const run = play(pack, ["c1e3", "e7e6", "f2f3", "b7b5"]);
    expect(run.nodes.at(-1)).toMatchObject({ objectiveState: "preserved" });
    expect(run.events).toContainEqual(expect.objectContaining({
      type: "objective.state_changed",
      data: expect.objectContaining({ evidenceRefs: ["tempo:najdorf-race.in-time"] }),
    }));
  });

  it("keeps authored outpaced ungraded by default and permits an explicit opt-in", () => {
    const base = structuredClone(example) as any;
    base.mode = "plan";
    base.legs = undefined;
    base.spine = undefined;
    base.authoredBoundary = undefined;
    base.checkpoints = [{ id: "after", trigger: { atPly: 2 } }];
    base.timingWindows = [{
      id: "short-race",
      opens: { fromStart: true },
      closes: [
        { kind: "arrival", move: { moveUci: "e7e5" } },
        { kind: "deadline", afterLearnerMoves: 3 },
      ],
      readiness: { mode: "all", of: [{ moveUci: "e2e4" }, { moveUci: "g1f3" }] },
      luxuryMoveBudget: 0,
    }];
    base.start = { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" };
    base.objective = {
      type: "play_until_checkpoint",
      summary: "Test the authored choice.",
      successConditions: [{ kind: "timing_window", windowId: "short-race", verdict: "outpaced", to: "degraded" }],
    };

    expect(validatePackDocument(base).issues).toContainEqual(expect.objectContaining({
      code: "TEMPO_VERDICT_UNGRADEABLE",
      path: "/objective/successConditions/0/verdict",
    }));
    base.timingWindows = [{ ...base.timingWindows[0]!, gradeOutpaced: true }];
    expect(validatePackDocument(base).issues.some((issue) => issue.code === "TEMPO_VERDICT_UNGRADEABLE")).toBe(false);
    expect(play(base, ["e2e4", "e7e5"]).nodes.at(-1)).toMatchObject({ objectiveState: "degraded" });
  });

  it("pins every tempo refusal code", () => {
    const candidate = structuredClone(example) as any;
    candidate.objective = { type: "preserve_plan_window", summary: "Window." };
    candidate.timingWindows = [
      {
        id: "duplicate",
        opens: { onMove: [{ moveUci: "c1e3" }] },
        closes: [{ kind: "release", move: { moveUci: "c1e3" } }],
        readiness: { mode: "all", of: [{ piece: { color: "white", role: "bishop" } }, { piece: { color: "white", role: "knight" } }] },
        tolerated: [{ piece: { color: "white", role: "bishop" } }],
        luxuryMoveBudget: 0,
      },
      {
        id: "duplicate",
        opens: { fromStart: true },
        closes: [{ kind: "deadline", afterLearnerMoves: 1 }],
        readiness: { mode: "all", of: [{ piece: { color: "white", role: "bishop" } }, { piece: { color: "white", role: "knight" } }] },
        luxuryMoveBudget: 0,
      },
    ];
    candidate.checkpoints = [{ id: "unknown", trigger: { atWindow: { windowId: "missing", verdict: "open" } } }];
    const codes = new Set(validatePackDocument(candidate).issues.map((issue) => issue.code));
    for (const code of [
      "TIMING_WINDOW_DUPLICATE_ID",
      "TIMING_WINDOW_UNKNOWN",
      "TIMING_WINDOW_OPEN_IS_CLOSE",
      "TIMING_WINDOW_TOLERATES_READINESS",
      "TIMING_WINDOW_READINESS_UNREACHABLE",
    ]) expect(codes.has(code), code).toBe(true);

    const noWindow = structuredClone(example) as any;
    noWindow.objective = { type: "preserve_plan_window", summary: "Window." };
    noWindow.timingWindows = undefined;
    expect(validatePackDocument(noWindow).issues).toContainEqual(expect.objectContaining({ code: "PLAN_WINDOW_NEEDS_WINDOW" }));
  });
});
