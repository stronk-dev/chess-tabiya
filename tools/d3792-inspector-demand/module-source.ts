// DISPOSABLE D3859 complete module execution research. Existing declarations/compiler only;
// proposed Inspector rebase rows are an inventory aid, NOT new module bindings or source proof.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EVIDENCE_CONTRACT_DECLARATIONS, EVIDENCE_MODULE_IDS, MODULE_CONSUMER_ACCEPTS, PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { compileProjectionExecution, EvidenceExecutionError } from "../../packages/runtime/src/evidence-execution.js";
import { compileEvidenceConsumerExecution } from "../../packages/runtime/src/evidence-binding-execution.js";
import type { VersionedEvidenceId } from "../../packages/runtime/src/evidence-contract.js";
import { compileEvidenceManifest, evidenceValueReceipt, type DeclaredEvidence, type ProjectionDeclaration } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { importedRun, play } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import { moveQualityGrade, type MoveQualityGrade } from "../../packages/runtime/src/grade.js";
import { gradeReadingFromPayload } from "../../packages/runtime/src/grade-reading.js";
import { SEQUENCE_SOURCE_REBASES } from "./recorded-sequence-contract.js";
import { runGradeSourceResearch } from "./grade-source.js";
import { defenderExposureOperands, localSemanticEventClosure, localSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";
import { candidateChildReadings, CANDIDATE_PACKET_COMPILER_VERSION, CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "../../packages/runtime/src/candidate-population.js";
import { HINT_DECLARATION_MATRIX } from "../../packages/runtime/src/hint-registry.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { parseSquare } from "chessops/util";
import type { SquareName } from "chessops/types";
import { legalCaptureMovesTo, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";
import { passFen } from "../../packages/runtime/src/module-query.js";

const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map(row => [key(row), row]));
const parse = (value: string): VersionedEvidenceId => {
  const [id, version] = value.split("@"); return { id: id!, version: Number(version) };
};
export function runModuleSourceResearch() {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  const sourceMap = readFileSync("rfc/module-registration.md", "utf8")
    .split("**D3841 exact affected-source map — unaccepted author image:**")[1]!
    .split("**D3841 exact-version closure")[0]!;
  const replacements = new Map([...sourceMap.matchAll(/^\| `([^`]+@\d+)` \| `([^`]+@\d+)` \|/gmu)]
    .map(match => [match[1]!, match[2]!]));
  check(() => assert.equal(replacements.size, 31));

  const inspect = (reference: VersionedEvidenceId) => {
    try { const execution = compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, reference);
      return { projection: key(reference), executable: true, paths: execution.paths.length, failure: null };
    } catch (error) {
      assert(error instanceof EvidenceExecutionError);
      return { projection: key(reference), executable: false, paths: 0, failure: { code: error.code, message: error.message } };
    }
  };
  const closure = (refs: readonly VersionedEvidenceId[]) => {
    const reached = new Set<string>();
    const visit = (ref: VersionedEvidenceId) => {
      if (reached.has(key(ref))) return;
      reached.add(key(ref));
      const row = declarations.get(key(ref)); assert(row, "current module has an unknown exact ref");
      const members = row.derivation?.inputs === undefined ? row.derivation?.anyOf ?? [] : [row.derivation.inputs];
      for (const input of members.flat()) visit(input);
    };
    refs.forEach(visit); return reached;
  };
  const rows = (["postcommit_nudge", "review_map", "guided_hint"] as const).map(module => {
    const references = MODULE_CONSUMER_ACCEPTS[module];
    const outcomes = references.map(inspect), blocked = outcomes.filter(row => !row.executable);
    const reached = closure(references);
    const unregisteredLeaves = [...reached].filter(ref => declarations.get(ref)!.derivation === undefined)
      .map(ref => inspect(parse(ref))).filter(row => !row.executable);
    check(() => assert.equal(new Set(references.map(key)).size, references.length));
    check(() => assert.equal(outcomes.length, references.length));
    let consumerResult: string;
    try { const result = compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 1 });
      consumerResult = "compiled";
      check(() => assert.deepEqual(new Set(result.bindings.map(row => key(row.binding.projection))), new Set(references.map(key))));
    } catch (error) { consumerResult = String(error); check(() => assert(blocked.length > 0)); }
    const proposedMappings = references.filter(ref => replacements.has(key(ref)))
      .map(ref => ({ original: key(ref), proposedInspectorOnly: replacements.get(key(ref))! }));
    const conditionalImage = references.map(ref => replacements.get(key(ref)) ?? key(ref));
    check(() => assert.equal(new Set(conditionalImage).size, references.length));
    const remainingKnownRefFailures = conditionalImage.filter(ref => declarations.has(ref)).map(ref => inspect(parse(ref))).filter(row => !row.executable);
    const unimplementedProposedRefs = conditionalImage.filter(ref => !declarations.has(ref));
    check(() => assert.equal(remainingKnownRefFailures.length + unimplementedProposedRefs.length
      + conditionalImage.filter(ref => declarations.has(ref) && inspect(parse(ref)).executable).length, references.length));
    return { module, currentAccepted: references.length, individuallyExecutable: outcomes.length - blocked.length,
      blocked, unregisteredLeaves, consumerResult, proposedMappings,
      conditionalInventoryOnly: { unimplementedProposedRefs, remainingKnownRefFailures },
      narrativeRefsRetained: references.map(key).filter(ref => {
        const id = ref.split("@")[0]!;
        return ref.endsWith("@1") && (id.includes(".sequence.") || id.endsWith("_observed"));
      }) };
  });
  const nudge = rows.find(row => row.module === "postcommit_nudge")!;
  const review = rows.find(row => row.module === "review_map")!;
  const hint = rows.find(row => row.module === "guided_hint")!;
  check(() => assert(nudge.blocked.some(row => row.projection === "derived.grade.move_quality@1")));
  check(() => assert(review.blocked.some(row => row.projection === "live.stockfish.eval@1")));
  check(() => assert(review.blocked.some(row => row.projection === "live.stockfish.wdl@1")));
  check(() => assert(review.blocked.some(row => row.projection === "derived.pivotal.human_divergence@1")));
  check(() => assert.equal(hint.blocked.length, 0));
  check(() => assert.equal(hint.consumerResult, "compiled"));
  check(() => assert(nudge.conditionalInventoryOnly.remainingKnownRefFailures.some(row => row.projection === "derived.grade.move_quality@1")));
  check(() => assert(review.conditionalInventoryOnly.remainingKnownRefFailures.some(row => row.projection === "derived.grade.move_quality@1")));

  // A passing recorded-only counterfactual is precisely why dropping an alternative is unsafe:
  // it edits the old grade contract instead of giving the promised consumer a complete source.
  const grade = declarations.get("derived.grade.move_quality@1")!;
  const members = grade.derivation?.anyOf!;
  const pairedMembers = [["recorded.engine.eval@1", "recorded.engine.eval@1"], ["live.stockfish.eval@1", "live.stockfish.eval@1"]];
  check(() => assert.deepEqual(members.map(member => member.map(key)), pairedMembers));
  check(() => assert.throws(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, grade), /EXECUTION_SOURCE_UNREGISTERED/u));
  const counterfactual = { ...PRIMARY_EVIDENCE_MANIFEST,
    projections: PRIMARY_EVIDENCE_MANIFEST.projections.map(row => row === grade ? { ...row, derivation: { inputs: members[0]! } } : row) };
  const recordedOnly = compileProjectionExecution(counterfactual, grade);
  check(() => assert.equal(recordedOnly.paths.length, 1));
  check(() => assert.deepEqual(grade.derivation?.anyOf?.map(member => member.map(key)), pairedMembers));
  console.log(JSON.stringify({ scope: "D3859 current complete module/ref/source census; conditional Inspector mapping is NOT new module authority/adoption",
    controls, rows, counterfactualDroppingLiveGradeCompiles: true, oldDeclarationsChanged: false, providerCalls: 0, productionChanges: 0 }));
  runGradeOperandResearch();
  runPrelaunchRetirementResearch(replacements);
  runWholeCurrentModuleInventory(replacements);
  runGradeSourceResearch();
  runExposureWitnessDiagnostic();
  runCurrentPacketSourceDiagnostic();
  runExposureAbsenceDiagnostic();
  runLandingCaptureSourceRecipe();
}

