import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";

import { EVIDENCE_PRODUCERS } from "./evidence-catalog.js";
import { declareEvidence, type DeclaredEvidence } from "./evidence-contract.js";

const ref = (id: string) => ({ id, version: 1 } as const);

function present<T>(payload: T, label: string): T {
  if (payload === undefined || payload === null) throw new TypeError(`${label} evidence payload is absent`);
  return payload;
}

function exact<T>(producer: string, projection: string, payload: T): DeclaredEvidence<T> {
  return declareEvidence(ref(producer), ref(projection), present(payload, projection));
}

function exactObject<T extends object>(producer: string, projection: string, payload: T, required: readonly string[]): DeclaredEvidence<T> {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new TypeError(`${projection} evidence payload must be an object`);
  const declared = EVIDENCE_PRODUCERS.find((candidate) => candidate.id === producer)?.outputs.find((candidate) => candidate.id === projection)?.operands;
  if (declared === undefined || declared.length !== required.length || declared.some((key) => !required.includes(key))) {
    throw new TypeError(`${projection} exact-adapter keys disagree with the evidence manifest`);
  }
  const record = payload as Readonly<Record<string, unknown>>;
  const missing = required.filter((key) => !(key in record));
  if (missing.length > 0) throw new TypeError(`${projection} evidence payload is missing ${missing.join(", ")}`);
  return exact(producer, projection, payload);
}

export const declarePhaseReadingEvidence = <T extends object>(payload: T) => exactObject("rules.phase", "rules.phase.reading", payload, ["fen", "phase", "material", "undevelopedMinors", "provenanceNote"]);
export const declareDevelopmentReadingEvidence = <T extends object>(payload: T) => exactObject("rules.phase", "rules.phase.development", payload, ["fen", "conventionId", "undeveloped"]);
export const declarePackPhaseEvidence = <T extends string>(payload: T) => {
  if (!new Set(["opening", "middlegame", "endgame", "cross_phase"]).has(payload)) throw new TypeError("pack.authored.phase evidence payload is not a pack phase");
  return exact("pack.authored", "pack.authored.phase", payload);
};
export const declareNamedStructureEvidence = <T extends object>(payload: T) => exactObject("rules.structural", "rules.structural.reading.named_structure", payload, ["provenanceNote"]);
export const declarePivotalMarkerEvidence = <T extends object>(payload: T) => exactObject("rules.pivotal", "rules.pivotal.marker", payload, ["nodeId", "kind", "detail", "provenanceNote"]);
export const declareEndgameReadingEvidence = <T extends object>(payload: T) => exactObject("rules.endgame", "rules.endgame.reading", payload, ["type", "techniques", "provenanceNote"]);
export const declareShapeFiringSourceEvidence = <T extends object>(payload: T) => exactObject("theory.shapes", "theory.shapes.firing", payload, ["entryId", "firstNodeId", "lastNodeId", "openEnded"]);
export const declareAuthoredClaimEvidence = <T extends object>(payload: T) => exactObject("pack.authored", "pack.authored.claim", payload, ["id", "text", "attribution"]);
export const declareAuthoredClaimDeliveryEvidence = <T extends object>(payload: T) => exactObject("pack.authored", "pack.authored.claim_delivery", payload, ["kind", "id", "text", "evidenceTypes", "earnedEvidenceTypes", "binding", "principles"]);
export const declareRecordedEngineEvidence = <T extends object>(payload: T) => exactObject("recorded.engine", "recorded.engine.eval", payload, ["kind", "fen", "sourceId", "retrievedAt", "values"]);
export const declareRecordedTablebaseEvidence = <T extends object>(payload: T) => exactObject("recorded.tablebase", "recorded.tablebase.result", payload, ["kind", "fen", "sourceId", "retrievedAt", "values"]);
export const declareExplorerPositionEvidence = <T extends object>(payload: T) => exactObject("human.explorer", "human.explorer.position_stats", payload, ["kind", "population"]);
export const declareExplorerPopulationEvidence = <T extends object>(payload: T) => exactObject("human.explorer", "human.explorer.population", payload, ["nodeId", "result", "committedMoveSan"]);
export const declareMaiaPolicyEvidence = <T extends object>(payload: T) => exactObject("human.maia", "human.maia.policy", payload, ["nodeId", "engine", "targetElo", "candidates"]);
export interface MaiaCandidateWdlProjection {
  readonly nodeId: string;
  readonly engine: object;
  readonly targetElo: number | null;
  readonly candidates: readonly {
    readonly moveUci: string;
    readonly rank: number;
    readonly wdl: Readonly<{ readonly win: number; readonly draw: number; readonly loss: number }>;
  }[];
}

