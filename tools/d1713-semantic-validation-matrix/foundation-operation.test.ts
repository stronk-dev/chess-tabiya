import { loadSemanticValidationCases } from "../../packages/runtime/src/semantic-validation-case-storage.js";
import * as semantic from "../../packages/runtime/src/semantic-evidence.js";
import { executeSemanticValidationCase } from "../../packages/runtime/src/semantic-validation-runner.js";
import { SEMANTIC_VALIDATION_RESOLVERS } from "../../packages/runtime/src/semantic-validation-authorities.js";
// DISPOSABLE D4167 composition model. Not production, a canonical oracle, application reach,
// source qualification or an ordinary module migration. Existing factories compute every value.
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/position-cache.js";
import * as routes from "../../packages/runtime/src/internal/evidence-value-routes.js";
import type { FoundationEdgeSourceRef } from "../../packages/runtime/src/foundation-edge-source.js";
import { compileSemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { parseSemanticValidationCase, parseSemanticValidationExpectation, SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS } from "../../packages/runtime/src/semantic-validation.js";
import { type DeclaredEvidence, type SemanticEventSign } from "../../packages/runtime/src/evidence-contract.js";

type Edge = { beforeFen: string; moveUci: string; afterFen: string };
const keys = SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.map(ref => `${ref.id}@${ref.version}` as FoundationEdgeSourceRef);
const available = <T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T => {
  if (result.kind !== "available") throw Error(result.reason); return result.value;
};
function model(edge: Edge, selected: readonly FoundationEdgeSourceRef[]) {
  if (selected.length === 0 || new Set(selected).size !== selected.length || selected.some(ref => !keys.includes(ref))) throw Error("Invalid source demand");
  // Private computation cells live for this call only; no caller-supplied collector or store.
  const once = <T>(build: () => T) => { let result: T | undefined; return () => result ??= build(); };
  const beforeLegal = once(() => routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: edge.beforeFen }));
  const afterLegal = once(() => routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: edge.afterFen }));
  const beforeConnectivity = once(() => routes.invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: edge.beforeFen }));
  const afterConnectivity = once(() => routes.invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: edge.afterFen }));
  const beforeOpposition = once(() => available(routes.invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: beforeLegal() })));
  const afterOpposition = once(() => available(routes.invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: afterLegal() })));
  const beforeBackward = once(() => available(routes.invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: beforeLegal() })));
  const afterBackward = once(() => available(routes.invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: afterLegal() })));
  const beforeGroups = once(() => available(routes.invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: beforeConnectivity() })));
  const afterGroups = once(() => available(routes.invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: afterConnectivity() })));
  const beforeFiles = once(() => available(routes.invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: beforeConnectivity() })));
  const afterFiles = once(() => available(routes.invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: afterConnectivity() })));
  const fileChanges = once(() => available(routes.invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: beforeFiles(), moveUci: edge.moveUci, after: afterFiles() })));
  const read = (route: FoundationEdgeSourceRef): readonly DeclaredEvidence<unknown>[] => {
    switch (route) {
      case "rules.structural.event.king_opposition@2": return available(routes.invokeEvidenceValueRoute(route, { before: beforeOpposition(), moveUci: edge.moveUci, after: afterOpposition() }));
      case "rules.structural.event.backward_pawn@2": return available(routes.invokeEvidenceValueRoute(route, { before: beforeBackward(), moveUci: edge.moveUci, after: afterBackward() }));
      case "rules.structural.event.pawn_islands@2": return available(routes.invokeEvidenceValueRoute(route, { before: beforeConnectivity(), moveUci: edge.moveUci, after: afterConnectivity() }));
      case "derived.structural.event.pawn_file_group@1": return available(routes.invokeEvidenceValueRoute(route, { before: beforeGroups(), moveUci: edge.moveUci, after: afterGroups() }));
      case "derived.activity.event.file_state@1": return fileChanges();
      case "derived.activity.event.file_access_revealed@1": return fileChanges().flatMap(change => available(routes.invokeEvidenceValueRoute(route, { change })));
      case "rules.transition.event.slider_ray@2": return routes.invokeEvidenceValueRoute(route, edge);
    }
  };
  const anchor = { ...edge, side: positionFromFen(edge.beforeFen).turn };
  return keys.filter(key => selected.includes(key)).flatMap(route => read(route).map(evidence => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST,
    { evidence, derivationInputs: routes.readFoundationEventInvocation(evidence).inputs, anchor, sign: (evidence.payload as { sign: SemanticEventSign }).sign })));
}
function edge(fen: string, moveUci: string): Edge {
  const pos = positionFromFen(fen), beforeFen = canonicalFen(pos), move = normalizeMove(pos, parseUci(moveUci)!);
  expect(pos.isLegal(move)).toBe(true); pos.play(move);
  return { beforeFen, moveUci, afterFen: canonicalFen(pos) };
}
afterEach(() => vi.restoreAllMocks());
describe("D4167 proposed shared source operation", () => {
  it.each([
    ["white", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
    ["black", "1r5k/1p6/2N5/8/8/8/8/7K b - - 0 1", "b7c6"],
  ])("keeps all original %s payloads while sharing actual source inputs", (side, fen, move) => {
    const input = edge(fen!, move!), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const previous = keys.flatMap(route => historicalIndependentSource(route, input));
    const beforeCount = calls.mock.calls.length; calls.mockClear();
    const current = model(input, keys), afterCount = calls.mock.calls.length;
    expect(current.map(event => ({ projection: event.projection, payload: event.operands }))).toEqual(previous.map(value => ({ projection: value.projection, payload: value.payload })));
    const file = current.filter(event => event.projection.id === "derived.activity.event.file_state");
    const reveal = current.filter(event => event.projection.id === "derived.activity.event.file_access_revealed");
    expect(file.length).toBeGreaterThan(0); expect(reveal.length).toBeGreaterThan(0);
    reveal.forEach(event => expect(file.some(change => change.evidence === event.derivationInputs[0])).toBe(true));
    expect(calls.mock.calls.filter(([route]) => route === "rules.mobility.reading.legal_moves@1")).toHaveLength(2);
    expect(calls.mock.calls.filter(([route]) => route === "rules.structural.reading.pawn_connectivity@1")).toHaveLength(2);
    expect(calls.mock.calls.filter(([route]) => route === "derived.activity.event.file_state@1")).toHaveLength(1);
    expect(afterCount).toBeLessThan(beforeCount);
    process.stdout.write(JSON.stringify({ question: "D4167", side, previousFactoryCalls: beforeCount, sharedFactoryCalls: afterCount, events: current.length, actualCaller: false, qualification: false }) + "\n");
  });
  it("preserves one-source demand and validates even genuine empty populations", () => {
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute"), input = edge("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1d1");
    expect(model(input, ["rules.structural.event.backward_pawn@2"])).toEqual([]);
    expect(calls.mock.calls.map(([route]) => route)).toEqual(["rules.mobility.reading.legal_moves@1", "rules.structural.reading.backward_pawn@3", "rules.mobility.reading.legal_moves@1", "rules.structural.reading.backward_pawn@3", "rules.structural.event.backward_pawn@2"]);
    calls.mockClear();
    expect(() => model({ ...input, afterFen: input.beforeFen }, ["rules.structural.event.backward_pawn@2"])).toThrow();
    expect(() => model(input, [])).toThrow();
    expect(() => model(input, [keys[0]!, keys[0]!])).toThrow();
    expect(() => model(input, ["not.a.source@1" as FoundationEdgeSourceRef])).toThrow();
  });
});


it("D4171 measures representability of the actual nested source edge paths", () => {
  const subject = { kind: "event" as const, projection: { id: "rules.structural.event.king_opposition", version: 2 } };
  const paths = [
    ["input_before_fen", ["before", "fen"]], ["input_after_fen", ["after", "fen"]],
    ["input_before_fen", ["fileChange", "beforeFen"]], ["input_move_uci", ["fileChange", "moveUci"]], ["input_after_fen", ["fileChange", "afterFen"]],
  ] as const;
  for (const [value, path] of paths) {
    let accepted = false;
    try {
      parseSemanticValidationExpectation({ kind: "mirrors", partnerCase: { kind: "case", id: "disposable.partner", version: 1, subject, arm: "orientation" },
        geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" },
        operandRules: [{ sourcePath: path, partnerPath: path, value, collection: "scalar" }] }, subject);
      accepted = true;
    } catch (error) { expect(error).toMatchObject({ code: "SEMANTIC_VALIDATION_ORIENTATION_SCHEMA" }); }
    process.stdout.write(JSON.stringify({ question: "D4171", path, accepted, qualification: false }) + "\n");
  }
});


it("D4172 retains the intentional minimum-witness semantics under a duplicated genuine observation", async () => {
  const document = loadSemanticValidationCases();
  const cases = document.cases.map(parseSemanticValidationCase), map = new Map(cases.map(value => [value.id, value]));
  const value = cases.find(row => row.arm === "positive" && row.operation.id === "runtime.semantic.local_edge"
    && row.subject.projection.id === "derived.material.event.role_asymmetry" && row.subject.projection.version === 2)!;
  expect(value).toBeDefined(); expect(value.expectation.kind).toBe("emits");
  const normal = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, map);
  expect(normal.status).toBe("passed"); expect(normal.targetCount).toBeGreaterThan(0);
  const original = semantic.localSemanticEventClosure;
  vi.spyOn(semantic, "localSemanticEventClosure").mockImplementation((...args) => {
    const closure = original(...args), target = closure.events.find(event => event.projection.id === value.subject.projection.id && event.projection.version === value.subject.projection.version)!;
    if (target === undefined) throw Error("A genuine target is required");
    return { ...closure, events: Object.freeze([...closure.events, target]) };
  });
  const duplicate = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, map);
  expect(duplicate.status).toBe("passed"); expect(duplicate.targetCount).toBe(normal.targetCount + 1);
  process.stdout.write(JSON.stringify({ question: "D4172", case: value.id, originalTargets: normal.targetCount, duplicateTargets: duplicate.targetCount,
    witnessOnlyStatus: duplicate.status, exactPopulationClaim: false, qualification: false }) + "\n");
});


