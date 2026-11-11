// Accepted value-authority §2.2b: constructor proof, not canonical acquisition or qualification.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_DECLARATIONS } from "./evidence-catalog.js";
import { compileEvidenceManifest, declareEvidence, evidenceValueReceipt, type DeclaredEvidence, type SemanticEventSign, type SemanticEventDeclaration, type VersionedEvidenceId } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readFoundationEventInvocation } from "./internal/evidence-value-routes.js";
import { compileSemanticEvidenceEvent, assertSemanticEvidenceEvent } from "./semantic-evidence.js";
import { ONE_EDGE_EVENT_REFS } from "./module-registry.js";
import type { FoundationEdgeSourceRef } from "./foundation-edge-source.js";
import { exactLegalMoves } from "./legal-moves.js";
import { mirrorSemanticFen, mirrorSemanticUci, SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS, type SemanticValidationReceiptDocument } from "./semantic-validation.js";
import { SEMANTIC_VALIDATION_ROOTS, SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS } from "./candidate-population.js";

const seeds = [
  ["rules.structural.event.king_opposition@2", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7"],
  ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
  ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3"],
  ["derived.activity.event.file_state@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
  ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
  ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
] as const;
function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason);
  return result.value;
}
function collect(route: FoundationEdgeSourceRef, fen: string, moveUci: string) {
  const position = positionFromFen(fen), side = position.turn, beforeFen = canonicalFen(position), move = normalizeMove(position, parseUci(moveUci)!);
  expect(position.isLegal(move)).toBe(true); position.play(move);
  const anchor = { beforeFen, moveUci, afterFen: canonicalFen(position), side };
  const legal = (at: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: at });
  const connectivity = (at: string) => invokeEvidenceValueRoute("rules.structural.reading.pawn_connectivity@1", { fen: at });
  const items = (values: readonly DeclaredEvidence<unknown>[], inputs: readonly DeclaredEvidence<unknown>[]) => values.map(evidence => ({ evidence, inputs }));
  switch (route) {
    case "rules.structural.event.king_opposition@2": {
      const before = available(invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: legal(beforeFen) }));
      const after = available(invokeEvidenceValueRoute("rules.structural.reading.king_opposition@3", { position: legal(anchor.afterFen) }));
      return { anchor, items: items(available(invokeEvidenceValueRoute(route, { before, moveUci, after })), [before, after]) };
    }
    case "rules.structural.event.backward_pawn@2": {
      const before = available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: legal(beforeFen) }));
      const after = available(invokeEvidenceValueRoute("rules.structural.reading.backward_pawn@3", { position: legal(anchor.afterFen) }));
      return { anchor, items: items(available(invokeEvidenceValueRoute(route, { before, moveUci, after })), [before, after]) };
    }
    case "rules.structural.event.pawn_islands@2": {
      const before = connectivity(beforeFen), after = connectivity(anchor.afterFen);
      return { anchor, items: items(available(invokeEvidenceValueRoute(route, { before, moveUci, after })), [before, after]) };
    }
    case "derived.structural.event.pawn_file_group@1": {
      const before = available(invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: connectivity(beforeFen) }));
      const after = available(invokeEvidenceValueRoute("derived.structural.reading.pawn_file_group@1", { source: connectivity(anchor.afterFen) }));
      return { anchor, items: items(available(invokeEvidenceValueRoute(route, { before, moveUci, after })), [before, after]) };
    }
    case "derived.activity.event.file_state@1":
    case "derived.activity.event.file_access_revealed@1": {
      const before = available(invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: connectivity(beforeFen) }));
      const after = available(invokeEvidenceValueRoute("derived.activity.reading.file_state@1", { source: connectivity(anchor.afterFen) }));
      const changes = available(invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before, moveUci, after }));
      return { anchor, items: route === "derived.activity.event.file_state@1" ? items(changes, [before, after])
        : changes.flatMap(change => items(available(invokeEvidenceValueRoute(route, { change })), [change])) };
    }
    case "rules.transition.event.slider_ray@2": return { anchor, items: items(invokeEvidenceValueRoute(route, anchorFields(anchor)), []) };
  }
}
function anchorFields(anchor: { beforeFen: string; moveUci: string; afterFen: string }) {
  return { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen };
}
function sign(evidence: DeclaredEvidence<unknown>): SemanticEventSign { return (evidence.payload as { sign: SemanticEventSign }).sign; }

