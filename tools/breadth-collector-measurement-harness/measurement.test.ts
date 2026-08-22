// Permanent research/acceptance instrument — breadth-collectors B5/B6/B7.
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { kingZoneEvents } from "../../packages/runtime/src/king-state.js";
import { materialRoleAsymmetryEvent } from "../../packages/runtime/src/material-state.js";
import { pieceDestinationEvents } from "../../packages/runtime/src/mobility.js";
import { harassmentPressureSequence, pawnContactTimingSequence, pawnDynamicsEvents, pawnTransitionEvents, type RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";
import { defenderConsequenceOperands, defenderExposureOperands, openFileOccupancyOperands } from "../../packages/runtime/src/semantic-evidence.js";
import { squareControlEvents } from "../../packages/runtime/src/square-control.js";
import { authoredRows, authoredTriples, importedPopulation, legalOutcomes, pathTriples, type ResearchRow, type ResearchTriple } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;

type Probe = (row: ResearchRow) => boolean | undefined;

const FACT_CACHE = new Map<string, Readonly<Record<string, boolean | undefined>>>();

function facts(row: ResearchRow): Readonly<Record<string, boolean | undefined>> {
  const key = `${row.parentFen}|${row.uci}|${row.fen}`;
  const cached = FACT_CACHE.get(key);
  if (cached !== undefined) return cached;
  const controls = squareControlEvents(row.parentFen, row.uci, row.fen).events;
  const mobility = pieceDestinationEvents(row.parentFen, row.uci, row.fen).events;
  const mover = positionFromFen(row.parentFen).turn;
  const pawn = pawnDynamicsEvents(row.parentFen, row.uci, row.fen);
  const transitions = pawnTransitionEvents(row.parentFen, row.uci, row.fen);
  const exposure = defenderExposureOperands(row.parentFen, row.uci, row.fen);
  const king = kingZoneEvents(row.parentFen, row.uci, row.fen);
  const value = Object.freeze({
    controller_edge_gained: controls.some((event) => event.sign === "gained"),
    controller_edge_lost: controls.some((event) => event.sign === "lost"),
    mobility_safe_lost: mobility.some((event) => event.color !== mover && event.safeAfter.length < event.safeBefore.length),
    mobility_moved_gain: mobility.some((event) => event.color === mover && event.moved && event.safeAfter.length > event.safeBefore.length),
    mobility_zero_safe: mobility.some((event) => event.color !== mover && event.zeroSafe),
    locked_pair_gained: pawn.some((event) => event.kind === "locked_pair_gained"),
    minor_harassed: pawn.some((event) => event.kind === "minor_harassed"),
    protected_passer_gained: pawn.some((event) => event.kind === "protected_passer_gained"),
    connected_passer_pair_gained: pawn.some((event) => event.kind === "connected_passer_pair_gained"),
    candidate_majority_gained: pawn.some((event) => event.kind === "candidate_majority_gained"),
    candidate_majority_advanced: pawn.some((event) => event.kind === "candidate_majority_advanced"),
    contact_executed: transitions.some((event) => event.kind === "contact_executed"),
    moved_pawn_became_passed: transitions.some((event) => event.kind === "moved_pawn_became_passed"),
    capture_created_moved_passer: transitions.some((event) => event.kind === "capture_created_moved_passer"),
    passed_pawn_advanced: transitions.some((event) => event.kind === "passed_pawn_advanced"),
    defender_exposure: exposure.some((event) => event.kind === "unavailable") ? undefined : exposure.length > 0,
    material_asymmetry_increased: materialRoleAsymmetryEvent(row.parentFen, row.uci, row.fen)?.increased ?? false,
    king_attacker_gained: king.some((event) => event.attackers.gained.length > 0),
    king_shelter_lost: king.some((event) => event.shelter.lost.length > 0),
    king_escape_lost: king.some((event) => event.escapes.lost.length > 0),
    open_file_occupancy: openFileOccupancyOperands(row.parentFen, row.uci, row.fen) !== undefined,
  });
  FACT_CACHE.set(key, value);
  return value;
}

const PROBES: Readonly<Record<string, Probe>> = Object.freeze({
  controller_edge_gained: (row) => facts(row).controller_edge_gained,
  controller_edge_lost: (row) => facts(row).controller_edge_lost,
  mobility_safe_lost: (row) => facts(row).mobility_safe_lost,
  mobility_moved_gain: (row) => facts(row).mobility_moved_gain,
  mobility_zero_safe: (row) => facts(row).mobility_zero_safe,
  locked_pair_gained: (row) => facts(row).locked_pair_gained,
  minor_harassed: (row) => facts(row).minor_harassed,
  protected_passer_gained: (row) => facts(row).protected_passer_gained,
  connected_passer_pair_gained: (row) => facts(row).connected_passer_pair_gained,
  candidate_majority_gained: (row) => facts(row).candidate_majority_gained,
  candidate_majority_advanced: (row) => facts(row).candidate_majority_advanced,
  contact_executed: (row) => facts(row).contact_executed,
  moved_pawn_became_passed: (row) => facts(row).moved_pawn_became_passed,
  capture_created_moved_passer: (row) => facts(row).capture_created_moved_passer,
  passed_pawn_advanced: (row) => facts(row).passed_pawn_advanced,
  defender_exposure: (row) => facts(row).defender_exposure,
  material_asymmetry_increased: (row) => facts(row).material_asymmetry_increased,
  king_attacker_gained: (row) => facts(row).king_attacker_gained,
  king_shelter_lost: (row) => facts(row).king_shelter_lost,
  king_escape_lost: (row) => facts(row).king_escape_lost,
  open_file_occupancy: (row) => facts(row).open_file_occupancy,
});

function alternatives(row: ResearchRow): readonly ResearchRow[] {
  return legalOutcomes(row.parentFen).filter((value) => value.uci !== row.uci).map((value) => ({ id: `${row.id}/alt:${value.uci}`, parentFen: row.parentFen, uci: value.uci, fen: value.fen }));
}

function measure(rows: readonly ResearchRow[]) {
  const started = performance.now();
  const values = new Map<string, { played: number; eligible: number; alternatives: number; fires: number }>();
  for (const row of rows) {
    const alts = alternatives(row);
    for (const [name, probe] of Object.entries(PROBES)) {
      const current = values.get(name) ?? { played: 0, eligible: 0, alternatives: 0, fires: 0 };
      const played = probe(row);
      if (played !== undefined) { current.eligible += 1; if (played) current.played += 1; }
      for (const alternative of alts) {
        const fired = probe(alternative);
        if (fired === undefined) continue;
        current.alternatives += 1;
        if (fired) current.fires += 1;
      }
      values.set(name, current);
    }
  }
  return {
    elapsedMs: performance.now() - started,
    values: [...values].sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => {
      const playedRate = value.eligible === 0 ? 0 : value.played / value.eligible;
      const alternativeRate = value.alternatives === 0 ? 0 : value.fires / value.alternatives;
      return { name, ...value, playedRate, alternativeRate, lift: alternativeRate === 0 ? playedRate === 0 ? Number.NaN : Number.POSITIVE_INFINITY : playedRate / alternativeRate };
    }),
  };
}

