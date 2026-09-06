import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyCalibration, validateManifest } from "./contract.mjs";

const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8"));

const metric = (id, state = "pass") => ({ id, state });
const complete = (overrides = {}) => ({
  policyFamily: "human-baseline",
  strength: "calibrated_relative",
  metrics: [
    metric("candidate_loss_ecdf"),
    metric("regan_s_c"),
    metric("candidate_loss_tail"),
    metric("opening_band_identity"),
  ],
  ...overrides,
});

test("the preregistration derives seventeen arms and 13,200 games", () => {
  const parsed = validateManifest(manifest);
  assert.equal(parsed.experiment.arms.length, 17);
  assert.equal(parsed.experiment.arms.reduce((sum, arm) => sum + arm.games, 0), 13_200);
});

test("all required distribution metrics plus band identity earn the human-like label", () => {
  assert.deepEqual(classifyCalibration(manifest, complete()), {
    strength: "calibrated_relative",
    distribution: "human_reference_equivalent",
    bandIdentity: "supported",
    humanLikeLabelAllowed: true,
  });
});

test("relative strength alone never earns a human-like claim", () => {
  const result = complete({
    metrics: [
      metric("candidate_loss_ecdf"),
      metric("regan_s_c"),
      metric("candidate_loss_tail", "fail"),
      metric("opening_band_identity"),
    ],
  });
  assert.equal(classifyCalibration(manifest, result).distribution, "rejected");
  assert.equal(classifyCalibration(manifest, result).humanLikeLabelAllowed, false);
});

test("a guard may publish controlled divergence only with exact failed-metric disclosure", () => {
  const result = complete({
    policyFamily: "guarded-human",
    metrics: [
      metric("candidate_loss_ecdf"),
      metric("regan_s_c"),
      metric("candidate_loss_tail", "fail"),
      metric("opening_band_identity"),
    ],
    divergenceDisclosure: {
      failedMetricIds: ["candidate_loss_tail"],
      responsibleLayer: "guard.severe_error@1",
    },
  });
  assert.deepEqual(classifyCalibration(manifest, result), {
    strength: "calibrated_relative",
    distribution: "controlled_divergence",
    bandIdentity: "supported",
    humanLikeLabelAllowed: false,
  });
});

test("controlled divergence cannot hide another failed metric", () => {
  const result = complete({
    policyFamily: "guarded-human",
    metrics: [
      metric("candidate_loss_ecdf", "fail"),
      metric("regan_s_c"),
      metric("candidate_loss_tail", "fail"),
      metric("opening_band_identity"),
    ],
    divergenceDisclosure: {
      failedMetricIds: ["candidate_loss_tail"],
      responsibleLayer: "guard.severe_error@1",
    },
  });
  assert.throws(() => classifyCalibration(manifest, result), /every and only failed/u);
});

test("insufficient human reference data stays insufficient", () => {
  const result = complete({
    metrics: [
      metric("candidate_loss_ecdf"),
      metric("regan_s_c", "insufficient"),
      metric("candidate_loss_tail"),
      metric("opening_band_identity", "insufficient"),
    ],
  });
  assert.deepEqual(classifyCalibration(manifest, result), {
    strength: "calibrated_relative",
    distribution: "insufficient",
    bandIdentity: "insufficient",
    humanLikeLabelAllowed: false,
  });
});

test("unresolved relative strength blocks the label even when distributions pass", () => {
  assert.equal(classifyCalibration(manifest, complete({ strength: "unresolved" })).humanLikeLabelAllowed, false);
});

test("missing, duplicate and post-hoc metrics fail closed", () => {
  assert.throws(
    () => classifyCalibration(manifest, complete({ metrics: [metric("candidate_loss_ecdf")] })),
    /missing required metric/u,
  );
  assert.throws(
    () => classifyCalibration(manifest, complete({ metrics: [
      metric("candidate_loss_ecdf"), metric("candidate_loss_ecdf"), metric("regan_s_c"), metric("candidate_loss_tail"),
    ] })),
    /duplicate metric result/u,
  );
  assert.throws(
    () => classifyCalibration(manifest, complete({ metrics: [
      metric("candidate_loss_ecdf"), metric("regan_s_c"), metric("candidate_loss_tail"), metric("invented_after_results"),
    ] })),
    /unknown metric/u,
  );
});

test("arm and human-reference drift are rejected", () => {
  const missingArm = structuredClone(manifest);
  missingArm.experiment.arms.pop();
  assert.throws(() => validateManifest(missingArm), /arms drifted/u);

  const widenedBand = structuredClone(manifest);
  widenedBand.humanReference.bands[0].min = 800;
  assert.throws(() => validateManifest(widenedBand));

  const coercedMate = structuredClone(manifest);
  coercedMate.analysisAuthority.mateCoercion = "mate-as-100000cp";
  assert.throws(() => validateManifest(coercedMate));
});
