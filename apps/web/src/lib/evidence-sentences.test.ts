import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  evidencePayloadTable,
  evidenceSentenceTable,
  renderEvidenceRef,
} from "./evidence-sentences.js";

const pack = JSON.parse(
  readFileSync(
    new URL("../../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;

describe("evidence sentence contract", () => {
  it("enumerates a sentence for every rules and pack ref v1 can emit", () => {
    const expected = [
      ...RULES_EVIDENCE_FACTS.map(rulesEvidenceRef),
      ...pack.checkpoints.map((checkpoint) => packEvidenceRef(checkpoint.id)),
      ...pack.checkpoints.map((checkpoint) => packAbsentEvidenceRef(checkpoint.id)),
      ...THEORY_EVIDENCE_FACTS.map((fact) => `theory:${fact}`),
    ];
    const table = evidenceSentenceTable(pack);

    expect([...table.keys()].sort()).toEqual([...expected].sort());
    for (const reference of expected) {
      const sentence = table.get(reference);
      expect(sentence?.text).toMatch(/[.!?]$/);
      expect(sentence?.sourceLabel).toMatch(/^(Rules|Pack)$/);
    }
    expect(table.get("pack:timing-window")?.text).toBe(
      "Checkpoint reached: Critical race resolved.",
    );
  });

  it("renders each engine result as a separately source-labeled payload", () => {
    const results = [
      {
        seq: 1,
        jobId: "evidence-job-1",
        runId: "run-a",
        nodeId: "node-a",
        evidenceRefs: ["engine:evidence-job-1"] as const,
        payload: {
          kind: "eval" as const,
          source: "engine_validated" as const,
          values: { centipawns: 18 },
        },
      },
      {
        seq: 2,
        jobId: "evidence-job-2",
        runId: "run-a",
        nodeId: "node-a",
        evidenceRefs: ["engine:evidence-job-2"] as const,
        payload: {
          kind: "wdl" as const,
          source: "human_model_predicted" as const,
          values: { win: 0.2, draw: 0.5, loss: 0.3 },
        },
      },
    ];
    const payloads = evidencePayloadTable(results);

    expect(renderEvidenceRef("engine:evidence-job-1", pack, payloads)).toMatchObject({
      text: "eval evidence recorded.",
      sourceLabel: "Engine",
      payload: { values: { centipawns: 18 } },
    });
    expect(renderEvidenceRef("engine:evidence-job-2", pack, payloads)).toMatchObject({
      text: "wdl evidence recorded.",
      sourceLabel: "Human model",
      payload: { values: { win: 0.2, draw: 0.5, loss: 0.3 } },
    });
  });

  it("keeps unknown refs explicit and refuses merged payloads", () => {
    expect(renderEvidenceRef("future:fact", pack)).toEqual({
      reference: "future:fact",
      text: "Evidence recorded.",
      sourceLabel: "Recorded",
    });
    expect(() =>
      evidencePayloadTable([
        {
          seq: 1,
          jobId: "one",
          runId: "run-a",
          nodeId: "node-a",
          evidenceRefs: ["engine:duplicate"],
          payload: {
            kind: "eval",
            source: "engine_validated",
            values: {},
          },
        },
        {
          seq: 2,
          jobId: "two",
          runId: "run-a",
          nodeId: "node-a",
          evidenceRefs: ["engine:duplicate"],
          payload: {
            kind: "wdl",
            source: "human_model_predicted",
            values: {},
          },
        },
      ]),
    ).toThrow("more than one payload");
  });
});
