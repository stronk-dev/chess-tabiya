// DISPOSABLE research registry — platform-alignment R21. Not production ids or thresholds.

export type ProductionGap =
  | "reference_and_runtime_identity"
  | "denominator_projection_mismatch"
  | "collector_and_store_extension";

export type BotUse =
  | "future_repertoire"
  | "future_controlled_trait"
  | "refused_without_time_model";

export interface StyleMetricContract {
  readonly metricId: string;
  readonly featureId: string;
  readonly unit: "decision" | "game";
  readonly value: string;
  readonly denominator: string;
  readonly phase: "opening" | "middlegame" | "endgame" | "all";
  readonly measuredFloorGames: number;
  readonly source: string;
  readonly productionGap: ProductionGap;
  readonly botUse: BotUse;
  readonly literalSentence: string;
}

const clock = (
  phase: "opening" | "middlegame" | "endgame",
  floor: number,
): StyleMetricContract => ({
  metricId: `clock_spend_share:${phase}`,
  featureId: "time.spend_share@1",
  unit: "decision",
  value: "mean max(0, previous clock + increment - current clock) / (previous clock + increment)",
  denominator: `decisions with valid adjacent clock readings in the ${phase}`,
  phase,
  measuredFloorGames: floor,
  source: "typed clock readings plus base/increment and the declared phase classifier",
  productionGap: "collector_and_store_extension",
  botUse: "refused_without_time_model",
  literalSentence: `Across {games} measured games, your ${phase} decisions used a mean {value} share of the time available for each move ({interval}).`,
});

