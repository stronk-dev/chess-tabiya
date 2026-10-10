// Disposable D3629 author model for semantic-validation-authority §4.3a.
// It invokes current production emitters but cannot change the runner, canonical cases,
// source/proposition authority or learner eligibility. Delete/replace after accepted migration.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { branchPath } from "../../packages/runtime/src/branch-path.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { makeUci, parseUci } from "chessops/util";
import { normalizeMove } from "chessops/chess";
import { evidenceDigest, type VersionedEvidenceId } from "../../packages/runtime/src/evidence-contract.js";
import { recordedPathEvaluatorRows, recordedSemanticPath, type RecordedSemanticPathResult } from "../../packages/runtime/src/recorded-semantic-path.js";
import { commitMove, createRun } from "../../packages/runtime/src/runtime.js";
import { RECORDED_SEQUENCE_PROJECTIONS, SEMANTIC_VALIDATION_OPERATIONS, type SemanticValidationObservation, type SemanticValidationOperationResult } from "../../packages/runtime/src/semantic-validation-operations.js";
import { assertSemanticReachRetained, assertSemanticTargetValueAuthority } from "../../packages/runtime/src/semantic-validation-runner.js";
import { parseSemanticValidationCase, parseSemanticValidationOperationInput, semanticRecordedPathDigest, SEMANTIC_SEQUENCE_FAMILIES, type SemanticRecordedPathInput, type SemanticRecordedSequenceInput, type SemanticSequenceFamily } from "../../packages/runtime/src/semantic-validation.js";

const refKey = (value: VersionedEvidenceId) => `${value.id}@${value.version}`;
const rows = recordedPathEvaluatorRows();
const productionFamily = (family: SemanticSequenceFamily) => family === "pawn_contact_timing" ? "contact_timing" : family === "checking_zwischenzug" ? "check_zwischenzug" : family;
const validationFamily = (family: typeof rows[number]["family"]): SemanticSequenceFamily => family === "contact_timing" ? "pawn_contact_timing" : family === "check_zwischenzug" ? "checking_zwischenzug" : family;
const fail = (): never => { throw new TypeError("D3629 exact recorded-window reach failed"); };
const observation = (item: Extract<RecordedSemanticPathResult, { kind: "available" }>["events"][number]): SemanticValidationObservation => ({ kind: "event", item });
const completed = (observations: readonly SemanticValidationObservation[]): SemanticValidationOperationResult => ({ kind: "completed", observations, abstentions: [] });
function multiset(observations: readonly SemanticValidationObservation[]): readonly string[] {
  const ids = new Set<string>();
  return observations.map(value => {
    if (value.kind !== "event") return fail();
    if (ids.has(value.item.id)) return fail();
    ids.add(value.item.id);
    return evidenceDigest({ id: value.item.id, sign: value.item.sign, receipt: assertSemanticTargetValueAuthority(value) });
  }).sort();
}
function same(left: unknown, right: unknown): boolean { return evidenceDigest({ value: left }) === evidenceDigest({ value: right }); }

