// Disposable D3262 exact-arm forcing census over the frozen target frame.
// Every opponent reply is retained. Extra learner plies are measured only for
// the preregistered check/capture/attack triggers, never destination occupancy.
// D3280 retains both square-control and enemy-piece readings of "attack".
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { legalMoves } from "./exact-reply-enumeration.mjs";
import { replayReply } from "./exact-arm-trigger-core.mjs";
export { replayReply } from "./exact-arm-trigger-core.mjs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
function check(value, message) { if (!value) throw new Error(message); }
function key(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }
function indexed(rows) {
  const result = new Map();
  for (const row of rows) {
    const id = key(row.rootId, row.targetId, row.candidateUci);
    check(!result.has(id), `Duplicate exact-arm named comparison ${id}`);
    result.set(id, row);
  }
  return result;
}
export function compileExactArmForcing(comparisons, material, destination, witness, graph, frame) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison authority");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed material reading");
  check(destination.authority === "exact_immediate_minor_destination_availability_not_move_grade" && destination.manifest === comparisons.manifest, "Crossed destination reading");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed destination witness");
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof" && graph.manifest === comparisons.manifest, "Crossed legal reply graph");
  check(frame.authority === "shared_candidate_population_not_move_grade" && frame.manifest === comparisons.manifest, "Crossed selected frame");
  const definitions = new Map(comparisons.definitions.map((definition) => [definition.id, definition]));
  const materialRows = indexed(material.rows), destinationRows = indexed(destination.rows), witnessRows = indexed(witness.rows);
  const graphRoots = new Map(graph.roots.map((root) => [root.rootId, root]));
  const nextLegalByFen = new Map();
  const rows = [];
  for (const pair of comparisons.comparisons) {
    const id = key(pair.rootId, pair.targetId, pair.candidateUci);
    const definition = definitions.get(pair.targetId);
    check(definition?.rootId === pair.rootId, `Missing or crossed registered target ${id}`);
    const candidate = graphRoots.get(pair.rootId)?.candidates.find((value) => value.candidateUci === pair.candidateUci);
    check(candidate !== undefined, `Missing exact candidate ${id}`);
    const immediate = materialRows.get(id) ?? destinationRows.get(id);
    check(immediate?.afterFen === candidate.afterFen, `Crossed immediate candidate FEN ${id}`);
    const namedReplyUci = definition.family === "material" ? materialRows.get(id)?.positiveCaptureUci : witnessRows.get(id)?.arrivalUci;
    check(definition.family === "material" || witnessRows.has(id), `Missing destination witness ${id}`);
    if (namedReplyUci !== null) check(candidate.replies.some((reply) => reply.uci === namedReplyUci), `Named reply omitted from exact population ${id}`);
    let forcingReplyCount = 0, forcingPieceCount = 0, checkTriggers = 0, captureTriggers = 0, attackTriggers = 0, learnerEdges = 0, learnerEdgesPiece = 0, terminalForcingReplies = 0, terminalForcingRepliesPiece = 0;
    let namedReplyTriggered = false, namedReplyTriggeredPiece = false;
    const firstTrigger = { check: null, capture: null, attack: null };
    for (const reply of candidate.replies) {
      const { afterCandidate, newAttack } = replayReply(candidate, reply, definition);
      if (reply.givesCheck) { checkTriggers += 1; firstTrigger.check ??= reply.uci; }
      if (reply.captures) { captureTriggers += 1; firstTrigger.capture ??= reply.uci; }
      if (newAttack) { attackTriggers += 1; firstTrigger.attack ??= reply.uci; }
      const pieceForcing = reply.givesCheck || reply.captures || (definition.family === "material" && newAttack);
      if (pieceForcing) forcingPieceCount += 1;
      if (!reply.givesCheck && !reply.captures && !newAttack) continue;
      forcingReplyCount += 1;
      if (reply.uci === namedReplyUci) namedReplyTriggered = true;
      if (pieceForcing && reply.uci === namedReplyUci) namedReplyTriggeredPiece = true;
      let next = nextLegalByFen.get(reply.fen);
      if (next === undefined) {
        next = legalMoves(afterCandidate).map((item) => item.uci);
        nextLegalByFen.set(reply.fen, next);
      }
      learnerEdges += next.length;
      if (pieceForcing) learnerEdgesPiece += next.length;
      if (next.length === 0) terminalForcingReplies += 1;
      if (pieceForcing && next.length === 0) terminalForcingRepliesPiece += 1;
    }
    rows.push({ ...pair, family: definition.family, exactReplyCount: candidate.replyCount, namedReplyUci: namedReplyUci ?? null, namedReplyFound: namedReplyUci === null ? false : candidate.replies.some((reply) => reply.uci === namedReplyUci), namedReplyTriggered, namedReplyTriggeredPiece, forcingReplyCount, forcingPieceCount, checkTriggers, captureTriggers, attackTriggers, learnerEdges, learnerEdgesPiece, terminalForcingReplies, terminalForcingRepliesPiece, firstTrigger });
  }
  check(rows.length === 185, `Exact-arm census lost named comparisons: ${rows.length}`);
  const allCandidates = frame.roots.flatMap((root) => root.candidates.map((candidate) => `${root.rootId}|${candidate.moveUci}`));
  const graphCandidates = graph.roots.flatMap((root) => root.candidates.map((candidate) => `${root.rootId}|${candidate.candidateUci}`));
  check(allCandidates.length === 196 && JSON.stringify(allCandidates) === JSON.stringify(graphCandidates), "Exact arm omitted selected candidates");
  const exactReplyEdges = graph.roots.reduce((sum, root) => sum + root.candidates.reduce((inner, candidate) => inner + candidate.replyCount, 0), 0);
  check(exactReplyEdges === 6310, `Changed exact reply denominator ${exactReplyEdges}`);
  return { version: 1, manifest: comparisons.manifest, authority: "exact_reply_forcing_sensitivity_not_profile_choice_or_move_grade", roots: 66, selectedCandidates: 196, exactReplyEdges, namedComparisons: rows.length, uniqueExpandedReplyFens: nextLegalByFen.size, rows };
}

if (process.argv[1]?.endsWith("exact-arm-forcing.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-immediate.json", "d3262-destination-reply-witness.json", "d3262-exact-replies.json", "d3262-root-frame.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileExactArmForcing(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-exact-arm-forcing.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 exact-arm forcing census differs from frozen inputs");
  const summary = { digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, namedComparisons: artifact.namedComparisons, exactReplyEdges: artifact.exactReplyEdges, uniqueExpandedReplyFens: artifact.uniqueExpandedReplyFens, squareControl: { forcingComparisonReplies: artifact.rows.reduce((sum, row) => sum + row.forcingReplyCount, 0), learnerEdges: artifact.rows.reduce((sum, row) => sum + row.learnerEdges, 0), namedRepliesTriggered: artifact.rows.filter((row) => row.namedReplyTriggered).length }, enemyPiece: { forcingComparisonReplies: artifact.rows.reduce((sum, row) => sum + row.forcingPieceCount, 0), learnerEdges: artifact.rows.reduce((sum, row) => sum + row.learnerEdgesPiece, 0), namedRepliesTriggered: artifact.rows.filter((row) => row.namedReplyTriggeredPiece).length }, namedReplies: artifact.rows.filter((row) => row.namedReplyFound).length };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
