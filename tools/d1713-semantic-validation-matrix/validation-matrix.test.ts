// DISPOSABLE research harness — D1713. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { SEMANTIC_EVENT_PROJECTION_IDS } from "@chess-tabiya/runtime";

const ROOT = resolve(import.meta.dirname, "../..");

type Level = "event_emitter" | "source_predicate" | "composition" | "population_observation" | "external_disagreement";
interface Authority { readonly path: string; readonly test: string; readonly level: Level }
interface Coverage {
  readonly positive: readonly Authority[];
  readonly semanticNegative: readonly Authority[];
  readonly orientation: readonly Authority[];
  readonly counterfactual: readonly Authority[];
  readonly imported: readonly Authority[];
  readonly externalLabel: readonly Authority[];
}

const a = (path: string, test: string, level: Level): Authority => Object.freeze({ path, test, level });
const runtime = (test: string) => a("packages/runtime/src/semantic-evidence.test.ts", test, "event_emitter");
const breadth = (test: string, level: Level = "event_emitter") => a("packages/runtime/src/breadth-semantic.test.ts", test, level);
const anchors = (test: string, level: Level = "event_emitter") => a("packages/runtime/src/semantic-tactics.test.ts", test, level);
const sequences = (test: string, level: Level = "event_emitter") => a("packages/runtime/src/semantic-tactic-sequences.test.ts", test, level);
const d872 = (file: string, test: string, level: Level) => a(`tools/d872-semantic-tactics-harness/${file}`, test, level);
const d1714 = (test: string, level: Level) => a("tools/d1714-authority-empty-harness/authority-empty.test.ts", test, level);

const POSITIVE: Readonly<Record<string, readonly Authority[]>> = Object.freeze({
  "rules.structural.event.piece_count": [runtime("emits identity-preserving structural relations while leaving raw readings independent")],
  "rules.structural.event.line_blockers": [d1714("pins five legal positives through the local emitter boundary", "event_emitter")],
  "rules.structural.event.pawn_islands": [runtime("emits pawn-island and mover-relative loose-piece events through the compiled path")],
  "rules.transition.event.castled": [runtime("emits castling, promotion and checkmate exact positives")],
  "rules.transition.event.clock_reset": [runtime("emits independent transition properties without priority suppression")],
  "rules.transition.event.last_of_role": [runtime("emits independent transition properties without priority suppression")],
  "rules.transition.event.pawn_contact": [runtime("emits independent transition properties without priority suppression")],
  "rules.transition.event.checkmate": [runtime("emits castling, promotion and checkmate exact positives")],
  "rules.transition.event.promotion": [runtime("emits castling, promotion and checkmate exact positives")],
  "rules.transition.event.capture": [runtime("seals an immediate capture-recapture trade over both capture and recorded-move anchors")],
  "rules.transition.event.piece_escape": [d1714("pins five legal positives through the local emitter boundary", "event_emitter")],
  "rules.transition.event.developed": [d1714("pins five legal positives through the local emitter boundary", "event_emitter")],
  "rules.tactic.event.double_attack": [runtime("emits exact reply/check and exchange-filtered double-attack events from their real producers")],
  "rules.tactic.consequence.reply_breadth": [runtime("emits exact reply/check and exchange-filtered double-attack events from their real producers")],
  "rules.tactic.event.check": [runtime("emits exact reply/check and exchange-filtered double-attack events from their real producers")],
  "rules.tactic.event.loose_piece": [runtime("emits pawn-island and mover-relative loose-piece events through the compiled path")],
  "rules.castling.event.rights_lost": [runtime("emits permanent castling-right loss separately from transient legality")],
  "derived.exchange.capture_class": [runtime("seals capture class as a derivation of the exact capture and exchange evidence")],
  "derived.exchange.trade_completed": [runtime("seals an immediate capture-recapture trade over both capture and recorded-move anchors")],
  "derived.tactic.discovered_executed": [runtime("emits discovered execution only when the exact before-state relation and gained ray agree")],
  "rules.square.event.control": [breadth("routes one-edge breadth facts through the compiled semantic-event authority")],
  "rules.mobility.event.piece_destinations": [breadth("routes one-edge breadth facts through the compiled semantic-event authority")],
  "derived.pawn.sequence.contact_timing": [breadth("seals a retained contact sequence only with the required recorded-move evidence")],
  "derived.pawn.event.transitions": [d1714("pins five legal positives through the local emitter boundary", "event_emitter")],
  "derived.pawn.sequence.harassment_pressure": [d1714("reaches the two isolated sequence constructors from real predicate outputs", "event_emitter")],
  "derived.tactic.defender_exposure": [breadth("routes one-edge breadth facts through the compiled semantic-event authority")],
  "derived.tactic.sequence.defender_consequence": [d1714("reaches the two isolated sequence constructors from real predicate outputs", "event_emitter")],
  "derived.material.event.role_asymmetry": [breadth("retains promotion-only and capture-promotion authorities for material-role events")],
  "rules.king.event.zone_state": [breadth("routes one-edge breadth facts through the compiled semantic-event authority")],
  "derived.activity.event.open_file_occupancy": [breadth("routes one-edge breadth facts through the compiled semantic-event authority")],
  "derived.king.captured_zone_defender": [d1714("pins five legal positives through the local emitter boundary", "event_emitter")],
  "rules.tactic.event.defender_removed": [anchors("joins defender removal to the exact capture and retained target")],
  "rules.tactic.event.defender_duty_relocated": [anchors("distinguishes a same-piece relocation that loses its duty")],
  "derived.tactic.deflection_observed": [sequences("requires defender displacement and a later positive target capture")],
  "derived.tactic.attraction_observed": [sequences("restricts attraction to the retained king/queen/rook consequence")],
  "derived.tactic.line_blocker_clearance_observed": [sequences("keeps ray clearance and square clearance as distinct observed events")],
  "derived.tactic.square_clearance_observed": [sequences("keeps ray clearance and square clearance as distinct observed events")],
  "derived.tactic.interference_observed": [sequences("retains the broken slider duty for interference")],
  "derived.tactic.overload_exploitation_observed": [sequences("requires more than one retained duty for observed overload exploitation")],
});

