// Disposable D3262 same-target contrast after exact bounded continuation.
// It compares relations and root-provider rank without attributing causality.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = [
  "d3262-coherent-root-frame.json",
  "d3262-coherent-target-comparison-frame.json",
  "d3262-coherent-local-relation-contrast.json",
  "d3262-coherent-bounded-targets.json",
];
const budgets = ["depth8", "depth12", "movetime100"];
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function key(rootId, targetId, uci) { return `${rootId}|${targetId}|${uci}`; }
function axis(source, alternative) {
  return source === alternative ? "same" : source ? "source_only_opponent_option" : "alternative_only_opponent_option";
}
function order(sourceRank, alternativeRank) {
  check(Number.isInteger(sourceRank) && Number.isInteger(alternativeRank)
    && sourceRank !== alternativeRank, "Missing or tied coherent root ranks");
  return sourceRank < alternativeRank ? "source" : "alternative";
}
function concordance(relation, rootOrder) {
  if (relation === "same") return "no_relation_contrast";
  const relationFavors = relation === "source_only_opponent_option" ? "alternative" : "source";
  return relationFavors === rootOrder ? "concordant" : "discordant";
}

export function compileCoherentBoundedContrast(roots, comparisons, local, bounded) {
  check(roots.profile === "d3262-coherent-root-v1"
    && comparisons.profile === "d3262-coherent-target-comparison-v1"
    && local.profile === "d3262-coherent-local-relation-contrast-v1"
    && bounded.profile === "d3262-coherent-bounded-targets-v1"
    && roots.manifest === comparisons.manifest && comparisons.manifest === local.manifest
    && local.manifest === bounded.manifest, "Crossed coherent bounded contrast authority");
  check(roots.roots.length === 66 && comparisons.comparisons.length === 182
    && bounded.rows.length === 182 && local.rows.length === 116
    && local.unpairedTargets.length === 17, "Bounded contrast population drift");
  const rootById = new Map(roots.roots.map((root) => [root.rootId, root]));
  const definitionById = new Map(comparisons.definitions.map((definition) => [definition.id, definition]));
  const registered = new Map(comparisons.comparisons.map((row) => [key(row.rootId, row.targetId, row.candidateUci), row]));
  const boundedByKey = new Map(bounded.rows.map((row) => [key(row.rootId, row.targetId, row.candidateUci), row]));
  check(registered.size === 182 && boundedByKey.size === 182, "Duplicated comparison identity");
  check([...registered.keys()].every((rowKey) => boundedByKey.has(rowKey)), "Missing bounded target result");
  for (const row of bounded.rows) {
    const registeredRow = registered.get(key(row.rootId, row.targetId, row.candidateUci));
    check(registeredRow?.sourceObserved === row.sourceObserved && row.kind === "result",
    `Unusable bounded result ${row.rootId}/${row.candidateUci}`);
    check(!row.preparationSurvivesEveryDefence || row.witness?.length === 4,
    `All-defence result lacks a bounded witness ${row.rootId}/${row.candidateUci}`);
  }
  const rows = local.rows.map((pair) => {
    const root = rootById.get(pair.rootId);
    const definition = definitionById.get(pair.targetId);
    const sourceKey = key(pair.rootId, pair.targetId, pair.sourceCandidateUci);
    const alternativeKey = key(pair.rootId, pair.targetId, pair.alternativeCandidateUci);
    const source = boundedByKey.get(sourceKey);
    const alternative = boundedByKey.get(alternativeKey);
    check(root && definition?.rootId === pair.rootId && definition.family === pair.family
      && source?.family === pair.family && alternative?.family === pair.family
      && registered.get(sourceKey)?.sourceObserved === true
      && registered.get(alternativeKey)?.sourceObserved === false,
    `Crossed bounded pair ${pair.rootId}/${pair.targetId}`);
    const rootTurn = root.fen.split(" ")[1];
    check(rootTurn === "w" || rootTurn === "b", `Invalid root perspective ${pair.rootId}`);
    const opponent = rootTurn === "w" ? "black" : "white";
    check((pair.family === "material" ? definition.target.attacker.color : definition.target.minor.color) === opponent,
      `Named target is not an opponent option ${pair.rootId}/${pair.targetId}`);
    const sourceCandidate = root.candidates.find((candidate) => candidate.moveUci === pair.sourceCandidateUci);
    const alternativeCandidate = root.candidates.find((candidate) => candidate.moveUci === pair.alternativeCandidateUci);
    check(sourceCandidate && alternativeCandidate, `Missing root candidates ${pair.rootId}/${pair.targetId}`);
    const rootRanks = budgets.map((budget) => {
      const sourceRecord = sourceCandidate.stockfish.find((item) => item.budget === budget);
      const alternativeRecord = alternativeCandidate.stockfish.find((item) => item.budget === budget);
      check(sourceRecord?.status === "retained" && alternativeRecord?.status === "retained",
        `Missing coherent root rank ${pair.rootId}/${budget}`);
      return { budget, sourceRank: sourceRecord.rank, alternativeRank: alternativeRecord.rank,
        order: order(sourceRecord.rank, alternativeRecord.rank) };
    });
    const immediate = axis(source.immediate === "preserved", alternative.immediate === "preserved");
    const boundedScope = source.immediate === "removed" && alternative.immediate === "removed" ? "both_removed"
      : source.immediate === "preserved" && alternative.immediate === "preserved" ? "both_preserved" : "mixed_immediate";
    const reachWithinBound = axis(source.immediate === "preserved" || source.reintroducedWithin3Ply,
      alternative.immediate === "preserved" || alternative.reintroducedWithin3Ply);
    const reintroduction = boundedScope === "both_removed"
      ? axis(source.reintroducedWithin3Ply, alternative.reintroducedWithin3Ply) : null;
    const allDefences = boundedScope === "both_removed"
      ? axis(source.preparationSurvivesEveryDefence, alternative.preparationSurvivesEveryDefence) : null;
    return {
      rootId: pair.rootId, targetId: pair.targetId, family: pair.family,
      sourceCandidateUci: pair.sourceCandidateUci,
      alternativeCandidateUci: pair.alternativeCandidateUci,
      localContrast: pair.contrast,
      immediate, boundedScope, reachWithinBound, reintroduction, allDefences,
      source: { immediate: source.immediate, reintroducedWithin3Ply: source.reintroducedWithin3Ply,
        preparationSurvivesEveryDefence: source.preparationSurvivesEveryDefence },
      alternative: { immediate: alternative.immediate, reintroducedWithin3Ply: alternative.reintroducedWithin3Ply,
        preparationSurvivesEveryDefence: alternative.preparationSurvivesEveryDefence },
      rootRanks: rootRanks.map((rank) => ({ ...rank,
        reachConcordance: concordance(reachWithinBound, rank.order),
        reintroductionConcordance: reintroduction === null ? "incomparable_scope" : concordance(reintroduction, rank.order),
        allDefencesConcordance: allDefences === null ? "incomparable_scope" : concordance(allDefences, rank.order) })),
    };
  });
  check(new Set(rows.map((row) => `${row.rootId}|${row.targetId}|${row.sourceCandidateUci}|${row.alternativeCandidateUci}`)).size === rows.length,
    "Duplicate bounded pair");
  return { version: 1, profile: "d3262-coherent-bounded-contrast-v1", manifest: roots.manifest,
    authority: "same_target_bounded_relation_and_separate_engine_rank_not_move_reason",
    unpairedTargets: local.unpairedTargets, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentBoundedContrast(...bytes.map((value) => JSON.parse(value.toString()))),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-bounded-contrast.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Bounded contrast differs from sealed inputs");
  const counts = (axisName) => Object.fromEntries(["same", "source_only_opponent_option", "alternative_only_opponent_option"]
    .map((value) => [value, artifact.rows.filter((row) => row[axisName] === value).length]));
  const rankCounts = Object.fromEntries(budgets.map((budget) => [budget,
    Object.fromEntries(["concordant", "discordant", "no_relation_contrast"].map((value) =>
      [value, artifact.rows.filter((row) => row.rootRanks.find((rank) => rank.budget === budget).reachConcordance === value).length]))]));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), pairs: artifact.rows.length,
    unpairedTargets: artifact.unpairedTargets.length, immediate: counts("immediate"),
    boundedScopes: Object.fromEntries(["both_removed", "both_preserved", "mixed_immediate"]
      .map((scope) => [scope, artifact.rows.filter((row) => row.boundedScope === scope).length])),
    reachWithinBound: counts("reachWithinBound"), comparableReintroduction: counts("reintroduction"),
    comparableAllDefences: counts("allDefences"), reachVsRootRank: rankCounts }, null, 2)}\n`);
}
