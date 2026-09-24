// rfc/hint-distance.md §1, §1.1, §3 — the literal Guided Hint family × rung registry.
//
// This is a leaf module (type-only imports) so that the evidence catalogue, the module contract and
// the hint compiler all read ONE table. `HINT_DECLARATION_MATRIX` is the authority for every horizon
// and disclosure declaration; the catalogue compiles it through the real F1 manifest compiler, so a
// widened row fails at import rather than in prose ([[D1641]]).

import type { AnswerDistance, EvidenceForm, VersionedEvidenceId } from "./evidence-contract.js";

/** §1: the seven hint families, set-equal to D1397's frozen `contract.families`, in precedence order. */
export const HINT_FAMILIES = Object.freeze([
  "mate_in_one", "forced_mate", "double_attack", "fork_survives_reply",
  "discovered_executed", "loose_piece", "promotion_pressure",
] as const);
export type HintFamily = (typeof HINT_FAMILIES)[number];

/** §3: five cumulative disclosures. The learner never sees these names. */
export const HINT_RUNGS = Object.freeze(["pattern", "square", "piece", "distance", "move"] as const);
export type HintRung = (typeof HINT_RUNGS)[number];

/** §5: the stored/effective ceiling adds `off` below the first rung. */
export const HINT_DISTANCES = Object.freeze(["off", ...HINT_RUNGS] as const);
export type HintDistance = (typeof HINT_DISTANCES)[number];

/** §2: only these two relations enter the module; `opponent_line_event` is refused before selection. */
export const HINT_RELATIONS = Object.freeze(["root_direct", "root_followup_in_line"] as const);
export type HintRelation = (typeof HINT_RELATIONS)[number];

/** §2: the fixed four-ply scan ceiling of one searched line. */
export const HINT_SCAN_PLIES = 4 as const;

/**
 * The searched-line source. 2026-09-24 implementation correction: the draft named
 * `live.stockfish.legal_root_table@1`, but the selector reads exactly one line (the D1363/D1397
 * harnesses scanned the engine's single principal variation) while the complete legal population
 * comes from the shared candidate packet. The bounded single-line `live.stockfish.principal_variation@1`
 * delivery (provider-exchange §5.2) is therefore the exact source; an all-legal MultiPV table would be
 * searched and discarded.
 */
export const HINT_SEARCH_SOURCE: VersionedEvidenceId = Object.freeze({ id: "live.stockfish.principal_variation", version: 1 });

/** §1.1: the closed abstention union every horizon and disclosure declares. */
export const HINT_ABSTENTION_REASONS = Object.freeze([
  "input_abstained", "no_admitted_occurrence", "provider_unavailable", "deadline_exceeded",
  "queue_full", "cancelled", "invalid_response", "identity_mismatch",
] as const);

export interface HintDeclarationRow {
  readonly family: HintFamily;
  readonly source: VersionedEvidenceId;
  readonly role: "reading" | "predicate" | "event";
  /** The admitted source status, literal (§1 table). */
  readonly status: string;
  readonly sourceAnswers: readonly AnswerDistance[];
  readonly horizonAnswers: readonly AnswerDistance[];
  /** The answer image of every learner rung; only `move` adds the `move` token. */
  readonly rungAnswers: Readonly<Record<HintRung, readonly AnswerDistance[]>>;
}

const ref = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 1 });
const row = (family: HintFamily, source: string, role: HintDeclarationRow["role"], status: string, sourceAnswers: readonly AnswerDistance[]): HintDeclarationRow => {
  const withMove = Object.freeze([...sourceAnswers, "move"] as AnswerDistance[]);
  const lower = Object.freeze([...sourceAnswers]);
  return Object.freeze({
    family, source: ref(source), role, status,
    sourceAnswers: lower,
    horizonAnswers: withMove,
    rungAnswers: Object.freeze({ pattern: lower, square: lower, piece: lower, distance: lower, move: withMove }),
  });
};

/** §1.1 — the executable declaration matrix. Unit: hint family; total seven. */
export const HINT_DECLARATION_MATRIX: readonly HintDeclarationRow[] = Object.freeze([
  row("mate_in_one", "rules.tactic.consequence.mate_in_one", "reading", "the searched edge is one of the exact mates in one of its before position", ["threat"]),
  row("forced_mate", "rules.tactic.consequence.forced_mate_after_move", "predicate", "proofStatus=proved", ["candidate_moves"]),
  row("double_attack", "rules.tactic.event.double_attack", "event", "gained", ["threat"]),
  row("fork_survives_reply", "derived.tactic.fork_survives_reply", "predicate", "matched", ["threat"]),
  row("discovered_executed", "derived.tactic.discovered_executed", "event", "gained", ["fact", "pattern", "threat"]),
  row("loose_piece", "rules.tactic.event.loose_piece", "event", "lost for a mover-owned previously en-prise piece", ["fact", "threat"]),
  row("promotion_pressure", "derived.tactic.promotion_pressure", "reading", "a root-side pawn whose promotion is available and persists after every exact immediate reply", ["fact"]),
]);
if (HINT_DECLARATION_MATRIX.map((value) => value.family).join("|") !== HINT_FAMILIES.join("|")) throw new TypeError("HINT_DECLARATION_MATRIX must follow HINT_FAMILIES exactly");

