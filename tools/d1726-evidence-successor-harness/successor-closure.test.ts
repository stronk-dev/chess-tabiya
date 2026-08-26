// DISPOSABLE research harness — D1726. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import {
  CURRENT_CONSUMER_OPERATION_IDS,
  EVIDENCE_CONTRACT_DECLARATIONS,
  TRANSITION_READING_PROJECTION_IDS,
  compileEvidenceManifest,
  structuralReading,
  transitionReading,
} from "@chess-tabiya/runtime";
import { authoredRows, importedRows, type ResearchRow } from "../research-chess/populations.js";

const ROOT = resolve(import.meta.dirname, "../..");
const BASELINE = resolve(import.meta.dirname, "baseline.json");
const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
const currentConsumers = new Set<string>(CURRENT_CONSUMER_OPERATION_IDS);

type StructuralDisposition = "replace_ordinary" | "derive_successor" | "contract_pending" | "retain_literal" | "retired";
interface StructuralSuccessorRow {
  readonly family: (typeof STRUCTURAL_FEATURE_KINDS)[number];
  readonly disposition: StructuralDisposition;
  readonly successors: readonly string[];
}

/** Architecture mapping only: it does not equate a richer payload with a chess judgement. */
const STRUCTURAL_SUCCESSORS: readonly StructuralSuccessorRow[] = Object.freeze([
  { family: "pawn_safe_square", disposition: "contract_pending", successors: ["rules.square.reading.control"] },
  { family: "outpost", disposition: "contract_pending", successors: ["rules.square.reading.control"] },
  { family: "backward_pawn", disposition: "contract_pending", successors: [] },
  { family: "isolated_pawn", disposition: "derive_successor", successors: ["rules.structural.reading.pawn_connectivity"] },
  { family: "doubled_pawn", disposition: "derive_successor", successors: ["rules.structural.reading.pawn_connectivity"] },
  { family: "passed_pawn", disposition: "replace_ordinary", successors: ["rules.pawn.reading.contacts"] },
  { family: "open_file", disposition: "retain_literal", successors: [] },
  { family: "half_open_file", disposition: "retain_literal", successors: [] },
  { family: "line_blockers", disposition: "derive_successor", successors: ["rules.tactic.reading.ray_classification", "rules.tactic.reading.discovered_latency"] },
  { family: "direct_attack_count", disposition: "replace_ordinary", successors: ["rules.square.reading.control"] },
  { family: "piece_reach_count", disposition: "replace_ordinary", successors: ["rules.mobility.reading.piece_destinations"] },
  { family: "named_structure", disposition: "retain_literal", successors: [] },
  { family: "bishop_on_shade", disposition: "retain_literal", successors: [] },
  { family: "pawn_count", disposition: "retired", successors: [] },
  { family: "king_opposition", disposition: "contract_pending", successors: [] },
  { family: "piece_count", disposition: "replace_ordinary", successors: ["derived.material.reading.role_signature"] },
  { family: "king_zone", disposition: "replace_ordinary", successors: ["rules.king.reading.zone_state"] },
  { family: "piece_distance", disposition: "retain_literal", successors: [] },
]);

const TRANSITION_SUCCESSORS = Object.freeze({
  "rules.transition.reading.attacked_squares_changed.gained": "rules.transition.event.occupied_attack",
  "rules.transition.reading.attacked_squares_changed.lost": "rules.transition.event.occupied_attack",
  "rules.transition.reading.defended_squares_changed.gained": "rules.transition.event.occupied_defence",
  "rules.transition.reading.defended_squares_changed.lost": "rules.transition.event.occupied_defence",
  "rules.transition.reading.slider_lines_changed.opened": "rules.transition.event.slider_ray",
  "rules.transition.reading.slider_lines_changed.closed": "rules.transition.event.slider_ray",
  "rules.transition.reading.escape_squares_changed.gained": "rules.transition.event.piece_escape",
  "rules.transition.reading.escape_squares_changed.lost": "rules.transition.event.piece_escape",
  "rules.transition.reading.defended_duties_changed.acquired": "rules.transition.event.defended_duty",
  "rules.transition.reading.defended_duties_changed.released": "rules.transition.event.defended_duty",
  "rules.transition.reading.move_irreversibility.castled": "rules.transition.event.castled",
  "rules.transition.reading.move_irreversibility.clock_zeroed": "rules.transition.event.clock_reset",
  "rules.transition.reading.move_irreversibility.last_of_role": "rules.transition.event.last_of_role",
  "rules.transition.reading.move_irreversibility.pawn_break": "rules.transition.event.pawn_contact",
} as const);

function consumers(id: string): readonly string[] {
  return Object.freeze(manifest.bindings
    .filter((binding) => binding.projection.id === id)
    .map((binding) => binding.consumer.id)
    .sort());
}

function census(rows: readonly ResearchRow[]) {
  const positions = [...new Set(rows.map((row) => row.fen))];
  const structuralCounts = new Map<string, number>();
  const structuralWidths: number[] = [];
  for (const fen of positions) {
    const features = structuralReading(fen).features;
    structuralWidths.push(features.length);
    for (const feature of features) structuralCounts.set(feature.kind, (structuralCounts.get(feature.kind) ?? 0) + 1);
  }
  const transitionCounts = new Map<string, number>();
  const transitionWidths: number[] = [];
  for (const row of rows) {
    const reading = transitionReading(row.parentFen, row.uci, row.fen);
    const observations = reading?.observations ?? [];
    transitionWidths.push(observations.length);
    for (const observation of observations) {
      const key = observation.kind === "move_irreversibility" ? `${observation.kind}.${observation.subkind}` : `${observation.kind}.${observation.direction}`;
      transitionCounts.set(key, (transitionCounts.get(key) ?? 0) + 1);
    }
  }
  const widths = (values: readonly number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return { mean: Number((sorted.reduce((sum, value) => sum + value, 0) / sorted.length).toFixed(2)), median: sorted[Math.floor(sorted.length / 2)] ?? 0, max: sorted.at(-1) ?? 0 };
  };
  return {
    positions: positions.length,
    decisions: rows.length,
    structuralWidths: widths(structuralWidths),
    structuralCounts: Object.fromEntries([...structuralCounts].sort()),
    transitionWidths: widths(transitionWidths),
    transitionCounts: Object.fromEntries([...transitionCounts].sort()),
  };
}

