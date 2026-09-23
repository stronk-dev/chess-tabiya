// D3262 path-keyed Maia3 relevance of already-declared exact events and
// held-out positive local witnesses. This is configured model support, not
// observed human move frequency or causal engine explanation.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-event-reach-evaluation.json", "d3262-coherent-relation-event-first-layer.json",
  "d3262-coherent-exact-replies.json", "d3262-maia-history-replay.json", "d3262-maia-coherent-new-child.json"];
const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function pathKey(row) { return JSON.stringify([row.rootId, row.candidateUci]); }
function targetKey(row) { return JSON.stringify([row.rootId, row.targetId, row.candidateUci]); }
function sourceMap(source, label) {
  const map = new Map(source.rows.map((row) => [pathKey(row), row]));
  check(map.size === source.rows.length, `Duplicate ${label} Maia path`);
  return map;
}
function massMap(rows, legal, label) {
  const map = new Map(rows.map((row) => [row.legalUci, row.mass]));
  check(map.size === rows.length && [...map].every(([uci, mass]) => legal.has(uci)
    && Number.isFinite(mass) && mass >= 0 && mass <= 1), `Invalid ${label} mass or legal identity`);
  const sum = [...map.values()].reduce((total, mass) => total + mass, 0);
  check(Math.abs(sum - 1) < 0.00001, `Incomplete ${label} model mass`);
  return map;
}

export function compileCoherentEventPolicyRelevance(reach, events, graph, retained, added) {
  check(reach.profile === "d3262-coherent-event-reach-evaluation-v1"
    && reach.authority === "held_out_named_witness_reach_not_target_persistence_proof_or_engine_cause"
    && events.profile === "d3262-coherent-relation-event-v1"
    && graph.profile === "d3262-coherent-root-v1"
    && graph.authority === "coherent_root_complete_legal_reply_edges_not_semantic_proof"
    && retained.authority === "root_replayed_maia_child_distribution_not_human_frequency_or_search_result"
    && added.authority === "coherent_root_new_child_maia_distribution_not_human_frequency_or_proof"
    && added.profile === "d3262-coherent-root-v1"
    && [events, graph, retained, added].every((value) => value.manifest === reach.manifest)
    && JSON.stringify(retained.source) === JSON.stringify(added.source)
    && retained.source.useUciHistory === true && retained.source.preRootHistory === "unavailable_not_inferred",
  "Crossed path-keyed Maia or event authorities");
  const witnessRows = reach.rows.filter((row) => row.budget === "depth8" && row.width === 2 && row.eventSourceWidth === "top8");
  check(reach.rows.length === 3276 && witnessRows.length === 182 && events.rows.length === 182
    && retained.rows.length === 196 && added.rows.length === 3, "Changed event/policy denominator");
  const eventByKey = new Map(events.rows.map((row) => [targetKey(row), row]));
  const witnessByKey = new Map(witnessRows.map((row) => [targetKey(row), row]));
  check(eventByKey.size === 182 && witnessByKey.size === 182, "Duplicate named target");
  const retainedPaths = sourceMap(retained, "retained"), addedPaths = sourceMap(added, "added");
  check([...addedPaths.keys()].every((key) => !retainedPaths.has(key)), "Maia path copied across old/new sources");
  const graphPaths = new Map(graph.roots.flatMap((root) => root.candidates.map((candidate) => [
    pathKey({ rootId: root.rootId, candidateUci: candidate.candidateUci }),
    { rootFen: root.fen, candidate },
  ])));
  check(graphPaths.size === 193, "Corrected legal path denominator changed");
  const rows = events.rows.map((event) => {
    const id = targetKey(event), witness = witnessByKey.get(id);
    const graphPath = graphPaths.get(pathKey(event));
    const policy = retainedPaths.get(pathKey(event)) ?? addedPaths.get(pathKey(event));
    check(witness !== undefined && witness.family === event.family && witness.sourceObserved === event.sourceObserved,
      `Crossed held-out witness ${id}`);
    check(graphPath !== undefined && policy !== undefined && policy.rootFen === graphPath.rootFen
      && policy.fen === graphPath.candidate.afterFen
      && JSON.stringify(policy.historyUci) === JSON.stringify([event.candidateUci]),
    `Crossed Maia history or child FEN ${id}`);
    const legal = new Set(graphPath.candidate.replies.map((reply) => reply.uci));
    check(legal.size === graphPath.candidate.replyCount && policy.rawFullLegal.length === legal.size,
      `Incomplete exact Maia legal denominator ${id}`);
    const raw = massMap(policy.rawFullLegal, legal, `raw ${id}`);
    const configured = massMap(policy.configuredSupport, legal, `configured ${id}`);
    check(raw.size === legal.size, `Raw Maia legal move missing ${id}`);
    const eventUcis = event.eventReplies.map((row) => row.uci);
    check(new Set(eventUcis).size === eventUcis.length && eventUcis.every((uci) => legal.has(uci)),
      `Declared event absent from policy legal frame ${id}`);
    const positiveUci = witness.positiveUci;
    check(positiveUci === null || eventUcis.includes(positiveUci), `Positive witness does not belong to event ${id}`);
    const rawEventMass = eventUcis.reduce((total, uci) => total + raw.get(uci), 0);
    const configuredEventMass = eventUcis.reduce((total, uci) => total + (configured.get(uci) ?? 0), 0);
    const rawPositiveMass = positiveUci === null ? null : raw.get(positiveUci);
    const configuredPositiveMass = positiveUci === null ? null : configured.get(positiveUci) ?? 0;
    return {
      rootId: event.rootId, targetId: event.targetId, candidateUci: event.candidateUci,
      family: event.family, sourceObserved: event.sourceObserved, witnessClass: witness.witnessClass,
      legalReplies: legal.size, configuredSupport: configured.size, eventUcis, positiveUci,
      rawEventMass, configuredEventMass, rawPositiveMass, configuredPositiveMass,
      configuredEventWithoutPositiveMass: configuredEventMass - (configuredPositiveMass ?? 0),
    };
  });
  return { version: 1, profile: "d3262-coherent-event-policy-relevance-v1", manifest: reach.manifest,
    authority: "path_keyed_maia3_configured_event_mass_not_human_frequency_or_engine_cause", source: retained.source, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentEventPolicyRelevance(...bytes.map((value) => JSON.parse(value.toString()))),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-event-policy-relevance.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Corrected path-keyed event relevance differs from sealed sources");
  const positive = artifact.rows.filter((row) => row.positiveUci !== null);
  const unproven = artifact.rows.filter((row) => row.positiveUci === null && row.eventUcis.length > 0);
  process.stdout.write(`${JSON.stringify({ digest: sha(output), comparisons: artifact.rows.length,
    positive: { rows: positive.length, configuredSupported: positive.filter((row) => row.configuredPositiveMass > 0).length },
    eventWithoutPositive: { rows: unproven.length,
      configuredSupported: unproven.filter((row) => row.configuredEventMass > 0).length } }, null, 2)}\n`);
}
