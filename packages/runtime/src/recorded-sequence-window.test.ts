import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { directProjectionConventions, deriveProjectionConventionTable } from "./evidence-convention-closure.js";
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { attachEvidence } from "./evidence.js";
import { projectRun } from "./events.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import * as routes from "./internal/evidence-value-routes.js";
import { recordedSemanticPath } from "./recorded-semantic-path.js";
import { createRecordedSequenceWindows, readRecordedSequenceWindow, recordedSequenceWindowInputs, RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceRoute } from "./recorded-sequence-window.js";
import * as semantics from "./semantic-evidence.js";
import { fork, rewind } from "./runtime.js";
import { recordedSequenceRouteFixture, recordedSequenceWindowFixture, RECORDED_SEQUENCE_AT as at } from "./testing/recorded-sequence-window-fixture.js";
import { RECORDED_SEQUENCE_HARD_NEGATIVES, RECORDED_SEQUENCE_POSITIVES, RECORDED_ATTRACTION_FIVE, RECORDED_DEFLECTION_CHECK, RECORDED_CASTLING_ATTRACTION, RECORDED_CASTLING_CLEARANCE, RECORDED_CASTLING_DEFENDER } from "./testing/recorded-sequence-fixtures.js";

const ALL = Object.keys(RECORDED_SEQUENCE_HORIZONS) as RecordedSequenceRoute[];
const ref = (value: DeclaredEvidence<unknown>) => `${value.projection.id}@${value.projection.version}`;
const prepare = (run: ReturnType<typeof recordedSequenceRouteFixture>, route: RecordedSequenceRoute, throughNodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId) => createRecordedSequenceWindows({ run, branchId, throughNodeId, route });
const invoke = (route: string, input: unknown) => routes.invokeEvidenceValueRoute(route as never, input as never) as unknown as readonly DeclaredEvidence<unknown>[];
const ordered = (values: readonly unknown[]) => values.map(value => JSON.stringify(value)).sort();

if (false) {
  // @ts-expect-error Source-owned successors accept no raw caller edge arm.
  invokeEvidenceValueRoute("derived.tactic.square_clearance_observed@3", { edges: [] });
}

function assertSameRecordedPopulation(run: ReturnType<typeof recordedSequenceRouteFixture>, route: RecordedSequenceRoute, throughNodeId = run.activeCursor.nodeId) {
  const prepared = prepare(run, route, throughNodeId), values = prepared.windows.flatMap(window => invokeEvidenceValueRoute(route, { window }));
  const prior = recordedSemanticPath(run, run.activeCursor.branchId);
  expect(prior.kind).toBe("available"); if (prior.kind !== "available") throw new Error(prior.reason);
  const expected = prior.events.filter(event => event.projection.id === route.split("@")[0] && event.anchor.nodeId === throughNodeId);
  expect(ordered(values.map(value => value.payload))).toEqual(ordered(expected.map(event => event.operands)));
  for (const window of prepared.windows) for (const value of invokeEvidenceValueRoute(route, { window })) {
    const data = readRecordedSequenceWindow(window), inputs = recordedSequenceWindowInputs(window, value.payload);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(item => `${item.id}@${item.version}` === route)!;
    const alternatives = declaration.derivation!.inputs === undefined ? declaration.derivation!.anyOf! : [declaration.derivation!.inputs];
    expect(alternatives.map(member => member.map(item => `${item.id}@${item.version}`).join("|"))).toContain(inputs.map(ref).join("|"));
    expect(inputs.slice(0, data.authority.horizon)).toEqual(data.edges);
    expect(evidenceValueReceipt(value).sourceDigests).toEqual(inputs.map(source => evidenceValueReceipt(source).payloadDigest));
    expect(directProjectionConventions(route)).toEqual(directProjectionConventions(route.replace("@3", "@2")));
    const legacy: Record<string, unknown> = { edges: data.edges };
    const captures = inputs.filter(source => ref(source) === "rules.transition.event.capture@1");
    const duty = inputs.find(source => ref(source) === "rules.tactic.reading.defender_duty_set@1"), exchange = inputs.find(source => ref(source) === "rules.exchange.predicate.legal_exchange@1"), check = inputs.find(source => ref(source) === "rules.tactic.event.check@1");
    if (captures.length) legacy[route === "derived.tactic.check_zwischenzug_observed@3" ? "capture" : "captures"] = route === "derived.tactic.check_zwischenzug_observed@3" ? captures[0] : captures;
    if (duty !== undefined) legacy.duty = duty; if (exchange !== undefined) legacy.exchange = exchange; if (check !== undefined) legacy.check = check;
    const old = invoke(route.replace("@3", "@2"), legacy);
    expect(old.map(item => item.payload)).toEqual(invokeEvidenceValueRoute(route, { window }).map(item => item.payload));
    const previous = old.find(item => evidenceDigest(item.payload) === evidenceDigest(value.payload))!;
    expect(evidenceValueReceipt(value).convention!.refs).toEqual(evidenceValueReceipt(previous).convention!.refs);
  }
  return { prepared, values, expected };
}