const NEGATIVE: Readonly<Record<string, readonly Authority[]>> = Object.freeze({
  "rules.transition.event.castled": [runtime("emits castling, promotion and checkmate exact positives")],
  "rules.transition.event.checkmate": [runtime("emits castling, promotion and checkmate exact positives")],
  "rules.transition.event.promotion": [runtime("emits castling, promotion and checkmate exact positives")],
  "rules.tactic.event.double_attack": [runtime("emits exact reply/check and exchange-filtered double-attack events from their real producers")],
  "derived.exchange.trade_completed": [runtime("seals an immediate capture-recapture trade over both capture and recorded-move anchors")],
  "rules.structural.event.line_blockers": [d1714("reaches nearby legal local-emitter negatives without corrupting an operand", "event_emitter")],
  "rules.transition.event.piece_escape": [d1714("reaches nearby legal local-emitter negatives without corrupting an operand", "event_emitter")],
  "rules.transition.event.developed": [d1714("reaches nearby legal local-emitter negatives without corrupting an operand", "event_emitter")],
  "derived.pawn.event.transitions": [d1714("checks an explicit pawn-transition positive and a quiet negative through breadth emission", "event_emitter")],
  "derived.pawn.sequence.harassment_pressure": [d1714("reaches the two isolated sequence constructors from real predicate outputs", "source_predicate")],
  "derived.tactic.sequence.defender_consequence": [d1714("reaches the two isolated sequence constructors from real predicate outputs", "source_predicate")],
  "derived.king.captured_zone_defender": [d1714("reaches nearby legal local-emitter negatives without corrupting an operand", "event_emitter")],
  "derived.tactic.defender_exposure": [breadth("requires both an exact lost enemy defence edge and a positive local capture", "source_predicate")],
  "derived.activity.event.open_file_occupancy": [breadth("requires the heavy piece itself to move from a closed source file onto a declared open file", "source_predicate")],
  "rules.tactic.event.defender_removed": [anchors("joins defender removal to the exact capture and retained target", "source_predicate")],
  "rules.tactic.event.defender_duty_relocated": [anchors("distinguishes a same-piece relocation that loses its duty", "source_predicate")],
  "derived.tactic.deflection_observed": [sequences("requires defender displacement and a later positive target capture", "source_predicate")],
  "derived.tactic.attraction_observed": [sequences("restricts attraction to the retained king/queen/rook consequence", "source_predicate")],
  "derived.tactic.line_blocker_clearance_observed": [sequences("keeps ray clearance and square clearance as distinct observed events", "source_predicate")],
  "derived.tactic.square_clearance_observed": [sequences("keeps ray clearance and square clearance as distinct observed events", "source_predicate")],
  "derived.tactic.interference_observed": [sequences("retains the broken slider duty for interference", "source_predicate")],
  "derived.tactic.overload_exploitation_observed": [sequences("requires more than one retained duty for observed overload exploitation", "source_predicate")],
  "derived.tactic.check_zwischenzug_observed": [d872("sequence.test.ts", "admits a check zwischenzug while rejecting a merely delayed recapture", "source_predicate")],
});