export function declareMaiaCandidateWdlEvidence(page: {
  readonly nodeId: string;
  readonly engine: object;
  readonly targetElo: number | null;
  readonly candidates: readonly {
    readonly moveUci: string;
    readonly rank: number;
    readonly wdl?: Readonly<{ readonly win: number; readonly draw: number; readonly loss: number }>;
  }[];
}): DeclaredEvidence<MaiaCandidateWdlProjection> | undefined {
  const candidates = page.candidates.flatMap((candidate) => candidate.wdl === undefined ? [] : [{
    moveUci: candidate.moveUci,
    rank: candidate.rank,
    wdl: candidate.wdl,
  }]);
  if (candidates.length === 0) return undefined;
  return exactObject("human.maia", "human.maia.candidate_wdl", {
    nodeId: page.nodeId,
    engine: page.engine,
    targetElo: page.targetElo,
    candidates,
  }, ["nodeId", "engine", "targetElo", "candidates"]);
}
export const declareMaiaEventEvidence = <T extends object>(payload: T) => exactObject("human.maia", "human.maia.event", payload, ["kind", "source", "values"]);
export const declareSyzygyResultEvidence = <T extends object>(payload: T) => exactObject("live.syzygy", "live.syzygy.result", payload, ["kind", "source", "values"]);
export const declareStockfishEvalEvidence = <T extends object>(payload: T) => exactObject("live.stockfish", "live.stockfish.eval", payload, ["kind", "source", "values"]);
export const declareSyzygyCategoryEvidence = <T extends object>(payload: T) => exactObject("live.syzygy", "live.syzygy.category", payload, ["category"]);
export const declareSyzygyDistanceEvidence = <T extends object>(payload: T) => exactObject("live.syzygy", "live.syzygy.distance", payload, ["category"]);
export const declareEvidenceReferenceResolution = <T extends object>(payload: T) => exactObject("run.record", "run.record.evidence_ref_resolution", payload, ["reference", "text", "sourceLabel"]);
export const declareLegalExchangeEvidence = <T extends object>(payload: T) => exactObject("rules.exchange", "rules.exchange.predicate.legal_exchange", payload, ["beforeFen", "captureUci", "landingSquare", "capturer", "captured", "branches", "chosenLine", "stopDecisions", "conventionId", "resultUnits"]);
export const declareCaptureClassEvidence = <T extends object>(payload: T) => exactObject("derived.exchange", "derived.exchange.capture_class", payload, ["before_fen", "move_uci", "after_fen", "capture", "exchange", "class"]);
export const declareThreatEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.consequence.threat", payload, ["kind", "conventionId", "threats"]);
export const declareDoubleAttackEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.event.double_attack", payload, ["beforeFen", "moveUci", "afterFen", "mover", "targets"]);
export const declareForkSurvivalEvidence = <T extends object>(payload: T) => exactObject("derived.tactic", "derived.tactic.fork_survives_reply", payload, ["matched", "doubleAttack", "replyBreadth", "refutingReplies"]);
export const declareReplyBreadthEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.consequence.reply_breadth", payload, ["triggeringMove", "afterFen", "terminal", "check", "replies", "count", "horizon"]);
export const declareCheckEventEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.event.check", payload, ["triggeringMove", "checkingPieces", "checkedKing", "attackSquares", "rays"]);
export const declareLoosePieceEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.reading.loose_piece", payload, ["fen", "sideToMove", "pieces"]);
export const declareRayClassificationEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.reading.ray_classification", payload, ["fen", "rays"]);
export const declareMateInOneEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.consequence.mate_in_one", payload, ["fen", "mates"]);
export const declareDiscoveredLatencyEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.reading.discovered_latency", payload, ["fen", "screens"]);
export const declareTrappedPieceEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.reading.trapped_piece", payload, ["kind", "conventionId", "pieces"]);
export const declareBackRankEvidence = <T extends object>(payload: T) => exactObject("rules.tactic", "rules.tactic.reading.back_rank", payload, ["fen", "conventionId", "susceptible"]);
export const declareCastlingRightsEvidence = <T extends object>(payload: T) => exactObject("rules.castling", "rules.castling.reading.rights", payload, ["fen", "white", "black"]);
export const declareCastlingRightsLostEvidence = <T extends object>(payload: T) => exactObject("rules.castling", "rules.castling.event.rights_lost", payload, ["beforeFen", "moveUci", "afterFen", "color", "wing", "cause"]);
export const declareCastlingLegalityEvidence = <T extends object>(payload: T) => exactObject("rules.castling", "rules.castling.reading.legality", payload, ["color", "wing", "kingSquare", "rookSquare", "legalNow", "inCheck", "blockedSquares", "attackedSquares"]);

