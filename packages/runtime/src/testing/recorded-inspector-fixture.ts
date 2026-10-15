/** Synthetic stored reports only: no engine/model execution or modern provider authority. */
import { INITIAL_FEN } from "chessops/fen";
import { attachEvidence } from "../evidence.js";
import { appendEvents } from "../events.js";
import { createRun } from "../runtime.js";
import { digestRunEventHead, digestRunEvidenceItem, resolveRunSubject } from "../run-subject.js";
import type { DrillRun, EvidenceAttachedEvent, EvidencePayload, OpponentSelection } from "../types.js";

export const RECORDED_INSPECTOR_AT = "2026-10-16T00:00:00.000Z";
export function recordedInspectorRun(targetElo?: number, id = "recorded-inspector-fixture"): DrillRun {
  return createRun({ id, session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common", ...(targetElo === undefined ? {} : { targetElo }) } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: RECORDED_INSPECTOR_AT });
}
export function recordedInspectorSubject(run: DrillRun, nodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId, headSeq = run.events.length) {
  return resolveRunSubject(run, { kind: "run_node", runId: run.id, eventHeadDigest: digestRunEventHead({ runId: run.id, headSeq, events: run.events }), nodeId, branchId });
}
export function recordedInspectorAttachment(payload: EvidencePayload, run = recordedInspectorRun()) {
  const updated = attachEvidence(run, run.activeCursor.nodeId, ["synthetic:recorded-report"], payload, RECORDED_INSPECTOR_AT).run;
  const resolved = recordedInspectorSubject(updated), event = updated.events.at(-1)! as EvidenceAttachedEvent;
  const itemDigest = digestRunEvidenceItem({ runId: updated.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: event.seq, event });
  return { run: updated, resolved, itemDigest, event };
}
export function recordedInspectorSelection(candidates: OpponentSelection["candidates"] = [{ moveUci: "e2e4", mass: 0.4, rank: 1 }], run = recordedInspectorRun(1450)) {
  const selection: OpponentSelection = { moveUci: "e2e4", policyModeApplied: "human_common", ...(candidates === undefined ? {} : { candidates }),
    engine: { id: "synthetic", name: "Synthetic recorded report", version: "fixture", seedHonored: false } };
  const updated = appendEvents(run, [{ type: "opponent.move_selected", at: RECORDED_INSPECTOR_AT,
    data: { nodeId: run.activeCursor.nodeId, branchId: run.activeCursor.branchId, moveUci: "e2e4", selection } }]);
  return { run: updated, resolved: recordedInspectorSubject(updated), eventSeq: updated.events.at(-1)!.seq, event: updated.events.at(-1)! };
}
