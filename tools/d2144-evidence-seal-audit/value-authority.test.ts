// DISPOSABLE research harness — D2144. This proves the shipped boundary; it is not a repair.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  STRUCTURAL_PREDICATE_PROJECTION_IDS,
  STRUCTURAL_READING_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
  TRANSITION_READING_PROJECTION_IDS,
  castlingRights,
  declareCastlingRightsEvidence,
  declareCastlingRightsLostEvidence,
  declareLoosePieceEvidence,
  declareMaterialRoleReadingEvidence,
  declarePawnContactsEvidence,
  declareSquareControlReadingEvidence,
  evidenceForConsumer,
  loosePieceReading,
  materialRoleSignatureReading,
  pawnContactsReading,
  squareControlReading,
  type DeclaredEvidence,
} from "@chess-tabiya/runtime";

const ROOT = new URL("../../", import.meta.url);
const adapters = readFileSync(new URL("packages/runtime/src/evidence-source-adapters.ts", ROOT), "utf8");
const barrel = readFileSync(new URL("packages/runtime/src/index.ts", ROOT), "utf8");

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const LOOSE = "4k3/8/8/8/8/8/4q3/4R1K1 w - - 0 1";

function acceptingConsumers(value: DeclaredEvidence<unknown>): readonly string[] {
  return PRIMARY_EVIDENCE_MANIFEST.consumers.flatMap((consumer) => {
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, [value]);
    return view.items.length === 0 ? [] : [`${consumer.id}@${consumer.version}`];
  });
}

