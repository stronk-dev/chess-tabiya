// Disposable D3768 research: characterize the current rule, not qualify or change it.
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { assertDeclaredEvidence, compileEvidenceManifest, evidenceConventionReceipt, evidenceDigest, evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { deriveProjectionConventionTable } from "../../packages/runtime/src/evidence-convention-closure.js";
import { CONVENTION_REGISTRY } from "../../packages/runtime/src/evidence-conventions.js";
import { compileProjectionExecution } from "../../packages/runtime/src/evidence-execution.js";
import { compileHintDisclosure, hintSentence } from "../../packages/runtime/src/hint-distance.js";
import { evidenceValueRouteRegistry, invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { forcedMateAfterMove } from "../../packages/runtime/src/mate-proof.js";
import { presentEvidenceItems, presentedSentence } from "../../packages/runtime/src/presentation-contract.js";
import { doubleAttackEvent, forkSurvivesReply, promotionPressureReading, replyBreadth, type DoubleAttackEvent, type ReplyBreadth } from "../../packages/runtime/src/tactics.js";
import { selectFixture } from "../../packages/runtime/src/testing/hint-fixture.js";

const terminal = [
  { name: "white checkmate", fen: "R5rk/5Q2/6K1/8/8/8/8/8 w - - 0 1", move: "f7g7", check: true },
  { name: "black checkmate", fen: "8/8/8/8/8/6k1/5q2/r5RK b - - 0 1", move: "f2g2", check: true },
  { name: "white stalemate", fen: "5K1k/6pp/7R/6Q1/3B4/8/8/8 w - - 0 1", move: "g5g6", check: false },
  { name: "black stalemate", fen: "8/8/8/3b4/6q1/7r/6PP/5k1K b - - 0 1", move: "g4g3", check: false },
] as const;

function edge(fen: string, moveUci: string) {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return { beforeFen: fen, moveUci, afterFen: canonicalFen(position) };
}

// The internal source is now installed; keep this research on the real factory, not a duplicate.
function installedNonterminalFork(attack: DeclaredEvidence<DoubleAttackEvent>, breadth: DeclaredEvidence<ReplyBreadth>) {
  for (const [value, route] of [[attack, "rules.tactic.event.double_attack@1"], [breadth, "rules.tactic.consequence.reply_breadth@1"]] as const) {
    assertDeclaredEvidence(value);
    expect(`${value.projection.id}@${value.projection.version}`).toBe(route);
    expect(evidenceValueReceipt(value).factory).toBe(evidenceValueRouteRegistry().find(row => row.route === route)!.symbol);
  }
  const canonicalEdge = edge(attack.payload.beforeFen, attack.payload.moveUci);
  expect(attack.payload.afterFen).toBe(canonicalEdge.afterFen);
  expect(evidenceValueReceipt(attack).inputDigest).toBe(evidenceDigest(canonicalEdge));
  expect(evidenceValueReceipt(breadth).inputDigest).toBe(evidenceDigest(canonicalEdge));
  expect(breadth.payload.afterFen).toBe(canonicalEdge.afterFen);
  expect(breadth.payload.triggeringMove).toBe(canonicalEdge.moveUci);
  expect(breadth.payload.count).toBe(breadth.payload.replies.length);
  expect(breadth.payload.terminal).toBe(breadth.payload.count === 0);
  return invokeEvidenceValueRoute("derived.tactic.nonterminal_fork_survival@1", { doubleAttack: attack, breadth }).payload;
}

describe("D3768 terminal all-reply predicate research", () => {
  it.each(terminal)("characterizes $name at collector and factory boundaries", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const after = positionFromFen(input.afterFen);
    expect(after.isEnd()).toBe(true);
    expect(after.isCheck()).toBe(fixture.check);
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci);
    expect(attack).toBeDefined();
    const breadth = replyBreadth(input.beforeFen, input.moveUci);
    expect(breadth).toMatchObject({ terminal: true, check: fixture.check, count: 0, replies: [] });
    // This assertion records the existing vacuous result; it is not an expected chess verdict.
    expect(forkSurvivesReply(attack!, breadth)).toMatchObject({ matched: true, refutingReplies: [] });
    const doubleAttack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const declaredBreadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    const result = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack, breadth: declaredBreadth });
    expect(result.payload).toMatchObject({ matched: true, replyBreadth: { terminal: true, count: 0 }, refutingReplies: [] });
    expect(evidenceValueReceipt(result).factory).toBe("createDerivedTacticForkSurvivesReplyV1Evidence");
  });

  it.each(terminal)("retains $name in admitted registered presentation", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const doubleAttack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    const result = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack, breadth });
    const admitted = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 1 }, [result]);
    const captions = presentEvidenceItems(admitted).filter(item => item.component.id === "fact_statement").map(presentedSentence);
    expect(captions).toHaveLength(1);
    expect(captions[0]).toContain("0");
  });

  it.each(terminal)("measures actual candidate-to-hint selection for $name", fixture => {
    // A controlled provider exchange exercises source admission, not real Stockfish advice.
    const selection = selectFixture(fixture.fen, [fixture.move]);
    expect(selection.kind).toBe("selected");
    if (selection.kind !== "selected") throw new Error("terminal candidate was not selected");
    expect(selection.horizon.payload.family).toBe(fixture.check ? "mate_in_one" : "fork_survives_reply");
    const disclosure = compileHintDisclosure(selection.horizon, "pattern");
    expect(hintSentence(disclosure.payload)).toContain(fixture.check ? "mate" : "after every reply");
  });

  it.each(terminal)("keeps the mate proof's explicit $name result", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const breadth = replyBreadth(input.beforeFen, input.moveUci);
    expect(forcedMateAfterMove(input.beforeFen, input.moveUci, 1, breadth)).toMatchObject({
      kind: "proof", proof: { rootReplies: [], proofStatus: fixture.check ? "proved" : "refuted", terminalNonMate: !fixture.check },
    });
  });

  it.each([
    { name: "white", fen: "5K1k/P5pp/7R/6Q1/3B4/8/8/8 w - - 0 1", move: "g5g6", pawn: "a7" },
    { name: "black", fen: "8/8/8/3b4/6q1/7r/p5PP/5k1K b - - 0 1", move: "g4g3", pawn: "a2" },
  ])("keeps $name promotion persistence false after stalemate", fixture => {
    const input = edge(fixture.fen, fixture.move);
    expect(replyBreadth(input.beforeFen, input.moveUci)).toMatchObject({ terminal: true, check: false, count: 0 });
    const pawn = promotionPressureReading(input.afterFen).pawns.find(value => value.pawn.square === fixture.pawn);
    expect(pawn).toMatchObject({ passAvailability: { kind: "available", value: true }, replyPersistence: { kind: "available", value: false } });
  });

  it.each([
    { name: "white positive", fen: "k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q", matched: true },
    { name: "black positive", fen: "4k3/8/8/8/8/8/6pR/K7 b - - 0 1", move: "g2g1q", matched: true },
    { name: "white refutable", fen: "k6r/6P1/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q", matched: false },
    { name: "black refutable", fen: "4k3/8/8/8/8/8/6p1/K6R b - - 0 1", move: "g2g1q", matched: false },
  ])("keeps the nonterminal $name control", fixture => {
    const input = edge(fixture.fen, fixture.move);
    const attack = doubleAttackEvent(input.beforeFen, input.moveUci);
    expect(attack).toBeDefined();
    const breadth = replyBreadth(input.beforeFen, input.moveUci);
    expect(breadth.terminal).toBe(false);
    expect(breadth.count).toBeGreaterThan(0);
    const result = forkSurvivesReply(attack!, breadth);
    expect(result.matched).toBe(fixture.matched);
    expect(result.refutingReplies.length === 0).toBe(fixture.matched);
    expect(result.refutingReplies.every(reply => breadth.replies.includes(reply))).toBe(true);
  });

  it("reconstructs proposed terminal false without changing nonterminal payloads or fabricating refutations", () => {
    const nonterminal = [
      { fen: "k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q" },
      { fen: "4k3/8/8/8/8/8/6pR/K7 b - - 0 1", move: "g2g1q" },
      { fen: "k6r/6P1/8/8/8/8/8/4K3 w - - 0 1", move: "g7g8q" },
      { fen: "4k3/8/8/8/8/8/6p1/K6R b - - 0 1", move: "g2g1q" },
    ];
    for (const fixture of [...terminal, ...nonterminal]) {
      const input = edge(fixture.fen, fixture.move);
      const attack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
      const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
      const old = invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack: attack, breadth });
      expect(evidenceValueReceipt(old).sourceDigests).toEqual([attack, breadth].map(value => evidenceValueReceipt(value).payloadDigest));
      const proposed = installedNonterminalFork(attack, breadth);
      if (breadth.payload.terminal) {
        expect(proposed).toEqual({ ...old.payload, matched: false });
        expect(proposed.refutingReplies).toEqual([]);
      } else expect(proposed).toEqual(old.payload);
    }
  });

  it("refuses equal-after-position breadth from a different genuine before-position", () => {
    // The knight move clears either EP state to the SAME after-FEN. Payload-only joins
    // cannot distinguish these genuine sources; the private full-edge authority can.
    const withEp = edge("4k3/8/8/8/1n1pP3/8/8/R3K3 b - e3 0 1", "b4c2");
    const withoutEp = edge("4k3/8/8/8/1n1pP3/8/8/R3K3 b - - 0 1", "b4c2");
    expect(withEp.afterFen).toBe(withoutEp.afterFen);
    const attack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", withEp)[0]!;
    const own = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", withEp);
    const crossed = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", withoutEp);
    expect(own.payload).toEqual(crossed.payload);
    expect(evidenceValueReceipt(own).inputDigest).not.toBe(evidenceValueReceipt(crossed).inputDigest);
    expect(() => invokeEvidenceValueRoute("derived.tactic.fork_survives_reply@1", { doubleAttack: attack, breadth: crossed })).not.toThrow();
    expect(() => installedNonterminalFork(attack, own)).not.toThrow();
    expect(() => installedNonterminalFork(attack, crossed)).toThrow();
  });

  it("inventories declared fork dependents without claiming that every accepted path actually emits", () => {
    const target = "derived.tactic.fork_survives_reply@1";
    const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
    const projections = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map(row => [key(row), row]));
    const reaches = (id: string, visited = new Set<string>()): boolean => {
      if (id === target) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      const row = projections.get(id)!;
      const inputs = row.derivation?.inputs ?? row.derivation?.anyOf?.flat() ?? [];
      return [...row.dependsOn, ...inputs].some(ref => reaches(key(ref), visited));
    };
    const consumers = PRIMARY_EVIDENCE_MANIFEST.consumers.filter(row => row.accepts.some(ref => reaches(key(ref))))
      .map(row => ({ consumer: key(row), direct: row.accepts.some(ref => key(ref) === target) }));
    expect(consumers.filter(row => row.direct).map(row => row.consumer)).toEqual(expect.arrayContaining([
      "module.postcommit_nudge@1", "module.review_map@1", "module.full_inspector@1",
    ]));
    expect(consumers.some(row => row.consumer === "module.guided_hint@1" && !row.direct)).toBe(true);
    const declared = projections.get(target)!.derivation!.inputs!;
    expect(declared).toHaveLength(3); // literal old declaration, not actual two-input lineage
    console.log(JSON.stringify({ scope: "D3768/D3847 declared dependency census; NOT emitting/runtime/persistence proof", consumers }));
  });

  it("checks actual internal fork and prospective complete fork/promotion Hint metadata without learner adoption", () => {
    const oldFork = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.tactic.fork_survives_reply" && row.version === 1)!;
    const inputs = [{ id: "rules.tactic.event.double_attack", version: 1 }, { id: "rules.tactic.consequence.reply_breadth", version: 1 }];
    const proposed = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === "derived.tactic.nonterminal_fork_survival" && row.version === 1)!;
    expect(proposed.derivation!.inputs).toEqual(inputs);
    const changedFamily = (id: string) => /\.(fork_survives_reply|promotion_pressure)(?:\.|$)/u.test(id);
    const oldHints = PRIMARY_EVIDENCE_MANIFEST.projections.filter(row => row.id.startsWith("derived.hint.") && changedFamily(row.id));
    expect(oldHints).toHaveLength(12);
    const hints = oldHints.map(row => {
      const family = row.id.includes("fork_survives_reply") ? "fork_survives_reply" : "promotion_pressure";
      const sourceInputs = row.id.includes(".horizon.")
        ? [{ id: family === "fork_survives_reply" ? proposed.id : "rules.tactic.reading.promotion_pressure", version: 1 }, { id: "live.stockfish.principal_variation", version: 1 }]
        : [{ id: `derived.hint.horizon.${family}`, version: 2 }];
      return { ...row, version: 2, dependsOn: sourceInputs, derivation: { inputs: sourceInputs } };
    });
    const isForkDisclosure = (id: string) => id.startsWith("derived.hint.disclosure.") && changedFamily(id);
    const oldConsumer = EVIDENCE_CONTRACT_DECLARATIONS.consumers.find(row => row.id === "module.guided_hint" && row.version === 1)!;
    const consumer = { ...oldConsumer, version: 2, implementation: "compileModulePacketForConsumer",
      accepts: oldConsumer.accepts.map(ref => isForkDisclosure(ref.id) ? { ...ref, version: 2 } : ref) };
    const adapters = EVIDENCE_CONTRACT_DECLARATIONS.adapters.filter(row => row.consumer.id === oldConsumer.id && row.consumer.version === 1)
      .map(row => ({ ...row, version: 2, consumer: { id: consumer.id, version: 2 },
        projection: isForkDisclosure(row.projection.id) ? { ...row.projection, version: 2 } : row.projection }));
    const manifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
      consumers: [...EVIDENCE_CONTRACT_DECLARATIONS.consumers, consumer],
      adapters: [...EVIDENCE_CONTRACT_DECLARATIONS.adapters, ...adapters],
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.hint"
        ? { ...producer, outputs: [...producer.outputs, ...hints] } : producer) });
    const path = compileProjectionExecution(manifest, { id: proposed.id, version: 1 });
    expect(path.paths).toHaveLength(1);
    expect(path.paths[0]!.derivationChoices[0]!.inputs).toEqual(inputs);
    expect(path.paths[0]!.sourceRequirements).toEqual([]);
    const horizonPath = compileProjectionExecution(manifest, { id: "derived.hint.horizon.fork_survives_reply", version: 2 });
    expect(horizonPath.paths).toHaveLength(1);
    expect(horizonPath.paths[0]!.sourceRequirements.map(source => source.occurrence)).toEqual([[1]]);
    expect(consumer.accepts).toHaveLength(35);
    expect(consumer.accepts.filter(ref => ref.version === 2)).toHaveLength(10);
    expect(manifest.bindings.filter(row => row.consumer.id === consumer.id && row.consumer.version === 2)).toHaveLength(35);
    const registry = CONVENTION_REGISTRY;
    const direct = deriveProjectionConventionTable(manifest, registry);
    const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
    expect(direct.get(`${proposed.id}@1`)!.refs.map(key)).toEqual(["fork-survival@2"]);
    expect(hints.flatMap(row => direct.get(`${row.id}@2`)!.refs).map(key)).not.toContain("fork-survival@1");
    const input = edge(terminal[0].fen, terminal[0].move);
    const attack = invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", input)[0]!;
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", input);
    const closure = [...new Set([...direct.get(`${proposed.id}@1`)!.refs,
      ...evidenceConventionReceipt(attack)!.refs, ...evidenceConventionReceipt(breadth)!.refs].map(key))].sort();
    expect(closure).toEqual(["double-attack@1", "fork-survival@2", "legal-exchange@1"]);
    // Same-base @2 is NOT interchangeable: it inherits the witnessed old convention.
    const wrong = { ...proposed, id: oldFork.id, version: 2 };
    const wrongManifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.id === "derived.tactic"
        ? { ...producer, outputs: [...producer.outputs, wrong] } : producer) });
    expect(deriveProjectionConventionTable(wrongManifest, registry).get(`${wrong.id}@2`)!.refs.map(key))
      .toEqual(["fork-survival@1", "fork-survival@2"]);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.some(row => row.id === proposed.id)).toBe(true);
    expect(CONVENTION_REGISTRY.declarations.some(row => row.ref.id === "fork-survival" && row.ref.version === 2)).toBe(true);
  });
});
