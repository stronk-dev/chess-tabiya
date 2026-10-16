import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { compareBranches } from "./compare.js";
import { structureDeltaEntries } from "./compare-strip-values.js";
import { collectComparisonStructuralPopulation, readComparisonStructuralPopulation, comparisonStructuralAppearances, comparisonStructuralPopulationImage, assertComparisonStructuralPopulationScope, type RecordedComparisonStructuralPopulation } from "./comparison-structural-population.js";
import { evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { attachEvidence } from "./evidence.js";
import { COMPARISON_STRUCTURAL_ROUTES } from "./internal/comparison-structural-families.js";
import { invokeEvidenceValueRoute, readStructuralPopulationInvocation, assertRecordedPositionInvocation } from "./internal/evidence-value-routes.js";
import * as routes from "./internal/evidence-value-routes.js";
import { createRecordedComparisonSource, recordedComparisonData, type RecordedComparisonSource } from "./recorded-comparison.js";
import { readBackReplay } from "./replay.js";
import { canonicalRunStart } from "./session.js";
import { createRun, commitMove, rewind, fork } from "./runtime.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "./semantic-validation.js";
import { structuralReading, observationIdentity, type StructuralObservation } from "./structure.js";
import { recordedComparisonFixture, RECORDED_COMPARISON_AT as at } from "./testing/recorded-comparison-fixture.js";
import type { DrillRun } from "./types.js";

const collect = (comparison: RecordedComparisonSource) => collectComparisonStructuralPopulation({ comparison });
const oldView = (items: ReturnType<typeof comparisonStructuralAppearances>) => items.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, observation: item.payload.observation }));
function fixture(mainMoves: readonly string[], peerMoves: readonly string[], black = false, initialFen = INITIAL_FEN) {
  const fen = black ? mirrorSemanticFen(initialFen, "color_and_vertical") : initialFen, transform = (move: string) => black ? mirrorSemanticUci(move, "color_and_vertical") : move;
  let run = createRun({ id: "structural-population", session: { kind: "position", start: canonicalRunStart({ fen, side: black ? "black" : "white" }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const main = run.activeCursor.branchId, root = run.activeCursor.nodeId;
  for (const move of mainMoves) run = commitMove(run, transform(move), { at }).run;
  const mainPath = branchPath(run, main);
  run = fork(rewind(run, root, at).run, root, { at }).run;
  const peer = run.activeCursor.branchId;
  for (const move of peerMoves) run = commitMove(run, transform(move), { at }).run;
  const peerPath = branchPath(run, peer), columns = [{ branchId: main, throughNodeId: mainPath.at(-1)!.id }, { branchId: peer, throughNodeId: peerPath.at(-1)!.id }] as const;
  return { run, main, peer, root, mainPath, peerPath, columns, comparison: createRecordedComparisonSource({ run, columns }) };
}

// Pure convention oracle reads the granted paths directly; it never mints a cropped fake run.
function scopedExpected(run: DrillRun, paths: readonly (readonly DrillRun["nodes"][number][])[], requested: number, forkNodeId: string) {
  const fork = run.nodes.find(node => node.id === forkNodeId)!, views = paths.map(path => path.filter(node => node.ply >= fork.ply).map(node => ({ node, observations: structuralReading(node.fen).features })));
  const unions = views.map(rows => new Set(rows.slice(1).flatMap(row => row.observations.map(observationIdentity))));
  const common = new Set([...unions[0]!].filter(key => unions[1]!.has(key))), output: { nodeId: string; plyOffset: number; observation: StructuralObservation }[] = [];
  let previous = new Set<string>();
  for (const [index, row] of views[requested]!.entries()) {
    if (index > 0) for (const observation of row.observations) if (!previous.has(observationIdentity(observation)) && !common.has(observationIdentity(observation))) output.push({ nodeId: row.node.id, plyOffset: row.node.ply - fork.ply, observation });
    previous = new Set(row.observations.map(observationIdentity));
  }
  return output;
}

describe("complete owned structural comparison populations", () => {
  it.each([false, true])("retains every original fork-inclusive row/family and exact old tip output, black=%s", black => {
    const value = recordedComparisonFixture(black), population = collect(value.comparison), data = readComparisonStructuralPopulation(population);
    expect(data.comparison).toBe(value.comparison);
    const refs = COMPARISON_STRUCTURAL_ROUTES.map(route => ({ id: route.split("@")[0]!, version: Number(route.split("@")[1]) }));
    expect(refs).toEqual(PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.compare.structure_delta" && row.version === 1)!.derivation!.inputs);
    expect(refs).toHaveLength(17); expect(refs.some(ref => ref.id.endsWith(".pawn_count"))).toBe(false);
    let empty = 0, positive = 0;
    for (const [index, column] of data.columns.entries()) {
      const path = index === 0 ? value.mainPath : value.peerPath;
      expect(column.branchId).toBe(index === 0 ? value.main : value.peer);
      expect(column.nodes.map(row => row.pathIndex)).toEqual(path.slice(2).map((_, offset) => offset + 2));
      for (const row of column.nodes) {
        const original = path[row.pathIndex]!;
        expect(row.position.payload).toEqual({ nodeId: original.id, ply: original.ply, fen: original.fen });
        expect(row.families.map(family => family.projection)).toEqual(refs);
        for (const [family, values] of row.families.entries()) {
          const invocation = readStructuralPopulationInvocation(values.items, COMPARISON_STRUCTURAL_ROUTES[family]!, original.fen);
          expect(invocation.items).toBe(values.items); expect(Object.isFrozen(invocation.items)).toBe(true);
          expect(invocation.convention.refs).toEqual(directProjectionConventions(COMPARISON_STRUCTURAL_ROUTES[family]!));
          for (const item of values.items) expect(evidenceValueReceipt(item)).toMatchObject({ inputDigest: evidenceDigest({ fen: original.fen }), convention: invocation.convention });
          if (values.items.length === 0) empty++; else positive++;
        }
      }
      const actual = comparisonStructuralAppearances(population, column.branchId);
      const image = comparisonStructuralPopulationImage(population, column.branchId);
      expect(image.comparison).toBe(recordedComparisonData(value.comparison).authority);
      expect(image.columns[index]!.nodes.map(row => row.pathIndex)).toEqual(column.nodes.map(row => row.pathIndex));
      for (const [nodeIndex, row] of column.nodes.entries()) {
        const encoded = image.columns[index]!.nodes[nodeIndex]!;
        expect(encoded.position).toEqual({ producer: row.position.producer, projection: row.position.projection, receipt: evidenceValueReceipt(row.position) });
        expect(encoded.families).toHaveLength(17);
        for (const [familyIndex, family] of row.families.entries()) {
          const proof = readStructuralPopulationInvocation(family.items, COMPARISON_STRUCTURAL_ROUTES[familyIndex]!, row.position.payload.fen), actual = encoded.families[familyIndex]!;
          expect(actual.items).toEqual(family.items.map(item => ({ producer: item.producer, projection: item.projection, receipt: evidenceValueReceipt(item) })));
          expect(actual.invocation).toEqual({ factory: proof.factory, fen: proof.fen, inputDigest: proof.inputDigest, convention: proof.convention });
        }
      }
      expect(oldView(actual)).toEqual(structureDeltaEntries(value.run, compareBranches(value.run, [value.main, value.peer]), column.branchId, structuralReading));
      for (const item of actual) {
        const row = column.nodes.find(row => row.pathIndex === item.occurrence.pathIndex)!, source = row.families[item.occurrence.family]!.items[item.occurrence.item]!;
        expect(item.occurrence.column).toBe(index); expect(item.nodeId).toBe(row.position.payload.nodeId);
        if (source.projection.id !== "rules.structural.reading.named_structure") expect(item.payload.observation).toBe(source.payload);
      }
    }
    expect(empty).toBeGreaterThan(0); expect(positive).toBeGreaterThan(0);
    expect(data.columns[0].nodes[0]!.position).toBe(data.columns[1].nodes[0]!.position);
  });

  it.each([false, true])("honors both endpoint grants, column order, absolute indexes and fork-only empties, black=%s", black => {
    const value = recordedComparisonFixture(black);
    let cases = 0;
    for (let left = 2; left < value.mainPath.length; left++) for (let right = 2; right < value.peerPath.length; right++) {
      const columns = [{ branchId: value.main, throughNodeId: value.mainPath[left]!.id }, { branchId: value.peer, throughNodeId: value.peerPath[right]!.id }] as const;
      const comparison = createRecordedComparisonSource({ run: value.run, columns }), population = collect(comparison), reversed = collect(createRecordedComparisonSource({ run: value.run, columns: [columns[1], columns[0]] }));
      for (const [index, branch] of [value.main, value.peer].entries()) {
        const actual = comparisonStructuralAppearances(population, branch);
        expect(oldView(actual)).toEqual(scopedExpected(value.run, [value.mainPath.slice(0, left + 1), value.peerPath.slice(0, right + 1)], index, value.shared.id));
        expect(oldView(comparisonStructuralAppearances(reversed, branch))).toEqual(oldView(actual));
        expect(evidenceDigest(comparisonStructuralPopulationImage(reversed, branch))).not.toBe(evidenceDigest(comparisonStructuralPopulationImage(population, branch)));
        expect(actual.some(item => item.nodeId === value.shared.id)).toBe(false);
        cases++;
      }
    }
    expect(cases).toBe(30);
    const population = collect(createRecordedComparisonSource({ run: value.run, columns: value.columns.map(column => ({ ...column, throughNodeId: value.shared.id })) as never }));
    expect(comparisonStructuralAppearances(population, value.main)).toEqual([]);
    expect(evidenceDigest(comparisonStructuralPopulationImage(population, value.peer))).not.toBe(evidenceDigest(comparisonStructuralPopulationImage(population, value.main)));
    expect(readComparisonStructuralPopulation(population).columns.every(column => column.nodes[0]!.families.length === 17)).toBe(true);
  });

  for (const black of [false, true]) it("retains true reappearance and a strictly later peer suppression, black=" + black, () => {
    const value = fixture(["g1f3", "g8f6", "f3g1", "f6g8", "g1f3"], ["b1c3", "b8c6"], black);
    const actual = comparisonStructuralAppearances(collect(value.comparison), value.main);
    expect(oldView(actual)).toEqual(structureDeltaEntries(value.run, compareBranches(value.run, [value.main, value.peer]), value.main, structuralReading));
    expect(actual.some(first => actual.some(last => first.nodeId !== last.nodeId && observationIdentity(first.payload.observation) === observationIdentity(last.payload.observation)
      && value.mainPath.some(node => node.ply > value.run.nodes.find(node => node.id === first.nodeId)!.ply && node.ply < value.run.nodes.find(node => node.id === last.nodeId)!.ply
        && !structuralReading(node.fen).features.some(observation => observationIdentity(observation) === observationIdentity(first.payload.observation)))))).toBe(true);
    const late = fixture(["g1f3"], ["a2a3", "a7a6", "g1f3"], black);
    const selections = [late.peerPath[2]!.id, late.peerPath[3]!.id].map(throughNodeId => {
      const comparison = createRecordedComparisonSource({ run: late.run, columns: [late.columns[0], { branchId: late.peer, throughNodeId }] });
      return comparisonStructuralAppearances(collect(comparison), late.main).map(item => observationIdentity(item.payload.observation));
    });
    expect(selections[0]!.filter(key => !selections[1]!.includes(key)).length).toBeGreaterThan(0);
    expect(late.mainPath.at(-1)!.ply).toBeLessThan(late.peerPath.at(-1)!.ply);
  });

  it.each([false, true])("retains actual catalogue id/name alongside the closed legacy named view, black=%s", black => {
    const value = fixture(["d2d4"], [], black, "4k3/8/8/8/8/8/3P4/4K3 w - - 0 1"), population = collect(value.comparison), actual = comparisonStructuralAppearances(population, value.main);
    const named = actual.filter(item => item.payload.observation.kind === "named_structure"); expect(named.length).toBeGreaterThan(0);
    for (const item of named) {
      const row = readComparisonStructuralPopulation(population).columns[0].nodes.find(row => row.pathIndex === item.occurrence.pathIndex)!, source = row.families[item.occurrence.family]!.items[item.occurrence.item]!.payload as { id: string; name: string; squares: readonly string[]; provenanceNote: string };
      expect(item.payload.namedStructure).toEqual({ id: source.id, name: source.name });
      expect(item.payload.observation).toEqual({ kind: "named_structure", squares: source.squares, provenanceNote: source.provenanceNote });
      expect(Object.keys(item.payload.observation).sort()).toEqual(["kind", "provenanceNote", "squares"]);
    }
    expect(actual.filter(item => item.payload.observation.kind !== "named_structure").every(item => item.payload.namedStructure === null)).toBe(true);
  });

  it("shares equal-FEN invocations without merging distinct original occurrences", () => {
    const value = fixture(["g1f3", "g8f6", "b1c3", "b8c6"], ["b1c3", "b8c6", "g1f3", "g8f6"]), data = readComparisonStructuralPopulation(collect(value.comparison));
    const left = data.columns[0].nodes.at(-1)!, right = data.columns[1].nodes.at(-1)!;
    expect(left.position.payload.fen).toBe(right.position.payload.fen); expect(left.position.payload.nodeId).not.toBe(right.position.payload.nodeId);
    expect(left.position).not.toBe(right.position); expect(left.families).toBe(right.families);
    expect(data.columns.map(column => column.nodes.length)).toEqual([5, 5]);
  });

  for (const route of COMPARISON_STRUCTURAL_ROUTES) it(`${route} rejects copied/truncated/reordered arrays and genuine wrong-FEN invocations`, () => {
    const value = recordedComparisonFixture(), fen = value.shared.fen, original = routes.invokeEvidenceValueRoute;
    const genuine = original(route, { fen }), foreignFen = fen.replace(/ \d+ \d+$/u, " 17 40"), foreign = original(route, { fen: foreignFen });
    expect(foreign.map(item => item.payload)).toEqual(genuine.map(item => item.payload));
    for (const replacement of [[...genuine], genuine.slice(1), [...genuine].reverse(), foreign, Object.freeze([])]) {
      const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: { fen?: string }) => ref === route && input.fen === fen ? replacement : original(ref as never, input as never)) as typeof original);
      try { expect(() => collect(value.comparison)).toThrow(/complete exact factory invocation/u); } finally { calls.mockRestore(); }
    }
    expect(() => readStructuralPopulationInvocation(genuine, route, foreignFen)).toThrow();
    expect(readStructuralPopulationInvocation(genuine, route, fen).items).toBe(genuine);
  });

  it.each(["throw", "unexecuted", "wrong_ref"] as const)("does not turn %s family work into successful emptiness", fault => {
    const value = recordedComparisonFixture(), original = routes.invokeEvidenceValueRoute;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      if (ref === COMPARISON_STRUCTURAL_ROUTES[0]) {
        if (fault === "throw") throw new Error("actual factory failure");
        if (fault === "unexecuted") return { kind: "unavailable", reason: "not_requested" };
        return original(COMPARISON_STRUCTURAL_ROUTES[1], input as never);
      }
      return original(ref as never, input as never);
    }) as typeof original);
    try { expect(() => collect(value.comparison)).toThrow(); expect(calls.mock.calls.some(([ref]) => ref === COMPARISON_STRUCTURAL_ROUTES[2])).toBe(false); } finally { calls.mockRestore(); }
  });

  it("retains empty invocation conventions rather than inferring them from positive values", () => {
    const value = fixture([], []), data = readComparisonStructuralPopulation(collect(value.comparison));
    const conventions = data.columns[0].nodes[0]!.families.flatMap((family, index) => {
      const invocation = readStructuralPopulationInvocation(family.items, COMPARISON_STRUCTURAL_ROUTES[index]!, data.columns[0].nodes[0]!.position.payload.fen);
      return family.items.length === 0 ? invocation.convention.refs.map(ref => `${ref.id}@${ref.version}`) : [];
    });
    expect(conventions).toContain("backward-pawn-legacy@1"); expect(conventions).toContain("king-opposition-blocker-blind@1"); expect(conventions).toContain("named-structure-catalogue@1");
    expect(comparisonStructuralAppearances(collect(value.comparison), value.main)).toEqual([]);
  });

  it("joins actual position issuance to the complete original head, not equal payload/count receipts", () => {
    const value = recordedComparisonFixture(), report = (centipawns: number) => attachEvidence(value.run, value.shared.id, ["synthetic:same-reference"], { kind: "eval", source: "engine_validated", values: { centipawns } }, at).run;
    const left = createRecordedComparisonSource({ run: report(1), columns: value.columns }), right = createRecordedComparisonSource({ run: report(2), columns: value.columns });
    const leftRun = recordedComparisonData(left).run, rightRun = recordedComparisonData(right).run;
    const position = invokeEvidenceValueRoute("run.record.position@1", { run: rightRun, nodeId: value.shared.id }), own = invokeEvidenceValueRoute("run.record.position@1", { run: leftRun, nodeId: value.shared.id });
    expect(position.payload).toEqual(own.payload); expect(evidenceValueReceipt(position)).toEqual(evidenceValueReceipt(own));
    expect(() => assertRecordedPositionInvocation(position, leftRun, value.shared.id)).toThrow(/original source head/u);
    const original = routes.invokeEvidenceValueRoute, calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: { nodeId?: string }) => ref === "run.record.position@1" && input.nodeId === value.shared.id ? position : original(ref as never, input as never)) as typeof original);
    try { expect(() => collect(left)).toThrow(/original source head/u); } finally { calls.mockRestore(); }
    const clone = createRecordedComparisonSource({ run: structuredClone(leftRun), columns: value.columns });
    expect(() => assertRecordedPositionInvocation(own, recordedComparisonData(clone).run, value.shared.id)).not.toThrow();
    const population = collect(left);
    expect(() => assertComparisonStructuralPopulationScope(population, clone)).not.toThrow();
    expect(() => assertComparisonStructuralPopulationScope(population, right)).toThrow(/different comparison scope/u);
    expect(evidenceDigest(comparisonStructuralPopulationImage(population, value.main))).not.toBe(evidenceDigest(comparisonStructuralPopulationImage(collect(right), value.main)));
  });

  it("retains complete source authority when output is empty and rejects fake handles/branches", () => {
    const value = recordedComparisonFixture(), mutable = structuredClone(value.run), rootColumns = value.columns.map(column => ({ ...column, throughNodeId: value.shared.id })) as never, left = createRecordedComparisonSource({ run: mutable, columns: rootColumns }), population = collect(left);
    const before = evidenceDigest(comparisonStructuralPopulationImage(population, value.main));
    expect(comparisonStructuralAppearances(population, value.main)).toEqual([]);
    expect(() => comparisonStructuralAppearances(population, "unknown")).toThrow(/not a granted/u);
    for (const fake of [{}, { ...population }, JSON.parse(JSON.stringify(population)), value.comparison]) expect(() => readComparisonStructuralPopulation(fake as RecordedComparisonStructuralPopulation)).toThrow(/not issued/u);
    expect(() => collectComparisonStructuralPopulation({ comparison: value.comparison, rows: [] } as never)).toThrow(/exactly/u);
    expect(() => collect({ ...value.comparison } as RecordedComparisonSource)).toThrow(/not issued/u);
    const data = readComparisonStructuralPopulation(population);
    expect(() => (data.columns[0].nodes[0]!.families as unknown[]).pop()).toThrow();
    (mutable.nodes[0] as { fen: string }).fen = "caller mutation";
    expect(evidenceDigest(comparisonStructuralPopulationImage(population, value.main))).toBe(before);
    expect(Object.isFrozen(mutable)).toBe(false);
  });

  it.each([0, 1])("validates an original later corrupt column before any warmed source work: %s", index => {
    const value = recordedComparisonFixture(); collect(value.comparison);
    const id = (index === 0 ? value.mainPath : value.peerPath).at(-1)!.id;
    const run = readBackReplay(value.run.events.map(event => event.type === "move.committed" && event.data.node.id === id ? { ...event, data: { ...event.data, node: { ...event.data.node, fen: "not-a-fen" } } } : event)).run;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => collect(createRecordedComparisonSource({ run, columns: value.columns.map(column => ({ ...column, throughNodeId: value.shared.id })) as never }))).toThrow(); expect(calls).not.toHaveBeenCalled(); } finally { calls.mockRestore(); }
  });
});