const ORIENTATION: Readonly<Record<string, readonly Authority[]>> = Object.freeze({
  "rules.structural.event.king_opposition": [a("packages/runtime/src/structure.test.ts", "pins opposition gaps, alignment, occupancy, mover, colour, and mirrors", "source_predicate")],
  "rules.square.event.control": [a("packages/runtime/src/square-control.test.ts", "emits exact gained and lost controller edges with color mirrors", "source_predicate")],
  "rules.pawn.event.dynamics": [a("packages/runtime/src/pawn-dynamics.test.ts", "pins the candidate-majority orientation and equality boundary", "source_predicate")],
  "derived.tactic.discovered_executed": [a("packages/runtime/src/tactics.test.ts", "requires the before-state latency identity and the exact gained ray for discovered execution", "source_predicate")],
});

const COUNTERFACTUAL: Readonly<Record<string, readonly Authority[]>> = Object.freeze({
  "derived.semantic_avoidance.open_file": [a("packages/runtime/src/semantic-evidence.test.ts", "constructs avoided only from a complete retained numerator and denominator", "composition")],
  "derived.semantic_avoidance.loose_piece": [a("packages/runtime/src/semantic-evidence.test.ts", "constructs loose-piece avoidance through the same complete-population path", "composition")],
  "rules.tactic.consequence.reply_breadth": [runtime("emits exact reply/check and exchange-filtered double-attack events from their real producers")],
  "rules.tactic.event.defender_removed": [d872("counterfactual.test.ts", "pins a named target that survives every reply and one that can escape", "source_predicate")],
  "derived.tactic.line_blocker_clearance_observed": [d872("counterfactual.test.ts", "measures how often played initiations support an all-reply live claim", "source_predicate")],
  "derived.tactic.interference_observed": [d872("counterfactual.test.ts", "measures how often played initiations support an all-reply live claim", "source_predicate")],
});

const EXTERNAL: Readonly<Record<string, readonly Authority[]>> = Object.freeze({
  "rules.tactic.event.defender_removed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.deflection_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.attraction_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.line_blocker_clearance_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.square_clearance_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.interference_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.check_zwischenzug_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
  "derived.tactic.overload_exploitation_observed": [d872("agreement.test.ts", "measures tag sensitivity and a deterministic tag-negative control separately", "external_disagreement")],
});

