// Disposable D3262 exact relation-event reservation at the first opponent reply.
// Selection reads registered event geometry plus provider ranks. Held-out named
// positives enter only in the final evaluation join.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { selectOperandReserve } from "./semantic-reserve-first-layer.mjs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
const widths = Object.freeze([2, 4, 8]);
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function targetKey(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }

export function compileRelationEventReserve(events, capture, material, witness) {
  check(events.authority === "source_blind_typed_relation_event_scheduling_not_profit_or_proof", "Wrong relation-event selector authority");
  check(capture.manifest === events.manifest && capture.positions === 196 && capture.source.multiPv === "all_legal_moves_at_candidate_child", "Crossed relation-event provider source");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === events.manifest, "Crossed relation-event material evaluator");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === events.manifest, "Crossed relation-event destination evaluator");
  const children = new Map(capture.rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  const materialRows = new Map(material.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  check(children.size === 196 && events.rows.length === 185, "Relation-event reserve lost candidate or comparison frame");
  const rows = events.rows.flatMap((event) => budgets.flatMap((budget, budgetIndex) => widths.map((width) => {
    const id = targetKey(event.rootId, event.targetId, event.candidateUci);
    const child = children.get(pairKey(event.rootId, event.candidateUci));
    check(child !== undefined && child.probes[budgetIndex]?.budget === budget, `Missing relation-event child/budget ${id}/${budget}`);
    const selected = selectOperandReserve({ status: event.status === "operand_absent" ? "operand_absent" : "measured", touchReplies: event.eventReplies }, child.probes[budgetIndex], width);
    const reading = materialRows.get(id) ?? witnessRows.get(id);
    check(reading !== undefined, `Missing held-out relation evaluator ${id}`);
    const namedReplyUci = materialRows.has(id) ? reading.positiveCaptureUci : reading.arrivalUci;
    if (namedReplyUci !== null) check(child.probes[budgetIndex].legal.includes(namedReplyUci), `Held-out relation reply not legal ${id}`);
    return { rootId: event.rootId, targetId: event.targetId, candidateUci: event.candidateUci, family: event.family, budget, width, eventCount: event.eventReplies.length, status: selected.status === "touch_reserved" ? "event_reserved" : selected.status === "no_touch" ? "no_legal_event" : selected.status, reservedUci: selected.reservedUci, reservedRank: selected.reservedRank, baseline: selected.baseline, selected: selected.selected, namedReplyUci, namedInBaseline: namedReplyUci === null ? null : selected.baseline.includes(namedReplyUci), namedInSelected: namedReplyUci === null ? null : selected.selected.includes(namedReplyUci) };
  })));
  check(rows.length === 1665, "Relation-event reserve lost budget/width comparisons");
  return { version: 1, manifest: events.manifest, authority: "source_blind_relation_event_engine_rank_frontier_not_profit_or_proof", budgets, widths, rows };
}

if (process.argv[1]?.endsWith("semantic-relation-event-reserve.mjs")) {
  const names = ["d3262-semantic-relation-event-first-layer.json", "d3262-stockfish-child-capture.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileRelationEventReserve(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-semantic-relation-event-reserve.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 relation-event reserve differs from frozen sources");
  const summary = Object.fromEntries(budgets.map((budget) => [budget, Object.fromEntries(widths.map((width) => {
    const group = artifact.rows.filter((row) => row.budget === budget && row.width === width);
    return [width, { namedEligible: group.filter((row) => row.namedReplyUci !== null).length, baselineReach: group.filter((row) => row.namedInBaseline).length, eventReach: group.filter((row) => row.namedInSelected).length, gained: group.filter((row) => row.namedInSelected && !row.namedInBaseline).length, lost: group.filter((row) => row.namedInBaseline && !row.namedInSelected).length, reservedOutsideBaseline: group.filter((row) => row.reservedRank !== null && row.reservedRank > width).length }];
  }))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, summary }, null, 2)}\n`);
}
