// Permanent research/acceptance instrument — tactical-collectors A5/A7/A8/A18.
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

import type { Color } from "chessops/types";
import { makeSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { castlingLegality, castlingRights, castlingRightsLost } from "../../packages/runtime/src/castling.js";
import { legalExchange } from "../../packages/runtime/src/exchange.js";
import { developmentReading } from "../../packages/runtime/src/phase.js";
import {
  discoveredExecutedEvents,
  discoveredLatencyReading,
  doubleAttackEvent,
  forkSurvivesReply,
  loosePieceEvents,
  loosePieceReading,
  mateInOne,
  promotionPressureReading,
  rayClassificationReading,
  replyBreadth,
  rookOnSeventhReading,
  threats,
  trappedPieceReading,
  backRankReading,
  type GainedSliderRay,
} from "../../packages/runtime/src/tactics.js";
import { pawnIslandSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";
import { pawnConnectivityReading, spaceReading } from "../../packages/runtime/src/structure.js";
import { transitionSemanticFacts } from "../../packages/runtime/src/transition.js";
import {
  authoredRows,
  authoredTriples,
  importedPopulation,
  legalOutcomes,
  pathTriples,
  type ResearchRow,
  type ResearchTriple,
} from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const BOOTSTRAPS = 2_000;

type Probe = (row: ResearchRow) => boolean | undefined;
interface Contribution { readonly played: number; readonly playedEligible: number; readonly alternatives: number; readonly alternativeFires: number }

const staticCache = new Map<string, Readonly<Record<string, boolean>>>();

function mover(row: ResearchRow): Color { return positionFromFen(row.parentFen).turn; }
function totalSpace(fen: string, color: Color): number { return spaceReading(fen).colors.find((entry) => entry.color === color)!.total; }

function gainedRays(row: ResearchRow): readonly GainedSliderRay[] {
  return transitionSemanticFacts(row.parentFen, row.uci, row.fen)
    .filter((fact): fact is Extract<typeof fact, { readonly family: "slider_ray" }> => fact.family === "slider_ray" && fact.sign === "gained")
    .map((fact) => ({ family: "slider_ray", sign: "gained", subject: fact.subject, targets_before: fact.targets_before, targets_after: fact.targets_after }));
}

function movedPieceGainedLoose(row: ResearchRow): boolean | undefined {
  const result = loosePieceEvents(row.parentFen, row.uci);
  if (result.kind === "unavailable") return undefined;
  const move = parseUci(row.uci);
  if (move === undefined || !("from" in move)) return false;
  const from = makeSquare(move.from), to = makeSquare(move.to);
  return result.events.some((event) => event.sign === "gained" && event.mover.before.square === from && event.mover.after.square === to);
}

function anyLooseSign(row: ResearchRow, sign: "gained" | "lost"): boolean | undefined {
  const result = loosePieceEvents(row.parentFen, row.uci);
  return result.kind === "unavailable" ? undefined : result.events.some((event) => event.sign === sign);
}

function forkSurvives(row: ResearchRow): boolean {
  const event = doubleAttackEvent(row.parentFen, row.uci);
  return event !== undefined && forkSurvivesReply(event, replyBreadth(row.parentFen, row.uci)).matched;
}

function staticReadings(fen: string): Readonly<Record<string, boolean>> {
  const cached = staticCache.get(fen);
  if (cached !== undefined) return cached;
  const connectivity = pawnConnectivityReading(fen);
  const rays = rayClassificationReading(fen).rays;
  const trapped = trappedPieceReading(fen);
  const promotion = promotionPressureReading(fen);
  const threat = threats(fen);
  const rights = castlingRights(fen);
  const development = developmentReading(fen);
  const value = Object.freeze({
    pawn_connectivity_over_two_islands: connectivity.colors.some((color) => color.islandCount > 2),
    connected_pawn_pair: connectivity.colors.some((color) => color.connectedPawnPairs.length > 0),
    pawn_support_chain: connectivity.colors.some((color) => color.chains.length > 0),
    rook_on_seventh: rookOnSeventhReading(fen).rooks.length > 0,
    space_nonzero: spaceReading(fen).colors.some((color) => color.total > 0),
    discovered_latency: discoveredLatencyReading(fen).screens.length > 0,
    absolute_pin: rays.some((ray) => ray.kind === "absolute_pin"),
    relative_pin: rays.some((ray) => ray.kind === "relative_pin"),
    skewer: rays.some((ray) => ray.kind === "skewer"),
    xray_attack: rays.some((ray) => ray.kind === "xray_attack"),
    xray_defense: rays.some((ray) => ray.kind === "xray_defense"),
    trapped_piece: trapped.kind === "pieces" && trapped.pieces.length > 0,
    back_rank_susceptible: backRankReading(fen).susceptible.length > 0,
    mate_in_one: mateInOne(fen).mates.length > 0,
    promotion_pressure: promotion.pawns.length > 0,
    promotion_available_next: promotion.pawns.some((pawn) => pawn.passAvailability.kind === "available" && pawn.passAvailability.value),
    promotion_unstoppable: promotion.pawns.some((pawn) => pawn.replyPersistence.kind === "available" && pawn.replyPersistence.value),
    loose_piece: loosePieceReading(fen).pieces.some((piece) => piece.enPrise),
    threat_present: threat.kind === "threats" && threat.threats.length > 0,
    castling_right_held: rights.white.kingside || rights.white.queenside || rights.black.kingside || rights.black.queenside,
    castling_right_held_but_illegal: castlingLegality(fen).some((issue) => !issue.legalNow),
    undeveloped_minor: development.undeveloped.white.length + development.undeveloped.black.length > 0,
  });
  staticCache.set(fen, value);
  return value;
}

const PROBES: Readonly<Record<string, Probe>> = Object.freeze({
  moved_piece_en_prise: movedPieceGainedLoose,
  loose_piece_gained: (row) => anyLooseSign(row, "gained"),
  loose_piece_resolved: (row) => anyLooseSign(row, "lost"),
  double_attack: (row) => doubleAttackEvent(row.parentFen, row.uci) !== undefined,
  fork_survives_reply: forkSurvives,
  check: (row) => transitionSemanticFacts(row.parentFen, row.uci, row.fen).some((fact) => fact.family === "checkmate") || positionFromFen(row.fen).isCheck(),
  castling_right_lost: (row) => castlingRightsLost(row.parentFen, row.uci, row.fen).length > 0,
  pawn_islands_gained: (row) => pawnIslandSemanticEvents(row.parentFen, row.uci, row.fen).some((event) => event.sign === "gained"),
  developed: (row) => transitionSemanticFacts(row.parentFen, row.uci, row.fen).some((fact) => fact.family === "developed" && fact.sign === "gained"),
  rook_on_seventh: (row) => staticReadings(row.fen).rook_on_seventh,
  space_increased: (row) => totalSpace(row.fen, mover(row)) > totalSpace(row.parentFen, mover(row)),
  discovered_executed: (row) => discoveredExecutedEvents(row.parentFen, row.uci, row.fen, gainedRays(row)).length > 0,
  back_rank_susceptible: (row) => staticReadings(row.fen).back_rank_susceptible,
  mate_in_one: (row) => staticReadings(row.fen).mate_in_one,
  promotion_available_next: (row) => staticReadings(row.fen).promotion_available_next,
  promotion_unstoppable: (row) => staticReadings(row.fen).promotion_unstoppable,
  threat_present: (row) => staticReadings(row.fen).threat_present,
});

function alternativeRows(row: ResearchRow): readonly ResearchRow[] {
  return legalOutcomes(row.parentFen)
    .filter((candidate) => candidate.uci !== row.uci)
    .map((candidate) => ({ id: `${row.id}/alt:${candidate.uci}`, parentFen: row.parentFen, uci: candidate.uci, fen: candidate.fen }));
}

function bootstrapLift(rows: readonly Contribution[], seed: number): readonly [number, number] {
  let state = seed >>> 0;
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  const samples: number[] = [];
  for (let iteration = 0; iteration < BOOTSTRAPS; iteration += 1) {
    let played = 0, eligible = 0, alternatives = 0, fires = 0;
    for (let draw = 0; draw < rows.length; draw += 1) {
      const row = rows[Math.floor(random() * rows.length)]!;
      played += row.played; eligible += row.playedEligible; alternatives += row.alternatives; fires += row.alternativeFires;
    }
    if (eligible > 0 && alternatives > 0 && fires > 0) samples.push((played / eligible) / (fires / alternatives));
  }
  samples.sort((left, right) => left - right);
  return [samples[Math.floor(samples.length * 0.025)] ?? 0, samples[Math.floor(samples.length * 0.975)] ?? 0];
}

function measure(rows: readonly ResearchRow[]) {
  const started = performance.now();
  const contributions = new Map<string, Contribution[]>();
  let decisions = 0, alternatives = 0;
  for (const row of rows) {
    const alts = alternativeRows(row);
    if (alts.length === 0) continue;
    decisions += 1; alternatives += alts.length;
    for (const [name, probe] of Object.entries(PROBES)) {
      const played = probe(row);
      let eligibleAlternatives = 0, alternativeFires = 0;
      for (const alt of alts) {
        const result = probe(alt);
        if (result === undefined) continue;
        eligibleAlternatives += 1;
        if (result) alternativeFires += 1;
      }
      const values = contributions.get(name) ?? [];
      values.push({ played: played ? 1 : 0, playedEligible: played === undefined ? 0 : 1, alternatives: eligibleAlternatives, alternativeFires });
      contributions.set(name, values);
    }
  }
  const values = [...contributions].map(([name, rows], index) => {
    const played = rows.reduce((sum, row) => sum + row.played, 0);
    const eligible = rows.reduce((sum, row) => sum + row.playedEligible, 0);
    const alternativeFires = rows.reduce((sum, row) => sum + row.alternativeFires, 0);
    const alternativeEligible = rows.reduce((sum, row) => sum + row.alternatives, 0);
    const playedRate = played / eligible, alternativeRate = alternativeFires / alternativeEligible;
    const lift = alternativeRate === 0 ? playedRate === 0 ? Number.NaN : Number.POSITIVE_INFINITY : playedRate / alternativeRate;
    return { name, played, eligible, alternativeFires, alternativeEligible, playedRate, alternativeRate, lift, interval: bootstrapLift(rows, 0xa800000 + index * 7919) };
  }).sort((left, right) => left.name.localeCompare(right.name));
  return { decisions, alternatives, elapsedMs: performance.now() - started, values };
}

function census(rows: readonly ResearchRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) for (const [name, present] of Object.entries(staticReadings(row.fen))) if (present) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...Object.keys(staticReadings(rows[0]!.fen))].sort().map((name) => ({ name, count: counts.get(name) ?? 0, total: rows.length }));
}

