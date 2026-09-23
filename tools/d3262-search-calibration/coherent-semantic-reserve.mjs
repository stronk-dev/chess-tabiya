// D3262 corrected one-slot relation-event reserve. It never reads a held-out
// positive or a target outcome. Engine rank picks among exact event replies;
// a selected event is not yet an explanation or all-defence proof.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-relation-event-first-layer.json",
  "d3262-stockfish-child-coherent.json", "d3262-stockfish-child-coherent-all.json",
  "d3262-stockfish-new-child-coherent.json", "d3262-stockfish-new-child-coherent-all.json"];
const budgets = ["depth8", "depth12", "movetime100"];
const widths = [2, 4, 8];
const eventSourceWidths = ["top8", "all_legal"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row) { return JSON.stringify([row.rootId, row.candidateUci]); }
function mapRows(source) {
  const map = new Map(source.rows.map((row) => [key(row), row]));
  check(map.size === source.rows.length, "Duplicate coherent child source path");
  return map;
}

export function compileCoherentSemanticReserve(events, oldTop, oldAll, newTop, newAll, inputDigests) {
  check(events.profile === "d3262-coherent-relation-event-v1"
    && events.authority === "source_blind_typed_relation_event_scheduling_not_profit_or_proof"
    && events.rows.length === 182, "Wrong corrected event population");
  check(oldTop.source.multiPv === "top8_legal_moves_at_candidate_child"
    && newTop.source.multiPv === oldTop.source.multiPv
    && oldAll.source.multiPv === "coherent_all_legal_moves_at_candidate_child"
    && newAll.source.multiPv === oldAll.source.multiPv
    && [oldTop, oldAll, newTop, newAll].every((source) => source.manifest === events.manifest)
    && new Set([oldTop, oldAll, newTop, newAll].map((source) => source.source.executableDigest)).size === 1
    && oldTop.rows.length === 196 && oldAll.rows.length === 196
    && newTop.rows.length === 3 && newAll.rows.length === 3,
  "Crossed coherent child ranking sources");
  const maps = [mapRows(oldTop), mapRows(oldAll), mapRows(newTop), mapRows(newAll)];
  const newKeys = new Set(newTop.rows.map(key));
  check(newKeys.size === 3 && newAll.rows.every((row) => newKeys.has(key(row))),
    "New child width sources disagree");
  const rows = events.rows.flatMap((event) => {
    const isNew = newKeys.has(key(event));
    const top = maps[isNew ? 2 : 0].get(key(event));
    const all = maps[isNew ? 3 : 1].get(key(event));
    check(top !== undefined && all !== undefined && top.fen === all.fen,
      `Missing coherent event child ${key(event)}`);
    return budgets.flatMap((budget, budgetIndex) => {
      const topProbe = top.probes[budgetIndex], allProbe = all.probes[budgetIndex];
      check(topProbe?.budget === budget && allProbe?.budget === budget
        && JSON.stringify(topProbe.legal) === JSON.stringify(allProbe.legal)
        && topProbe.legal.length === event.legalReplies
        && topProbe.entries.length === Math.min(8, event.legalReplies)
        && allProbe.entries.length === event.legalReplies,
      `Crossed coherent event ranking ${key(event)}/${budget}`);
      const eventUcis = new Set(event.eventReplies.map((row) => row.uci));
      check(eventUcis.size === event.eventReplies.length
        && [...eventUcis].every((uci) => topProbe.legal.includes(uci)),
      `Event absent from exact legal replies ${key(event)}`);
      return widths.flatMap((width) => {
        const baseline = topProbe.entries.filter((entry) => entry.rank <= width).map((entry) => entry.moveUci);
        check(baseline.length === Math.min(width, event.legalReplies),
          `Coherent top-eight baseline incomplete ${key(event)}/${budget}/${width}`);
        return eventSourceWidths.map((eventSourceWidth) => {
          const source = eventSourceWidth === "top8" ? topProbe : allProbe;
          const firstEvent = source.entries.find((entry) => eventUcis.has(entry.moveUci));
          const reservedUci = firstEvent?.moveUci ?? null;
          const selected = reservedUci === null || baseline.includes(reservedUci)
            ? baseline : [...baseline.slice(0, -1), reservedUci];
          const status = event.status === "operand_absent" ? "operand_absent"
            : event.status === "no_legal_event" ? "no_legal_event"
              : reservedUci === null ? "event_outside_source_width"
                : baseline.includes(reservedUci) ? "event_already_in_baseline" : "event_reserved_outside_baseline";
          check(event.status === "event_available" || reservedUci === null,
            `Reserve invented event on absent operand ${key(event)}`);
          check(new Set(selected).size === selected.length && selected.length === baseline.length
            && selected.every((uci) => topProbe.legal.includes(uci)),
          `Semantic reserve changed the width or legality ${key(event)}/${budget}/${width}`);
          return { rootId: event.rootId, targetId: event.targetId, candidateUci: event.candidateUci,
            family: event.family, budget, width, eventSourceWidth, eventCount: event.eventReplies.length,
            baseline, status, reservedUci, reservedRank: firstEvent?.rank ?? null, selected };
        });
      });
    });
  });
  check(rows.length === 182 * budgets.length * widths.length * eventSourceWidths.length,
    "Corrected semantic-reserve denominator changed");
  return { version: 1, profile: "d3262-coherent-semantic-reserve-v1", manifest: events.manifest,
    authority: "source_blind_coherent_relation_event_one_slot_reach_not_proof_or_move_grade",
    budgets, widths, eventSourceWidths, inputDigests, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = compileCoherentSemanticReserve(...inputs.map((bytes) => JSON.parse(bytes)),
    Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])));
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-semantic-reserve.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Corrected semantic reserve differs from checked sources");
  const summary = Object.fromEntries(eventSourceWidths.map((source) => [source,
    Object.fromEntries(widths.map((width) => [width, {
      rows: artifact.rows.filter((row) => row.eventSourceWidth === source && row.width === width).length,
      reservedOutsideBaseline: artifact.rows.filter((row) => row.eventSourceWidth === source
        && row.width === width && row.status === "event_reserved_outside_baseline").length,
      eventOutsideSourceWidth: artifact.rows.filter((row) => row.eventSourceWidth === source
        && row.width === width && row.status === "event_outside_source_width").length,
    }]))]));
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), comparisons: artifact.rows.length / (budgets.length * widths.length * eventSourceWidths.length), summary }, null, 2)}\n`);
}
