import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
  tempoEvidenceRef,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  evidencePayloadTable,
  evidenceSentenceTable,
  renderDeclaredEvidenceRef,
  renderEvidenceRef,
} from "./evidence-sentences.js";

const pack = JSON.parse(
  readFileSync(
    new URL("../../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;

describe("evidence sentence contract", () => {
  it("refuses the pre-F1 bare reference at the consumer entrypoint", () => {
    if (false) {
      // @ts-expect-error runtime.evidence_ref consumes only a sealed admitted view.
      renderDeclaredEvidenceRef("rules:structure-outpost");
    }
  });
  it("enumerates a sentence for every rules and pack ref v1 can emit", () => {
    const expected = [
      ...RULES_EVIDENCE_FACTS.map(rulesEvidenceRef),
      ...pack.checkpoints.map((checkpoint) => packEvidenceRef(checkpoint.id)),
      ...pack.checkpoints.map((checkpoint) => packAbsentEvidenceRef(checkpoint.id)),
      ...THEORY_EVIDENCE_FACTS.map((fact) => `theory:${fact}`),
      ...(pack.timingWindows ?? []).flatMap((window) =>
        ["in_time", "over_budget", "too_slow", "premature", "outpaced"].map(
          (verdict) => tempoEvidenceRef(window.id, verdict),
        ),
      ),
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

  it("renders exact tablebase payloads from the side-to-move perspective", () => {
    const payload = {
      kind: "tablebase" as const,
      source: "tablebase_exact" as const,
      values: {
        category: "draw",
        pieceCount: 5,
        dtz: 0,
        preciseDtz: 0,
        sourceId: "tablebase-fixture",
      },
    };
    const sentence = renderEvidenceRef(
      "tablebase:exact-1",
      pack,
      new Map([["tablebase:exact-1", payload]]),
    );

    expect(sentence).toMatchObject({
      text: "Exact tablebase evidence recorded: category draw for the side to move; 5 pieces; DTZ 0; source tablebase-fixture.",
      sourceLabel: "Tablebase",
      payload,
    });
    expect(renderEvidenceRef("tablebase:pending", pack).text).toBe(
      "Tablebase evidence recorded; details are pending.",
    );
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
