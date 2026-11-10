import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STRUCTURAL_CONVENTION_REFS, type DrillPackDefinition, type StructuralExpression, type TransitionExpression, type TimingWindowDefinition } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { commitMove, createRun, evaluateObjectivePredicate, readBackReplay } from "@chess-tabiya/runtime";
import { matchesCurrentTransitionExpression } from "../../../packages/runtime/src/transition.js";
import { currentWindowStates, tempoMovesFromRun } from "../../../packages/runtime/src/tempo.js";
import { authoredStructuralDocument, readAuthoredStructuralConditionSource, selectAuthoredStructuralCondition } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as populations from "../../../packages/runtime/src/authored-predicate-population.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { validatePackDocument } from "./pack-validation.js";
import { validateShapeEntry } from "./shape-validation.js";
import { ShapeRegistry } from "./shape-registry.js";
import { PackRegistry } from "./pack-registry.js";
import { SQLiteRunStorage } from "./storage.js";
import { RunService } from "./service.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { checkpointMatches, objectiveRules, planSignatureResolver } from "./pack-orchestrator.js";

afterEach(() => vi.restoreAllMocks());
const at = "2026-11-04T00:00:00.000Z";
const kings = "8/8/8/8/8/4k3/P7/4K3 b - - 0 1";
const occupancy = (square: "b5" | "b7"): StructuralExpression => ({ kind: "pieceOnSquare", square, piece: { color: "black", role: "pawn" } });
const outpost: StructuralExpression = { kind: "feature", feature: { kind: "outpost", color: "white", square: "e5", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } };
function base(): DrillPackDefinition { return JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8")); }
function runAt(fen: string, side: "white" | "black" = "white") {
  return createRun({ id: "authored-current-runtime", session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: "sha256:" + "a".repeat(64), seed: 1, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, createdAt: at });
}
function played(pack: DrillPackDefinition) {
  let run = runAt(pack.start.fen, pack.start.side);
  for (const move of ["c1e3", "e7e6", "f2f3", "b7b5"]) run = commitMove(run, move, { at }).run;
  return run;
}
function shape(trigger: StructuralExpression): ShapeEntryDefinition {
  return { id: "current-temporal-source", version: "1.0.0", name: "Mechanical source fixture", phases: ["endgame"], trigger,
    plans: (["white", "black"] as const).map(side => ({ id: side, side, label: "Mechanical", description: "No chess judgement", success: { note: "Literal predicate", signature: structuredClone(trigger) } })),
    watch: ["Mechanical fixture"], typicalMistakes: ["Mechanical fixture"], provenance: { licence: "CC0-1.0", sources: ["Mechanical test"], attribution: [{ title: "Mechanical fixture", author: "Tabiya tests", licence: "CC0-1.0" }] } };
}
function owned(trigger: StructuralExpression) {
  const checked = validateShapeEntry(shape(trigger));
  expect(checked.issues.filter(row => row.severity === "error")).toEqual([]);
  return readAuthoredStructuralConditionSource(selectAuthoredStructuralCondition(authoredStructuralDocument(checked.document!), "/trigger")).effectiveExpression;
}
function window(feature: StructuralExpression): TimingWindowDefinition {
  return { id: "current-window", opens: { fromStart: true }, closes: [{ kind: "position", feature }, { kind: "deadline", afterLearnerMoves: 3 }],
    readiness: { mode: "all", of: [{ moveUci: "e3d3" }] }, luxuryMoveBudget: 1 };
}

describe("current authored timing and transition operations", () => {
  it.each(["timing", "transition"] as const)("persists a real owned %s pack move through the registered service and replays it", async mode => {
    let position = runAt(base().start.fen);
    for (const move of ["c1e3", "e7e6"]) position = commitMove(position, move, { at }).run;
    const after: StructuralExpression = { kind: "all", of: [{ kind: "pieceOnSquare", square: "f3", piece: { color: "white", role: "pawn" } }, { kind: "not", of: outpost }] };
    const transition: TransitionExpression = { kind: "all", of: [
      { kind: "position", at: "before", expression: { kind: "pieceOnSquare", square: "f2", piece: { color: "white", role: "pawn" } } },
      { kind: "position", at: "after", expression: after },
    ] };
    const document = withDerivedRequires({ id: `stored-current-${mode}`, version: "1.0.0", title: "Mechanical source fixture", mode: "plan", phase: "opening",
      start: { fen: position.nodes.at(-1)!.fen, side: "white" },
      objective: mode === "timing" ? { type: "preserve_plan_window", summary: "Mechanical timing state" } : { type: "play_until_checkpoint", summary: "Mechanical transition", successConditions: [{ kind: "transition_feature", transition }] },
      ...(mode === "timing" ? { timingWindows: [{ id: "stored-window", opens: { fromStart: true }, closes: [{ kind: "position", feature: after }, { kind: "deadline", afterLearnerMoves: 2 }], readiness: { mode: "all", of: [{ moveUci: "f2f3" }] }, luxuryMoveBudget: 0 }] } : {}),
      spine: [{ id: "f3", moveUci: "f2f3", moveSan: "f3", children: [] }], checkpoints: [{ id: "done", trigger: { atSpineNode: "f3" } }],
      opponentPolicy: { mode: "human_common", seedMode: "fixed" }, feedbackPolicy: "delayed_checkpoint", provenance: { reviewStatus: "draft", sources: [], reviewers: [] }, requires: [],
    });
    const registry = await PackRegistry.fromDocuments([{ source: "mechanical-current-runtime", value: document }]);
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    // Genuine unavailable queued engine; these rule-derived objective facts do not require evals.
    const queue = new EvidenceJobQueue({ async execute() { throw new Error("test engine offline"); } });
    try {
      const principal = { learnerId: "current-learner", handle: "current-learner" }, lease = { learnerId: principal.learnerId, writerId: "current-writer" };
      storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
      const service = new RunService(storage, { packRegistry: registry, evidenceQueue: queue });
      const run = await service.create({ id: `stored-${mode}`, session: { kind: "pack", packId: document.id }, seed: 1, createdAt: at,
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } }, lease);
      const moved = service.move(run.id, principal, lease.writerId, "f2f3", { at });
      expect(moved.run.nodes.at(-1)!.objectiveState).toBe(mode === "timing" ? "preserved" : "achieved");
      await queue.close();
      const stored = storage.read(run.id)!.run;
      expect(stored.nodes.at(-1)!.moveUci).toBe("f2f3");
      expect(stored.nodes.at(-1)!.objectiveState).toBe(mode === "timing" ? "preserved" : "achieved");
      expect(readBackReplay(stored.events).run).toEqual(stored);
    } finally { await queue.close(); storage.close(); }
  });

  it("D4111 admits static bindings before pure-transition short circuits or unopened timing returns", () => {
    const expression = owned(outpost), run = runAt(kings, "black"), next = commitMove(run, "e3d3", { at }).run;
    const transition: TransitionExpression = { kind: "any", of: [
      { kind: "feature", feature: { kind: "attacked_squares_changed", color: "black", direction: "gained", comparison: "atLeast", count: 0 } },
      { kind: "position", at: "after", expression },
    ] };
    const unopened = { ...window(expression), opens: { onMove: [{ moveUci: "e3d3" }] } };
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(matchesCurrentTransitionExpression(kings, "e3d3", next.nodes.at(-1)!.fen, transition)).toBe(true);
    expect(currentWindowStates([unopened], [], "black")[0]!.verdict).toBe("unopened");
    expect(invoke).not.toHaveBeenCalled();
    vi.spyOn(execution, "compileEvidenceConsumerExecutionV2").mockImplementation(() => { throw new Error("static binding refused"); });
    expect(() => matchesCurrentTransitionExpression(kings, "e3d3", next.nodes.at(-1)!.fen, transition)).toThrow("static binding refused");
    expect(() => currentWindowStates([unopened], [], "black")).toThrow("static binding refused");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("D4110 authenticates original structural opening and boundary inputs on an empty path", async () => {
    const registry = new ShapeRegistry(), document = shape(outpost); await registry.add(document, "community");
    const source = selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(document.id)!, "/trigger");
    const expression = readAuthoredStructuralConditionSource(source).effectiveExpression;
    const opening: TimingWindowDefinition = { ...window(expression), opens: { onTrigger: { fenPredicate: { type: "structuralFeature", feature: expression } } }, closes: [{ kind: "deadline", afterLearnerMoves: 3 }] };
    expect(currentWindowStates([opening], [], "black")[0]!.verdict).toBe("unopened");
    const bad = { ...opening, opens: { onTrigger: { fenPredicate: { type: "structuralFeature" as const, feature: structuredClone(expression) } } } };
    expect(() => currentWindowStates([bad], [], "black")).toThrow(/original live authored source/);
    const goodPredicate = { type: "structuralFeature" as const, feature: expression, authoredSource: source };
    const badPredicate = { ...goodPredicate, feature: structuredClone(expression) };
    for (const openingTrigger of [
      { type: "fenPredicate" as const, predicate: badPredicate },
      { type: "outsideAuthoredBoundary" as const, spineTransposeKeys: [], fenPredicates: [badPredicate] },
    ]) expect(() => evaluateObjectivePredicate(runAt(kings), { type: "authoredTimingWindow", window: opening, learner: "black", verdict: "unopened", openingTrigger })).toThrow(/original live authored source/);
    await registry.add({ ...document, version: "1.0.1" }, "community");
    expect(() => currentWindowStates([opening], [], "black")).toThrow(/original live authored source/);
    expect(() => evaluateObjectivePredicate(runAt(kings), { type: "authoredTimingWindow", window: opening, learner: "black", verdict: "unopened", openingTrigger: { type: "fenPredicate", predicate: goodPredicate } })).toThrow(/original live authored source/);
  });

  it("D4110 keeps actual opening/checkpoint validation in authoring2 and reports source failure separately", () => {
    const original = base(), feature: StructuralExpression = { kind: "all", of: [occupancy("b5"), { kind: "not", of: outpost }] };
    const input = withDerivedRequires({ ...original,
      timingWindows: original.timingWindows!.map(row => ({ ...row, opens: { onTrigger: { fenPredicate: { type: "structuralFeature" as const, feature } } } })),
      checkpoints: [...original.checkpoints, { id: "source-checkpoint", trigger: { fenPredicate: { type: "structuralFeature" as const, feature } } }],
    });
    const checked = validatePackDocument(input), pack = checked.document!;
    expect(checked.issues.some(row => row.code === "STRUCTURAL_SOURCE_UNAVAILABLE" || row.code === "START_POSITION_UNRUNNABLE")).toBe(false);
    const resolver = planSignatureResolver(pack), run = played(pack), compile = vi.spyOn(execution, "compileEvidenceConsumerExecutionV2");
    for (const id of ["source-checkpoint", "timing-window"]) {
      compile.mockClear();
      const index = pack.checkpoints.findIndex(row => row.id === id);
      checkpointMatches(pack, run, pack.checkpoints[index]!, resolver, `/checkpoints/${index}/trigger`, "authoring");
      expect(compile.mock.calls.map(row => row[1])).toContainEqual({ id: "authoring.predicate", version: 2 });
      expect(compile.mock.calls.map(row => row[1])).not.toContainEqual({ id: "runtime.objective_condition", version: 2 });
    }
    const capture = populations.captureAuthoredPredicatePopulation;
    vi.spyOn(populations, "captureAuthoredPredicatePopulation").mockImplementation((source, position, policy) => {
      if (readAuthoredStructuralConditionSource(source).pointer.includes("/checkpoints/")) return { kind: "unavailable", reason: "source_dependency_unavailable" } as never;
      return capture(source, position, policy);
    });
    const failed = validatePackDocument(input);
    expect(failed.issues).toContainEqual(expect.objectContaining({ code: "STRUCTURAL_SOURCE_UNAVAILABLE", path: "/checkpoints" }));
    expect(failed.issues.some(row => row.code === "START_POSITION_UNRUNNABLE")).toBe(false);
  });

  it("D4112 retains a precise diagnostic for actual missing registered plan-source expansion", async () => {
    const shapes = new ShapeRegistry(), entry = shape(occupancy("b5")); await shapes.add(entry, "community");
    const original = base(), input = withDerivedRequires({ ...original, shapes: [entry.id],
      planClasses: [{ id: "source-plan", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } }],
      objective: { ...original.objective, successConditions: [{ kind: "transition_feature", transition: { kind: "position", at: "after", expression: { kind: "plan_signature", planClassId: "source-plan" } } }] },
    }, { shapes });
    const result = validatePackDocument(input); // Actual required lookup absent, never a synthetic signature.
    const path = "/objective/successConditions/0/transition";
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "STRUCTURAL_SOURCE_UNAVAILABLE", path }));
    expect(result.issues.filter(row => row.path === path).some(row => row.code === "TRANSITION_EXPRESSION_NEVER_PRESENT" || row.code === "TRANSITION_EXPRESSION_NEVER_ABSENT")).toBe(false);
  });

  it("executes real compiler before/after expressions with their exact original pointers", () => {
    const original = base();
    const condition: TransitionExpression = { kind: "all", of: [
      { kind: "position", at: "before", expression: occupancy("b7") },
      { kind: "position", at: "after", expression: { kind: "all", of: [occupancy("b5"), { kind: "not", of: outpost }] } },
    ] };
    const checked = validatePackDocument(withDerivedRequires({ ...original, objective: { ...original.objective, successConditions: [{ kind: "transition_feature", transition: condition }] } }));
    expect(checked.issues.filter(row => row.severity === "error")).toEqual([]);
    const pack = checked.document!, resolver = planSignatureResolver(pack), run = played(pack);
    const rule = objectiveRules(pack, pack.objective, "/objective", resolver).find(row => row.id === "pack-success-0-active")!;
    expect(rule.when.type).toBe("authoredTransitionFeature");
    const invoke = routes.invokeEvidenceValueRoute, pointers: string[] = [];
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      const result = invoke(route, input);
      if (route === "authored.structural_condition.input@2" && "payload" in result) pointers.push((result.payload as { pointer: string }).pointer);
      return result;
    });
    expect(evaluateObjectivePredicate(run, rule.when)).toBe(true);
    expect(pointers).toEqual(["/objective/successConditions/0/transition/of/0/expression", "/objective/successConditions/0/transition/of/1/expression"]);
    expect(evaluateObjectivePredicate(runAt(pack.start.fen), rule.when)).toBe(false);
  });

  it("D4106 preserves the owned resolver through all default timing rules and atWindow checkpoints", () => {
    const original = base(), feature: StructuralExpression = { kind: "all", of: [occupancy("b5"), { kind: "not", of: outpost }] };
    const checked = validatePackDocument(withDerivedRequires({ ...original, objective: { type: "preserve_plan_window", summary: "Mechanical timing fixture" },
      timingWindows: original.timingWindows!.map(row => ({ ...row, gradeOutpaced: true, closes: [{ kind: "position", feature }, ...row.closes.filter(close => close.kind === "deadline")] })) }));
    expect(checked.issues.filter(row => row.severity === "error")).toEqual([]);
    const pack = checked.document!, run = played(pack), resolver = planSignatureResolver(pack);
    const rules = objectiveRules(pack, pack.objective, "/objective", resolver);
    expect(rules.every(row => row.when.type === "authoredTimingWindow")).toBe(true);
    for (const rule of rules) expect(() => evaluateObjectivePredicate(run, rule.when)).not.toThrow();
    expect(rules.some(row => row.id.endsWith("in-time-active") && evaluateObjectivePredicate(run, row.when))).toBe(true);
    expect(checkpointMatches(pack, run, pack.checkpoints.find(row => row.id === "timing-window")!, resolver, "/checkpoints/1")).toBe(true);
    // A lost resolver must not silently switch a current default back to the pure matcher.
    expect(() => evaluateObjectivePredicate(run, objectiveRules(pack).at(-1)!.when)).toThrow(/original live authored source/);
  });

  it.each([
    ["opposition", { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: STRUCTURAL_CONVENTION_REFS.king_opposition } }, true],
    ["backward", { kind: "feature", feature: { kind: "backward_pawn", color: "white", file: "b", conventionRef: STRUCTURAL_CONVENTION_REFS.backward_pawn } }, false],
    ["outpost", outpost, false],
  ] as const)("executes %s refs through the original source with separate authoring/objective operations", (_name, feature, expected) => {
    const expression = owned(feature), run = runAt(kings, "black"), after = commitMove(run, "e3d3", { at }).run;
    const transition: TransitionExpression = { kind: "position", at: "before", expression };
    const compile = vi.spyOn(execution, "compileEvidenceConsumerExecutionV2");
    expect(matchesCurrentTransitionExpression(kings, "e3d3", after.nodes.at(-1)!.fen, transition, "authoring")).toBe(expected);
    expect(compile.mock.calls.map(row => row[1])).toContainEqual({ id: "authoring.predicate", version: 2 });
    compile.mockClear();
    expect(matchesCurrentTransitionExpression(kings, "e3d3", after.nodes.at(-1)!.fen, transition)).toBe(expected);
    expect(compile.mock.calls.map(row => row[1])).toContainEqual({ id: "runtime.objective_condition", version: 2 });
    expect(currentWindowStates([window(expression)], tempoMovesFromRun(after), "black")[0]!.verdict).toBe("open");
  });

  it("checks missing/copied sources in skipped transition arms and unopened windows before leaf acquisition", () => {
    const original = owned({ kind: "pieceOnSquare", square: "e3", piece: { color: "black", role: "king" } }), copy = structuredClone(original);
    const expression: TransitionExpression = { kind: "any", of: [{ kind: "position", at: "before", expression: original }, { kind: "position", at: "after", expression: copy }] };
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => matchesCurrentTransitionExpression(kings, "illegal", kings, expression)).toThrow(/original live authored source/);
    expect(() => evaluateObjectivePredicate(runAt(kings), { type: "authoredTransitionFeature", transition: expression })).toThrow(/original live authored source/);
    const unopened = { ...window(original), opens: { onMove: [{ moveUci: "e3d3" }] } };
    expect(() => currentWindowStates([{ ...unopened, closes: [{ kind: "position", feature: copy }] }], [], "black")).toThrow(/original live authored source/);
    expect(invoke).not.toHaveBeenCalled();
    expect(currentWindowStates([unopened], [], "black")[0]!.verdict).toBe("unopened");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("retires genuine registered sources before transition no-edge and timing early returns", async () => {
    const registry = new ShapeRegistry(), document = shape(outpost); await registry.add(document, "community");
    const source = selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(document.id)!, "/trigger");
    const expression = readAuthoredStructuralConditionSource(source).effectiveExpression;
    expect(currentWindowStates([window(expression)], [], "black")[0]!.verdict).toBe("open");
    await registry.add({ ...document, version: "1.0.1" }, "community");
    expect(() => currentWindowStates([window(expression)], [], "black")).toThrow(/original live authored source/);
    expect(() => evaluateObjectivePredicate(runAt(kings), { type: "authoredTransitionFeature", transition: { kind: "position", at: "after", expression } })).toThrow(/original live authored source/);
  });
});