describe("D1726 closed source/successor inventory", () => {
  it("accounts for every legacy structural and transition reading exactly once", () => {
    expect(STRUCTURAL_SUCCESSORS.map((row) => row.family)).toEqual([...STRUCTURAL_FEATURE_KINDS]);
    expect(Object.keys(TRANSITION_SUCCESSORS)).toEqual([...TRANSITION_READING_PROJECTION_IDS]);
    const projections = new Set(manifest.projections.map((projection) => projection.id));
    for (const row of STRUCTURAL_SUCCESSORS) for (const successor of row.successors) expect(projections.has(successor), successor).toBe(true);
    for (const successor of Object.values(TRANSITION_SUCCESSORS)) expect(projections.has(successor), successor).toBe(true);
  });

  it("proves legacy readings are live while their richer successors stop earlier", () => {
    const emittedLegacy = STRUCTURAL_SUCCESSORS.filter((row) => row.disposition !== "retired");
    expect(emittedLegacy).toHaveLength(17);
    for (const row of emittedLegacy) {
      const ids = consumers(`rules.structural.reading.${row.family}`);
      expect(ids).toContain("inspector.position_structure");
      expect(ids).toContain("board.selected_square_sight");
    }
    for (const id of TRANSITION_READING_PROJECTION_IDS) expect(consumers(id)).toEqual(["inspector.move_transition"]);

    const richer = [...new Set(STRUCTURAL_SUCCESSORS.flatMap((row) => row.successors))];
    expect(richer).toHaveLength(8);
    expect(richer.every((id) => consumers(id).length === 0)).toBe(true);
    const transitionConsumers = new Set(Object.values(TRANSITION_SUCCESSORS).flatMap((id) => consumers(id)));
    expect(transitionConsumers).toEqual(new Set(["research.semantic_selection"]));
  });
});

describe("D1726 live surface and returned-module inversion", () => {
  it("pins the current raw-reading surface and absence of a module registry", () => {
    const screen = readFileSync(resolve(ROOT, "apps/web/src/lib/DrillScreen.svelte"), "utf8");
    expect(screen).toContain("positionStructureEvidence(rawStructure)");
    expect(screen).toContain("moveTransitionEvidence(reading)");
    expect(screen).toContain("{renderStructuralObservation(observation)}");
    expect(screen).toContain("{renderTransitionObservation(observation)}");
    expect(screen).not.toContain("MODULE_DECLARATIONS");
  });

  it("shows the returned ordinary-sight table prefers legacy counts over richer exact records", () => {
    const draft = readFileSync(resolve(ROOT, "rfc/module-registration.md"), "utf8");
    const sight = draft.match(/\| `module\.sight_on_request` \|.*\| 22 \|/u)?.[0] ?? "";
    const full = draft.match(/\| `module\.full_inspector` \|.*\| 40 \|/u)?.[0] ?? "";
    expect(sight).toContain("the 17 `rules.structural.reading.*` kinds");
    expect(sight).toContain("`rules.square.reading.control`");
    expect(sight).not.toContain("`rules.mobility.reading.piece_destinations`");
    expect(sight).not.toContain("`rules.king.reading.zone_state`");
    expect(sight).not.toContain("`derived.material.reading.role_signature`");
    expect(full).toContain("`rules.mobility.reading.piece_destinations`");
    expect(full).toContain("`derived.material.reading.role_signature`");
    expect(full).toContain("`rules.king.reading.zone_state`");
  });

  it("reproduces the split named-structure payload under one projection identity", () => {
    const reading = authoredRows().map((row) => structuralReading(row.fen)).find((value) => value.structures.length > 0)!;
    const structure = reading.structures[0]!;
    const observation = reading.features.find((value) => value.kind === "named_structure")!;
    expect(structure).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), provenanceNote: expect.any(String) }));
    expect(observation).toEqual({ kind: "named_structure", squares: [], provenanceNote: structure.provenanceNote });
    const projection = manifest.projections.find((value) => value.id === "rules.structural.reading.named_structure")!;
    expect(projection.operands).toEqual(["provenanceNote"]);
  });
});

describe("D1726 fixed-population impact", () => {
  it("retains the frozen authored/imported receipt", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as { readonly schema: string; readonly authored: ReturnType<typeof census>; readonly imported: ReturnType<typeof census> };
    expect(baseline.schema).toBe("tabiya.research.d1726-evidence-successor.v1");
    expect(baseline.authored).toEqual(census(authoredRows()));
    expect(baseline.imported).toEqual(census(importedRows()));
  });

  it("recomputes raw reading volumes when explicitly requested", () => {
    if (process.env.D1726_CENSUS !== "1") return;
    console.log(JSON.stringify({
      schema: "tabiya.research.d1726-evidence-successor.v1",
      authored: census(authoredRows()),
      imported: census(importedRows()),
    }));
  }, 120_000);
});