function importedAuthorities(): Readonly<Record<string, readonly Authority[]>> {
  const baseline = JSON.parse(readFileSync(resolve(ROOT, "tools/r2-selection-harness/f2-baseline.json"), "utf8")) as {
    readonly populations: readonly { readonly name: string; readonly projections: Readonly<Record<string, number>> }[];
  };
  const imported = baseline.populations.find((population) => population.name === "imported")!;
  return Object.freeze(Object.fromEntries(Object.keys(imported.projections).map((key) => [
    key.replace(/@1:.+$/u, ""),
    [a("tools/r2-selection-harness/f2-baseline.json", key, "population_observation")],
  ])));
}

const IMPORTED = importedAuthorities();
const maps = [POSITIVE, NEGATIVE, ORIENTATION, COUNTERFACTUAL, IMPORTED, EXTERNAL] as const;
const coverage = Object.freeze(SEMANTIC_EVENT_PROJECTION_IDS.map((projection): { readonly projection: string; readonly coverage: Coverage } => ({
  projection,
  coverage: Object.freeze({
    positive: POSITIVE[projection] ?? [],
    semanticNegative: NEGATIVE[projection] ?? [],
    orientation: ORIENTATION[projection] ?? [],
    counterfactual: COUNTERFACTUAL[projection] ?? [],
    imported: IMPORTED[projection] ?? [],
    externalLabel: EXTERNAL[projection] ?? [],
  }),
})));

describe("D1713 exact semantic-validation migration matrix", () => {
  it("is set-equal to the independent 67-event root inventory", () => {
    expect(coverage).toHaveLength(67);
    expect(new Set(coverage.map((row) => row.projection))).toEqual(new Set(SEMANTIC_EVENT_PROJECTION_IDS));
    for (const map of maps) expect(Object.keys(map).every((id) => SEMANTIC_EVENT_PROJECTION_IDS.includes(id))).toBe(true);
  });

  it("binds every claimed test-case authority to current source text", () => {
    for (const row of coverage) for (const arm of Object.values(row.coverage)) for (const authority of arm) {
      const text = readFileSync(resolve(ROOT, authority.path), "utf8");
      expect(text, `${row.projection}: ${authority.path}`).toContain(authority.test);
    }
  });

  it("publishes event-level, lower-layer, population and external coverage without conflating them", () => {
    const armCount = (arm: keyof Coverage, level?: Level) => coverage.filter((row) =>
      row.coverage[arm].some((authority) => level === undefined || authority.level === level),
    ).length;
    const noEventPositive = coverage.filter((row) => !row.coverage.positive.some((authority) => authority.level === "event_emitter"));
    const noEventNegative = coverage.filter((row) => !row.coverage.semanticNegative.some((authority) => authority.level === "event_emitter"));
    const report = {
      counts: {
        events: coverage.length,
        eventPositive: armCount("positive", "event_emitter"),
        eventSemanticNegative: armCount("semanticNegative", "event_emitter"),
        sourceOnlyNegative: coverage.filter((row) => row.coverage.semanticNegative.some((authority) => authority.level === "source_predicate") && !row.coverage.semanticNegative.some((authority) => authority.level === "event_emitter")).length,
        orientationAnyLayer: armCount("orientation"),
        orientationAtEvent: armCount("orientation", "event_emitter"),
        counterfactualAnyLayer: armCount("counterfactual"),
        counterfactualAtEvent: armCount("counterfactual", "event_emitter"),
        importedObserved: armCount("imported", "population_observation"),
        externalCompared: armCount("externalLabel", "external_disagreement"),
        withNoAuthorityAtAll: coverage.filter((row) => Object.values(row.coverage).every((arm) => arm.length === 0)).length,
      },
      noEventPositive: noEventPositive.map((row) => row.projection),
      noEventSemanticNegative: noEventNegative.map((row) => row.projection),
      noAuthorityAtAll: coverage.filter((row) => Object.values(row.coverage).every((arm) => arm.length === 0)).map((row) => row.projection),
    };
    console.log(JSON.stringify(report));
    expect(report.counts.events).toBe(67);
  });
});