describe("current foundation event construction", () => {
  it.each(seeds)("wraps the actual original %s population", (route, fen, move) => {
    const original = collect(route, fen, move);
    expect(original.items.length).toBeGreaterThan(0);
    for (const { evidence, inputs } of original.items) {
      const saved = JSON.stringify(evidence);
      expect(evidenceValueReceipt(evidence).sourceDigests).toEqual(inputs.map(value => evidenceValueReceipt(value).payloadDigest));
      const event = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, derivationInputs: inputs, anchor: original.anchor, sign: sign(evidence) });
      expect(event.evidence).toBe(evidence); expect(event.operands).toBe(evidence.payload);
      inputs.forEach((value, i) => expect(event.derivationInputs[i]).toBe(value));
      assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
      expect(JSON.stringify(evidence)).toBe(saved);
    }
  });
  it("pins the exact current39 one-edge image, preserving retired meanings only in historical custody", () => {
    expect(ONE_EDGE_EVENT_REFS.map(value => `${value.id}@${value.version}`)).toEqual([
      "rules.structural.event.king_zone@1",
      "rules.structural.event.passed_pawn@1",
      "rules.structural.event.piece_count@1",
      "rules.structural.event.direct_attack_count@1",
      "rules.structural.event.king_opposition@2",
      "rules.structural.event.backward_pawn@2",
      "derived.structural.event.pawn_file_group@1",
      "rules.transition.event.slider_ray@2",
      "derived.activity.event.file_state@1",
      "derived.activity.event.file_access_revealed@1",
      "rules.structural.event.pawn_islands@2",
      "rules.transition.event.occupied_attack@1",
      "rules.transition.event.occupied_defence@1",
      "rules.transition.event.piece_escape@1",
      "rules.transition.event.defended_duty@1",
      "rules.transition.event.castled@1",
      "rules.transition.event.clock_reset@1",
      "rules.transition.event.last_of_role@1",
      "rules.transition.event.pawn_contact@1",
      "rules.transition.event.checkmate@1",
      "rules.transition.event.promotion@1",
      "rules.transition.event.capture@1",
      "rules.transition.event.developed@1",
      "rules.tactic.event.double_attack@1",
      "rules.tactic.consequence.reply_breadth@1",
      "rules.tactic.event.check@1",
      "rules.tactic.event.loose_piece@1",
      "rules.castling.event.rights_lost@1",
      "derived.exchange.capture_class@1",
      "derived.tactic.discovered_executed@1",
      "rules.square.event.control@1",
      "rules.mobility.event.piece_destinations@1",
      "rules.pawn.event.dynamics@1",
      "derived.pawn.event.transitions@1",
      "rules.king.event.zone_state@1",
      "derived.king.captured_zone_defender@1",
      "derived.activity.event.open_file_occupancy@1",
      "rules.tactic.event.defender_removed@1",
      "rules.tactic.event.defender_duty_relocated@1"
]);
  });
});