export function declareStructuralReadingSourceEvidence<T extends { readonly kind: string }>(payload: T): DeclaredEvidence<T> {
  if (!STRUCTURAL_FEATURE_KINDS.includes(payload.kind as (typeof STRUCTURAL_FEATURE_KINDS)[number]) || payload.kind === "pawn_count") throw new TypeError(`Unsupported structural reading evidence kind ${payload.kind}`);
  return exactObject("rules.structural", `rules.structural.reading.${payload.kind}`, payload, payload.kind === "named_structure" ? ["provenanceNote"] : ["kind", "squares"]);
}

export function declareTransitionReadingSourceEvidence<T extends { readonly kind: string; readonly direction?: string; readonly subkind?: string }>(payload: T): DeclaredEvidence<T> {
  const suffix = payload.kind === "move_irreversibility" ? `move_irreversibility.${payload.subkind}` : `${payload.kind}.${payload.direction}`;
  const allowed = new Set(["attacked_squares_changed.gained", "attacked_squares_changed.lost", "defended_squares_changed.gained", "defended_squares_changed.lost", "slider_lines_changed.opened", "slider_lines_changed.closed", "escape_squares_changed.gained", "escape_squares_changed.lost", "defended_duties_changed.acquired", "defended_duties_changed.released", "move_irreversibility.castled", "move_irreversibility.clock_zeroed", "move_irreversibility.last_of_role", "move_irreversibility.pawn_break"]);
  if (!allowed.has(suffix)) throw new TypeError(`Unsupported transition reading evidence kind ${suffix}`);
  const keys = payload.kind === "move_irreversibility"
    ? ["kind", "subkind", "provenanceNote"]
    : ["kind", "color", "direction", "count", "provenanceNote"];
  return exactObject("rules.transition", `rules.transition.reading.${suffix}`, payload, keys);
}

export function declareStructuralPredicateFeatureEvidence<T extends { readonly feature: { readonly kind: string } }>(payload: T): DeclaredEvidence<T> {
  if (!STRUCTURAL_FEATURE_KINDS.includes(payload.feature.kind as (typeof STRUCTURAL_FEATURE_KINDS)[number])) throw new TypeError(`Unsupported structural predicate kind ${payload.feature.kind}`);
  return exactObject("rules.structural", `rules.structural.predicate.${payload.feature.kind}`, payload, ["fen", "feature", "matched"]);
}
export const declareAuthoredStructuralConditionEvidence = <T extends object>(payload: T) => exactObject("authored.structural_condition", "authored.structural_condition.input", payload, ["source", "documentId", "pointer", "expression"]);
export const declareStructuralPredicateResultEvidence = <T extends object>(payload: T) => exactObject("rules.structural", "rules.structural.predicate.result", payload, ["fen", "condition", "matched", "trace"]);

export function declareOpponentProviderEvidence<T extends object>(source: "maia" | "stockfish" | "syzygy", payload: T): DeclaredEvidence<T> {
  if (source === "maia" || source === "stockfish") {
    if (!Array.isArray(payload) || !payload.every((line) => typeof line === "string")) throw new TypeError(`${source} UCI response evidence payload must be a string array`);
    return exact(source === "maia" ? "human.maia" : "live.stockfish", source === "maia" ? "human.maia.uci_response" : "live.stockfish.uci_response", payload);
  }
  return exactObject("live.syzygy", "live.syzygy.probe_result", payload, ["category", "moves"]);
}

export function declareLivePacketEvidence<T extends { readonly kind: string }>(payload: T): DeclaredEvidence<T> {
  const packet = payload as T & { readonly source?: string };
  if (packet.source === "human_model_predicted") return exactObject("human.maia", "human.maia.event", payload, ["kind", "source", "values"]);
  if (payload.kind === "tablebase") return exactObject("live.syzygy", "live.syzygy.result", payload, ["kind", "source", "values"]);
  if (payload.kind === "eval") return exactObject("live.stockfish", "live.stockfish.eval", payload, ["kind", "source", "values"]);
  if (payload.kind === "wdl") return exactObject("live.stockfish", "live.stockfish.wdl", payload, ["kind", "source", "values"]);
  if (payload.kind === "bestline") return exactObject("live.stockfish", "live.stockfish.pv", payload, ["kind", "source", "values"]);
  throw new TypeError(`Unsupported live packet evidence kind ${payload.kind}`);
}

