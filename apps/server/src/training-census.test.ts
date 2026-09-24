import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { trainingCensus } from "./training-census.js";

// Content tier: this reads the real corpus under content/packs/, content/drafts/ and content/candidates/.
const CONTENT_ROOT = new URL("../../../content", import.meta.url).pathname;

describe("training-methods census (rfc/return-scheduling.md §10, criterion 10)", () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

  it("counts only objects carrying mode, opponentPolicy and objective — never prose mentions", () => {
    const root = mkdtempSync(join(tmpdir(), "tabiya-census-"));
    directories.push(root);
    mkdirSync(join(root, "packs"));
    const pack = (mode: string, policy: string, extra: Record<string, unknown> = {}) => JSON.stringify({ mode, opponentPolicy: { mode: policy }, objective: { type: "hold" }, ...extra });
    writeFileSync(join(root, "packs", "a.json"), pack("outcome", "perfect_tablebase", { retryVariants: [{ kind: "opposite_side" }], checkpoints: [{ interaction: { type: "prediction" } }] }));
    writeFileSync(join(root, "packs", "b.json"), pack("line", "human_common", { timingWindows: [{ id: "w" }], checkpoints: [{ atWindow: { windowId: "w", verdict: "late" } }] }));
    writeFileSync(join(root, "prose.json"), JSON.stringify({ provenance: { graduationBlockers: [{ statement: "needs perfect_tablebase" }] } }));
    writeFileSync(join(root, "broken.json"), "{");
    const census = trainingCensus(root);
    expect(census).toMatchObject({
      jsonFiles: 4,
      mode: { outcome: 1, line: 1 },
      rootOpponentPolicy: { perfect_tablebase: 1, human_common: 1 },
      checkpointInteractions: { prediction: 1 },
      timingWindows: 1,
      timingWindowVerdictPacks: 1,
      retryVariants: 1,
      concepts: 0,
    });
    expect([...census.packFiles].sort()).toEqual(["packs/a.json", "packs/b.json"]);
  });

  it("the §10 category sets equal the procedure's output over the real corpus", () => {
    const census = trainingCensus(CONTENT_ROOT);
    const nonZero = (counts: Readonly<Record<string, number>>) => new Set(Object.entries(counts).filter(([, count]) => count > 0).map(([key]) => key));
    expect(nonZero(census.mode)).toEqual(new Set(["outcome", "line", "plan", "trajectory"]));
    expect(nonZero(census.rootOpponentPolicy)).toEqual(new Set(["human_common", "theory_strict", "perfect_tablebase", "strong_engine"]));
    expect(nonZero(census.checkpointInteractions)).toEqual(new Set(["intent_capture", "stated_reasoning"]));
    expect(census.packFiles.length).toBe(Object.values(census.mode).reduce((sum, count) => sum + count, 0));
  });

  it("drift tripwire: the §10 integers measured at HEAD on 2026-09-24", () => {
    const census = trainingCensus(CONTENT_ROOT);
    expect({
      packs: census.packFiles.length,
      mode: census.mode,
      rootOpponentPolicy: census.rootOpponentPolicy,
      checkpointInteractions: census.checkpointInteractions,
      timingWindows: census.timingWindows,
      timingWindowVerdictPacks: census.timingWindowVerdictPacks,
      retryVariants: census.retryVariants,
      concepts: census.concepts,
    }).toEqual({
      packs: 92,
      mode: { outcome: 42, line: 32, plan: 14, trajectory: 4 },
      rootOpponentPolicy: { human_common: 55, theory_strict: 34, perfect_tablebase: 2, strong_engine: 1 },
      checkpointInteractions: { intent_capture: 51, stated_reasoning: 1 },
      timingWindows: 4,
      timingWindowVerdictPacks: 0,
      retryVariants: 7,
      concepts: 50,
    });
  });
});