// DISPOSABLE D3867 computed-source recipe. Plain data only: NOT a registered/sealed source.
function runLandingCaptureSourceRecipe() {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  const reading = (fen: string, landingSquare: SquareName) => {
    const position = positionFromFen(fen), square = parseSquare(landingSquare);
    if (square === undefined) throw new TypeError("invalid landing square");
    const captures = legalCaptureMovesTo(position, square).map(move => {
      const result = legalExchangeForMove(position, move);
      if (result === undefined) throw new Error("legal capture has no exchange result");
      return result;
    });
    return Object.freeze({ fen: canonicalFen(position), landingSquare, captures: Object.freeze(captures) });
  };
  for (const fixture of [
    { side: "white" as const, fen: "r3k3/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", move: "c5b6", count: 2 },
    { side: "black" as const, fen: "3k3r/8/8/8/5b2/6N1/6b1/3K3R b - - 0 1", move: "f4g3", count: 2 },
    { side: "white" as const, fen: "r3k3/1P6/1n6/2B5/8/8/8/R3K3 w - - 0 1", move: "c5b6", count: 5 },
    { side: "black" as const, fen: "3k3r/8/8/8/5b2/6N1/6p1/3K3R b - - 0 1", move: "f4g3", count: 5 },
  ]) {
    const run = play(importedRun(`landing:${fixture.side}:${fixture.count}`, fixture.side, fixture.fen), [fixture.move]);
    const root = run.nodes.find(node => node.parentId === null)!, child = run.nodes.find(node => node.parentId === root.id)!;
    const payloads = defenderExposureOperands(root.fen, child.moveUci!, child.fen);
    check(() => assert.equal(payloads.length, 1));
    const payload = payloads[0]!;
    check(() => assert.equal(payload.kind, "available"));
    const source = reading(passFen(child.fen)!, payload.target!.square);
    check(() => assert.equal(source.captures.length, fixture.count));
    check(() => assert.deepEqual(source.captures.filter(value => value.resultUnits > 0), payload.captures));
    check(() => assert(source.captures.every(value => value.beforeFen === source.fen && value.captureUci.slice(2, 4) === source.landingSquare)));
  }
  const negative = reading("r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a7");
  check(() => assert.equal(negative.captures.length, 1));
  check(() => assert(negative.captures[0]!.resultUnits < 0));
  const ep = reading("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2", "d6");
  check(() => assert.equal(ep.captures.length, 1));
  check(() => assert.equal(ep.captures[0]!.captureUci, "e5d6"));
  check(() => assert.equal(ep.captures[0]!.captured.square, "d5"));
  check(() => assert.deepEqual(reading("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "a4").captures, []));
  const computed = declarations.get("rules.exchange.reading.landing_captures@1")!;
  assert(computed, "bounded-accepted internal complete reading is now installed");
  const successor = declarations.get("derived.tactic.defender_exposure@2")!;
  const inputs = [parse("rules.square.event.control@1"), { id: computed.id, version: 1 }];
  assert(successor, "bounded-accepted internal exposure factory is now installed");
  const execution = compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, successor);
  check(() => assert.equal(execution.paths.length, 1));
  check(() => assert.deepEqual(execution.paths[0]!.derivationChoices.find(choice => choice.projection.id === successor.id)!.inputs, inputs));
  check(() => assert.deepEqual(execution.paths[0]!.sourceRequirements, []));
  check(() => assert.deepEqual([computed.grounding, computed.exactness, computed.confidence], ["declared_convention", "convention", "not_applicable"]));
  check(() => assert(declarations.has("derived.tactic.defender_exposure@2")));
  console.log(JSON.stringify({ scope: "DISPOSABLE D3867 calculation recipe and real internal source declarations, NOT public adoption or qualification proof",
    controls, sourcePairs: 4, positiveCaptureCounts: [2, 2, 5, 5], retainsNegative: true, enPassantPhysicalCapture: true,
    completeOldPositivePayloadParity: true, literalInputRefs: inputs.map(key), installedInternalReading: true,
    installedInternalExposure: true, publicExposureCutover: false, instrumentProductionChanges: 0 }));
}

// DISPOSABLE D3868 actual absence path; no corrected source, packet or learner operation.
function runExposureAbsenceDiagnostic() {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  for (const fixture of [
    { side: "white" as const, fen: "r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", move: "c5b6" },
    { side: "black" as const, fen: "3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1", move: "f4g3" },
  ]) {
    const run = play(importedRun(`exposure-absence:${fixture.side}`, fixture.side, fixture.fen), [fixture.move]);
    const root = run.nodes.find(node => node.parentId === null)!, child = run.nodes.find(node => node.parentId === root.id)!;
    const raw = defenderExposureOperands(root.fen, child.moveUci!, child.fen);
    check(() => assert.equal(raw.length, 1));
    check(() => assert.equal(raw[0]!.kind, "unavailable"));
    check(() => assert.equal(raw[0]!.reason, "invalid_turn_clone"));
    check(() => assert.deepEqual(invokeEvidenceValueRoute("derived.tactic.defender_exposure@1", { beforeFen: root.fen, moveUci: child.moveUci!, afterFen: child.fen }), []));
    const closure = localSemanticEventClosure(root.fen, child.moveUci!, child.fen);
    check(() => assert(!closure.abstentions.map(value => String(value.projection)).includes("derived.tactic.defender_exposure@1")));
    const packet = compileCandidatePopulation({ beforeFen: root.fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    check(() => assert.equal(packet.kind, "ready"));
    if (packet.kind !== "ready") throw new Error("actual exposure absence packet did not compile");
    const row = packet.receipt.packet.candidates.find(value => value.moveUci === child.moveUci)!;
    check(() => assert(row));
    check(() => assert(!row.abstentions.map(value => String(value.projection)).includes("derived.tactic.defender_exposure@1")));
  }
  const empty = play(importedRun("exposure-absence:real-empty", "white", "r3k3/8/1n6/2B5/8/8/8/4K3 w - - 0 1"), ["c5b6"]);
  const root = empty.nodes.find(node => node.parentId === null)!, child = empty.nodes.find(node => node.parentId === root.id)!;
  check(() => assert.deepEqual(defenderExposureOperands(root.fen, child.moveUci!, child.fen), []));
  check(() => assert.deepEqual(invokeEvidenceValueRoute("derived.tactic.defender_exposure@1", { beforeFen: root.fen, moveUci: child.moveUci!, afterFen: child.fen }), []));
  console.log(JSON.stringify({ scope: "DISPOSABLE D3868 actual unavailable-to-empty loss, NOT corrected source/consumer proof",
    controls, legalCheckingEdges: 2, helperUnavailable: 2, factoryEmpty: 2, packetAbstentionMissing: 2, realEmptyControls: 1, productionChanges: 0 }));
}

// DISPOSABLE D3866 active-path falsifier, not a corrected packet or Hint implementation.
function runCurrentPacketSourceDiagnostic() {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  const fen = "4k3/P7/8/8/8/8/8/4K3 b - - 0 1";
  const readings = candidateChildReadings(fen);
  for (const ref of ["derived.tactic.promotion_pressure@1", "derived.material.reading.role_signature@1"]) {
    const value = readings.find(reading => key(reading.projection) === ref)!;
    check(() => assert(value));
    check(() => assert.equal((value.payload as { readonly fen: string }).fen, fen));
    check(() => assert.equal(evidenceValueReceipt(value).sourceDigests.length, 0));
  }
  check(() => assert.equal(CANDIDATE_PACKET_COMPILER_VERSION, 1));
  check(() => assert.equal(key(HINT_DECLARATION_MATRIX.find(row => row.family === "promotion_pressure")!.source), "derived.tactic.promotion_pressure@1"));
  const material = localSemanticEvents("4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5", "4k3/8/4p3/3P4/8/8/8/4K3 b - - 0 1")
    .filter(event => event.projection.id === "derived.material.event.role_asymmetry");
  check(() => assert.equal(material.length, 1));
  check(() => assert.equal(key(material[0]!.projection), "derived.material.event.role_asymmetry@1"));
  console.log(JSON.stringify({ scope: "DISPOSABLE D3866 actual active packet/Hint source diagnostic, NOT successor/adoption proof",
    controls, activeCompiler: CANDIDATE_PACKET_COMPILER_VERSION, retainedOldReadings: 2, oldMaterialEvents: material.length,
    correctedSourceIssuers: 0, providerCalls: 0, productionChanges: 0 }));
}

// DISPOSABLE joint-review falsifier: actual current factories on a legal recorded edge.
function runExposureWitnessDiagnostic() {
  const fen = "r3k3/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1";
  const run = play(importedRun("joint-review-exposure", "white", fen), ["c5b6"]);
  const root = run.nodes.find(node => node.parentId === null)!, child = run.nodes.find(node => node.parentId === root.id)!;
  const exposures = localSemanticEvents(root.fen, child.moveUci!, child.fen)
    .filter(event => event.projection.id === "derived.tactic.defender_exposure");
  const multi = exposures.find(event => event.derivationInputs.filter(input => input.projection.id === "rules.exchange.predicate.legal_exchange").length > 1);
  assert(multi, "independent-review fixture must reach multiple real positive exchange witnesses");
  const declared = declarations.get("derived.tactic.defender_exposure@1")!.derivation!.inputs!;
  assert.equal(declared.length, 2);
  assert.equal(multi.derivationInputs.length, 3);
  assert.equal(evidenceValueReceipt(multi.evidence).sourceDigests.length, 3);
  assert.equal(multi.derivationInputs.filter(input => input.projection.id === "rules.exchange.predicate.legal_exchange").length, 2);
  assert.notDeepEqual(declared, multi.derivationInputs.map(input => input.projection));
  console.log(JSON.stringify({ scope: "DISPOSABLE actual defender-exposure literal-count falsifier, NOT successor/adoption proof",
    controls: 6, fen, move: child.moveUci, declaredInputs: declared.length, actualInputs: multi.derivationInputs.length,
    positiveExchangeWitnesses: 2, productionChanges: 0 }));
  let breadthControls = 0;
  const check = (test: () => void) => { test(); breadthControls++; };
  for (const fixture of [
    { id: "black-two", side: "black" as const, fen: "3k3r/8/8/8/5b2/6N1/6b1/3K3R b - - 0 1", move: "f4g3", captures: 2 },
    { id: "white-one", side: "white" as const, fen: "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", move: "c5b6", captures: 1 },
    { id: "white-none", side: "white" as const, fen: "r3k3/8/1n6/2B5/8/8/8/4K3 w - - 0 1", move: "c5b6", captures: 0 },
  ]) {
    const replay = play(importedRun(`exposure:${fixture.id}`, fixture.side, fixture.fen), [fixture.move]);
    const before = replay.nodes.find(node => node.parentId === null)!, after = replay.nodes.find(node => node.parentId === before.id)!;
    const events = localSemanticEvents(before.fen, after.moveUci!, after.fen).filter(event => event.projection.id === "derived.tactic.defender_exposure");
    check(() => assert.equal(events.length, fixture.captures === 0 ? 0 : 1));
    if (fixture.captures === 0) continue;
    const event = events[0]!;
    check(() => assert.deepEqual(event.derivationInputs.map(input => key(input.projection)), ["rules.square.event.control@1", ...Array.from({ length: fixture.captures }, () => "rules.exchange.predicate.legal_exchange@1")]));
    check(() => assert.deepEqual(evidenceValueReceipt(event.evidence).sourceDigests, event.derivationInputs.map(input => evidenceValueReceipt(input).payloadDigest)));
  }
  console.log(JSON.stringify({ scope: "DISPOSABLE D3867 actual witness breadth, NOT source successor or qualification",
    controls: breadthControls, cases: 3, bothColors: true, positiveCaptureCounts: [2, 1, 0], productionChanges: 0 }));
}

// DISPOSABLE D3841/D3859: inspect ALL current learner modules, not only the four previously
// named successor consumers. This is an inventory of exact refs/forms, NOT new bindings.
function runWholeCurrentModuleInventory(replacements: ReadonlyMap<string, string>) {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  const author = readFileSync("rfc/module-registration.md", "utf8");
  const detailRefs = [...author.matchAll(/^\| `(derived\.inspector\.detail\.[a-z_]+)` \|/gmu)].map(match => `${match[1]}@1`);
  check(() => assert.equal(detailRefs.length, 6));
  check(() => assert.equal(new Set(detailRefs).size, 6));
  const sequences = new Map<string, string>(SEQUENCE_SOURCE_REBASES.map(([before, after]) => [before.split("@")[0]!, after]));
  sequences.set("derived.exchange.trade_completed", "derived.exchange.trade_completed@2");
  const rows = EVIDENCE_MODULE_IDS.map(module => {
    const refs = MODULE_CONSUMER_ACCEPTS[module].map(key);
    const target = [...new Set(refs.filter(ref => module !== "review_map" || !["live.stockfish.eval@1", "live.stockfish.wdl@1"].includes(ref))
      .map(ref => ref === "derived.grade.move_quality@1" ? "derived.grade.move_quality@2"
        : ref === "derived.tactic.defender_exposure@1" ? "derived.tactic.defender_exposure@2"
        : module === "compare_coach" && ref === "derived.compare.engine_trajectory@1" ? "derived.compare.engine_trajectory@2"
          : module === "compare_coach" && ref === "derived.compare.piece_route@1" ? "derived.compare.piece_route@2"
          : sequences.get(ref.split("@")[0]!) ?? replacements.get(ref) ?? ref))];
    // Both changed families come from Hint's current matrix proposal, not an Inspector map.
    // Five other families/twenty-five rung refs keep their truthful source meaning@1.
    const proposed = module === "guided_hint" ? target.map(ref => /^derived\.hint\.disclosure\.(fork_survives_reply|promotion_pressure)\./u.test(ref)
      ? ref.replace(/@1$/u, "@2") : ref) : module === "full_inspector" ? [...target, ...detailRefs] : target;
    const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings.filter(binding => binding.consumer.id === `module.${module}`);
    check(() => assert.deepEqual(new Set(bindings.map(binding => key(binding.projection))), new Set(refs)));
    check(() => assert.equal(new Set(proposed).size, proposed.length));
    let baselineExecution: string;
    try { compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 1 }); baselineExecution = "compiled"; }
    catch (error) { assert(error instanceof EvidenceExecutionError); baselineExecution = `${error.code}: ${error.message}`; }
    return { module, baseline: refs.length, proposed: proposed.length,
      changed: refs.length !== proposed.length || refs.some((ref, i) => ref !== proposed[i]),
      changedPairs: refs.filter(ref => !proposed.includes(ref)),
      bindingRows: bindings.length, bindingForms: [...new Set(bindings.flatMap(binding => binding.forms))], baselineExecution,
    };
  });
  check(() => assert.equal(rows.reduce((total, row) => total + row.baseline, 0), 299));
  check(() => assert.equal(rows.reduce((total, row) => total + row.proposed, 0), 282));
  check(() => assert.deepEqual(EVIDENCE_MODULE_IDS.filter(module => MODULE_CONSUMER_ACCEPTS[module]
    .some(ref => key(ref) === "derived.tactic.defender_exposure@1")), ["threat_radar"]));
  check(() => assert.equal(rows.find(row => row.module === "guided_hint")!.changedPairs.length, 10));
  check(() => assert.deepEqual(rows.filter(row => row.changed).map(row => row.module),
    ["threat_radar", "postcommit_nudge", "guided_hint", "compare_coach", "review_map", "full_inspector"]));
  check(() => assert.match(rows.find(row => row.module === "compare_coach")!.baselineExecution, /EXECUTION_SOURCE_UNREGISTERED/u));
  const section = author.split("**D3841 exact-version closure — unaccepted current contract:**")[1]!.split("**Ordered exact acceptance.**")[0]!;
  const expected = rows.map(row => ({ module: row.module, version: row.changed ? 2 : 1, count: row.proposed,
    callable: row.module === "full_inspector" ? "compileInspectorSourcePage" : "compileModulePacket",
    disclosure: row.module === "guided_hint" ? "compileHintDisclosure@2" : "none" }));
  const assertImage = (text: string) => {
    const image = [...text.matchAll(/^\| ([a-z_]+) \| module\.\1@(\d+) \| ([^|]+) \| ([a-zA-Z]+) \| ([^|]+) \|$/gmu)]
      .map(match => ({ module: match[1], version: Number(match[2]), count: match[3]!.trim() === "65 topics plus six detail refs" ? 71 : Number(match[3]!.trim()), callable: match[4], disclosure: match[5]!.trim() }));
    assert.deepEqual(image, expected);
  };
  check(() => assertImage(section));
  const compareLine = section.split("\n").find(line => line.startsWith("| compare_coach |"))!;
  for (const mutated of [section.replace(compareLine, ""), `${section}\n${compareLine}`,
    section.replace("module.compare_coach@2", "module.compare_coach@1"),
    section.replace("module.threat_radar@2", "module.threat_radar@1"),
    section.replace("| 72 |", "| 74 |"),
    section.replace(compareLine, compareLine.replace("compileModulePacket", "compileInspectorSourcePage")),
    section.replace("compileHintDisclosure@2", "compileHintDisclosure@1")]) {
    check(() => assert.throws(() => assertImage(mutated)));
  }
  const oldTrajectory = declarations.get("derived.compare.engine_trajectory@1")!;
  check(() => assert.throws(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, oldTrajectory), /EXECUTION_SOURCE_UNREGISTERED/u));
  const candidate: ProjectionDeclaration = { ...oldTrajectory, version: 2, grounding: "declared_convention",
    payloadType: "DisposableComparisonEnginePoint", operands: ["nodeId", "plyOffset", "whiteScore", "engineId", "instrument", "bound"],
    dependsOn: [parse("derived.review.eval_point@1"), parse("recorded.engine.eval@1"), parse("run.record.position@1")],
    derivation: { anyOf: [[parse("derived.review.eval_point@1"), parse("run.record.position@1")],
      [parse("recorded.engine.eval@1"), parse("run.record.position@1")]] },
    semantics: "Disposable D3863 fixed point+position alternatives; no point source issuer or current consumer adoption.",
    disposition: { kind: "inspector_only", reason: "Disposable D3863 metadata only" } };
  const candidateManifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS,
    producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => producer.outputs.some(row => key(row) === key(oldTrajectory))
      ? { ...producer, outputs: [...producer.outputs, candidate] } : producer) });
  const execution = compileProjectionExecution(candidateManifest, candidate);
  check(() => assert.equal(execution.paths.length, 2));
  check(() => assert.equal(execution.paths.filter(path => path.sourceRequirements.some(source => source.providerOperation !== null)).length, 1));
  check(() => assert.deepEqual(candidate.derivation?.anyOf?.map(member => member.length), [2, 2]));
  check(() => assert.equal(declarations.has("derived.compare.engine_trajectory@2"), false));
  console.log(JSON.stringify({ scope: "DISPOSABLE D3841/D3859 ALL learner-module exact-ref inventory, NOT bindings/source/factory/adoption proof",
    modules: rows.length, controls, rows, proposedPairs: 282, literalTrajectoryExecutionPaths: execution.paths.length,
    newSourceIssuers: 0, currentConsumerBindings: 0, productionChanges: 0 }));
}

