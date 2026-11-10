// Exact historical consumer. Acquisition stays with the actual server clock owner.
import { compileEvidenceConsumerExecution } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, evidenceDigest, type CompiledEvidenceManifest, type DeclaredEvidence } from "./evidence-contract.js";
import { originalRecordedClockValueInput as readRecordedClockInvocation } from "./internal/evidence-value-routes.js";
import { readContextualFoundationOccurrence } from "./recorded-foundation-occurrence.js";
import { presentEvidenceItems, serializePresentedEvidence } from "./presentation-contract.js";
import { presentationWordCount } from "./presentation-word-count.js";
import { parseRecordedClockReading, parseRecordedClockDecision } from "./recorded-clock-presentation.js";
import type { collectRecordedClockValues } from "./recorded-clock-values.js";
import type { RecordedClockReading, RecordedClockDecision } from "./recorded-clock-operands.js";
import { recordedClockUseOperands } from "./recorded-clock-operands.js";

export const RECORDED_CLOCK_CONSUMER = Object.freeze({ id: "review.recorded_clock", version: 1 });
export function preflightRecordedClockConsumer(manifest: CompiledEvidenceManifest = PRIMARY_EVIDENCE_MANIFEST): void {
  const declaration = manifest.consumers.find(row => row.id === RECORDED_CLOCK_CONSUMER.id && row.version === 1);
  if (declaration?.disposition !== undefined) throw new TypeError("Recorded clock consumer is disabled");
  const execution = compileEvidenceConsumerExecution(manifest, RECORDED_CLOCK_CONSUMER);
  const expected = new Set(["run.record.clock_reading", "run.record.clock_decision"]);
  if (execution.bindings.length !== 2 || execution.bindings.some(({ binding, sourceAbsence }) =>
    !expected.delete(binding.projection.id) || binding.projection.version !== 1
    || binding.producer.id !== "run.record" || binding.producer.version !== 1
    || binding.timing.length !== 1 || binding.timing[0] !== "review"
    || binding.budget.maxFacts !== 2 || binding.budget.maxForms !== 1
    || sourceAbsence?.necessity !== "optional" || sourceAbsence.whenNoPath !== "omit_optional_item"
    || binding.answerContent.length !== 1 || binding.answerContent[0] !== "fact"
    || binding.forms.length !== 2 || !binding.forms.includes("panel") || !binding.forms.includes("sentence"))) {
    throw new TypeError("Recorded clock requires its complete exact historical consumer binding before source acquisition");
  }
}

/** An available decision can enter only through its actual private occurrence reader. */
export function consumeRecordedClockEvidence(collection: ReturnType<typeof collectRecordedClockValues>) {
  preflightRecordedClockConsumer();
  const invocation = readRecordedClockInvocation(collection.reading);
  if (collection.reading.projection.id !== "run.record.clock_reading" || collection.reading.projection.version !== 1) throw new TypeError("Expected the original clock reading factory");
  const reading = parseRecordedClockReading(collection.reading.payload, "original clock reading");
  const values: DeclaredEvidence<unknown>[] = [collection.reading];
  let use: Readonly<{ kind: "available"; value: RecordedClockDecision }> | Exclude<typeof collection.decision, { kind: "available" }>;
  if (collection.decision.kind === "available") {
    const owned = readContextualFoundationOccurrence(collection.decision.occurrence);
    const decisionInvocation = readRecordedClockInvocation(owned.value);
    const value = parseRecordedClockDecision(owned.value.payload, "original clock use");
    if (decisionInvocation.source !== invocation.source || evidenceDigest(reading.subject) !== evidenceDigest(value.subject)
      || owned.image.actorClass !== "imported" || owned.image.actorSide !== reading.original.side
      || value.decision.nodeId !== reading.original.beforeNodeId || value.decision.eventSeq !== reading.original.eventSeq
      || value.decision.beforeFen !== reading.original.beforeFen || value.current.remainingMs !== (reading.sample.kind === "available" ? reading.sample.sample.remainingMs : undefined)) throw new TypeError("Clock decision occurrence crosses its exact reading/source/actor");
    values.push(owned.value); use = Object.freeze({ kind: "available", value });
  } else {
    const actual = recordedClockUseOperands(invocation.source);
    if (actual.kind !== "unavailable" || actual.reason !== collection.decision.reason) throw new TypeError("Clock use abstention is not its actual original source result");
    use = Object.freeze({ ...collection.decision });
  }
  const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, RECORDED_CLOCK_CONSUMER, values);
  if (view.items.length !== values.length) throw new TypeError("Recorded clock consumer dropped an exact required supplied value");
  const items = presentEvidenceItems(view);
  if (items.length > 2 || items.some(item => item.component.id !== "fact_statement")
    || items.reduce((sum, item) => sum + presentationWordCount(item.component.id === "fact_statement" ? item.component.operand.renderedText : ""), 0) > 50) throw new TypeError("Recorded clock presentation exceeds its fixed fact/word/zero-geometry budget");
  // A presentation cannot outlive the captured original source while it is being assembled.
  readRecordedClockInvocation(collection.reading);
  if (collection.decision.kind === "available") readContextualFoundationOccurrence(collection.decision.occurrence);
  return Object.freeze({ reading: Object.freeze({ kind: "available" as const, value: reading as RecordedClockReading }), use,
    presentation: serializePresentedEvidence(items) });
}
