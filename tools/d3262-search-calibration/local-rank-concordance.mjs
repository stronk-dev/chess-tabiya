// Disposable D3262 sanity check: does the direction of a locally measured
// target relation even agree with Stockfish's root MultiPV order? No cp/mate
// arithmetic, no claim that agreement establishes a causal explanation.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
function check(value, message) { if (!value) throw new Error(message); }

export function compileLocalRankConcordance(local, comparisons, capture) {
  check(local.authority === "exact_pairwise_local_target_relation_not_move_grade_or_global_cause", "Wrong local-contrast source");
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade" && comparisons.manifest === local.manifest, "Crossed local-contrast definitions");
  check(capture.manifest === local.manifest && capture.roots === 66 && capture.source.multiPv === "all_legal_root_moves" && capture.source.scorePerspective === "raw_uci_uninterpreted", "Crossed root Stockfish rank source");
  const definitions = new Map(comparisons.definitions.map((definition) => [definition.id, definition]));
  const roots = new Map(capture.rows.map((row) => [row.rootId, row]));
  check(definitions.size === 64 && roots.size === 66 && local.rows.length === 123 && local.unpairedTargets.length === 17, "Local rank population drift");
  const rows = local.rows.flatMap((pair) => budgets.map((budget, budgetIndex) => {
    const definition = definitions.get(pair.targetId), root = roots.get(pair.rootId);
    check(definition !== undefined && definition.rootId === pair.rootId && definition.family === pair.family && root !== undefined, `Missing local rank target/root ${pair.targetId}`);
    const rootSide = root.fen.split(" ")[1] === "w" ? "white" : root.fen.split(" ")[1] === "b" ? "black" : null;
    check(rootSide !== null, `Invalid root turn ${pair.rootId}`);
    const beneficiary = pair.family === "material" ? definition.target.attacker.color : definition.target.controllingPawn.color;
    check((pair.family === "material" && beneficiary !== rootSide) || (pair.family === "destination" && beneficiary === rootSide), `Crossed local rank relation polarity ${pair.targetId}`);
    const probe = root.probes[budgetIndex];
    check(probe?.budget === budget && probe.missingMoves.length === 0, `Missing local rank budget ${pair.rootId}/${budget}`);
    const source = probe.entries.find((entry) => entry.moveUci === pair.sourceCandidateUci);
    const alternative = probe.entries.find((entry) => entry.moveUci === pair.alternativeCandidateUci);
    check(source !== undefined && alternative !== undefined && source.rank !== alternative.rank, `Missing or tied root MultiPV rank ${pair.rootId}/${budget}`);
    const relationFavorsSource = pair.contrast === "source_only_local_relation"
      ? beneficiary === rootSide
      : pair.contrast === "alternative_only_local_relation" ? beneficiary !== rootSide : null;
    const lowerRankCandidate = source.rank < alternative.rank ? "source" : "alternative";
    const alignment = relationFavorsSource === null ? "no_directional_local_relation" : (lowerRankCandidate === "source") === relationFavorsSource ? "rank_aligned" : "rank_contrary";
    return { rootId: pair.rootId, targetId: pair.targetId, family: pair.family, sourceCandidateUci: pair.sourceCandidateUci, alternativeCandidateUci: pair.alternativeCandidateUci, budget, rootSide, relationBeneficiary: beneficiary, contrast: pair.contrast, sourceRank: source.rank, alternativeRank: alternative.rank, sourceScoreKind: source.score.kind, alternativeScoreKind: alternative.score.kind, boundedPair: source.score.bound || alternative.score.bound, lowerRankCandidate, alignment };
  }));
  check(rows.length === 369, "Local rank pair-budget population drift");
  return { version: 1, manifest: local.manifest, authority: "local_relation_vs_root_multipv_order_not_engine_cause_or_move_grade", budgets, unpairedTargets: local.unpairedTargets, rows };
}

if (process.argv[1]?.endsWith("local-rank-concordance.mjs")) {
  const names = ["d3262-local-relation-contrast.json", "d3262-target-comparison-frame.json", "d3262-stockfish-capture.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileLocalRankConcordance(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-local-rank-concordance.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 local rank concordance differs from frozen sources");
  const summary = Object.fromEntries(budgets.map((budget) => [budget, Object.fromEntries(["material", "destination"].map((family) => {
    const group = artifact.rows.filter((row) => row.budget === budget && row.family === family);
    return [family, { directional: group.filter((row) => row.alignment !== "no_directional_local_relation").length, aligned: group.filter((row) => row.alignment === "rank_aligned").length, contrary: group.filter((row) => row.alignment === "rank_contrary").length, noDirection: group.filter((row) => row.alignment === "no_directional_local_relation").length, boundedDirectional: group.filter((row) => row.boundedPair && row.alignment !== "no_directional_local_relation").length }];
  }))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, pairBudgets: artifact.rows.length, unpairedTargets: artifact.unpairedTargets.length, summary }, null, 2)}\n`);
}
