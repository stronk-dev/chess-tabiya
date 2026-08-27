// DISPOSABLE product/buildability harness — D1927/D1928/D1932. Not production code.
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import {
  canonicalFen,
  compileEvidenceManifest,
  commitMove,
  createRun,
  rewind,
  type DrillRun,
  type EvidenceContractDeclarations,
  type Node,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

const at = "2026-08-27T00:00:00.000Z";

function positionFromFen(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

type StrictPathCode =
  | "duplicate_branch"
  | "duplicate_node"
  | "missing_fork"
  | "missing_parent"
  | "cycle"
  | "multiple_tips"
  | "fork_unreachable"
  | "root_mismatch"
  | "off_chain_node";

class StrictPathError extends Error {
  constructor(readonly code: StrictPathCode, detail: string) {
    super(detail);
  }
}

function strictPath(run: DrillRun, branchId: string): readonly Node[] {
  const branches = run.branches.filter((value) => value.id === branchId);
  if (branches.length !== 1) throw new StrictPathError("duplicate_branch", branchId);
  const branch = branches[0]!;
  const byId = new Map<string, Node>();
  for (const node of run.nodes) {
    if (byId.has(node.id)) throw new StrictPathError("duplicate_node", node.id);
    byId.set(node.id, node);
  }
  const fork = byId.get(branch.forkNodeId);
  if (fork === undefined) throw new StrictPathError("missing_fork", branch.forkNodeId);

  const own = run.nodes.filter((node) => node.branchId === branchId && node.id !== fork.id);
  for (const candidate of own) {
    const seen = new Set<string>();
    let node: Node | undefined = candidate;
    while (node.id !== fork.id) {
      if (seen.has(node.id)) throw new StrictPathError("cycle", node.id);
      seen.add(node.id);
      if (node.parentId === null) throw new StrictPathError("fork_unreachable", candidate.id);
      const parent: Node | undefined = byId.get(node.parentId);
      if (parent === undefined) throw new StrictPathError("missing_parent", node.parentId);
      node = parent;
    }
  }

  const parents = new Set(own.map((node) => node.parentId));
  const tips = own.filter((node) => !parents.has(node.id));
  if (tips.length > 1) throw new StrictPathError("multiple_tips", branchId);
  const tip = tips[0] ?? fork;

  const reversed: Node[] = [];
  const selected = new Set<string>();
  let cursor: Node | undefined = tip;
  while (cursor !== undefined) {
    if (selected.has(cursor.id)) throw new StrictPathError("cycle", cursor.id);
    selected.add(cursor.id);
    reversed.push(cursor);
    if (cursor.parentId === null) break;
    const parent: Node | undefined = byId.get(cursor.parentId);
    if (parent === undefined) throw new StrictPathError("missing_parent", cursor.parentId);
    cursor = parent;
  }
  if (!selected.has(fork.id)) throw new StrictPathError("fork_unreachable", fork.id);
  const outside = own.find((node) => !selected.has(node.id));
  if (outside !== undefined) throw new StrictPathError("off_chain_node", outside.id);

  const roots = run.nodes.filter((node) => node.parentId === null);
  const startEvents = run.events.filter((event) => event.type === "run.started");
  const declaredRootId = startEvents.length === 1 ? startEvents[0]!.data.rootNode.id : undefined;
  if (roots.length !== 1 || reversed.at(-1)?.id !== roots[0]!.id || roots[0]!.id !== declaredRootId) {
    throw new StrictPathError("root_mismatch", branchId);
  }
  return Object.freeze(reversed.reverse());
}

interface ExactRecordedEdge {
  readonly projectionId: "run.record.edge@1";
  readonly runId: string;
  readonly edgeBranchId: string;
  readonly beforeNodeId: string;
  readonly afterNodeId: string;
  readonly beforeFen: string;
  readonly afterFen: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly ply: number;
}

function exactEdge(run: DrillRun, parent: Node, child: Node): ExactRecordedEdge {
  if (child.parentId !== parent.id || child.moveUci === null || child.moveSan === null) {
    throw new TypeError("Recorded edge is incomplete");
  }
  const position = positionFromFen(parent.fen);
  const move = parseUci(child.moveUci);
  if (move === undefined || !isNormal(move) || !position.isLegal(move)) {
    throw new TypeError("Recorded edge move is not legal");
  }
  const moveSan = makeSan(position, move);
  position.play(move);
  if (canonicalFen(position) !== child.fen || moveSan !== child.moveSan || child.ply !== parent.ply + 1) {
    throw new TypeError("Recorded edge bytes disagree with legal replay");
  }
  return Object.freeze({
    projectionId: "run.record.edge@1",
    runId: run.id,
    edgeBranchId: child.branchId,
    beforeNodeId: parent.id,
    afterNodeId: child.id,
    beforeFen: parent.fen,
    afterFen: child.fen,
    moveUci: child.moveUci,
    moveSan: child.moveSan,
    ply: child.ply,
  });
}

function forkedRun(): DrillRun {
  let run = createRun({
    id: "strict-path-candidate",
    packId: "fixture",
    packDigest: `sha256:${"c".repeat(64)}`,
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 3,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { at }).run;
  const shared = run.activeCursor.nodeId;
  run = commitMove(run, "e7e5", { at }).run;
  run = rewind(run, shared, at).run;
  return commitMove(run, "c7c5", { at }).run;
}

describe("strict path and exact edge candidate", () => {
  it("derives both complete branch paths independently of node array order", () => {
    const run = forkedRun();
    const [main, alternative] = run.branches;
    expect(strictPath(run, main!.id).map((node) => node.moveUci)).toEqual([null, "e2e4", "e7e5"]);
    expect(strictPath(run, alternative!.id).map((node) => node.moveUci)).toEqual([null, "e2e4", "c7c5"]);
    const shuffled = Object.freeze({ ...run, nodes: Object.freeze([...run.nodes].reverse()) });
    expect(strictPath(shuffled, main!.id).map((node) => node.id)).toEqual(strictPath(run, main!.id).map((node) => node.id));
    expect(strictPath(shuffled, alternative!.id).map((node) => node.id)).toEqual(strictPath(run, alternative!.id).map((node) => node.id));
  });

  it("refuses missing parents, cycles, duplicate ids and multiple same-branch tips", () => {
    const run = forkedRun();
    const branchId = run.branches[0]!.id;
    const leaf = strictPath(run, branchId).at(-1)!;
    const parent = strictPath(run, branchId).at(-2)!;
    const mutate = (replacement: Node, extra: readonly Node[] = []): DrillRun => Object.freeze({
      ...run,
      nodes: Object.freeze([...run.nodes.map((node) => node.id === leaf.id ? replacement : node), ...extra]),
    });
    expect(() => strictPath(mutate(Object.freeze({ ...leaf, parentId: "absent" })), branchId)).toThrowError(expect.objectContaining({ code: "missing_parent" }));
    expect(() => strictPath(mutate(Object.freeze({ ...leaf, parentId: leaf.id })), branchId)).toThrowError(expect.objectContaining({ code: "cycle" }));
    expect(() => strictPath(mutate(leaf, [Object.freeze({ ...leaf })]), branchId)).toThrowError(expect.objectContaining({ code: "duplicate_node" }));
    const secondTip = Object.freeze({ ...leaf, id: `${leaf.id}:second`, parentId: parent.id });
    expect(() => strictPath(mutate(leaf, [secondTip]), branchId)).toThrowError(expect.objectContaining({ code: "multiple_tips" }));
  });

  it("gives a shared ancestral edge one identity across descendant path requests", () => {
    const run = forkedRun();
    const [main, alternative] = run.branches;
    const mainPath = strictPath(run, main!.id);
    const alternativePath = strictPath(run, alternative!.id);
    const fromMain = exactEdge(run, mainPath[0]!, mainPath[1]!);
    const fromAlternative = exactEdge(run, alternativePath[0]!, alternativePath[1]!);
    expect(fromAlternative).toEqual(fromMain);
    expect(fromMain.edgeBranchId).toBe(main!.id);
    expect(JSON.stringify({ ...fromMain, requestedBranchId: main!.id }))
      .not.toBe(JSON.stringify({ ...fromAlternative, requestedBranchId: alternative!.id }));
  });

  it("refuses a recorded SAN or resulting FEN that disagrees with legal replay", () => {
    const run = forkedRun();
    const path = strictPath(run, run.branches[0]!.id);
    const parent = path[0]!, child = path[1]!;
    expect(() => exactEdge(run, parent, Object.freeze({ ...child, moveSan: "d4" }))).toThrow(/disagree/u);
    expect(() => exactEdge(run, parent, Object.freeze({ ...child, fen: parent.fen }))).toThrow(/disagree/u);
  });

  it("shows a base-id inventory cannot police coexisting semantic versions", () => {
    const refs = Object.freeze([
      Object.freeze({ id: "derived.tactic.deflection_observed", version: 1 }),
      Object.freeze({ id: "derived.tactic.deflection_observed", version: 2 }),
    ]);
    const exactKeys = new Set(refs.map((value) => `${value.id}@${value.version}`));
    const baseIds = new Set(refs.map((value) => value.id));
    expect(exactKeys.size).toBe(2);
    expect(baseIds.size).toBe(1);
    expect(baseIds).toEqual(new Set(["derived.tactic.deflection_observed"]));
  });

  it("shows the manifest compiler can retain v1 and v2 when its authority uses exact refs", () => {
    const ref = (id: string, version = 1) => Object.freeze({ id, version });
    const source = (id: string, operands: readonly string[]) => Object.freeze({
      id, version: 1, producer: ref("run.record"), role: "source_record" as const,
      plane: "record" as const, payloadType: id, semantics: id, operands,
      signs: ["state"] as const, grounding: "recorded_run" as const, exactness: "exact" as const,
      confidence: "exact" as const, abstention: Object.freeze({ possible: false, reasons: Object.freeze([]) }),
      answerContent: ["fact"] as const, forms: ["machine_condition"] as const,
      dependsOn: Object.freeze([]), limitations: Object.freeze([]),
      disposition: Object.freeze({ kind: "inspector_only" as const, reason: "source fixture" }),
    });
    const event = (version: 1 | 2, input: { readonly id: string; readonly version: number }) => Object.freeze({
      id: "derived.tactic.deflection_observed", version, producer: ref("derived.tactic"),
      role: "event" as const, plane: "derived" as const, payloadType: `DeflectionV${version}`,
      semantics: "same observed relation; exact source version differs", operands: ["anchor"],
      signs: ["state"] as const, grounding: "recorded_run" as const, exactness: "exact" as const,
      confidence: "exact" as const, abstention: Object.freeze({ possible: false, reasons: Object.freeze([]) }),
      answerContent: ["fact"] as const, forms: ["machine_condition"] as const,
      dependsOn: [input], derivation: Object.freeze({ inputs: [input] }), limitations: Object.freeze([]),
    });
    const move = ref("run.record.move"), edge = ref("run.record.edge");
    const v1 = ref("derived.tactic.deflection_observed"), v2 = ref("derived.tactic.deflection_observed", 2);
    const consumer = ref("fixture.consumer");
    const declarations: EvidenceContractDeclarations = Object.freeze({
      producers: Object.freeze([
        Object.freeze({ id: "run.record", version: 1, plane: "record", implementation: "fixture", availability: "recorded", latency: "sync", outputs: Object.freeze([source(move.id, ["context"]), source(edge.id, ["runId", "beforeNodeId", "afterNodeId"])]) }),
        Object.freeze({ id: "derived.tactic", version: 1, plane: "derived", implementation: "fixture", availability: "local", latency: "sync", outputs: Object.freeze([event(1, move), event(2, edge)]) }),
      ]),
      consumers: Object.freeze([Object.freeze({ id: consumer.id, version: 1, implementation: "fixture", accepts: Object.freeze([v1, v2]), timing: ["analysis"], roles: ["operator"], sessions: ["imported"], forms: ["machine_condition"], answerContent: ["fact"], latency: Object.freeze({ mode: "sync", maxMs: 4_000 }), budget: Object.freeze({ maxFacts: 2, maxForms: 1 }), providerOff: "available" })]),
      adapters: Object.freeze([v1, v2].map((projection, index) => Object.freeze({ id: `fixture.adapter.${index + 1}`, version: 1, implementation: "fixture", producer: ref("derived.tactic"), projection, consumer, timing: ["analysis"], roles: ["operator"], sessions: ["imported"], forms: ["machine_condition"], answerContent: ["fact"], latency: Object.freeze({ mode: "sync", maxMs: 4_000 }), budget: Object.freeze({ maxFacts: 2, maxForms: 1 }), providerOff: "available" }))),
      semanticEvents: Object.freeze([[v1, move], [v2, edge]].map(([projection, input]) => Object.freeze({ projection, derivationInputs: [input], allowedSigns: ["state"], requiredOperands: ["anchor"], valence: "none", validation: Object.freeze({ positives: ["fixture-positive"], hardNegatives: ["fixture-negative"] }) }))),
    });
    const manifest = compileEvidenceManifest(declarations);
    expect(manifest.semanticEvents.map((value) => `${value.projection.id}@${value.projection.version}`)).toEqual([
      "derived.tactic.deflection_observed@1",
      "derived.tactic.deflection_observed@2",
    ]);
  });
});
