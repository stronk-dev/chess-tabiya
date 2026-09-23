import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileProviderLineArm } from "./provider-line-arm.mjs";

const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-immediate.json", "d3262-destination-reply-witness.json", "d3262-stockfish-capture.json", "d3262-root-frame.json", "d3262-target-register.json", "d3262-fork-control-identity.json", "d3262-bishop-pressure-control.json"];
const inputs = names.map((name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`, "utf8")));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-provider-line-arm.json", "utf8"));

test("three separate Stockfish budgets retain all named target comparisons as PV occurrences", () => {
  assert.deepEqual({ ...compileProviderLineArm(...inputs), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 555);
  assert.deepEqual(artifact.budgets, ["depth8", "depth12", "movetime100"]);
  assert.equal(artifact.rows.filter((row) => row.sourceStatus === "unreturned").length, 0);
  assert.ok(artifact.rows.every((row) => row.pv.length <= 4 && row.pv[0] === row.candidateUci && row.replayedFens.length === row.pv.length));
  assert.deepEqual(artifact.budgets.map((budget) => artifact.rows.filter((row) => row.budget === budget && row.event === "registered_positive_capture_on_line").length), [29, 26, 28]);
  assert.deepEqual(artifact.budgets.map((budget) => artifact.rows.filter((row) => row.budget === budget && row.event === "named_arrival_and_declared_pawn_capture_on_line").length), [0, 0, 0]);
  assert.equal(artifact.controlRows.length, 42);
  assert.deepEqual(artifact.controlRows.filter((row) => row.rootId === "tactical:fork-parried" && row.candidateUci === "e6c7").map((row) => row.event), ["fork_geometry_retained_on_line", "fork_geometry_refuted_on_line", "fork_geometry_refuted_on_line"]);
  assert.ok(artifact.controlRows.filter((row) => row.rootId === "tactical:fork-survives" && row.candidateUci === "e6c7").every((row) => row.event === "fork_geometry_retained_on_line"));
  assert.ok(artifact.controlRows.filter((row) => row.rootId === "pressure:bg4-h3-bh5" && row.candidateUci === "h2h3").every((row) => row.event === "declared_bishop_retreat_not_observed_on_line"));
  assert.ok(artifact.controlRows.filter((row) => row.rootId === "quiet-plan:carlsbad-nf8").every((row) => row.event === "no_autonomous_target"));
  assert.equal(artifact.controlRows.filter((row) => row.event === "no_declared_control_for_candidate").length, 24);
  const selected = new Set(inputs[5].roots.flatMap((root) => root.candidates.map((candidate) => `${root.rootId}|${candidate.moveUci}`)));
  const projected = new Set([...artifact.rows, ...artifact.controlRows].map((row) => `${row.rootId}|${row.candidateUci}`));
  assert.deepEqual(projected, selected);
});

test("a legal positive alternative omitted from the PV is not called a refutation", () => {
  const material = inputs[1].rows.find((row) => row.positiveCaptureUci !== null && artifact.rows.some((arm) => arm.rootId === row.rootId && arm.targetId === row.targetId && arm.candidateUci === row.candidateUci && arm.event === "registered_capture_not_observed_on_line"));
  assert.ok(material);
  const arm = artifact.rows.find((row) => row.rootId === material.rootId && row.targetId === material.targetId && row.candidateUci === material.candidateUci && row.event === "registered_capture_not_observed_on_line");
  assert.notEqual(arm.pv[1], material.positiveCaptureUci);
  assert.equal(arm.sourceStatus, "returned");
});

test("crossed root, illegal PV and silent candidate deletion fail", () => {
  const first = artifact.rows[0];
  const root = inputs[4].rows.find((value) => value.rootId === first.rootId);
  const crossed = structuredClone(inputs[4]);
  crossed.rows.find((value) => value.rootId === first.rootId).fen = inputs[4].rows.find((value) => value.rootId !== first.rootId).fen;
  assert.throws(() => compileProviderLineArm(...inputs.slice(0, 4), crossed, ...inputs.slice(5)), /Crossed provider PV|Illegal provider PV|Invalid provider PV/u);
  const illegal = structuredClone(inputs[4]);
  illegal.rows.find((value) => value.rootId === first.rootId).probes.find((value) => value.budget === first.budget).entries.find((value) => value.moveUci === first.candidateUci).pv[1] = "a1a1";
  assert.throws(() => compileProviderLineArm(...inputs.slice(0, 4), illegal, ...inputs.slice(5)), /Illegal provider PV move/u);
  const deleted = structuredClone(inputs[4]);
  deleted.rows.find((value) => value.rootId === first.rootId).probes.find((value) => value.budget === first.budget).entries = root.probes.find((value) => value.budget === first.budget).entries.filter((value) => value.moveUci !== first.candidateUci);
  assert.throws(() => compileProviderLineArm(...inputs.slice(0, 4), deleted, ...inputs.slice(5)), /Candidate silently missing/u);
});

test("a counterfeit hard control cannot borrow a different declaration", () => {
  const fork = structuredClone(inputs[7]);
  fork.controls.find((row) => row.rootId === "tactical:fork-parried").candidateUci = "e6f4";
  assert.throws(() => compileProviderLineArm(...inputs.slice(0, 7), fork, inputs[8]), /Fork PV reply absent from exact control/u);
});
