// DISPOSABLE research harness — D1730. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { between } from "chessops/attacks";
import type { Square } from "chessops/types";
import { makeSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_CONTRACT_DECLARATIONS,
  compileEvidenceManifest,
  discoveredExecutedEvents,
  discoveredLatencyReading,
  lineBlockerClearanceObservedOperands,
  rayClassificationReading,
  squareClearanceObservedOperands,
  structuralReading,
  transitionSemanticFacts,
  type GainedSliderRay,
} from "@chess-tabiya/runtime";
import { positionFromFen } from "../../packages/runtime/src/chess.js";
import {
  authoredRows,
  authoredTriples,
  importedPopulation,
  pathTriples,
  type ResearchRow,
  type ResearchTriple,
} from "../research-chess/populations.js";

const BASELINE = resolve(import.meta.dirname, "baseline.json");
const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);

function uniquePositions(rows: readonly ResearchRow[]): readonly string[] {
  return [...new Set(rows.flatMap((row) => [row.parentFen, row.fen]))];
}

function anchors(triple: ResearchTriple) {
  return triple.map((row, index) => Object.freeze({
    beforeNodeId: `n${index}`,
    afterNodeId: `n${index + 1}`,
    beforeFen: row.parentFen,
    moveUci: row.uci,
    afterFen: row.fen,
  }));
}

