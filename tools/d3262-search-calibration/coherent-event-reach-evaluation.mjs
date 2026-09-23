// D3262 held-out reach join. The source-blind reserve is already sealed;
// named positive witnesses enter only here. Reach is not consequence proof.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-semantic-reserve.json", "d3262-coherent-relation-event-first-layer.json",
  "d3262-coherent-immediate-and-witness.json"];
const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function key(row) { return JSON.stringify([row.rootId, row.targetId, row.candidateUci]); }
function uniqueMap(rows, label) {
  const map = new Map(rows.map((row) => [key(row), row]));
  check(map.size === rows.length, `Duplicate ${label} identity`);
  return map;
}

export function compileCoherentEventReach(reserve, events, immediate) {
  check(reserve.profile === "d3262-coherent-semantic-reserve-v1"
    && reserve.authority === "source_blind_coherent_relation_event_one_slot_reach_not_proof_or_move_grade"
    && events.profile === "d3262-coherent-relation-event-v1"
    && events.authority === "source_blind_typed_relation_event_scheduling_not_profit_or_proof"
    && immediate.profile === "d3262-coherent-immediate-and-witness-v1"
    && reserve.manifest === events.manifest && events.manifest === immediate.manifest,
  "Crossed held-out reach authorities");
  check(reserve.rows.length === 3276 && events.rows.length === 182
    && immediate.material.rows.length === 94 && immediate.destinationWitness.rows.length === 88,
  "Held-out reach denominator changed");
  const eventByKey = uniqueMap(events.rows, "event");
  const materialByKey = uniqueMap(immediate.material.rows, "material");
  const destinationByKey = uniqueMap(immediate.destinationWitness.rows, "destination");
  const distinct = new Set(reserve.rows.map(key));
  check(distinct.size === 182 && [...distinct].every((id) => eventByKey.has(id)), "Reserve/event comparison population differs");
  const branchIds = new Set(reserve.rows.map((row) => JSON.stringify([key(row), row.budget, row.width, row.eventSourceWidth])));
  check(branchIds.size === reserve.rows.length && reserve.budgets.length === 3 && reserve.widths.length === 3
    && reserve.eventSourceWidths.length === 2
    && reserve.rows.every((row) => reserve.budgets.includes(row.budget)
      && reserve.widths.includes(row.width) && reserve.eventSourceWidths.includes(row.eventSourceWidth)),
  "Duplicate or undeclared reserve branch");
  const rows = reserve.rows.map((branch) => {
    const id = key(branch), event = eventByKey.get(id);
    check(event !== undefined && event.family === branch.family && event.eventReplies.length === branch.eventCount,
      `Crossed event/reserve target ${id}`);
    const reading = branch.family === "material" ? materialByKey.get(id) : destinationByKey.get(id);
    check(reading !== undefined && reading.sourceObserved === event.sourceObserved, `Missing held-out reading ${id}`);
    const eventUcis = new Set(event.eventReplies.map((row) => row.uci));
    check(eventUcis.size === branch.eventCount
      && (branch.reservedUci === null || eventUcis.has(branch.reservedUci)),
    `Reserved move is not a declared event ${id}`);
    let witnessClass, positiveUci = null;
    if (branch.family === "material") {
      check(reading.immediate === "preserved" || reading.positiveCaptureUci === null,
        `Removed material relation retained a positive capture ${id}`);
      positiveUci = reading.positiveCaptureUci;
      witnessClass = positiveUci === null ? "no_positive_named_capture" : "positive_named_capture";
    } else {
      check(["named_pawn_punishment_witness", "locally_safe_arrival_witness", "named_minor_absent"].includes(reading.status),
        `Unknown destination witness ${id}`);
      positiveUci = reading.status === "named_pawn_punishment_witness" ? reading.arrivalUci : null;
      witnessClass = reading.status;
    }
    check(positiveUci === null || eventUcis.has(positiveUci), `Positive witness is not a declared event ${id}`);
    check(branch.baseline.length === branch.selected.length && new Set(branch.selected).size === branch.selected.length,
      `Reserve changed selected width ${id}`);
    const baselineReach = positiveUci === null ? null : branch.baseline.includes(positiveUci);
    const selectedReach = positiveUci === null ? null : branch.selected.includes(positiveUci);
    return {
      rootId: branch.rootId, targetId: branch.targetId, candidateUci: branch.candidateUci,
      family: branch.family, sourceObserved: reading.sourceObserved, budget: branch.budget,
      width: branch.width, eventSourceWidth: branch.eventSourceWidth, status: branch.status,
      witnessClass, positiveUci, baselineReach, selectedReach,
      reservedPositive: branch.reservedUci === null ? null : branch.reservedUci === positiveUci,
      reservedEventWithoutPositiveWitness: branch.reservedUci !== null && branch.reservedUci !== positiveUci,
    };
  });
  return {
    version: 1, profile: "d3262-coherent-event-reach-evaluation-v1", manifest: reserve.manifest,
    authority: "held_out_named_witness_reach_not_target_persistence_proof_or_engine_cause",
    budgets: reserve.budgets, widths: reserve.widths, eventSourceWidths: reserve.eventSourceWidths,
    rows,
  };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileCoherentEventReach(...bytes.map((value) => JSON.parse(value.toString()))),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-event-reach-evaluation.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Held-out event reach differs from sealed sources");
  const summary = Object.fromEntries(artifact.budgets.map((budget) => [budget,
    Object.fromEntries(artifact.eventSourceWidths.map((source) => [source,
      Object.fromEntries(artifact.widths.map((width) => {
        const group = artifact.rows.filter((row) => row.budget === budget && row.eventSourceWidth === source && row.width === width);
        return [width, {
          rows: group.length,
          positiveEligible: group.filter((row) => row.positiveUci !== null).length,
          baselineReach: group.filter((row) => row.baselineReach).length,
          selectedReach: group.filter((row) => row.selectedReach).length,
          gained: group.filter((row) => row.selectedReach && !row.baselineReach).length,
          lost: group.filter((row) => row.baselineReach && !row.selectedReach).length,
          eventWithoutPositiveWitness: group.filter((row) => row.reservedEventWithoutPositiveWitness).length,
        }];
      }))]))]));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), summary }, null, 2)}\n`);
}
