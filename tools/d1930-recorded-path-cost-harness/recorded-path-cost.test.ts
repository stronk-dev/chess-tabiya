// DISPOSABLE research harness — D1930. Not production code.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import {
  attractionObservedOperands,
  attractionObservedSemanticEvent,
  checkZwischenzugObservedOperands,
  checkZwischenzugSemanticEvent,
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
  type DeclaredEvidence,
  type RecordedMoveAnchor,
  type SemanticEvidenceEvent,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { importedPopulation, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("../../planning/recorded-semantic-path/d1930-cost-results.json", import.meta.url);
const REPORT = new URL("../../planning/recorded-semantic-path/d1930-cost-results.md", import.meta.url);
const LENGTHS = [20, 40, 80] as const;
const PATHS_PER_ARM = 12;
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

interface PreparedEdge {
  readonly anchor: RecordedMoveAnchor;
  readonly moveEvidence: DeclaredEvidence<unknown>;
  readonly events: readonly SemanticEvidenceEvent[];
}

interface CompileMeasurement {
  readonly validationMs: number;
  readonly preparationMs: number;
  readonly windowsMs: number;
  readonly totalMs: number;
  readonly preparedEdges: number;
  readonly localSemanticCalls: number;
  readonly receipts: number;
  readonly defenderDutyReads: number;
  readonly emittedEvents: number;
  readonly resultDigest: string;
}

const ref = (event: SemanticEvidenceEvent): string => `${event.projection.id}@${event.projection.version}`;

function capture(edge: PreparedEdge): SemanticEvidenceEvent | undefined {
  return edge.events.find((event) => ref(event) === "rules.transition.event.capture@1");
}

function check(edge: PreparedEdge): SemanticEvidenceEvent | undefined {
  return edge.events.find((event) => ref(event) === "rules.tactic.event.check@1");
}

function anchors(rows: readonly ResearchRow[]): readonly RecordedMoveAnchor[] {
  return Object.freeze(rows.map((row, index) => Object.freeze({
    beforeNodeId: index === 0 ? `${row.id}:before` : rows[index - 1]!.id,
    afterNodeId: row.id,
    beforeFen: row.parentFen,
    moveUci: row.uci,
    afterFen: row.fen,
  })));
}

function compile(rows: readonly ResearchRow[]): CompileMeasurement {
  const totalStarted = performance.now();
  const validationStarted = totalStarted;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    if (playedFen(row.parentFen, row.uci) !== row.fen) throw new TypeError(`Broken replay at ${row.id}`);
    if (index > 0 && rows[index - 1]!.fen !== row.parentFen) throw new TypeError(`Broken path at ${row.id}`);
  }
  const pathAnchors = anchors(rows);
  const validationMs = performance.now() - validationStarted;

  const preparationStarted = performance.now();
  let localSemanticCalls = 0;
  const prepared: readonly PreparedEdge[] = Object.freeze(pathAnchors.map((anchor, offset) => {
    localSemanticCalls += 1;
    return Object.freeze({
      anchor,
      moveEvidence: declareRunRecordEvidence("move", {
        context: { beforeNodeId: anchor.beforeNodeId, afterNodeId: anchor.afterNodeId },
        offset,
        moveSan: anchor.moveUci,
      }),
      events: localSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen),
    });
  }));
  const preparationMs = performance.now() - preparationStarted;

  const windowsStarted = performance.now();
  const eventIds = new Set<string>();
  const receiptValues: Array<Readonly<Record<string, unknown>>> = [];
  const duty = new Map<string, DeclaredEvidence<unknown>>();
  for (let start = 0; start < prepared.length; start += 1) for (const row of ROWS) {
    if (start + row.horizon > prepared.length) {
      receiptValues.push(Object.freeze({
        projection: row.projection,
        startNodeId: prepared[start]!.anchor.beforeNodeId,
        endNodeId: null,
        horizon: row.horizon,
        status: "insufficient_continuation",
        eventIds: Object.freeze([]),
      }));
      continue;
    }
    const window = prepared.slice(start, start + row.horizon);
    const windowAnchors = window.map((edge) => edge.anchor);
    const moves = window.map((edge) => edge.moveEvidence);
    const captures = window.map(capture).filter((value): value is SemanticEvidenceEvent => value !== undefined);
    const getDuty = (): DeclaredEvidence<unknown> => {
      const fen = window[0]!.anchor.beforeFen;
      const found = duty.get(fen);
      if (found !== undefined) return found;
      const value = declareDefenderDutyEvidence(defenderDutyReading(fen));
      duty.set(fen, value);
      return value;
    };
    const emitted: SemanticEvidenceEvent[] = [];
    if (row.projection === "derived.exchange.trade_completed@1") {
      const value = captures.length === 2
        ? tradeCompletedSemanticEvent(captures[0]!, captures[1]!, moves[0]!, moves[1]!)
        : undefined;
      if (value !== undefined) emitted.push(value);
    } else if (row.projection === "derived.pawn.sequence.contact_timing@1") {
      const payload = pawnContactTimingSequence(windowAnchors);
      if (payload !== undefined) emitted.push(pawnContactTimingSemanticEvent(payload, moves));
    } else if (row.projection === "derived.pawn.sequence.harassment_pressure@1") {
      const payload = harassmentPressureSequence(windowAnchors);
      if (payload !== undefined) emitted.push(harassmentPressureSemanticEvent(payload, moves));
    } else if (row.projection === "derived.tactic.sequence.defender_consequence@1") {
      for (const payload of defenderConsequenceOperands(windowAnchors)) emitted.push(defenderConsequenceSemanticEvent(payload, moves));
    } else if (row.projection === "derived.tactic.deflection_observed@1") {
      for (const payload of deflectionObservedOperands(windowAnchors)) emitted.push(deflectionObservedSemanticEvent(payload, moves, getDuty(), captures.map((value) => value.evidence), declareLegalExchangeEvidence(payload.targetCapture)));
    } else if (row.projection === "derived.tactic.attraction_observed@1") {
      for (const payload of attractionObservedOperands(windowAnchors)) {
        const checkEvidence = payload.checkOrCaptureConsequence.kind === "check" ? check(window[2]!)?.evidence : undefined;
        emitted.push(attractionObservedSemanticEvent(payload, moves, captures.map((value) => value.evidence), checkEvidence));
      }
    } else if (row.projection === "derived.tactic.line_blocker_clearance_observed@1") {
      for (const payload of lineBlockerClearanceObservedOperands(windowAnchors)) emitted.push(lineBlockerClearanceSemanticEvent(payload, moves, declareLegalExchangeEvidence(payload.targetCapture)));
    } else if (row.projection === "derived.tactic.square_clearance_observed@1") {
      for (const payload of squareClearanceObservedOperands(windowAnchors)) emitted.push(squareClearanceSemanticEvent(payload, moves));
    } else if (row.projection === "derived.tactic.interference_observed@1") {
      for (const payload of interferenceObservedOperands(windowAnchors)) emitted.push(interferenceSemanticEvent(payload, moves, getDuty(), declareLegalExchangeEvidence(payload.targetCapture)));
    } else if (row.projection === "derived.tactic.check_zwischenzug_observed@1") {
      for (const payload of checkZwischenzugObservedOperands(windowAnchors)) {
        const initialCapture = capture(window[0]);
        const intermediateCheck = check(window[1]);
        if (initialCapture === undefined || intermediateCheck === undefined) throw new TypeError("Zwischenzug operands lost their source events");
        emitted.push(checkZwischenzugSemanticEvent(payload, moves, initialCapture.evidence, intermediateCheck.evidence, declareLegalExchangeEvidence(payload.retainedRecapture)));
      }
    } else {
      for (const payload of overloadExploitationObservedOperands(windowAnchors)) {
        const firstTwoCaptures = [capture(window[0]), capture(window[1])].filter((value): value is SemanticEvidenceEvent => value !== undefined);
        emitted.push(overloadExploitationSemanticEvent(payload, moves, getDuty(), firstTwoCaptures.map((value) => value.evidence), declareLegalExchangeEvidence(payload.secondTargetCapture)));
      }
    }
    for (const event of emitted) eventIds.add(event.id);
    receiptValues.push(Object.freeze({ projection: row.projection, startNodeId: window[0]!.anchor.beforeNodeId, endNodeId: window.at(-1)!.anchor.afterNodeId, horizon: row.horizon, status: emitted.length === 0 ? "no_witness" : "emitted", eventIds: Object.freeze(emitted.map((event) => event.id).sort()) }));
  }
  const resultDigest = createHash("sha256").update(JSON.stringify({ eventIds: [...eventIds].sort(), windows: receiptValues })).digest("hex");
  const windowsMs = performance.now() - windowsStarted;
  return Object.freeze({
    validationMs,
    preparationMs,
    windowsMs,
    totalMs: performance.now() - totalStarted,
    preparedEdges: prepared.length,
    localSemanticCalls,
    receipts: receiptValues.length,
    defenderDutyReads: duty.size,
    emittedEvents: eventIds.size,
    resultDigest,
  });
}

