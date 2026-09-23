// Disposable D3262/D3276 reconstruction of Maia3's configured temperature
// and top-p sampler from a truncated raw-softmax window. Only a cutoff that
// survives explicit rounding and omitted-tail bounds licenses a distribution.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const TEMPERATURE = 0.8, TOP_P = 0.92, ALPHA = 1 / TEMPERATURE;
const RAW_ABSOLUTE_ERROR = 0.000_001;
const MAIA_UCI_SHA256 = "sha256:0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d";
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function targetKey(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }
function powered(value) { return value ** ALPHA; }
function maxTailPower(rawMass, count, cap) {
  if (count === 0 || rawMass === 0) return 0;
  check(cap > 0 && rawMass <= count * cap + 0.000_01, "Truncated Maia tail exceeds its last returned rank");
  const bounded = Math.min(rawMass, count * cap);
  const full = Math.min(count, Math.floor(bounded / cap));
  const remainder = Math.max(0, bounded - full * cap);
  return full * powered(cap) + (full < count ? powered(remainder) : 0);
}
function minTailPower(rawMass, count) {
  return count === 0 || rawMass === 0 ? 0 : count * powered(rawMass / count);
}

export function configuredWindow(row) {
  if (row.status === "source_off") return { status: "source_off", support: null };
  check(row.status === "captured", `Unknown Maia child status ${row.rootId}/${row.candidateUci}`);
  if (row.missingCandidateMasses > 0) return { status: "mass_unreconciled", support: null };
  const values = row.candidates.map((candidate) => candidate.mass);
  check(values.length > 0 && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1), "Invalid raw Maia window");
  check(values.every((value, index) => index === 0 || value <= values[index - 1] + RAW_ABSOLUTE_ERROR), "Maia raw window rank is not monotone");
  check(row.unreturnedLegalCount === row.legalReplyUcis.length - values.length, "Maia child legal window count differs");
  const omitted = row.unreturnedLegalCount;
  const lower = values.map((value) => Math.max(0, value - RAW_ABSOLUTE_ERROR));
  const upper = values.map((value) => Math.min(1, value + RAW_ABSOLUTE_ERROR));
  const rawOmittedLower = omitted === 0 ? 0 : Math.max(0, 1 - upper.reduce((sum, value) => sum + value, 0));
  const rawOmittedUpper = omitted === 0 ? 0 : Math.max(0, 1 - lower.reduce((sum, value) => sum + value, 0));
  const tailWeightLower = minTailPower(rawOmittedLower, omitted);
  const tailWeightUpper = maxTailPower(rawOmittedUpper, omitted, upper.at(-1));
  const knownWeightLower = lower.map(powered), knownWeightUpper = upper.map(powered);
  const totalWeightLower = knownWeightLower.reduce((sum, value) => sum + value, 0) + tailWeightLower;
  const totalWeightUpper = knownWeightUpper.reduce((sum, value) => sum + value, 0) + tailWeightUpper;
  check(totalWeightLower > 0 && totalWeightUpper >= totalWeightLower, "Invalid Maia transformed weight bounds");
  let cumulativeLower = 0, cumulativeUpper = 0, guaranteedKept = 0, possiblyKept = 0;
  for (let index = 0; index < values.length; index += 1) {
    cumulativeLower += knownWeightLower[index];
    cumulativeUpper += knownWeightUpper[index];
    const definitelyKept = index === 0 || cumulativeUpper / totalWeightLower <= TOP_P;
    const definitelyDropped = index > 0 && cumulativeLower / totalWeightUpper > TOP_P;
    if (definitelyKept) guaranteedKept = index + 1;
    if (!definitelyDropped) possiblyKept = index + 1;
  }
  const cutoffKnown = guaranteedKept === possiblyKept && (possiblyKept < values.length || omitted === 0);
  const boundaryDistinct = possiblyKept >= values.length || lower[possiblyKept - 1] > upper[possiblyKept];
  const source = { guaranteedKept, possiblyKept, returnedCount: values.length, omittedLegalCount: omitted, rawOmittedMassInterval: [rawOmittedLower, rawOmittedUpper], transformedTailWeightInterval: [tailWeightLower, tailWeightUpper] };
  if (!cutoffKnown || !boundaryDistinct) return { status: possiblyKept === values.length && omitted > 0 ? "unresolved_unreturned_tail" : "unresolved_cutoff", support: null, ...source };
  const weights = values.slice(0, guaranteedKept).map(powered);
  const sum = weights.reduce((value, weight) => value + weight, 0);
  const support = row.candidates.slice(0, guaranteedKept).map((candidate, index) => {
    const otherUpper = knownWeightUpper.slice(0, guaranteedKept).reduce((value, weight) => value + weight, 0) - knownWeightUpper[index];
    const otherLower = knownWeightLower.slice(0, guaranteedKept).reduce((value, weight) => value + weight, 0) - knownWeightLower[index];
    return { legalUci: candidate.legalUci, rawUci: candidate.moveUci, rank: candidate.rank, configuredMassInterval: [knownWeightLower[index] / (knownWeightLower[index] + otherUpper), knownWeightUpper[index] / (knownWeightUpper[index] + otherLower)], nominalConfiguredMass: weights[index] / sum };
  });
  return { status: "certified_returned_support", support, ...source };
}

