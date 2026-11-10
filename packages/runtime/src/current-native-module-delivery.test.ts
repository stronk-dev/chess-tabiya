// Accepted subject-safe §6 / D4185: real original source populations and the unmodified
// ordinary module image. A binding alone does not establish selectable learner delivery.
// This is the runtime reachability cut; cookie REST, strict receivers and DOM remain separate.
import { expect, it } from "vitest";
import { CURRENT_NATIVE_MODULE_CASES } from "./testing/current-native-module-fixtures.js";
import { compileModulePacket } from "./module-packets.js";
import { postcommitEdgeEvidence } from "./postcommit-nudge.js";
import { localSemanticEventClosure } from "./semantic-evidence.js";
import { recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { declareEvidence, evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { MODULE_REGISTRY } from "./module-registry.js";
import { admitModuleFacts, moduleFact, orderAdmittedFacts, type ModuleFact } from "./module-reducers.js";
import { orderModuleFactsByBaseKeys } from "./internal/module-fact-comparison.js";
import { readFoundationEventInvocation } from "./internal/evidence-value-routes.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { recordedSequenceRouteFixture } from "./testing/recorded-sequence-window-fixture.js";
import { reviewFixtureRun } from "./testing/review-map-fixture.js";
import { recordedReviewGradeSources } from "./testing/recorded-grade-fixture.js";
import { branchPath } from "./branch-path.js";
import { recordedSemanticWindowSource } from "./recorded-semantic-window.js";

const cases = CURRENT_NATIVE_MODULE_CASES;
const key = (value: { readonly projection: { readonly id: string; readonly version: number } }) => `${value.projection.id}@${value.projection.version}`;

for (const [projection, fen, move] of cases) for (const black of [false, true]) {
  for (const module of ["postcommit_nudge", "review_map"] as const) {
    it(`${module} can select original ${projection} within its current budget, mirrored=${black}`, () => {
      const run = recordedSequenceWindowFixture({ fen, moves: [move] }, black, `current-module-${module}-${projection}-${black}`);
      const [before, after] = run.nodes;
      if (before === undefined || after === undefined || after.moveUci === null) throw new Error("Expected the actual committed source edge");
      const evidence = module === "postcommit_nudge" ? postcommitEdgeEvidence(run, before, after)
        : localSemanticEventClosure(before.fen, after.moveUci, after.fen).events.map(event => event.evidence);
      const originals = evidence.filter(value => key(value) === projection);
      expect(originals.length, "A complete positive original source must exist before testing delivery").toBeGreaterThan(0);
      const packet = compileModulePacket({ module, timing: module === "postcommit_nudge" ? "post_commit" : "review",
        role: "learner", session: "position", evidence, ...(module === "review_map" ? { mode: "admit" } as const : {}) });
      expect(packet.kind).toBe("packet"); if (packet.kind !== "packet") throw new Error("The real current consumer refused");
      const selected = packet.facts.map(fact => key(fact.evidence));
      expect(selected, `Actual selected original sources: ${selected.join(", ")}`).toContain(projection);
      for (const fact of packet.facts.filter(fact => key(fact.evidence) === projection)) expect(originals.some(value => value === fact.evidence)).toBe(true);
      if (module === "postcommit_nudge") expect(packet.facts.length).toBeLessThanOrEqual(2);
    });
  }
}

const nudge = MODULE_REGISTRY.byId.get("postcommit_nudge")!;
const ACCESS = "derived.activity.event.file_access_revealed@1", ISLANDS = "rules.structural.event.pawn_islands@2";
const STATE = "derived.activity.event.file_state@1", GROUP = "derived.structural.event.pawn_file_group@1";
function sourceFacts(fen = cases[5][1] as string, move = "b3d4", black = false) {
  const run = recordedSequenceWindowFixture({ fen, moves: [move] }, black);
  const before = run.nodes[0]!, after = run.nodes[1]!;
  const evidence = postcommitEdgeEvidence(run, before, after);
  return admitModuleFacts(nudge, PRIMARY_EVIDENCE_MANIFEST,
    evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge.consumer!, evidence), "post_commit");
}
function one(facts: readonly ModuleFact[], projection: string) {
  const result = facts.find(fact => key(fact.evidence) === projection);
  expect(result, `Actual original ${projection}`).toBeDefined(); return result!;
}

it.each([false, true])("keeps all original facts and nonmember positions while the two real summaries reach cap2, mirrored=%s", black => {
  const facts = sourceFacts(undefined, undefined, black), base = orderModuleFactsByBaseKeys(nudge, facts);
  const result = orderAdmittedFacts(nudge, facts);
  expect(base.slice(0, 2).map(fact => key(fact.evidence))).toEqual([GROUP, STATE]);
  expect(result.slice(0, 2).map(fact => key(fact.evidence))).toEqual([ACCESS, ISLANDS]);
  expect(result).toHaveLength(facts.length); expect(new Set(result)).toEqual(new Set(facts));
  expect(one(result, ISLANDS).projection.exactness).toBe("convention");
  base.forEach((fact, index) => { if (![GROUP, STATE, ACCESS, ISLANDS].includes(key(fact.evidence))) expect(result[index]).toBe(fact); });
  const access = one(facts, ACCESS), state = one(facts, STATE);
  expect(readFoundationEventInvocation(access.evidence).inputs[0]).toBe(state.evidence);
  expect((access.evidence.payload as { fileChange: unknown }).fileChange).toBe(state.evidence.payload);
});

it.each([STATE, GROUP])("missing required %s leaves both summaries at their old positions without recovering sources", missing => {
  const facts = sourceFacts().filter(fact => key(fact.evidence) !== missing);
  expect(orderAdmittedFacts(nudge, facts)).toEqual(orderModuleFactsByBaseKeys(nudge, facts));
});

it("never borrows an equal-byte state from another genuine factory invocation", () => {
  const a = sourceFacts(), b = sourceFacts();
  const original = one(a, STATE), other = one(b, STATE);
  expect(other.evidence.payload).toEqual(original.evidence.payload); expect(other.evidence).not.toBe(original.evidence);
  const facts = a.filter(fact => key(fact.evidence) !== ISLANDS).map(fact => fact === original ? other : fact);
  expect(orderAdmittedFacts(nudge, facts)).toEqual(orderModuleFactsByBaseKeys(nudge, facts));
});

it("never joins genuine parents from another original counter-bearing edge", () => {
  const a = sourceFacts(), b = sourceFacts(cases[5][1].replace("0 1", "0 2"));
  const facts = [...a.filter(fact => key(fact.evidence) === ACCESS), ...b.filter(fact => [STATE, GROUP].includes(key(fact.evidence)))];
  expect(orderAdmittedFacts(nudge, facts)).toEqual(orderModuleFactsByBaseKeys(nudge, facts));
});

it.each([false, true])("compares complete multi-pawn memberships without changing their source order, mirrored=%s", black => {
  const facts = sourceFacts("3r3k/p7/8/3p4/2P5/3P4/3P4/7K w - - 0 1", "c4d5", black);
  const access = one(facts, ACCESS), state = facts.find(fact => fact.evidence === readFoundationEventInvocation(access.evidence).inputs[0])!;
  expect(state).toBeDefined();
  const before = JSON.stringify(facts.map(fact => fact.evidence.payload));
  const group = facts.find(fact => key(fact.evidence) === GROUP && (fact.evidence.payload as { after: { pawns: unknown[] } | null }).after?.pawns.length === 3)!;
  expect(group).toBeDefined();
  const groupPawns = (group.evidence.payload as { after: { pawns: string[] } }).after.pawns;
  const statePawns = (state.evidence.payload as { after: { whitePawns: string[]; blackPawns: string[] } }).after[black ? "blackPawns" : "whitePawns"];
  expect([...groupPawns].sort()).toEqual([...statePawns].sort());
  if (!black) expect(groupPawns).not.toEqual(statePawns);
  const complete = orderAdmittedFacts(nudge, facts), partial = facts.filter(fact => fact !== group);
  expect(complete.indexOf(access)).toBeLessThan(orderModuleFactsByBaseKeys(nudge, facts).indexOf(access));
  expect(orderAdmittedFacts(nudge, partial).indexOf(access)).toBe(orderModuleFactsByBaseKeys(nudge, partial).indexOf(access));
  expect(JSON.stringify(facts.map(fact => fact.evidence.payload))).toBe(before);
});

it.each([false, true])("retains multi-heavy/multi-color originals and excludes a partial multi-file summary, mirrored=%s", black => {
  const facts = sourceFacts("2r4k/p7/8/8/8/2p5/1P6/1R5K w - - 0 1", "b2c3", black);
  const accesses = facts.filter(fact => key(fact.evidence) === ACCESS), islands = facts.filter(fact => key(fact.evidence) === ISLANDS);
  expect(accesses).toHaveLength(2); expect(islands).toHaveLength(2);
  const result = orderAdmittedFacts(nudge, facts);
  expect(result).toHaveLength(facts.length); expect(new Set(result)).toEqual(new Set(facts));
  expect(result.filter(fact => key(fact.evidence) === ACCESS)).toEqual(orderModuleFactsByBaseKeys(nudge, facts).filter(fact => key(fact.evidence) === ACCESS));
  const color = black ? "black" : "white";
  const summary = islands.find(fact => (fact.evidence.payload as { color: string }).color === color)!;
  const group = facts.find(fact => key(fact.evidence) === GROUP && (fact.evidence.payload as { subject: { color: string; file: string } }).subject.color === color
    && (fact.evidence.payload as { subject: { file: string } }).subject.file === "c")!;
  expect(group).toBeDefined();
  const partial = facts.filter(fact => fact !== group);
  expect(orderAdmittedFacts(nudge, partial).indexOf(summary)).toBe(orderModuleFactsByBaseKeys(nudge, partial).indexOf(summary));
  const partialBase = orderModuleFactsByBaseKeys(nudge, partial), partialResult = orderAdmittedFacts(nudge, partial);
  const independent = islands.find(fact => fact !== summary)!;
  expect(partialResult.indexOf(independent)).toBeLessThan(partialBase.indexOf(independent));
  expect(partialResult).toHaveLength(partial.length); expect(new Set(partialResult)).toEqual(new Set(partial));
});

it("keeps source-free/no-summary order and other module/policy boundaries unchanged", () => {
  const noSummary = sourceFacts(cases[2][1], cases[2][2]);
  expect(orderAdmittedFacts(nudge, noSummary)).toEqual(orderModuleFactsByBaseKeys(nudge, noSummary));
  const facts = sourceFacts();
  for (const module of MODULE_REGISTRY.byId.values()) if (module.id !== "postcommit_nudge") {
    expect(orderAdmittedFacts(module, facts)).toEqual(orderModuleFactsByBaseKeys(module, facts));
  }
  for (const version of [1, 2, 4]) {
    const other = { ...nudge, selection: { ...nudge.selection, policy: { ...nudge.selection.policy, version } } };
    expect(orderAdmittedFacts(other, facts)).toEqual(orderModuleFactsByBaseKeys(other, facts));
  }
});

it("refuses copied facts, changed declaration metadata and resealed original-source claims", () => {
  const facts = sourceFacts(), original = one(facts, ISLANDS);
  expect(() => orderAdmittedFacts(nudge, [{ ...original }])).toThrow(/MODULE_FACT_UNOWNED/u);
  const declaration = { ...original.projection, exactness: "exact" as const };
  const counterfeit = moduleFact({ ...PRIMARY_EVIDENCE_MANIFEST, projections: PRIMARY_EVIDENCE_MANIFEST.projections.map(value => value === original.projection ? declaration : value) }, original.evidence);
  expect(() => orderAdmittedFacts(nudge, [counterfeit])).toThrow(/MODULE_FACT_DECLARATION/u);
  expect(() => moduleFact(PRIMARY_EVIDENCE_MANIFEST, { ...original.evidence })).toThrow();
  const receipt = evidenceValueReceipt(original.evidence);
  const resealed = declareEvidence(original.evidence.producer, original.evidence.projection, original.evidence.payload, {
    factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests,
    ...(receipt.convention === undefined ? {} : { convention: receipt.convention }),
  });
  const resealedFact = moduleFact(PRIMARY_EVIDENCE_MANIFEST, resealed);
  expect(resealed).not.toBe(original.evidence);
  expect(() => orderAdmittedFacts(nudge, [resealedFact])).toThrow(/original ordered factory inputs/u);
});

it("cannot substitute a same-count different-square/color/file group from the same genuine edge", () => {
  const facts = sourceFacts("2r4k/p7/8/8/8/2p5/1P6/1R5K w - - 0 1", "b2c3");
  const group = (color: string, file: string) => facts.find(fact => key(fact.evidence) === GROUP
    && (fact.evidence.payload as { subject: { color: string; file: string } }).subject.color === color
    && (fact.evidence.payload as { subject: { file: string } }).subject.file === file)!;
  const correct = group("black", "c"), wrong = group("white", "b");
  const before = (fact: ModuleFact) => (fact.evidence.payload as { before: { pawns: string[] } }).before.pawns;
  expect(before(correct)).toHaveLength(1); expect(before(wrong)).toHaveLength(1); expect(before(correct)).not.toEqual(before(wrong));
  const summary = facts.find(fact => key(fact.evidence) === ISLANDS && (fact.evidence.payload as { color: string }).color === "black")!;
  const state = facts.find(fact => key(fact.evidence) === STATE && (fact.evidence.payload as { file: string }).file === "c")!;
  const subset = [summary, state, wrong]; // A partial-input negative, never a production source filter.
  expect(orderAdmittedFacts(nudge, subset)).toEqual(orderModuleFactsByBaseKeys(nudge, subset));
});

it("preserves genuine critical, complete-window and grade slots ahead of summaries", () => {
  const critical = sourceFacts("1r5k/P7/8/8/8/8/8/7K w - - 0 1", "a7b8q")
    .find(fact => key(fact.evidence) === "rules.transition.event.promotion@1")!;
  expect(critical).toBeDefined();
  const windowRun = recordedSequenceRouteFixture("derived.tactic.overload_exploitation_observed@3");
  const windowSource = recordedSemanticWindowSource({ run: windowRun, branchId: windowRun.activeCursor.branchId,
    throughNodeId: windowRun.activeCursor.nodeId, projection: { id: "derived.tactic.overload_exploitation_observed", version: 3 } });
  expect(windowSource.kind).toBe("window_available"); if (windowSource.kind !== "window_available") throw new Error("Original recorded window unavailable");
  const windowEvidence = windowSource.events[0]!.evidence;
  expect(windowEvidence).toBeDefined();
  const window = moduleFact(PRIMARY_EVIDENCE_MANIFEST, windowEvidence);
  const run = reviewFixtureRun({ id: "summary-grade-priority", kind: "position", plies: 12 }), node = branchPath(run, run.activeCursor.branchId)[3]!;
  const result = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: recordedReviewGradeSources(run).get(node.id)! });
  expect(result.kind).toBe("available"); if (result.kind !== "available") throw new Error("Genuine grade fixture unavailable");
  const grade = moduleFact(PRIMARY_EVIDENCE_MANIFEST, result.value[0]!);
  const facts = [...sourceFacts(), grade, window, critical], base = orderModuleFactsByBaseKeys(nudge, facts), ordered = orderAdmittedFacts(nudge, facts);
  expect(base.slice(0, 3)).toEqual([critical, window, grade]); expect(ordered.slice(0, 3)).toEqual([critical, window, grade]);
  expect(ordered).toHaveLength(facts.length); expect(new Set(ordered)).toEqual(new Set(facts));
});

it("captures the public list once before checking and ordering original facts", () => {
  const facts = sourceFacts(), expected = orderAdmittedFacts(nudge, facts); let iterations = 0;
  const changing = new Proxy(facts, { get(target, property, receiver) {
    if (property === Symbol.iterator) return function* () { iterations++; yield* iterations === 1 ? facts : [{ ...facts[0]! }]; };
    return Reflect.get(target, property, receiver);
  } });
  expect(orderAdmittedFacts(nudge, changing)).toEqual(expected); expect(iterations).toBe(1);
});
