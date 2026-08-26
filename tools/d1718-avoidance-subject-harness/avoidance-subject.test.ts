// DISPOSABLE research harness — D1718. Not production code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  loosePieceSemanticEvents,
  pawnIslandSemanticEvents,
  selectLocalSemanticEvidence,
  structuralSemanticEvents,
  type SemanticEvidenceEvent,
} from "@chess-tabiya/runtime";

import { authoredRows, importedRows } from "../research-chess/populations.js";

const BASELINE = new URL("./baseline.json", import.meta.url).pathname;
const AVOIDANCE_IDS = Object.freeze([...AVOIDANCE_EVENT_PROJECTION_IDS, "derived.semantic_avoidance.loose_piece", "derived.semantic_avoidance.pawn_islands"]);
const SUBJECT_GRAMMAR = Object.freeze({
  "derived.semantic_avoidance.backward_pawn": "file_state",
  "derived.semantic_avoidance.doubled_pawn": "file_state",
  "derived.semantic_avoidance.half_open_file": "file_state",
  "derived.semantic_avoidance.isolated_pawn": "file_state",
  "derived.semantic_avoidance.open_file": "file_state",
  "derived.semantic_avoidance.king_opposition": "king_pair_relation",
  "derived.semantic_avoidance.king_zone": "king_state",
  "derived.semantic_avoidance.line_blockers": "root_slider_ray",
  "derived.semantic_avoidance.passed_pawn": "root_pawn_state",
  "derived.semantic_avoidance.piece_count": "color_role_measure",
  "derived.semantic_avoidance.direct_attack_count": "fixed_square_measure",
  "derived.semantic_avoidance.loose_piece": "root_piece_state",
  "derived.semantic_avoidance.pawn_islands": "color_measure",
} as const);

interface Counter {
  selected: number;
  playedChildFamilySurvives: number;
  playedChildAlternativeSubjectSurvives: number;
  signs: Record<string, number>;
  examples: { row: string; moveUci: string; sign: string; numerator: number; denominator: number; familySurvives: boolean; subjectSurvives: boolean }[];
}

function sourceEvents(beforeFen: string, moveUci: string, afterFen: string, sourceId: string): readonly SemanticEvidenceEvent[] {
  if (sourceId === "rules.structural.event.pawn_islands") return pawnIslandSemanticEvents(beforeFen, moveUci, afterFen);
  if (sourceId === "rules.tactic.event.loose_piece") return loosePieceSemanticEvents(beforeFen, moveUci, afterFen) ?? [];
  return structuralSemanticEvents(beforeFen, moveUci, afterFen);
}

function rayDirection(from: string, to: string): string {
  const df = Math.sign(to.charCodeAt(0) - from.charCodeAt(0));
  const dr = Math.sign(Number(to[1]) - Number(from[1]));
  return `${df},${dr}`;
}

