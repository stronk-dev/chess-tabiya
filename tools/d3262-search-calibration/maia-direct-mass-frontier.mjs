// Disposable D3262 first-child configured Maia mass frontier. It joins direct
// model output to named legal replies; it does not infer defence quality.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function targetKey(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }

export function compileMaiaDirectMassFrontier(comparisons, material, witness, direct) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong direct-Maia comparison population");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed direct-Maia material reading");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed direct-Maia destination reading");
  check(direct.manifest === comparisons.manifest && direct.positions === 196 && direct.source.configuredMeaning === "direct_sample_from_logits_support_and_normalized_mass", "Crossed direct Maia source");
  const childRows = new Map(direct.rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  check(childRows.size === 196 && comparisons.comparisons.length === 185, "Lost direct-Maia child or named comparison");
  const materialRows = new Map(material.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const rows = direct.rows.map((row) => ({ rootId: row.rootId, candidateUci: row.candidateUci, legalReplyCount: row.rawFullLegal.length, configuredSupportCount: row.configuredSupport.length, configuredSupport: row.configuredSupport }));
  const named = comparisons.comparisons.map((pair) => {
    const id = targetKey(pair.rootId, pair.targetId, pair.candidateUci);
    const reading = materialRows.get(id) ?? witnessRows.get(id);
    check(reading !== undefined, `Missing named direct-Maia reading ${id}`);
    const namedReplyUci = materialRows.has(id) ? reading.positiveCaptureUci : reading.arrivalUci;
    if (namedReplyUci === null) return { ...pair, namedReplyUci: null, status: "no_named_reply" };
    const child = childRows.get(pairKey(pair.rootId, pair.candidateUci));
    check(child !== undefined, `Missing direct Maia child ${id}`);
    const raw = child.rawFullLegal.find((item) => item.legalUci === namedReplyUci);
    check(raw !== undefined, `Named reply not legal at direct Maia child ${id}`);
    const sampled = child.configuredSupport.find((item) => item.legalUci === namedReplyUci);
    return { ...pair, namedReplyUci, rawModelMass: raw.mass, configuredSamplingMass: sampled?.mass ?? 0, status: sampled === undefined ? "configured_zero_after_top_p" : "configured_positive" };
  });
  check(rows.length === 196 && named.length === 185, "Direct Maia mass frontier lost its denominator");
  return { version: 1, manifest: comparisons.manifest, authority: "direct_configured_maia_horizon_two_mass_not_defence_quality_or_move_grade", rows, named };
}

if (process.argv[1]?.endsWith("maia-direct-mass-frontier.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-maia-direct-logits.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileMaiaDirectMassFrontier(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-maia-direct-mass-frontier.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 direct Maia frontier differs from frozen source");
  const counts = Object.fromEntries([...new Set(artifact.named.map((row) => row.status))].sort().map((status) => [status, artifact.named.filter((row) => row.status === status).length]));
  const witness = JSON.parse(bytes[2].toString());
  const source = new Set(witness.rows.filter((row) => row.status === "named_pawn_punishment_witness").map((row) => targetKey(row.rootId, row.targetId, row.candidateUci)));
  const sourceCounts = Object.fromEntries([...new Set(artifact.named.filter((row) => source.has(targetKey(row.rootId, row.targetId, row.candidateUci))).map((row) => row.status))].sort().map((status) => [status, artifact.named.filter((row) => source.has(targetKey(row.rootId, row.targetId, row.candidateUci)) && row.status === status).length]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, counts, sourceCounts }, null, 2)}\n`);
}
