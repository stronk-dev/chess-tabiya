/** Synthetic historical numbers only; no engine execution or qualification. */
import { attachEvidence } from "../evidence.js";
import { invokeEvidenceValueRoute } from "../internal/evidence-value-routes.js";
import { createRecordedComparisonSource } from "../recorded-comparison.js";
import { digestRunEvidenceItem } from "../run-subject.js";
import type { DrillRun, EvidenceAttachedEvent, EvidencePayload } from "../types.js";
import { recordedComparisonFixture, RECORDED_COMPARISON_AT } from "./recorded-comparison-fixture.js";
import { recordedInspectorSubject } from "./recorded-inspector-fixture.js";

export function recordedComparisonEvalPacket(run: DrillRun, event: EvidenceAttachedEvent, branchId: string) {
  const resolved = recordedInspectorSubject(run, event.data.nodeId, branchId);
  const itemDigest = digestRunEvidenceItem({ runId: run.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: event.seq, event });
  return invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved, itemDigest });
}
interface Report {
  readonly nodeIndex: number;
  readonly column?: "main" | "peer";
  readonly values: Readonly<Record<string, unknown>>;
  readonly source?: EvidencePayload["source"];
}
export function recordedComparisonEvalFixture(reports: readonly Report[] = [
  { nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values: { centipawns: 150 } },
], black = false, id = "recorded-comparison-eval") {
  const base = recordedComparisonFixture(black, id);
  let run = base.run;
  const events: EvidenceAttachedEvent[] = [];
  for (const report of reports) {
    const path = report.column === "peer" ? base.peerPath : base.mainPath;
    run = attachEvidence(run, path[report.nodeIndex]!.id, ["synthetic:historical-eval"],
      { kind: "eval", source: report.source ?? "engine_validated", values: report.values }, RECORDED_COMPARISON_AT).run;
    events.push(run.events.at(-1)! as EvidenceAttachedEvent);
  }
  return { ...base, run, events, comparison: createRecordedComparisonSource({ run, columns: base.columns }),
    packets: events.map((event, index) => recordedComparisonEvalPacket(run, event, reports[index]!.column === "peer" ? base.peer : base.main)) };
}