function conditionKey(event: SemanticEvidenceEvent, state: "outcome" | "child"): string | undefined {
  const value = event.operands as Record<string, unknown>;
  if (event.projection.id === "rules.structural.event.pawn_islands") return JSON.stringify({ family: "pawn_islands", color: value.color });
  if (event.projection.id === "rules.tactic.event.loose_piece") {
    const mover = value.mover as { readonly color: string; readonly before: { readonly square: string; readonly role: string } };
    if (state === "child" && !(value.after as { readonly enPrise: boolean }).enPrise) return undefined;
    return JSON.stringify({ family: "loose_piece", color: mover.color, rootSquare: mover.before.square, role: mover.before.role });
  }
  const observation = (state === "child" ? value.after : event.sign === "lost" ? value.before : value.after) as Record<string, unknown> | null;
  if (observation === null) return undefined;
  const family = String(observation.kind);
  if (["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "open_file"].includes(family)) return JSON.stringify({ family, color: observation.color, file: observation.file });
  if (family === "king_opposition") return JSON.stringify({ family, kings: "white:black", color: observation.color, form: observation.form });
  if (family === "king_zone") return JSON.stringify({ family, color: observation.color, zone: observation.zone });
  if (family === "piece_count") return JSON.stringify({ family, color: observation.color, role: observation.role });
  if (family === "direct_attack_count") return JSON.stringify({ family, color: observation.color, square: (observation.squares as string[])[0] });
  if (family === "passed_pawn") {
    const square = (observation.squares as string[])[0]!;
    const rootSquare = observation === value.after && square === event.anchor.moveUci.slice(2, 4) ? event.anchor.moveUci.slice(0, 2) : square;
    return JSON.stringify({ family, color: observation.color, rootSquare });
  }
  if (family === "line_blockers") {
    const [sliderSquare, endpoint] = observation.squares as [string, string];
    const rootSquare = observation === value.after && sliderSquare === event.anchor.moveUci.slice(2, 4) ? event.anchor.moveUci.slice(0, 2) : sliderSquare;
    return JSON.stringify({ family, rootSquare, direction: rayDirection(sliderSquare, endpoint) });
  }
  throw new TypeError(`D1718 has no condition key for ${family}`);
}

function childConditionSubjectKey(event: SemanticEvidenceEvent): string | undefined {
  return conditionKey(event, "child");
}

function playedChildSubjectKeys(events: readonly SemanticEvidenceEvent[]): ReadonlySet<string> {
  return new Set(events.flatMap((event) => {
    const key = childConditionSubjectKey(event);
    return key === undefined ? [] : [key];
  }));
}

function fresh(): Counter {
  return { selected: 0, playedChildFamilySurvives: 0, playedChildAlternativeSubjectSurvives: 0, signs: {}, examples: [] };
}

function census() {
  const populations = [["authored", authoredRows()], ["imported", importedRows()]] as const;
  const report: Record<string, { decisions: number; avoided: number; families: Record<string, Counter> }> = {};
  for (const [population, rows] of populations) {
    const families = Object.fromEntries(AVOIDANCE_IDS.map((id) => [id, fresh()])) as Record<string, Counter>;
    let avoided = 0;
    for (const row of rows) {
      const result = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: row.parentFen, moveUci: row.uci, afterFen: row.fen });
      for (const fact of result.selected) {
        if (fact.kind !== "counterfactual_absence") continue;
        avoided += 1;
        const id = fact.event.projection.id;
        const counter = families[id]!;
        const sourceId = fact.event.operands.family.projection.id;
        const sign = fact.event.operands.family.sign;
        const played = sourceEvents(row.parentFen, row.uci, row.fen, sourceId).filter((event) => event.projection.id === sourceId);
        const keys = playedChildSubjectKeys(played);
        const familySurvives = keys.size > 0;
        const subjectSurvives = fact.event.operands.alternativeEvents.some((event) => keys.has(conditionKey(event, "outcome")!));
        counter.selected += 1;
        counter.playedChildFamilySurvives += Number(familySurvives);
        counter.playedChildAlternativeSubjectSurvives += Number(subjectSurvives);
        counter.signs[sign] = (counter.signs[sign] ?? 0) + 1;
        if (counter.examples.length < 3) counter.examples.push({ row: row.id, moveUci: row.uci, sign, numerator: fact.event.operands.alternativesWithFamily, denominator: fact.event.operands.legalAlternatives, familySurvives, subjectSurvives });
      }
    }
    report[population] = { decisions: rows.length, avoided, families };
  }
  return { schema: "tabiya.research.d1718-avoidance-subject.v1", subjectGrammar: SUBJECT_GRAMMAR, populations: report };
}

