// Disposable D3298 projection: an observed one-sided branch is not a proved
// same-target root-move contrast while the other branch has unvisited replies.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-bounded-contrast.json", "d3262-coherent-frontier-target-outcome.json"];
const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function key(rootId, targetId, candidateUci) { return JSON.stringify([rootId, targetId, candidateUci]); }
function direction(source, alternative) {
  return source === alternative ? "same"
    : source ? "source_only_opponent_option" : "alternative_only_opponent_option";
}
function classify(cell, arm) {
  const complete = arm.unvisitedLegal === 0;
  check(arm.selectedCount + arm.unvisitedLegal === cell.legalReplyCount
    && arm.proofCeiling === (complete ? "complete_exact_reply_set" : "partial_frontier")
    && (!complete || arm.result.reintroducedWithin3Ply === cell.exact.reintroducedWithin3Ply
      && arm.result.preparationSurvivesEveryDefence === cell.exact.preparationSurvivesEveryDefence)
    && arm.result.immediate === cell.exact.immediate
    && (!arm.result.reintroducedWithin3Ply || cell.exact.reintroducedWithin3Ply)
    && (!arm.result.preparationSurvivesEveryDefence || cell.exact.preparationSurvivesEveryDefence),
  `Selected arm exceeds exact authority ${key(cell.rootId, cell.targetId, cell.candidateUci)}/${arm.arm}`);
  if (arm.result.immediate === "preserved") return "direct_witness";
  if (arm.result.immediate === "identity_lost") return "named_identity_lost";
  if (arm.result.reintroducedWithin3Ply) return "bounded_witness";
  return arm.proofCeiling === "complete_exact_reply_set" ? "complete_bounded_absence" : "unknown_unvisited_replies";
}
function positive(status) { return status === "direct_witness" || status === "bounded_witness"; }
function known(status) { return status !== "unknown_unvisited_replies"; }

export function compileCoherentFrontierContrast(contrast, frontier) {
  check(contrast.profile === "d3262-coherent-bounded-contrast-v1"
    && frontier.profile === "d3262-coherent-frontier-target-outcome-v1"
    && contrast.manifest === frontier.manifest
    && contrast.rows.length === 116 && contrast.unpairedTargets.length === 17
    && frontier.rows.length === 182 && frontier.controls.length === 4,
  "Crossed same-target contrast and selected frontier authorities");
  const cells = new Map(frontier.rows.map((row) => [key(row.rootId, row.targetId, row.candidateUci), row]));
  check(cells.size === 182, "Duplicate selected target cell");
  const armNames = frontier.rows[0].arms.map((arm) => arm.arm);
  check(armNames.length === 29 && new Set(armNames).size === 29
    && frontier.rows.every((row) => row.arms.length === 29
      && row.arms.every((arm, index) => arm.arm === armNames[index])),
  "The selected cells do not share one 29-arm profile");
  const rows = contrast.rows.map((pair) => {
    const source = cells.get(key(pair.rootId, pair.targetId, pair.sourceCandidateUci));
    const alternative = cells.get(key(pair.rootId, pair.targetId, pair.alternativeCandidateUci));
    check(source?.family === pair.family && alternative?.family === pair.family
      && source.sourceObserved === true && alternative.sourceObserved === false
      && source.exact.immediate === pair.source.immediate
      && alternative.exact.immediate === pair.alternative.immediate
      && source.exact.reintroducedWithin3Ply === pair.source.reintroducedWithin3Ply
      && alternative.exact.reintroducedWithin3Ply === pair.alternative.reintroducedWithin3Ply
      && source.exact.preparationSurvivesEveryDefence === pair.source.preparationSurvivesEveryDefence
      && alternative.exact.preparationSurvivesEveryDefence === pair.alternative.preparationSurvivesEveryDefence,
    `Crossed exact same-target pair ${pair.rootId}/${pair.targetId}`);
    const exact = direction(pair.source.immediate === "preserved" || pair.source.reintroducedWithin3Ply,
      pair.alternative.immediate === "preserved" || pair.alternative.reintroducedWithin3Ply);
    check(exact === pair.reachWithinBound, `Exact pair direction changed ${pair.rootId}/${pair.targetId}`);
    const arms = armNames.map((name, index) => {
      const sourceArm = source.arms[index], alternativeArm = alternative.arms[index];
      const sourceStatus = classify(source, sourceArm);
      const alternativeStatus = classify(alternative, alternativeArm);
      const observed = direction(positive(sourceStatus), positive(alternativeStatus));
      const certified = known(sourceStatus) && known(alternativeStatus) ? observed : null;
      check(certified === null || certified === exact,
        `Certified partial contrast disagrees with exact pair ${pair.rootId}/${pair.targetId}/${name}`);
      return { arm: name, sourceStatus, alternativeStatus,
        observed, certified, abstains: certified === null,
        apparentOnExactSame: exact === "same" && observed !== "same" };
    });
    return { rootId: pair.rootId, targetId: pair.targetId, family: pair.family,
      sourceCandidateUci: pair.sourceCandidateUci, alternativeCandidateUci: pair.alternativeCandidateUci,
      boundedScope: pair.boundedScope, exact, arms };
  });
  check(new Set(rows.map((row) => JSON.stringify([row.rootId, row.targetId,
    row.sourceCandidateUci, row.alternativeCandidateUci]))).size === 116,
  "Duplicate same-target pair");
  return { version: 1, profile: "d3262-coherent-frontier-contrast-v1", manifest: contrast.manifest,
    authority: "same_target_partial_first_reply_observations_with_explicit_abstention_not_engine_cause",
    armNames, unpairedTargetCount: contrast.unpairedTargets.length, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentFrontierContrast(...inputs.map((bytes) => JSON.parse(bytes))),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-frontier-contrast.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Same-target frontier contrast differs from sealed inputs");
  const summary = Object.fromEntries(artifact.armNames.map((name) => {
    const arms = artifact.rows.map((row) => ({ exact: row.exact, ...row.arms.find((arm) => arm.arm === name) }));
    return [name, { pairs: arms.length,
      exactDirectional: arms.filter((row) => row.exact !== "same").length,
      observedDirectional: arms.filter((row) => row.observed !== "same").length,
      observedCorrectDirectional: arms.filter((row) => row.exact !== "same" && row.observed === row.exact).length,
      certifiedDirectional: arms.filter((row) => row.certified !== null && row.certified !== "same").length,
      apparentOnExactSame: arms.filter((row) => row.apparentOnExactSame).length,
      abstentions: arms.filter((row) => row.abstains).length }];
  }));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), pairs: artifact.rows.length,
    unpairedTargets: artifact.unpairedTargetCount, summary }, null, 2)}\n`);
}
