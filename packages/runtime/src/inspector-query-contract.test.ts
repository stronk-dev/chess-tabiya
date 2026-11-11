import { describe, expect, it } from "vitest";
import { compileAssistanceRequest } from "./assistance-exchange.js";
import { INSPECTOR_SOURCE_TOPICS, InspectorQueryError, parseInspectorQueryRequest, type InspectorSourceContext } from "./inspector-query-contract.js";
import { INSPECTOR_LOCAL_PROJECTIONS, inspectorLocalScope } from "./inspector-local-source.js";
import { INSPECTOR_DEPENDENT_PROJECTIONS } from "./inspector-dependent-source.js";
import { INSPECTOR_PACKET_PROJECTIONS } from "./inspector-packet-source.js";
import { INSPECTOR_PIVOTAL_PROJECTIONS } from "./inspector-pivotal-source.js";
import { RECORDED_SEQUENCE_HORIZONS } from "./recorded-sequence-window.js";
import { INSPECTOR_DETAIL_SOURCES } from "./inspector-detail.js";
import { inspectorSourceAdapterSpecs } from "./presentation-inspector-adapters.js";
import { inspectorSourcePresentationKit } from "./testing/inspector-source-presentation-kit.js";

const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "invalid_fallback", reason: "storage_unavailable" } });
const digest = `sha256:${"a".repeat(64)}`;
const request = (view: unknown = { kind: "inventory", start: 0 }) => ({ protocol: "inspector.query_page@1", assistance,
  query: { branchId: "main", nodeId: "node", decisionDigest: digest, view } });
function context(kind: InspectorSourceContext["kind"]): InspectorSourceContext {
  if (kind === "branch" || kind === "recorded_review") return { kind, throughNodeId: "end" };
  if (kind === "comparison") return { kind, otherBranchId: "peer", otherNodeId: "peer-end" };
  return { kind };
}
const source = (projection = "rules.castling.reading.rights@1", scope: InspectorSourceContext = { kind: "position" }, start = 0) => ({ kind: "source", projection,
  context: scope, start, collectionKey: start === 0 ? null : "original-collection" });
const mate = (version: 1 | 2, maxAttackerMoves = 1) => ({ ...source(`rules.tactic.consequence.forced_mate_after_move@${version}`, { kind: "incoming_edge" }),
  parameters: { kind: "forced_mate", maxAttackerMoves } });

