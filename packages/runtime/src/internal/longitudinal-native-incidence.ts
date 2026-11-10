// Accepted longitudinal-store §A.2: native EVENT incidence over exact original root subjects.
// This is deliberately distinct from condition relations and full played-outcome ranking.
import { candidatePlayedRow, type CandidatePopulationReceipt, type CandidateWideScope } from "../candidate-population.js";
import { readCandidateUnavailableSources } from "../semantic-source-availability.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../evidence-catalog.js";
import type { SemanticEventSign } from "../evidence-contract.js";
import { nativeEventSubject, NATIVE_SUBJECT_SOURCE_REFS, type NativeEventSubject, type NativeSubjectSourceRef } from "../semantic-native-subject.js";

type Counts = Readonly<{ sign: SemanticEventSign; occurred: boolean; legalAlternatives: number; matchingAlternatives: number; comparableAlternatives: number }>;
export type NativeSubjectIncidence = { [R in NativeSubjectSourceRef]: Omit<Extract<NativeEventSubject, { source: R }>, "ordinal"> & Counts }[NativeSubjectSourceRef];
export type NativeSubjectIncidenceResult = Readonly<{ kind: "available"; actor: "white" | "black";
  edge: Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>; rows: readonly NativeSubjectIncidence[] }>;
const SOURCES: ReadonlySet<string> = new Set(NATIVE_SUBJECT_SOURCE_REFS);
type SubjectEntry = { descriptor: NativeEventSubject; moves: Map<SemanticEventSign, Set<string>> };

export function nativeSubjectIncidences(receipt: CandidatePopulationReceipt<CandidateWideScope>, moveUci: string): NativeSubjectIncidenceResult {
  // Authenticate the original full source frame and its closed failure vocabulary. Known
  // legacy event/risk failures do not affect these seven independently complete native sources.
  readCandidateUnavailableSources(receipt);
  const played = candidatePlayedRow(receipt, moveUci);
  const subjects = new Map<NativeSubjectSourceRef, Map<number, SubjectEntry>>();
  for (const candidate of receipt.packet.candidates) for (const event of candidate.events) {
    const source = `${event.projection.id}@${event.projection.version}`;
    if (!SOURCES.has(source)) continue;
    // Event comes only from this original immutable WIDE row, not a caller's event list.
    const descriptor = nativeEventSubject(event), family = subjects.get(descriptor.source) ?? new Map<number, SubjectEntry>();
    const subject = family.get(descriptor.ordinal) ?? { descriptor, moves: new Map<SemanticEventSign, Set<string>>() };
    const moves = subject.moves.get(event.sign) ?? new Set<string>();
    moves.add(candidate.moveUci); subject.moves.set(event.sign, moves);
    family.set(descriptor.ordinal, subject); subjects.set(descriptor.source, family);
  }
  const rows: NativeSubjectIncidence[] = [], legalAlternatives = receipt.packet.candidates.length - 1;
  for (const source of NATIVE_SUBJECT_SOURCE_REFS) {
    const declaration = PRIMARY_EVIDENCE_MANIFEST.semanticEvents.find(event => `${event.projection.id}@${event.projection.version}` === source);
    if (declaration === undefined) throw new TypeError("Native incidence lacks its exact declared source/signs");
    for (const [, subject] of [...(subjects.get(source) ?? [])].sort(([a], [b]) => a - b)) for (const sign of declaration.allowedSigns) {
      const moves = subject.moves.get(sign);
      if (moves === undefined || moves.size === 0 || moves.size === receipt.packet.candidates.length) continue;
      const occurred = moves.has(played.moveUci), matchingAlternatives = moves.size - Number(occurred);
      const { ordinal: _ordinal, ...identity } = subject.descriptor;
      rows.push(Object.freeze({ ...identity, sign, occurred, legalAlternatives, matchingAlternatives, comparableAlternatives: legalAlternatives }));
    }
  }
  return Object.freeze({ kind: "available", actor: receipt.legalMovesInput.payload.turn,
    edge: Object.freeze({ beforeFen: receipt.packet.beforeFen, moveUci: played.moveUci, afterFen: played.afterFen }), rows: Object.freeze(rows) });
}
