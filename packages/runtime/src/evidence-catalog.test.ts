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
  STRUCTURAL_PREDICATE_PROJECTION_IDS,
  STRUCTURAL_READING_PROJECTION_IDS,
  TRANSITION_READING_PROJECTION_IDS,
} from "./evidence-catalog.js";
import { compileEvidenceManifest } from "./evidence-contract.js";

const ROOT = new URL("../../../", import.meta.url);
const EXPECTED_PRODUCERS = Object.freeze(["rules.structural", "rules.transition", "rules.phase", "rules.pivotal", "rules.endgame", "theory.shapes", "pack.authored", "recorded.engine", "recorded.tablebase", "live.stockfish", "live.syzygy", "human.maia", "human.explorer", "theory.opening_identity"]);

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
    expect(EVIDENCE_CONSUMER_IDS).toEqual([...CURRENT_CONSUMER_OPERATION_IDS, "assistance.arrows"]);
    expect(manifest.consumers.find((item) => item.id === "assistance.arrows")?.disposition).toEqual(expect.objectContaining({ kind: "experimental" }));
    expect(manifest.digest).toBe(createHash("sha256").update(canonical({ producers: manifest.producers, projections: manifest.projections, consumers: manifest.consumers, bindings: manifest.bindings })).digest("hex"));
  });

  it("separates all structural predicate and reading identities and pins the emission exception", () => {
    expect(STRUCTURAL_PREDICATE_PROJECTION_IDS.map((id) => id.split(".").at(-1))).toEqual([...STRUCTURAL_FEATURE_KINDS]);
    expect(STRUCTURAL_READING_PROJECTION_IDS.map((id) => id.split(".").at(-1))).toEqual([...STRUCTURAL_FEATURE_KINDS]);
    const outputs = EVIDENCE_PRODUCERS.find((item) => item.id === "rules.structural")!.outputs;
    expect(outputs.find((item) => item.id === "rules.structural.reading.pawn_count")?.disposition).toEqual(expect.objectContaining({ kind: "retired" }));
    expect(outputs.find((item) => item.id === "rules.structural.predicate.outpost")?.dependsOn).toEqual([{ id: "rules.structural.predicate.pawn_safe_square", version: 1 }]);
  });

  it("covers every transition family with the fourteen independently witnessed lossy leaves", () => {
    expect(new Set(TRANSITION_READING_PROJECTION_IDS.map((id) => id.split(".").at(-2)))).toEqual(new Set(TRANSITION_FEATURE_KINDS));
    expect(TRANSITION_READING_PROJECTION_IDS).toHaveLength(14);
    const outputs = EVIDENCE_PRODUCERS.find((item) => item.id === "rules.transition")!.outputs;
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
});
