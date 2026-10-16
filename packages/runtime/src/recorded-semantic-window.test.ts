import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_PROJECTION_REFS } from "./evidence-catalog.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { attachEvidence } from "./evidence.js";
import { projectRun } from "./events.js";
import { invokeEvidenceValueRoute, EvidenceValueRouteLookupError } from "./internal/evidence-value-routes.js";
import * as routes from "./internal/evidence-value-routes.js";
import { recordedSemanticPath } from "./recorded-semantic-path.js";
import { RecordedEdgeError } from "./recorded-edge.js";
import { recordedSemanticWindowSource, type RecordedSemanticWindowResult } from "./recorded-semantic-window.js";
import { createRecordedSequenceWindows, RECORDED_SEQUENCE_HORIZONS, type RecordedWindowRoute } from "./recorded-sequence-window.js";
import { assertSemanticEvidenceEvent } from "./semantic-evidence.js";
import { admitValidatedSemanticInstance, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { fork, rewind } from "./runtime.js";
import { recordedSequenceRouteFixture, recordedSequenceWindowFixture, RECORDED_SEQUENCE_AT as at } from "./testing/recorded-sequence-window-fixture.js";
import { RECORDED_SEQUENCE_POSITIVES, RECORDED_SEQUENCE_HARD_NEGATIVES, RECORDED_CASTLING_ATTRACTION, RECORDED_CASTLING_CLEARANCE, RECORDED_CASTLING_DEFENDER, RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK } from "./testing/recorded-sequence-fixtures.js";

const ALL: readonly RecordedWindowRoute[] = [...Object.keys(RECORDED_SEQUENCE_HORIZONS) as (keyof typeof RECORDED_SEQUENCE_HORIZONS)[], "derived.exchange.trade_completed@2"];
const projection = (route: string) => ({ id: route.split("@")[0]!, version: Number(route.split("@")[1]) });
const request = (run: ReturnType<typeof recordedSequenceWindowFixture>, route: RecordedWindowRoute, throughNodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId) => ({ run, branchId, throughNodeId, projection: projection(route) });
const fixtureFor = (route: string) => RECORDED_SEQUENCE_POSITIVES.find(item => item.projection === projection(route).id)!;
const payloads = (values: readonly unknown[]) => values.map(value => JSON.stringify(value)).sort();
function available(result: RecordedSemanticWindowResult) {
  expect(result.kind).toBe("window_available");
  if (result.kind !== "window_available") throw new Error(result.reason);
  return result;
}

describe("scoped recorded semantic supplier", () => {
  for (const route of ALL) for (const mirror of [false, true]) {
    it(`${route} constructs genuine exact events and complete receipts, mirror=${mirror}`, () => {
      const run = recordedSequenceWindowFixture(fixtureFor(route), mirror), result = available(recordedSemanticWindowSource(request(run, route)));
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.scope).toEqual({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, projection: projection(route) });
      const old = recordedSemanticPath(run, run.activeCursor.branchId); expect(old.kind).toBe("available"); if (old.kind !== "available") throw new Error(old.reason);
      const prior = old.events.filter(event => event.projection.id === projection(route).id && event.anchor.nodeId === run.activeCursor.nodeId);
      expect(payloads(result.events.map(event => event.operands))).toEqual(payloads(prior.map(event => event.operands)));
      for (const event of result.events) {
        expect(event.projection).toEqual(projection(route)); assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
        expect(event.anchor.nodeId).toBe(run.activeCursor.nodeId);
        expect(event.derivationInputs.map(value => evidenceValueReceipt(value).payloadDigest)).toEqual(evidenceValueReceipt(event.evidence).sourceDigests);
        expect(event.basis).toMatchObject(prior.find(item => JSON.stringify(item.operands) === JSON.stringify(event.operands))!.basis);
      }
      expect(result.windows.flatMap(window => window.eventIds)).toEqual(result.events.map(event => event.id));
      expect(result.conventionReceipt.eventReceiptDigests).toEqual(result.events.map(event => evidenceValueReceipt(event.evidence).convention!.digest));
      expect(recordedSemanticWindowSource(request(run, route))).toEqual(result);
      expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.scope.projection)).toBe(true);
    });
    it(`${route} distinguishes every missing prefix, complete-empty and observed window, mirror=${mirror}`, () => {
      const run = recordedSequenceWindowFixture(fixtureFor(route), mirror), path = branchPath(run, run.activeCursor.branchId), horizons = route === "derived.exchange.trade_completed@2" ? [2] : [...RECORDED_SEQUENCE_HORIZONS[route]];
      const old = recordedSemanticPath(run, run.activeCursor.branchId); if (old.kind !== "available") throw new Error(old.reason);
      for (const [index, node] of path.entries()) {
        const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
        try {
          const result = recordedSemanticWindowSource(request(run, route, node.id));
          if (index < Math.min(...horizons)) {
            expect(result).toEqual({ kind: "window_missing", scope: { runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: node.id, projection: projection(route) }, reason: "no_recorded_window", requiredHorizons: horizons, availablePrefixEdges: index });
            expect(calls.mock.calls.filter(([ref]) => ref !== "run.record.edge@1")).toEqual([]);
          } else {
            const complete = available(result);
            expect(complete.omittedHorizons).toEqual(horizons.filter(horizon => horizon > index));
            expect(complete.windows.map(window => window.horizon)).toEqual(horizons.filter(horizon => horizon <= index));
            expect(complete.windows.every(window => window.endNodeId === node.id)).toBe(true);
            const expected = old.events.filter(event => event.projection.id === projection(route).id && event.anchor.nodeId === node.id);
            expect(payloads(complete.events.map(event => event.operands))).toEqual(payloads(expected.map(event => event.operands)));
          }
        } finally { calls.mockRestore(); }
      }
    });
    it(`${route} returns available no-witness on its complete hard negative, mirror=${mirror}`, () => {
      const fixture = RECORDED_SEQUENCE_HARD_NEGATIVES.find(item => item.projection === projection(route).id)!, run = recordedSequenceWindowFixture(fixture, mirror);
      const result = available(recordedSemanticWindowSource(request(run, route)));
      expect(result.events).toEqual([]); expect(result.windows.length).toBeGreaterThan(0);
      expect(result.windows.every(window => window.status === "no_witness" && window.eventIds.length === 0)).toBe(true);
      expect(result.conventionReceipt.refs).toEqual([]);
    });
  }

  for (const [route, fixtures] of [
    ["derived.tactic.attraction_observed@3", [RECORDED_ATTRACTION_FIVE, ...RECORDED_CASTLING_ATTRACTION]],
    ["derived.tactic.deflection_observed@3", [RECORDED_DEFLECTION_CHECK]],
    ["derived.tactic.square_clearance_observed@3", RECORDED_CASTLING_CLEARANCE],
    ["derived.tactic.sequence.defender_consequence@3", RECORDED_CASTLING_DEFENDER],
  ] as const) it.each(fixtures.map(fixture => ({ fen: fixture.fen, moves: fixture.moves })))(`${route} retains physical special-move events: $fen`, setup => {
    const run = recordedSequenceWindowFixture(setup), result = available(recordedSemanticWindowSource(request(run, route))), prior = recordedSemanticPath(run, run.activeCursor.branchId);
    if (prior.kind !== "available") throw new Error(prior.reason);
    expect(payloads(result.events.map(event => event.operands))).toEqual(payloads(prior.events.filter(event => event.projection.id === projection(route).id && event.anchor.nodeId === run.activeCursor.nodeId).map(event => event.operands)));
  });

  it("keeps inherited creating-branch anchors separate from the requested grant", () => {
    const route = "derived.pawn.sequence.harassment_pressure@3", original = recordedSequenceRouteFixture(route), run = fork(original, original.activeCursor.nodeId, { at }).run;
    const inherited = available(recordedSemanticWindowSource(request(run, route))), main = available(recordedSemanticWindowSource(request(run, route, original.activeCursor.nodeId, original.activeCursor.branchId)));
    expect(inherited.scope.branchId).toBe(run.activeCursor.branchId);
    expect(inherited.events.every(event => event.anchor.branchId === original.activeCursor.branchId)).toBe(true);
    expect(inherited.events.map(event => event.operands)).toEqual(main.events.map(event => event.operands)); expect(inherited.identity).not.toBe(main.identity);
    const path = branchPath(original, original.activeCursor.branchId), sibling = fork(rewind(original, path[2]!.id, at).run, path[2]!.id, { at }).run;
    expect(recordedSemanticWindowSource(request(sibling, route, path.at(-1)!.id))).toEqual({ kind: "window_refused", reason: "endpoint_not_on_branch" });
  });

  it("binds complete full heads even when scoped event payloads do not change", () => {
    const route = "derived.tactic.deflection_observed@3", original = recordedSequenceRouteFixture(route);
    const change = (centipawns: number) => attachEvidence(original, original.nodes[0]!.id, ["synthetic:same-reference"], { kind: "eval", source: "engine_validated", values: { centipawns } }, at).run;
    const left = available(recordedSemanticWindowSource(request(change(1), route))), right = available(recordedSemanticWindowSource(request(change(2), route)));
    expect(left.events.map(event => event.operands)).toEqual(right.events.map(event => event.operands)); expect(left.identity).not.toBe(right.identity);
    const other = change(2), window = createRecordedSequenceWindows({ run: other, branchId: other.activeCursor.branchId, throughNodeId: other.activeCursor.nodeId, route }).windows[0]!;
    const genuine = invokeEvidenceValueRoute(route, { window }), originalInvoke = routes.invokeEvidenceValueRoute;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => ref === route ? genuine : originalInvoke(ref as never, input as never)) as typeof routes.invokeEvidenceValueRoute);
    try { expect(recordedSemanticWindowSource(request(change(1), route))).toEqual({ kind: "window_refused", reason: "source_contract_invalid" }); } finally { calls.mockRestore(); }
  });

  it("returns only closed source failure codes, never private diagnostics or false no-witness", () => {
    const route = "derived.tactic.deflection_observed@3", run = recordedSequenceRouteFixture(route), original = routes.invokeEvidenceValueRoute;
    for (const fault of ["missing_capture", "lookup", "held_metadata", "exception", "copied_output"] as const) {
      const good = recordedSemanticWindowSource(request(run, route)); available(good);
      let lookup: unknown;
      try { original("not.registered@1" as never, {} as never); } catch (error) { lookup = error; }
      expect(lookup).toBeInstanceOf(EvidenceValueRouteLookupError); expect(lookup).toBeInstanceOf(TypeError);
      const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
        if (fault === "missing_capture" && ref === "rules.transition.event.capture@1") return [];
        if (ref === route) {
          if (fault === "lookup") throw lookup;
          if (fault === "held_metadata") return { kind: "unavailable", reason: "source_version_held", dependency: "semantic-convention-provenance" };
          if (fault === "exception") throw new Error("PRIVATE DIAGNOSTIC RUN ID FEN OWNER");
          if (fault === "copied_output") return (original(ref as never, input as never) as unknown as readonly object[]).map(value => ({ ...value }));
        }
        return original(ref as never, input as never);
      }) as typeof routes.invokeEvidenceValueRoute);
      try { expect(recordedSemanticWindowSource(request(run, route))).toEqual({ kind: "window_refused", reason: fault === "lookup" ? "source_lookup_failed" : "source_contract_invalid" }); } finally { calls.mockRestore(); }
    }
  });

  it("rejects unsupported versions/overrides before source work and preserves graph refusal types", () => {
    const route = "derived.tactic.deflection_observed@3", run = recordedSequenceRouteFixture(route), input = request(run, route), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      for (const changed of [{ ...input, projection: { ...input.projection, version: 2 } }, { ...input, projection: { ...input.projection, extra: true } }, { ...input, projection: { id: input.projection.id, version: "3" } }, { ...input, edges: [] }]) expect(recordedSemanticWindowSource(changed as never)).toEqual({ kind: "window_refused", reason: "projection_unsupported" });
      expect(recordedSemanticWindowSource({ ...input, branchId: "private-unknown" })).toEqual({ kind: "window_refused", reason: "unknown_branch" });
      const duplicated = { ...run, nodes: [...run.nodes, run.nodes.at(-1)!] };
      expect(recordedSemanticWindowSource({ ...input, run: duplicated })).toEqual({ kind: "window_refused", reason: "duplicate_node_id" });
      expect(calls).not.toHaveBeenCalled();
    } finally { calls.mockRestore(); }
    const last = run.activeCursor.nodeId;
    const corrupt = projectRun(run.events.map(event => event.type === "move.committed" && event.data.node.id === last ? { ...event, data: { ...event.data, node: { ...event.data.node, fen: "not-a-fen" } } } : event));
    expect(recordedSemanticWindowSource(request(corrupt, route, run.nodes[0]!.id))).toEqual({ kind: "window_refused", reason: "broken_fen_boundary" });
  });

  it("does not promote event registration or predecessor qualifications into learner authority", () => {
    for (const route of ALL.filter(route => route.endsWith("@3"))) {
      expect(SEMANTIC_EVENT_PROJECTION_REFS).toContainEqual(projection(route));
      const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => binding.projection.id === projection(route).id && binding.projection.version === 3);
      expect(bindings).toHaveLength(1); expect(bindings[0]!.consumer.id).toBe("research.semantic_selection");
      const result = available(recordedSemanticWindowSource(request(recordedSequenceWindowFixture(fixtureFor(route)), route)));
      expect(semanticValidationVerdict({ kind: "event", projection: projection(route) })?.verdict).toBe("unvalidated");
      for (const event of result.events) expect(admitValidatedSemanticInstance("event", event.evidence)).toMatchObject({ kind: "refused", reason: "event_unvalidated" });
    }
  });

  it.each(["rules.transition.event.capture@1", "derived.tactic.deflection_observed@3"] as const)("%s exceptions cannot be misfiled as a malformed original graph", target => {
    const route = "derived.tactic.deflection_observed@3", run = recordedSequenceRouteFixture(route), original = routes.invokeEvidenceValueRoute;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      if (ref === target) throw new RecordedEdgeError("illegal_recorded_move", run.activeCursor.nodeId, "private producer contract fault");
      return original(ref as never, input as never);
    }) as typeof routes.invokeEvidenceValueRoute);
    try { expect(recordedSemanticWindowSource(request(run, route))).toEqual({ kind: "window_refused", reason: "source_contract_invalid" }); } finally { calls.mockRestore(); }
  });

  for (const mirror of [false, true]) it.each([
    { name: "en passant", fen: "3r3k/8/8/3pP3/8/8/8/7K w - d6 0 1", moves: ["e5d6", "d8d6"], enPassant: true },
    { name: "capture promotion", fen: "rr5k/P7/8/8/8/8/8/7K w - - 0 1", moves: ["a7b8q", "a8b8"], enPassant: false },
    { name: "capture underpromotion", fen: "rr5k/P7/8/8/8/8/8/7K w - - 0 1", moves: ["a7b8n", "a8b8"], enPassant: false },
  ])("trade retains exact $name capture/edge occurrences, mirror=" + mirror, setup => {
    const run = recordedSequenceWindowFixture(setup, mirror), result = available(recordedSemanticWindowSource(request(run, "derived.exchange.trade_completed@2")));
    expect(result.events).toHaveLength(1);
    const event = result.events[0]!, prior = recordedSemanticPath(run, run.activeCursor.branchId);
    if (prior.kind !== "available") throw new Error(prior.reason);
    expect(event.operands).toEqual(prior.events.find(value => value.projection.id === "derived.exchange.trade_completed")!.operands);
    expect(event.operands).toMatchObject({ first: { enPassant: setup.enPassant } });
    expect(event.derivationInputs.map(value => `${value.projection.id}@${value.projection.version}`)).toEqual(["rules.transition.event.capture@1", "rules.transition.event.capture@1", "run.record.edge@1", "run.record.edge@1"]);
  });
});
