import assert from "node:assert/strict";

const EXACT_ARM_IDS = [
  "C1", "C2", "N",
  "A1", "A2", "A3", "A4",
  "B1", "B2", "B3", "B4",
  "P1", "P2", "P3", "P4",
  "G1", "G2",
];

const EXACT_BANDS = [
  ["1000", 1000, 1399],
  ["1400", 1400, 1799],
  ["1800", 1800, 2199],
  ["2200", 2200, 2599],
];

const EXACT_WINDOWS = [
  ["opening-8-16", 8, 16],
  ["middlegame-17-40", 17, 40],
  ["late-41-plus", 41, null],
];

const REQUIRED_DISTRIBUTION_METRICS = [
  "candidate_loss_ecdf",
  "regan_s_c",
  "candidate_loss_tail",
];

function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
}

export function validateManifest(manifest) {
  assert.equal(manifest.schema, "tabiya.research.bot-calibration-gates.v1");
  const arms = manifest.experiment.arms;
  equal(arms.map((arm) => arm.id), EXACT_ARM_IDS, "experiment arms drifted");
  assert.equal(new Set(arms.map((arm) => arm.id)).size, arms.length, "duplicate arm id");
  assert.equal(arms.length, 17, "the experiment has seventeen arms");
  assert.equal(arms.reduce((sum, arm) => sum + arm.games, 0), 13_200, "the exact population is 13,200 games");

  const profileArms = arms.filter((arm) => arm.kind === "profile");
  assert.equal(profileArms.length, 12);
  equal(
    profileArms.map((arm) => arm.profile),
    ["human-baseline", "guarded-human", "pawn-forward"].flatMap((family) =>
      [1000, 1400, 1800, 2200].map((band) => `${family}-${band}`),
    ),
    "profile population must be the exact 3x4 product",
  );

  const human = manifest.humanReference;
  assert.equal(human.license, "CC0");
  assert.match(human.sourceUrl, /^https:\/\/database\.lichess\.org\/standard\//u);
  assert.match(human.compressedSha256, /^sha256:[0-9a-f]{64}$/u);
  assert.match(human.decompressedSha256, /^sha256:[0-9a-f]{64}$/u);
  equal(human.bands.map(({ id, min, max }) => [id, min, max]), EXACT_BANDS);
  equal(human.windows.map(({ id, minPly, maxPly }) => [id, minPly, maxPly]), EXACT_WINDOWS);
  assert.equal(human.decisionsPerBandWindow, 2000);
  assert.match(human.selection, /one-decision-per-game-window/u);
  assert.match(human.split, /fixed before engine analysis/u);

  const authority = manifest.analysisAuthority;
  assert.equal(authority.engine, "Stockfish 18");
  equal(authority.bound, { kind: "depth", value: 8 });
  equal(authority.resetPerPosition, ["ucinewgame", "Clear Hash", "isready"]);
  assert.equal(authority.candidateSet, "all exact legal moves");
  equal(authority.scoreDomains, ["centipawn", "mate"]);
  assert.equal(authority.mateCoercion, "forbidden");

  const metrics = manifest.metrics;
  assert.equal(new Set(metrics.map((metric) => metric.id)).size, metrics.length, "duplicate metric id");
  equal(
    metrics.filter((metric) => metric.requiredForHumanDistribution).map((metric) => metric.id),
    REQUIRED_DISTRIBUTION_METRICS,
  );
  for (const metric of metrics) {
    assert.match(metric.referenceLimit, /999 deterministic/u, `${metric.id} has no frozen reference procedure`);
    assert.ok(metric.test.length > 20, `${metric.id} has no executable verdict expression`);
  }
  const tail = metrics.find((metric) => metric.id === "candidate_loss_tail");
  equal(tail.thresholdsCp, [50, 100, 150, 250]);
  assert.equal(tail.mateLossArm, true);

  equal(manifest.multiplicity, {
    method: "holm-bonferroni",
    familyWiseAlpha: 0.05,
    family: "every claimed profile x every required metric; no metric may be dropped after results",
  });

  equal(manifest.verdicts.strength, ["calibrated_relative", "unresolved", "invalid"]);
  equal(manifest.verdicts.distribution, ["human_reference_equivalent", "controlled_divergence", "rejected", "insufficient"]);
  equal(manifest.verdicts.bandIdentity, ["supported", "refuted", "insufficient"]);
  assert.equal(manifest.verdicts.controlledDivergence.labelPermission, "mechanism-only; human-like/personality-equivalence forbidden");
  return manifest;
}

export function classifyCalibration(manifest, result) {
  validateManifest(manifest);
  const required = new Set(REQUIRED_DISTRIBUTION_METRICS);
  const supplied = new Map(result.metrics.map((metric) => [metric.id, metric]));
  assert.equal(supplied.size, result.metrics.length, "duplicate metric result");
  for (const id of required) assert.ok(supplied.has(id), `missing required metric ${id}`);

  const allowedIds = new Set(manifest.metrics.map((metric) => metric.id));
  for (const id of supplied.keys()) assert.ok(allowedIds.has(id), `unknown metric ${id}`);

  const requiredResults = [...required].map((id) => supplied.get(id));
  let distribution;
  if (requiredResults.some((metric) => metric.state === "insufficient")) {
    distribution = "insufficient";
  } else if (requiredResults.every((metric) => metric.state === "pass")) {
    distribution = "human_reference_equivalent";
  } else if (
    manifest.verdicts.controlledDivergence.allowedPolicyFamilies.includes(result.policyFamily)
    && requiredResults.some((metric) => metric.state === "fail")
    && result.divergenceDisclosure?.failedMetricIds?.length > 0
    && result.divergenceDisclosure?.responsibleLayer
  ) {
    equal(
      [...result.divergenceDisclosure.failedMetricIds].sort(),
      requiredResults.filter((metric) => metric.state === "fail").map((metric) => metric.id).sort(),
      "controlled divergence must disclose every and only failed required metric",
    );
    distribution = "controlled_divergence";
  } else {
    distribution = "rejected";
  }

  const opening = supplied.get("opening_band_identity");
  const bandIdentity = !opening || opening.state === "insufficient"
    ? "insufficient"
    : opening.state === "pass" ? "supported" : "refuted";

  assert.ok(manifest.verdicts.strength.includes(result.strength), "unknown strength verdict");
  const humanLikeLabelAllowed =
    result.strength === manifest.verdicts.humanLikeLabelRequires.strength
    && distribution === manifest.verdicts.humanLikeLabelRequires.distribution
    && bandIdentity === manifest.verdicts.humanLikeLabelRequires.bandIdentity;

  return { strength: result.strength, distribution, bandIdentity, humanLikeLabelAllowed };
}

export const contractConstants = Object.freeze({
  armIds: Object.freeze(EXACT_ARM_IDS),
  requiredDistributionMetrics: Object.freeze(REQUIRED_DISTRIBUTION_METRICS),
});
