// DISPOSABLE D3859 complete module execution research. Existing declarations/compiler only;
// proposed Inspector rebase rows are an inventory aid, NOT new module bindings or source proof.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MODULE_CONSUMER_ACCEPTS, PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { compileProjectionExecution, EvidenceExecutionError } from "../../packages/runtime/src/evidence-execution.js";
import { compileEvidenceConsumerExecution } from "../../packages/runtime/src/evidence-binding-execution.js";
import type { VersionedEvidenceId } from "../../packages/runtime/src/evidence-contract.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { importedRun, play } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import { moveQualityGrade, type MoveQualityGrade } from "../../packages/runtime/src/grade.js";
import { gradeReadingFromPayload } from "../../packages/runtime/src/grade-reading.js";
import { SEQUENCE_SOURCE_REBASES } from "./recorded-sequence-contract.js";

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
  check(() => assert.deepEqual(members.map(member => member.map(key)), [["recorded.engine.eval@1"], ["live.stockfish.eval@1"]]));
  check(() => assert.throws(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, grade), /EXECUTION_SOURCE_UNREGISTERED/u));
  const counterfactual = { ...PRIMARY_EVIDENCE_MANIFEST,
    projections: PRIMARY_EVIDENCE_MANIFEST.projections.map(row => row === grade ? { ...row, derivation: { inputs: members[0]! } } : row) };
  const recordedOnly = compileProjectionExecution(counterfactual, grade);
  check(() => assert.equal(recordedOnly.paths.length, 1));
  check(() => assert.deepEqual(grade.derivation?.anyOf?.map(member => member.map(key)), [["recorded.engine.eval@1"], ["live.stockfish.eval@1"]]));
  console.log(JSON.stringify({ scope: "D3859 current complete module/ref/source census; conditional Inspector mapping is NOT new module authority/adoption",
    controls, rows, counterfactualDroppingLiveGradeCompiles: true, oldDeclarationsChanged: false, providerCalls: 0, productionChanges: 0 }));
  runGradeOperandResearch();
  runPrelaunchRetirementResearch(replacements);
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
    const mapped = current.map(ref => families.get(ref.split("@")[0]!) ?? inspectorReplacements.get(ref) ?? ref);
    const target = [...new Set(mapped)];
    const retiredNarrativeRefs = current.filter(ref => ref.endsWith("@1") && families.has(ref.split("@")[0]!));
    assert.equal(target.some(ref => ref.endsWith("@1") && families.has(ref.split("@")[0]!)), false); controls++;
    assert.deepEqual(new Set(target.filter(ref => families.has(ref.split("@")[0]!)).map(ref => ref.split("@")[0]!)), currentFamilies); controls++;
    assert.equal(target.filter(ref => families.has(ref.split("@")[0]!)).length, currentFamilies.size); controls++;
    assert.deepEqual(target.filter(ref => !families.has(ref.split("@")[0]!)),
      [...new Set(current.filter(ref => !families.has(ref.split("@")[0]!)).map(ref => inspectorReplacements.get(ref) ?? ref))]); controls++;
    return { module, baseline: current.length, conditionalTarget: target.length, retainedSequenceFamilies: currentFamilies.size,
      retiredNarrativeRefs, duplicateRepresentationsRemoved: mapped.length - target.length,
      gradeStillUnresolved: target.includes("derived.grade.move_quality@1") };
  });
  assert.deepEqual(rows.map(row => row.conditionalTarget), [52, 74, 65]); controls++;
  console.log(JSON.stringify({ scope: "D3851 pre-launch family-preserving retirement inventory; NOT complete consumer bindings, source acceptance or production deletion",
    controls, rows, sourceIssuersImplemented: false, compatibilityRequired: false, productionChanges: 0 }));
}

function runGradeOperandResearch() {
  let pairedOutputs = 0, mixedSourceOutputs = 0;
  const sourceCombinations = new Set<string>(), declaredInputCounts = new Set<number>();
  const grade = declarations.get("derived.grade.move_quality@1")!;
  grade.derivation!.anyOf!.forEach(member => declaredInputCounts.add(member.length));
  assert.deepEqual([...declaredInputCounts], [1]);
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
        assert.equal(output.kind, "available"); assert.equal(output.value.length, 1);
        const value = output.value[0] as DeclaredEvidence<MoveQualityGrade>;
        assert.deepEqual(value.payload, moveQualityGrade(gradeReadingFromPayload(before.payload, mover),
          gradeReadingFromPayload(after.payload, mover === "white" ? "black" : "white"), context, mover));
        assert.equal(value.payload.lane, "recorded", "the old live-labelled wrapper does not establish live search origin");
        assert.deepEqual(evidenceValueReceipt(value).sourceDigests,
          [evidenceValueReceipt(before).payloadDigest, evidenceValueReceipt(after).payloadDigest]);
        sourceCombinations.add(`${key(before.projection)},${key(after.projection)}`);
        if (key(before.projection) !== key(after.projection)) mixedSourceOutputs++;
        pairedOutputs++;
      }
    }
  }
  assert.equal(sourceCombinations.size, 4); assert.equal(pairedOutputs, 24); assert.equal(mixedSourceOutputs, 12);
  console.log(JSON.stringify({ scope: "D3859 actual old grade factory pairs over synthetic reports, NOT a new paired source/edge join or measured move quality",
    movers: 2, contexts: 3, pairedOutputs, mixedSourceOutputs, declaredInputCounts: [...declaredInputCounts], actualSealedInputCount: 2,
    sourceCombinations: [...sourceCombinations], allActualPayloadLanesRecorded: true,
    samePureGradingAlgorithm: true, newSourceAuthority: false, providerCalls: 0, productionChanges: 0 }));
}
