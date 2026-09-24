import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { STRUCTURAL_FEATURE_KINDS, TRANSITION_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";

import { RULES_EVIDENCE_FACTS } from "./evidence-ref.js";
import {
  BREADTH_COLLECTOR_PROJECTION_IDS,
  BREADTH_CONVENTION_TEXT,
  CURRENT_CONSUMER_OPERATION_IDS,
  EVIDENCE_CONSUMER_IDS,
  MODULE_CONSUMER_IDS,
  EVIDENCE_CONTRACT_DECLARATIONS,
  EVIDENCE_PRODUCER_IDS,
  EVIDENCE_PRODUCERS,
  SEMANTIC_EVENT_FAMILY_IDS,
  SEMANTIC_EVENT_PROJECTION_REFS,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  STRUCTURAL_PREDICATE_PROJECTION_IDS,
  STRUCTURAL_READING_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  TRANSITION_READING_PROJECTION_IDS,
} from "./evidence-catalog.js";
import { compileEvidenceManifest } from "./evidence-contract.js";
import { EvidenceManifestError } from "./evidence-contract.js";

const ROOT = new URL("../../../", import.meta.url);
const EXPECTED_PRODUCERS = Object.freeze(["rules.structural", "rules.transition", "rules.castling", "rules.exchange", "rules.tactic", "rules.square", "rules.mobility", "rules.pawn", "rules.king", "rules.phase", "rules.pivotal", "derived.pivotal", "rules.endgame", "theory.endgame", "theory.shapes", "authored.structural_condition", "derived.structural", "pack.authored", "recorded.engine", "recorded.tablebase", "live.stockfish", "live.syzygy", "human.maia", "human.explorer", "theory.opening_identity", "theory.opening.runtime", "run.record", "derived.compare_narrative", "derived.story", "derived.opening", "derived.grade", "derived.exchange", "derived.tactic", "derived.pawn", "derived.material", "derived.king", "derived.activity", "derived.opponent", "sourcing.ledger", "derived.semantic_avoidance"]);
const ref = (id: string) => ({ id, version: 1 } as const);

function jsonFiles(url: URL): readonly URL[] {
  return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    return entry.isDirectory() ? jsonFiles(child) : entry.isFile() && entry.name.endsWith(".json") ? [child] : [];
  });
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