it("D4173 measures the actual file and color-relative state transform domains", () => {
  const subject = { kind: "event" as const, projection: { id: "derived.activity.event.file_state", version: 1 } };
  const left = model(edge("7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"), ["derived.activity.event.file_state@1"]);
  const right = model(edge("1r5k/1p6/2N5/8/8/8/8/7K b - - 0 1", "b7c6"), ["derived.activity.event.file_state@1"]);
  const findB = (events: typeof left) => events.map(event => event.operands as { file: string; before: { state: string }; after: { state: string } }).find(row => row.file === "b")!;
  expect(findB(left).before.state).toBe("half_open_black"); expect(findB(right).before.state).toBe("half_open_white");
  for (const [value, path] of [["file", ["file"]], ["file_state", ["before", "state"]]] as const) {
    let accepted = false;
    try {
      parseSemanticValidationExpectation({ kind: "mirrors", partnerCase: { kind: "case", id: "disposable.partner", version: 1, subject, arm: "orientation" },
        geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" },
        operandRules: [{ sourcePath: path, partnerPath: path, value, collection: "scalar" }] }, subject);
      accepted = true;
    } catch (error) { expect(error).toMatchObject({ code: "SEMANTIC_VALIDATION_ORIENTATION_SCHEMA" }); }
    process.stdout.write(JSON.stringify({ question: "D4173", value, accepted, beforeStates: [findB(left).before.state, findB(right).before.state], qualification: false }) + "\n");
  }
});

