// Accepted shared-candidate-evidence-packet §3.1e: one demand-local original source graph.
// No process cache, source issuer, caller-supplied collector or ordinary policy.
import type { DeclaredEvidence, SemanticEventSign } from "./evidence-contract.js";
import type { FoundationEdge } from "./foundation-position-sources.js";
import { foundationPositionCells, type FoundationPositionTuple } from "./foundation-position-cells.js";
import { invokeEvidenceValueRoute, readFoundationEventInvocation, readFoundationPositionTuple, validEdge } from "./internal/evidence-value-routes.js";

export type FoundationEdgeSourceRef =
  | "rules.structural.event.king_opposition@2"
  | "rules.structural.event.backward_pawn@2"
  | "derived.structural.event.pawn_file_group@1"
  | "rules.transition.event.slider_ray@2"
  | "derived.activity.event.file_state@1"
  | "derived.activity.event.file_access_revealed@1"
  | "rules.structural.event.pawn_islands@2";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileSemanticEvidenceEvent, type SemanticEvidenceEvent } from "./semantic-evidence.js";
import { SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS } from "./semantic-validation.js";
import { positionFromFen } from "./position-cache.js";

const SOURCE_ORDER: readonly FoundationEdgeSourceRef[] = Object.freeze(
  SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.map(ref => `${ref.id}@${ref.version}` as FoundationEdgeSourceRef));

function available<T>(result: { readonly kind: "available"; readonly value: T } | { readonly kind: "unavailable"; readonly reason: string }): T {
  if (result.kind !== "available") throw new TypeError(`Selected structural source unavailable: ${result.reason}`);
  return result.value;
}

/** Each computation cell belongs only to this invocation; even an empty population validates
 * its complete original inputs. Public output data can never supply a source or skip validation. */
export function collectFoundationEdgeEvents(candidate: FoundationEdge, selected: readonly FoundationEdgeSourceRef[]): readonly SemanticEvidenceEvent[] {
  if (!Array.isArray(selected) || selected.length === 0 || new Set(selected).size !== selected.length
    || selected.some(ref => !SOURCE_ORDER.includes(ref))) throw new TypeError("Unsupported exact selected structural source demand");
  const edge = validEdge(candidate);
  return collect(edge, selected, foundationPositionCells(edge.beforeFen), foundationPositionCells(edge.afterFen));
}

/** Complete canonical/candidate acquisition over the owner's original tuples. It accepts no
 * callbacks, output payloads or FEN replacement. Empty event populations still validate inputs. */
export function collectOwnedFoundationEdgeEvents(candidate: FoundationEdge, originalBefore: FoundationPositionTuple, originalAfter: FoundationPositionTuple): readonly SemanticEvidenceEvent[] {
  const edge = validEdge(candidate);
  const before = readFoundationPositionTuple(originalBefore), after = readFoundationPositionTuple(originalAfter);
  if (before[0].payload.fen !== edge.beforeFen || after[0].payload.fen !== edge.afterFen) throw new TypeError("Owned structural sources cross their complete original edge");
  const retained = (tuple: FoundationPositionTuple): SourceCells => ({
    opposition: () => tuple[2], backward: () => tuple[3], groups: () => tuple[4],
    files: () => tuple[5], connectivity: () => tuple[1], values: () => tuple,
  });
  return collect(edge, SOURCE_ORDER, retained(before), retained(after));
}

type SourceCells = Pick<ReturnType<typeof foundationPositionCells>, "opposition" | "backward" | "groups" | "files" | "connectivity" | "values">;

function collect(edge: FoundationEdge, selected: readonly FoundationEdgeSourceRef[], before: SourceCells, after: SourceCells): readonly SemanticEvidenceEvent[] {
  const once = <T>(build: () => T): (() => T) => {
    let ready = false, result: T;
    return () => { if (!ready) { result = build(); ready = true; } return result; };
  };
  const fileChanges = once(() => available(invokeEvidenceValueRoute("derived.activity.event.file_state@1", { before: before.files(), moveUci: edge.moveUci, after: after.files() })));
  const collect = (source: FoundationEdgeSourceRef): readonly DeclaredEvidence<unknown>[] => {
    switch (source) {
      case "rules.structural.event.king_opposition@2": return available(invokeEvidenceValueRoute(source, { before: before.opposition(), moveUci: edge.moveUci, after: after.opposition() }));
      case "rules.structural.event.backward_pawn@2": return available(invokeEvidenceValueRoute(source, { before: before.backward(), moveUci: edge.moveUci, after: after.backward() }));
      case "derived.structural.event.pawn_file_group@1": return available(invokeEvidenceValueRoute(source, { before: before.groups(), moveUci: edge.moveUci, after: after.groups() }));
      case "rules.transition.event.slider_ray@2": return invokeEvidenceValueRoute(source, edge);
      case "derived.activity.event.file_state@1": return fileChanges();
      case "derived.activity.event.file_access_revealed@1": return fileChanges().flatMap(change => available(invokeEvidenceValueRoute(source, { change })));
      case "rules.structural.event.pawn_islands@2": return available(invokeEvidenceValueRoute(source, { before: before.connectivity(), moveUci: edge.moveUci, after: after.connectivity() }));
    }
  };
  const anchor = { ...edge, side: positionFromFen(edge.beforeFen).turn };
  const events = Object.freeze(SOURCE_ORDER.filter(ref => selected.includes(ref)).flatMap(source => collect(source).map(evidence =>
    compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { evidence,
      derivationInputs: readFoundationEventInvocation(evidence).inputs, anchor,
      sign: (evidence.payload as { readonly sign: SemanticEventSign }).sign }))));
  // The complete image already needs all six sources. Validate their original joins even if
  // every event is quiet; singleton Inspector requests keep their narrower acquisition demand.
  if (selected.length === SOURCE_ORDER.length) { before.values(); after.values(); }
  return events;
}
