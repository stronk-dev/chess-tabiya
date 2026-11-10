/** Synthetic source/receipt controls, not a service grant or chess qualification. */
import { compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, MODULE_SOURCE_AUTHORITY, serverAvailabilityFromProviders } from "../assistance-exchange.js";
import { compileEvidenceConsumerExecutionV2 } from "../evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import { collectRecordedEngineAttachments, collectRecordedEngineEdge, readRecordedEngineAttachments } from "../internal/recorded-engine-attachments.js";
import { RECORDED_GRADE_SOURCE_AUTHORITY, type RecordedGradeCapture } from "../recorded-grade-source.js";
import { createRecordedReviewBoundarySourceOwner } from "../recorded-review-boundary.js";
import { attachDelivery, evaluationDelivery, REVIEW_AT, type DeliveryOptions } from "./review-evidence-fixture.js";
import { evidenceDigest } from "../evidence-contract.js";
import { commitMove, createRun } from "../runtime.js";
import { branchPath } from "../branch-path.js";
import type { EvidenceRole } from "../evidence-contract.js";
import type { DrillRun } from "../types.js";
import type { RecordedGradeSource } from "../recorded-grade-source.js";
import { RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY, REVIEW_LEDGER_REFS, type RecordedReviewLedgerSource } from "../recorded-review-ledger.js";
import { invokeEvidenceValueRoute } from "../internal/evidence-value-routes.js";
import type { RecordedReviewObjectives } from "../evidence-factories.js";
type ReviewFixtureSources = Readonly<{ recordedGrades: ReadonlyMap<string, RecordedGradeSource>; recordedMeasurements: RecordedReviewLedgerSource; recordedObjectives: RecordedReviewObjectives }>;
const reviewPopulations = new WeakMap<DrillRun, Map<string, ReviewFixtureSources>>();
let reviewExecution: ReturnType<typeof compileEvidenceConsumerExecutionV2> | undefined;

/** Full genuine runtime source population for a synthetic recorded fixture. This does not
 * stand in for RunService's actual access checks, which have their own service tests. */
export function recordedReviewGradeSources(run: DrillRun, branchId = run.activeCursor.branchId,
  role: EvidenceRole = "learner", session: string = run.sessionKind): ReadonlyMap<string, RecordedGradeSource> {
  return recordedReviewFixtureSources(run, branchId, role, session).recordedGrades;
}

/** No registry is installed in this synthetic runtime fixture. The actual source reports absence,
 * not an enumerated zero population. Real registry/access/delivery controls live in server tests. */
export function recordedReviewFixtureSources(run: DrillRun, branchId = run.activeCursor.branchId,
  role: EvidenceRole = "learner", session: string = run.sessionKind): ReviewFixtureSources {
  const key = JSON.stringify([branchId, role, session]), owned = reviewPopulations.get(run) ?? new Map<string, ReviewFixtureSources>();
  reviewPopulations.set(run, owned);
  const previous = owned.get(key); if (previous !== undefined) return previous;
  const mainline = branchPath(run, run.branches[0]!.id);
  const movetextDigest = `sha256:${evidenceDigest({ rootFen: mainline[0]!.fen, uci: mainline.slice(1).map(node => node.moveUci) })}`;
  const path = branchPath(run, branchId);
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => run.sessionKind === "imported"
    ? { runId: run.id, result: "*", movetextDigest } : undefined });
  const boundary = owner.resolve({ runId: run.id, branchId, throughNodeId: path.at(-1)!.id });
  const attachments = collectRecordedEngineAttachments({ boundary }), rows = readRecordedEngineAttachments(attachments).rows;
  const permission = { principal: { learnerId: "__legacy", handle: "__legacy" }, role, session, timing: "review" as const, assistance: null,
    execution: reviewExecution ??= compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 }) };
  const signal = new AbortController().signal;
  const result = new Map(path.slice(1).map((node, index) => [node.id, RECORDED_GRADE_SOURCE_AUTHORITY.issue({ permission, signal,
    before: { attachments, nodeId: path[index]!.id, offline: null, pending: null },
    after: { attachments, nodeId: node.id, offline: null, pending: null }, edge: collectRecordedEngineEdge(attachments, node.id),
    origins: [rows[index]!.selected === null ? null : "provider_delivery", rows[index + 1]!.selected === null ? null : "provider_delivery"] },
    () => { owner.assertCurrent(boundary); })]));
  const recordedMeasurements = RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ boundary, permission, signal,
    rows: rows.map(row => ({ position: row.position, slots: REVIEW_LEDGER_REFS.map(projection => ({ projection,
      source: { kind: "unavailable" as const, reason: "source_absent" as const } })) })) }, () => { owner.assertCurrent(boundary); });
  const recordedObjectives = Object.freeze({ boundary, items: invokeEvidenceValueRoute("run.record.objective_transition@2", { recordedReview: boundary }) });
  const sources = Object.freeze({ recordedGrades: result, recordedMeasurements, recordedObjectives });
  owned.set(key, sources); return sources;
}