function summary(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const q = (value: number): number => sorted[Math.max(0, Math.ceil(sorted.length * value) - 1)] ?? 0;
  return Object.freeze({
    samples: sorted.length,
    p50Ms: q(0.50),
    p95Ms: q(0.95),
    maxMs: sorted.at(-1) ?? 0,
  });
}

describe("D1930 recorded semantic path cost", () => {
  it("measures the preregistered complete-window workload", () => {
    const population = importedPopulation();
    const selected = Object.fromEntries(LENGTHS.map((length) => {
      const paths = population.paths.filter((path) => path.length >= length).slice(0, PATHS_PER_ARM).map((path) => path.slice(0, length));
      expect(paths).toHaveLength(PATHS_PER_ARM);
      return [String(length), paths];
    })) as Record<string, readonly (readonly ResearchRow[])[]>;
    const populationDigest = createHash("sha256").update(JSON.stringify(Object.fromEntries(Object.entries(selected).map(([length, paths]) => [length, paths.map((path) => path.map((row) => row.id))])))).digest("hex");
    const arms = [];
    for (const length of LENGTHS) {
      const paths = selected[String(length)]!;
      for (const path of paths) compile(path);
      const runs: CompileMeasurement[] = [];
      for (let repetition = 0; repetition < REPETITIONS; repetition += 1) for (const path of paths) runs.push(compile(path));
      expect(runs.every((run) => run.preparedEdges === length && run.localSemanticCalls === length && run.receipts === length * ROWS.length)).toBe(true);
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex += 1) {
        const digests = new Set(Array.from({ length: REPETITIONS }, (_, repetition) => runs[repetition * paths.length + pathIndex]!.resultDigest));
        expect(digests.size).toBe(1);
      }
      arms.push(Object.freeze({
        plies: length,
        paths: paths.length,
        repetitions: REPETITIONS,
        timings: {
          validation: summary(runs.map((run) => run.validationMs)),
          preparation: summary(runs.map((run) => run.preparationMs)),
          windows: summary(runs.map((run) => run.windowsMs)),
          total: summary(runs.map((run) => run.totalMs)),
        },
        work: {
          preparedEdges: length,
          localSemanticCalls: length,
          receipts: length * ROWS.length,
          defenderDutyReads: summary(runs.map((run) => run.defenderDutyReads)),
          emittedEvents: summary(runs.map((run) => run.emittedEvents)),
        },
        synchronous500ms: summary(runs.map((run) => run.totalMs)).p95Ms <= 500,
      }));
    }
    const output = Object.freeze({
      measuredAt: new Date().toISOString(),
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      populationDigest: `sha256:${populationDigest}`,
      evaluatorRows: ROWS.length,
      pathsPerArm: PATHS_PER_ARM,
      repetitions: REPETITIONS,
      arms,
      verdict: arms.every((arm) => arm.synchronous500ms) ? "synchronous_full_path_pass" : "synchronous_full_path_refused",
    });
    writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
    const lines = [
      "# D1930 recorded semantic path cost — results",
      "",
      `Measured ${output.measuredAt} on ${output.node} ${output.platform}; population ${output.populationDigest}.`,
      "",
      "| plies | samples | validation p95 | preparation p95 | windows p95 | total p50 | total p95 | max | 500 ms |",
      "|---:|---:|---:|---:|---:|---:|---:|---:|---|",
      ...arms.map((arm) => `| ${arm.plies} | ${arm.timings.total.samples} | ${arm.timings.validation.p95Ms.toFixed(1)} ms | ${arm.timings.preparation.p95Ms.toFixed(1)} ms | ${arm.timings.windows.p95Ms.toFixed(1)} ms | ${arm.timings.total.p50Ms.toFixed(1)} ms | ${arm.timings.total.p95Ms.toFixed(1)} ms | ${arm.timings.total.maxMs.toFixed(1)} ms | ${arm.synchronous500ms ? "pass" : "REFUSE"} |`),
      "",
      `**Preregistered verdict:** ${output.verdict}.`,
      "",
      `Each compile prepared one edge and called \`localSemanticEvents\` once per ply, then allocated ${ROWS.length} receipts per start. Wall-clock values are research evidence; only those exact work counts belong in generic software CI.`,
    ];
    writeFileSync(REPORT, `${lines.join("\n")}\n`);
  });
});
