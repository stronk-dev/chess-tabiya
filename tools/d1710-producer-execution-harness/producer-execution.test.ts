// DISPOSABLE research harness — D1710. Not production code.
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BREADTH_EVENT_PROJECTION_IDS,
  CURRENT_CONSUMER_OPERATION_IDS,
  EVIDENCE_CONTRACT_DECLARATIONS,
  SEMANTIC_EVENT_PROJECTION_IDS,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  compileEvidenceManifest,
} from "@chess-tabiya/runtime";

const ROOT = resolve(import.meta.dirname, "../..");
const manifest = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
const currentConsumers = new Set<string>(CURRENT_CONSUMER_OPERATION_IDS);

function productionFiles(directory: string): readonly string[] {
  const absoluteDirectory = resolve(ROOT, directory);
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = resolve(absoluteDirectory, entry.name);
    if (entry.isDirectory()) return productionFiles(absolutePath);
    if (!entry.isFile() || !/\.(?:ts|svelte)$/u.test(entry.name) || /(?:\.test|\.typecheck)\.ts$/u.test(entry.name)) return [];
    return [relative(ROOT, absolutePath)];
  });
}

const files = Object.freeze([
  ...productionFiles("packages/runtime/src"),
  ...productionFiles("apps/server/src"),
  ...productionFiles("apps/web/src"),
]);

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function occurrences(symbol: string, omitted: readonly string[] = []): readonly string[] {
  const pattern = new RegExp(`\\b${symbol}\\b`, "u");
  return Object.freeze(files.filter((path) => !omitted.includes(path) && pattern.test(source(path))));
}

describe("D1710 compiled projection versus consumer admission", () => {
  it("derives every projection's current binding class from the compiled manifest", () => {
    expect(manifest.projections).toHaveLength(193);
    const rows = manifest.projections.map((projection) => {
      const bindings = manifest.bindings.filter((binding) => binding.projection.id === projection.id && binding.projection.version === projection.version);
      const consumers = bindings.map((binding) => binding.consumer.id);
      return {
        id: `${projection.id}@${projection.version}`,
        current: consumers.filter((id) => currentConsumers.has(id)),
        research: consumers.filter((id) => id === "research.semantic_selection"),
        experimental: consumers.filter((id) => id === "assistance.arrows"),
        disposition: projection.disposition?.kind ?? null,
      };
    });
    const current = rows.filter((row) => row.current.length > 0);
    const researchOnly = rows.filter((row) => row.current.length === 0 && row.research.length > 0);
    const experimentalOnly = rows.filter((row) => row.current.length === 0 && row.experimental.length > 0);
    const unbound = rows.filter((row) => row.current.length === 0 && row.research.length === 0 && row.experimental.length === 0);
    const unboundByDisposition = Object.fromEntries(
      [...new Set(unbound.map((row) => row.disposition ?? "none"))]
        .sort()
        .map((disposition) => [
          disposition,
          unbound.filter((row) => (row.disposition ?? "none") === disposition).length,
        ]),
    );
    console.log(JSON.stringify({
      counts: { projections: rows.length, current: current.length, researchOnly: researchOnly.length, experimentalOnly: experimentalOnly.length, unbound: unbound.length },
      unboundByDisposition,
      unbound: unbound.map((row) => ({ id: row.id, disposition: row.disposition ?? "none" })),
    }));
    const bindingCountsByProducer = manifest.producers.map((producer) => {
      const ids = new Set(producer.outputs.map((projection) => `${projection.id}@${projection.version}`));
      return {
        producer: `${producer.id}@${producer.version}`,
        implementation: producer.implementation,
        outputs: ids.size,
        current: current.filter((row) => ids.has(row.id)).length,
        research: researchOnly.filter((row) => ids.has(row.id)).length,
        unbound: unbound.filter((row) => ids.has(row.id)).length,
      };
    });
    console.log(JSON.stringify({ bindingCountsByProducer }));
    expect([...current, ...researchOnly, ...experimentalOnly, ...unbound]).toHaveLength(rows.length);
    expect({ current: current.length, researchOnly: researchOnly.length, experimentalOnly: experimentalOnly.length, unbound: unbound.length })
      .toEqual({ current: 93, researchOnly: 67, experimentalOnly: 0, unbound: 33 });
    expect(unboundByDisposition).toEqual({ experimental: 2, inspector_only: 30, retired: 1 });
  });
});

