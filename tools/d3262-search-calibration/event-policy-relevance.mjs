// Disposable D3262 join of typed first-reply events with independent provider
// frontiers. This measures a pinned bot sampler and engine rank, not human
// likelihood, move quality, or a causal explanation.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(row) { return `${row.rootId}|${row.candidateUci}`; }
function targetKey(row) { return `${row.rootId}|${row.targetId}|${row.candidateUci}`; }

export function compileEventPolicyRelevance(events, stockfish, maia, material, witness) {
  check(events.authority === "source_blind_typed_relation_event_scheduling_not_profit_or_proof", "Wrong typed-event source");
  check(stockfish.manifest === events.manifest && stockfish.positions === 196 && stockfish.source.multiPv === "all_legal_moves_at_candidate_child", "Crossed child Stockfish source");
  check(maia.manifest === events.manifest && maia.rows.length === 196 && maia.source.band === 1400 && maia.source.configuredMeaning === "direct_sample_from_logits_support_and_normalized_mass", "Crossed direct Maia policy source");
  check(material.manifest === events.manifest && material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result", "Crossed material evaluation");
  check(witness.manifest === events.manifest && witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade", "Crossed destination evaluation");
  const engineRows = new Map(stockfish.rows.map((row) => [pairKey(row), row]));
  const modelRows = new Map(maia.rows.map((row) => [pairKey(row), row]));
  const materialRows = new Map(material.rows.map((row) => [targetKey(row), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row), row]));
  check(engineRows.size === 196 && modelRows.size === 196 && events.rows.length === 185, "Event policy population drift");
  const rows = events.rows.map((event) => {
    const engine = engineRows.get(pairKey(event)), model = modelRows.get(pairKey(event));
    check(engine !== undefined && model !== undefined && engine.fen === model.fen, `Crossed event child identity ${pairKey(event)}`);
    const reading = event.family === "material" ? materialRows.get(targetKey(event)) : witnessRows.get(targetKey(event));
    check(reading !== undefined, `Missing event evaluation ${targetKey(event)}`);
    check(event.eventReplies.length <= 1, `Multiple typed events need an explicit selection rule ${targetKey(event)}`);
    const typedEvent = event.eventReplies[0];
    if (typedEvent === undefined) return { rootId: event.rootId, targetId: event.targetId, candidateUci: event.candidateUci, sourceObserved: event.sourceObserved, family: event.family, status: event.status, eventUci: null, evaluation: event.family === "material" ? reading.cause : reading.status, rawMaiaMass: null, configuredMaiaMass: null, stockfishRanks: null };
    const raw = model.rawFullLegal.find((entry) => entry.legalUci === typedEvent.uci);
    check(raw !== undefined, `Typed event absent from direct legal Maia source ${targetKey(event)}`);
    const configured = model.configuredSupport.find((entry) => entry.legalUci === typedEvent.uci);
    const ranks = Object.fromEntries(budgets.map((budget, index) => {
      const probe = engine.probes[index];
      check(probe?.budget === budget && probe.missingMoves.length === 0, `Missing event engine budget ${targetKey(event)}/${budget}`);
      const entry = probe.entries.find((value) => value.moveUci === typedEvent.uci);
      check(entry !== undefined, `Typed event absent from child engine source ${targetKey(event)}/${budget}`);
      return [budget, entry.rank];
    }));
    const evaluation = event.family === "material"
      ? reading.positiveCaptureUci === typedEvent.uci ? "positive_named_capture" : reading.positiveCaptureUci === null && reading.cause === "exchange_neutralized" ? "exchange_neutralized_capture" : null
      : reading.arrivalUci === typedEvent.uci ? reading.status : null;
    check(evaluation !== null && evaluation !== "named_minor_absent", `Typed event/evaluator disagreement ${targetKey(event)}`);
    return { rootId: event.rootId, targetId: event.targetId, candidateUci: event.candidateUci, sourceObserved: event.sourceObserved, family: event.family, status: "event_measured", eventUci: typedEvent.uci, evaluation, rawMaiaMass: raw.mass, configuredMaiaMass: configured?.mass ?? 0, stockfishRanks: ranks };
  });
  check(rows.length === 185 && rows.filter((row) => row.status === "event_measured").length === 153, "Event policy lost exact event population");
  return { version: 1, manifest: events.manifest, authority: "typed_event_provider_frontier_not_human_rate_or_causal_explanation", pinnedMaiaBand: 1400, stockfishBudgets: budgets, rows };
}

if (process.argv[1]?.endsWith("event-policy-relevance.mjs")) {
  const names = ["d3262-semantic-relation-event-first-layer.json", "d3262-stockfish-child-capture.json", "d3262-maia-direct-logits.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileEventPolicyRelevance(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-event-policy-relevance.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 event policy relevance differs from frozen sources");
  const summary = Object.fromEntries(["material", "destination"].map((family) => [family, Object.fromEntries([...new Set(artifact.rows.filter((row) => row.family === family && row.status === "event_measured").map((row) => row.evaluation))].sort().map((evaluation) => {
    const group = artifact.rows.filter((row) => row.family === family && row.evaluation === evaluation && row.status === "event_measured");
    return [evaluation, { events: group.length, maiaConfiguredPositive: group.filter((row) => row.configuredMaiaMass > 0).length, stockfishDepth12Top8: group.filter((row) => row.stockfishRanks.depth12 <= 8).length, both: group.filter((row) => row.configuredMaiaMass > 0 && row.stockfishRanks.depth12 <= 8).length }];
  }))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, events: artifact.rows.filter((row) => row.status === "event_measured").length, noEvent: artifact.rows.filter((row) => row.status !== "event_measured").length, summary }, null, 2)}\n`);
}