function pairAnchors(first: ResearchRow, second: ResearchRow): readonly [RecordedMoveAnchor, RecordedMoveAnchor] {
  return [
    { beforeNodeId: `${first.id}:parent`, afterNodeId: first.id, beforeFen: first.parentFen, moveUci: first.uci, afterFen: first.fen },
    { beforeNodeId: first.id, afterNodeId: second.id, beforeFen: second.parentFen, moveUci: second.uci, afterFen: second.fen },
  ];
}

function tripleAnchors([first, second, third]: ResearchTriple): readonly [RecordedMoveAnchor, RecordedMoveAnchor, RecordedMoveAnchor] {
  return [...pairAnchors(first, second), { beforeNodeId: second.id, afterNodeId: third.id, beforeFen: third.parentFen, moveUci: third.uci, afterFen: third.fen }];
}

function pairs(triples: readonly ResearchTriple[]): readonly (readonly [ResearchRow, ResearchRow])[] {
  const unique = new Map<string, readonly [ResearchRow, ResearchRow]>();
  for (const [first, second, third] of triples) {
    unique.set(`${first.id}|${second.id}`, [first, second]);
    unique.set(`${second.id}|${third.id}`, [second, third]);
  }
  return Object.freeze([...unique.values()]);
}

function sequenceCensus(triples: readonly ResearchTriple[]) {
  let contactSurvived = 0, contactExecuted = 0, harassmentPressure = 0, defenderEdgeLost = 0, defenderRelocated = 0;
  for (const [first, second] of pairs(triples)) {
    const payload = pairAnchors(first, second);
    if (harassmentPressureSequence(payload) !== undefined) harassmentPressure += 1;
  }
  for (const triple of triples) {
    const payload = tripleAnchors(triple);
    if (pawnContactTimingSequence(payload.slice(0, 2))?.kind === "created_survived_reply") contactSurvived += 1;
    if (pawnContactTimingSequence(payload)?.kind === "created_executed_next_own_move") contactExecuted += 1;
    for (const event of defenderConsequenceOperands(payload)) {
      if (event.kind === "edge_lost_target_captured") defenderEdgeLost += 1;
      else defenderRelocated += 1;
    }
  }
  return { pairs: pairs(triples).length, triples: triples.length, contactSurvived, contactExecuted, harassmentPressure, defenderEdgeLost, defenderRelocated };
}

