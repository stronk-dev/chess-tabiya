// Exact clock operation adapter, not a public dispatcher or consumer permission.
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { readRecordedClockSource, type RecordedClockSource } from "./recorded-clock-source.js";
import { contextualizeImportedClockDecision } from "./recorded-foundation-occurrence.js";

export function collectRecordedClockValues(source: RecordedClockSource) {
  const original = readRecordedClockSource(source).authority;
  const reading = invokeEvidenceValueRoute("run.record.clock_reading@1", { source });
  const phase = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: original.original.beforeFen });
  const value = invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase });
  const decision = value.kind === "available"
    ? Object.freeze({ kind: "available" as const, occurrence: contextualizeImportedClockDecision(value.value) }) : value;
  readRecordedClockSource(source);
  return Object.freeze({ reading, decision });
}