describe("D1718 avoidance subject identity", () => {
  it("keeps the subject grammar set-equal with all thirteen avoidance projections", () => {
    expect(Object.keys(SUBJECT_GRAMMAR).sort()).toEqual([...AVOIDANCE_IDS].sort());
    expect(new Set(Object.values(SUBJECT_GRAMMAR))).toEqual(new Set(["file_state", "king_pair_relation", "king_state", "root_slider_ray", "root_pawn_state", "color_role_measure", "fixed_square_measure", "root_piece_state", "color_measure"]));
  });

  it("distinguishes family survival on another subject from survival of the avoided subject", () => {
    const row = authoredRows().find((candidate) => candidate.id === "trajectory-qgd-exchange-minority/p37-ab5");
    expect(row).toBeDefined();
    const result = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: row!.parentFen, moveUci: row!.uci, afterFen: row!.fen });
    const fact = result.selected.find((candidate) => candidate.kind === "counterfactual_absence" && candidate.event.projection.id === "derived.semantic_avoidance.isolated_pawn");
    expect(fact?.kind).toBe("counterfactual_absence");
    if (fact?.kind !== "counterfactual_absence") return;
    const played = structuralSemanticEvents(row!.parentFen, row!.uci, row!.fen).filter((event) => event.projection.id === "rules.structural.event.isolated_pawn");
    const playedChildKeys = playedChildSubjectKeys(played);
    expect(playedChildKeys.size).toBeGreaterThan(0);
    expect(fact.event.operands.alternativeEvents.some((event) => playedChildKeys.has(conditionKey(event, "outcome")!))).toBe(false);
  });

  it("pins a same-edge family/sign group containing twelve distinct subjects", () => {
    const beforeFen = "rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4";
    const afterFen = "rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4";
    const values = structuralSemanticEvents(beforeFen, "d4c5", afterFen).filter((event) => event.projection.id === "rules.structural.event.direct_attack_count" && event.sign === "preserved");
    expect(values).toHaveLength(12);
    expect(new Set(values.map((event) => conditionKey(event, "outcome"))).size).toBe(12);
  });

  it("retains a frozen full-census receipt", () => {
    const value = JSON.parse(readFileSync(BASELINE, "utf8")) as { readonly schema: string; readonly subjectGrammar: Record<string, string>; readonly populations: Record<string, { readonly decisions: number; readonly avoided: number; readonly families: Record<string, Omit<Counter, "examples">> }> };
    expect(value.schema).toBe("tabiya.research.d1718-avoidance-subject.v1");
    expect(value.subjectGrammar).toEqual(SUBJECT_GRAMMAR);
    expect(value.populations.authored?.decisions).toBe(754);
    expect(value.populations.imported?.decisions).toBe(579);
    for (const population of Object.values(value.populations)) {
      expect(Object.keys(population.families).sort()).toEqual([...AVOIDANCE_IDS].sort());
      expect(Object.values(population.families).reduce((sum, counter) => sum + counter.selected, 0)).toBe(population.avoided);
      for (const counter of Object.values(population.families)) {
        expect(counter.playedChildAlternativeSubjectSurvives).toBeLessThanOrEqual(counter.playedChildFamilySurvives);
        expect(counter.playedChildFamilySurvives).toBeLessThanOrEqual(counter.selected);
        expect(Object.values(counter.signs).reduce((sum, count) => sum + count, 0)).toBe(counter.selected);
      }
    }
    expect(value.populations.authored!.avoided + value.populations.imported!.avoided).toBe(790);
    expect(Object.values(value.populations.authored!.families).reduce((sum, counter) => sum + counter.playedChildFamilySurvives - counter.playedChildAlternativeSubjectSurvives, 0)
      + Object.values(value.populations.imported!.families).reduce((sum, counter) => sum + counter.playedChildFamilySurvives - counter.playedChildAlternativeSubjectSurvives, 0)).toBe(36);
  });

  it("recomputes the full census when explicitly requested", () => {
    if (process.env.D1718_CENSUS !== "1") return;
    const report = census();
    console.log(JSON.stringify({
      schema: report.schema,
      populations: Object.fromEntries(Object.entries(report.populations).map(([population, value]) => [population, {
        decisions: value.decisions,
        avoided: value.avoided,
        families: Object.fromEntries(Object.entries(value.families).filter(([, counter]) => counter.selected > 0).map(([id, counter]) => [id, {
          selected: counter.selected,
          playedChildFamilySurvives: counter.playedChildFamilySurvives,
          playedChildAlternativeSubjectSurvives: counter.playedChildAlternativeSubjectSurvives,
          signs: counter.signs,
          example: counter.examples[0],
        }])),
      }])),
    }));
  });
});
