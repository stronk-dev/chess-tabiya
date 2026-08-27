// DISPOSABLE research harness — D1931. Not production code.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import {
  attractionObservedOperands,
  attractionObservedSemanticEvent,
  checkEvent,
  checkZwischenzugObservedOperands,
  checkZwischenzugSemanticEvent,
  declareCheckEventEvidence,
  declareDefenderDutyEvidence,
  declareLegalExchangeEvidence,
  declareRunRecordEvidence,
  defenderConsequenceOperands,
  defenderConsequenceSemanticEvent,
  defenderDutyReading,
  deflectionObservedOperands,
  deflectionObservedSemanticEvent,
  harassmentPressureSemanticEvent,
  harassmentPressureSequence,
  interferenceObservedOperands,
  interferenceSemanticEvent,
  lineBlockerClearanceObservedOperands,
  lineBlockerClearanceSemanticEvent,
  localSemanticEvents,
  overloadExploitationObservedOperands,
  overloadExploitationSemanticEvent,
  pawnContactTimingSemanticEvent,
  pawnContactTimingSequence,
  squareClearanceObservedOperands,
  squareClearanceSemanticEvent,
  tradeCompletedSemanticEvent,
  transitionSemanticEvents,
  type DeclaredEvidence,
  type RecordedMoveAnchor,
  type SemanticEvidenceEvent,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { importedPopulation, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("../../planning/recorded-semantic-path/d1931-source-closure-results.json", import.meta.url);
const REPORT = new URL("../../planning/recorded-semantic-path/d1931-source-closure-results.md", import.meta.url);
const LENGTHS = [20, 40, 80] as const;
const PATHS = 12;
const REPETITIONS = 3;
const ROWS = Object.freeze([
  { projection: "derived.exchange.trade_completed@1", horizon: 2 },
  { projection: "derived.pawn.sequence.contact_timing@1", horizon: 2 },
  { projection: "derived.pawn.sequence.contact_timing@1", horizon: 3 },
  { projection: "derived.pawn.sequence.harassment_pressure@1", horizon: 2 },
  { projection: "derived.tactic.sequence.defender_consequence@1", horizon: 3 },
  { projection: "derived.tactic.deflection_observed@1", horizon: 3 },
  { projection: "derived.tactic.attraction_observed@1", horizon: 3 },
  { projection: "derived.tactic.attraction_observed@1", horizon: 5 },
  { projection: "derived.tactic.line_blocker_clearance_observed@1", horizon: 3 },
  { projection: "derived.tactic.square_clearance_observed@1", horizon: 3 },
  { projection: "derived.tactic.interference_observed@1", horizon: 3 },
  { projection: "derived.tactic.check_zwischenzug_observed@1", horizon: 4 },
  { projection: "derived.tactic.overload_exploitation_observed@1", horizon: 3 },
] as const);

type Mode = "eager" | "exact_source";
interface Edge {
  readonly anchor: RecordedMoveAnchor;
  readonly moveEvidence: DeclaredEvidence<unknown>;
  readonly capture?: SemanticEvidenceEvent;
  readonly check?: DeclaredEvidence<unknown>;
}
interface Result {
  readonly mode: Mode;
  readonly validationMs: number;
  readonly preparationMs: number;
  readonly windowsMs: number;
  readonly totalMs: number;
  readonly eventIds: readonly string[];
  readonly windows: readonly Readonly<Record<string, unknown>>[];
  readonly digest: string;
  readonly preparedEdges: number;
  readonly eagerCalls: number;
  readonly transitionCalls: number;
  readonly checkProbes: number;
  readonly defenderDutyReads: number;
}

const key = (event: SemanticEvidenceEvent): string => `${event.projection.id}@${event.projection.version}`;

function anchors(rows: readonly ResearchRow[]): readonly RecordedMoveAnchor[] {
  return Object.freeze(rows.map((row, index) => Object.freeze({
    beforeNodeId: index === 0 ? `${row.id}:before` : rows[index - 1]!.id,
    afterNodeId: row.id,
    beforeFen: row.parentFen,
    moveUci: row.uci,
    afterFen: row.fen,
  })));
}

function compile(rows: readonly ResearchRow[], mode: Mode): Result {
  const totalStarted = performance.now();
  const validationStarted = totalStarted;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    if (playedFen(row.parentFen, row.uci) !== row.fen) throw new TypeError(`Broken replay at ${row.id}`);
    if (index > 0 && rows[index - 1]!.fen !== row.parentFen) throw new TypeError(`Broken path at ${row.id}`);
  }
  const path = anchors(rows);
  const validationMs = performance.now() - validationStarted;

  const preparationStarted = performance.now();
  let eagerCalls = 0, transitionCalls = 0, checkProbes = 0;
  const edges: readonly Edge[] = Object.freeze(path.map((anchor, offset) => {
    const values = mode === "eager"
      ? (eagerCalls += 1, localSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen))
      : (transitionCalls += 1, transitionSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen));
    const capture = values.find((event) => key(event) === "rules.transition.event.capture@1");
    let checkEvidence = values.find((event) => key(event) === "rules.tactic.event.check@1")?.evidence;
    if (mode === "exact_source") {
      checkProbes += 1;
      const value = checkEvent(anchor.beforeFen, anchor.moveUci);
      checkEvidence = value === undefined ? undefined : declareCheckEventEvidence(value);
    }
    return Object.freeze({
      anchor,
      moveEvidence: declareRunRecordEvidence("move", { context: { beforeNodeId: anchor.beforeNodeId, afterNodeId: anchor.afterNodeId }, offset, moveSan: anchor.moveUci }),
      ...(capture === undefined ? {} : { capture }),
      ...(checkEvidence === undefined ? {} : { check: checkEvidence }),
    });
  }));
  const preparationMs = performance.now() - preparationStarted;

  const windowsStarted = performance.now();
  const ids = new Set<string>();
  const receipts: Array<Readonly<Record<string, unknown>>> = [];
  const duty = new Map<string, DeclaredEvidence<unknown>>();
  for (let start = 0; start < edges.length; start += 1) for (const declaration of ROWS) {
    if (start + declaration.horizon > edges.length) {
      receipts.push(Object.freeze({ projection: declaration.projection, startNodeId: edges[start]!.anchor.beforeNodeId, endNodeId: null, horizon: declaration.horizon, status: "insufficient_continuation", eventIds: Object.freeze([]) }));
      continue;
    }
    const window = edges.slice(start, start + declaration.horizon);
    const pathAnchors = window.map((edge) => edge.anchor);
    const moves = window.map((edge) => edge.moveEvidence);
    const captures = window.map((edge) => edge.capture).filter((value): value is SemanticEvidenceEvent => value !== undefined);
    const getDuty = (): DeclaredEvidence<unknown> => {
      const fen = window[0]!.anchor.beforeFen;
      const found = duty.get(fen);
      if (found !== undefined) return found;
      const value = declareDefenderDutyEvidence(defenderDutyReading(fen));
      duty.set(fen, value);
      return value;
    };
    const emitted: SemanticEvidenceEvent[] = [];
    if (declaration.projection === "derived.exchange.trade_completed@1") {
      const value = captures.length === 2 ? tradeCompletedSemanticEvent(captures[0]!, captures[1]!, moves[0]!, moves[1]!) : undefined;
      if (value !== undefined) emitted.push(value);
    } else if (declaration.projection === "derived.pawn.sequence.contact_timing@1") {
      const value = pawnContactTimingSequence(pathAnchors);
      if (value !== undefined) emitted.push(pawnContactTimingSemanticEvent(value, moves));
    } else if (declaration.projection === "derived.pawn.sequence.harassment_pressure@1") {
      const value = harassmentPressureSequence(pathAnchors);
      if (value !== undefined) emitted.push(harassmentPressureSemanticEvent(value, moves));
    } else if (declaration.projection === "derived.tactic.sequence.defender_consequence@1") {
      for (const value of defenderConsequenceOperands(pathAnchors)) emitted.push(defenderConsequenceSemanticEvent(value, moves));
    } else if (declaration.projection === "derived.tactic.deflection_observed@1") {
      for (const value of deflectionObservedOperands(pathAnchors)) emitted.push(deflectionObservedSemanticEvent(value, moves, getDuty(), captures.map((capture) => capture.evidence), declareLegalExchangeEvidence(value.targetCapture)));
    } else if (declaration.projection === "derived.tactic.attraction_observed@1") {
      for (const value of attractionObservedOperands(pathAnchors)) emitted.push(attractionObservedSemanticEvent(value, moves, captures.map((capture) => capture.evidence), value.checkOrCaptureConsequence.kind === "check" ? window[2]!.check : undefined));
    } else if (declaration.projection === "derived.tactic.line_blocker_clearance_observed@1") {
      for (const value of lineBlockerClearanceObservedOperands(pathAnchors)) emitted.push(lineBlockerClearanceSemanticEvent(value, moves, declareLegalExchangeEvidence(value.targetCapture)));
    } else if (declaration.projection === "derived.tactic.square_clearance_observed@1") {
      for (const value of squareClearanceObservedOperands(pathAnchors)) emitted.push(squareClearanceSemanticEvent(value, moves));
    } else if (declaration.projection === "derived.tactic.interference_observed@1") {
      for (const value of interferenceObservedOperands(pathAnchors)) emitted.push(interferenceSemanticEvent(value, moves, getDuty(), declareLegalExchangeEvidence(value.targetCapture)));
    } else if (declaration.projection === "derived.tactic.check_zwischenzug_observed@1") {
      for (const value of checkZwischenzugObservedOperands(pathAnchors)) {
        if (window[0]!.capture === undefined || window[1]!.check === undefined) throw new TypeError("Zwischenzug lost exact source evidence");
        emitted.push(checkZwischenzugSemanticEvent(value, moves, window[0]!.capture.evidence, window[1]!.check, declareLegalExchangeEvidence(value.retainedRecapture)));
      }
    } else {
      for (const value of overloadExploitationObservedOperands(pathAnchors)) {
        const firstTwo = [window[0]!.capture, window[1]!.capture].filter((capture): capture is SemanticEvidenceEvent => capture !== undefined);
        emitted.push(overloadExploitationSemanticEvent(value, moves, getDuty(), firstTwo.map((capture) => capture.evidence), declareLegalExchangeEvidence(value.secondTargetCapture)));
      }
    }
    for (const event of emitted) ids.add(event.id);
    receipts.push(Object.freeze({ projection: declaration.projection, startNodeId: window[0]!.anchor.beforeNodeId, endNodeId: window.at(-1)!.anchor.afterNodeId, horizon: declaration.horizon, status: emitted.length === 0 ? "no_witness" : "emitted", eventIds: Object.freeze(emitted.map((event) => event.id).sort()) }));
  }
  const eventIds = Object.freeze([...ids].sort());
  const digest = createHash("sha256").update(JSON.stringify({ eventIds, windows: receipts })).digest("hex");
  const windowsMs = performance.now() - windowsStarted;
  return Object.freeze({ mode, validationMs, preparationMs, windowsMs, totalMs: performance.now() - totalStarted, eventIds, windows: Object.freeze(receipts), digest, preparedEdges: edges.length, eagerCalls, transitionCalls, checkProbes, defenderDutyReads: duty.size });
}