export function recordedGradeFixture(options: { readonly black?: boolean; readonly timing?: "post_commit" | "review";
  readonly workflow?: "position" | "imported"; readonly before?: string | null; readonly after?: string | null; readonly budget?: DeliveryOptions } = {}) {
  const black = options.black ?? false, timing = options.timing ?? "review", side: "white" | "black" = black ? "black" : "white";
  const workflow = options.workflow ?? "position", start = { fen: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${black ? "b" : "w"} KQkq - 0 1`, side };
  const movetextDigest = `sha256:${evidenceDigest({ rootFen: start.fen, uci: [black ? "e7e5" : "e2e4"] })}`;
  const base = { start, feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } };
  const session = workflow === "imported" ? { ...base, kind: "imported" as const, movetextDigest } : { ...base, kind: "position" as const };
  let current = createRun({ id: `recorded-grade-${side}`, session,
    sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: REVIEW_AT });
  current = commitMove(current, black ? "e7e5" : "e2e4", { at: REVIEW_AT }).run;
  const parent = current.nodes[0]!, child = current.nodes[1]!;
  if (options.before !== null) current = attachDelivery(current, parent.id, evaluationDelivery(parent.fen, options.before ?? "cp 100", options.budget));
  if (options.after !== null) current = attachDelivery(current, child.id, evaluationDelivery(child.fen, options.after ?? "cp 100", options.budget));
  const original = current;
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => current, loadImportRecord: () => workflow === "imported" ? { runId: current.id, result: "*", movetextDigest } : undefined });
  const boundary = owner.resolve({ runId: current.id, branchId: current.activeCursor.branchId, throughNodeId: child.id });
  const attachments = collectRecordedEngineAttachments({ boundary }), signal = new AbortController();
  const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "external", llm: "external", corpus: "external", tts: "external", tablebase: "external" });
  const request = compileAssistanceRequest({ contextHint: workflow, preference: { kind: "explicit", preset: timing === "post_commit" ? "guided" : "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(request, {
    origin: { kind: "run", sessionKind: workflow, feedbackPolicy: "attempt_end" },
    access: { deliveryOpen: true, role: "solo", seatedInContest: false, reviewing: true }, availability,
  }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  const module = timing === "post_commit" ? "postcommit_nudge" : "review_map";
  const capture: RecordedGradeCapture = { permission: { principal: { learnerId: "__legacy", handle: "__legacy" }, role: "learner", assistance,
    timing, session: workflow, execution: compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 2 }) },
    before: { attachments, nodeId: parent.id, offline: null, pending: null }, after: { attachments, nodeId: child.id, offline: null, pending: null },
    edge: collectRecordedEngineEdge(attachments, child.id), origins: [options.before === null ? null : "provider_delivery", options.after === null ? null : "provider_delivery"], signal: signal.signal };
  const assertCurrent = () => { owner.assertCurrent(boundary); };
  return { run: original, parent, child, signal, capture, assertCurrent, source: RECORDED_GRADE_SOURCE_AUTHORITY.issue(capture, assertCurrent),
    replaceRun: (run: typeof current) => { current = run; } };
}
