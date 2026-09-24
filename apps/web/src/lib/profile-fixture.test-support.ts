// TEST-ONLY: a learner-profile response in the exact server shape (apps/server/src/learner-profile.ts).
const contributors = (runs: readonly string[]) => ({
  total: runs.length,
  shown: runs.slice(0, 5).map((runId, index) => ({ runId, nodeId: `${runId}-n3`, ply: 3, moveSan: "Bg2", observedAt: `2026-09-0${index + 1}T10:00:00.000Z` })),
  hiddenCount: Math.max(0, runs.length - 5),
});

const tierEstablished = () => ({ rule: "reference_quantile_lower_bound@1", state: "established", operands: { rate: 0.4, interval: [0.22, 0.6], population: "25 measured games, 700 decisions", phase: "all", timeControl: "all_recorded_games", version: 1 } });
const tierInsufficient = (floor: number, games: number) => ({ rule: "reference_quantile_lower_bound@1", state: "insufficient_evidence", operands: { floor, games, population: "your recorded games", phase: "all", timeControl: "all_recorded_games", version: 1 } });

export function profileFixture() {
  const runIds = Array.from({ length: 10 }, (_, index) => `run-${index}`);
  return {
    profile: {
      derivationRev: 1,
      store: { status: "ready", runs: 26, counted: 25, pending: 1, failed: 0, unavailable: 0, statement: "25 of your 26 saved runs are counted; 1 is still being processed." },
      population: { measuredGames: 25, playedDecisions: 700, otherRuns: 0, definition: "A measured game is a run that began from the standard starting position with at least one move attributed to you. Only its first line counts.", window: { from: "2026-09-01T10:00:00.000Z", to: "2026-09-20T10:00:00.000Z" } },
      style: {
        cards: [
          {
            kind: "habit_card", state: "measured", metricId: "fianchetto_setup_rate", featureId: "structure.fianchetto_setup@1", version: 1, unit: "game",
            title: "Fianchetto setup reached", floor: 25, games: 25, decisions: 700, phaseScope: "all", timeControlScope: "all_recorded_games", reference: null,
            valueDefinition: "games in which your bishop stood on b2/g2", denominatorDefinition: "measured games",
            sentence: "You reached the declared fianchetto setup in 10 of 25 measured games (95% interval 0.22 to 0.60). This card's floor is 25 games.",
            contributors: contributors(runIds), tier: tierEstablished(), value: 0.4, valueText: "10 of 25 games", numerator: 10, eligibleGames: 25,
            interval: { level: 0.95, method: "game_bootstrap", resamples: 1000, seed: "fianchetto_setup_rate@1", lower: 0.22, upper: 0.6 },
            window: { from: "2026-09-01T10:00:00.000Z", to: "2026-09-20T10:00:00.000Z" }, baseline: null,
          },
          {
            kind: "habit_card", state: "abstained", metricId: "castle_kingside_rate", featureId: "move.castle_side@1", version: 1, unit: "game",
            title: "Castled kingside", floor: 50, games: 25, decisions: 700, phaseScope: "all", timeControlScope: "all_recorded_games", reference: null,
            valueDefinition: "games in which you castled kingside", denominatorDefinition: "games in which you still had a castling right at your first move",
            sentence: "This card's floor is 50 games; 25 measured.", contributors: contributors(runIds), tier: tierInsufficient(50, 25),
            abstention: { code: "below_floor", floor: 50, measuredGames: 25 },
          },
          {
            kind: "habit_card", state: "abstained", metricId: "clock_spend_share:opening", featureId: "time.spend_share@1", version: 1, unit: "decision",
            title: "Time used per opening move", floor: 100, games: 25, decisions: 700, phaseScope: "opening", timeControlScope: "all_recorded_games", reference: null,
            valueDefinition: "mean share of the time available for each move that the move used", denominatorDefinition: "decisions with valid adjacent clock readings in the opening",
            sentence: "This card cannot be measured yet. No run records typed clock readings yet, so thinking time cannot be measured.", contributors: { total: 0, shown: [], hiddenCount: 0 },
            tier: tierInsufficient(100, 25),
            abstention: { code: "blocked", blockerClass: "collector_store", blocked: "clock_readings_unrecorded", detail: "No run records typed clock readings yet, so thinking time cannot be measured.", home: "rfc/recorded-clocks.md Discharge D4" },
          },
        ],
        disclosures: ["Each card counts only your own moves in games you started from the standard starting position; for a rewound game, only its first line counts."],
      },
      openings: {
        available: true, unavailableReason: null, unresolvedGames: 2,
        rateStatement: "Results are shown as counts. No win rate is shown: no measured floor says how many games in one opening a rate needs before it means anything.",
        source: "Lichess chess-openings abcdef1 (CC0), matched by exact position.",
        rows: [{
          key: "C50 Italian Game", eco: "C50", name: "Italian Game", games: 3, results: { win: 1, draw: 1, loss: 0, noResult: 1 },
          firstPlayedAt: "2026-09-01T10:00:00.000Z", lastPlayedAt: "2026-09-03T10:00:00.000Z", contributors: contributors(["run-1", "run-2", "run-3"]),
          relatedPacks: [{ id: "italian-pack", title: "Italian structures" }],
        }],
      },
      observations: {
        playedDecisions: 700,
        statement: "These are counts of what the recorded moves show, each against the decisions where it could have happened. No rate, trend or comparison is shown: no stability floor has been measured for any of them.",
        rows: [{ key: "rules.structural.event.open_file@1:gained:gained", projectionId: "rules.structural.event.open_file", projectionVersion: 1, semanticSign: "gained", sourceSign: "gained", label: "open file — gained", occurred: 4, opportunities: 40, runs: 12, decisions: 300, byPhase: [{ phase: "opening", occurred: 4, opportunities: 40 }], derivedRev: 1 }],
      },
      skills: {
        categories: [
          { category: "fundamentals", label: "Fundamentals", emptyReason: null, marks: [] },
          { category: "openings", label: "Openings", emptyReason: "Opening identity says which opening a game reached, not whether a move in it was good, so nothing here can be credited yet.", marks: [] },
          { category: "tactics", label: "Tactics", emptyReason: null, marks: [] },
          { category: "strategy", label: "Strategy", emptyReason: "Structure, pawn, king and activity observations are neutral until an outcome or cited-theory join supplies a valence, so nothing here can be credited yet.", marks: [] },
          { category: "endgame", label: "Endgame", emptyReason: null, marks: [] },
        ],
        candidateLeaves: [{ leafId: "shape:carlsbad", label: "Carlsbad structure", source: "registered_shape", category: null, blockers: ["valence_unruled"], blockerText: ["No valence declaration is admitted: whether any may be declared is the owner's open ruling (rfc/skills.md Open question 1)."] }],
        valence: { declarations: 0, issues: 0, statement: "No valence declaration has been admitted, so no skill can be credited yet. Whether any may be declared is an open owner ruling (rfc/skills.md Open question 1)." },
        conceptIdentity: "Concept ids are still pack-local; cross-pack identity lands with rfc/concept-registry.md.",
        marksStatement: "A mark records the first time you played a creditable idea when you had a real alternative. It is earned once, never taken away, and links to the move.",
      },
      history: {
        total: 26, offset: 0, hiddenCount: 25,
        items: [{ runId: "run-1", observedAt: "2026-09-20T10:00:00.000Z", sessionKind: "position", packId: null, state: "counted", status: "counted_game", playedDecisions: 28, opening: { eco: "C50", name: "Italian Game" }, outcome: "win", detail: null }],
      },
      privacy: { visibility: "private", statements: ["This profile is private. Only you can read it; no teacher, classroom or other learner has a read path to it."] },
    },
  };
}
