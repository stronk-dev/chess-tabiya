// DISPOSABLE research harness — D1573/D1574. Not production code.
//
// Measures the complete one-edge population over the fixed D1061 position sample. JSON byte counts
// are a deterministic structural-size proxy, not a claim about V8 heap usage.
import { readFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { SEMANTIC_EVENT_PROJECTION_IDS } from "../../packages/runtime/src/evidence-catalog.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { localSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";

const INPUT = new URL("../../planning/evidence-foundation-ux/d1061-bestline-distance-results.json", import.meta.url);

interface InputRow { readonly packId: string; readonly phase: string; readonly fen: string }

function childFen(fen: string, moveUci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = parseUci(moveUci);
  if (move === undefined || !("from" in move) || !position.isLegal(move)) throw new TypeError(`illegal exact move ${moveUci}`);
  position.play(move);
  return makeFen(position.toSetup());
}

function quantile(values: readonly number[], q: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.floor(q * ordered.length))] ?? 0;
}

describe("D1573 candidate-packet size and closure envelope", () => {
  it("measures complete populations without treating the sample as the emitter schema", { timeout: 120_000 }, () => {
    const source = JSON.parse(readFileSync(INPUT, "utf8")) as { readonly rows: readonly InputRow[] };
    const roots = [...new Map(source.rows.map((row) => [row.fen, row])).values()];
    const rootEvents: number[] = [];
    const rootBytes: number[] = [];
    const rootMoves: number[] = [];
    const rootMs: number[] = [];
    const observed = new Set<string>();
    let maximum: { readonly packId: string; readonly moves: number; readonly events: number; readonly jsonBytes: number; readonly ms: number } | undefined;

    for (const row of roots) {
      const started = performance.now();
      let events = 0;
      let jsonBytes = 0;
      const moves = exactLegalMoves(row.fen);
      for (const move of moves) {
        const afterFen = childFen(row.fen, move.uci);
        const values = localSemanticEvents(row.fen, move.uci, afterFen);
        events += values.length;
        jsonBytes += Buffer.byteLength(JSON.stringify(values));
        for (const value of values) observed.add(`${value.projection.id}@${value.projection.version}`);
      }
      const ms = performance.now() - started;
      rootMoves.push(moves.length);
      rootEvents.push(events);
      rootBytes.push(jsonBytes);
      rootMs.push(ms);
      if (maximum === undefined || jsonBytes > maximum.jsonBytes) maximum = { packId: row.packId, moves: moves.length, events, jsonBytes, ms };
    }

    const declared = new Set(SEMANTIC_EVENT_PROJECTION_IDS.map((id) => `${id}@1`));
    const report = {
      roots: roots.length,
      moves: { p50: quantile(rootMoves, 0.5), p95: quantile(rootMoves, 0.95), max: Math.max(...rootMoves) },
      events: { p50: quantile(rootEvents, 0.5), p95: quantile(rootEvents, 0.95), max: Math.max(...rootEvents) },
      structuralJsonBytes: { p50: quantile(rootBytes, 0.5), p95: quantile(rootBytes, 0.95), max: Math.max(...rootBytes) },
      compileMs: { p50: quantile(rootMs, 0.5), p95: quantile(rootMs, 0.95), max: Math.max(...rootMs) },
      closure: {
        declared: declared.size,
        observed: observed.size,
        declaredNotObserved: [...declared].filter((id) => !observed.has(id)).sort(),
        observedNotDeclared: [...observed].filter((id) => !declared.has(id)).sort(),
      },
      maximum,
    };
    console.log(`D1573_ENVELOPE ${JSON.stringify(report)}`);

    expect(roots.length).toBe(64);
    expect(report.closure.observedNotDeclared).toEqual([]);
    expect(report.closure.declaredNotObserved.length).toBeGreaterThan(0);
    expect(report.structuralJsonBytes.max).toBeGreaterThan(report.structuralJsonBytes.p50);
  });
});