function captureCensus(rows: readonly ResearchRow[]) {
  const values = { positive: 0, negative: 0, equal: 0, captures: 0, rows: rows.length };
  for (const row of rows) {
    const result = legalExchange(row.parentFen, row.uci);
    if (result === undefined) continue;
    values.captures += 1;
    values[result.resultUnits > 0 ? "positive" : result.resultUnits < 0 ? "negative" : "equal"] += 1;
  }
  return values;
}

function tradeCensus(triples: readonly ResearchTriple[]) {
  let windows = 0, trades = 0;
  for (const [first, second] of triples) {
    windows += 1;
    const firstCapture = transitionSemanticFacts(first.parentFen, first.uci, first.fen).find((fact) => fact.family === "capture");
    const secondCapture = transitionSemanticFacts(second.parentFen, second.uci, second.fen).find((fact) => fact.family === "capture");
    if (first.fen === second.parentFen && firstCapture?.family === "capture" && secondCapture?.family === "capture" && firstCapture.to === secondCapture.to) trades += 1;
  }
  return { windows, trades };
}

function pct(value: number): string { return `${(value * 100).toFixed(3)}%`; }
function lift(value: number): string { return Number.isNaN(value) ? "n/a" : Number.isFinite(value) ? `${value.toFixed(2)}x` : "inf"; }

