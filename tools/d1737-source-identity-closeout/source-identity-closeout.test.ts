// DISPOSABLE research harness — D1737. No production behavior is exercised or changed here.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  EVIDENCE_PRODUCER_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  SEMANTIC_EVENT_PROJECTION_IDS,
  STRUCTURAL_READING_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  TRANSITION_READING_PROJECTION_IDS,
} from "@chess-tabiya/runtime";

import {
  DOWNSTREAM_SOURCE_READERS,
  FOUNDATION_CAPABILITY_RECEIPTS,
  NONLANDED_EXECUTION_OWNERS,
  SOURCE_PROGRAM_HANDOFFS,
} from "./registry.js";

const ROOT = resolve(import.meta.dirname, "../..");
const WAVE = "planning/evidence-foundation-ux/foundation-source-repair-wave-2026-08-26.md";

const PRODUCER_DISPOSITIONS = Object.freeze({
  "rules.structural": "mixed_versioned_repair",
  "rules.transition": "mixed_versioned_repair",
  "rules.castling": "current_source",
  "rules.exchange": "current_source",
  "rules.tactic": "current_source",
  "rules.square": "current_source_plus_specified_successors",
  "rules.mobility": "current_source",
  "rules.pawn": "current_source",
  "rules.king": "current_source",
  "rules.phase": "current_source",
  "rules.pivotal": "current_source",
  "rules.endgame": "current_source",
  "theory.shapes": "current_source",
  "authored.structural_condition": "current_source",
  "pack.authored": "current_source",
  "recorded.engine": "current_source",
  "recorded.tablebase": "current_source",
  "live.stockfish": "shared_receipt_repair",
  "live.syzygy": "shared_receipt_repair",
  "human.maia": "shared_receipt_repair",
  "human.explorer": "shared_receipt_repair",
  "theory.opening_identity": "current_source",
  "theory.opening.runtime": "current_source",
  "run.record": "current_source",
  "derived.compare_narrative": "derived_reader",
  "derived.story": "derived_reader",
  "derived.opening": "derived_reader",
  "derived.grade": "derived_reader",
  "derived.exchange": "derived_reader",
  "derived.tactic": "derived_reader",
  "derived.pawn": "derived_reader_with_specified_successors",
  "derived.material": "derived_reader",
  "derived.king": "derived_reader",
  "derived.activity": "derived_reader_with_specified_successors",
  "derived.opponent": "derived_reader",
  "sourcing.ledger": "current_source",
  "derived.semantic_avoidance": "mixed_versioned_repair",
} as const);

describe("D1737 compiled evidence source closure", () => {
  it("keeps every compiled producer root under an explicit source/derivation disposition", () => {
    expect(Object.keys(PRODUCER_DISPOSITIONS).sort()).toEqual([...EVIDENCE_PRODUCER_IDS].sort());
    expect(PRIMARY_EVIDENCE_MANIFEST.producers).toHaveLength(37);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections).toHaveLength(193);
  });

  it("composes the existing set-equal projection receipts rather than replacing them", () => {
    expect(STRUCTURAL_FEATURE_KINDS).toHaveLength(18);
    expect(STRUCTURAL_READING_PROJECTION_IDS).toHaveLength(18);
    expect(TRANSITION_READING_PROJECTION_IDS).toHaveLength(14);
    expect(TACTICAL_COLLECTOR_PROJECTION_IDS).toHaveLength(30);
    expect(BREADTH_COLLECTOR_PROJECTION_IDS).toHaveLength(18);
    expect(SEMANTIC_EVENT_PROJECTION_IDS).toHaveLength(67);
    const projections = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((item) => item.id));
    for (const id of [...STRUCTURAL_READING_PROJECTION_IDS, ...TRANSITION_READING_PROJECTION_IDS, ...TACTICAL_COLLECTOR_PROJECTION_IDS, ...BREADTH_COLLECTOR_PROJECTION_IDS, ...SEMANTIC_EVENT_PROJECTION_IDS]) {
      expect(projections.has(id), id).toBe(true);
    }
  });
});

describe("D1737 declared 1.0 foundation basis", () => {
  it("assigns every capability one closed research authority and one honest production state", () => {
    expect(FOUNDATION_CAPABILITY_RECEIPTS).toHaveLength(30);
    expect(new Set(FOUNDATION_CAPABILITY_RECEIPTS.map((item) => item.id)).size).toBe(FOUNDATION_CAPABILITY_RECEIPTS.length);
    for (const receipt of FOUNDATION_CAPABILITY_RECEIPTS) {
      expect(existsSync(resolve(ROOT, receipt.authority)), `${receipt.id}: ${receipt.authority}`).toBe(true);
      expect(receipt.boundary.length).toBeGreaterThan(20);
    }
    expect(FOUNDATION_CAPABILITY_RECEIPTS.filter((item) => item.production === "landed_source")).toHaveLength(14);
    expect(FOUNDATION_CAPABILITY_RECEIPTS.filter((item) => item.production === "versioned_repair_required")).toHaveLength(7);
    expect(FOUNDATION_CAPABILITY_RECEIPTS.filter((item) => item.production === "specified_source_not_landed")).toHaveLength(9);
  });

  it("assigns exactly one living execution owner to all sixteen non-landed source families", () => {
    const nonLanded = FOUNDATION_CAPABILITY_RECEIPTS
      .filter((item) => item.production !== "landed_source")
      .map((item) => item.id)
      .sort();
    expect(Object.keys(NONLANDED_EXECUTION_OWNERS).sort()).toEqual(nonLanded);
    expect(nonLanded).toHaveLength(16);
    for (const owner of Object.values(NONLANDED_EXECUTION_OWNERS)) {
      expect(existsSync(resolve(ROOT, owner)), owner).toBe(true);
    }
    expect(Object.values(NONLANDED_EXECUTION_OWNERS).filter((owner) => owner === WAVE)).toHaveLength(12);
  });

  it("keeps the source-repair wave set-equal to all sixteen program handoffs and its two downstream readers", () => {
    const discovered = readdirSync(resolve(ROOT, "planning/evidence-foundation-ux"))
      .filter((name) => /author-(?:repair|handoff)-2026-08-26\.md$/u.test(name))
      .map((name) => `planning/evidence-foundation-ux/${name}`)
      .sort();
    expect(discovered).toEqual([...SOURCE_PROGRAM_HANDOFFS].sort());

    const wave = readFileSync(resolve(ROOT, WAVE), "utf8");
    for (const path of [...SOURCE_PROGRAM_HANDOFFS, ...DOWNSTREAM_SOURCE_READERS]) {
      expect(existsSync(resolve(ROOT, path)), path).toBe(true);
      expect(wave.split(path).length - 1, path).toBe(1);
    }
  });
});
