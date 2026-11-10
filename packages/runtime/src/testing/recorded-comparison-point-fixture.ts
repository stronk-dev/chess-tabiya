/** Synthetic authority/receiver fixture. Not chess qualification or a service permission. */
import { compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, serverAvailabilityFromProviders } from "../assistance-exchange.js";
import { compileEvidenceConsumerExecutionV2 } from "../evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { collectRecordedEngineAttachments } from "../internal/recorded-engine-attachments.js";
import { createRecordedComparisonSource, recordedComparisonColumnsForSubject, recordedComparisonData } from "../recorded-comparison.js";
import { RECORDED_COMPARISON_POINT_AUTHORITY, type RecordedComparisonPermission, type RecordedComparisonPointCapture } from "../recorded-comparison-point.js";
import { createRecordedReviewBoundarySourceOwner } from "../recorded-review-boundary.js";
import { recordedComparisonFixture } from "./recorded-comparison-fixture.js";
import { attachDelivery, evaluationDelivery } from "./review-evidence-fixture.js";
import type { FinalizedAssistanceV1 } from "../assistance-exchange.js";
import type { DrillRun } from "../types.js";
import type { EvidenceRole } from "../evidence-contract.js";

export function comparisonAssistance(timing: "checkpoint" | "review" = "review") {
  const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
  const request = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(request, {
    origin: { kind: "run", sessionKind: "position", feedbackPolicy: "attempt_end" },
    access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: true }, availability,
  }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  const permission: RecordedComparisonPermission = { principal: { learnerId: "__legacy", handle: "__legacy" }, role: "learner", assistance, timing,
    execution: compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.compare_coach", version: 2 }) };
  return permission;
}

export function recordedComparisonPointFixture(black = false, score = "cp 25", options: Parameters<typeof evaluationDelivery>[2] = {}) {
  const fixture = recordedComparisonFixture(black);
  const node = fixture.peerPath.at(-1)!;
  const run = attachDelivery(fixture.run, node.id, evaluationDelivery(node.fen, score, options));
  const comparison = createRecordedComparisonSource({ run, columns: fixture.columns });
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
  const boundary = owner.resolve({ runId: run.id, branchId: fixture.peer, throughNodeId: node.id });
  const attachments = collectRecordedEngineAttachments({ boundary });
  const controller = new AbortController();
  const capture: RecordedComparisonPointCapture = { comparison, branchId: fixture.peer, nodeId: node.id, permission: comparisonAssistance(), attachments, offline: null, pending: null, signal: controller.signal };
  const assertCurrent = () => { owner.assertCurrent(boundary); };
  return { ...fixture, run, comparison, controller, capture, assertCurrent, source: RECORDED_COMPARISON_POINT_AUTHORITY.issue(capture, assertCurrent) };
}

/** Genuine runtime operands; production additionally obtains current service grants. */
export function comparisonSourcesForRun(run: DrillRun, assistance: FinalizedAssistanceV1, nodeId: string, timing: "checkpoint" | "review" = "checkpoint", role: EvidenceRole = "learner") {
  const columns = recordedComparisonColumnsForSubject(run, nodeId);
  if (columns === undefined) throw new Error("Fixture requires two attempts");
  const comparison = createRecordedComparisonSource({ run, columns }), data = recordedComparisonData(comparison);
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
  const boundary = owner.resolve({ runId: run.id, branchId: columns[1].branchId, throughNodeId: columns[1].throughNodeId });
  const attachments = collectRecordedEngineAttachments({ boundary }), permission = { ...comparisonAssistance(timing), assistance, role };
  const path = data.authority.paths[1], span = path.slice(path.findIndex(entry => entry.node.id === data.authority.forkNodeId));
  return { comparison, points: span.map(({ node }) => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ comparison, branchId: columns[1].branchId,
    nodeId: node.id, permission, attachments, offline: null, pending: null, signal: new AbortController().signal }, () => { owner.assertCurrent(boundary); })) };
}
