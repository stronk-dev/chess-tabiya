// Disposable D3262 common first-reply outcome join. Every arm receives the
// same complete exact target question, but partial reply selection can only
// establish a witnessed line or abstain; a miss is never an exact negative.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { evaluateBoundedTarget } from "./coherent-bounded-targets.js";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-target-comparison-frame.json", "d3262-coherent-root-frame.json",
  "d3262-coherent-exact-replies.json", "d3262-coherent-bounded-targets.json",
  "d3262-coherent-first-reply-frontier.json", "d3262-coherent-semantic-reserve.json"];
const budgets = ["depth8", "depth12", "movetime100"] as const;
const widths = [2, 4, 8] as const;
const thresholds = ["0.80", "0.90"] as const;
const eventWidths = ["top8", "all_legal"] as const;
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sha(bytes: Buffer | string): string { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row: any): string { return JSON.stringify([row.rootId, row.targetId, row.candidateUci]); }
function pathKey(row: any): string { return JSON.stringify([row.rootId, row.candidateUci]); }
function setEquals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && new Set(left).size === left.length && left.every((value) => right.includes(value));
}
function uniqueMap(rows: any[], identity: (row: any) => string, label: string): Map<string, any> {
  const map = new Map(rows.map((row) => [identity(row), row]));
  check(map.size === rows.length, `Duplicate ${label} identity`);
  return map;
}

