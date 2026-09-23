// Disposable D3262 one-slot semantic operand reservation at the first reply.
// The selector reads source-blind operand touches and Stockfish rank; named
// replies enter only afterward for evaluation, never for selection.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
const widths = Object.freeze([2, 4, 8]);
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function targetKey(rootId, targetId, candidateUci) { return `${rootId}|${targetId}|${candidateUci}`; }

export function selectOperandReserve(touch, probe, width) {
  check([2, 4, 8].includes(width) && Array.isArray(probe.entries), "Invalid semantic reserve width or provider window");
  const ranked = [...probe.entries].sort((left, right) => left.rank - right.rank || left.moveUci.localeCompare(right.moveUci));
  const touched = new Set(touch.touchReplies.map((reply) => reply.uci));
  check(touched.size === touch.touchReplies.length && [...touched].every((uci) => probe.legal.includes(uci)), "Semantic touch crossed the legal reply set");
  check(ranked.length + probe.missingMoves.length === probe.legal.length, "Provider rank window omitted legal replies without a residual");
  const baseline = ranked.slice(0, width).map((entry) => entry.moveUci);
  if (touch.status === "operand_absent") return { status: "operand_absent", reservedUci: null, reservedRank: null, baseline, selected: baseline };
  check(touch.status === "measured", "Unknown semantic-touch status");
  const reserved = ranked.find((entry) => touched.has(entry.moveUci));
  if (reserved === undefined) return { status: touched.size === 0 ? "no_touch" : "touch_unreturned", reservedUci: null, reservedRank: null, baseline, selected: baseline };
  const selected = [reserved, ...ranked.filter((entry) => entry.moveUci !== reserved.moveUci).slice(0, width - 1)]
    .sort((left, right) => left.rank - right.rank || left.moveUci.localeCompare(right.moveUci))
    .map((entry) => entry.moveUci);
  return { status: "touch_reserved", reservedUci: reserved.moveUci, reservedRank: reserved.rank, baseline, selected };
}

export function compileSemanticReserveFirstLayer(touch, capture, material, witness) {
  check(touch.authority === "source_blind_operand_touch_scheduling_not_target_result_or_proof", "Wrong semantic-touch source");
  check(capture.manifest === touch.manifest && capture.positions === 196 && capture.source.multiPv === "all_legal_moves_at_candidate_child", "Crossed Stockfish child rank source");
  check(material.authority === "exact_immediate_material_relation_not_move_grade_or_search_result" && material.manifest === touch.manifest, "Crossed material evaluator");
  check(witness.authority === "named_exact_reply_witness_not_all_defences_or_move_grade" && witness.manifest === touch.manifest, "Crossed destination evaluator");
  const children = new Map(capture.rows.map((row) => [pairKey(row.rootId, row.candidateUci), row]));
  const materialRows = new Map(material.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  const witnessRows = new Map(witness.rows.map((row) => [targetKey(row.rootId, row.targetId, row.candidateUci), row]));
  check(children.size === 196 && touch.rows.length === 185, "Semantic reserve lost candidate or comparison frame");
  const rows = touch.rows.flatMap((operand) => budgets.flatMap((budget, budgetIndex) => widths.map((width) => {
    const id = targetKey(operand.rootId, operand.targetId, operand.candidateUci);
    const child = children.get(pairKey(operand.rootId, operand.candidateUci));
    check(child !== undefined && child.probes[budgetIndex]?.budget === budget, `Missing semantic reserve child/budget ${id}/${budget}`);
    const selected = selectOperandReserve(operand, child.probes[budgetIndex], width);
    const reading = materialRows.get(id) ?? witnessRows.get(id);
    check(reading !== undefined, `Missing named evaluation target ${id}`);
    const namedReplyUci = materialRows.has(id) ? reading.positiveCaptureUci : reading.arrivalUci;
    if (namedReplyUci !== null) check(child.probes[budgetIndex].legal.includes(namedReplyUci), `Named evaluation reply not legal ${id}`);
    return { rootId: operand.rootId, targetId: operand.targetId, candidateUci: operand.candidateUci, family: operand.family, budget, width, touchCount: operand.touchReplies.length, ...selected, namedReplyUci, namedInBaseline: namedReplyUci === null ? null : selected.baseline.includes(namedReplyUci), namedInSelected: namedReplyUci === null ? null : selected.selected.includes(namedReplyUci) };
  })));
  check(rows.length === 1665, "Semantic reserve lost budget/width comparisons");
  return { version: 1, manifest: touch.manifest, authority: "one_slot_operand_touch_engine_rank_frontier_not_proof_or_move_grade", budgets, widths, rows };
}

if (process.argv[1]?.endsWith("semantic-reserve-first-layer.mjs")) {
  const names = ["d3262-semantic-touch-first-layer.json", "d3262-stockfish-child-capture.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileSemanticReserveFirstLayer(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-semantic-reserve-first-layer.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 semantic reserve differs from frozen inputs");
  const summary = Object.fromEntries(budgets.map((budget) => [budget, Object.fromEntries(widths.map((width) => {
    const group = artifact.rows.filter((row) => row.budget === budget && row.width === width);
    return [width, { namedEligible: group.filter((row) => row.namedReplyUci !== null).length, baselineReach: group.filter((row) => row.namedInBaseline).length, reservedReach: group.filter((row) => row.namedInSelected).length, gained: group.filter((row) => row.namedInSelected && !row.namedInBaseline).length, lost: group.filter((row) => row.namedInBaseline && !row.namedInSelected).length, reservedOutsideBaseline: group.filter((row) => row.reservedRank !== null && row.reservedRank > width).length }];
  }))]));
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, summary }, null, 2)}\n`);
}