// Historical independent composition, retained only for the disposable before/after comparison.
function historicalIndependentSource(projection: FoundationEdgeSourceRef, edge: Edge): readonly DeclaredEvidence<unknown>[] {
  const legal = (fen: string) => routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  const connectivity = (fen: string) => routes.invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen });
  const groups = (fen: string) => available(routes.invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: connectivity(fen) }));
  const files = (fen: string) => available(routes.invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: connectivity(fen) }));
  const fileChanges = () => available(routes.invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: files(edge.beforeFen), moveUci: edge.moveUci, after: files(edge.afterFen) }));
  switch (projection) {
    case "rules.structural.event.king_opposition@2": {
      const snapshot = (fen: string) => available(routes.invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: legal(fen) }));
      return available(routes.invokeEvidenceValueRoute(projection, { before: snapshot(edge.beforeFen), moveUci: edge.moveUci, after: snapshot(edge.afterFen) }));
    }
    case "rules.structural.event.backward_pawn@2": {
      const snapshot = (fen: string) => available(routes.invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: legal(fen) }));
      return available(routes.invokeEvidenceValueRoute(projection, { before: snapshot(edge.beforeFen), moveUci: edge.moveUci, after: snapshot(edge.afterFen) }));
    }
    case "derived.structural.event.pawn_file_group@1":
      return available(routes.invokeEvidenceValueRoute(projection, { before: groups(edge.beforeFen), moveUci: edge.moveUci, after: groups(edge.afterFen) }));
    case "rules.transition.event.slider_ray@2": return routes.invokeEvidenceValueRoute(projection, edge);
    case "derived.activity.event.file_state@1": return fileChanges();
    case "derived.activity.event.file_access_revealed@1":
      return Object.freeze(fileChanges().flatMap(change => available(routes.invokeEvidenceValueRoute(projection, { change }))));
    case "rules.structural.event.pawn_islands@2":
      return available(routes.invokeEvidenceValueRoute(projection, { before: connectivity(edge.beforeFen), moveUci: edge.moveUci, after: connectivity(edge.afterFen) }));
    default: throw new TypeError("Unsupported exact selected structural source");
  }
}
