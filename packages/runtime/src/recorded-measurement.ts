// Accepted module-registration §4.11a: original position identity and the exact two-step
// historical report invocation. Neither operation issues a registry source or current access.
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { EvidenceValueRouteLookupError, invokeEvidenceValueRoute, readRecordedPositionInvocation, readRecordedReadingInvocation } from "./internal/evidence-value-routes.js";
import type { EvidenceAvailability } from "./evidence-factories.js";
import type { SourcingLedgerRecord } from "./recorded-reading.js";
import type { RecordedPosition } from "./review-points.js";
import type { RecordedReading } from "./voice.js";

/** The original sole-factory run/head/node/pin, not a caller's equal FEN or pack argument. */
export function recordedMeasurementPosition(position: DeclaredEvidence<RecordedPosition>) {
  return readRecordedPositionInvocation(position);
}

export class RecordedMeasurementInvocationError extends TypeError {
  constructor(readonly reason: "source_contract_invalid" | "source_lookup_failed", cause: unknown) {
    super(cause instanceof Error ? cause.message : "Recorded measurement invocation failed", { cause });
    this.name = "RecordedMeasurementInvocationError";
  }
}

/** Preserve the actual intermediate ledger item and refusal; the old optional API drops both. */
export function invokeRecordedMeasurementReading(record: SourcingLedgerRecord): Readonly<{
  ledger: DeclaredEvidence<SourcingLedgerRecord>;
  result: EvidenceAvailability<DeclaredEvidence<RecordedReading>>;
}> {
  try { return invokeReading(record); }
  catch (cause) { throw new RecordedMeasurementInvocationError(cause instanceof EvidenceValueRouteLookupError ? "source_lookup_failed" : "source_contract_invalid", cause); }
}

function invokeReading(record: SourcingLedgerRecord) {
  if (record.kind !== "engine_eval" && record.kind !== "tablebase_result") throw new TypeError("Recorded measurement requires an exact engine/tablebase record kind");
  const engine = record.kind === "engine_eval";
  const ledger = engine ? invokeEvidenceValueRoute("sourcing.ledger.engine_eval@1", { record })
    : invokeEvidenceValueRoute("sourcing.ledger.tablebase_result@1", { record });
  const result = engine ? invokeEvidenceValueRoute("recorded.engine.eval@1", { ledger })
    : invokeEvidenceValueRoute("recorded.tablebase.result@1", { ledger });
  const invocation = readRecordedReadingInvocation(result);
  if (ledger.payload !== record || invocation.ledger !== ledger || invocation.route !== (engine ? "recorded.engine.eval@1" : "recorded.tablebase.result@1") || (result.kind === "available"
    && (evidenceValueReceipt(result.value).sourceDigests.length !== 1
      || evidenceValueReceipt(result.value).sourceDigests[0] !== evidenceValueReceipt(ledger).payloadDigest))) {
    throw new TypeError("Recorded measurement lost its original ledger/reading lineage");
  }
  if (result.kind === "unavailable" && result.reason !== "ledger_record_not_admitted") throw new TypeError("Recorded measurement has an unexpected factory outcome");
  return Object.freeze({ ledger, result: result as EvidenceAvailability<DeclaredEvidence<RecordedReading>> });
}