export const STYLE_METRICS: readonly StyleMetricContract[] = Object.freeze([
  {
    metricId: "opening_surprisal",
    featureId: "opening.move_population_share@1",
    unit: "decision",
    value: "mean -log2(reference-population move share)",
    denominator: "learner decisions through ply 8 whose exact-position reference count is at least 50",
    phase: "opening",
    measuredFloorGames: 25,
    source: "exact position/move identity plus a pinned versioned opening reference population",
    productionGap: "reference_and_runtime_identity",
    botUse: "future_repertoire",
    literalSentence: "Across {games} measured games, your first eight plies were {value} bits surprising relative to {reference} ({interval}).",
  },
  {
    metricId: "opening_family_entropy",
    featureId: "opening.family@1",
    unit: "game",
    value: "Shannon entropy over exact three-character ECO families",
    denominator: "games with a resolved runtime opening family",
    phase: "opening",
    measuredFloorGames: 100,
    source: "runtime opening identity and its pinned local CC0 artifact",
    productionGap: "reference_and_runtime_identity",
    botUse: "future_repertoire",
    literalSentence: "Across {games} measured games, your openings covered {families} ECO families with {value} bits of family entropy ({interval}).",
  },
  {
    metricId: "fianchetto_setup_rate",
    featureId: "structure.fianchetto_setup@1",
    unit: "game",
    value: "games reaching the declared bishop-plus-pawn configuration / eligible games",
    denominator: "games with a complete legal main line",
    phase: "all",
    measuredFloorGames: 25,
    source: "rules-exact piece-square configuration over the game path",
    productionGap: "collector_and_store_extension",
    botUse: "future_controlled_trait",
    literalSentence: "You reached the declared fianchetto setup in {numerator} of {denominator} measured games ({interval}).",
  },
  {
    metricId: "fianchetto_knight_screen_rate",
    featureId: "structure.fianchetto_knight_screen@1",
    unit: "game",
    value: "games reaching the setup with the same-side knight on the first inward diagonal / eligible games",
    denominator: "games with a complete legal main line",
    phase: "all",
    measuredFloorGames: 200,
    source: "rules-exact piece-square configuration over the game path",
    productionGap: "collector_and_store_extension",
    botUse: "future_controlled_trait",
    literalSentence: "You reached the declared fianchetto-with-knight-screen setup in {numerator} of {denominator} measured games ({interval}).",
  },
  {
    metricId: "castle_kingside_rate",
    featureId: "move.castle_side@1",
    unit: "game",
    value: "games in which the learner castled kingside / eligible games",
    denominator: "games where the learner retained a castling right at their first move",
    phase: "all",
    measuredFloorGames: 50,
    source: "rules.transition.event.castled plus initial learner-side castling rights",
    productionGap: "denominator_projection_mismatch",
    botUse: "future_controlled_trait",
    literalSentence: "You castled kingside in {numerator} of {denominator} measured games that began with a castling right ({interval}).",
  },
  {
    metricId: "castle_queenside_rate",
    featureId: "move.castle_side@1",
    unit: "game",
    value: "games in which the learner castled queenside / eligible games",
    denominator: "games where the learner retained a castling right at their first move",
    phase: "all",
    measuredFloorGames: 50,
    source: "rules.transition.event.castled plus initial learner-side castling rights",
    productionGap: "denominator_projection_mismatch",
    botUse: "future_controlled_trait",
    literalSentence: "You castled queenside in {numerator} of {denominator} measured games that began with a castling right ({interval}).",
  },
  clock("opening", 100),
  clock("middlegame", 50),
  clock("endgame", 25),
  {
    metricId: "pawn_choice_residual",
    featureId: "move.role.pawn@1",
    unit: "decision",
    value: "mean played-pawn indicator minus pawn-move share over all legal alternatives",
    denominator: "all eligible learner decisions with a complete legal-candidate set",
    phase: "all",
    measuredFloorGames: 100,
    source: "exact move role and complete legal alternatives",
    productionGap: "collector_and_store_extension",
    botUse: "future_controlled_trait",
    literalSentence: "Relative to the legal choices you received, your pawn-choice residual was {value} across {decisions} decisions ({interval}).",
  },
  {
    metricId: "center_pawn_choice_residual",
    featureId: "move.pawn_to_extended_center@1",
    unit: "decision",
    value: "mean played center-pawn indicator minus its share over all legal alternatives",
    denominator: "all eligible learner decisions with a complete legal-candidate set",
    phase: "all",
    measuredFloorGames: 200,
    source: "exact move role/destination and complete legal alternatives",
    productionGap: "collector_and_store_extension",
    botUse: "future_controlled_trait",
    literalSentence: "Relative to the legal choices you received, your extended-center pawn residual was {value} across {decisions} decisions ({interval}).",
  },
  {
    metricId: "early_queen_choice_residual",
    featureId: "move.early_queen@1",
    unit: "decision",
    value: "mean played queen-move-before-ply-16 indicator minus its share over all legal alternatives",
    denominator: "learner decisions before ply 16 with a complete legal-candidate set",
    phase: "opening",
    measuredFloorGames: 100,
    source: "exact ply, move role and complete legal alternatives",
    productionGap: "collector_and_store_extension",
    botUse: "future_controlled_trait",
    literalSentence: "Relative to the legal choices you received before ply 16, your early-queen residual was {value} across {decisions} decisions ({interval}).",
  },
]);

export const PRESENTATION_CONTRACT = Object.freeze({
  required: Object.freeze([
    "metric id and version", "value", "95% game-bootstrap interval", "game and decision counts",
    "metric-specific floor", "window", "phase/time-control scope", "reference id and version when used",
    "exact contributing game/ply references", "abstention reason",
  ]),
  deterministicFirst: true,
  llmAuthority: "paraphrase one sealed admitted metric card; no selection, comparison invention, diagnosis, advice, archetype, grade, or move recommendation",
  privateByDefault: true,
  refusedLabels: Object.freeze([
    "aggressive", "solid", "tactical", "positional", "creative", "simple", "weakness",
    "strength", "needs work", "plays like", "grandmaster twin",
  ]),
});

export const TWO_GATE_RULE = Object.freeze({
  sharedMeaning: "A feature id denotes the same literal predicate for every consumer.",
  styleGate: "A learner metric must pass R12 stability/transfer and privacy gates over learner-owned history.",
  botGate: "A candidate weight must pass the bot-policy controlled-trait gate over bot move selection.",
  runtimeWall: "Neither consumer reads the other's state: bot policy never reads learner history, and style aggregation never reads bot selector weights.",
});
