// Compile-time negatives for rfc/shared-candidate-evidence-packet.md criteria 1, 3, 4, 19 and 25.
// Checked by `tsc -p packages/runtime/tsconfig.json`; each @ts-expect-error fails the build if the
// line it guards ever type-checks.
import {
  CANDIDATE_EVENTS_SCOPE,
  CANDIDATE_READINGS_SCOPE,
  CANDIDATE_WIDE_SCOPE,
  compileCandidatePopulation,
  projectCandidatePopulationReceipt,
  type CandidateEventPopulation,
  type CandidateEventsScope,
  type CandidatePacketAbstention,
  type CandidatePopulationReceipt,
  type CandidateReadingsScope,
  type CandidateWideScope,
} from "./candidate-population.js";
import { voiceCheck } from "./voice.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Criterion 1: the population is never an argument.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE });
// @ts-expect-error candidates are derived, never supplied.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, candidates: [] });
// @ts-expect-error legal moves are the authority's output, never supplied.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, legalMoves: [] });
// @ts-expect-error child FENs are derived.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, afterFen: FEN });
// @ts-expect-error events are compiled, never supplied.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, events: [] });
// @ts-expect-error readings are compiled, never supplied.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, readings: [] });
// @ts-expect-error selection policy, seed, profile and history are not packet facts (§6.1).
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: CANDIDATE_EVENTS_SCOPE, seed: 7 });
// @ts-expect-error criterion 27: only the literal standard ruleset is admissible.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "chess960", scope: CANDIDATE_EVENTS_SCOPE });
// @ts-expect-error criterion 4: the false/false scope is unrepresentable.
compileCandidatePopulation({ beforeFen: FEN, ruleset: "standard", scope: { events: false, readings: false } });

// Criterion 4: the generic projector admits exactly the literal partial order.
declare const wide: CandidatePopulationReceipt<CandidateWideScope>;
declare const eventsOnly: CandidatePopulationReceipt<CandidateEventsScope>;
declare const readingsOnly: CandidatePopulationReceipt<CandidateReadingsScope>;
projectCandidatePopulationReceipt(wide, CANDIDATE_EVENTS_SCOPE);
projectCandidatePopulationReceipt(wide, CANDIDATE_READINGS_SCOPE);
projectCandidatePopulationReceipt(wide, CANDIDATE_WIDE_SCOPE);
projectCandidatePopulationReceipt(eventsOnly, CANDIDATE_EVENTS_SCOPE);
projectCandidatePopulationReceipt(readingsOnly, CANDIDATE_READINGS_SCOPE);
// @ts-expect-error events-only cannot manufacture readings.
projectCandidatePopulationReceipt(eventsOnly, CANDIDATE_READINGS_SCOPE);
// @ts-expect-error readings-only cannot manufacture events.
projectCandidatePopulationReceipt(readingsOnly, CANDIDATE_EVENTS_SCOPE);
// @ts-expect-error a narrow receipt cannot widen.
projectCandidatePopulationReceipt(eventsOnly, CANDIDATE_WIDE_SCOPE);

// Criterion 25: convention, compiler version and abstention pairs stay literal.
declare const packet: CandidateEventPopulation;
const convention: CandidateEventPopulation["moveIdentityConvention"] = packet.moveIdentityConvention;
// @ts-expect-error a packet built under another move convention is a different type.
const foreignConvention: CandidateEventPopulation["moveIdentityConvention"] = "standard-uci-king-destination@1";
const version: CandidateEventPopulation["compilerVersion"] = 1;
// @ts-expect-error the compiler version is the literal CANDIDATE_PACKET_COMPILER_VERSION.
const nextVersion: CandidateEventPopulation["compilerVersion"] = 2;
const abstention: CandidatePacketAbstention = { projection: "rules.tactic.event.loose_piece@1", reason: "invalid_turn_clone" };
// @ts-expect-error a reason the generated map does not pair with the projection.
const wrongReason: CandidatePacketAbstention = { projection: "rules.tactic.event.loose_piece@1", reason: "threw" };
// @ts-expect-error a projection with no generated abstention reasons.
const wrongProjection: CandidatePacketAbstention = { projection: "rules.tactic.event.check@1", reason: "invalid_turn_clone" };

// Criterion 3: adjudication is not a packet terminal.
const mate: NonNullable<CandidateEventPopulation["terminal"]>["reason"] = "checkmate";
// @ts-expect-error insufficient material is adjudication, never a packet terminal.
const drawn: NonNullable<CandidateEventPopulation["terminal"]>["reason"] = "insufficient_material";

// Criterion 19: the voice/renderer boundary does not accept a packet receipt.
// @ts-expect-error a packet receipt is not a rendered evidence view.
voiceCheck(wide, "text");

export const TYPECHECK_WITNESSES = [convention, foreignConvention, version, nextVersion, abstention, wrongReason, wrongProjection, mate, drawn] as const;