function runPrelaunchRetirementResearch(inspectorReplacements: ReadonlyMap<string, string>) {
  // Owner D3851 removes compatibility obligations, not detector families. Trade already has
  // its distinct recorded@2 path; it is not one of the ten proposed tuple-repaired@3 families.
  const families = new Map<string, string>(SEQUENCE_SOURCE_REBASES.map(([before, after]) => [before.split("@")[0]!, after]));
  families.set("derived.exchange.trade_completed", "derived.exchange.trade_completed@2");
  assert.equal(families.size, 11);
  let controls = 1;
  const rows = (["postcommit_nudge", "review_map", "full_inspector"] as const).map(module => {
    const current = MODULE_CONSUMER_ACCEPTS[module].map(key);
    const currentFamilies = new Set(current.filter(ref => families.has(ref.split("@")[0]!)).map(ref => ref.split("@")[0]!));
    const retiredScalarRefs = module === "review_map" ? ["live.stockfish.eval@1", "live.stockfish.wdl@1"] : [];
    const retained = current.filter(ref => !retiredScalarRefs.includes(ref));
    const replace = (ref: string) => ref === "derived.grade.move_quality@1" ? "derived.grade.move_quality@2"
      : families.get(ref.split("@")[0]!) ?? inspectorReplacements.get(ref) ?? ref;
    const mapped = retained.map(replace);
    const target = [...new Set(mapped)];
    const retiredNarrativeRefs = current.filter(ref => ref.endsWith("@1") && families.has(ref.split("@")[0]!));
    assert.equal(target.some(ref => ref.endsWith("@1") && families.has(ref.split("@")[0]!)), false); controls++;
    assert.deepEqual(new Set(target.filter(ref => families.has(ref.split("@")[0]!)).map(ref => ref.split("@")[0]!)), currentFamilies); controls++;
    assert.equal(target.filter(ref => families.has(ref.split("@")[0]!)).length, currentFamilies.size); controls++;
    assert.deepEqual(target.filter(ref => !families.has(ref.split("@")[0]!)),
      [...new Set(retained.filter(ref => !families.has(ref.split("@")[0]!)).map(replace))]); controls++;
    if (module === "review_map") {
      assert(current.includes("derived.review.eval_point@1") && current.includes("derived.review.wdl_point@1")); controls++;
      assert(target.includes("derived.review.eval_point@1") && target.includes("derived.review.wdl_point@1")); controls++;
      assert(retiredScalarRefs.every(ref => current.includes(ref) && !target.includes(ref))); controls++;
    }
    return { module, baseline: current.length, conditionalTarget: target.length, retainedSequenceFamilies: currentFamilies.size,
      retiredNarrativeRefs, retiredScalarRefs, duplicateRepresentationsRemoved: mapped.length - target.length,
      gradeStillUnresolved: target.includes("derived.grade.move_quality@2") };
  });
  assert.deepEqual(rows.map(row => row.conditionalTarget), [52, 72, 65]); controls++;
  console.log(JSON.stringify({ scope: "D3851 pre-launch family-preserving retirement inventory; NOT complete consumer bindings, source acceptance or production deletion",
    controls, rows, sourceIssuersImplemented: false, compatibilityRequired: false, productionChanges: 0 }));
}

