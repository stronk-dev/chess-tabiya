// DISPOSABLE D3859/D3861 source experiment. Actual existing source/reload/factory paths over
// synthetic UCI reports, NOT real engine measurements, a new source issuer or grade adoption.
import assert from "node:assert/strict";
import { attachEvidence } from "../../packages/runtime/src/evidence.js";
import { evidenceValueReceipt, compileEvidenceManifest, type DeclaredEvidence, type ProjectionDeclaration } from "../../packages/runtime/src/evidence-contract.js";
import { EVIDENCE_CONTRACT_DECLARATIONS } from "../../packages/runtime/src/evidence-catalog.js";
import { compileProjectionExecution } from "../../packages/runtime/src/evidence-execution.js";
import { invokeEvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { reviewDurableEngineStates } from "../../packages/runtime/src/review-evidence.js";
import { reviewPointComparability, type ReviewEnginePoint } from "../../packages/runtime/src/review-points.js";
import { importedRun, play, evaluationDelivery, attachDelivery, REVIEW_AT } from "../../packages/runtime/src/testing/review-evidence-fixture.js";
import type { StockfishPositionEvaluationRequest } from "../../packages/runtime/src/provider-types.js";
import type { EvidencePayload } from "../../packages/runtime/src/types.js";
import { validateManifest, validateLedger, linkage } from "../../apps/server/src/sourcing/ledger-validation.js";
import type { EvidenceLedger, SourceManifest, SourcingIssue } from "../../apps/server/src/sourcing/types.js";
import { moveQualityGrade, type GradeEvaluation } from "../../packages/runtime/src/grade.js";
import { moverWinPercent } from "../../packages/runtime/src/grade-reading.js";

export function runGradeSourceResearch() {
  let controls = 0;
  const check = (test: () => void) => { test(); controls++; };
  const bounds: readonly StockfishPositionEvaluationRequest["bound"][] = [
    { kind: "depth", requestedDepth: 12 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 500 },
  ];
  let modernPairs = 0, currentNodeBoundAbstentions = 0, mismatchRefusals = 0;
  for (const mover of ["white", "black"] as const) for (const bound of bounds) {
    let run = play(importedRun(`grade-modern-${mover}-${bound.kind}`, mover,
      `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${mover === "white" ? "w" : "b"} KQkq - 0 1`),
    [mover === "white" ? "e2e4" : "e7e5"]);
    const parent = run.nodes.find(node => node.parentId === null)!, child = run.nodes.find(node => node.parentId === parent.id)!;
    // Both raw UCI scores are mover-POV +200 before/-200 after. At the child the turn flips.
    run = attachDelivery(run, parent.id, evaluationDelivery(parent.fen, "cp 200", { bound }));
    run = attachDelivery(run, child.id, evaluationDelivery(child.fen, "cp 200", { bound }));
    const path = [parent, child];
    function points(source = run): readonly [DeclaredEvidence<ReviewEnginePoint>, DeclaredEvidence<ReviewEnginePoint>] {
      const states = reviewDurableEngineStates(source, path);
      function pointAt(node: typeof parent): DeclaredEvidence<ReviewEnginePoint> {
        const state = states.get(node.id); assert.equal(state?.kind, "delivered");
        if (state?.kind !== "delivered") throw new Error("real reload did not produce a sealed delivery");
        const position = invokeEvidenceValueRoute("run.record.position@1", { run: source, nodeId: node.id });
        const point = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: state.delivery, position });
        assert.equal(point.kind, "available");
        if (point.kind !== "available") throw new Error("genuine exact-FEN point refused");
        return point.value;
      }
      return [pointAt(parent), pointAt(child)];
    }
    const [before, after] = points(); modernPairs++;
    check(() => assert.equal(reviewPointComparability(before.payload, after.payload), "comparable"));
    check(() => assert.equal(before.payload.evaluation.payload.payload.bound.kind, bound.kind));
    const attachments = run.events.filter(event => event.type === "evidence.attached");
    check(() => assert.equal(attachments.length, 2));
    check(() => assert.deepEqual(attachments.map(event => event.data.nodeId), [parent.id, child.id]));
    const packetSource = (payload: EvidencePayload) => invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: payload });
    const grade = invokeEvidenceValueRoute("derived.grade.move_quality@1", {
      before: packetSource(attachments[0]!.data.payload), after: packetSource(attachments[1]!.data.payload), mover, context: "review",
    });
    if (bound.kind === "nodes") {
      check(() => assert.deepEqual(grade, { kind: "unavailable", reason: "unequal_instrument" })); currentNodeBoundAbstentions++;
    } else {
      check(() => { assert.equal(grade.kind, "available"); if (grade.kind === "available") assert.equal(grade.value.length, 1); });
    }
    // Current map retains a genuine delivered source over a later packet without a delivery.
    const scalar: EvidencePayload = { kind: "eval", source: "engine_validated", values: {
      centipawns: mover === "white" ? 999 : -999, perspective: "white", engineId: "unverified-scalar", requestedDepth: 12,
    } };
    const later = attachEvidence(run, child.id, ["unverified-synthetic-scalar"], scalar, REVIEW_AT).run;
    check(() => assert.equal(evidenceValueReceipt(points(later)[1].payload.evaluation).payloadDigest,
      evidenceValueReceipt(after.payload.evaluation).payloadDigest));
    // Whole-source mismatch controls use real source/factory paths, not copied point objects.
    for (const options of [{ bound, version: "20" }, { bound, generation: 2 },
      { bound: { kind: "depth" as const, requestedDepth: bound.kind === "depth" ? 13 : 12 } }]) {
      const changed = attachDelivery(run, child.id, evaluationDelivery(child.fen, "cp 200", options));
      const changedPoints = points(changed);
      check(() => assert.notEqual(reviewPointComparability(changedPoints[0].payload, changedPoints[1].payload), "comparable"));
      mismatchRefusals++;
    }
  }

  // Existing source manifests already retain the original profile and budget. This validates
  // ordinary parsed artifacts only; registry issuance, source-to-run joins and grade admission
  // remain unimplemented. No transcript/generation is invented for these offline reports.
  for (const budget of [{ depth: 12 }, { movetimeMs: 100 }] as const) {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const retrievedAt = "2026-10-15T00:00:00.000Z";
    const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [{ sourceId: "synthetic-offline", retrievedAt,
      origin: { kind: "engine", engineId: "synthetic", engineName: "Synthetic fixture", engineVersion: "fixture",
        profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget, fen, evidenceKind: "engine_eval" },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "synthetic test fixture, not an engine run" } }] };
    const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", sourcedAt: retrievedAt, records: [{ kind: "engine_eval",
      anchor: { fen }, sourceId: "synthetic-offline", retrievedAt, grounds: "machine_validation", supports: [],
      values: { fen, centipawns: 0, perspective: "white", depth: 12, multiPv: 1, engineId: "synthetic", engineName: "Synthetic fixture", engineVersion: "fixture" } }], abstentions: [] };
    const issues: SourcingIssue[] = [];
    const admittedManifest = validateManifest(manifest, issues), admittedLedger = validateLedger(ledger, issues);
    assert(admittedManifest && admittedLedger); linkage(admittedManifest, admittedLedger, issues);
    check(() => assert.deepEqual(issues, []));
    check(() => assert.deepEqual(admittedManifest.entries[0]!.origin, manifest.entries[0]!.origin));
  }

  // Disposable selection model only, NOT registry issuance. The returned-review counterexample
  // has A=X, B=Y then X, C=Y: searching eligible pairs would give B two different graph scores.
  type Endpoint = { readonly origin: "provider" | "ledger"; readonly instrument: string; readonly cp: number };
  const select = (records: readonly Endpoint[]): Endpoint | undefined => records[0];
  const compatible = (a: Endpoint | undefined, b: Endpoint | undefined) =>
    a !== undefined && b !== undefined && a.origin === b.origin && a.instrument === b.instrument;
  const a: Endpoint = { origin: "ledger", instrument: "X", cp: 100 };
  const by: Endpoint = { origin: "ledger", instrument: "Y", cp: 20 };
  const bx: Endpoint = { origin: "ledger", instrument: "X", cp: -200 };
  const c: Endpoint = { origin: "ledger", instrument: "Y", cp: 0 };
  const selectedB = select([by, bx]);
  check(() => assert.equal(selectedB, by));
  check(() => assert.equal(compatible(a, selectedB), false));
  check(() => assert.equal(compatible(selectedB, c), true));
  check(() => assert.equal(select([by, bx]), selectedB));
  check(() => assert.equal(compatible(selectedB, undefined), false));
  check(() => assert.equal(selectedB?.cp, 20)); // point survives unavailable pair
  check(() => assert.equal(compatible(selectedB, { ...by, origin: "provider" }), false));
  // Existing pure arithmetic, not a new grade@2 implementation: source comparability alone
  // cannot authorize an accuracy drop. An available silent grade is a different state.
  const reading = (score: GradeEvaluation["score"]): GradeEvaluation => ({ lane: "recorded", perspective: "white",
    engineId: "synthetic", depth: 12, sideToMove: "white", score });
  check(() => assert.deepEqual(moveQualityGrade(reading({ kind: "mate", movesTo: -2 }),
    reading({ kind: "cp", value: 0 }), "review", "white"), { abstained: true, reason: "mate_score_inconsistent" }));
  check(() => assert.equal(moveQualityGrade(reading({ kind: "cp", value: 0 }),
    reading({ kind: "cp", value: 0 }), "review", "white"), undefined));
  check(() => assert.equal(moverWinPercent(reading({ kind: "mate", movesTo: 2 }), "white"), 100));
  check(() => assert.equal(moverWinPercent(reading({ kind: "mate", movesTo: -2 }), "white"), 0));

  // Feasibility of the complete literal pair+edge source alternatives under unchanged F1.
  // This declaration is disposable and is NOT registered in production or source-qualified.
  const ref = (id: string) => ({ id, version: 1 });
  const old = EVIDENCE_CONTRACT_DECLARATIONS.producers.flatMap(producer => producer.outputs).find(row => row.id === "derived.grade.move_quality")!;
  const candidate: ProjectionDeclaration = { ...old, version: 2, grounding: "declared_convention",
    dependsOn: [ref("derived.review.eval_point"), ref("recorded.engine.eval"), ref("run.record.edge")],
    derivation: { anyOf: [[ref("derived.review.eval_point"), ref("derived.review.eval_point"), ref("run.record.edge")],
      [ref("recorded.engine.eval"), ref("recorded.engine.eval"), ref("run.record.edge")]] },
    disposition: { kind: "inspector_only", reason: "Disposable D3859 paired-source declaration only, not accepted or implemented" } };
  const manifest = compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer =>
    producer.id === "derived.grade" ? { ...producer, outputs: [...producer.outputs, candidate] } : producer) });
  const compiled = compileProjectionExecution(manifest, { id: candidate.id, version: 2 });
  check(() => assert.equal(compiled.paths.length, 2));
  check(() => assert.equal(compiled.paths.filter(path => path.sourceRequirements.some(source => source.providerOperation !== null)).length, 1));
  console.log(JSON.stringify({ scope: "D3859/D3861 existing modern reload and offline instrument feasibility, NOT new grade/source/access/consumer delivery",
    controls, modernPairs, currentNodeBoundAbstentions, mismatchRefusals, literalExecutionPaths: compiled.paths.length,
    reviewReturnControls: 11,
    realEngineMeasurements: 0, newSourceIssuers: 0, productionChanges: 0 }));
}
