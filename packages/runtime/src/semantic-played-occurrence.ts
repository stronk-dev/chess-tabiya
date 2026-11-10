import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertSemanticEvidenceEvent, type SemanticEvidenceEvent } from "./semantic-evidence.js";
import { readFoundationEventInvocation } from "./internal/evidence-value-routes.js";
import type { BackwardPawnChange, OppositionChange } from "./foundation-position-sources.js";
import type { FileAccessRevealed, FileStateChange, PawnFileGroupChange, PawnIslandTopologyChange } from "./foundation-pawn-sources.js";
import type { SliderMembershipChange } from "./foundation-slider-sources.js";
import { nativeEventSubject, originalBackwardPawnSquare } from "./semantic-native-subject.js";
import { SEMANTIC_PLAYED_RANKING_MODES } from "./semantic-played-types.js";

/** Internal equality over the finite declared grammar, never a persisted subject id or a hash.
 * Projection/sign prevalence is only a played-ranking statistic; it cannot construct absence. */
export function semanticPlayedOccurrenceKey(event: SemanticEvidenceEvent): string {
  assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event);
  const key = `${event.projection.id}@${event.projection.version}`;
  if (!Object.hasOwn(SEMANTIC_PLAYED_RANKING_MODES, key)) throw new TypeError("Played ranking has no declared exact current projection mode");
  if (SEMANTIC_PLAYED_RANKING_MODES[key as keyof typeof SEMANTIC_PLAYED_RANKING_MODES] === "projection_sign_prevalence") {
    return canonicalizeJson({ projection: event.projection, sign: event.sign });
  }
  readFoundationEventInvocation(event.evidence);
  const native = (() => {
    switch (key) {
      case "rules.structural.event.backward_pawn@2": {
        const p = event.operands as BackwardPawnChange;
        const rootSquare = originalBackwardPawnSquare(p);
        return { subject: { color: p.subject.color, rootSquare }, before: p.before, after: p.after };
      }
      case "rules.structural.event.king_opposition@2": {
        const p = event.operands as OppositionChange;
        return { subject: p.subject, before: { kings: p.before.kings, opposition: p.before.opposition }, after: { kings: p.after.kings, opposition: p.after.opposition } };
      }
      case "derived.structural.event.pawn_file_group@1": {
        const p = event.operands as PawnFileGroupChange; return { subject: p.subject, before: p.before, after: p.after };
      }
      case "rules.transition.event.slider_ray@2": {
        const p = event.operands as SliderMembershipChange; return { subject: { root: p.root, direction: p.direction }, before: p.before, after: p.after };
      }
      case "derived.activity.event.file_state@1": {
        const p = event.operands as FileStateChange; return { subject: { file: p.file }, before: p.before, after: p.after };
      }
      case "derived.activity.event.file_access_revealed@1": {
        const p = event.operands as FileAccessRevealed;
        return { subject: { piece: p.piece, file: p.file }, before: { state: p.beforeState, support: p.fileChange.before }, after: { state: p.afterState, support: p.fileChange.after } };
      }
      case "rules.structural.event.pawn_islands@2": {
        const p = event.operands as PawnIslandTopologyChange;
        return { subject: { color: p.color }, before: { count: p.beforeCount, partitions: p.before }, after: { count: p.afterCount, partitions: p.after } };
      }
      default: throw new TypeError("Declared native mode lacks its exact current source grammar");
    }
  })();
  return canonicalizeJson({ projection: event.projection, ...native });
}

/** Root-domain order is independent of a change factory's (for example stationary-first) order. */
export function semanticPlayedSubjectOrdinal(event: SemanticEvidenceEvent): number | null {
  const key = `${event.projection.id}@${event.projection.version}`;
  if (!Object.hasOwn(SEMANTIC_PLAYED_RANKING_MODES, key)) throw new TypeError("Played ranking has no exact declared mode");
  if (SEMANTIC_PLAYED_RANKING_MODES[key as keyof typeof SEMANTIC_PLAYED_RANKING_MODES] !== "native_outcome") return null;
  return nativeEventSubject(event).ordinal;
}