const bothColors = seeds.flatMap(([route, fen, move]) => [
  { route, fen, move, orientation: "original" },
  { route, fen: mirrorSemanticFen(fen, "color_and_vertical"), move: mirrorSemanticUci(move, "color_and_vertical"), orientation: "color partner" },
]);
const key = (value: VersionedEvidenceId) => `${value.id}@${value.version}`;
describe("original factory membership, edge and sign", () => {
  it.each(bothColors)("$route $orientation retains originals and refuses input/source/anchor substitutions", ({ route, fen, move }) => {
    const source = collect(route, fen, move), twin = collect(route, fen, move);
    expect(source.items.length).toBeGreaterThan(0); expect(twin.items).toHaveLength(source.items.length);
    const changedFen = source.anchor.beforeFen.replace(/ (\d+)$/u, (_, clock: string) => ` ${Number(clock) + 1}`);
    const foreign = collect(route, changedFen, move);
    const anotherMove = exactLegalMoves(fen).find(row => row.uci !== source.anchor.moveUci)!;
    expect(anotherMove).toBeDefined();
    const otherEdge = collect(route, fen, anotherMove.uci).anchor;
    source.items.forEach(({ evidence, inputs }, i) => {
      const saved = JSON.stringify(evidence), original = readFoundationEventInvocation(evidence);
      expect(original.inputs).toHaveLength(inputs.length); inputs.forEach((value, n) => expect(original.inputs[n]).toBe(value));
      const wrap = (supplied = inputs, value = evidence, anchor = source.anchor, eventSign = sign(evidence)) => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST,
        { evidence: value, derivationInputs: supplied, anchor, sign: eventSign });
      const event = wrap();
      if (inputs.length > 0) {
        const equal = twin.items[i]!.inputs;
        equal.forEach((value, n) => { expect(value).not.toBe(inputs[n]); expect(evidenceValueReceipt(value).payloadDigest).toBe(evidenceValueReceipt(inputs[n]!).payloadDigest); });
        expect(() => wrap(equal)).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_DERIVATION_MISMATCH" }));
        for (const wrong of [[], inputs.slice(1), [...inputs, inputs[0]!], foreign.items[i]!.inputs]) expect(() => wrap(wrong)).toThrow();
      }
      if (inputs.length === 2) {
        expect(() => wrap([...inputs].reverse())).toThrow();
        expect(() => wrap([inputs[0]!, inputs[0]!])).toThrow();
      } else {
        // A singleton or empty vector is unchanged by reversal. It must remain a positive.
        expect(wrap([...inputs].reverse()).id).toBe(event.id);
      }
      const receipt = evidenceValueReceipt(evidence);
      const copied = declareEvidence(evidence.producer, evidence.projection, structuredClone(evidence.payload), {
        factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests,
        ...(receipt.convention === undefined ? {} : { convention: receipt.convention }),
      });
      for (const counterfeit of [{ ...evidence }, copied]) {
        expect(() => readFoundationEventInvocation(counterfeit)).toThrow();
        expect(() => wrap(inputs, counterfeit)).toThrow();
      }
      expect(() => wrap(inputs, evidence, foreign.anchor)).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_OPERAND_MISSING" }));
      expect(() => wrap(inputs, evidence, otherEdge)).toThrow();
      const declaration = SEMANTIC_EVENT_DECLARATIONS.find(row => key(row.projection) === route)!;
      const wrongSign = declaration.allowedSigns.find(value => value !== sign(evidence)) ?? (sign(evidence) === "lost" ? "gained" : "lost");
      expect(() => wrap(inputs, evidence, source.anchor, wrongSign)).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_SIGN_WIDENS" }));
      expect(wrap().id).toBe(event.id); expect(JSON.stringify(evidence)).toBe(saved);
    });
  });

  it.each([
    ["8/8/8/8/8/6k1/8/4K2R w K - 0 1", "e1g1", "e1h1"],
    ["4k2r/8/6K1/8/8/8/8/8 b k - 0 1", "e8g8", "e8h8"],
  ])("wraps actual accepted castle alias %s %s at its canonical edge", (fen, alias, canonical) => {
    const source = collect("rules.structural.event.king_opposition@2", fen!, alias!), normalized = collect("rules.structural.event.king_opposition@2", fen!, canonical!);
    expect(source.items).toHaveLength(1); const item = source.items[0]!, equivalent = normalized.items[0]!;
    expect(item.evidence.payload).toEqual(equivalent.evidence.payload);
    expect(evidenceValueReceipt(item.evidence).inputDigest).not.toBe(evidenceValueReceipt(equivalent.evidence).inputDigest);
    const event = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor: source.anchor, sign: sign(item.evidence) });
    expect(event.anchor.moveUci).toBe(canonical); expect(event.sign).toBe("gained");
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
  });

  it.each(seeds.map(([route]) => route))("%s genuine empty is no wrapper and still validates input authority", route => {
    expect(collect(route, "4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1d1").items).toEqual([]);
  });

  it.each([
    ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1h1"],
    ["4k3/8/8/8/8/8/8/R3KR2 w FA - 0 1", "e1f1"],
    ["4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q"],
    ["7k/8/8/4Pp1r/8/8/8/K7 w - f6 0 1", "e5f6"],
  ].flatMap(([fen, move]) => [[fen!, move!], [mirrorSemanticFen(fen!, "color_and_vertical"), mirrorSemanticUci(move!, "color_and_vertical")]]))("preserves actual physical slider special edge %s %s and retained reuse", (fen, move) => {
    const source = collect("rules.transition.event.slider_ray@2", fen!, move!), reused = collect("rules.transition.event.slider_ray@2", fen!, move!);
    expect(source.items.length).toBeGreaterThan(0); expect(reused.items).toHaveLength(source.items.length);
    source.items.forEach((item, i) => {
      expect(reused.items[i]!.evidence).toBe(item.evidence);
      const event = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: [], anchor: source.anchor, sign: sign(item.evidence) });
      assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
      expect(event.operands).toBe(item.evidence.payload);
    });
  });
});

