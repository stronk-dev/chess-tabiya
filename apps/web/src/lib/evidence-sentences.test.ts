import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
  tempoEvidenceRef,
  PRIMARY_EVIDENCE_MANIFEST,
  evidenceForConsumer,
  evidenceReferenceEvidence,
  presentEvidenceItems,
  presentedSentence,
  serializePresentedEvidence,
  parsePresentationReceipt,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  evidencePayloadTable,
  evidenceSentenceTable,
  renderDeclaredEvidenceRef,
  renderEvidenceRef,
  evidenceRefPresentation,
} from "./evidence-sentences.js";

const pack = JSON.parse(
  readFileSync(
    new URL("../../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;

describe("evidence sentence contract", () => {
  it.each([
    { reference: "engine:invalid-line", packet: { kind: "bestline" as const, source: "engine_validated" as const, values: { movesUci: ["not-a-move"] } } },
    { reference: "tablebase:invalid-category", packet: { kind: "tablebase" as const, source: "tablebase_exact" as const, values: { category: "not-a-category", dtz: -3 } } },
  ])("D4022 refuses an admitted invalid presentation input locally ($reference)", ({ reference, packet }) => {
    const payloads = new Map([[reference, packet]]);
    const declared = evidenceReferenceEvidence(reference, pack, payloads);
    expect(declared[1]!.payload).toEqual(packet);
    expect(() => renderEvidenceRef(reference, pack, payloads)).toThrow(/PRESENTATION_INVALID/u);
    expect(evidenceRefPresentation(reference, pack, payloads)).toEqual({ kind: "failed", reference });
  });

  it("D4023 preserves the exact signed DTZ through process and received presentation", () => {
    const reference = "tablebase:signed";
    const packet = { kind: "tablebase" as const, source: "tablebase_exact" as const, values: { category: "loss", dtz: 4, preciseDtz: -7 } };
    const payloads = new Map([[reference, packet]]);
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "runtime.evidence_ref", version: 1 }, evidenceReferenceEvidence(reference, pack, payloads));
    const presented = presentEvidenceItems(view);
    expect(renderEvidenceRef(reference, pack, payloads).text).toContain("DTZ -7");
    expect(presented.map(presentedSentence).join(" ")).toContain("DTZ -7");
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(presented)))).map(presentedSentence).join(" ")).toContain("DTZ -7");
  });
  it("D3948 actually consumes registered reference components instead of raw resolution text", () => {
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "runtime.evidence_ref", version: 1 },
      evidenceReferenceEvidence("future:fact", pack));
    const presented = presentEvidenceItems(view);
    expect(presented).toHaveLength(1);
    expect(renderDeclaredEvidenceRef(view).text).toBe(presented.map(presentedSentence).join(" "));
  });

  it.each(["engine:model-tablebase", "tablebase:model-tablebase"])("D4020 refuses unsupported exactness at the actual reference entrypoint (%s)", reference => {
    const packet = { kind: "tablebase" as const, source: "human_model_predicted" as const, values: { category: "win", pieceCount: 4, dtz: 3 } };
    const declared = evidenceReferenceEvidence(reference, pack, new Map([[reference, packet]]));
    expect(declared.find(item => item.projection.id === "human.maia.event")?.payload).toEqual(packet);
    expect(() => renderDeclaredEvidenceRef(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "runtime.evidence_ref", version: 1 }, declared))).toThrow(/source kind\/reader/u);
    expect(evidenceRefPresentation(reference, pack, new Map([[reference, packet]]))).toEqual({ kind: "failed", reference });
  });

  it.each([
    { reference: "tablebase:engine", packet: { kind: "eval" as const, source: "engine_validated" as const, values: { centipawns: 10, perspective: "white" } } },
    { reference: "engine:tablebase", packet: { kind: "tablebase" as const, source: "tablebase_exact" as const, values: { category: "win", dtz: 3 } } },
  ])("D4021 refuses a genuinely admitted crossed reference/source ($reference)", ({ reference, packet }) => {
    const payloads = new Map([[reference, packet]]);
    const declared = evidenceReferenceEvidence(reference, pack, payloads);
    expect(declared).toHaveLength(2);
    expect(declared[1]!.payload).toEqual(packet);
    expect(() => renderDeclaredEvidenceRef(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "runtime.evidence_ref", version: 1 }, declared))).toThrow(/source.*label/u);
    expect(evidenceRefPresentation(reference, pack, payloads)).toEqual({ kind: "failed", reference });
  });
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
          values: {
            centipawns: 18,
            perspective: "white",
            engineName: "Stockfish",
            engineVersion: "18",
            depth: 17,
          },
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
      {
        seq: 3,
        jobId: "evidence-job-3",
        runId: "run-a",
        nodeId: "node-a",
        evidenceRefs: ["engine:evidence-job-3"] as const,
        payload: {
          kind: "bestline" as const,
          source: "engine_validated" as const,
          values: {
            movesUci: ["e2e4", "e7e5", "g1f3"],
            engineId: "stockfish-analysis",
            requestedDepth: 19,
          },
        },
      },
    ];
    const payloads = evidencePayloadTable(results);

    expect(renderEvidenceRef("engine:evidence-job-1", pack, payloads)).toMatchObject({
      text: "An engine reading belongs to this reference and is shown with its source. Attached engine evaluation: +0.18 pawns from White's side (Stockfish 18, depth 17; a bounded search reading, not a proof).",
      sourceLabel: "Engine",
      payload: { values: { centipawns: 18, perspective: "white" } },
    });
    expect(renderEvidenceRef("engine:evidence-job-2", pack, payloads)).toMatchObject({
      text: "A human-move model reading belongs to this reference and is shown with its source. Attached human-move model win/draw/loss reading: win 20%, draw 50%, loss 30% (perspective not recorded; human-move model).",
      sourceLabel: "Human model",
      payload: { values: { win: 0.2, draw: 0.5, loss: 0.3 } },
    });
    expect(renderEvidenceRef("engine:evidence-job-3", pack, payloads)).toMatchObject({
      text: "An engine reading belongs to this reference and is shown with its source. Attached engine line in board coordinates: e2–e4, e7–e5, g1–f3 (engine, requested depth 19).",
      sourceLabel: "Engine",
      payload: { values: { movesUci: ["e2e4", "e7e5", "g1f3"] } },
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
      text: "An exact tablebase reading belongs to this reference and is shown with its source. Attached exact tablebase reading: a draw for the side to move (5 pieces, DTZ 0).",
      sourceLabel: "Tablebase",
      payload,
    });
    expect(renderEvidenceRef("tablebase:pending", pack).text).toBe(
      "An exact tablebase reading belongs to this reference; its details are still pending.",
    );
  });

  it("keeps unknown refs explicit and refuses merged payloads", () => {
    expect(renderEvidenceRef("future:fact", pack)).toEqual({
      reference: "future:fact",
      text: "This reference names a recorded fact with no attached reading.",
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