describe("source-owned recorded sequence windows", () => {
  for (const route of ALL) for (const black of [false, true]) {
    it(`${route} retains actual positive payloads, tuple occurrences and conventions, mirror=${black}`, () => {
      const run = recordedSequenceRouteFixture(route, black), result = assertSameRecordedPopulation(run, route);
      expect(result.values.length).toBeGreaterThan(0);
      const path = branchPath(run, run.activeCursor.branchId);
      for (const window of result.prepared.windows) {
        const data = readRecordedSequenceWindow(window);
        expect(data.edges.map(edge => edge.payload.afterNodeId)).toEqual(path.slice(-data.authority.horizon).map(node => node.id));
        expect(data.authority.throughNodeId).toBe(run.activeCursor.nodeId);
      }
    });
    it(`${route} preserves complete hard negatives without a missing-induction exception, mirror=${black}`, () => {
      const fixture = RECORDED_SEQUENCE_HARD_NEGATIVES.find(item => `${item.projection}@3` === route)!;
      const run = recordedSequenceWindowFixture(fixture, black), result = assertSameRecordedPopulation(run, route);
      expect(result.prepared.windows.length).toBeGreaterThan(0); expect(result.values).toEqual([]);
    });
  }

  it.each(ALL)("%s preserves every complete/omitted horizon and never prepares later detectors", route => {
    const run = recordedSequenceRouteFixture(route), path = branchPath(run, run.activeCursor.branchId), original = routes.invokeEvidenceValueRoute;
    for (const [index, node] of path.entries()) {
      const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
      try {
        const result = prepare(run, route, node.id), horizons = [...RECORDED_SEQUENCE_HORIZONS[route]];
        expect(result.omittedHorizons).toEqual(horizons.filter(horizon => horizon > index));
        expect(result.windows.map(window => readRecordedSequenceWindow(window).authority.horizon)).toEqual(horizons.filter(horizon => horizon <= index));
        const all = calls.mock.calls.filter(([ref]) => ref !== "run.record.edge@1");
        if (result.windows.length === 0) expect(all).toEqual([]);
        for (const [ref, input] of all) {
          expect(["rules.transition.event.capture@1", "rules.tactic.event.check@1"]).toContain(ref);
          const edge = input as { beforeFen: string; afterFen: string };
          expect(path.slice(Math.max(0, index - 5), index).some((parent, slot) => parent.fen === edge.beforeFen && path[Math.max(0, index - 5) + slot + 1]!.fen === edge.afterFen)).toBe(true);
        }
        for (const window of result.windows) original(route, { window });
      } finally { calls.mockRestore(); }
    }
  });

  it.each(ALL)("%s refuses forged/cross-family windows and override keys before computation", route => {
    const run = recordedSequenceRouteFixture(route), window = prepare(run, route).windows.at(-1)!;
    for (const copied of [{ ...window }, JSON.parse(JSON.stringify(window)), run]) expect(() => invoke(route, { window: copied })).toThrow();
    for (const extra of [{ edges: [] }, { captures: [] }, { payload: {} }, { check: true }, { horizon: 3 }]) expect(() => invoke(route, { window, ...extra })).toThrow();
    const other = ALL.find(value => value !== route)!, crossed = prepare(recordedSequenceRouteFixture(other), other).windows[0]!;
    const detect = vi.spyOn(semantics, "recordedDeflectionObservedOperands");
    try { expect(() => invoke(route, { window: crossed })).toThrow(/exact projection/u); expect(detect).not.toHaveBeenCalled(); } finally { detect.mockRestore(); }
  });

  for (const [route, fixtures] of [
    ["derived.tactic.attraction_observed@3", [RECORDED_ATTRACTION_FIVE, ...RECORDED_CASTLING_ATTRACTION]],
    ["derived.tactic.deflection_observed@3", [RECORDED_DEFLECTION_CHECK]],
    ["derived.tactic.square_clearance_observed@3", RECORDED_CASTLING_CLEARANCE],
    ["derived.tactic.sequence.defender_consequence@3", RECORDED_CASTLING_DEFENDER],
  ] as const) it.each(fixtures.map(fixture => ({ fen: fixture.fen, moves: fixture.moves })))(`${route} retains indexed arms and physical special moves: $fen`, fixture => {
    assertSameRecordedPopulation(recordedSequenceWindowFixture(fixture), route);
  });

  it("owns caller data and distinct full heads/branch grants, including inherited endpoints", () => {
    const route = "derived.tactic.deflection_observed@3", original = recordedSequenceRouteFixture(route), run = structuredClone(original), before = prepare(run, route).windows[0]!;
    const payloads = invoke(route, { window: before });
    expect(Object.isFrozen(run)).toBe(false); expect(Object.isFrozen(run.nodes[0])).toBe(false);
    (run.nodes[0]! as { fen: string }).fen = "changed"; (run.events[0]! as { at: string }).at = "changed";
    expect(invoke(route, { window: before })).toEqual(payloads);
    const changed = (centipawns: number) => attachEvidence(original, original.nodes[0]!.id, ["synthetic:equal-ref"], { kind: "eval", source: "engine_validated", values: { centipawns } }, at).run;
    const left = invoke(route, { window: prepare(changed(1), route).windows[0]! }), right = invoke(route, { window: prepare(changed(2), route).windows[0]! });
    expect(left.map(value => value.payload)).toEqual(right.map(value => value.payload));
    expect(evidenceValueReceipt(left[0]!).inputDigest).not.toBe(evidenceValueReceipt(right[0]!).inputDigest);
    const branched = fork(original, original.activeCursor.nodeId, { at }).run;
    const inherited = prepare(branched, route, original.activeCursor.nodeId), main = prepare(branched, route, original.activeCursor.nodeId, original.activeCursor.branchId);
    const a = invoke(route, { window: inherited.windows[0]! })[0]!, b = invoke(route, { window: main.windows[0]! })[0]!;
    expect(a.payload).toEqual(b.payload); expect(evidenceValueReceipt(a).inputDigest).not.toBe(evidenceValueReceipt(b).inputDigest);
    const path = branchPath(original, original.activeCursor.branchId), earlyFork = fork(rewind(original, path[1]!.id, at).run, path[1]!.id, { at }).run;
    expect(prepare(earlyFork, route, path[0]!.id).windows).toEqual([]);
    expect(() => prepare(earlyFork, route, original.activeCursor.nodeId)).toThrow(/endpoint/u);
  });

  it("refuses complete original replay/graph/FEN/edge corruption before narrowing or preparation", () => {
    const route = "derived.tactic.deflection_observed@3", original = recordedSequenceRouteFixture(route), root = original.nodes[0]!.id, last = original.activeCursor.nodeId;
    for (const fen of ["not-a-fen", "8/8/8/8/8/8/8/8 w - - 0 1", INITIAL_FEN]) {
      const events = original.events.map(event => event.type === "move.committed" && event.data.node.id === last ? { ...event, data: { ...event.data, node: { ...event.data.node, fen } } } : event);
      const run = projectRun(events), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
      try { expect(() => prepare(run, route, root)).toThrow(); expect(calls).not.toHaveBeenCalled(); } finally { calls.mockRestore(); }
    }
    const duplicated = { ...original, nodes: [...original.nodes, original.nodes.at(-1)!] };
    expect(() => prepare(duplicated, route, root)).toThrow();
  });

  it("keeps all23 finite tuple members and ten source-only routes without current consumer cutover", () => {
    for (const values of Object.values(RECORDED_SEQUENCE_HORIZONS)) expect(Object.isFrozen(values)).toBe(true);
    const projections = ALL.map(route => PRIMARY_EVIDENCE_MANIFEST.projections.find(value => `${value.id}@${value.version}` === route)!);
    expect(projections.reduce((sum, value) => sum + (value.derivation!.inputs === undefined ? value.derivation!.anyOf!.length : 1), 0)).toBe(23);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => ALL.includes(`${binding.projection.id}@${binding.projection.version}` as RecordedSequenceRoute))).toEqual([]);
  });

  it("removing a retained direct convention token really drops the new route's closure", () => {
    const route = "derived.tactic.square_clearance_observed@3";
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST, projections: PRIMARY_EVIDENCE_MANIFEST.projections.map(value => `${value.id}@${value.version}` === route ? { ...value, semantics: value.semantics.replaceAll("observed-window@1", "removed convention") } : value) };
    expect(directProjectionConventions(route).some(value => value.id === "observed-window")).toBe(true);
    expect(deriveProjectionConventionTable(manifest).get(route)!.refs.some(value => value.id === "observed-window")).toBe(false);
  });

  for (const [route, captureIndexes] of [
    ["derived.tactic.deflection_observed@3", [0, 1, 2]],
    ["derived.tactic.attraction_observed@3", [1]],
    ["derived.tactic.overload_exploitation_observed@3", [0, 1, 2]],
  ] as const) for (const index of captureIndexes) for (const fault of ["dropped", "duplicated", "genuine-crossed"] as const) {
    it(`${route} refuses ${fault} capture execution at indexed edge${index}`, () => {
      const run = recordedSequenceRouteFixture(route), good = prepare(run, route).windows[0]!, data = readRecordedSequenceWindow(good), edge = data.edges[index]!.payload;
      const foreign = data.captures.find((row, ordinal) => ordinal !== index && row.length > 0)?.[0]
        ?? readRecordedSequenceWindow(prepare(recordedSequenceRouteFixture("derived.tactic.deflection_observed@3"), "derived.tactic.deflection_observed@3").windows[0]!).captures[0]![0]!;
      const original = routes.invokeEvidenceValueRoute, calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: { beforeFen?: string; moveUci?: string }) => {
        const values = original(ref as never, input as never);
        if (ref !== "rules.transition.event.capture@1" || input.beforeFen !== edge.beforeFen || input.moveUci !== edge.moveUci) return values;
        return fault === "dropped" ? [] : fault === "duplicated" ? [data.captures[index]![0], data.captures[index]![0]] : [foreign];
      }) as typeof routes.invokeEvidenceValueRoute);
      try { expect(() => prepare(run, route)).toThrow(/complete|exact|indexed/u); } finally { calls.mockRestore(); }
    });
  }

  for (const [route, setup, checkIndex, horizon] of [
    ["derived.tactic.deflection_observed@3", RECORDED_DEFLECTION_CHECK, 0, 3],
    ["derived.tactic.attraction_observed@3", RECORDED_SEQUENCE_POSITIVES.find(value => value.projection === "derived.tactic.attraction_observed")!, 2, 3],
    ["derived.tactic.check_zwischenzug_observed@3", RECORDED_SEQUENCE_POSITIVES.find(value => value.projection === "derived.tactic.check_zwischenzug_observed")!, 1, 4],
  ] as const) it(`${route} refuses a genuine equal-payload/same-UCI check from another full edge`, () => {
    const run = recordedSequenceWindowFixture(setup), good = prepare(run, route).windows.find(window => readRecordedSequenceWindow(window).authority.horizon === horizon)!, data = readRecordedSequenceWindow(good);
    const otherRun = recordedSequenceWindowFixture({ ...setup, fen: setup.fen.replace(/\d+ \d+$/u, "12 21") });
    const other = prepare(otherRun, route).windows.find(window => readRecordedSequenceWindow(window).authority.horizon === horizon)!, wrong = readRecordedSequenceWindow(other).checks[checkIndex]![0]!;
    expect(wrong.payload).toEqual(data.checks[checkIndex]![0]!.payload);
    expect(evidenceValueReceipt(wrong).inputDigest).not.toBe(evidenceValueReceipt(data.checks[checkIndex]![0]!).inputDigest);
    const original = routes.invokeEvidenceValueRoute, calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => ref === "rules.tactic.event.check@1" ? [wrong] : original(ref as never, input as never)) as typeof routes.invokeEvidenceValueRoute);
    try { expect(() => prepare(run, route)).toThrow(/exact/u); } finally { calls.mockRestore(); }
  });

  it.each(["duty", "exchange", "edge"] as const)("refuses genuine foreign %s authority, never an empty-success fallback", source => {
    const route = "derived.tactic.deflection_observed@3", run = recordedSequenceRouteFixture(route), data = readRecordedSequenceWindow(prepare(run, route).windows[0]!);
    const other = recordedSequenceWindowFixture(RECORDED_SEQUENCE_POSITIVES.find(value => value.projection === "derived.tactic.deflection_observed")!, false, "foreign-owner");
    const path = branchPath(other, other.activeCursor.branchId);
    const wrong = source === "duty" ? invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: path[1]!.fen })
      : source === "exchange" ? invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: path[0]!.fen, captureUci: path[1]!.moveUci! })[0]!
        : invokeEvidenceValueRoute("run.record.edge@1", { run: other, parent: path[0]!, child: path[1]! });
    const target = source === "duty" ? "rules.tactic.reading.defender_duty_set@1" : source === "exchange" ? "rules.exchange.predicate.legal_exchange@1" : "run.record.edge@1";
    const original = routes.invokeEvidenceValueRoute, calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => ref === target ? source === "exchange" ? [wrong] : wrong : original(ref as never, input as never)) as typeof routes.invokeEvidenceValueRoute);
    try {
      if (source === "edge") expect(() => prepare(run, route)).toThrow(/exact/u);
      else { const prepared = prepare(run, route); expect(() => invoke(route, { window: prepared.windows[0] })).toThrow(/exact/u); }
      expect(data.captures.flat()).toHaveLength(3);
    } finally { calls.mockRestore(); }
  });

  it("retains source-owned quiet capture executions and refuses their failed acquisition", () => {
    const route = "derived.tactic.attraction_observed@3", run = recordedSequenceRouteFixture(route), data = readRecordedSequenceWindow(prepare(run, route).windows[0]!);
    expect(data.captures.map(values => values.length)).toEqual([0, 1, 0]);
    const original = routes.invokeEvidenceValueRoute, calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: { beforeFen?: string }) => {
      if (ref === "rules.transition.event.capture@1" && input.beforeFen === data.edges[0]!.payload.beforeFen) throw new Error("source acquisition failed");
      return original(ref as never, input as never);
    }) as typeof routes.invokeEvidenceValueRoute);
    try { expect(() => prepare(run, route)).toThrow("source acquisition failed"); } finally { calls.mockRestore(); }
  });

  it("refuses unsupported/nonclosed scope before edge or detector acquisition", () => {
    const run = recordedSequenceRouteFixture(ALL[0]!), input = { run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, route: ALL[0]! };
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      for (const changed of [{ ...input, route: "derived.pawn.sequence.contact_timing@2" }, { ...input, route: { toString: () => input.route } }, { ...input, edges: [] }, { ...input, branchId: "" }, { ...input, throughNodeId: "" }]) expect(() => createRecordedSequenceWindows(changed as never)).toThrow();
      expect(calls).not.toHaveBeenCalled();
    } finally { calls.mockRestore(); }
  });

  it("validates canonical original roots even for a zero-edge/missing window", () => {
    const route = "derived.pawn.sequence.contact_timing@3", original = recordedSequenceRouteFixture(route), first = original.events[0]!;
    if (first.type !== "run.started") throw new Error("Fixture requires an actual start");
    const fen = INITIAL_FEN.replace("KQkq", "HAha"), run = projectRun([{ ...first, data: { ...first.data, start: { ...first.data.start, fen }, rootNode: { ...first.data.rootNode, fen } } }]);
    expect(branchPath(run, run.activeCursor.branchId)).toHaveLength(1);
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => prepare(run, route)).toThrow(/canonical/u); expect(calls).not.toHaveBeenCalled(); } finally { calls.mockRestore(); }
  });
});
