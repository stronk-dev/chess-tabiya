// Disposable D3262 horizon-two raw-Maia prefix. The returned model softmax
// is not the configured opponent's temperature/top-p sampling probability.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const thresholds = Object.freeze([0.8, 0.9]);
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function targetKey(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }
function prefix(row, threshold) {
  if (row.status === "source_off") return { status: "source_off", selected: [], coveredRawMass: null, returnedTailMass: null, unreturnedRawMass: null, residualRawMass: null };
  check(row.status === "captured", `Unknown Maia child status ${row.rootId}/${row.candidateUci}`);
  if (row.missingCandidateMasses > 0) return { status: "mass_unreconciled", selected: [], coveredRawMass: null, returnedTailMass: null, unreturnedRawMass: null, residualRawMass: null };
  let coveredRawMass = 0;
  const selected = [];
  for (const candidate of row.candidates.slice(0, 8)) {
    check(candidate.mass !== undefined, `Missing Maia child raw mass ${row.rootId}/${row.candidateUci}`);
    selected.push({ legalUci: candidate.legalUci, rawUci: candidate.moveUci, rank: candidate.rank, rawMass: candidate.mass });
    coveredRawMass += candidate.mass;
    if (coveredRawMass + 0.000_000_001 >= threshold) break;
  }
  const reached = coveredRawMass + 0.000_000_001 >= threshold;
  const status = reached ? "threshold_reached" : row.returnedMass + 0.000_000_001 < threshold ? "returned_window_insufficient" : "cap_exhausted";
  return { status, selected, coveredRawMass, returnedTailMass: Math.max(0, row.returnedMass - coveredRawMass), unreturnedRawMass: row.missingMass, residualRawMass: Math.max(0, 1 - coveredRawMass) };
}

export function compileMaiaChildPrefix(comparisons, material, witness, capture) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison population");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed material named replies");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed destination named replies");
  check(capture.manifest === comparisons.manifest && capture.partial === false && capture.positions === 196 && capture.source.massMeaning === "raw_model_softmax_not_configured_sampling_probability", "Crossed or incomplete Maia child source");
  const childRows = new Map(capture.rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  check(childRows.size === 196, "Duplicate Maia child position");
  const materialRows = new Map(material.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const rows = capture.rows.flatMap((row) => thresholds.map((threshold) => ({ rootId: row.rootId, candidateUci: row.candidateUci, threshold, legalReplyCount: row.legalReplyUcis.length, returnedCount: row.status === "captured" ? row.candidates.length : null, ...prefix(row, threshold) })));
  const byPrefix = new Map(rows.map((row) => [`${pairKey(row.rootId, row.candidateUci)}|${row.threshold}`, row]));
  const named = comparisons.comparisons.flatMap((pair) => thresholds.map((threshold) => {
    const id = targetKey(pair.rootId, pair.targetId, pair.candidateUci);
    const reading = materialRows.get(id) ?? witnessRows.get(id);
    check(reading !== undefined, `Missing named reply reading ${id}`);
    const replyUci = materialRows.has(id) ? reading.positiveCaptureUci : reading.arrivalUci;
    const row = childRows.get(pairKey(pair.rootId, pair.candidateUci));
    const frontier = byPrefix.get(`${pairKey(pair.rootId, pair.candidateUci)}|${threshold}`);
    check(row !== undefined && frontier !== undefined, `Missing Maia frontier ${id}/${threshold}`);
    if (replyUci === null) return { ...pair, threshold, namedReplyUci: null, status: "no_named_reply" };
    check(row.legalReplyUcis.includes(replyUci), `Named reply not legal at Maia child ${id}`);
    if (row.status === "source_off") return { ...pair, threshold, namedReplyUci: replyUci, status: "source_off_unknown" };
    if (frontier.status === "mass_unreconciled") return { ...pair, threshold, namedReplyUci: replyUci, status: "mass_unreconciled" };
    const provider = row.candidates.find((candidate) => candidate.legalUci === replyUci);
    const selected = frontier.selected.find((candidate) => candidate.legalUci === replyUci);
    return { ...pair, threshold, namedReplyUci: replyUci, status: selected !== undefined ? "named_reply_in_prefix" : provider !== undefined ? "named_reply_in_returned_tail" : "named_reply_unreturned_unknown_mass", ...(provider === undefined ? {} : { rawMass: provider.mass, rawRank: provider.rank }) };
  }));
  check(rows.length === 392 && named.length === 370, "Maia horizon-two prefix lost selected positions or comparisons");
  return { version: 1, manifest: comparisons.manifest, authority: "maia_raw_model_horizon_two_prefix_not_sampling_distribution_or_move_grade", thresholds, cap: 8, rows, named };
}

if (process.argv[1]?.endsWith("maia-child-prefix.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-maia-child-capture.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileMaiaChildPrefix(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-maia-child-prefix.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 Maia child prefix differs from frozen source");
  const statusCounts = Object.fromEntries(thresholds.map((threshold) => [threshold, Object.fromEntries([...new Set(artifact.rows.filter((row) => row.threshold === threshold).map((row) => row.status))].sort().map((status) => [status, artifact.rows.filter((row) => row.threshold === threshold && row.status === status).length]))]));
  const namedCounts = Object.fromEntries(thresholds.map((threshold) => [threshold, Object.fromEntries([...new Set(artifact.named.filter((row) => row.threshold === threshold).map((row) => row.status))].sort().map((status) => [status, artifact.named.filter((row) => row.threshold === threshold && row.status === status).length]))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, statusCounts, namedCounts }, null, 2)}\n`);
}