export function declareSourcingRecordEvidence<T extends { readonly kind: string }>(payload: T): DeclaredEvidence<T> | undefined {
  if (payload.kind === "engine_eval") return exactObject("sourcing.ledger", "sourcing.ledger.engine_eval", payload, ["kind", "sourceId", "retrievedAt", "values"]);
  if (payload.kind === "tablebase_result") return exactObject("sourcing.ledger", "sourcing.ledger.tablebase_result", payload, ["kind", "sourceId", "retrievedAt", "values"]);
  if (payload.kind === "explorer_position_census") return exactObject("sourcing.ledger", "sourcing.ledger.explorer_position_census", payload, ["kind", "sourceId", "retrievedAt", "values"]);
  if (payload.kind === "opening_identity") return exactObject("theory.opening_identity", "theory.opening_identity.record", payload, ["kind", "sourceId", "retrievedAt", "values"]);
  return undefined;
}

export function declareCompareDerivedEvidence<T extends object>(kind: "engine_trajectory" | "structure_delta" | "piece_route" | "eval_delta", payload: T): DeclaredEvidence<T> {
  const keys = kind === "engine_trajectory" ? ["nodeId", "plyOffset", "evidenceRefs", "kind", "source", "score"] : kind === "structure_delta" ? ["observation"] : kind === "piece_route" ? ["pieceId", "squares"] : ["delta", "plyOffset"];
  return exactObject("derived.compare_narrative", `derived.compare.${kind}`, payload, keys);
}

export function declareRunRecordEvidence<T extends object>(kind: "fork" | "move" | "checkpoint_hit" | "objective_transition" | "consequence" | "imported_result", payload: T): DeclaredEvidence<T> {
  const common = ["context"];
  const keys = kind === "fork" ? [...common, "forkNodeId", "sharedPly"]
    : kind === "move" ? [...common, "offset", "moveSan"]
      : kind === "checkpoint_hit" ? [...common, "checkpointId", "plyOffset"]
        : kind === "objective_transition" ? [...common, "from", "to"]
          : kind === "consequence" ? [...common, "terminal"]
            : [...common, "result"];
  return exactObject("run.record", `run.record.${kind}`, payload, keys);
}

export function declareStoryDerivedEvidence<T extends object>(kind: "eval_shift" | "last_level" | "rank" | "title", payload: T): DeclaredEvidence<T> {
  const keys = kind === "eval_shift" ? ["before", "after", "delta"] : kind === "last_level" ? ["recordedResult", "evaluation"] : kind === "rank" ? ["rank"] : ["title", "rank", "outcome"];
  return exactObject("derived.story", `derived.story.${kind}`, payload, keys);
}

export function declareStructuralSemanticSourceEvidence<T extends object>(family: string, payload: T): DeclaredEvidence<T> {
  const allowed = new Set(["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition", "king_zone", "line_blockers", "open_file", "passed_pawn", "piece_count", "direct_attack_count"]);
  if (!allowed.has(family)) throw new TypeError(`Unsupported structural semantic family ${family}`);
  return exactObject("rules.structural", `rules.structural.event.${family}`, payload, ["before_fen", "move_uci", "after_fen", "family", "before", "after"]);
}

export function declareTransitionSemanticSourceEvidence<T extends object>(family: string, payload: T): DeclaredEvidence<T> {
  const allowed = new Set(["occupied_attack", "occupied_defence", "slider_ray", "piece_escape", "defended_duty", "castled", "clock_reset", "last_of_role", "pawn_contact", "checkmate", "promotion", "capture", "developed"]);
  if (!allowed.has(family)) throw new TypeError(`Unsupported transition semantic family ${family}`);
  const keys = new Set(["occupied_attack", "occupied_defence", "slider_ray", "piece_escape", "defended_duty"]).has(family)
    ? ["before_fen", "move_uci", "after_fen", "subject", "targets_before", "targets_after"]
    : family === "capture" ? ["before_fen", "move_uci", "after_fen", "mover", "from", "to", "captured", "enPassant"]
      : ["before_fen", "move_uci", "after_fen", "mover", "from", "to", "detail"];
  return exactObject("rules.transition", `rules.transition.event.${family}`, payload, keys);
}

export function declareAvoidanceEvidence<T extends object>(family: string, payload: T): DeclaredEvidence<T> {
  const allowed = new Set(["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition", "king_zone", "line_blockers", "open_file", "passed_pawn", "piece_count", "direct_attack_count"]);
  if (!allowed.has(family)) throw new TypeError(`Unsupported avoidance family ${family}`);
  return exactObject("derived.semantic_avoidance", `derived.semantic_avoidance.${family}`, payload, ["relation", "family", "legalAlternatives", "alternativesWithFamily", "alternativeEvents"]);
}