const RULES_POSITION_EXACT_REVIEW = Object.freeze([
  { projection: "rules.castling.event.rights_lost", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.castling.reading.legality", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.castling.reading.rights", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.endgame.reading", authority: "multi_authority_projection", action: "split_projection" },
  { projection: "rules.phase.reading", authority: "product_classification", action: "reclassify_declared_convention" },
  { projection: "rules.pivotal.marker", authority: "multi_authority_projection", action: "split_projection" },
  { projection: "rules.square.event.control", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.square.reading.control", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.structural.event.pawn_islands", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.structural.predicate.result", authority: "multi_authority_projection", action: "split_projection" },
  { projection: "rules.structural.reading.named_structure", authority: "product_classification", action: "reclassify_declared_convention" },
  { projection: "rules.structural.reading.pawn_connectivity", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.consequence.forced_mate_after_move", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.consequence.mate_in_one", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.consequence.reply_breadth", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.event.check", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.event.defender_duty_relocated", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.event.defender_removed", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.reading.defender_duty_set", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.reading.rook_on_seventh", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
] as const);

const SPECIALIZED_MINT_ROUTES = Object.freeze([
  { operation: "declarePackPhaseEvidence", projections: ["pack.authored.phase"] },
  { operation: "declareMaiaCandidateWdlEvidence", projections: ["human.maia.candidate_wdl"] },
  { operation: "declareExactLegalMovesEvidence", projections: ["rules.mobility.reading.legal_moves"] },
  { operation: "declarePawnContactsEvidence", projections: ["rules.pawn.reading.contacts"] },
  { operation: "declareStructuralReadingSourceEvidence", projections: STRUCTURAL_READING_PROJECTION_IDS.filter((id) => id !== "rules.structural.reading.pawn_count") },
  { operation: "declareTransitionReadingSourceEvidence", projections: TRANSITION_READING_PROJECTION_IDS },
  { operation: "declareStructuralPredicateFeatureEvidence", projections: STRUCTURAL_PREDICATE_PROJECTION_IDS },
  { operation: "declareOpponentProviderEvidence", projections: ["human.maia.uci_response", "live.stockfish.uci_response", "live.syzygy.probe_result"] },
  { operation: "declareLivePacketEvidence", projections: ["human.maia.event", "live.syzygy.result", "live.stockfish.eval", "live.stockfish.wdl", "live.stockfish.pv"] },
  { operation: "declareSourcingRecordEvidence", projections: ["sourcing.ledger.engine_eval", "sourcing.ledger.tablebase_result", "sourcing.ledger.explorer_position_census", "theory.opening_identity.record"] },
  { operation: "declareCompareDerivedEvidence", projections: ["derived.compare.engine_trajectory", "derived.compare.structure_delta", "derived.compare.piece_route", "derived.compare.eval_delta"] },
  { operation: "declareRunRecordEvidence", projections: ["run.record.fork", "run.record.move", "run.record.checkpoint_hit", "run.record.objective_transition", "run.record.consequence", "run.record.imported_result"] },
  { operation: "declareStoryDerivedEvidence", projections: ["derived.story.eval_shift", "derived.story.last_level", "derived.story.rank", "derived.story.title"] },
  { operation: "declareStructuralSemanticSourceEvidence", projections: STRUCTURAL_EVENT_PROJECTION_IDS },
  { operation: "declareTransitionSemanticSourceEvidence", projections: TRANSITION_EVENT_PROJECTION_IDS },
  { operation: "declareAvoidanceEvidence", projections: [...AVOIDANCE_EVENT_PROJECTION_IDS, "derived.semantic_avoidance.loose_piece", "derived.semantic_avoidance.pawn_islands"] },
] as const);

describe("D2144 declared-evidence value authority", () => {
  it("exposes seventy-five public shape-only object adapters", () => {
    const rows = [...adapters.matchAll(/export const (declare[A-Za-z]+) = <T extends object>\(payload: T\) => exactObject\("[^"]+", "([^"]+)"/gu)]
      .map((match) => ({ name: match[1]!, projection: match[2]! }));
    expect(rows).toHaveLength(75);
    for (const row of rows) expect(barrel, row.name).toContain(row.name);

    const declarations = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [projection.id, projection]));
    const summary = Object.fromEntries([...Map.groupBy(rows, (row) => {
      const projection = declarations.get(row.projection)!;
      return `${projection.plane}/${projection.grounding}/${projection.exactness}`;
    })].map(([key, values]) => [key, values.length]).sort(([left], [right]) => left.localeCompare(right)));
    expect(summary).toMatchInlineSnapshot(`
      {
        "authored/authored_claim/authored": 3,
        "derived/declared_convention/convention": 13,
        "derived/declared_convention/exact": 1,
        "derived/position_rules/exact": 5,
        "derived/recorded_run/convention": 2,
        "derived/recorded_run/exact": 2,
        "human/human_corpus/measured": 2,
        "human/human_model/measured": 2,
        "record/declared_convention/convention": 1,
        "rules/declared_convention/convention": 17,
        "rules/position_rules/exact": 20,
        "search/bounded_search/measured": 2,
        "search/tablebase_exact/exact": 4,
        "theory/authored_claim/authored": 1,
      }
    `);

    const bound = rows.filter((row) => PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === row.projection));
    const boundSummary = Object.fromEntries([...Map.groupBy(bound, (row) => {
      const projection = declarations.get(row.projection)!;
      return `${projection.plane}/${projection.grounding}/${projection.exactness}`;
    })].map(([key, values]) => [key, values.length]).sort(([left], [right]) => left.localeCompare(right)));
    expect({ total: bound.length, byClass: boundSummary }).toMatchInlineSnapshot(`
      {
        "byClass": {
          "authored/authored_claim/authored": 3,
          "derived/declared_convention/convention": 11,
          "derived/declared_convention/exact": 1,
          "derived/position_rules/exact": 3,
          "derived/recorded_run/convention": 2,
          "derived/recorded_run/exact": 2,
          "human/human_corpus/measured": 2,
          "human/human_model/measured": 2,
          "record/declared_convention/convention": 1,
          "rules/declared_convention/convention": 5,
          "rules/position_rules/exact": 12,
          "search/bounded_search/measured": 2,
          "search/tablebase_exact/exact": 4,
          "theory/authored_claim/authored": 1,
        },
        "total": 51,
      }
    `);
    expect(bound.filter((row) => {
      const projection = declarations.get(row.projection)!;
      return projection.grounding === "position_rules" && projection.exactness === "exact";
    }).map((row) => row.projection).sort()).toMatchInlineSnapshot(`
      [
        "derived.activity.event.open_file_occupancy",
        "derived.material.event.role_asymmetry",
        "derived.pawn.event.transitions",
        "rules.castling.event.rights_lost",
        "rules.endgame.reading",
        "rules.phase.reading",
        "rules.pivotal.marker",
        "rules.square.event.control",
        "rules.structural.event.pawn_islands",
        "rules.structural.predicate.result",
        "rules.structural.reading.named_structure",
        "rules.tactic.consequence.reply_breadth",
        "rules.tactic.event.check",
        "rules.tactic.event.defender_duty_relocated",
        "rules.tactic.event.defender_removed",
      ]
    `);
    expect(rows.filter((row) => {
      const projection = declarations.get(row.projection)!;
      return projection.plane === "rules" && projection.grounding === "position_rules" && projection.exactness === "exact";
    }).map((row) => row.projection).sort()).toMatchInlineSnapshot(`
      [
        "rules.castling.event.rights_lost",
        "rules.castling.reading.legality",
        "rules.castling.reading.rights",
        "rules.endgame.reading",
        "rules.phase.reading",
        "rules.pivotal.marker",
        "rules.square.event.control",
        "rules.square.reading.control",
        "rules.structural.event.pawn_islands",
        "rules.structural.predicate.result",
        "rules.structural.reading.named_structure",
        "rules.structural.reading.pawn_connectivity",
        "rules.tactic.consequence.forced_mate_after_move",
        "rules.tactic.consequence.mate_in_one",
        "rules.tactic.consequence.reply_breadth",
        "rules.tactic.event.check",
        "rules.tactic.event.defender_duty_relocated",
        "rules.tactic.event.defender_removed",
        "rules.tactic.reading.defender_duty_set",
        "rules.tactic.reading.rook_on_seventh",
      ]
    `);

    const reviewedPopulation = RULES_POSITION_EXACT_REVIEW.map((row) => row.projection).sort();
    const livePopulation = rows.filter((row) => {
      const projection = declarations.get(row.projection)!;
      return projection.plane === "rules" && projection.grounding === "position_rules" && projection.exactness === "exact";
    }).map((row) => row.projection).sort();
    expect(reviewedPopulation).toEqual(livePopulation);
    expect(Object.fromEntries([...Map.groupBy(RULES_POSITION_EXACT_REVIEW, (row) => row.authority)]
      .map(([key, values]) => [key, values.length])
      .sort(([left], [right]) => left.localeCompare(right)))).toMatchInlineSnapshot(`
      {
        "literal_rule_total": 9,
        "multi_authority_projection": 3,
        "product_classification": 2,
        "rule_computation_with_direct_convention": 6,
      }
    `);
    expect(RULES_POSITION_EXACT_REVIEW.filter((row) => PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === row.projection))
      .map((row) => row.projection).sort()).toMatchInlineSnapshot(`
      [
        "rules.castling.event.rights_lost",
        "rules.endgame.reading",
        "rules.phase.reading",
        "rules.pivotal.marker",
        "rules.square.event.control",
        "rules.structural.event.pawn_islands",
        "rules.structural.predicate.result",
        "rules.structural.reading.named_structure",
        "rules.tactic.consequence.reply_breadth",
        "rules.tactic.event.check",
        "rules.tactic.event.defender_duty_relocated",
        "rules.tactic.event.defender_removed",
      ]
    `);
  });

  it("seals false same-key position readings whose current protection is zero consumer reach", () => {
    const rights = castlingRights(INITIAL);
    const control = squareControlReading(INITIAL);
    const material = materialRoleSignatureReading(INITIAL);
    const loose = loosePieceReading(LOOSE);
    expect(loose.pieces.length).toBeGreaterThan(0);

    const forged = [
      declareCastlingRightsEvidence({ ...rights, white: { ...rights.white, kingside: false } }),
      declareSquareControlReadingEvidence({ ...control, colors: [] }),
      declareMaterialRoleReadingEvidence({ ...material, magnitude: 99 }),
      declareLoosePieceEvidence({ ...loose, pieces: loose.pieces.map((row, index) => index === 0 ? { ...row, loose: !row.loose } : row) }),
    ] as readonly DeclaredEvidence<unknown>[];

    for (const evidence of forged) expect(acceptingConsumers(evidence), evidence.projection.id).toEqual([]);
  });

  it("seals an impossible same-key transition event without consulting either position", () => {
    const evidence = declareCastlingRightsLostEvidence({
      beforeFen: INITIAL,
      moveUci: "e2e4",
      afterFen: INITIAL,
      color: "white",
      wing: "kingside",
      cause: "rook_captured",
    });
    expect(evidence.payload).toMatchObject({ moveUci: "e2e4", cause: "rook_captured" });
    expect(acceptingConsumers(evidence)).toEqual(["research.semantic_selection@1"]);
  });

  it("keeps the repaired pawn-contact adapter as a working negative control", () => {
    const contacts = pawnContactsReading("8/1p6/8/8/8/8/P7/4K2k w - - 0 1");
    expect(() => declarePawnContactsEvidence({ ...contacts, passed: contacts.passed.map((row) => ({ ...row, passed: !row.passed })) })).toThrow(/does not equal the exact pawn-contact authority/u);
  });

  it("censuses every production mint route rather than equating generic adapters with the boundary", () => {
    const generic = [...adapters.matchAll(/export const (declare[A-Za-z]+) = <T extends object>\(payload: T\) => exactObject\("[^"]+", "([^"]+)"/gu)]
      .map((match) => ({ operation: match[1]!, projection: match[2]! }));
    const specialized = SPECIALIZED_MINT_ROUTES.flatMap((route) => route.projections.map((projection) => ({ operation: route.operation, projection })));
    const routes = [...generic, ...specialized];
    expect({ generic: generic.length, specialized: specialized.length, total: routes.length }).toMatchInlineSnapshot(`
      {
        "generic": 75,
        "specialized": 116,
        "total": 191,
      }
    `);

    const byProjection = Map.groupBy(routes, (route) => route.projection);
    expect([...byProjection].filter(([, values]) => values.length > 1).map(([projection, values]) => ({ projection, operations: values.map((value) => value.operation).sort() })).sort((left, right) => left.projection.localeCompare(right.projection))).toMatchInlineSnapshot(`
      [
        {
          "operations": [
            "declareLivePacketEvidence",
            "declareMaiaEventEvidence",
          ],
          "projection": "human.maia.event",
        },
        {
          "operations": [
            "declareLivePacketEvidence",
            "declareStockfishEvalEvidence",
          ],
          "projection": "live.stockfish.eval",
        },
        {
          "operations": [
            "declareLivePacketEvidence",
            "declareSyzygyResultEvidence",
          ],
          "projection": "live.syzygy.result",
        },
        {
          "operations": [
            "declareNamedStructureEvidence",
            "declareStructuralReadingSourceEvidence",
          ],
          "projection": "rules.structural.reading.named_structure",
        },
      ]
    `);
    expect(byProjection.size).toBe(187);

    const manifestIds = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => projection.id));
    expect([...byProjection.keys()].filter((projection) => !manifestIds.has(projection)).sort()).toEqual([]);
    expect([...manifestIds].filter((projection) => !byProjection.has(projection)).sort().map((projection) => {
      const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === projection)!;
      return {
        projection,
        disposition: declaration.disposition?.kind ?? "ordinary",
        bindings: PRIMARY_EVIDENCE_MANIFEST.bindings.filter((binding) => binding.projection.id === projection).map((binding) => binding.consumer.id).sort(),
      };
    })).toMatchInlineSnapshot(`
      [
        {
          "bindings": [],
          "disposition": "experimental",
          "projection": "derived.grade.move_quality",
        },
        {
          "bindings": [],
          "disposition": "inspector_only",
          "projection": "derived.opening.deepest_reached",
        },
        {
          "bindings": [],
          "disposition": "retired",
          "projection": "rules.structural.reading.pawn_count",
        },
        {
          "bindings": [],
          "disposition": "inspector_only",
          "projection": "run.record.position",
        },
        {
          "bindings": [],
          "disposition": "inspector_only",
          "projection": "theory.opening.catalogue_membership",
        },
        {
          "bindings": [],
          "disposition": "inspector_only",
          "projection": "theory.opening.current_endpoint",
        },
      ]
    `);
  });
});
