// rfc/module-registration.md §2.5 — the literal source image of the one module query operation:
// which exact projections `queryModules` acquires for each module it delivers. `module-query.ts`
// acquires exactly these (asserted there), and `module-registry.ts` derives `MODULE_PAIR_EXECUTION`
// from them, so an acquisition change and the executable-pair census cannot drift apart.

import { evidenceValueRouteRegistry } from "./internal/evidence-value-routes.js";
import type { ModuleId } from "./module-contract.js";

export const MODULE_QUERY_OPERATION = "queryModules" as const;

const STRUCTURAL_SIGHT_KINDS = Object.freeze([
  "pawn_safe_square", "outpost", "backward_pawn", "isolated_pawn", "doubled_pawn", "passed_pawn", "open_file", "half_open_file",
  "line_blockers", "direct_attack_count", "piece_reach_count", "bishop_on_shade", "king_opposition", "piece_count", "king_zone", "piece_distance",
]);

/** Sight's FEN readings (the square selector then scopes them to the selected square). */
export const SIGHT_SOURCE_ROUTES: readonly string[] = Object.freeze([
  ...STRUCTURAL_SIGHT_KINDS.map((kind) => `rules.structural.reading.${kind}@1`),
  "rules.structural.reading.named_structure@2", "rules.castling.reading.rights@1", "rules.castling.reading.legality@1", "rules.tactic.reading.rook_on_seventh@1",
  "rules.square.reading.control@1", "rules.pawn.reading.contacts@1", "rules.mobility.reading.legal_moves@1",
]);

const ROUTE_ARMS: ReadonlyMap<string, readonly string[]> = new Map(evidenceValueRouteRegistry().map((meta) => [meta.route, meta.arms.map((arm) => Object.keys(arm).sort().join("|"))]));
/** A route whose one arm reads exactly `keys` (sorted, pipe-joined). */
export const routeReads = (route: string, keys: string): boolean => (ROUTE_ARMS.get(route) ?? []).includes(keys);
export const PACKET_ROUTE_KINDS: Readonly<Record<string, string>> = Object.freeze({
  "live.stockfish.eval@1": "eval", "live.stockfish.wdl@1": "wdl", "live.stockfish.pv@1": "bestline",
  "live.syzygy.result@1": "tablebase", "live.syzygy.category@1": "tablebase", "live.syzygy.distance@1": "tablebase",
});

/**
 * The exact projections the query operation acquires per module. Full Inspector acquires every
 * accepted projection whose value route reads the node FEN, the incoming edge or a recorded
 * engine/tablebase packet. The post-commit nudge's one-edge closure is `ONE_EDGE_EVENT_REFS` plus
 * the grade (module-registry.ts), which predates this operation and is reused unchanged.
 */
export function moduleQuerySourceRoutes(module: ModuleId, accepted: readonly string[]): readonly string[] {
  switch (module) {
    case "sight_on_request": return SIGHT_SOURCE_ROUTES;
    case "threat_radar": return ["rules.tactic.consequence.threat@1", "rules.tactic.consequence.mate_in_one@1", "rules.tactic.reading.loose_piece@1", "rules.tactic.reading.back_rank@1", "rules.tactic.reading.trapped_piece@1", "rules.tactic.reading.ray_classification@1", "derived.tactic.defender_exposure@1"];
    case "blunder_prevention": return ["rules.tactic.consequence.threat@1", "rules.tactic.consequence.mate_in_one@1", "rules.tactic.reading.loose_piece@1"];
    case "structure_nudge": return ["rules.structural.reading.named_structure@2", "rules.phase.reading@2", "rules.endgame.classification@1", "rules.structural.reading.space@1", "rules.structural.reading.pawn_connectivity@1", "theory.endgame.setup_match@1", "theory.shapes.firing@1"];
    case "theory_breadcrumb": return ["pack.authored.claim@1", "theory.shapes.firing@1", "theory.opening.current_endpoint@1"];
    case "compare_coach": return ["run.record.fork@1", "run.record.consequence@1", "run.record.objective_transition@1", "run.record.checkpoint_hit@1", "derived.compare.structure_delta@1", "derived.compare.eval_delta@1", "derived.compare.engine_trajectory@1", "derived.compare.piece_route@1"];
    case "full_inspector": return accepted.filter((route) => routeReads(route, "fen") || routeReads(route, "afterFen|beforeFen|moveUci") || (PACKET_ROUTE_KINDS[route] !== undefined && routeReads(route, "packet")));
    default: return [];
  }
}