describe("tactical collector permanent measurement", () => {
  it("records both populations separately with complete alternatives and honest zeros", () => {
    const imported = importedPopulation();
    const populations = [
      { name: "authored pack spine", rows: authoredRows(), triples: authoredTriples() },
      { name: "sealed imported fixed-ply sample", rows: imported.sampled, triples: pathTriples(imported.paths) },
    ] as const;
    const lines = [
      "# Tactical collector measurement", "",
      "Production collectors; complete legal alternatives per source position; deterministic paired 2,000-resample bootstrap.",
      "Capture is intentionally a frequency/class census and has no lift claim. Zeros are retained.", "",
    ];
    for (const population of populations) {
      const result = measure(population.rows);
      const states = census(population.rows);
      const captures = captureCensus(population.rows);
      const trades = tradeCensus(population.triples);
      expect(result.decisions).toBeGreaterThan(0);
      expect(result.alternatives).toBeGreaterThan(result.decisions);
      expect(result.values.map((value) => value.name)).toEqual(Object.keys(PROBES).sort());
      lines.push(`## ${population.name}`, "", `Decisions: ${result.decisions}; legal alternatives: ${result.alternatives}; elapsed: ${result.elapsedMs.toFixed(1)} ms.`, "", "### Played moves versus legal alternatives", "", "| probe | played | alternatives | lift (paired bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const value of result.values) lines.push(`| \`${value.name}\` | ${value.played}/${value.eligible} (${pct(value.playedRate)}) | ${value.alternativeFires}/${value.alternativeEligible} (${pct(value.alternativeRate)}) | ${lift(value.lift)} (${value.interval[0].toFixed(2)}–${value.interval[1].toFixed(2)}) |`);
      lines.push("", "### State/readout census on played positions", "", "| reading | present |", "|---|---:|");
      for (const state of states) lines.push(`| \`${state.name}\` | ${state.count}/${state.total} (${pct(state.count / state.total)}) |`);
      lines.push("", "### Capture and adjacent trade census (no capture lift)", "", `Capture events: ${captures.captures}/${captures.rows}; local-exchange classes positive/equal/negative: ${captures.positive}/${captures.equal}/${captures.negative}.`, `Adjacent two-edge windows: ${trades.windows}; immediate same-square capture-recaptures: ${trades.trades}.`, "");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  });
});