/** §3: the learner forms each rung may carry. `distance` keeps the prior marks; only `move` draws an arrow. */
export const HINT_RUNG_FORMS: Readonly<Record<HintRung, readonly EvidenceForm[]>> = Object.freeze({
  pattern: Object.freeze(["sentence"] as const),
  square: Object.freeze(["sentence", "lit_squares"] as const),
  piece: Object.freeze(["sentence", "lit_squares", "piece_halo"] as const),
  distance: Object.freeze(["sentence", "lit_squares", "piece_halo"] as const),
  move: Object.freeze(["sentence", "lit_squares", "piece_halo", "arrows"] as const),
});

export const hintHorizonProjectionId = (family: HintFamily): string => `derived.hint.horizon.${family}`;
export const hintDisclosureProjectionId = (family: HintFamily, rung: HintRung): string => `derived.hint.disclosure.${family}.${rung}`;

/** §3: one internal (operator-only) horizon projection per family. */
export const HINT_HORIZON_PROJECTION_IDS: readonly VersionedEvidenceId[] = Object.freeze(HINT_FAMILIES.map((family) => ref(hintHorizonProjectionId(family))));
/** §3: one learner disclosure projection per family × rung, family-major then rung order. Total 35. */
export const HINT_DISCLOSURE_PROJECTION_IDS: readonly VersionedEvidenceId[] = Object.freeze(HINT_FAMILIES.flatMap((family) => HINT_RUNGS.map((rung) => ref(hintDisclosureProjectionId(family, rung)))));
/** §3: the disclosure registry grouped by rung. */
export const HINT_DISCLOSURE_BY_RUNG: Readonly<Record<HintRung, readonly VersionedEvidenceId[]>> = Object.freeze(Object.fromEntries(HINT_RUNGS.map((rung) => [rung, Object.freeze(HINT_FAMILIES.map((family) => ref(hintDisclosureProjectionId(family, rung))))])) as Record<HintRung, readonly VersionedEvidenceId[]>);

export type HintDisclosureProjectionId = `derived.hint.disclosure.${HintFamily}.${HintRung}`;

/** The exact family × rung of a disclosure projection id, or undefined for any other id. */
export function hintDisclosureIdentity(projectionId: string): { readonly family: HintFamily; readonly rung: HintRung } | undefined {
  const match = /^derived\.hint\.disclosure\.([a-z_]+)\.([a-z]+)$/u.exec(projectionId);
  if (match === null) return undefined;
  const family = HINT_FAMILIES.find((value) => value === match[1]);
  const rung = HINT_RUNGS.find((value) => value === match[2]);
  return family === undefined || rung === undefined ? undefined : Object.freeze({ family, rung });
}

export function hintDeclarationRow(family: HintFamily): HintDeclarationRow {
  return HINT_DECLARATION_MATRIX.find((value) => value.family === family)!;
}

/** Rank helpers over the closed orders. */
export const hintRungIndex = (rung: HintRung): number => HINT_RUNGS.indexOf(rung);
export const hintDistanceIndex = (value: HintDistance): number => HINT_DISTANCES.indexOf(value);
export function minHintDistance(...values: readonly HintDistance[]): HintDistance {
  return values.reduce<HintDistance>((low, next) => hintDistanceIndex(next) < hintDistanceIndex(low) ? next : low, "move");
}

/**
 * §2 selection precedence. 2026-09-24 implementation correction: the draft used the registry order,
 * in which `double_attack` precedes `fork_survives_reply`. Fork survival derives from that very double
 * attack on the same edge, so under the draft order `fork_survives_reply` could never be selected — a
 * registered family that is unreachable by construction. Its strictly more specific statement now
 * precedes the plain double attack; every other position is unchanged. Replayed over the frozen D1397
 * population this relabels exactly one selection (depth-12 row 43: same edge, same targets) and leaves
 * every reach tripwire unchanged (`hint-distance.test.ts`).
 */
export const HINT_SELECTION_ORDER: readonly HintFamily[] = Object.freeze([
  "mate_in_one", "forced_mate", "fork_survives_reply", "double_attack",
  "discovered_executed", "loose_piece", "promotion_pressure",
]);