const DIRECTIONS = Object.freeze({
  bishop: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  queen: [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
} as const);

function exactBoardEdgeRays(fen: string) {
  const position = positionFromFen(fen);
  const result = new Map<string, readonly string[]>();
  for (const [square, piece] of position.board) {
    if (!(piece.role in DIRECTIONS)) continue;
    for (const [df, dr] of DIRECTIONS[piece.role as keyof typeof DIRECTIONS]) {
      let file = square % 8;
      let rank = Math.floor(square / 8);
      let endpoint = square;
      while (file + df >= 0 && file + df < 8 && rank + dr >= 0 && rank + dr < 8) {
        file += df;
        rank += dr;
        endpoint = file + rank * 8;
      }
      const subject = `${makeSquare(square)}:${piece.color}:${piece.role}:${makeSquare(endpoint as Square)}`;
      result.set(subject, Object.freeze([...between(square, endpoint as Square).intersect(position.board.occupied)].map(makeSquare).sort()));
    }
  }
  return result;
}

function census(rows: readonly ResearchRow[], triples: readonly ResearchTriple[]) {
  const positions = uniquePositions(rows);
  let lineBlockers = 0;
  let structuralFacts = 0;
  let targetRays = 0;
  let latencyScreens = 0;
  const rayKinds = new Map<string, number>();
  for (const fen of positions) {
    const facts = structuralReading(fen).features;
    structuralFacts += facts.length;
    lineBlockers += facts.filter((fact) => fact.kind === "line_blockers").length;
    const rays = rayClassificationReading(fen).rays;
    targetRays += rays.length;
    for (const ray of rays) rayKinds.set(ray.kind, (rayKinds.get(ray.kind) ?? 0) + 1);
    latencyScreens += discoveredLatencyReading(fen).screens.length;
  }

  let sliderRayGained = 0;
  let sliderRayLost = 0;
  let countPreservingBlockerChanges = 0;
  let discoveredExecuted = 0;
  for (const row of rows) {
    const facts = transitionSemanticFacts(row.parentFen, row.uci, row.fen);
    const rays = facts.filter((fact) => fact.family === "slider_ray");
    sliderRayGained += rays.filter((fact) => fact.sign === "gained").length;
    sliderRayLost += rays.filter((fact) => fact.sign === "lost").length;
    const beforeRays = exactBoardEdgeRays(row.parentFen);
    const afterRays = exactBoardEdgeRays(row.fen);
    for (const [subject, beforeBlockers] of beforeRays) {
      const afterBlockers = afterRays.get(subject);
      if (afterBlockers === undefined || beforeBlockers.length !== afterBlockers.length) continue;
      if (beforeBlockers.join(",") !== afterBlockers.join(",")) countPreservingBlockerChanges += 1;
    }
    discoveredExecuted += discoveredExecutedEvents(
      row.parentFen,
      row.uci,
      row.fen,
      rays.filter((fact): fact is GainedSliderRay => fact.sign === "gained") as readonly GainedSliderRay[],
    ).length;
  }

  let lineClearanceObserved = 0;
  let squareClearanceObserved = 0;
  for (const triple of triples) {
    const path = anchors(triple);
    lineClearanceObserved += lineBlockerClearanceObservedOperands(path).length;
    squareClearanceObserved += squareClearanceObservedOperands(path).length;
  }

  return Object.freeze({
    positions: positions.length,
    decisions: rows.length,
    triples: triples.length,
    structuralFacts,
    lineBlockers,
    lineBlockerShare: Number((lineBlockers / structuralFacts).toFixed(4)),
    targetRays,
    rayKinds: Object.fromEntries([...rayKinds].sort()),
    latencyScreens,
    sliderRayGained,
    sliderRayLost,
    countPreservingBlockerChanges,
    discoveredExecuted,
    lineClearanceObserved,
    squareClearanceObserved,
  });
}

function consumers(id: string): readonly string[] {
  return manifest.bindings
    .filter((binding) => binding.projection.id === id)
    .map((binding) => binding.consumer.id)
    .sort();
}

describe("D1730 line-family semantic boundary", () => {
  it("proves the legacy row points at a board edge rather than a named target", () => {
    const fen = "4k3/8/8/8/8/8/4P3/R3K3 w - - 0 1";
    const row = structuralReading(fen).features.find((fact) =>
      fact.kind === "line_blockers" && fact.squares[0] === "a1" && fact.squares[1] === "a8");
    expect(row).toEqual({ kind: "line_blockers", squares: ["a1", "a8"], count: 0 });
    expect(rayClassificationReading(fen).rays).toEqual([]);
    expect(discoveredLatencyReading(fen).screens).toEqual([]);
  });

  it("keeps target-ray, latent discovery, edge execution and clearance as distinct contracts", () => {
    const ids = [
      "rules.structural.reading.line_blockers",
      "rules.tactic.reading.ray_classification",
      "rules.tactic.reading.discovered_latency",
      "rules.transition.event.slider_ray",
      "derived.tactic.discovered_executed",
      "derived.tactic.line_blocker_clearance_observed",
      "derived.tactic.square_clearance_observed",
    ];
    const projections = new Map(manifest.projections.map((projection) => [projection.id, projection]));
    for (const id of ids) expect(projections.has(id), id).toBe(true);
    expect(projections.get("rules.tactic.reading.ray_classification")!.operands).toEqual(["fen", "rays"]);
    expect(projections.get("derived.tactic.line_blocker_clearance_observed")!.operands).toContain("targetCapture");
    expect(projections.get("derived.tactic.square_clearance_observed")!.operands).not.toContain("target");
  });

  it("shows ordinary delivery is inverted toward the target-free census", () => {
    expect(consumers("rules.structural.reading.line_blockers")).toEqual([
      "board.selected_square_sight",
      "inspector.position_structure",
    ]);
    expect(consumers("rules.tactic.reading.ray_classification")).toEqual([]);
    expect(consumers("rules.tactic.reading.discovered_latency")).toEqual([]);
    expect(consumers("derived.tactic.discovered_executed")).toEqual(["research.semantic_selection"]);
    expect(consumers("derived.tactic.line_blocker_clearance_observed")).toEqual(["research.semantic_selection"]);
    expect(consumers("derived.tactic.square_clearance_observed")).toEqual(["research.semantic_selection"]);
  });
});

describe("D1730 fixed-population reach", () => {
  it("retains the frozen authored/imported receipt", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
    const imported = importedPopulation();
    expect(baseline.schema).toBe("tabiya.research.d1730-line-relevance.v1");
    expect(baseline.authored).toEqual(census(authoredRows(), authoredTriples()));
    expect(baseline.imported).toEqual(census(imported.sampled, pathTriples(imported.paths)));
  }, 120_000);

  it("recomputes the receipt when explicitly requested", () => {
    if (process.env.D1730_CENSUS !== "1") return;
    const imported = importedPopulation();
    console.log(JSON.stringify({
      schema: "tabiya.research.d1730-line-relevance.v1",
      authored: census(authoredRows(), authoredTriples()),
      imported: census(imported.sampled, pathTriples(imported.paths)),
    }, null, 2));
  }, 120_000);
});
