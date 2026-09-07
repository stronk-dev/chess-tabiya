// DISPOSABLE research harness — D1865. Not production code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";
import {
  AUTHOR_MODULE_ACCEPTS,
  WAVE_C_MODULE_PROJECTION_IDS,
} from "../d2120-module-registration-author-contract/module-plan-fixture.js";

const observedSemanticTactics = SEMANTIC_WAVE_EVENT_PROJECTION_IDS.filter((id) => id.startsWith("derived.tactic."));
const MODULE_ACCEPTS = AUTHOR_MODULE_ACCEPTS;

const ASSEMBLY_STAGE_BY_PRODUCER = Object.freeze({
  "rules.structural": "position_local",
  "rules.transition": "edge_local",
  "rules.castling": "position_or_edge_local",
  "rules.exchange": "edge_local",
  "rules.tactic": "position_or_edge_local",
  "rules.square": "position_or_edge_local",
  "rules.mobility": "position_or_edge_local",
  "rules.pawn": "position_or_edge_local",
  "rules.king": "position_or_edge_local",
  "rules.phase": "position_local",
  "rules.pivotal": "run_local",
  "rules.endgame": "position_local",
  "theory.shapes": "catalogue_local",
  "pack.authored": "pack_local",
  "recorded.engine": "recorded_local",
  "recorded.tablebase": "recorded_local",
  "live.stockfish": "provider_optional",
  "live.syzygy": "provider_optional",
  "human.maia": "provider_optional",
  "human.explorer": "provider_optional",
  "theory.opening_identity": "catalogue_local",
  "theory.opening.runtime": "catalogue_local",
  "run.record": "run_local",
  "derived.compare_narrative": "derived_after_inputs",
  "derived.story": "derived_after_inputs",
  "derived.grade": "derived_after_inputs",
  "derived.exchange": "derived_after_inputs",
  "derived.tactic": "derived_after_inputs",
  "derived.pawn": "derived_after_inputs",
  "derived.material": "derived_after_inputs",
  "derived.king": "derived_after_inputs",
  "derived.activity": "derived_after_inputs",
  "derived.semantic_avoidance": "derived_after_inputs",
  "derived.opening": "derived_after_inputs",
} as const);

const projectionById = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [projection.id, projection]));
const pairs = Object.entries(MODULE_ACCEPTS).flatMap(([module, projections]) => projections.map((projection) => ({ module, projection })));
const PAWN_SAFE_SQUARE_PAIR = Object.freeze({ module: "sight_on_request", projection: "rules.structural.reading.pawn_safe_square" });
const semanticConsumerContract = Object.freeze({
  postcommit_nudge: Object.freeze({ timing: "postcommit", forms: Object.freeze(["list", "panel", "lit_squares", "arrows"]) }),
  review_map: Object.freeze({ timing: "review", forms: Object.freeze(["list", "panel", "lit_squares", "arrows"]) }),
  full_inspector: Object.freeze({ timing: "review", forms: Object.freeze(["list", "panel", "lit_squares", "arrows"]) }),
});

