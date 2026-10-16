import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { declareEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import * as routes from "./internal/evidence-value-routes.js";
import { readLastLevelReductionResult } from "./internal/last-level-reduction-authority.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { collectRecordedReviewSourcePopulation, readRecordedReviewSourceOperands, readRecordedReviewSourcePopulation, type RecordedReviewSourceOperand } from "./review-evidence.js";
import { collectRecordedReviewMoments, readRecordedReviewMomentOperands, readRecordedReviewMoments, recordedReviewMomentSourceImage } from "./recorded-review-moments.js";
import { recordedPivotalFixture, PIVOTAL_RULE_KINDS } from "./testing/recorded-pivotal-fixture.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";
import { attachEvidence } from "./evidence.js";
import { REVIEW_AT } from "./testing/review-evidence-fixture.js";
import type { DrillRun } from "./types.js";

function populationFor(run: DrillRun) {
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
  return collectRecordedReviewSourcePopulation({ boundary: owner.resolve({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }), context: { engine: new Map(), shapes: [] } });
}
function imported(side: "white" | "black" = "white", result = "0-1" as "0-1" | "1-0" | "*", moves?: string[]) {
  const f = recordedLastLevelFixture(side, result, "real-review-operands", moves), context = { engine: f.engine, shapes: [] };
  return { ...f, context, population: () => collectRecordedReviewSourcePopulation({ boundary: f.boundary(), context }) };
}
function leaves(operand: RecordedReviewSourceOperand): readonly Extract<RecordedReviewSourceOperand, { kind: "leaf" }>[] {
  return operand.kind === "leaf" ? [operand] : operand.inputs.flatMap(leaves);
}

describe("original recorded Review operand authority", () => {
  for (const kind of PIVOTAL_RULE_KINDS) for (const black of [false, true]) it(`${kind} retains original ordered child values/FEN/edge inputs, black=${black}`, () => {
    const run = recordedPivotalFixture(kind, black), population = populationFor(run), data = readRecordedReviewSourcePopulation(population), operands = readRecordedReviewSourceOperands(population);
    expect(operands).toHaveLength(data.results.length);
    const index = data.results.findIndex(result => result.slot.adapterId === `review.source.pivotal.${kind}@${kind === "irreversibility" ? 1 : 2}` && result.items.length > 0);
    expect(index).toBeGreaterThanOrEqual(0);
    const operand = operands[index]![0]!; expect(operand.kind).toBe("member"); if (operand.kind !== "member") throw Error("requires member");
    expect(operand.value).toBe(data.results[index]!.items[0]); expect(operand.inputs.map(input => input.value)).toEqual(routes.readReviewMemberInputs(operand.value));
    expect(operand.inputs).toHaveLength(kind === "phase_change" ? 4 : kind === "option_collapse" ? 6 : 2);
    const inputs = leaves(operand);
    for (let index = 0; index < inputs.length; index += 2) {
      const local = inputs[index]!, recorded = inputs[index + 1]!;
      expect(local.availability).toBe("local"); expect(recorded.availability).toBe("recorded");
      const invocation = routes.readLocalReadingInvocation(local.value); expect(local.image).toBe(invocation);
      const fen = (recorded.value.payload as { fen: string }).fen;
      expect(invocation.kind === "fen" ? invocation.fen : invocation.edge.afterFen).toBe(fen);
      expect(Object.isFrozen(local.image)).toBe(true);
    }
    const source = collectRecordedReviewMoments({ population }), momentData = readRecordedReviewMoments(source), grouped = readRecordedReviewMomentOperands(source);
    for (const [group, values] of grouped.entries()) for (const [item, input] of values.entries()) expect(input.value).toBe(momentData.groups[group]!.evidence[item]);
    const image = recordedReviewMomentSourceImage(source); expect(image.sourceOperands).toHaveLength(data.plan.length);
    expect(evidenceDigest(image)).toMatch(/^[a-f0-9]{64}$/u);
  });

  it.each(["white", "black"] as const)("retains transition→point→provider/position input identity: %s", side => {
    const f = imported(side, "*"); f.deliver(0, "cp 100"); f.deliver(1, "cp -300");
    const population = f.population(), data = readRecordedReviewSourcePopulation(population), all = readRecordedReviewSourceOperands(population);
    const index = data.results.findIndex(result => result.slot.adapterId === "review.source.eval_delta@2" && result.items.length > 0), operand = all[index]![0]!;
    expect(operand.kind).toBe("member"); if (operand.kind !== "member") throw Error("member");
    for (const point of operand.inputs) {
      expect(point.kind).toBe("member"); if (point.kind !== "member") throw Error("point member");
      const original = routes.readReviewPointInvocation(point.value as never);
      expect(point.inputs.map(input => input.value)).toEqual([original.evaluation, original.position]);
      expect(point.inputs[0]).toMatchObject({ kind: "leaf", availability: "provider", providerOperation: "stockfish.position_evaluation@1", image: { kind: "provider" } });
      expect(point.inputs[1]).toMatchObject({ kind: "leaf", availability: "recorded", providerOperation: null, image: { kind: "position" } });
    }
  });

  it("binds full captured failure/absence images despite equal empty moments", () => {
    const f = imported("white", "*", []), first = collectRecordedReviewMoments({ population: f.population() }), a = recordedReviewMomentSourceImage(first);
    f.context.engine.set(f.path[0]!.id, { kind: "not_requested" });
    const second = collectRecordedReviewMoments({ population: f.population() }), b = recordedReviewMomentSourceImage(second);
    expect(a.groups).toEqual(b.groups); expect(a.groups).toEqual([]); expect(a.capturedPoints.rows[0]!.provider).toBeNull();
    expect(b.capturedPoints.rows[0]!.provider).toEqual({ kind: "not_requested" }); expect(evidenceDigest(a)).not.toBe(evidenceDigest(b));
    expect(a.lastLevelReduction.receipt).toEqual(readRecordedReviewMoments(first).lastLevelReduction.receipt);
    expect(a.lastLevelReduction.convention.refs.map(ref => `${ref.id}@${ref.version}`)).toContain("story-last-level@1");
  });

  it("retains authentic nested last-level array/ordinal/node/ply authority and root-only calculation", () => {
    const f = imported(); f.deliver(2, "cp 0"); const source = collectRecordedReviewMoments({ population: f.population() }), data = readRecordedReviewMoments(source);
    const nested = readRecordedReviewMomentOperands(source).flat().find(operand => operand.kind === "reduction")!;
    expect(nested.kind).toBe("reduction"); if (nested.kind !== "reduction") throw Error("nested reduction");
    expect(nested.items).toBe(data.lastLevelReduction.items); expect(nested.population).toBe(data.population.lastLevelPopulation); expect(nested.ordinal).toBe(0);
    expect(nested.items[nested.ordinal]!.evidence).toBe(nested.value); expect(nested.items[nested.ordinal]!.nodeId).toBe(f.path[2]!.id);
    expect(readLastLevelReductionResult(nested.items, nested.population).reduction).toBe(data.lastLevelReduction.receipt);
    const root = imported("white", "0-1", []); root.deliver(0, "cp 0");
    const image = recordedReviewMomentSourceImage(collectRecordedReviewMoments({ population: root.population() }));
    expect(image.groups).toEqual([]); expect(image.lastLevelReduction.items).toHaveLength(1); expect(image.lastLevelReduction.items[0]!.nodeId).toBe(root.path[0]!.id);
  });

  it("encodes full registered shape triggers and original prefix spans, not only entry ids", () => {
    const f = imported("white", "*"), trigger = { kind: "pieceOnSquare" as const, square: "f3" as const, piece: { color: "white" as const, role: "knight" as const } };
    const population = collectRecordedReviewSourcePopulation({ boundary: f.boundary(), context: { ...f.context, shapes: [{ id: "knight", trigger }] } });
    const source = collectRecordedReviewMoments({ population }), before = recordedReviewMomentSourceImage(source);
    (trigger as { square: string }).square = "a1";
    const operand = readRecordedReviewMomentOperands(source).flat().find(operand => operand.value.projection.id === "theory.shapes.firing")!;
    expect(operand).toMatchObject({ kind: "leaf", availability: "local", image: { kind: "shape", entries: [{ id: "knight", trigger: { square: "f3" } }] } });
    expect(recordedReviewMomentSourceImage(source)).toEqual(before); expect(before.shapes[0]!.trigger).toMatchObject({ square: "f3" });
  });

  it("readback encodes original data without dispatch or semantic recomputation", () => {
    const f = imported(); f.deliver(2); const population = f.population(), source = collectRecordedReviewMoments({ population });
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const inputs = readRecordedReviewSourceOperands(population), groups = readRecordedReviewMomentOperands(source);
      expect(readRecordedReviewSourceOperands(population)).toBe(inputs); expect(readRecordedReviewMomentOperands(source)).toBe(groups);
      expect(recordedReviewMomentSourceImage(source).plan).toBe(readRecordedReviewSourcePopulation(population).plan); expect(invoke).not.toHaveBeenCalled();
    } finally { invoke.mockRestore(); }
  });

  it("rejects generic sealed receipt copies without actual constructor input membership", () => {
    const f = imported(); f.deliver(0); f.deliver(1, "cp -300"); const data = readRecordedReviewSourcePopulation(f.population());
    const point = data.results.find(result => result.slot.adapterId === "review.source.eval_point@1" && result.items.length > 0)!.items[0]!;
    const reading = routes.invokeEvidenceValueRoute("rules.phase.reading@2", { fen: f.path[0]!.fen });
    const copy = (value: DeclaredEvidence<unknown>) => {
      const receipt = evidenceValueReceipt(value);
      return declareEvidence(value.producer, value.projection, value.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest,
        sourceDigests: receipt.sourceDigests, ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
    };
    expect(() => routes.readReviewMemberInputs(copy(point))).toThrow(/original mint/u);
    expect(() => routes.readLocalReadingInvocation(copy(reading))).toThrow(/original FEN/u);
  });

  it("refuses genuine equal-image foreign member inputs substituted for original sealed objects", () => {
    const run = recordedPivotalFixture("irreversibility"), population = populationFor(run), original = routes.readReviewMemberInputs;
    const foreign = readRecordedReviewSourceOperands(populationFor(run)).flat().find(operand => operand.value.projection.id === "derived.pivotal.irreversibility")!;
    if (foreign.kind !== "member") throw Error("member");
    const spy = vi.spyOn(routes, "readReviewMemberInputs").mockImplementation(value => value.projection.id === "derived.pivotal.irreversibility" ? foreign.inputs.map(input => input.value) : original(value));
    try { expect(() => readRecordedReviewSourceOperands(population)).toThrow(/wrapper\/minted/u); } finally { spy.mockRestore(); }
  });

  it("captures the original population handle independently of the caller wrapper", () => {
    const f = imported(), population = f.population(), replacement = f.population(), input = { population }, original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, args: unknown) => {
      const result = original(ref as never, args as never); input.population = replacement; return result;
    }) as typeof original);
    try {
      const source = collectRecordedReviewMoments(input); expect(input.population).toBe(replacement);
      expect(readRecordedReviewMoments(source).population).toBe(readRecordedReviewSourcePopulation(population));
      expect(readRecordedReviewMoments(source).population).not.toBe(readRecordedReviewSourcePopulation(replacement));
    } finally { invoke.mockRestore(); }
  });

  it("refuses copied handles and stale storage before returning operand/source images", () => {
    const f = imported(), population = f.population(), source = collectRecordedReviewMoments({ population });
    for (const copy of [{ ...population }, readRecordedReviewSourcePopulation(population)]) expect(() => readRecordedReviewSourceOperands(copy as never)).toThrow(/not issued/u);
    for (const copy of [{ ...source }, recordedReviewMomentSourceImage(source)]) expect(() => readRecordedReviewMomentOperands(copy as never)).toThrow(/not issued/u);
    readRecordedReviewSourceOperands(population);
    f.setRun(attachEvidence(f.run, branchPath(f.run, f.run.activeCursor.branchId)[0]!.id, ["actual-later"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, REVIEW_AT).run);
    expect(() => readRecordedReviewSourceOperands(population)).toThrow(/no longer/u); expect(() => recordedReviewMomentSourceImage(source)).toThrow(/no longer/u);
  });
});
