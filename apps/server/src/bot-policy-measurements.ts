import type { BotMeasurementId } from "@chess-tabiya/runtime";

/**
 * The measured facts a bot card may state, each bound to the committed artifact it came from.
 * `bot-policy-measurements.test.ts` re-reads every artifact and fails if a value here drifts, so a
 * card sentence can only carry a number some committed measurement actually produced.
 */
export const BOT_POLICY_MEASUREMENTS = Object.freeze({
  "measurement.sampler_reconstruction@1": Object.freeze({
    artifact: "planning/platform-alignment/bot-policy/results.json",
    dossier: "design/research/bot-policy.md",
    measuredAt: "2026-08-20",
    cells: 837,
    capturedExpectedLossCp: 19.566308,
    reconstructedExpectedLossCp: 19.838845,
    capturedSevere250: 0.003584,
    reconstructedSevere250: 0.003866,
    rawVectorExpectedLossCp: 59.126514,
  }),
  "measurement.guard_depth8@1": Object.freeze({
    artifact: "planning/platform-alignment/bot-policy/d969-depth8-abstain-results.json",
    dossier: "design/research/stockfish-candidate-guard-probe.md",
    measuredAt: "2026-08-23",
    cells: 804,
    thresholdCp: 250,
    severeRemoved: 1,
    strengtheningCp: 1.357842,
    humanRetention: 1.002097,
    mixedScorePolicy: "abstain",
  }),
  "measurement.pawn_x4_depth8@1": Object.freeze({
    artifact: "planning/platform-alignment/bot-policy/d969-depth8-abstain-results.json",
    dossier: "design/research/stockfish-candidate-guard-probe.md",
    measuredAt: "2026-08-23",
    cells: 804,
    multiplier: 4,
    guardedPawnRate: 0.335371,
    traitPawnRate: 0.458155,
    traitDelta: 0.122784,
    lossDeltaCp: -0.875534,
    severeRise: -0.004316,
    humanRetention: 0.987855,
  }),
  "measurement.maia_band_ladder@1": Object.freeze({
    artifact: "tools/d333-band-outcome-harness/out/summary.json",
    dossier: "design/research/maia-band-outcome-transfer.md",
    gamesPerRung: 1020,
    reference: 1400,
    bands: Object.freeze([1000, 1400, 1800, 2200] as const),
    monotone: true,
    allCiDisjoint: true,
    timeControl: "untimed engine-vs-engine",
  }),
} as const satisfies Record<BotMeasurementId, Readonly<Record<string, unknown>>>);
