// Disposable D3262 live scheduling. Geometry orders exploration, never grades it.
import { compileSemanticRelationEventFirstLayer } from "./dist/semantic-relation-event-first-layer.mjs";
import { relationEventsAtHistory } from "./dist/recursive-relation-events.mjs";
import { reserveEvent } from "./coherent-recursive-semantic.mjs";

const check = (v, m) => { if (!v) throw new Error(m); };
export function firstReplyEvents(rootFen, candidate, definition) {
  const rootId = definition.rootId;
  check(typeof rootId === "string" && typeof definition.id === "string", "Missing named relation identity");
  // Build from this operation's actual legal enumeration, not a stored event/outcome table.
  const frame = { authority: "target_candidate_comparison_population_not_outcome_or_move_grade", manifest: "live_local_geometry",
    definitions: [definition], comparisons: [{ rootId, targetId: definition.id, candidateUci: candidate.candidateUci }] };
  const graph = { authority: "complete_legal_opponent_reply_edges_not_a_semantic_proof", manifest: frame.manifest,
    roots: [{ rootId, fen: rootFen, candidates: [candidate] }] };
  return compileSemanticRelationEventFirstLayer(frame, graph, { expectedComparisons: 1 }).rows[0];
}

/** First layer uses declared engine-ranked event width; no unranked fallback. */
export function reserveFirstReply(legal, top8, eventSource, eventUcis, width) {
  check([2, 4, 8].includes(width) && [legal, top8, eventSource, eventUcis].every(a => Array.isArray(a)
    && a.every(x => typeof x === "string") && new Set(a).size === a.length)
    && top8.length === Math.min(8, legal.length) && eventSource.length >= top8.length
    && [...top8, ...eventSource, ...eventUcis].every(x => legal.includes(x)), "Crossed first-reserve rank/legal scope");
  const baseline = top8.slice(0, width), reservedUci = eventSource.find(x => eventUcis.includes(x)) ?? null;
  const selected = reservedUci === null || baseline.includes(reservedUci) ? baseline : [...baseline.slice(0, -1), reservedUci];
  return { baseline, reservedUci, reservedRank: reservedUci === null ? null : eventSource.indexOf(reservedUci) + 1,
    selected, eventOrderAuthority: "declared_first_reply_source_width_not_profit_or_proof",
    status: reservedUci === null ? eventUcis.length ? "event_outside_source_width" : "no_legal_event"
      : baseline.includes(reservedUci) ? "event_already_in_baseline" : "event_reserved_outside_baseline" };
}

export function recursiveEvents(rootFen, history, definition) {
  return relationEventsAtHistory(rootFen, history, definition);
}
export const reserveRecursiveLayer = reserveEvent;