function percent(value: number): string { return `${(100 * value).toFixed(3)}%`; }
function lift(value: number): string { return Number.isNaN(value) ? "n/a" : Number.isFinite(value) ? `${value.toFixed(2)}x` : "inf"; }

describe("breadth collector permanent measurement", () => {
  it("records complete alternatives and retained sequences for both fixed populations", () => {
    const imported = importedPopulation();
    const populations = [
      { name: "authored pack spine", rows: authoredRows(), triples: authoredTriples() },
      { name: "sealed imported fixed-ply sample", rows: imported.sampled, triples: pathTriples(imported.paths) },
    ];
    const lines = ["# Breadth collector measurement", "", "Production collectors; complete legal alternatives per source position. Recorded sequences establish prevalence only.", ""];
    for (const population of populations) {
      const result = measure(population.rows);
      const sequences = sequenceCensus(population.triples);
      expect(result.values.map((value) => value.name)).toEqual(Object.keys(PROBES).sort());
      expect(result.values.every((value) => value.eligible > 0 && value.alternatives > 0)).toBe(true);
      lines.push(`## ${population.name}`, "", `Decisions: ${population.rows.length}; elapsed: ${result.elapsedMs.toFixed(1)} ms.`, "", "| probe | played | alternatives | lift |", "|---|---:|---:|---:|");
      for (const value of result.values) lines.push(`| \`${value.name}\` | ${value.played}/${value.eligible} (${percent(value.playedRate)}) | ${value.fires}/${value.alternatives} (${percent(value.alternativeRate)}) | ${lift(value.lift)} |`);
      lines.push("", `Recorded windows: ${sequences.pairs} pairs / ${sequences.triples} triples. Contact survived reply: ${sequences.contactSurvived}; contact executed next own move: ${sequences.contactExecuted}; harassment-pressure retained: ${sequences.harassmentPressure}; defender edge-lost consequences: ${sequences.defenderEdgeLost}; defender-relocated consequences: ${sequences.defenderRelocated}.`, "");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  });
});