describe("primary evidence catalogue", () => {
  it("compiles all audited producer paths and current consumer operations", () => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    expect(EVIDENCE_PRODUCER_IDS).toEqual(EXPECTED_PRODUCERS);
    expect(EVIDENCE_PRODUCERS.map((item) => item.id)).toEqual(EXPECTED_PRODUCERS);
    expect(CURRENT_CONSUMER_OPERATION_IDS).toHaveLength(23);
    // rfc/module-registration.md §2.2: nine module consumers join (rules_floor has no evidence; guided_hint is blocked).
    expect(MODULE_CONSUMER_IDS).toHaveLength(9);
    expect(EVIDENCE_CONSUMER_IDS).toEqual([...CURRENT_CONSUMER_OPERATION_IDS, ...MODULE_CONSUMER_IDS, "assistance.arrows", "research.semantic_selection"]);
    expect(manifest.consumers.find((item) => item.id === "assistance.arrows")?.disposition).toEqual(expect.objectContaining({ kind: "experimental" }));
    // 258 module pairs = the post-successor-rebase 237 plus the 21 recorded-path v2 successors.
    expect(manifest.bindings.filter((binding) => binding.consumer.id.startsWith("module."))).toHaveLength(258);
    expect([manifest.producers.length, manifest.projections.length, manifest.consumers.length, manifest.bindings.length]).toEqual([40, 222, 34, 501]); // +6 provider-exchange sources (rfc/provider-exchange-and-execution.md §§5–9)
    expect([manifest.semanticEvents.length, manifest.eligibility.length, manifest.reasons.length, manifest.selectionPolicies.length]).toEqual([78, 78, 15, 1]);
    const exact = (value: { readonly id: string; readonly version: number }) => `${value.id}@${value.version}`;
    expect(manifest.semanticEvents.map((item) => exact(item.projection)).sort()).toEqual(SEMANTIC_EVENT_PROJECTION_REFS.map(exact).sort());
    // Semantic eligibility stays the single research authority, byte-identical (§2.2, [[D1854]]).
    expect(new Set(manifest.eligibility.map((item) => `${item.consumer.id}@${item.consumer.version}`))).toEqual(new Set(["research.semantic_selection@1"]));
    const semanticKeys = new Set(SEMANTIC_EVENT_PROJECTION_REFS.map(exact));
    expect(manifest.bindings.filter((binding) => semanticKeys.has(exact(binding.projection))).every((binding) => binding.consumer.id === "research.semantic_selection" || binding.consumer.id.startsWith("module."))).toBe(true);
    expect(manifest.digest).toBe(createHash("sha256").update(canonical({ producers: manifest.producers, projections: manifest.projections, consumers: manifest.consumers, bindings: manifest.bindings, semanticEvents: manifest.semanticEvents, eligibility: manifest.eligibility, reasons: manifest.reasons, selectionPolicies: manifest.selectionPolicies })).digest("hex"));
  });

  it("retains reported confidence through every derivation member", () => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const projections = new Map(manifest.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));
    for (const output of manifest.projections) {
      const members = output.derivation === undefined
        ? []
        : "inputs" in output.derivation
          ? [output.derivation.inputs]
          : output.derivation.anyOf;
      for (const member of members) {
        const hasReportedInput = member.some((input) => projections.get(`${input.id}@${input.version}`)?.confidence === "reported");
        if (hasReportedInput) expect(output.confidence, output.id).toBe("reported");
      }
    }
  });

  it("binds the three runtime opening facts to their module homes and keeps the recorded position internal", () => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const ids = ["theory.opening.current_endpoint", "theory.opening.catalogue_membership", "run.record.position", "derived.opening.deepest_reached"];
    const projections = ids.map((id) => manifest.projections.find((projection) => projection.id === id));
    expect(projections.every((projection) => projection?.exactness === "exact")).toBe(true);
    const consumersOf = (id: string) => manifest.bindings.filter((binding) => binding.projection.id === id).map((binding) => binding.consumer.id).sort();
    // runtime-opening-identity D1: endpoint → Theory Breadcrumb; membership → Inspector; deepest → Review + Inspector.
    expect(consumersOf("theory.opening.current_endpoint")).toEqual(["module.theory_breadcrumb"]);
    expect(consumersOf("theory.opening.catalogue_membership")).toEqual(["module.full_inspector"]);
    expect(consumersOf("derived.opening.deepest_reached")).toEqual(["module.full_inspector", "module.review_map"]);
    expect(projections[2]?.disposition?.kind).toBe("inspector_only");
    expect(consumersOf("run.record.position")).toEqual([]);
    expect(projections[3]?.derivation).toEqual({ inputs: [{ id: "theory.opening.current_endpoint", version: 1 }, { id: "run.record.position", version: 1 }] });
  });

  it("registers move quality as an evaluation-only derived projection bound to exactly its two module consumers", () => {
    const grade = EVIDENCE_PRODUCERS.find((item) => item.id === "derived.grade")?.outputs[0];
    expect(grade).toMatchObject({
      id: "derived.grade.move_quality", version: 1, grounding: "bounded_search",
      exactness: "convention", answerContent: ["evaluation"],
    });
    // rfc/move-quality-grades.md D1: the experimental disposition lifted when the consumers compiled.
    expect(grade?.disposition).toBeUndefined();
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    expect(manifest.bindings.filter((binding) => binding.projection.id === "derived.grade.move_quality").map((binding) => binding.consumer.id).sort())
      .toEqual(["module.postcommit_nudge", "module.review_map"]);
    expect(grade?.derivation).toEqual({ anyOf: [
      [{ id: "recorded.engine.eval", version: 1 }],
      [{ id: "live.stockfish.eval", version: 1 }],
    ] });
    expect(grade?.derivation).not.toHaveProperty("inputs");
    expect(grade?.answerContent).not.toContain("move");
  });

  it("binds exact legal moves only to requested Sight and the explicit Inspector", () => {
    const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
    const projection = manifest.projections.find((item) => item.id === "rules.mobility.reading.legal_moves");
    expect(projection).toMatchObject({
      grounding: "position_rules",
      exactness: "exact",
      operands: ["fen", "turn", "pieces"],
      answerContent: ["fact", "candidate_moves"],
    });
    expect(projection?.disposition).toBeUndefined();
    // exact-legal-mobility D1: the `candidates` capability of requested Sight, never a proactive module.
    expect(manifest.bindings.filter((binding) => binding.projection.id === projection?.id).map((binding) => binding.consumer.id).sort())
      .toEqual(["module.full_inspector", "module.sight_on_request"]);
    const old = manifest.projections.find((item) => item.id === "rules.mobility.reading.piece_destinations");
    expect(old).toMatchObject({ grounding: "declared_convention", exactness: "convention" });
  });

  it("refuses a grade that gains move content or loses its declared inputs", () => {
    const mutateGrade = (change: Record<string, unknown>) => ({
      ...EVIDENCE_CONTRACT_DECLARATIONS,
      producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => producer.id !== "derived.grade" ? producer : {
        ...producer,
        outputs: producer.outputs.map((output) => output.id !== "derived.grade.move_quality" ? output : { ...output, ...change }),
      }),
    });
    expect(() => compileEvidenceManifest(mutateGrade({ answerContent: ["evaluation", "move"] }))).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_DERIVATION_WIDENS" }));
    expect(() => compileEvidenceManifest(mutateGrade({ derivation: { inputs: [] } }))).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_PROJECTION_INCOMPLETE" }));
  });

  it("keeps move-quality lanes alternative rather than requiring or mixing them", () => {
    const grade = EVIDENCE_PRODUCERS.find((item) => item.id === "derived.grade")?.outputs[0];
    expect(grade?.derivation).toEqual({ anyOf: [
      [{ id: "recorded.engine.eval", version: 1 }],
      [{ id: "live.stockfish.eval", version: 1 }],
    ] });
    expect(grade?.derivation).not.toEqual({ inputs: [
      { id: "recorded.engine.eval", version: 1 },
      { id: "live.stockfish.eval", version: 1 },
    ] });
  });

  it("registers the nine Wave-C events whose accepted derivations are buildable", () => {
    expect(SEMANTIC_WAVE_EVENT_PROJECTION_IDS).toEqual([
      "rules.tactic.event.defender_removed", "rules.tactic.event.defender_duty_relocated",
      "derived.tactic.deflection_observed", "derived.tactic.attraction_observed",
      "derived.tactic.line_blocker_clearance_observed", "derived.tactic.square_clearance_observed",
      "derived.tactic.interference_observed", "derived.tactic.check_zwischenzug_observed",
      "derived.tactic.overload_exploitation_observed",
    ]);
    const projections = new Set(EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs.map((output) => output.id)));
    expect(["derived.pawn.promotion_race_geometry", "derived.pawn.promotion_race_tablebase"].every((id) => !projections.has(id))).toBe(true);
    expect(projections.has("rules.tactic.consequence.forced_mate_after_move")).toBe(true);
    const deflection = EVIDENCE_PRODUCERS.find((item) => item.id === "derived.tactic")?.outputs
      .find((item) => item.id === "derived.tactic.deflection_observed");
    expect(deflection?.derivation).toEqual({ anyOf: [
      [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")],
      [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange"), ref("rules.tactic.event.check")],
    ] });
  });

  it("separates all structural predicate and reading identities and pins the emission exception", () => {
    expect(STRUCTURAL_PREDICATE_PROJECTION_IDS.map((id) => id.split(".").at(-1))).toEqual([...STRUCTURAL_FEATURE_KINDS]);
    expect(STRUCTURAL_READING_PROJECTION_IDS.map((id) => id.split(".").at(-1))).toEqual([...STRUCTURAL_FEATURE_KINDS]);
    const outputs = EVIDENCE_PRODUCERS.find((item) => item.id === "rules.structural")!.outputs;
    expect(outputs.find((item) => item.id === "rules.structural.reading.pawn_count")?.disposition).toEqual(expect.objectContaining({ kind: "retired" }));
    expect(outputs.find((item) => item.id === "rules.structural.predicate.outpost")?.dependsOn).toEqual([{ id: "rules.structural.predicate.pawn_safe_square", version: 1 }]);
    expect(outputs.find((item) => item.id === "rules.structural.predicate.outpost")?.payloadType).toBe("StructuralFeaturePredicateResult");
    expect(outputs.find((item) => item.id === "rules.structural.predicate.result")?.dependsOn).toEqual([{ id: "authored.structural_condition.input", version: 1 }]);
    expect(EVIDENCE_PRODUCERS.find((item) => item.id === "authored.structural_condition")?.outputs.some((item) => item.id === "authored.structural_condition.input")).toBe(true);
  });

  it("covers every transition family with the fourteen independently witnessed lossy leaves", () => {
    expect(new Set(TRANSITION_READING_PROJECTION_IDS.map((id) => id.split(".").at(-2)))).toEqual(new Set(TRANSITION_FEATURE_KINDS));
    expect(TRANSITION_READING_PROJECTION_IDS).toHaveLength(14);
    const outputs = EVIDENCE_PRODUCERS.find((item) => item.id === "rules.transition")!.outputs.filter((item) => item.role === "reading");
    expect(outputs.every((item) => item.forms.includes("arrows") === false && item.limitations.some((line) => line.includes("not a semantic learner event")))).toBe(true);
  });

  it("keeps rules refs explicitly mapped to structural/transition projections", () => {
    const mapped = new Set([
      ...STRUCTURAL_FEATURE_KINDS.map((kind) => `structure-${kind.replaceAll("_", "-")}`),
      ...TRANSITION_FEATURE_KINDS.map((kind) => `transition-${kind.replaceAll("_", "-")}`),
    ]);
    expect(RULES_EVIDENCE_FACTS.filter((fact) => fact.startsWith("structure-") || fact.startsWith("transition-")).every((fact) => mapped.has(fact))).toBe(true);
  });

  it("walks outpost's transitive dependency to the current 23 expressions in three documents", () => {
    const documents = jsonFiles(new URL("content/shapes/", ROOT)).map((url) => readFileSync(url, "utf8"));
    const counts = documents.map((text) => [...text.matchAll(/"kind"\s*:\s*"outpost"/gu)].length);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(23);
    expect(counts.filter((count) => count > 0)).toHaveLength(3);
  });

  it("keeps all seven non-round-trip structural readings refused as semantic events", () => {
    const refused = ["outpost", "bishop_on_shade", "piece_distance", "piece_reach_count", "named_structure", "pawn_safe_square", "pawn_count"];
    expect(refused.every((family) => !SEMANTIC_EVENT_FAMILY_IDS.includes(`rules.structural.reading.${family}`))).toBe(true);
    for (const family of refused) {
      const projection = EVIDENCE_PRODUCERS.find((item) => item.id === "rules.structural")!.outputs.find((item) => item.id === `rules.structural.reading.${family}`)!;
      expect(() => compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, semanticEvents: [...EVIDENCE_CONTRACT_DECLARATIONS.semanticEvents!, { projection: { id: projection.id, version: 1 }, allowedSigns: projection.signs, requiredOperands: projection.operands, valence: "none", validation: { positives: ["positive"], hardNegatives: ["negative"] } }] })).toThrowError(expect.objectContaining<Partial<EvidenceManifestError>>({ code: "EVIDENCE_EVENT_PROJECTION_REFUSED" }));
    }
  });

  it("keeps exact source-adapter operand names aligned with current payload bytes", () => {
    const projection = (id: string) => EVIDENCE_PRODUCERS.flatMap((item) => item.outputs).find((item) => item.id === id)?.operands;
    expect(projection("rules.structural.reading.open_file")).toEqual(["kind", "squares"]);
    expect(projection("rules.transition.reading.slider_lines_changed.opened")).toEqual(["kind", "color", "direction", "count", "provenanceNote"]);
    expect(projection("authored.structural_condition.input")).toContain("documentId");
    expect(projection("run.record.evidence_ref_resolution")).toContain("sourceLabel");
    expect(projection("derived.compare.eval_delta")).toEqual(["delta", "plyOffset"]);
    expect(projection("derived.story.eval_shift")).toEqual(["before", "after", "delta"]);
    expect(projection("derived.compare.eval_delta")).not.toContain("sentence");
    expect(projection("derived.story.eval_shift")).not.toContain("sentence");
    expect(projection("human.maia.candidate_wdl")).toEqual(["nodeId", "engine", "targetElo", "candidates"]);
    expect(projection("rules.structural.reading.pawn_connectivity")).toEqual(["fen", "colors"]);
    expect(projection("rules.structural.reading.space")).toEqual(["fen", "conventionId", "colors", "differentials"]);
    expect(projection("rules.tactic.reading.rook_on_seventh")).toEqual(["fen", "rooks"]);
    expect(projection("derived.tactic.promotion_pressure")).toEqual(["fen", "pawns"]);
    expect(projection("rules.mobility.reading.legal_moves")).toEqual(["fen", "turn", "pieces"]);
  });

  it("keeps the tactical collector Appendix-A inventory set-equal to thirty compiled projections", () => {
    expect(TACTICAL_COLLECTOR_PROJECTION_IDS).toHaveLength(30);
    expect(new Set(TACTICAL_COLLECTOR_PROJECTION_IDS).size).toBe(30);
    const compiled = new Set(EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs.map((output) => output.id)));
    expect(TACTICAL_COLLECTOR_PROJECTION_IDS.every((id) => compiled.has(id))).toBe(true);
  });

  it("keeps the breadth collector Appendix-A inventory set-equal to eighteen compiled projections", () => {
    expect(BREADTH_COLLECTOR_PROJECTION_IDS).toHaveLength(18);
    expect(new Set(BREADTH_COLLECTOR_PROJECTION_IDS).size).toBe(18);
    const outputs = EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs);
    const compiled = new Set(outputs.map((output) => output.id));
    expect(BREADTH_COLLECTOR_PROJECTION_IDS.every((id) => compiled.has(id))).toBe(true);
    const breadthIds = new Set<string>(BREADTH_COLLECTOR_PROJECTION_IDS);
    const manifestText = JSON.stringify(outputs.filter((output) => breadthIds.has(output.id)));
    expect(Object.values(BREADTH_CONVENTION_TEXT).every((text) => manifestText.includes(text))).toBe(true);
  });
});