describe("accepted Inspector requested-intent boundary (not source/access/Full2 delivery)", () => {
  it("keeps89 literal topics in the exact source order and excludes fifteen views", () => {
    expect(INSPECTOR_SOURCE_TOPICS).toHaveLength(89);
    expect(new Set(INSPECTOR_SOURCE_TOPICS.map(row => row.projection)).size).toBe(89);
    const specs = inspectorSourceAdapterSpecs(inspectorSourcePresentationKit).filter(row => !row.projection.id.startsWith("derived.inspector.detail."));
    expect(INSPECTOR_SOURCE_TOPICS.map(row => row.projection)).toEqual(specs.map(row => `${row.projection.id}@${row.projection.version}`));
    expect(Object.isFrozen(INSPECTOR_SOURCE_TOPICS)).toBe(true);
    expect(INSPECTOR_SOURCE_TOPICS.every(row => Object.isFrozen(row) && Object.isFrozen(row.contexts))).toBe(true);
  });

  it("matches actual source-owner contexts without an unknown-source position fallback", () => {
    const expected = new Map<string, readonly string[]>();
    for (const ref of INSPECTOR_LOCAL_PROJECTIONS) expected.set(ref, [inspectorLocalScope(ref)]);
    for (const ref of INSPECTOR_DEPENDENT_PROJECTIONS) expected.set(ref, ["incoming_edge"]);
    for (const ref of Object.keys(RECORDED_SEQUENCE_HORIZONS)) expected.set(ref, ["recorded_window"]);
    for (const ref of INSPECTOR_PACKET_PROJECTIONS) expected.set(ref, ["position"]);
    for (const ref of INSPECTOR_PIVOTAL_PROJECTIONS) expected.set(ref, ["branch"]);
    for (const ref of ["recorded.engine.eval@1", "recorded.tablebase.result@1", "derived.maia.node_distribution@1", "derived.maia.node_candidate_wdl@1",
      "derived.explorer.inspector_population@1", "theory.opening.catalogue_membership@1"]) expected.set(ref, ["position"]);
    expected.set("derived.opening.deepest_reached@2", ["branch"]);
    expected.set("theory.shapes.firing@3", ["position", "branch"]);
    expected.set("derived.story.rank@3", ["recorded_review"]);
    expected.set("derived.compare.structure_delta@2", ["comparison"]);
    expected.set("derived.compare.eval_delta@2", ["comparison"]);
    for (const ref of ["derived.review.analysis_typed_pv@1", "derived.review.analysis_recorded_pv@1", "derived.review.analysis_recorded_first@1"]) expected.set(ref, ["incoming_edge"]);
    expect(expected.size).toBe(89);
    for (const topic of INSPECTOR_SOURCE_TOPICS) expect(topic.contexts, topic.projection).toEqual(expected.get(topic.projection));
    expect(INSPECTOR_SOURCE_TOPICS.filter(row => row.family === "maia").map(row => row.projection)).toEqual(["derived.maia.node_distribution@1", "derived.maia.node_candidate_wdl@1"]);
    expect(INSPECTOR_SOURCE_TOPICS.filter(row => row.family === "explorer").map(row => row.projection)).toEqual(["derived.explorer.inspector_population@1"]);
    expect(INSPECTOR_SOURCE_TOPICS.filter(row => row.family === "syzygy")).toHaveLength(4);
  });

  it.each(INSPECTOR_SOURCE_TOPICS)("$projection accepts only its exact source contexts", topic => {
    for (const kind of ["position", "incoming_edge", "recorded_window", "branch", "comparison", "recorded_review"] as const) {
      const input = source(topic.projection, context(kind));
      const value = topic.projection.startsWith("rules.tactic.consequence.forced_mate_after_move@")
        ? { ...input, parameters: { kind: "forced_mate", maxAttackerMoves: 2 } } : input;
      if (topic.contexts.includes(kind)) expect(parseInspectorQueryRequest(request(value)).query.view).toEqual(value);
      else expect(() => parseInspectorQueryRequest(request(value))).toThrow(InspectorQueryError);
    }
  });

  it("retains explicit mate attacker-move horizons on precisely the two source refs", () => {
    for (const version of [1, 2] as const) for (const horizon of [1, 2, 3, 4]) expect(parseInspectorQueryRequest(request(mate(version, horizon))).query.view).toEqual(mate(version, horizon));
    for (const horizon of [0, 5, -1, 1.5, "2", null, undefined]) expect(() => parseInspectorQueryRequest(request({ ...mate(1), parameters: { kind: "forced_mate", maxAttackerMoves: horizon } }))).toThrow();
    const absent = mate(1) as Record<string, unknown>; delete absent.parameters;
    expect(() => parseInspectorQueryRequest(request(absent))).toThrow();
    for (const value of [{ ...source(), parameters: { kind: "forced_mate", maxAttackerMoves: 1 } },
      { ...mate(1), parameters: { ...mate(1).parameters, maxNodes: 10 } }, { ...mate(1), parameters: { ...mate(1).parameters, kind: "plies" } }]) expect(() => parseInspectorQueryRequest(request(value))).toThrow();
  });

  it("binds continuation shape and rejects obsolete or recursively detailed topics", () => {
    expect(parseInspectorQueryRequest(request(source(undefined, undefined, 8))).query.view).toEqual(source(undefined, undefined, 8));
    for (const start of [-1, 0.2, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, "0"]) expect(() => parseInspectorQueryRequest(request({ ...source(), start }))).toThrow();
    for (const value of [{ ...source(), collectionKey: "unexpected" }, { ...source(), start: 1 }, { ...source(), start: 1, collectionKey: " " }]) expect(() => parseInspectorQueryRequest(request(value))).toThrow();
    for (const projection of ["live.stockfish.eval@1", "human.maia.policy@1", "theory.shapes.firing@1", "derived.story.rank@2", "derived.tactic.attraction_observed@2", "derived.inspector.detail.rays@1", "rules.castling.reading.rights@2", "new.unknown@1"]) expect(() => parseInspectorQueryRequest(request(source(projection)))).toThrow();
  });

  it.each(["doubled_pawn", "isolated_pawn", "half_open_file", "open_file", "line_blockers"])("refuses the retired duplicate %s topic instead of remapping it", family => {
    const projection = `rules.structural.event.${family}@1`;
    expect(INSPECTOR_SOURCE_TOPICS.some(row => row.projection === projection)).toBe(false);
    expect(() => parseInspectorQueryRequest(request(source(projection, { kind: "incoming_edge" })))).toThrow(InspectorQueryError);
  });

  it("accepts fifteen source-bound detail doors with source-specific filters", () => {
    for (const projection of Object.values(INSPECTOR_DETAIL_SOURCES)) {
      const view = { kind: "detail", projection, context: (projection === "rules.mobility.event.piece_destinations@1" || projection === "derived.pawn.consequence.backward_pawn_legal_advance@1" || projection === "derived.tactic.defender_exposure@2") ? { kind: "incoming_edge" } : { kind: "position" }, sourceKey: "actual-source", scope: { kind: "whole" }, start: 0 };
      expect(parseInspectorQueryRequest(request(view)).query.view).toEqual(view);
      const filtered = () => parseInspectorQueryRequest(request({ ...view, scope: { kind: "control_target", color: "white", mode: "legal", target: "a1" } }));
      if (projection === "rules.square.reading.control@1") expect(filtered).not.toThrow();
      else expect(filtered).toThrow();
    }
    const control = { kind: "detail", projection: "rules.square.reading.control@1", context: { kind: "position" }, sourceKey: "actual-source", scope: { kind: "control_target", color: "black", mode: "geometric", target: "h8" }, start: 8 };
    expect(parseInspectorQueryRequest(request(control)).query.view).toEqual(control);
    for (const scope of [{ ...control.scope, target: "i9" }, { ...control.scope, mode: "safe" }, { ...control.scope, color: "player" }, { ...control.scope, ordering: "usefulness" }]) expect(() => parseInspectorQueryRequest(request({ ...control, scope }))).toThrow();
    for (const view of [{ ...control, sourceKey: "" }, { ...control, projection: "rules.phase.reading@2" }, { ...control, projection: "derived.inspector.detail.square_control@1" }, { ...control, parameters: { kind: "forced_mate", maxAttackerMoves: 1 } }]) expect(() => parseInspectorQueryRequest(request(view))).toThrow();
    const exposure = { ...control, projection: "derived.tactic.defender_exposure@2", context: { kind: "incoming_edge" } };
    for (const scope of [{ kind: "exposure_captures" }, { kind: "exposure_exchange", captureIndex: 0 }, { kind: "exposure_branches", captureIndex: 2, parentPath: [1, 3] }]) {
      const view = { ...exposure, scope };
      expect(parseInspectorQueryRequest(request(view)).query.view).toEqual(view);
      expect(() => parseInspectorQueryRequest(request({ ...control, scope }))).toThrow();
    }
  });

  it("refuses crossed comparison branches and every nested caller authority/operand bag", () => {
    expect(() => parseInspectorQueryRequest(request(source("derived.compare.structure_delta@2", { kind: "comparison", otherBranchId: "main", otherNodeId: "node" })))).toThrow();
    const input = request();
    for (const value of [{ ...input, role: "owner" }, { ...input, query: { ...input.query, fen: "untrusted" } },
      { ...input, query: { ...input.query, view: { ...source(), payload: {} } } },
      { ...input, query: { ...input.query, view: { ...source(), context: { kind: "position", nodeId: "other" } } } },
      { ...input, assistance: { ...assistance, stage: "authoritative" } }, { ...input, assistance: { ...assistance, requestDigest: digest } },
      { ...input, query: { ...input.query, decisionDigest: "not-a-digest" } }]) expect(() => parseInspectorQueryRequest(value)).toThrow(InspectorQueryError);
    try { parseInspectorQueryRequest({ ...input, protocol: "inspector.query_page@2" }); throw new Error("accepted unknown version"); }
    catch (error) { expect(error).toBeInstanceOf(InspectorQueryError); expect((error as InspectorQueryError).code).toBe("unsupported_version"); }
  });

  it("does not invoke data getters and detaches/freeze the complete admitted intent", () => {
    const input = structuredClone(request(source()));
    const parsed = parseInspectorQueryRequest(input);
    expect(parsed).toEqual(input); expect(parsed).not.toBe(input);
    input.query.nodeId = "changed";
    Object.defineProperty(input.assistance.preference, "reason", { value: "changed" });
    expect(parsed.query.nodeId).toBe("node");
    expect(parsed.assistance.preference).toEqual({ kind: "invalid_fallback", reason: "storage_unavailable" });
    expect(Object.isFrozen(parsed)).toBe(true); expect(Object.isFrozen(parsed.query.view)).toBe(true); expect(Object.isFrozen(parsed.assistance.preference)).toBe(true);
    let calls = 0;
    for (const where of ["protocol", "query", "view", "projection", "assistance", "preference"] as const) {
      const value = structuredClone(request(source()));
      const object = where === "view" ? value.query : where === "projection" ? value.query.view as object : where === "preference" ? value.assistance : value;
      Object.defineProperty(object, where, { enumerable: true, get: () => { calls++; throw new Error("getter ran"); } });
      expect(() => parseInspectorQueryRequest(value)).toThrow(InspectorQueryError);
    }
    expect(calls).toBe(0);
    const hidden = request(); Object.defineProperty(hidden.query, "extra", { value: 1 }); expect(() => parseInspectorQueryRequest(hidden)).toThrow();
    const symbol = request(); Object.defineProperty(symbol.query, Symbol("extra"), { value: 1 }); expect(() => parseInspectorQueryRequest(symbol)).toThrow();
    const inherited = Object.assign(Object.create({ injected: true }), request()); expect(() => parseInspectorQueryRequest(inherited)).toThrow();
  });

  it("accepts serializable shared empty override arrays and detaches them from caller mutation", () => {
    const compiled = compileAssistanceRequest({ contextHint: "position", preference: {
      kind: "explicit", preset: "theory_only", overrides: {}, moduleOverrides: { include: [], exclude: [] },
    } });
    if (compiled.preference.kind !== "explicit") throw new Error("Expected actual explicit assistance");
    // The normal compiler emits distinct arrays, but sharing the two empty data arrays does
    // not change the requested bytes, their real digest or JSON serializability.
    expect(compiled.preference.moduleOverrides.include).not.toBe(compiled.preference.moduleOverrides.exclude);
    const shared: string[] = [];
    const input = { ...request(), assistance: { ...compiled, preference: { ...compiled.preference,
      moduleOverrides: { include: shared, exclude: shared },
    } } };
    const wire = parseInspectorQueryRequest(JSON.parse(JSON.stringify(input)));
    const parsed = parseInspectorQueryRequest(input);
    expect(parsed).toEqual(wire);
    if (parsed.assistance.preference.kind !== "explicit") throw new Error("Expected admitted explicit assistance");
    expect(parsed.assistance.preference.moduleOverrides.include).not.toBe(shared);
    expect(parsed.assistance.preference.moduleOverrides.exclude).not.toBe(shared);
    expect(Object.isFrozen(parsed.assistance.preference.moduleOverrides.include)).toBe(true);
    expect(Object.isFrozen(parsed.assistance.preference.moduleOverrides.exclude)).toBe(true);
    expect(Object.isFrozen(shared)).toBe(false);
    shared.push("threat_radar");
    expect(parsed.assistance.preference.moduleOverrides).toEqual({ include: [], exclude: [] });
  });

  it("still refuses a genuine cyclic override array as a typed request error", () => {
    const compiled = compileAssistanceRequest({ contextHint: "position", preference: {
      kind: "explicit", preset: "theory_only", overrides: {}, moduleOverrides: { include: [], exclude: [] },
    } });
    if (compiled.preference.kind !== "explicit") throw new Error("Expected actual explicit assistance");
    const cycle: unknown[] = []; cycle.push(cycle);
    const input = { ...request(), assistance: { ...compiled, preference: { ...compiled.preference,
      moduleOverrides: { include: cycle, exclude: [] },
    } } };
    try { parseInspectorQueryRequest(input); throw new Error("Accepted a cyclic request"); }
    catch (error) {
      expect(error).toBeInstanceOf(InspectorQueryError);
      expect((error as InspectorQueryError).code).toBe("invalid_request");
    }
  });
});
