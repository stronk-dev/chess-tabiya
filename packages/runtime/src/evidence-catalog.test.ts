import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { STRUCTURAL_FEATURE_KINDS, TRANSITION_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";

import { RULES_EVIDENCE_FACTS } from "./evidence-ref.js";
import {
  CURRENT_CONSUMER_OPERATION_IDS,
  EVIDENCE_CONSUMER_IDS,
  EVIDENCE_CONTRACT_DECLARATIONS,
  EVIDENCE_PRODUCER_IDS,
  EVIDENCE_PRODUCERS,
  SEMANTIC_EVENT_PROJECTION_IDS,
  STRUCTURAL_PREDICATE_PROJECTION_IDS,
  STRUCTURAL_READING_PROJECTION_IDS,
  TACTICAL_COLLECTOR_PROJECTION_IDS,
  TRANSITION_READING_PROJECTION_IDS,
} from "./evidence-catalog.js";
import { compileEvidenceManifest } from "./evidence-contract.js";
import { EvidenceManifestError } from "./evidence-contract.js";

const ROOT = new URL("../../../", import.meta.url);
const EXPECTED_PRODUCERS = Object.freeze(["rules.structural", "rules.transition", "rules.castling", "rules.exchange", "rules.tactic", "rules.phase", "rules.pivotal", "rules.endgame", "theory.shapes", "authored.structural_condition", "pack.authored", "recorded.engine", "recorded.tablebase", "live.stockfish", "live.syzygy", "human.maia", "human.explorer", "theory.opening_identity", "run.record", "derived.compare_narrative", "derived.story", "derived.exchange", "derived.tactic", "sourcing.ledger", "derived.semantic_avoidance"]);

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
    expect(EVIDENCE_CONSUMER_IDS).toEqual([...CURRENT_CONSUMER_OPERATION_IDS, "assistance.arrows", "research.semantic_selection"]);
    expect(manifest.consumers.find((item) => item.id === "assistance.arrows")?.disposition).toEqual(expect.objectContaining({ kind: "experimental" }));
    expect([manifest.producers.length, manifest.projections.length, manifest.consumers.length, manifest.bindings.length]).toEqual([25, 156, 25, 188]);
    expect([manifest.semanticEvents.length, manifest.eligibility.length, manifest.reasons.length, manifest.selectionPolicies.length]).toEqual([46, 46, 15, 1]);
    expect(new Set(manifest.semanticEvents.map((item) => item.projection.id))).toEqual(new Set(SEMANTIC_EVENT_PROJECTION_IDS));
    expect(new Set(manifest.eligibility.map((item) => `${item.consumer.id}@${item.consumer.version}`))).toEqual(new Set(["research.semantic_selection@1"]));
    expect(manifest.bindings.filter((binding) => SEMANTIC_EVENT_PROJECTION_IDS.includes(binding.projection.id)).every((binding) => binding.consumer.id === "research.semantic_selection")).toBe(true);
    expect(manifest.digest).toBe(createHash("sha256").update(canonical({ producers: manifest.producers, projections: manifest.projections, consumers: manifest.consumers, bindings: manifest.bindings, semanticEvents: manifest.semanticEvents, eligibility: manifest.eligibility, reasons: manifest.reasons, selectionPolicies: manifest.selectionPolicies })).digest("hex"));
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
    const documents = jsonFiles(new URL("content/", ROOT)).map((url) => readFileSync(url, "utf8"));
    const counts = documents.map((text) => [...text.matchAll(/"kind"\s*:\s*"outpost"/gu)].length);
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(23);
    expect(counts.filter((count) => count > 0)).toHaveLength(3);
  });

  it("keeps all seven non-round-trip structural readings refused as semantic events", () => {
    const refused = ["outpost", "bishop_on_shade", "piece_distance", "piece_reach_count", "named_structure", "pawn_safe_square", "pawn_count"];
    expect(refused.every((family) => !SEMANTIC_EVENT_PROJECTION_IDS.includes(`rules.structural.reading.${family}`))).toBe(true);
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
  });

  it("keeps the tactical collector Appendix-A inventory set-equal to thirty compiled projections", () => {
    expect(TACTICAL_COLLECTOR_PROJECTION_IDS).toHaveLength(30);
    expect(new Set(TACTICAL_COLLECTOR_PROJECTION_IDS).size).toBe(30);
    const compiled = new Set(EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs.map((output) => output.id)));
    expect(TACTICAL_COLLECTOR_PROJECTION_IDS.every((id) => compiled.has(id))).toBe(true);
  });
});