describe("D1865 complete non-hint module assembly closure", () => {
  it("shares one exact module acceptance image with the D2120 author plan", () => {
    expect(MODULE_ACCEPTS).toEqual(AUTHOR_MODULE_ACCEPTS);
  });

  it("reconciles the dependency image to exactly 231 declared consumer/projection pairs", () => {
    expect(Object.fromEntries(Object.entries(MODULE_ACCEPTS).map(([module, projections]) => [module, projections.length]))).toEqual({
      sight_on_request: 23,
      blunder_prevention: 3,
      threat_radar: 7,
      postcommit_nudge: 52,
      structure_nudge: 6,
      theory_breadcrumb: 4,
      guided_hint: 0,
      compare_coach: 8,
      review_map: 66,
      full_inspector: 62,
    });
    expect(pairs).toHaveLength(231);
  });

  it("includes the owner-ruled pawn-safe-square pair without widening any other module", () => {
    expect(pairs).toContainEqual(PAWN_SAFE_SQUARE_PAIR);
    expect(pairs.filter(({ projection }) => projection === PAWN_SAFE_SQUARE_PAIR.projection)).toEqual([PAWN_SAFE_SQUARE_PAIR]);
  });

  it("names every absent projection instead of silently shrinking the declaration", () => {
    expect(pairs.filter(({ projection }) => !projectionById.has(projection))).toEqual([
      { module: "theory_breadcrumb", projection: "derived.explorer.population_summary" },
      { module: "full_inspector", projection: "pack.authored.classifier" },
    ]);
  });

  it("assigns every compiled pair to one explicit assembly stage", () => {
    const unknown = pairs.flatMap(({ module, projection }) => {
      const producerId = projectionById.get(projection)?.producer.id;
      return producerId === undefined || producerId in ASSEMBLY_STAGE_BY_PRODUCER ? [] : [{ module, projection, producerId }];
    });
    expect(unknown).toEqual([]);
    const histogram = pairs.reduce<Record<string, number>>((counts, { projection }) => {
      const producerId = projectionById.get(projection)?.producer.id;
      const stage = producerId === undefined ? "awaiting" : ASSEMBLY_STAGE_BY_PRODUCER[producerId as keyof typeof ASSEMBLY_STAGE_BY_PRODUCER];
      counts[stage] = (counts[stage] ?? 0) + 1;
      return counts;
    }, {});
    expect(histogram).toEqual({
      position_local: 46,
      position_or_edge_local: 50,
      derived_after_inputs: 79,
      edge_local: 24,
      catalogue_local: 5,
      pack_local: 1,
      awaiting: 2,
      run_local: 9,
      recorded_local: 4,
      provider_optional: 11,
    });
  });

  it("binds all twelve Wave-C projections to Inspector and only observed motifs to Nudge and Review", () => {
    expect(observedSemanticTactics).toEqual([
      "derived.tactic.deflection_observed",
      "derived.tactic.attraction_observed",
      "derived.tactic.line_blocker_clearance_observed",
      "derived.tactic.square_clearance_observed",
      "derived.tactic.interference_observed",
      "derived.tactic.check_zwischenzug_observed",
      "derived.tactic.overload_exploitation_observed",
    ]);
    const semanticPairs = pairs.filter(({ projection }) => observedSemanticTactics.includes(projection as typeof observedSemanticTactics[number]));
    expect(semanticPairs).toHaveLength(21);
    expect(new Set(semanticPairs.map(({ module }) => module))).toEqual(new Set(Object.keys(semanticConsumerContract)));
    expect(WAVE_C_MODULE_PROJECTION_IDS).toHaveLength(12);
    for (const projection of WAVE_C_MODULE_PROJECTION_IDS) {
      expect(pairs).toContainEqual({ module: "full_inspector", projection });
    }
    const inspectorOnly = WAVE_C_MODULE_PROJECTION_IDS.filter((projection) => !observedSemanticTactics.includes(projection as typeof observedSemanticTactics[number]));
    expect(inspectorOnly).toHaveLength(5);
    expect(pairs.filter(({ projection }) => inspectorOnly.includes(projection as typeof inspectorOnly[number])))
      .toEqual(inspectorOnly.map((projection) => ({ module: "full_inspector", projection })));

    for (const [module, contract] of Object.entries(semanticConsumerContract)) {
      for (const projectionId of observedSemanticTactics) {
        expect(semanticPairs).toContainEqual({ module, projection: projectionId });
        const projection = projectionById.get(projectionId)!;
        expect(projection.answerContent).toEqual(["fact"]);
        expect(projection.abstention.possible).toBe(true);
        expect(projection.abstention.reasons).toContain("input_abstained");
        expect(contract.forms.every((form) => projection.forms.includes(form))).toBe(true);
      }
      expect(contract.timing).toMatch(/^(postcommit|review)$/u);
    }
    expect(new Set(semanticPairs.map(({ module, projection }) => `${module}\0${projection}`)).size).toBe(21);
  });

  it("uses runtime opening identity and refuses the authoring-only record", () => {
    expect(MODULE_ACCEPTS.theory_breadcrumb).toContain("theory.opening.current_endpoint");
    expect(MODULE_ACCEPTS.theory_breadcrumb).not.toContain("theory.opening_identity.record");
    expect(projectionById.get("theory.opening.current_endpoint")?.producer.id).toBe("theory.opening.runtime");
    expect(projectionById.get("theory.opening_identity.record")?.limitations).toContain("Authoring provenance only at F1; not a runtime guidance sentence.");
  });

  it("proves the existing guidance packet is a partial assembler, not the module source", () => {
    const guidance = readFileSync(new URL("../../apps/server/src/guidance.ts", import.meta.url), "utf8");
    expect(guidance).toContain("export function evidencePacket");
    expect(guidance).not.toContain("localSemanticEvents(");
    expect(guidance).not.toContain("candidateFeatureVector(");
    expect(guidance).not.toContain("comparisonEngineTrajectory(");
    expect(guidance).not.toContain("storyDeclaredEvidence(");
    expect(guidance).not.toMatch(/StockfishSupervisor|MaiaSupervisor|LichessTablebaseSource|ExplorerClient/u);
  });

  it("keeps Guided Hint out until its measured family-by-rung disclosure registry exists", () => {
    const allProjectionIds = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => projection.id));
    expect([...allProjectionIds].filter((id) => id.startsWith("derived.hint.disclosure."))).toEqual([]);
  });

  it("binds the author-amended module RFC to the reconciled 231-pair image", () => {
    const rfc = readFileSync(new URL("../../rfc/module-registration.md", import.meta.url), "utf8");
    const accepts = rfc.match(/#### 1\.3 `accepts`[\s\S]*?#### 1\.4/u)?.[0] ?? "";
    expect(accepts).toContain("declared **`231 + R`**, compiled **`229 + R`**, and declared-awaiting **2**");
    expect(accepts).toContain("`theory.opening.current_endpoint`");
    expect(accepts).not.toContain("`theory.opening_identity.record` | 4");
    expect(accepts).toContain("all seven `SEMANTIC_WAVE_EVENT_PROJECTION_IDS`");
    expect(accepts).toContain("all seven observed semantic-tactic projections");
    expect(accepts).toContain("five Wave-C Inspector-only rows");
    expect(accepts).toContain("owner-ruled `pawn_safe_square`");
    expect(accepts).toContain("owner-ruled `outpost`");
  });

  it("derives the exact accepted projections whose landing disposition must be removed", () => {
    const acceptedProjectionIds = new Set(pairs.map(({ projection }) => projection));
    const acceptedWithDisposition = PRIMARY_EVIDENCE_MANIFEST.projections
      .filter((projection) => acceptedProjectionIds.has(projection.id) && projection.disposition !== undefined)
      .map((projection) => projection.id)
      .sort();
    expect(acceptedWithDisposition).toEqual([
      "derived.grade.move_quality",
      "derived.material.reading.role_signature",
      "derived.opening.deepest_reached",
      "derived.tactic.fork_survives_reply",
      "derived.tactic.overloaded_defender_response_conflict",
      "derived.tactic.promotion_pressure",
      "human.maia.candidate_wdl",
      "rules.castling.reading.legality",
      "rules.castling.reading.rights",
      "rules.king.reading.zone_state",
      "rules.mobility.reading.legal_moves",
      "rules.mobility.reading.piece_destinations",
      "rules.pawn.reading.candidate_majority",
      "rules.pawn.reading.contacts",
      "rules.phase.development",
      "rules.square.reading.control",
      "rules.structural.reading.pawn_connectivity",
      "rules.structural.reading.space",
      "rules.tactic.consequence.forced_mate_after_move",
      "rules.tactic.consequence.mate_in_one",
      "rules.tactic.consequence.threat",
      "rules.tactic.reading.back_rank",
      "rules.tactic.reading.defender_duty_set",
      "rules.tactic.reading.discovered_latency",
      "rules.tactic.reading.loose_piece",
      "rules.tactic.reading.ray_classification",
      "rules.tactic.reading.rook_on_seventh",
      "rules.tactic.reading.trapped_piece",
      "theory.opening.catalogue_membership",
      "theory.opening.current_endpoint",
    ]);
  });

  it("derives each module's exact compiled answer-content union", () => {
    const answerUnion = Object.fromEntries(Object.entries(MODULE_ACCEPTS).map(([module, projections]) => [
      module,
      [...new Set(projections.flatMap((projection) => projectionById.get(projection)?.answerContent ?? []))].sort(),
    ]));
    expect(answerUnion).toEqual({
      sight_on_request: ["candidate_moves", "fact", "pattern"],
      blunder_prevention: ["fact", "threat"],
      threat_radar: ["fact", "pattern", "threat"],
      postcommit_nudge: ["evaluation", "fact", "threat"],
      structure_nudge: ["fact", "pattern", "plan", "theory"],
      theory_breadcrumb: ["fact", "pattern", "plan", "principle", "theory"],
      guided_hint: [],
      compare_coach: ["evaluation", "fact", "move"],
      review_map: ["evaluation", "fact", "theory", "threat"],
      full_inspector: ["candidate_moves", "evaluation", "fact", "move", "pattern", "plan", "principal_variation", "theory", "threat"],
    });
  });

  it("derives the unique compiled projection population the assembler must execute", () => {
    const compiled = [...new Set(pairs.map(({ projection }) => projection).filter((projection) => projectionById.has(projection)))].sort();
    expect(compiled).toHaveLength(132);
  });
});