function timing(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const q = (value: number): number => sorted[Math.max(0, Math.ceil(sorted.length * value) - 1)] ?? 0;
  return Object.freeze({ samples: sorted.length, p50Ms: q(0.50), p95Ms: q(0.95), maxMs: sorted.at(-1) ?? 0 });
}

function arm(mode: Mode, plies: number, runs: readonly Result[]) {
  return Object.freeze({
    mode, plies, paths: PATHS, repetitions: REPETITIONS,
    timings: { validation: timing(runs.map((run) => run.validationMs)), preparation: timing(runs.map((run) => run.preparationMs)), windows: timing(runs.map((run) => run.windowsMs)), total: timing(runs.map((run) => run.totalMs)) },
    work: { preparedEdges: plies, eagerCalls: mode === "eager" ? plies : 0, transitionCalls: mode === "exact_source" ? plies : 0, checkProbes: mode === "exact_source" ? plies : 0, receipts: plies * ROWS.length },
    synchronous500ms: timing(runs.map((run) => run.totalMs)).p95Ms <= 500,
  });
}

describe("D1931 exact recorded-path source closure", () => {
  it("preserves every result byte before comparing cost", () => {
    const population = importedPopulation();
    const selected = Object.fromEntries(LENGTHS.map((length) => [String(length), population.paths.filter((path) => path.length >= length).slice(0, PATHS).map((path) => path.slice(0, length))])) as Record<string, readonly (readonly ResearchRow[])[]>;
    const populationDigest = createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(selected).map(([length, paths]) => [length, paths.map((path) => path.map((row) => row.id))])))).digest("hex");
    const arms = [];
    for (const plies of LENGTHS) {
      const paths = selected[String(plies)]!;
      expect(paths).toHaveLength(PATHS);
      for (const path of paths) {
        const eager = compile(path, "eager"), exact = compile(path, "exact_source");
        expect(exact.eventIds).toEqual(eager.eventIds);
        expect(exact.windows).toEqual(eager.windows);
        expect(exact.digest).toBe(eager.digest);
      }
      const eagerRuns: Result[] = [], exactRuns: Result[] = [];
      for (let repetition = 0; repetition < REPETITIONS; repetition += 1) for (let index = 0; index < paths.length; index += 1) {
        const order: readonly Mode[] = (repetition + index) % 2 === 0 ? ["eager", "exact_source"] : ["exact_source", "eager"];
        for (const mode of order) (mode === "eager" ? eagerRuns : exactRuns).push(compile(paths[index]!, mode));
      }
      expect(exactRuns.every((run) => run.preparedEdges === plies && run.eagerCalls === 0 && run.transitionCalls === plies && run.checkProbes === plies && run.windows.length === plies * ROWS.length)).toBe(true);
      for (let index = 0; index < eagerRuns.length; index += 1) expect(exactRuns[index]!.digest).toBe(eagerRuns[index]!.digest);
      arms.push(arm("eager", plies, eagerRuns), arm("exact_source", plies, exactRuns));
    }
    const candidateArms = arms.filter((value) => value.mode === "exact_source");
    const output = Object.freeze({ measuredAt: new Date().toISOString(), node: process.version, platform: `${process.platform}/${process.arch}`, populationDigest: `sha256:${populationDigest}`, evaluatorRows: ROWS.length, pathsPerArm: PATHS, repetitions: REPETITIONS, arms, verdict: candidateArms.every((value) => value.synchronous500ms) ? "exact_source_sync_pass" : "exact_source_sync_refused" });
    writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
    const lines = [
      "# D1931 recorded semantic path exact-source closure — results", "",
      `Measured ${output.measuredAt} on ${output.node} ${output.platform}; population ${output.populationDigest}.`, "",
      "| mode | plies | samples | preparation p95 | windows p95 | total p50 | total p95 | max | 500 ms |", "|---|---:|---:|---:|---:|---:|---:|---:|---|",
      ...arms.map((value) => `| ${value.mode} | ${value.plies} | ${value.timings.total.samples} | ${value.timings.preparation.p95Ms.toFixed(1)} ms | ${value.timings.windows.p95Ms.toFixed(1)} ms | ${value.timings.total.p50Ms.toFixed(1)} ms | ${value.timings.total.p95Ms.toFixed(1)} ms | ${value.timings.total.maxMs.toFixed(1)} ms | ${value.synchronous500ms ? "pass" : "REFUSE"} |`), "",
      `**Preregistered verdict:** ${output.verdict}.`, "",
      "Every candidate path produced byte-equal sorted event ids, complete receipt bytes and result digest versus the eager control before timing was admitted.",
    ];
    writeFileSync(REPORT, `${lines.join("\n")}\n`);
  });
});