describe("literal computed prerequisites and declaration ownership", () => {
  const computed = seeds.slice(0, 3).map(([route]) => route);
  const replace = (route: string, edit: (row: SemanticEventDeclaration) => SemanticEventDeclaration) => ({ ...EVIDENCE_CONTRACT_DECLARATIONS,
    semanticEvents: EVIDENCE_CONTRACT_DECLARATIONS.semanticEvents!.map(row => key(row.projection) === route ? edit(row) : row) });
  it.each(computed)("%s pins exactly two original source occurrences without a derived plane", route => {
    const declaration = SEMANTIC_EVENT_DECLARATIONS.find(row => key(row.projection) === route)!;
    const input = declaration.derivationInputs!;
    expect(input).toHaveLength(2); expect(input[0]).toEqual(input[1]);
    const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => key(row) === route)!;
    expect(projection.plane).toBe("rules"); expect(projection.derivation).toBeUndefined();
    expect(() => compileEvidenceManifest(replace(route, row => row))).not.toThrow();
    for (const wrong of [[], input.slice(1), [...input, input[0]!], [{ ...input[0]!, version: input[0]!.version + 1 }, input[1]!],
      [{ id: "rules.mobility.reading.legal_moves", version: 1 }, input[1]!]]) {
      expect(() => compileEvidenceManifest(replace(route, row => ({ ...row, derivationInputs: wrong })))).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_DERIVATION_MISMATCH" }));
    }
    expect(() => compileEvidenceManifest(replace(route, ({ derivationInputs: _inputs, ...row }) => ({ ...row, derivationAnyOf: [input] })))).toThrow();
    expect(() => compileEvidenceManifest(replace(route, row => ({ ...row, derivationAnyOf: [input] })))).toThrow();
    const changed = (dependsOn: readonly VersionedEvidenceId[]) => ({ ...EVIDENCE_CONTRACT_DECLARATIONS,
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => ({ ...producer, outputs: producer.outputs.map(output => key(output) === route ? { ...output, dependsOn } : output) })) });
    expect(() => compileEvidenceManifest(changed([]))).toThrow();
    expect(() => compileEvidenceManifest(changed([...projection.dependsOn, { id: "rules.mobility.reading.legal_moves", version: 1 }]))).toThrow();
    const falseDerived = { ...EVIDENCE_CONTRACT_DECLARATIONS, producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => ({ ...producer,
      outputs: producer.outputs.map(output => key(output) === route ? { ...output, plane: "derived" as const, derivation: { inputs: input } } : output) })) };
    expect(() => compileEvidenceManifest(falseDerived)).toThrow();
  });

  it("pins current89 root/profile subjects and separates actual module/selection/validation authority", () => {
    expect(SEMANTIC_VALIDATION_ROOTS).toHaveLength(89);
    expect(SEMANTIC_VALIDATION_PROFILES).toHaveLength(89);
    const qualified = SEMANTIC_VALIDATION_ROOTS.filter(subject => semanticValidationVerdict(subject)?.verdict === "passed");
    expect(qualified).toHaveLength(19);
    expect(qualified.filter(subject => subject.projection.id.startsWith("derived.semantic_avoidance.")).map(subject => key(subject.projection)).sort())
      .toEqual(["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "open_file", "passed_pawn", "pawn_islands", "piece_count"].map(family => `derived.semantic_avoidance.${family}@2`));
    const document = JSON.parse(readFileSync(new URL("./semantic-validation-receipt.generated.json", import.meta.url), "utf8")) as SemanticValidationReceiptDocument;
    for (const root of SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS) {
      const route = key(root), profile = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.kind === "event" && key(row.subject.projection) === route)!;
      const qualifiedSource = ["rules.structural.event.king_opposition@2", "rules.structural.event.backward_pawn@2", "derived.structural.event.pawn_file_group@1", "derived.activity.event.file_state@1", "derived.activity.event.file_access_revealed@1", "rules.structural.event.pawn_islands@2", "rules.transition.event.slider_ray@2"].includes(route);
      for (const arm of ["positive", "semanticNegative", "orientation"] as const) expect(profile[arm].disposition).toBe(qualifiedSource ? "present" : "required");
      expect(profile.importedPopulation.disposition).toBe("present");
      if (profile.importedPopulation.disposition !== "present") throw Error("An actual current-source census is required");
      expect(profile.importedPopulation.refs).toHaveLength(1);
      expect(profile.importedPopulation.refs[0]!.subject).toEqual(profile.subject);
      const receipts = document.populations.filter(row => row.subject === `event:${route}`);
      expect(receipts).toHaveLength(1);
      expect(receipts[0]).toMatchObject({ id: profile.importedPopulation.refs[0]!.id,
        operation: "runtime.semantic.foundation_edge", input: { id: "r2-imported-sample-2026-07", projection: "sampled_edges", invocations: 579 },
        result: { version: 1, abstainedCount: 0 } });
      expect(semanticValidationVerdict(profile.subject)?.verdict === "passed").toBe(qualifiedSource);
      expect(SEMANTIC_EVENT_DECLARATIONS.filter(row => key(row.projection) === route)).toHaveLength(1);
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => key(row.projection) === route).map(row => key(row.consumer)).sort()).toEqual(["module.full_inspector@2", "module.postcommit_nudge@2", "module.review_map@2", "profile.subject_observations@1", "research.semantic_selection@3", "research.semantic_validation@1"]);
      expect(PRIMARY_EVIDENCE_MANIFEST.eligibility.filter(row => key(row.event) === route).map(row => [key(row.consumer), row.semanticValidation]).sort()).toEqual([["research.semantic_selection@3", "research_only"], ["research.semantic_validation@1", "research_only"]]);
      expect(LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS).toContain(route);
    }
  });
});