export function compileMaiaConfiguredWindow(comparisons, material, witness, capture) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong comparison population");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed material named replies");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed destination named replies");
  check(capture.manifest === comparisons.manifest && capture.partial === false && capture.positions === 196 && capture.source.massMeaning === "raw_model_softmax_not_configured_sampling_probability" && capture.source.temperature === TEMPERATURE && capture.source.topP === TOP_P, "Crossed or incomplete Maia child source");
  const childRows = new Map(capture.rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  check(childRows.size === 196, "Duplicate Maia child position");
  const rows = capture.rows.map((row) => ({ rootId: row.rootId, candidateUci: row.candidateUci, ...configuredWindow(row) }));
  const byRow = new Map(rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  const materialRows = new Map(material.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const named = comparisons.comparisons.map((pair) => {
    const id = targetKey(pair.rootId, pair.targetId, pair.candidateUci);
    const reading = materialRows.get(id) ?? witnessRows.get(id);
    check(reading !== undefined, `Missing named configured-Maia reading ${id}`);
    const namedReplyUci = materialRows.has(id) ? reading.positiveCaptureUci : reading.arrivalUci;
    if (namedReplyUci === null) return { ...pair, namedReplyUci: null, status: "no_named_reply" };
    const child = childRows.get(pairKey(pair.rootId, pair.candidateUci));
    const window = byRow.get(pairKey(pair.rootId, pair.candidateUci));
    check(child !== undefined && window !== undefined && child.legalReplyUcis.includes(namedReplyUci), `Named reply not legal at Maia child ${id}`);
    if (window.status !== "certified_returned_support") return { ...pair, namedReplyUci, status: "configured_unknown_cutoff" };
    const supported = window.support.find((value) => value.legalUci === namedReplyUci);
    return { ...pair, namedReplyUci, status: supported === undefined ? "configured_zero_after_certified_cutoff" : "configured_positive", ...(supported === undefined ? {} : { configuredMassInterval: supported.configuredMassInterval, nominalConfiguredMass: supported.nominalConfiguredMass }) };
  });
  check(rows.length === 196 && named.length === 185, "Configured Maia window lost selected positions or comparisons");
  return { version: 1, manifest: comparisons.manifest, authority: "bounded_configured_maia_sampler_window_not_move_grade", sourceUciSha256: MAIA_UCI_SHA256, temperature: TEMPERATURE, topP: TOP_P, rawAbsoluteErrorBound: RAW_ABSOLUTE_ERROR, rows, named };
}

if (process.argv[1]?.endsWith("maia-configured-window.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-maia-child-capture.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileMaiaConfiguredWindow(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-maia-configured-window.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 configured Maia window differs from frozen source");
  const statuses = Object.fromEntries([...new Set(artifact.rows.map((row) => row.status))].sort().map((status) => [status, artifact.rows.filter((row) => row.status === status).length]));
  const namedStatuses = Object.fromEntries([...new Set(artifact.named.map((row) => row.status))].sort().map((status) => [status, artifact.named.filter((row) => row.status === status).length]));
  const sourceControls = new Set(JSON.parse(bytes[2].toString()).rows.filter((row) => row.status === "named_pawn_punishment_witness").map((row) => targetKey(row.rootId, row.targetId, row.candidateUci)));
  const sourceNamed = artifact.named.filter((row) => sourceControls.has(targetKey(row.rootId, row.targetId, row.candidateUci)));
  const sourceStatuses = Object.fromEntries([...new Set(sourceNamed.map((row) => row.status))].sort().map((status) => [status, sourceNamed.filter((row) => row.status === status).length]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, statuses, namedStatuses, sourceStatuses }, null, 2)}\n`);
}