export function compileCoherentFrontierTargetOutcome(comparisons: any, frame: any, graph: any,
  bounded: any, firstReply: any, reserve: any): any {
  check(comparisons.profile === "d3262-coherent-target-comparison-v1"
    && frame.profile === "d3262-coherent-root-v1" && graph.profile === "d3262-coherent-root-v1"
    && bounded.profile === "d3262-coherent-bounded-targets-v1"
    && firstReply.profile === "d3262-coherent-first-reply-v1"
    && reserve.profile === "d3262-coherent-semantic-reserve-v1"
    && [frame, graph, bounded, firstReply, reserve].every((value) => value.manifest === comparisons.manifest)
    && comparisons.comparisons.length === 182 && comparisons.controls.length === 4
    && bounded.rows.length === 182 && firstReply.rows.length === 193 && reserve.rows.length === 3276,
  "Crossed corrected frontier/target authorities");
  const roots = uniqueMap(frame.roots, (row) => row.rootId, "root");
  const graphRoots = uniqueMap(graph.roots, (row) => row.rootId, "exact graph root");
  const definitions = uniqueMap(comparisons.definitions, (row) => row.id, "target");
  const exact = uniqueMap(bounded.rows, key, "exact target");
  const selected = uniqueMap(firstReply.rows, pathKey, "provider first reply");
  const reserveMap = uniqueMap(reserve.rows,
    (row) => JSON.stringify([key(row), row.budget, row.width, row.eventSourceWidth]), "semantic branch");
  check(roots.size === 66 && graphRoots.size === 66 && definitions.size === 64 && exact.size === 182,
    "Corrected target denominator changed");
  check(JSON.stringify(firstReply.budgets) === JSON.stringify(budgets)
    && JSON.stringify(firstReply.widths) === JSON.stringify(widths)
    && JSON.stringify(reserve.budgets) === JSON.stringify(budgets)
    && JSON.stringify(reserve.widths) === JSON.stringify(widths)
    && JSON.stringify(reserve.eventSourceWidths) === JSON.stringify(eventWidths),
  "Frontier budget/width declaration changed");
  const rows = comparisons.comparisons.map((pair: any) => {
    const id = key(pair), root: any = roots.get(pair.rootId), definition: any = definitions.get(pair.targetId);
    const candidate = graphRoots.get(pair.rootId)?.candidates.find((value: any) => value.candidateUci === pair.candidateUci);
    const full: any = exact.get(id), provider: any = selected.get(pathKey(pair));
    check(root?.fen === graphRoots.get(pair.rootId)?.fen && definition?.rootId === pair.rootId
      && candidate !== undefined && full?.family === definition.family
      && full.sourceObserved === pair.sourceObserved && full.kind === "result"
      && provider !== undefined && provider.legalReplyCount === candidate.replyCount,
    `Missing or crossed first-reply target ${id}`);
    const legal = candidate.replies.map((reply: any) => reply.uci);
    check(new Set(legal).size === legal.length && provider.replies.every((reply: any) => {
      const exactReply = candidate.replies.find((value: any) => value.uci === reply.uci);
      return exactReply?.fen === reply.fen && new Set(reply.selectedBy).size === reply.selectedBy.length;
    }), `Provider reply is not an exact legal path ${id}`);
    const cache = new Map<string, any>();
    const outcome = (arm: string, moves: readonly string[]) => {
      check(new Set(moves).size === moves.length && moves.every((uci) => legal.includes(uci)),
        `Illegal or duplicated selected reply ${id}/${arm}`);
      const selectedUcis = [...moves].sort();
      const selectedKey = JSON.stringify(selectedUcis);
      let result = cache.get(selectedKey);
      if (result === undefined) {
        result = full.immediate === "removed"
          ? evaluateBoundedTarget(root.fen, pair.candidateUci, definition, new Set(selectedUcis))
          : { kind: full.kind, immediate: full.immediate,
            reintroducedWithin3Ply: full.reintroducedWithin3Ply,
            preparationSurvivesEveryDefence: full.preparationSurvivesEveryDefence,
            witness: full.witness, refutation: full.refutation, visited: full.visited };
        cache.set(selectedKey, result);
      }
      check(result.kind === "result" && result.immediate === full.immediate
        && (!result.reintroducedWithin3Ply || full.reintroducedWithin3Ply)
        && (!result.preparationSurvivesEveryDefence || full.preparationSurvivesEveryDefence),
      `Partial frontier exceeded exact target authority ${id}/${arm}`);
      check(selectedUcis.length !== legal.length
        || result.reintroducedWithin3Ply === full.reintroducedWithin3Ply
          && result.preparationSurvivesEveryDefence === full.preparationSurvivesEveryDefence,
      `Complete selected reply set disagrees with exact target ${id}/${arm}`);
      return { arm, selectedUcis, selectedCount: selectedUcis.length,
        unvisitedLegal: legal.length - selectedUcis.length,
        result: { immediate: result.immediate,
          reintroducedWithin3Ply: result.reintroducedWithin3Ply,
          preparationSurvivesEveryDefence: result.preparationSurvivesEveryDefence,
          witness: result.witness, refutation: result.refutation, visited: result.visited },
        missedExactWitness: full.reintroducedWithin3Ply && !result.reintroducedWithin3Ply,
        missedExactSurvival: full.preparationSurvivesEveryDefence && !result.preparationSurvivesEveryDefence,
        proofCeiling: selectedUcis.length === legal.length ? "complete_exact_reply_set" : "partial_frontier" };
    };
    const arms = [];
    for (const budget of budgets) for (const width of widths) {
      const role = `engine:${budget}:top${width}`;
      const engineMoves = provider.replies.filter((reply: any) => reply.selectedBy.includes(role)).map((reply: any) => reply.uci);
      check(engineMoves.length === Math.min(width, legal.length), `Incomplete coherent engine beam ${id}/${role}`);
      arms.push(outcome(role, engineMoves));
      for (const eventSourceWidth of eventWidths) {
        const semantic = reserveMap.get(JSON.stringify([id, budget, width, eventSourceWidth]));
        check(semantic !== undefined && semantic.family === definition.family
          && semantic.selected.length === Math.min(width, legal.length),
        `Missing semantic reserve branch ${id}/${budget}/${width}/${eventSourceWidth}`);
        check(setEquals(semantic.baseline, engineMoves), `Semantic arm changed the engine baseline ${id}/${role}`);
        arms.push(outcome(`semantic:${budget}:top${width}:${eventSourceWidth}`, semantic.selected));
      }
    }
    for (const threshold of thresholds) {
      const role = `maia:prefix${threshold}`;
      arms.push(outcome(role, provider.replies.filter((reply: any) => reply.selectedBy.includes(role))
        .map((reply: any) => reply.uci)));
    }
    check(arms.length === 29, `Common frontier row lost an arm ${id}`);
    return { rootId: pair.rootId, targetId: pair.targetId, candidateUci: pair.candidateUci,
      family: definition.family, sourceObserved: pair.sourceObserved, legalReplyCount: legal.length,
      exact: { immediate: full.immediate, reintroducedWithin3Ply: full.reintroducedWithin3Ply,
        preparationSurvivesEveryDefence: full.preparationSurvivesEveryDefence }, arms };
  });
  check(rows.length === 182 && new Set(rows.map(key)).size === 182, "Common frontier lost a named cell");
  return { version: 1, profile: "d3262-coherent-frontier-target-outcome-v1",
    manifest: comparisons.manifest,
    authority: "first_reply_selection_vs_exact_bounded_target_not_partial_negative_or_engine_cause",
    budgets, widths, thresholds, eventWidths, controls: comparisons.controls,
    rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentFrontierTargetOutcome(...inputs.map((value) => JSON.parse(value.toString())) as [any, any, any, any, any, any]),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-frontier-target-outcome.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Common frontier target outcome differs from sealed inputs");
  const allArms = artifact.rows.flatMap((row: any) => row.arms);
  const armNames = [...new Set(allArms.map((arm: any) => arm.arm))];
  const summary = Object.fromEntries(armNames.map((name: string) => {
    const armRows = allArms.filter((arm: any) => arm.arm === name);
    return [name, { cells: armRows.length,
      selectedReplies: armRows.reduce((sum: number, arm: any) => sum + arm.selectedCount, 0),
      unvisitedLegal: armRows.reduce((sum: number, arm: any) => sum + arm.unvisitedLegal, 0),
      retainedWitnesses: armRows.filter((arm: any) => arm.result.reintroducedWithin3Ply).length,
      retainedSurvival: armRows.filter((arm: any) => arm.result.preparationSurvivesEveryDefence).length,
      missedExactWitnesses: armRows.filter((arm: any) => arm.missedExactWitness).length,
      missedExactSurvival: armRows.filter((arm: any) => arm.missedExactSurvival).length,
      complete: armRows.filter((arm: any) => arm.proofCeiling === "complete_exact_reply_set").length }];
  }));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), namedCells: artifact.rows.length,
    controls: artifact.controls.length, arms: summary }, null, 2)}\n`);
}