// These are existing source-operation cases, not new tactical/strategic truth or validation arms.
const relationCases = [
  ["rules.structural.event.king_opposition@2", "8/8/8/8/8/4k3/8/3K4 w - - 0 1", "d1e1", "gained"],
  ["rules.structural.event.king_opposition@2", "8/8/8/8/8/4k3/8/4K3 w - - 0 1", "e1d1", "lost"],
  ["rules.structural.event.backward_pawn@2", "4k3/8/2p5/1p6/8/1P6/8/4K3 w - - 0 1", "b3b4", "gained"],
  ["rules.structural.event.backward_pawn@2", "4k3/8/2p5/pp6/1P6/8/8/4K3 w - - 0 1", "b4a5", "lost"],
  ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3", "gained"],
  ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3", "lost"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/PPP5/7K w - - 0 1", "b2c3", "count_gained"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/1n6/P1P5/7K w - - 0 1", "a2b3", "count_lost"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/1p6/2B5/8/8/7K w - - 0 1", "c4b5", "count_lost"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/PP1P4/7K w - - 0 1", "b2c3", "topology_changed"],
  ["rules.transition.event.slider_ray@2", "r6k/8/8/8/8/8/8/R6K w - - 0 1", "a1a8", "lost"],
] as const;
it.each(relationCases.flatMap(([route, fen, move, wanted]) => [
  { route, fen, move, wanted, orientation: "original" },
  { route, fen: mirrorSemanticFen(fen, "color_and_vertical"), move: mirrorSemanticUci(move, "color_and_vertical"), wanted, orientation: "color partner" },
]))("retains $route $wanted $orientation including available null/zero members", ({ route, fen, move, wanted }) => {
  const source = collect(route, fen, move), matches = source.items.filter(item => sign(item.evidence) === wanted);
  expect(matches.length).toBeGreaterThan(0);
  matches.forEach(({ evidence, inputs }) => {
    const event = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, derivationInputs: inputs, anchor: source.anchor, sign: wanted });
    expect(event.operands).toBe(evidence.payload); assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
    const declaration = SEMANTIC_EVENT_DECLARATIONS.find(row => key(row.projection) === route)!;
    for (const wrong of declaration.allowedSigns.filter(value => value !== wanted)) {
      expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence, derivationInputs: inputs, anchor: source.anchor, sign: wrong })).toThrowError(expect.objectContaining({ code: "EVIDENCE_EVENT_SIGN_WIDENS" }));
    }
  });
});

it.each([
  ["1r4k1/8/8/8/Rp6/8/PQ6/7K w - - 0 1", "a4b4"],
  [mirrorSemanticFen("1r4k1/8/8/8/Rp6/8/PQ6/7K w - - 0 1", "color_and_vertical"), "a5b5"],
])("keeps multiple genuine revelation subjects on their same original file change: %s", (fen, move) => {
  const source = collect("derived.activity.event.file_access_revealed@1", fen!, move!);
  expect(source.items).toHaveLength(2);
  expect(source.items[0]!.inputs[0]).toBe(source.items[1]!.inputs[0]);
  for (const item of source.items) {
    const event = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence: item.evidence, derivationInputs: item.inputs, anchor: source.anchor, sign: "gained" });
    expect(event.derivationInputs[0]).toBe(source.items[0]!.inputs[0]);
    assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
  }
});