function runGradeOperandResearch() {
  let pairedOutputs = 0, mixedSourceRefusals = 0;
  const sourceCombinations = new Set<string>(), declaredInputCounts = new Set<number>();
  const grade = declarations.get("derived.grade.move_quality@1")!;
  grade.derivation!.anyOf!.forEach(member => declaredInputCounts.add(member.length));
  assert.deepEqual([...declaredInputCounts], [2]);
  for (const mover of ["white", "black"] as const) {
    const run = play(importedRun(`d3859-grade-${mover}`, mover,
      `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${mover === "white" ? "w" : "b"} KQkq - 0 1`),
    [mover === "white" ? "e2e4" : "e7e5"]);
    const parent = run.nodes.find(node => node.parentId === null)!, child = run.nodes.find(node => node.parentId === parent.id)!;
    const edge = invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child });
    assert.equal(edge.payload.beforeFen, parent.fen); assert.equal(edge.payload.afterFen, child.fen);
    function inputs(fen: string, cp: number): readonly DeclaredEvidence<unknown>[] {
      const values = { fen, centipawns: cp, engineId: "synthetic", engineName: "Synthetic fixture (not an engine run)",
        engineVersion: "fixture", perspective: "white", depth: 12, requestedDepth: 12, multiPv: 1 };
      const ledger = invokeEvidenceValueRoute("sourcing.ledger.engine_eval@1", { record: {
        kind: "engine_eval", sourceId: "synthetic-report", retrievedAt: "2026-10-15T00:00:00.000Z", grounds: "machine_validation",
        anchor: { fen }, supports: [], values } });
      const recorded = invokeEvidenceValueRoute("recorded.engine.eval@1", { ledger });
      assert.equal(recorded.kind, "available");
      const packet = invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: { kind: "eval", source: "engine_validated", values } });
      return [recorded.value, packet];
    }
    const beforeInputs = inputs(parent.fen, mover === "white" ? 200 : -200);
    const afterInputs = inputs(child.fen, mover === "white" ? -200 : 200);
    for (const context of ["drill", "review", "imported_analysis"] as const) {
      for (const before of beforeInputs) for (const after of afterInputs) {
        const output = invokeEvidenceValueRoute("derived.grade.move_quality@1", { before, after, mover, context });
        sourceCombinations.add(`${key(before.projection)},${key(after.projection)}`);
        if (key(before.projection) !== key(after.projection)) {
          assert.deepEqual(output, { kind: "unavailable", reason: "unequal_instrument" });
          mixedSourceRefusals++;
          continue;
        }
        assert.equal(output.kind, "available"); assert.equal(output.value.length, 1);
        const value = output.value[0] as DeclaredEvidence<MoveQualityGrade>;
        assert.deepEqual(value.payload, moveQualityGrade(gradeReadingFromPayload(before.payload, mover),
          gradeReadingFromPayload(after.payload, mover === "white" ? "black" : "white"), context, mover));
        assert.equal(value.payload.lane, "recorded", "the old live-labelled wrapper does not establish live search origin");
        assert.deepEqual(evidenceValueReceipt(value).sourceDigests,
          [evidenceValueReceipt(before).payloadDigest, evidenceValueReceipt(after).payloadDigest]);
        pairedOutputs++;
      }
    }
  }
  assert.equal(sourceCombinations.size, 4); assert.equal(pairedOutputs, 12); assert.equal(mixedSourceRefusals, 12);
  console.log(JSON.stringify({ scope: "D3860 repaired accepted grade pairing over synthetic reports, NOT a new source/edge join or measured move quality",
    movers: 2, contexts: 3, pairedOutputs, mixedSourceRefusals, declaredInputCounts: [...declaredInputCounts], actualSealedInputCount: 2,
    sourceCombinations: [...sourceCombinations], allActualPayloadLanesRecorded: true,
    samePureGradingAlgorithm: true, newSourceAuthority: false, providerCalls: 0, productionChanges: 0 }));
}
