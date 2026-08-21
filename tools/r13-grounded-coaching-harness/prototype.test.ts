// DISPOSABLE research harness — platform-alignment R13. Not production code.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("../../", import.meta.url).pathname;
const DRAFTS = join(ROOT, "content/drafts");
const OUTPUT = join(ROOT, "tools/r13-grounded-coaching-harness/prototype-output.md");

interface SourceRef { readonly runId: string; readonly nodeId: string }
interface Action { readonly kind: "replay" | "retry" | "pack" | "theory"; readonly id: string }
interface Observation {
  readonly identity: string;
  readonly label: string;
  readonly source: SourceRef;
  readonly opportunity?: boolean;
  readonly occurred: boolean;
  readonly applicablePackIds?: readonly string[];
  readonly applicableTheoryIds?: readonly string[];
}
interface Card {
  readonly identity: string;
  readonly sentence: string;
  readonly numerator: number;
  readonly denominator?: number;
  readonly sources: readonly SourceRef[];
  readonly totalSources: number;
  readonly actions: readonly Action[];
}

const forbidden = /\b(weakness|strength|needs work|should|best|blunder|mistake|tactical player|positional player)\b/iu;

function card(identity: string, observations: readonly Observation[], sourceLimit = 3): Card | null {
  const population = observations.filter((item) => item.identity === identity);
  if (population.length === 0) return null;
  const eligible = population.filter((item) => item.opportunity !== false);
  const occurred = eligible.filter((item) => item.occurred);
  if (occurred.length === 0) return null;
  const label = population[0]!.label;
  const hasOpportunityContract = population.every((item) => item.opportunity !== undefined);
  const sentence = hasOpportunityContract
    ? `${label} appeared in ${occurred.length} of ${eligible.length} recorded opportunities.`
    : `${label} appeared in ${occurred.length} preserved records; opportunities were not recorded.`;
  if (forbidden.test(sentence)) throw new TypeError("Deterministic coaching text used diagnostic vocabulary");
  const packIds = [...new Set(occurred.flatMap((item) => item.applicablePackIds ?? []))].sort();
  const theoryIds = [...new Set(occurred.flatMap((item) => item.applicableTheoryIds ?? []))].sort();
  const replay = occurred.map((item) => ({ kind: "replay" as const, id: `${item.source.runId}#${item.source.nodeId}` }));
  return Object.freeze({
    identity,
    sentence,
    numerator: occurred.length,
    ...(hasOpportunityContract ? { denominator: eligible.length } : {}),
    sources: Object.freeze(occurred.slice(0, sourceLimit).map((item) => item.source)),
    totalSources: occurred.length,
    actions: Object.freeze([...replay.slice(0, sourceLimit), ...packIds.map((id) => ({ kind: "pack" as const, id })), ...theoryIds.map((id) => ({ kind: "theory" as const, id }))]),
  });
}

function packs() {
  return readdirSync(DRAFTS)
    .filter((name) => name.endsWith(".json") && !name.includes(".browser.") && !name.includes(".evidence.") && !name.includes(".sources.") && !name.includes(".job."))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(DRAFTS, name), "utf8")) as { readonly id: string; readonly concepts?: readonly string[] });
}

function interfaceBody(source: string, name: string): string {
  return new RegExp(`export interface ${name} \\{([^}]*)\\}`, "u").exec(source)?.[1] ?? "";
}

function progressMetricsSignature(source: string): string {
  const start = source.indexOf("  metrics(learnerId: string): {");
  if (start < 0) return "";
  const end = source.indexOf("\n  };", start);
  return end < 0 ? "" : source.slice(start, end + 5);
}

function between(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  if (start < 0) return "";
  const end = source.indexOf(endMarker, start + startMarker.length);
  return end < 0 ? "" : source.slice(start, end);
}