describe("D1710 semantic producer roots", () => {
  const sequenceOnlyIds = Object.freeze([
    "derived.exchange.trade_completed",
    "derived.pawn.sequence.contact_timing",
    "derived.pawn.sequence.harassment_pressure",
    "derived.tactic.sequence.defender_consequence",
    ...SEMANTIC_WAVE_EVENT_PROJECTION_IDS.slice(2),
  ]);
  const candidateOnlyIds = Object.freeze([
    ...BREADTH_EVENT_PROJECTION_IDS.filter((id) => !sequenceOnlyIds.includes(id)),
    ...SEMANTIC_WAVE_EVENT_PROJECTION_IDS.slice(0, 2),
  ]);

  it("proves all declared semantic events terminate in research/helper roots today", () => {
    expect(SEMANTIC_EVENT_PROJECTION_IDS).toHaveLength(67);
    expect(occurrences("localSemanticEvents", ["packages/runtime/src/semantic-evidence.ts", "packages/runtime/src/index.ts"]))
      .toEqual(["apps/server/src/candidate-evidence.ts"]);
    expect(occurrences("candidateFeatureVector", ["apps/server/src/candidate-evidence.ts"]))
      .toEqual([]);
    expect(occurrences("selectLocalSemanticEvidence", ["packages/runtime/src/semantic-evidence.ts", "packages/runtime/src/index.ts", "packages/runtime/src/evidence-catalog.ts"]))
      .toEqual(["apps/server/src/semantic-evidence-check.ts"]);
  });

  it("partitions the 67 semantic projections by the deepest executable root they can reach", () => {
    const selectorOnlyIds = SEMANTIC_EVENT_PROJECTION_IDS.filter((id) => !candidateOnlyIds.includes(id) && !sequenceOnlyIds.includes(id));
    expect({ selectorOnly: selectorOnlyIds.length, candidateOnly: candidateOnlyIds.length, sequenceOnly: sequenceOnlyIds.length })
      .toEqual({ selectorOnly: 45, candidateOnly: 11, sequenceOnly: 11 });
    expect(new Set([...selectorOnlyIds, ...candidateOnlyIds, ...sequenceOnlyIds])).toEqual(new Set(SEMANTIC_EVENT_PROJECTION_IDS));
    expect(occurrences("breadthSemanticEvents", ["packages/runtime/src/semantic-evidence.ts", "packages/runtime/src/index.ts"]))
      .toEqual([]);
    expect(occurrences("semanticDutyEvents", ["packages/runtime/src/semantic-evidence.ts", "packages/runtime/src/index.ts"]))
      .toEqual([]);
  });

  it("proves multi-edge and bounded semantic constructors have no non-test integration caller", () => {
    const helperOnly = [
      "tradeCompletedSemanticEvent",
      "pawnContactTimingSemanticEvent",
      "harassmentPressureSemanticEvent",
      "defenderConsequenceSemanticEvent",
      "lineBlockerClearanceSemanticEvent",
      "deflectionObservedSemanticEvent",
      "attractionObservedSemanticEvent",
      "squareClearanceSemanticEvent",
      "interferenceSemanticEvent",
      "checkZwischenzugSemanticEvent",
      "overloadExploitationSemanticEvent",
      "forcedMateAfterMove",
      "overloadedDefenderResponseConflict",
    ] as const;
    for (const symbol of helperOnly) {
      const declarationFile = symbol === "forcedMateAfterMove"
        ? "packages/runtime/src/mate-proof.ts"
        : symbol === "overloadedDefenderResponseConflict"
          ? "packages/runtime/src/tactics.ts"
          : "packages/runtime/src/semantic-evidence.ts";
      expect(occurrences(symbol, [declarationFile, "packages/runtime/src/index.ts"]), symbol).toEqual([]);
    }
  });
});

describe("D1710 exact source-file accounting", () => {
  it("keeps the audit rooted in the intended production trees", () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files.every((path) => !path.includes("tools/") && !path.endsWith(".test.ts"))).toBe(true);
    expect(relative(ROOT, resolve(ROOT, files[0]!))).not.toMatch(/^\.\./u);
  });
});
