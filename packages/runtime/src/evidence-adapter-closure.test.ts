import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { declareAuthoredClaimEvidence, declareCompareDerivedEvidence, declareLivePacketEvidence, declareRunRecordEvidence } from "./evidence-source-adapters.js";

const ROOT = new URL("../../../", import.meta.url);
const MIGRATED_PRODUCTION_FILES = Object.freeze([
  "packages/runtime/src/shape-firing.ts",
  "packages/runtime/src/structural-evidence.ts",
  "packages/runtime/src/compare-strips.ts",
  "packages/runtime/src/reading-evidence.ts",
  "packages/runtime/src/story.ts",
  "packages/runtime/src/pivotal.ts",
  "apps/server/src/guidance.ts",
  "apps/server/src/guard.ts",
  "apps/server/src/repertoire.ts",
  "apps/server/src/opponent-selector.ts",
  "apps/server/src/sourcing/claim-binding.ts",
  "apps/web/src/lib/evidence-sentences.ts",
  "apps/web/src/lib/inspector-evidence.ts",
  "apps/web/src/lib/claim-presentation.ts",
] as const);
const GENERIC_CONSTRUCTION_FILES = Object.freeze([
  "packages/runtime/src/evidence-contract.ts",
  "packages/runtime/src/evidence-source-adapters.ts",
] as const);
const CALL = /\bdeclareEvidence(?:<[^>]+>)?\s*\(/u;

function source(path: string): string {
  return readFileSync(new URL(path, ROOT), "utf8");
}

function files(url: URL): readonly string[] {
  return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), url);
    if (entry.isDirectory()) return files(child);
    if (!entry.isFile() || !/\.(?:ts|svelte)$/u.test(entry.name) || /\.test\.ts$/u.test(entry.name)) return [];
    return [decodeURIComponent(child.pathname).slice(decodeURIComponent(ROOT.pathname).length)];
  });
}

describe("exact evidence source-adapter closure", () => {
  it("keeps the fourteen migrated production files free of generic construction", () => {
    expect(MIGRATED_PRODUCTION_FILES).toHaveLength(14);
    for (const path of MIGRATED_PRODUCTION_FILES) {
      expect(source(path), path).not.toMatch(CALL);
      expect(source(path), path).not.toMatch(/\bimport\s*\{[^}]*\bdeclareEvidence\b/us);
    }
  });

  it("permits generic construction only in the contract and named adapter module", () => {
    const actual = files(new URL("packages/runtime/src/", ROOT))
      .concat(files(new URL("apps/server/src/", ROOT)), files(new URL("apps/web/src/", ROOT)))
      .filter((path) => CALL.test(source(path)))
      .sort();
    expect(actual).toEqual([...GENERIC_CONSTRUCTION_FILES].sort());
    expect(source("packages/runtime/src/index.ts")).not.toMatch(/^\s*declareEvidence,?\s*$/mu);
  });

  it("detects a fifteenth direct production call", () => {
    expect(CALL.test("const leaked = declareEvidence(producer, projection, payload);")).toBe(true);
  });

  it("rejects malformed exact payloads and routes Maia by source rather than a dead kind", () => {
    expect(() => declareAuthoredClaimEvidence({ text: "arbitrary prose" })).toThrow(/missing id, attribution/u);
    expect(() => declareCompareDerivedEvidence("eval_delta", { sentence: "arbitrary prose" })).toThrow(/missing delta, plyOffset/u);
    expect(() => declareRunRecordEvidence("consequence", { sentence: "arbitrary prose" })).toThrow(/missing context, terminal/u);
    const maia = declareLivePacketEvidence({ kind: "bestline", source: "human_model_predicted", values: { moves: ["e2e4"] } });
    expect(maia.producer.id).toBe("human.maia");
    expect(maia.projection.id).toBe("human.maia.event");
  });
});
