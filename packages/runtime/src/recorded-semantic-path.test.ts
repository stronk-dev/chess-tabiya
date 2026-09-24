import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { branchPath, branchPaths, resolveBranchPath } from "./branch-path.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_FAMILY_IDS, SEMANTIC_EVENT_PROJECTION_REFS } from "./evidence-catalog.js";
import { EvidenceManifestError, compileEvidenceManifest, declareEvidence as declareWithAuthority, evidenceDigest, identitySealedEvidenceWithoutValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import type { LegalExchangeResult } from "./exchange.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { RecordedEdge } from "./recorded-edge.js";

/** Test-only compiler fixture: a correctly-shaped wrapper whose receipt names a non-edge factory. */
const declareEvidence = <T>(producer: VersionedEvidenceId, projection: VersionedEvidenceId, payload: T): DeclaredEvidence<T> => declareWithAuthority(producer, projection, payload, { factory: "test:recorded-path-fixture", inputDigest: "0".repeat(64), sourceDigests: [] });
const declareRecordedEdgeEvidence = (run: DrillRun, parent: Node, child: Node): DeclaredEvidence<RecordedEdge> => invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child });
const declareDefenderDutyEvidence = (fen: string): DeclaredEvidence<unknown> => invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen });
function declareLegalExchangeEvidence(result: LegalExchangeResult): DeclaredEvidence<unknown> {
  const sealed = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: result.beforeFen, captureUci: result.captureUci })[0]!;
  if (evidenceDigest(sealed.payload) !== evidenceDigest(result)) throw new Error("exchange fixture is not reproduced by its authority");
  return sealed;
}
import {
  assertRecordedPathTableClosure,
  recordedPathEvaluatorRows,
  recordedSemanticPath,
  recordedSemanticPathExecution,
  recordedSemanticPathIdentity,
  type RecordedPathIdentityMaterial,
  type RecordedSemanticPathResult,
} from "./recorded-semantic-path.js";
import { commitMove, createRun, rewind } from "./runtime.js";
import {
  assertSemanticEvidenceEvent,
  deflectionObservedOperands,
  recordedDeflectionObservedSemanticEvent,
  recordedSquareClearanceSemanticEvent,
  recordedTradeCompletedSemanticEvent,
  squareClearanceObservedOperands,
  tradeCompletedSemanticEvent,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
  type TransitionSemanticEventOperands,
} from "./semantic-evidence.js";
import { defenderDutyReading } from "./tactics.js";
import type { DrillRun, Node } from "./types.js";

const at = "2026-09-24T00:00:00.000Z";
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const exact = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;
const v2 = (id: string): string => `${id}@2`;