describe("R13 current coaching topology and safe aggregate", () => {
  it("measures current persistence reach and concept identity fragmentation", () => {
    const documents = packs();
    const refs = documents.flatMap((pack) => (pack.concepts ?? []).map((concept) => ({ packId: pack.id, concept })));
    const byRaw = new Map<string, string[]>();
    for (const ref of refs) byRaw.set(ref.concept, [...(byRaw.get(ref.concept) ?? []), ref.packId]);
    const repeated = [...byRaw].filter(([, packIds]) => new Set(packIds).size > 1);

    const progress = readFileSync(join(ROOT, "apps/server/src/progress.ts"), "utf8");
    const storage = readFileSync(join(ROOT, "apps/server/src/storage.ts"), "utf8");
    const service = readFileSync(join(ROOT, "apps/server/src/service.ts"), "utf8");
    const catalog = readFileSync(join(ROOT, "packages/runtime/src/evidence-catalog.ts"), "utf8");
    const topology = {
      importedAttemptsPersisted: !progress.includes('if (run.sessionKind === "imported")'),
      conceptIdentityIsCrossPack: !progress.includes("`pack:${packId}#${raw}`"),
      attemptsCarrySourceNode: /rootNodeId: string/u.test(progress),
      conceptTagsCarrySourceNode: /nodeId/u.test(interfaceBody(progress, "ConceptTagRow")),
      aggregateMetricsCarrySourceRows: /runId/u.test(progressMetricsSignature(storage)),
      aggregateMetricsCarryOpportunityDenominator: /opportun/u.test(progressMetricsSignature(storage)),
      shapeRecommendationCarriesRunIds: between(service, "  shapeRecommendations(", "\n  async createGroup(").includes("runIds: Object.freeze"),
      shapeRecommendationCarriesNodeIds: /nodeIds:/u.test(between(service, "  shapeRecommendations(", "\n  async createGroup(")),
      reviewConsumesSemanticEvents: /id: "review\.story"[\s\S]*?projections: \[([^\]]+)/u.exec(catalog)?.[1]?.includes("rules.transition.event") ?? false,
    };

    expect(documents.length).toBeGreaterThan(0);
    expect(refs.length).toBeGreaterThan(0);
    expect(repeated.length).toBeGreaterThan(0);
    expect(topology.importedAttemptsPersisted).toBe(false);
    expect(topology.conceptIdentityIsCrossPack).toBe(false);
    expect(topology.attemptsCarrySourceNode).toBe(true);
    expect(topology.conceptTagsCarrySourceNode).toBe(false);
    expect(topology.aggregateMetricsCarrySourceRows).toBe(false);
    expect(topology.aggregateMetricsCarryOpportunityDenominator).toBe(false);
    expect(topology.shapeRecommendationCarriesRunIds).toBe(true);
    expect(topology.shapeRecommendationCarriesNodeIds).toBe(false);
    expect(topology.reviewConsumesSemanticEvents).toBe(false);

    const report = {
      packs: documents.length,
      conceptReferences: refs.length,
      rawConceptIdentities: byRaw.size,
      rawIdentitiesRepeatedAcrossPacks: repeated.length,
      packScopedPersistedIdentities: refs.length,
      mostRepeated: repeated.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 8),
      topology,
    };
    writeFileSync(join(ROOT, "tools/r13-grounded-coaching-harness/census.json"), `${JSON.stringify(report, null, 2)}\n`);
  });

  it("renders literal cited cards and refuses identity, denominator and action laundering", () => {
    const rows: Observation[] = [
      { identity: "shape:carlsbad@1", label: "Carlsbad structure", source: { runId: "r1", nodeId: "n4" }, opportunity: true, occurred: true, applicablePackIds: ["carlsbad-minority-attack"], applicableTheoryIds: ["carlsbad@0.1.0"] },
      { identity: "shape:carlsbad@1", label: "Carlsbad structure", source: { runId: "r2", nodeId: "n8" }, opportunity: true, occurred: false },
      { identity: "shape:carlsbad@1", label: "Carlsbad structure", source: { runId: "r3", nodeId: "n6" }, opportunity: true, occurred: true, applicablePackIds: ["trajectory-qgd-exchange-minority"], applicableTheoryIds: ["carlsbad@0.1.0"] },
      { identity: "pack:p1#minority-attack", label: "Minority attack", source: { runId: "r4", nodeId: "n2" }, occurred: true },
      { identity: "pack:p2#minority-attack", label: "Minority attack", source: { runId: "r5", nodeId: "n3" }, occurred: true },
    ];
    const shape = card("shape:carlsbad@1", rows, 1)!;
    expect(shape.sentence).toBe("Carlsbad structure appeared in 2 of 3 recorded opportunities.");
    expect(shape.sources).toHaveLength(1);
    expect(shape.totalSources).toBe(2);
    expect(shape.actions).toEqual(expect.arrayContaining([
      { kind: "pack", id: "carlsbad-minority-attack" },
      { kind: "pack", id: "trajectory-qgd-exchange-minority" },
      { kind: "theory", id: "carlsbad@0.1.0" },
    ]));
    const firstPackConcept = card("pack:p1#minority-attack", rows)!;
    expect(firstPackConcept.numerator).toBe(1);
    expect(firstPackConcept.denominator).toBeUndefined();
    expect(firstPackConcept.sentence).toContain("opportunities were not recorded");
    expect(firstPackConcept.actions.filter((action) => action.kind === "pack" || action.kind === "theory")).toEqual([]);
    expect(card("minority-attack", rows)).toBeNull();
    expect(forbidden.test(shape.sentence)).toBe(false);

    const report = [
      "# R13 grounded coaching prototype",
      "",
      "Disposable output. Literal aggregation only; no diagnosis, ranking or production authority.",
      "",
      `- Admitted exact card: ${shape.sentence}`,
      `- Source display: ${shape.sources.length} shown of ${shape.totalSources} exact contributing nodes.`,
      `- Exact actions: ${shape.actions.map((action) => `${action.kind}:${action.id}`).join(", ")}.`,
      `- Pack-scoped concept: ${firstPackConcept.sentence}`,
      "- Label-only cross-pack merge: refused.",
      "- Pack/theory action without exact applicability: refused.",
      "- Diagnostic/advice vocabulary: refused.",
      "",
    ];
    writeFileSync(OUTPUT, report.join("\n"));
  });
});