function parentFor(input: SemanticRecordedSequenceInput) {
  // Same deterministic run construction as the current validation-only recordedRun adapter.
  const path = parseSemanticValidationOperationInput("runtime.semantic.recorded_path", input.path);
  const at = "2026-09-24T00:00:00.000Z";
  let run = createRun({ id: `semantic-validation:${path.pathDigest.slice(0, 16)}`, packId: "semantic-validation", packDigest: `sha256:${"0".repeat(64)}`, startFen: path.edges[0]!.beforeFen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const edge of path.edges) run = commitMove(run, edge.moveUci, { at }).run;
  const receipt = recordedSemanticPath(run, run.activeCursor.branchId);
  if (receipt.kind !== "available") throw new Error(receipt.reason);
  return { input: path, run, receipt, output: completed(receipt.events.map(observation)) };
}
type Parent = ReturnType<typeof parentFor>;

/** Proposed join only, deliberately not exported or imported by production. */
function assertWindowReach(input: SemanticRecordedSequenceInput, subject: VersionedEvidenceId, child: SemanticValidationOperationResult, parent: Parent): void {
  const parsed = parseSemanticValidationOperationInput("runtime.semantic.recorded_sequence", input);
  const matchingRows = rows.filter(row => row.family === productionFamily(parsed.family) && row.horizon === parsed.horizon);
  if (matchingRows.length !== 1 || refKey(matchingRows[0]!.projection) !== refKey(subject)) fail();
  if (!same(parent.input, parsed.path) || parent.output.kind !== "completed" || child.kind !== "completed") fail();
  // Existing deterministic adapter grain, not a new persisted identity or collector rerun.
  if (parent.run.id !== `semantic-validation:${parsed.path.pathDigest.slice(0, 16)}`) fail();
  const nodes = branchPath(parent.run, parent.receipt.branchId);
  const branch = parent.run.branches.find(value => value.id === parent.receipt.branchId);
  if (branch === undefined || branch.origin !== parent.receipt.branchOrigin || nodes.length !== parsed.path.edges.length + 1 || !same(nodes.map(node => node.id), parent.receipt.pathNodeIds)) fail();
  for (let index = 0; index < parsed.path.edges.length; index += 1) {
    const edge = parsed.path.edges[index]!, before = nodes[index]!, after = nodes[index + 1]!;
    if (before.fen !== edge.beforeFen || after.moveUci !== edge.moveUci || after.fen !== edge.afterFen) fail();
  }
  if (parent.output.abstentions.length !== 0 || child.abstentions.length !== 0 || !same(multiset(parent.output.observations), multiset(parent.receipt.events.map(observation)))) fail();
  const windows = parent.receipt.windows.filter(window => refKey(window.projection) === refKey(subject) && window.startNodeId === nodes[parsed.fromPly]!.id && window.horizon === parsed.horizon);
  if (windows.length !== 1) fail();
  const window = windows[0]!;
  if (window.status === "insufficient_continuation" || window.endNodeId !== nodes[parsed.fromPly + parsed.horizon]!.id || new Set(window.eventIds).size !== window.eventIds.length) fail();
  if (window.status === "emitted" ? window.eventIds.length === 0 : window.eventIds.length !== 0) fail();
  const selected = window.eventIds.map(id => {
    const matches = parent.output.kind === "completed" ? parent.output.observations.filter(value => value.kind === "event" && value.item.id === id) : [];
    if (matches.length !== 1 || matches[0]!.kind !== "event" || refKey(matches[0]!.item.projection) !== refKey(subject)) return fail();
    return matches[0]!;
  });
  if (!same(multiset(child.observations), multiset(selected))) fail();
}

const canonical = (JSON.parse(readFileSync(resolve("packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);
const sequenceIds = ["harassment", "defender-consequence", "deflection", "attraction", "ray-clearance", "square-clearance", "interference", "overload", "zwischenzug"];
function canonicalFixture(name: string, arm: "positive" | "negative") {
  const value = canonical.find(value => value.id === `migration.${name}.${arm}`)!;
  if (value === undefined || value.input.kind !== "recorded_path") throw new Error(`Missing canonical ${name}/${arm}`);
  const fromPly = name === "harassment" ? 6 : 0;
  const horizon = (value.input.edges.length - fromPly) as 2 | 3 | 4 | 5;
  const row = rows.find(row => refKey(row.projection) === refKey(value.subject.projection) && row.horizon === horizon)!;
  return { input: { kind: "recorded_sequence", path: value.input, family: validationFamily(row.family), fromPly, horizon } satisfies SemanticRecordedSequenceInput, subject: value.subject.projection };
}
function pathFor(fen: string, moves: readonly string[]): SemanticRecordedPathInput {
  const edges = moves.map(uci => {
    const beforeFen = fen, position = positionFromFen(fen), move = normalizeMove(position, parseUci(uci)!);
    if (!position.isLegal(move)) throw new Error(`Illegal research fixture ${uci}`);
    const moveUci = makeUci(move); position.play(move); fen = canonicalFen(position);
    return { kind: "edge" as const, beforeFen, moveUci, afterFen: fen };
  });
  return { kind: "recorded_path", pathReceipt: { id: "run.record.edge", version: 1 }, edges, pathDigest: semanticRecordedPathDigest(edges) };
}
function childFor(input: SemanticRecordedSequenceInput) { return SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.recorded_sequence"].invoke(input) as SemanticValidationOperationResult; }
const fixture = () => {
  const value = canonicalFixture("deflection", "positive");
  return { ...value, parent: parentFor(value.input), child: childFor(value.input) };
};

describe("D3629 disposable exact recorded-window author model", () => {
  it("reproduces the wrapper mismatch while retaining the complete nonzero-prefix parent", () => {
    const { input, subject } = canonicalFixture("harassment", "positive"), parent = parentFor(input), child = childFor(input);
    expect(() => SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.recorded_path"].invoke(input as never)).toThrow();
    expect(SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.recorded_path"].invoke(input.path)).toEqual(parent.output);
    expect(parent.receipt.pathNodeIds).toHaveLength(9);
    expect(() => assertWindowReach(input, subject, child, parent)).not.toThrow();
  });
  it("rejects the unwrapped whole-path comparison when other families really emit", () => {
    const { child, parent } = fixture();
    expect(() => assertSemanticReachRetained(child, parent.output, RECORDED_SEQUENCE_PROJECTIONS, "unwrapped sequence")).toThrow(/SEMANTIC_VALIDATION_REACH_INVALID/u);
  });
  it("distinguishes different starts of the same family and horizon on the same parent", () => {
    const { input, subject } = canonicalFixture("harassment", "positive");
    const earlier = { ...input, fromPly: 5 }, parent = parentFor(input);
    const earlierChild = childFor(earlier), laterChild = childFor(input);
    expect(earlierChild).toMatchObject({ kind: "completed", observations: [] });
    expect(() => assertWindowReach(earlier, subject, earlierChild, parent)).not.toThrow();
    expect(() => assertWindowReach(earlier, subject, laterChild, parent)).toThrow();
  });
  describe.each(sequenceIds)("existing %s authorities", name => {
    it.each(["positive", "negative"] as const)("retains the complete parent and exact %s window", arm => {
      const { input, subject } = canonicalFixture(name, arm), parent = parentFor(input), child = childFor(input);
      expect(() => assertWindowReach(input, subject, child, parent)).not.toThrow();
      expect(child.kind).toBe("completed");
      if (child.kind !== "completed") throw new Error("Incomplete fixture");
      if (arm === "positive") expect(child.observations.length).toBeGreaterThan(0);
      else expect(child.observations).toHaveLength(0);
      if (parent.output.kind !== "completed") throw new Error("Incomplete parent");
      expect(parent.output.observations).toHaveLength(parent.receipt.events.length);
    });
  });
  it.each(rows)("joins the actual $family/$horizon table row without a copied projection table", row => {
    const family = validationFamily(row.family);
    const path = pathFor("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]);
    const input: SemanticRecordedSequenceInput = { kind: "recorded_sequence", path, family, fromPly: 0, horizon: row.horizon };
    expect(() => assertWindowReach(input, row.projection, childFor(input), parentFor(input))).not.toThrow();
  });
  it("maps every closed validation family exactly once, including the two literal aliases", () => {
    expect([...new Set(rows.map(row => validationFamily(row.family)))].sort()).toEqual([...SEMANTIC_SEQUENCE_FAMILIES].sort());
  });
  it("D3671 rejects a co-edited duplicate unrelated parent event", () => {
    const { input, subject, child, parent } = fixture();
    if (parent.output.kind !== "completed") throw new Error("Incomplete parent");
    const extra = parent.receipt.events.find(event => refKey(event.projection) !== refKey(subject))!;
    expect(extra).toBeDefined();
    const crossed = { ...parent, receipt: { ...parent.receipt, events: [...parent.receipt.events, extra] },
      output: completed([...parent.output.observations, observation(extra)]) };
    expect(() => assertWindowReach(input, subject, child, crossed)).toThrow();
  });
  it("D3671 rejects a parent whose constructed run identity was crossed", () => {
    const { input, subject, child, parent } = fixture();
    const crossed = { ...parent, run: { ...parent.run, id: "another-recorded-run" } };
    expect(() => assertWindowReach(input, subject, child, crossed)).toThrow();
  });
  it("keeps a no-witness three-ply window valid beside an emitted five-ply window of the SAME family", () => {
    // Retained from recorded-semantic-path.test.ts ATTRACTION_FIVE, not new chess authority.
    const path = pathFor("3r3k/8/8/8/8/2N5/2P5/6K1 w - - 0 1", ["c3d5", "d8d5", "c2c4", "h8g8", "c4d5"]);
    const input: SemanticRecordedSequenceInput = { kind: "recorded_sequence", path, family: "attraction", fromPly: 0, horizon: 3 };
    const parent = parentFor(input), child = childFor(input), subject = { id: "derived.tactic.attraction_observed", version: 2 };
    const other = parent.receipt.windows.find(window => refKey(window.projection) === refKey(subject) && window.horizon === 5 && window.status === "emitted")!;
    expect(other.eventIds.length).toBeGreaterThan(0);
    expect(child).toMatchObject({ kind: "completed", observations: [] });
    expect(() => assertWindowReach(input, subject, child, parent)).not.toThrow();
    const foreign = parent.receipt.events.filter(event => other.eventIds.includes(event.id)).map(observation);
    expect(() => assertWindowReach(input, subject, completed(foreign), parent)).toThrow();
    expect(() => assertSemanticReachRetained(child, parent.output, [subject], "family-only selection")).toThrow();
  });
  it.each(["subject", "version", "family", "horizon", "start", "parent_input", "parent_nodes", "branch", "origin"] as const)("refuses crossed %s identity", fault => {
    const { input, subject, child, parent } = fixture();
    const alteredInput = fault === "family" ? { ...input, family: "attraction" as const } : fault === "horizon" ? { ...input, horizon: 2 as const } : fault === "start" ? { ...input, fromPly: 1 } : input;
    const alteredSubject = fault === "subject" ? { id: "derived.tactic.attraction_observed", version: 2 } : fault === "version" ? { ...subject, version: 1 } : subject;
    const changedParent = fault === "parent_input" ? parentFor(canonicalFixture("deflection", "negative").input)
      : fault === "parent_nodes" ? { ...parent, receipt: { ...parent.receipt, pathNodeIds: parent.receipt.pathNodeIds.slice(1) } }
      : fault === "branch" ? { ...parent, receipt: { ...parent.receipt, branchId: "another" } }
      : fault === "origin" ? { ...parent, receipt: { ...parent.receipt, branchOrigin: "simulated" as const } } : parent;
    expect(() => assertWindowReach(alteredInput, alteredSubject, child, changedParent)).toThrow();
  });
  it.each(["missing", "duplicate", "end", "incomplete", "empty_emitted", "nonempty_no_witness", "missing_event", "duplicate_event", "foreign_event"] as const)("refuses %s window receipt", fault => {
    const { input, subject, child, parent } = fixture();
    const target = parent.receipt.windows.find(window => refKey(window.projection) === refKey(subject) && window.startNodeId === parent.receipt.pathNodeIds[0] && window.horizon === input.horizon)!;
    const foreign = parent.receipt.events.find(event => refKey(event.projection) !== refKey(subject))!;
    const changed = fault === "end" ? { ...target, endNodeId: parent.receipt.pathNodeIds[1]! }
      : fault === "incomplete" ? { ...target, status: "insufficient_continuation" as const }
      : fault === "empty_emitted" ? { ...target, eventIds: [] }
      : fault === "nonempty_no_witness" ? { ...target, status: "no_witness" as const }
      : fault === "missing_event" ? { ...target, eventIds: ["absent-event"] }
      : fault === "duplicate_event" ? { ...target, eventIds: [...target.eventIds, target.eventIds[0]!] }
      : fault === "foreign_event" ? { ...target, eventIds: [foreign.id] } : target;
    const windows = parent.receipt.windows.flatMap(window => window !== target ? [window] : fault === "missing" ? [] : fault === "duplicate" ? [target, target] : [changed]);
    expect(() => assertWindowReach(input, subject, child, { ...parent, receipt: { ...parent.receipt, windows } })).toThrow();
  });
  it.each(["missing_parent", "duplicate_parent", "unavailable_parent", "missing_child", "duplicate_child", "extra_family", "unavailable_child", "altered_child", "abstained_child"] as const)("refuses %s output rather than filtering it", fault => {
    const { input, subject, child, parent } = fixture();
    if (child.kind !== "completed" || parent.output.kind !== "completed") throw new Error("Incomplete fixture");
    const selected = child.observations[0]!, extra = parent.output.observations.find(value => value.kind === "event" && refKey(value.item.projection) !== refKey(subject))!;
    const altered = selected.kind === "event" ? { ...selected, item: { ...selected.item, sign: "avoided" as const } } : selected;
    const changedChild = fault === "missing_child" ? completed([]) : fault === "duplicate_child" ? completed([...child.observations, selected]) : fault === "extra_family" ? completed([...child.observations, extra])
      : fault === "unavailable_child" ? { kind: "unavailable" as const, reason: "recorded_path_incomplete" as const }
      : fault === "altered_child" ? completed([altered]) : fault === "abstained_child" ? { ...child, abstentions: [{ projection: subject, reason: "source_predicate_unavailable" as const }] } : child;
    const changedParent = fault === "missing_parent" ? { ...parent, output: completed(parent.output.observations.filter(value => value !== parent.output.observations.find(value => value.kind === "event" && selected.kind === "event" && value.item.id === selected.item.id))) }
      : fault === "duplicate_parent" ? { ...parent, output: completed([...parent.output.observations, parent.output.observations[0]!]) }
      : fault === "unavailable_parent" ? { ...parent, output: { kind: "unavailable" as const, reason: "recorded_path_incomplete" as const } } : parent;
    expect(() => assertWindowReach(input, subject, changedChild, changedParent)).toThrow();
  });
});