function recordedRun(id: string, fen: string, moves: readonly string[]): DrillRun {
  let run = createRun({ id, packId: "fixture", packDigest: `sha256:${"c".repeat(64)}`, startFen: fen, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return run;
}

function available(result: RecordedSemanticPathResult): Extract<RecordedSemanticPathResult, { kind: "available" }> {
  if (result.kind !== "available") throw new TypeError(`expected an available path, got ${result.reason}: ${result.detail}`);
  return result;
}

function compileMain(run: DrillRun) {
  return available(recordedSemanticPath(run, run.activeCursor.branchId));
}

function replaceNode(run: DrillRun, id: string, change: (node: Node) => Node, extra: readonly Node[] = []): DrillRun {
  return Object.freeze({ ...run, nodes: Object.freeze([...run.nodes.map((node) => node.id === id ? Object.freeze(change(node)) : node), ...extra]) });
}

/** Canonical positive fixtures; every label is the manifest's named v2 validation fixture. */
const POSITIVES = Object.freeze([
  { projection: "derived.exchange.trade_completed", fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", moves: ["e4d5", "e6d5"] },
  { projection: "derived.pawn.sequence.contact_timing", fen: "4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", moves: ["e2e4", "e8f7", "e4d5"] },
  { projection: "derived.pawn.sequence.harassment_pressure", fen: INITIAL, moves: ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "c8g4", "h2h3", "g4h5"] },
  { projection: "derived.tactic.sequence.defender_consequence", fen: "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", moves: ["c5b6", "e8d7", "a1a8"] },
  { projection: "derived.tactic.deflection_observed", fen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e7"] },
  { projection: "derived.tactic.attraction_observed", fen: "4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", moves: ["e6d7", "e8d7", "a1d1"] },
  { projection: "derived.tactic.line_blocker_clearance_observed", fen: "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", moves: ["a4b6", "e8f7", "a1a8"] },
  { projection: "derived.tactic.square_clearance_observed", fen: "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", moves: ["b1c3", "e8d7", "a1b1"] },
  { projection: "derived.tactic.interference_observed", fen: "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", moves: ["b6a6", "e8d7", "a6a5"] },
  { projection: "derived.tactic.check_zwischenzug_observed", fen: "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", moves: ["b4c3", "d1h5", "e8f8", "b2c3"] },
  { projection: "derived.tactic.overload_exploitation_observed", fen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e7"] },
] as const);

/** Extra positive arms: attraction's five-edge queen/rook horizon and check-induced deflection. */
const ATTRACTION_FIVE = { fen: "3r3k/8/8/8/8/2N5/2P5/6K1 w - - 0 1", moves: ["c3d5", "d8d5", "c2c4", "h8g8", "c4d5"] } as const;
const DEFLECTION_CHECK = { fen: "7k/4q1r1/8/8/8/8/8/R1K1R3 w - - 0 1", moves: ["a1a8", "g7g8", "e1e7"] } as const;

/** Existing hard negatives: complete valid windows that must evaluate to `no_witness`. */
const HARD_NEGATIVES = Object.freeze([
  { projection: "derived.exchange.trade_completed", fen: "4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", moves: ["e4d5", "e8f7", "e1f2", "e6d5"] },
  { projection: "derived.pawn.sequence.contact_timing", fen: INITIAL, moves: ["a2a3", "h7h6", "b2b3"] },
  { projection: "derived.pawn.sequence.harassment_pressure", fen: INITIAL, moves: ["d2d4", "d7d5", "g1f3", "g8f6", "e2e3", "c8g4", "h2h3", "g4f5"] },
  { projection: "derived.tactic.sequence.defender_consequence", fen: "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", moves: ["c5b6", "e8d7", "a1a7"] },
  { projection: "derived.tactic.deflection_observed", fen: "1B5k/r7/2n1q3/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "c6a7", "e1e6"] },
  { projection: "derived.tactic.attraction_observed", fen: "4k3/8/1n6/8/2B5/8/8/R5K1 w - - 0 1", moves: ["c4d5", "b6d5", "a1d1"] },
  { projection: "derived.tactic.line_blocker_clearance_observed", fen: "4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", moves: ["b1c3", "e8d7", "a1b1"] },
  { projection: "derived.tactic.square_clearance_observed", fen: "q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", moves: ["a4b6", "e8f7", "a1a8"] },
  { projection: "derived.tactic.interference_observed", fen: "r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", moves: ["b6b5", "e8d7", "b5a5"] },
  { projection: "derived.tactic.check_zwischenzug_observed", fen: "4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", moves: ["b4c3", "d1g4", "e8f8", "b2c3"] },
  { projection: "derived.tactic.overload_exploitation_observed", fen: "1B5k/r3q3/1n6/8/8/8/8/4R1K1 w - - 0 1", moves: ["b8a7", "b6a8", "e1e7"] },
] as const);

function forkedRun(): { readonly run: DrillRun; readonly main: string; readonly alternative: string } {
  let run = recordedRun("forked", "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
  const main = run.activeCursor.branchId;
  const shared = branchPath(run, main)[2]!.id;
  run = rewind(run, shared, at).run;
  run = commitMove(run, "e1e6", { at }).run;
  return { run, main, alternative: run.activeCursor.branchId };
}

describe("recorded semantic path compiler", () => {
  it("[criterion 1] resolves only through the total branchPath and ignores node-array order", () => {
    const { run, main, alternative } = forkedRun();
    const shuffled = Object.freeze({ ...run, nodes: Object.freeze([...run.nodes].reverse()) });
    for (const branchId of [main, alternative]) {
      const straight = available(recordedSemanticPath(run, branchId));
      const reversed = available(recordedSemanticPath(shuffled, branchId));
      expect(straight.pathNodeIds).toEqual(branchPath(run, branchId).map((node) => node.id));
      expect(reversed.pathNodeIds).toEqual(straight.pathNodeIds);
      expect(reversed.digest).toBe(straight.digest);
    }
    expect(branchPaths(run).get(alternative)!.map((node) => node.id)).toEqual(branchPath(run, alternative).map((node) => node.id));
    // @ts-expect-error — no caller-anchor, PGN or PV overload exists.
    expect(() => recordedSemanticPath([{ beforeFen: INITIAL, moveUci: "e2e4" }], "main")).toThrow(/only a recorded DrillRun/u);
  });

  it("[criterion 2] refuses every corrupted graph exactly and before any detector runs", () => {
    const run = recordedRun("graph", INITIAL, ["e2e4", "e7e5", "g1f3"]);
    const branchId = run.activeCursor.branchId;
    const path = branchPath(run, branchId);
    const [root, first, second, leaf] = path as [Node, Node, Node, Node];
    const refusal = (value: DrillRun, id = branchId) => {
      const execution = recordedSemanticPathExecution(value, id);
      expect(execution.work.transitionCompiles + execution.work.checkProbes + execution.work.localFanOut).toBe(0);
      expect(execution.result.kind).toBe("refused");
      return execution.result.kind === "refused" ? execution.result.reason : undefined;
    };
    expect(refusal(run, "absent")).toBe("unknown_branch");
    expect(refusal(Object.freeze({ ...run, branches: Object.freeze([...run.branches, run.branches[0]!]) }))).toBe("duplicate_branch");
    expect(refusal(replaceNode(run, leaf.id, (node) => node, [leaf]))).toBe("duplicate_node_id");
    expect(refusal(Object.freeze({ ...run, events: Object.freeze(run.events.filter((event) => event.type !== "run.started")) }))).toBe("missing_root");
    expect(refusal(replaceNode(run, first.id, (node) => ({ ...node, parentId: null })))).toBe("missing_root");
    expect(refusal(Object.freeze({ ...run, branches: Object.freeze(run.branches.map((branch) => ({ ...branch, forkNodeId: "absent" }))) }))).toBe("missing_fork");
    expect(refusal(replaceNode(run, leaf.id, (node) => ({ ...node, parentId: "absent" })))).toBe("missing_parent");
    expect(refusal(replaceNode(run, second.id, (node) => ({ ...node, parentId: leaf.id })))).toBe("parent_cycle");
    expect(refusal(replaceNode(run, leaf.id, (node) => node, [{ ...leaf, id: `${leaf.id}:twin` }]))).toBe("multiple_branch_tips");
    const stray = { ...root, id: "stray", parentId: root.id, fen: root.fen, ply: 1, moveUci: null, moveSan: null, branchId: "other" };
    const offChain = replaceNode(run, root.id, (node) => node, [stray, { ...second, id: "island", parentId: "stray", branchId }]);
    expect(refusal(offChain)).toBe("multiple_branch_tips");
    const ancestral = replaceNode(run, root.id, (node) => ({ ...node, branchId }));
    expect(recordedSemanticPath(ancestral, branchId).kind).toBe("available");
    const beforeFork = Object.freeze({ ...run, branches: Object.freeze(run.branches.map((branch) => ({ ...branch, forkNodeId: first.id }))), nodes: Object.freeze(run.nodes.map((node) => node.id === root.id ? { ...node, branchId } : node)) });
    expect(refusal(beforeFork)).toBe("off_chain_branch_node");
    expect(() => branchPath(replaceNode(run, leaf.id, (node) => ({ ...node, parentId: "absent" })), branchId)).toThrowError(expect.objectContaining({ code: "INVALID_BRANCH_GRAPH", reason: "missing_parent" }));
    expect(() => branchPaths(replaceNode(run, leaf.id, (node) => ({ ...node, parentId: "absent" })))).toThrowError(expect.objectContaining({ code: "INVALID_BRANCH_GRAPH" }));
    expect(resolveBranchPath(run, "absent")).toMatchObject({ kind: "refused", reason: "unknown_branch" });
  });

  it("[criterion 3] refuses parent, ply, UCI, SAN and FEN corruption and never repairs bytes", () => {
    const castle = recordedRun("castle", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", ["e1h1", "e8a8"]);
    const branchId = castle.activeCursor.branchId;
    const [root, first] = branchPath(castle, branchId) as [Node, Node];
    expect(first.moveUci).toBe("e1h1");
    expect(first.moveSan).toBe("O-O");
    const reason = (value: DrillRun) => {
      const result = recordedSemanticPath(value, branchId);
      return result.kind === "refused" ? result.reason : "available";
    };
    expect(reason(replaceNode(castle, first.id, (node) => ({ ...node, ply: 5 })))).toBe("broken_ply");
    expect(reason(replaceNode(castle, first.id, (node) => ({ ...node, moveUci: "a1b3" })))).toBe("illegal_recorded_move");
    expect(reason(replaceNode(castle, first.id, (node) => ({ ...node, moveUci: "e1g1" })))).toBe("noncanonical_recorded_move");
    expect(reason(replaceNode(castle, first.id, (node) => ({ ...node, moveSan: "Kg1" })))).toBe("noncanonical_recorded_san");
    expect(reason(replaceNode(castle, first.id, (node) => ({ ...node, fen: root.fen })))).toBe("broken_fen_boundary");
    expect(reason(replaceNode(castle, root.id, (node) => ({ ...node, fen: node.fen.replace(" 0 1", " 00 1") })))).toBe("broken_fen_boundary");
    // The adapter takes the run's actual nodes, never caller-authored copies.
    expect(() => declareRecordedEdgeEvidence(castle, root, { ...first })).toThrow(/not an actual parent\/child pair/u);
    const { run, main, alternative } = forkedRun();
    const mainPath = branchPath(run, main), altPath = branchPath(run, alternative);
    expect(altPath[1]!.branchId).toBe(main);
    expect(declareRecordedEdgeEvidence(run, altPath[0]!, altPath[1]!).payload).toEqual(declareRecordedEdgeEvidence(run, mainPath[0]!, mainPath[1]!).payload);
    expect(declareRecordedEdgeEvidence(run, altPath[0]!, altPath[1]!).payload.edgeBranchId).toBe(main);
    expect(declareRecordedEdgeEvidence(run, altPath[2]!, altPath[3]!).payload.edgeBranchId).toBe(alternative);
  });

  it("[criterion 4] keeps one private table set-equal to the exact v2 manifest population", () => {
    const rows = recordedPathEvaluatorRows();
    const v2Refs = SEMANTIC_EVENT_PROJECTION_REFS.filter((value) => value.version === 2);
    expect(new Set(rows.map((row) => exact(row.projection)))).toEqual(new Set(v2Refs.map(exact)));
    expect(new Set(rows.map((row) => exact(row.projection))).size).toBe(11);
    expect(rows).toHaveLength(13);
    expect(() => assertRecordedPathTableClosure(rows, SEMANTIC_EVENT_PROJECTION_REFS, PRIMARY_EVIDENCE_MANIFEST)).not.toThrow();
    expect(() => assertRecordedPathTableClosure(rows.slice(1), SEMANTIC_EVENT_PROJECTION_REFS, PRIMARY_EVIDENCE_MANIFEST)).toThrow(/set-equal|thirteen/u);
    expect(() => assertRecordedPathTableClosure([...rows, { ...rows[0]!, horizon: 3 }], SEMANTIC_EVENT_PROJECTION_REFS, PRIMARY_EVIDENCE_MANIFEST)).toThrow(/thirteen/u);
    expect(() => assertRecordedPathTableClosure([...rows.slice(0, 12), rows[0]!], SEMANTIC_EVENT_PROJECTION_REFS, PRIMARY_EVIDENCE_MANIFEST)).toThrow();
    // An @1/@2 crossed inventory keeps every base id yet fails exact closure.
    const crossed = SEMANTIC_EVENT_PROJECTION_REFS.map((value) => value.id === "derived.tactic.deflection_observed" && value.version === 2 ? { ...value, version: 1 } : value);
    expect(new Set(crossed.map((value) => value.id))).toEqual(new Set(SEMANTIC_EVENT_FAMILY_IDS));
    expect(() => assertRecordedPathTableClosure(rows, crossed, PRIMARY_EVIDENCE_MANIFEST)).toThrow(/set-equal/u);
    expect(PRIMARY_EVIDENCE_MANIFEST.semanticEvents.map((event) => exact(event.projection)).sort()).toEqual(SEMANTIC_EVENT_PROJECTION_REFS.map(exact).sort());
    expect(SEMANTIC_EVENT_FAMILY_IDS.length).toBe(SEMANTIC_EVENT_PROJECTION_REFS.length - 11);
    // Omission fixture: a v2 successor silently compiled as v1 collides instead of passing.
    const omitted = { ...EVIDENCE_CONTRACT_DECLARATIONS, producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => ({ ...producer, outputs: producer.outputs.map((output) => output.version === 2 ? { ...output, version: 1 } : output) })) };
    expect(() => compileEvidenceManifest(omitted)).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_PROJECTION_DUPLICATE" }));
    // v2 successors retain v1 meaning and differ only in the exact edge source.
    for (const ref of SEMANTIC_EVENT_PROJECTION_REFS.filter((value) => value.version === 2)) {
      const one = PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => value.id === ref.id && value.version === 1)!;
      const two = PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => value.id === ref.id && value.version === 2)!;
      expect([two.operands, two.signs, two.grounding, two.exactness, two.limitations, two.forms]).toEqual([one.operands, one.signs, one.grounding, one.exactness, one.limitations, one.forms]);
      expect(JSON.stringify(two.derivation)).toBe(JSON.stringify(one.derivation).replaceAll("run.record.move", "run.record.edge"));
    }
    const edge = PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => value.id === "run.record.edge")!;
    expect(edge).toMatchObject({ version: 1, role: "source_record", grounding: "recorded_run", exactness: "exact", answerContent: ["fact", "move"], forms: ["list", "panel", "machine_condition"], disposition: { kind: "inspector_only" } });
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === "run.record.edge")).toBe(false);
  });

  it("[criterion 4] leaves no production or governance import of the unversioned inventory", () => {
    const root = new URL("../../../", import.meta.url);
    const sources = (dir: URL): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.name === "node_modules" || entry.name === "dist") return [];
      const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
      if (entry.isDirectory()) return sources(child);
      return /\.(ts|mjs|svelte)$/u.test(entry.name) && !/\.test\.ts$/u.test(entry.name) ? [child.pathname] : [];
    });
    const roots = [new URL("apps/", root), new URL("packages/", root)];
    const governance = readdirSync(new URL("tools/", root)).filter((name) => name.endsWith(".mjs")).map((name) => new URL(`tools/${name}`, root).pathname);
    const offenders = [...roots.flatMap(sources), ...governance].filter((path) => readFileSync(path, "utf8").includes("SEMANTIC_EVENT_PROJECTION_IDS"));
    expect(offenders).toEqual([]);
  });

  it("[criteria 5, 8] writes exactly one receipt per edge start and evaluator row with exact work counts", () => {
    const run = recordedRun("receipts", INITIAL, ["e2e4", "d7d5", "e4d5", "d8d5", "b1c3", "d5a5", "d2d4", "c7c6"]);
    const execution = recordedSemanticPathExecution(run, run.activeCursor.branchId);
    const result = available(execution.result);
    const plies = result.pathNodeIds.length - 1;
    const rows = recordedPathEvaluatorRows();
    expect(result.windows).toHaveLength(plies * 13);
    for (let start = 0; start < plies; start += 1) {
      const startNodeId = result.pathNodeIds[start]!;
      const receipts = result.windows.filter((window) => window.startNodeId === startNodeId);
      expect(receipts.map((window) => `${exact(window.projection)}#${window.horizon}`)).toEqual(rows.map((row) => `${exact(row.projection)}#${row.horizon}`));
      for (const receipt of receipts) {
        if (start + receipt.horizon > plies) expect(receipt).toMatchObject({ status: "insufficient_continuation", endNodeId: null, eventIds: [] });
        else {
          expect(receipt.endNodeId).toBe(result.pathNodeIds[start + receipt.horizon]);
          expect(receipt.status).toBe(receipt.eventIds.length === 0 ? "no_witness" : "emitted");
        }
      }
    }
    expect(result.events.some((event) => exact(event.projection) === v2("derived.exchange.trade_completed"))).toBe(true);
    expect(execution.work).toMatchObject({ preparedEdges: plies, transitionCompiles: plies, checkProbes: plies, localFanOut: 0, receipts: plies * 13 });
    expect(execution.work.defenderDutyReads).toBeLessThanOrEqual(execution.work.distinctWindowStartFens);
    // A compiler returning only positive events fails receipt coverage.
    const positiveOnly = result.windows.filter((window) => window.status === "emitted");
    expect(positiveOnly.length).toBeLessThan(plies * 13);
  });

  it("[criterion 6] emits every v2 projection from its canonical positive and no_witness on hard negatives", () => {
    const emitted = new Set<string>();
    for (const fixture of [...POSITIVES, { projection: "derived.tactic.attraction_observed", ...ATTRACTION_FIVE }, { projection: "derived.tactic.deflection_observed", ...DEFLECTION_CHECK }]) {
      const result = compileMain(recordedRun(`positive:${fixture.projection}`, fixture.fen, fixture.moves));
      const matching = result.events.filter((event) => exact(event.projection) === v2(fixture.projection));
      expect(matching.length, `semantic-event:${v2(fixture.projection)}:positive`).toBeGreaterThan(0);
      expect(result.windows.filter((window) => exact(window.projection) === v2(fixture.projection) && window.status === "emitted").length).toBeGreaterThan(0);
      for (const event of result.events) emitted.add(exact(event.projection));
      expect(result.events.every((event) => event.projection.version === 2)).toBe(true);
    }
    expect([...emitted].sort()).toEqual(SEMANTIC_EVENT_PROJECTION_REFS.filter((value) => value.version === 2).map(exact).sort());
    const five = compileMain(recordedRun("attraction-five", ATTRACTION_FIVE.fen, ATTRACTION_FIVE.moves));
    expect(five.windows.find((window) => exact(window.projection) === v2("derived.tactic.attraction_observed") && window.horizon === 5)?.status).toBe("emitted");
    expect(five.windows.find((window) => exact(window.projection) === v2("derived.tactic.attraction_observed") && window.horizon === 3 && window.startNodeId === five.pathNodeIds[0])?.status).toBe("no_witness");
    for (const fixture of HARD_NEGATIVES) {
      const result = compileMain(recordedRun(`negative:${fixture.projection}`, fixture.fen, fixture.moves));
      const receipts = result.windows.filter((window) => exact(window.projection) === v2(fixture.projection));
      expect(result.events.filter((event) => exact(event.projection) === v2(fixture.projection)), `semantic-event:${v2(fixture.projection)}:hard-negative`).toEqual([]);
      expect(receipts.some((window) => window.status === "no_witness")).toBe(true);
      expect(receipts.every((window) => window.status !== "emitted")).toBe(true);
    }
    // A broken boundary refuses rather than becoming no_witness.
    const run = recordedRun("broken", POSITIVES[4].fen, POSITIVES[4].moves);
    const leaf = branchPath(run, run.activeCursor.branchId).at(-1)!;
    expect(recordedSemanticPath(replaceNode(run, leaf.id, (node) => ({ ...node, fen: INITIAL })), run.activeCursor.branchId)).toMatchObject({ kind: "refused", reason: "broken_fen_boundary" });
  });

  it("[criterion 7] seals every event over exact edge receipts matching its anchors value-for-value", () => {
    for (const fixture of POSITIVES) {
      const run = recordedRun(`sealed:${fixture.projection}`, fixture.fen, fixture.moves);
      const result = compileMain(run);
      for (const event of result.events) {
        expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event)).not.toThrow();
        const edges = event.derivationInputs.filter((input) => exact(input.projection) === "run.record.edge@1").map((input) => input.payload as RecordedEdge);
        expect(edges.length).toBeGreaterThanOrEqual(2);
        expect(event.derivationInputs.some((input) => input.projection.id === "run.record.move")).toBe(false);
        const last = edges.at(-1)!;
        expect(event.anchor).toMatchObject({ beforeFen: last.beforeFen, moveUci: last.moveUci, afterFen: last.afterFen, runId: run.id, branchId: last.edgeBranchId, nodeId: last.afterNodeId });
        for (let index = 1; index < edges.length; index += 1) expect(edges[index]!.beforeNodeId).toBe(edges[index - 1]!.afterNodeId);
        const path = result.pathNodeIds;
        expect(edges.every((edge) => edge.runId === run.id && path.includes(edge.beforeNodeId) && path.includes(edge.afterNodeId))).toBe(true);
      }
    }
  });

  it("[criterion 7] refuses crossed, forged, reordered, short, cross-run and PV-as-recorded edge sources", () => {
    const fixture = POSITIVES[4];
    const run = recordedRun("crossing", fixture.fen, fixture.moves);
    const path = branchPath(run, run.activeCursor.branchId);
    const edges = path.slice(1).map((node, index) => declareRecordedEdgeEvidence(run, path[index]!, node));
    const anchors = edges.map((edge) => ({ beforeNodeId: edge.payload.beforeNodeId, afterNodeId: edge.payload.afterNodeId, beforeFen: edge.payload.beforeFen, moveUci: edge.payload.moveUci, afterFen: edge.payload.afterFen }));
    const operands = deflectionObservedOperands(anchors)[0]!;
    const duty = declareDefenderDutyEvidence(anchors[0]!.beforeFen);
    const captures = anchors.flatMap((anchor) => transitionSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen).filter((event) => event.operands.family === "capture").map((event) => event.evidence));
    const exchange = declareLegalExchangeEvidence(operands.targetCapture);
    const seal = (values: readonly DeclaredEvidence<unknown>[]) => recordedDeflectionObservedSemanticEvent(operands, values, duty, captures, exchange);
    expect(seal(edges).projection).toEqual({ id: "derived.tactic.deflection_observed", version: 2 });
    expect(() => seal([edges[1]!, edges[0]!, edges[2]!])).toThrow(/crossed/u);
    expect(() => seal(edges.slice(0, 2))).toThrow(/requires 3/u);
    expect(() => seal([...edges, edges[2]!])).toThrow(/requires 3/u);
    const forged = declareEvidence({ id: "run.record", version: 1 }, { id: "run.record.edge", version: 1 }, { ...edges[0]!.payload });
    expect(() => seal([forged, edges[1]!, edges[2]!])).toThrow(/minted from an actual run edge/u);
    const pv = declareEvidence({ id: "live.stockfish", version: 1 }, { id: "live.stockfish.pv", version: 1 }, { kind: "bestline", source: "engine_validated", values: { pv: fixture.moves } });
    expect(() => seal([pv, edges[1]!, edges[2]!])).toThrow(/run.record.edge@1/u);
    const identityOnly = identitySealedEvidenceWithoutValueReceipt({ id: "run.record", version: 1 }, { id: "run.record.edge", version: 1 }, { ...edges[0]!.payload });
    expect(() => seal([identityOnly, edges[1]!, edges[2]!])).toThrow(/value-authority receipt/u);
    const twin = recordedRun("crossing-twin", fixture.fen, fixture.moves);
    const twinPath = branchPath(twin, twin.activeCursor.branchId);
    const twinEdge = declareRecordedEdgeEvidence(twin, twinPath[1]!, twinPath[2]!);
    expect(twinEdge.payload.runId).toBe("crossing-twin");
    expect(() => seal([edges[0]!, twinEdge, edges[2]!])).toThrow(/different runs/u);
    // v1 constructors stay byte-unchanged: they refuse the exact edge source and keep their own inputs.
    const trade = recordedRun("trade", POSITIVES[0].fen, POSITIVES[0].moves);
    const tradePath = branchPath(trade, trade.activeCursor.branchId);
    const tradeEdges = tradePath.slice(1).map((node, index) => declareRecordedEdgeEvidence(trade, tradePath[index]!, node));
    const capture = (edge: DeclaredEvidence<RecordedEdge>) => transitionSemanticEvents(edge.payload.beforeFen, edge.payload.moveUci, edge.payload.afterFen).find((event) => event.operands.family === "capture") as SemanticEvidenceEvent<TransitionSemanticEventOperands>;
    expect(() => tradeCompletedSemanticEvent(capture(tradeEdges[0]!), capture(tradeEdges[1]!), tradeEdges[0]!, tradeEdges[1]!)).toThrow(/run.record.move/u);
    expect(recordedTradeCompletedSemanticEvent(capture(tradeEdges[0]!), capture(tradeEdges[1]!), tradeEdges[0]!, tradeEdges[1]!)?.projection).toEqual({ id: "derived.exchange.trade_completed", version: 2 });
    expect(() => recordedTradeCompletedSemanticEvent(capture(tradeEdges[0]!), capture(tradeEdges[1]!), tradeEdges[1]!, tradeEdges[0]!)).toThrow(/crossed/u);
    const square = recordedRun("square", POSITIVES[7].fen, POSITIVES[7].moves);
    const squarePath = branchPath(square, square.activeCursor.branchId);
    const squareEdges = squarePath.slice(1).map((node, index) => declareRecordedEdgeEvidence(square, squarePath[index]!, node));
    const squareOperands = squareClearanceObservedOperands(squareEdges.map((edge) => ({ beforeNodeId: edge.payload.beforeNodeId, afterNodeId: edge.payload.afterNodeId, beforeFen: edge.payload.beforeFen, moveUci: edge.payload.moveUci, afterFen: edge.payload.afterFen })))[0]!;
    expect(() => recordedSquareClearanceSemanticEvent(squareOperands, edges)).toThrow(/crossed/u);
  });

  it("[criterion 9] orders events and receipts byte-stably and never collapses different projections", () => {
    const run = recordedRun("ordering", POSITIVES[4].fen, POSITIVES[4].moves);
    const first = compileMain(run), second = compileMain(run);
    expect(JSON.stringify({ ids: first.events.map((event) => event.id), windows: first.windows, digest: first.digest }))
      .toBe(JSON.stringify({ ids: second.events.map((event) => event.id), windows: second.windows, digest: second.digest }));
    const projections = first.events.map((event) => exact(event.projection));
    expect(projections).toContain(v2("derived.tactic.deflection_observed"));
    expect(projections).toContain(v2("derived.tactic.overload_exploitation_observed"));
    expect(new Set(first.events.map((event) => event.id)).size).toBe(first.events.length);
    const referenced = new Set(first.windows.flatMap((window) => window.eventIds));
    expect(referenced).toEqual(new Set(first.events.map((event) => event.id)));
    const long = compileMain(recordedRun("ordering-long", "4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", ["e2e4", "e8f7", "e4d5", "f7g6", "e1e2"]));
    for (const result of [first, long]) {
      const plyOf = new Map(result.pathNodeIds.map((id, index) => [id, index]));
      const span = new Map<string, readonly [number, number]>();
      for (const window of result.windows) for (const id of window.eventIds) if (!span.has(id)) span.set(id, [plyOf.get(window.endNodeId!)!, plyOf.get(window.startNodeId)!]);
      const sortKey = (event: SemanticEvidenceEvent) => [...span.get(event.id)!, exact(event.projection), event.id] as const;
      const expected = [...result.events].sort((left, right) => {
        const [le, ls, lp, li] = sortKey(left), [re, rs, rp, ri] = sortKey(right);
        return le - re || ls - rs || lp.localeCompare(rp) || li.localeCompare(ri);
      });
      expect(result.events.map((event) => event.id)).toEqual(expected.map((event) => event.id));
      expect(result.events.map((event) => plyOf.get(event.anchor.nodeId!))).toEqual(expected.map((event) => span.get(event.id)![0]));
    }
    expect(new Set(long.events.map((event) => long.pathNodeIds.indexOf(event.anchor.nodeId!))).size).toBeGreaterThan(1);
  });

  it("[criterion 10] compiles ancestral fork paths and shares byte-equal receipts for common ancestry", () => {
    const { run, main, alternative } = forkedRun();
    const left = available(recordedSemanticPath(run, main)), right = available(recordedSemanticPath(run, alternative));
    expect(left.pathNodeIds.slice(0, 3)).toEqual(right.pathNodeIds.slice(0, 3));
    expect(right.branchOrigin).toBe("played");
    const common = (result: typeof left) => result.windows.filter((window) => window.endNodeId !== null && result.pathNodeIds.indexOf(window.endNodeId) <= 2);
    expect(JSON.stringify(common(right))).toBe(JSON.stringify(common(left)));
    expect(left.events.some((event) => event.projection.id === "derived.tactic.deflection_observed")).toBe(true);
    expect(right.events.some((event) => event.projection.id === "derived.tactic.deflection_observed")).toBe(false);
    expect(left.digest).not.toBe(right.digest);
  });

  it("[criterion 14] accepts no hypothetical path source", () => {
    expect(() => recordedSemanticPath(null as unknown as DrillRun, "main")).toThrow(/only a recorded DrillRun/u);
    expect(() => recordedSemanticPath({ kind: "bestline", values: { pv: ["e2e4"] } } as unknown as DrillRun, "main")).toThrow(/only a recorded DrillRun/u);
    const pv = PRIMARY_EVIDENCE_MANIFEST.projections.find((value) => value.id === "live.stockfish.pv")!;
    expect(pv.grounding).toBe("bounded_search");
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.filter((value) => value.version === 2).every((value) => !(JSON.stringify(value.derivation) ?? "").includes("live.stockfish"))).toBe(true);
  });

  it("[criterion 15] moves result identity with every exact edge, value and convention receipt", () => {
    const run = recordedRun("identity", POSITIVES[4].fen, POSITIVES[4].moves);
    const result = compileMain(run);
    expect(result.conventionReceipt).toMatchObject({ status: "predecessor_unlanded", predecessor: "rfc/semantic-convention-provenance.md" });
    expect(result.conventionReceipt.registryDigest).toMatch(/^[0-9a-f]{64}$/u);
    const material: RecordedPathIdentityMaterial = {
      operation: "recorded-semantic-path@1", manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, semanticConventionRegistryDigest: result.conventionReceipt.registryDigest,
      sourceClosureDigest: "0".repeat(64), runId: run.id, branchId: result.branchId, branchOrigin: result.branchOrigin, pathNodeIds: result.pathNodeIds,
      eventIds: result.events.map((event) => event.id), windows: result.windows,
    };
    const base = recordedSemanticPathIdentity(material);
    const variants: Partial<RecordedPathIdentityMaterial>[] = [
      { manifestDigest: "1".repeat(64) }, { semanticConventionRegistryDigest: "2".repeat(64) }, { sourceClosureDigest: "3".repeat(64) },
      { runId: "other" }, { branchId: "other" }, { branchOrigin: "simulated" }, { pathNodeIds: [...result.pathNodeIds].reverse() },
      { eventIds: result.events.map((event) => event.id).slice(1) }, { windows: result.windows.slice(1) },
    ];
    for (const variant of variants) expect(recordedSemanticPathIdentity({ ...material, ...variant })).not.toBe(base);
    // Same move bytes under another run identity change every exact edge receipt and the digest.
    expect(compileMain(recordedRun("identity-other", POSITIVES[4].fen, POSITIVES[4].moves)).digest).not.toBe(result.digest);
    // Projection-set-only substitution fails: equal projection sets over different values differ.
    const checkArm = compileMain(recordedRun("identity", DEFLECTION_CHECK.fen, DEFLECTION_CHECK.moves));
    const set = (value: typeof result) => [...new Set(value.events.map((event) => exact(event.projection)))].filter((key) => key.includes("deflection"));
    expect(set(checkArm)).toEqual(set(result));
    expect(checkArm.digest).not.toBe(result.digest);
  });

  it("[criterion 17] matches the eager local fan-out oracle byte-for-byte with deterministic source counts", () => {
    const fixtures = [...POSITIVES, ...HARD_NEGATIVES, { projection: "attraction-five", ...ATTRACTION_FIVE }, { projection: "deflection-check", ...DEFLECTION_CHECK }];
    for (const [index, fixture] of fixtures.entries()) {
      const run = recordedRun(`parity:${index}`, fixture.fen, fixture.moves);
      const exactExecution = recordedSemanticPathExecution(run, run.activeCursor.branchId);
      const eager = recordedSemanticPathExecution(run, run.activeCursor.branchId, { preparation: "eager" });
      const left = available(exactExecution.result), right = available(eager.result);
      expect(left.events.map((event) => event.id)).toEqual(right.events.map((event) => event.id));
      expect(JSON.stringify(left.windows)).toBe(JSON.stringify(right.windows));
      expect(left.digest).toBe(right.digest);
      const plies = fixture.moves.length;
      expect(exactExecution.work).toMatchObject({ preparedEdges: plies, transitionCompiles: plies, checkProbes: plies, localFanOut: 0, receipts: plies * 13 });
      expect(eager.work).toMatchObject({ transitionCompiles: 0, checkProbes: 0, localFanOut: plies });
    }
  });
});
