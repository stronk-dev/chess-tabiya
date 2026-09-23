// Disposable D3262 exact local contrast. This compares the same declared
// target under a predecessor-observed candidate and a newly selected natural
// alternative. It never ranks either move or infers a whole-game cause.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const path = (name) => `planning/semantic-consequence-search/${name}`;
function check(value, message) { if (!value) throw new Error(message); }
function rowKey(row) { return `${row.rootId}|${row.targetId}|${row.candidateUci}`; }
function groupKey(row) { return `${row.rootId}|${row.targetId}`; }

export function compileLocalRelationContrast(comparisons, material, witness, options = {}) {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong local-contrast comparison authority");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === comparisons.manifest, "Crossed local-contrast material evaluator");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === comparisons.manifest, "Crossed local-contrast destination evaluator");
  const definitions = new Map(comparisons.definitions.map((row) => [row.id, row]));
  const materialRows = new Map(material.rows.map((row) => [rowKey(row), row]));
  const witnessRows = new Map(witness.rows.map((row) => [rowKey(row), row]));
  const groups = new Map();
  for (const row of comparisons.comparisons) groups.set(groupKey(row), [...(groups.get(groupKey(row)) ?? []), row]);
  check(groups.size === (options.targets ?? 64) && materialRows.size === (options.material ?? 98)
    && witnessRows.size === (options.destination ?? 87), "Local-contrast population drift");
  const unpairedTargets = [...groups.values()].filter((group) => !group.some((row) => !row.sourceObserved)).map((group) => ({ rootId: group[0].rootId, targetId: group[0].targetId, sourceCandidateUcis: group.filter((row) => row.sourceObserved).map((row) => row.candidateUci), reason: "no_selected_natural_alternative" }));
  if (options.unpaired !== undefined) check(unpairedTargets.length === options.unpaired, "Local-contrast no-alternative population drift");
  else if (options.targets === undefined) check(unpairedTargets.length === 17, "Local-contrast no-alternative population drift");
  const rows = [...groups.values()].flatMap((group) => {
    const definition = definitions.get(group[0].targetId);
    check(definition !== undefined && group.every((row) => row.rootId === definition.rootId && row.targetId === definition.id), "Crossed local-contrast target group");
    const sources = group.filter((row) => row.sourceObserved);
    const alternatives = group.filter((row) => !row.sourceObserved);
    check(sources.length > 0, `No source candidate for ${definition.id}`);
    return sources.flatMap((source) => alternatives.map((alternative) => {
      const before = definition.family === "material" ? materialRows.get(rowKey(source)) : witnessRows.get(rowKey(source));
      const after = definition.family === "material" ? materialRows.get(rowKey(alternative)) : witnessRows.get(rowKey(alternative));
      check(before !== undefined && after !== undefined, `Missing exact local reading for ${definition.id}`);
      if (definition.family === "material") {
        const sourceValue = before.positiveCaptureUci !== null;
        const alternativeValue = after.positiveCaptureUci !== null;
        check(sourceValue === (before.immediate === "preserved") && alternativeValue === (after.immediate === "preserved"), `Crossed local material status ${definition.id}`);
        return { rootId: definition.rootId, targetId: definition.id, family: "material", sourceCandidateUci: source.candidateUci, alternativeCandidateUci: alternative.candidateUci, source: { status: sourceValue ? "positive_named_capture_available" : "no_positive_named_capture", cause: before.cause, eventUci: before.positiveCaptureUci }, alternative: { status: alternativeValue ? "positive_named_capture_available" : "no_positive_named_capture", cause: after.cause, eventUci: after.positiveCaptureUci }, contrast: sourceValue === alternativeValue ? "same_local_relation" : sourceValue ? "source_only_local_relation" : "alternative_only_local_relation" };
      }
      const allowed = new Set(["named_pawn_punishment_witness", "locally_safe_arrival_witness", "named_minor_absent"]);
      check(allowed.has(before.status) && allowed.has(after.status), `Unknown local destination reading ${definition.id}`);
      const status = before.status === "named_minor_absent" || after.status === "named_minor_absent"
        ? "not_comparable_minor_absent"
        : before.status === after.status ? "same_local_relation"
          : before.status === "named_pawn_punishment_witness" ? "source_only_local_relation" : "alternative_only_local_relation";
      return { rootId: definition.rootId, targetId: definition.id, family: "destination", sourceCandidateUci: source.candidateUci, alternativeCandidateUci: alternative.candidateUci, source: { status: before.status, eventUci: before.arrivalUci, namedPawnCaptureUci: before.namedPawnCaptureUci }, alternative: { status: after.status, eventUci: after.arrivalUci, namedPawnCaptureUci: after.namedPawnCaptureUci }, contrast: status };
    }));
  });
  if (options.pairs !== undefined) check(rows.length === options.pairs, "Local-contrast pair population drift");
  else if (options.targets === undefined) check(rows.length === 123, "Local-contrast pair population drift");
  return { version: 1, manifest: comparisons.manifest, authority: "exact_pairwise_local_target_relation_not_move_grade_or_global_cause", unpairedTargets, rows };
}

if (process.argv[1] && basename(process.argv[1]) === "local-relation-contrast.mjs"
  && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileLocalRelationContrast(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-local-relation-contrast.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 local contrast differs from frozen sources");
  const summary = Object.fromEntries(["material", "destination"].map((family) => [family, Object.fromEntries(["source_only_local_relation", "alternative_only_local_relation", "same_local_relation", "not_comparable_minor_absent"].map((status) => [status, artifact.rows.filter((row) => row.family === family && row.contrast === status).length]))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, pairs: artifact.rows.length, unpairedTargets: artifact.unpairedTargets.length, summary }, null, 2)}\n`);
}
