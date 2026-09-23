// Disposable corrected-frame arm-2 sensitivity. Complete exact replies remain
// the denominator; only declared check/capture/attack replies receive the
// additional learner ply. Restricted results are never all-defence claims.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { replayReply } from "./exact-arm-trigger-core.mjs";
import { checkExactReplyBoundary, evaluateBoundedTarget, legalMoves } from "./coherent-bounded-targets.js";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
  "d3262-coherent-exact-replies.json", "d3262-coherent-bounded-targets.json"];
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sha(bytes: Buffer | string): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row: any): string { return JSON.stringify([row.rootId, row.targetId, row.candidateUci]); }
function readingMatches(actual: any, recorded: any): boolean {
  return ["kind", "immediate", "reintroducedWithin3Ply", "preparationSurvivesEveryDefence",
    "witness", "refutation", "visited"].every((field) => JSON.stringify(actual[field]) === JSON.stringify(recorded[field]));
}

export function compileCoherentExactTriggerOutcome(comparisons: any, frame: any, graph: any, bounded: any): any {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && frame.profile === "d3262-coherent-root-v1" && graph.profile === "d3262-coherent-root-v1"
    && bounded.profile === "d3262-coherent-bounded-targets-v1"
    && comparisons.manifest === frame.manifest && frame.manifest === graph.manifest
    && graph.manifest === bounded.manifest
    && comparisons.comparisons.length === 182 && bounded.rows.length === 182,
  "Crossed corrected exact-arm population");
  const definitions = new Map(comparisons.definitions.map((value: any) => [value.id, value]));
  const roots = new Map(frame.roots.map((value: any) => [value.rootId, value]));
  const graphRoots = new Map(graph.roots.map((value: any) => [value.rootId, value]));
  const prior = new Map(bounded.rows.map((value: any) => [key(value), value]));
  check(definitions.size === 64 && roots.size === 66 && graphRoots.size === 66 && prior.size === 182,
    "Corrected exact-arm identity denominator changed");
  const checkedCandidates = new Set<string>();
  const rows = comparisons.comparisons.map((pair: any) => {
    const id = key(pair), definition: any = definitions.get(pair.targetId);
    const root: any = roots.get(pair.rootId), graphRoot: any = graphRoots.get(pair.rootId);
    const candidate = graphRoot?.candidates.find((value: any) => value.candidateUci === pair.candidateUci);
    const original: any = prior.get(id);
    check(definition?.rootId === pair.rootId && root?.fen === graphRoot?.fen
      && root.candidates.some((value: any) => value.moveUci === pair.candidateUci)
      && candidate !== undefined && original?.family === definition.family
      && original.sourceObserved === pair.sourceObserved,
    `Missing or crossed corrected exact-arm comparison ${id}`);
    const candidateKey = JSON.stringify([pair.rootId, pair.candidateUci]);
    if (!checkedCandidates.has(candidateKey)) {
      checkExactReplyBoundary(root.fen, pair.candidateUci, graphRoot, candidate);
      checkedCandidates.add(candidateKey);
    }
    const allLegal = evaluateBoundedTarget(root.fen, pair.candidateUci, definition);
    check(readingMatches(allLegal, original), `Complete exact result disagrees ${id}`);
    const squareControl = new Set<string>(), enemyPiece = new Set<string>();
    let squareLearnerEdges = 0, pieceLearnerEdges = 0;
    for (const reply of candidate.replies) {
      const { afterCandidate, newAttack } = replayReply(candidate, reply, definition);
      const squareTrigger = reply.givesCheck || reply.captures || newAttack;
      const pieceTrigger = reply.givesCheck || reply.captures
        || (definition.family === "material" && newAttack);
      const edges = squareTrigger ? legalMoves(afterCandidate).length : 0;
      if (squareTrigger) { squareControl.add(reply.uci); squareLearnerEdges += edges; }
      if (pieceTrigger) { enemyPiece.add(reply.uci); pieceLearnerEdges += edges; }
    }
    check([...enemyPiece].every((uci) => squareControl.has(uci)), `Enemy-piece trigger exceeds square-control trigger ${id}`);
    const variants = Object.fromEntries(([ ["square_control", squareControl, squareLearnerEdges],
      ["enemy_piece", enemyPiece, pieceLearnerEdges] ] as const).map(([name, triggers, learnerEdges]) => {
      const result = evaluateBoundedTarget(root.fen, pair.candidateUci, definition, triggers);
      check(result.kind === "result" && (!result.reintroducedWithin3Ply || allLegal.reintroducedWithin3Ply)
        && (!result.preparationSurvivesEveryDefence || allLegal.preparationSurvivesEveryDefence),
      `Restricted preparation result exceeded complete exact result ${id}/${name}`);
      return [name, { triggerUcis: [...triggers].sort(), learnerEdges, result,
        missedReintroduction: allLegal.reintroducedWithin3Ply && !result.reintroducedWithin3Ply,
        missedSurvivingPreparation: allLegal.preparationSurvivesEveryDefence
          && !result.preparationSurvivesEveryDefence }];
    }));
    return { rootId: pair.rootId, targetId: pair.targetId, candidateUci: pair.candidateUci,
      sourceObserved: pair.sourceObserved, family: definition.family,
      exactReplyCount: candidate.replyCount, allLegal, variants };
  });
  check(rows.length === 182 && new Set(rows.map(key)).size === 182,
    "Corrected exact-arm comparison identity changed");
  return { version: 1, profile: "d3262-coherent-exact-trigger-outcome-v1", manifest: comparisons.manifest,
    authority: "forcing_limited_exact_target_sensitivity_not_all_defences_or_engine_reason",
    interpretations: ["square_control", "enemy_piece"], rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentExactTriggerOutcome(...inputs.map((value) => JSON.parse(value.toString())) as [any, any, any, any]),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-exact-trigger-outcome.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Coherent exact trigger outcome differs from sealed inputs");
  const summary = Object.fromEntries(artifact.interpretations.map((name: string) => {
    const rows = artifact.rows.map((row: any) => row.variants[name]);
    return [name, { comparisons: rows.length,
      forcingReplies: rows.reduce((sum: number, row: any) => sum + row.triggerUcis.length, 0),
      learnerEdges: rows.reduce((sum: number, row: any) => sum + row.learnerEdges, 0),
      missedReintroductions: rows.filter((row: any) => row.missedReintroduction).length,
      missedSurvivingPreparations: rows.filter((row: any) => row.missedSurvivingPreparation).length,
      budgetExhausted: rows.filter((row: any) => row.result.kind === "budget_exhausted").length }];
  }));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), summary }, null, 2)}\n`);
}
