// Disposable D3262 engine-order horizon-two beam reach. A retained reply is
// an observed provider candidate, not a semantic proof or complete defence.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
const widths = Object.freeze([2, 4, 8]);
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function targetKey(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }

export function compileStockfishChildBeam(comparisons, material, witness, capture) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison population");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed material target reading");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed destination target reading");
  check(capture.manifest === comparisons.manifest && capture.partial === false && capture.positions === 196 && capture.source.multiPv === "all_legal_moves_at_candidate_child" && capture.source.scorePerspective === "raw_uci_uninterpreted", "Crossed or incomplete Stockfish child source");
  check(capture.rows.length === 196 && comparisons.comparisons.length === 185, "Unexpected engine-beam denominator");
  const childRows = new Map(capture.rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  check(childRows.size === 196, "Duplicate Stockfish child position");
  const materialRows = new Map(material.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const rows = capture.rows.flatMap((row) => budgets.flatMap((budget, budgetIndex) => widths.map((width) => {
    const probe = row.probes[budgetIndex];
    check(probe?.budget === budget, `Missing child engine budget ${row.rootId}/${row.candidateUci}/${budget}`);
    const selected = probe.entries.filter((entry) => entry.rank <= width).map((entry) => ({ moveUci: entry.moveUci, rank: entry.rank, reachedDepth: entry.depth, rawScore: entry.score }));
    return { rootId: row.rootId, candidateUci: row.candidateUci, budget, width, legalReplyCount: probe.legal.length, selected, retainedCount: probe.entries.length, missingCount: probe.missingMoves.length, terminal: probe.terminal };
  })));
  const named = comparisons.comparisons.flatMap((pair) => budgets.flatMap((budget, budgetIndex) => widths.map((width) => {
    const id = targetKey(pair.rootId, pair.targetId, pair.candidateUci);
    const reading = materialRows.get(id) ?? witnessRows.get(id);
    check(reading !== undefined, `Missing named engine-beam reading ${id}`);
    const namedReplyUci = materialRows.has(id) ? reading.positiveCaptureUci : reading.arrivalUci;
    const child = childRows.get(pairKey(pair.rootId, pair.candidateUci));
    check(child !== undefined, `Missing Stockfish child at ${id}`);
    const probe = child.probes[budgetIndex];
    check(probe?.budget === budget, `Missing child engine budget ${id}/${budget}`);
    if (namedReplyUci === null) return { ...pair, budget, width, namedReplyUci: null, status: "no_named_reply" };
    check(probe.legal.includes(namedReplyUci), `Named reply not legal at Stockfish child ${id}`);
    const entry = probe.entries.find((value) => value.moveUci === namedReplyUci);
    if (entry === undefined) return { ...pair, budget, width, namedReplyUci, status: "named_reply_unreturned" };
    return { ...pair, budget, width, namedReplyUci, status: entry.rank <= width ? "named_reply_in_beam" : "named_reply_outside_beam", rawRank: entry.rank, reachedDepth: entry.depth, rawScore: entry.score };
  })));
  check(rows.length === 1764 && named.length === 1665, "Engine beam lost child positions or named comparisons");
  return { version: 1, manifest: comparisons.manifest, authority: "stockfish_horizon_two_ranked_reply_beam_not_proof_or_move_grade", budgets, widths, rows, named };
}

if (process.argv[1]?.endsWith("stockfish-child-beam.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-stockfish-child-capture.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileStockfishChildBeam(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-stockfish-child-beam.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 engine child beam differs from frozen source");
  const namedCounts = Object.fromEntries(budgets.map((budget) => [budget, Object.fromEntries(widths.map((width) => {
    const group = artifact.named.filter((row) => row.budget === budget && row.width === width);
    return [width, Object.fromEntries([...new Set(group.map((row) => row.status))].sort().map((status) => [status, group.filter((row) => row.status === status).length]))];
  }))]));
  const sourceControls = new Set(JSON.parse(bytes[2].toString()).rows.filter((row) => row.status === "named_pawn_punishment_witness").map((row) => targetKey(row.rootId, row.targetId, row.candidateUci)));
  const sourceCounts = Object.fromEntries(budgets.map((budget) => [budget, Object.fromEntries(widths.map((width) => {
    const group = artifact.named.filter((row) => row.budget === budget && row.width === width && sourceControls.has(targetKey(row.rootId, row.targetId, row.candidateUci)));
    return [width, Object.fromEntries([...new Set(group.map((row) => row.status))].sort().map((status) => [status, group.filter((row) => row.status === status).length]))];
  }))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, namedCounts, sourceCounts }, null, 2)}\n`);
}
