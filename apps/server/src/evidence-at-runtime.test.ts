import { readdirSync, readFileSync } from "node:fs";

import { attachEvidence, createRun, renderRecordedReading, type RecordedReading } from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { PackRegistry, projectPackDocument } from "./pack-registry.js";
import { evidencePacket } from "./guidance.js";
import { buildPositionEvidenceIndex, recordedReadingsAt } from "./position-evidence.js";

const antiCaro = JSON.parse(readFileSync(new URL("../../../content/drafts/anti-caro-advance.json", import.meta.url), "utf8")) as DrillPackDefinition;
const antiCaroLedger = JSON.parse(readFileSync(new URL("../../../content/drafts/anti-caro-advance.evidence.json", import.meta.url), "utf8")) as any;
const antiCaroManifest = JSON.parse(readFileSync(new URL("../../../content/drafts/anti-caro-advance.sources.json", import.meta.url), "utf8")) as any;

describe("recorded evidence at runtime", () => {
  it("projects the current committed corpus without freezing a stale pack denominator", async () => {
    const registry = await PackRegistry.loadDefault({ development: true });
    const records = registry.list().map((summary) => registry.required(summary.id));
    const indexed = records.filter((record) => record.positionEvidence.size > 0);
    const readings = indexed.reduce((sum, record) => sum + [...record.positionEvidence.values()].reduce((inner, rows) => inner + rows.length, 0), 0);
    const entries = indexed.reduce((sum, record) => sum + record.positionEvidence.size, 0);
    expect(indexed).toHaveLength(32);
    expect(readings).toBe(732);
    expect(entries).toBe(731);
    expect(records.filter((record) => record.positionEvidence.size === 0)).toHaveLength(records.length - 32);
    expect(indexed.every((record) => record.assessmentGrounding === "ledger_verified")).toBe(true);

    const squares = Array.from({ length: 8 }, (_rank, rank) =>
      Array.from({ length: 8 }, (_file, file) => `${String.fromCharCode(97 + file)}${rank + 1}`),
    ).flat();
    for (const record of indexed) for (const rows of record.positionEvidence.values()) for (const reading of rows) {
      const sentence = renderRecordedReading(reading).join(" ").toLowerCase();
      expect(squares.some((square) => sentence.includes(square))).toBe(false);
    }

    const draftDirectory = new URL("../../../content/drafts/", import.meta.url);
    const evidenceFiles = readdirSync(draftDirectory).filter((name) => name.endsWith(".evidence.json"));
    const refusedLegality = evidenceFiles.reduce((count, name) => {
      const ledger = JSON.parse(readFileSync(new URL(name, draftDirectory), "utf8")) as { records?: { kind?: string }[] };
      return count + (ledger.records ?? []).filter((row) => row.kind === "position_legality").length;
    }, 0);
    expect(refusedLegality).toBe(32);
  });

  it("refuses digest-stale and unstamped ledgers without changing published grounding", async () => {
    for (const ledger of [
      { ...antiCaroLedger, packDigest: `sha256:${"0".repeat(64)}` },
      (() => { const value = { ...antiCaroLedger }; delete value.packDigest; return value; })(),
    ]) {
      const registry = await PackRegistry.fromDocuments([{ source: "anti-caro", value: antiCaro, ledger, manifest: antiCaroManifest }]);
      const record = registry.required(antiCaro.id);
      expect(record.assessmentGrounding).toBe("ledger_verified");
      expect(record.positionEvidence.size).toBe(0);
      expect(projectPackDocument(record.document, record.assessmentGrounding, record.channel)).toMatchObject({ objective: { grading: { grounding: "ledger_verified" } } });
    }
  });

  it("keeps verdict-shaped records and unknown values outside the allow-list", () => {
    const engine = antiCaroLedger.records.find((record: any) => record.kind === "engine_eval");
    const ledger = {
      ...antiCaroLedger,
      records: [
        { ...engine, templateId: "engine-move-loss/v1", values: { ...engine.values, bestSan: "e4", candidates: [{ san: "e4" }] } },
        { ...engine, values: { ...engine.values, perspective: "learner" } },
      ],
    };
    expect(buildPositionEvidenceIndex({ ledger, grounding: "ledger_verified", packDigest: antiCaroLedger.packDigest }).size).toBe(0);
  });

  it("keeps duplicate position keys, enforces tablebase clocks, and lets live evidence win", async () => {
    const registry = await PackRegistry.loadDefault({ development: true });
    const record = registry.required("lucena-bridge-convert");
    const duplicate = [...record.positionEvidence.values()].find((readings) => readings.length === 2)!;
    expect(duplicate).toHaveLength(2);

    const reading = duplicate[0] as Extract<RecordedReading, { kind: "tablebase_result" }>;
    let run = createRun({ id: "reading", packId: record.document.id, packDigest: record.digest, startFen: reading.fen, seed: 1, createdAt: "2026-08-16T00:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const node = run.nodes[0]!;
    expect(recordedReadingsAt(record.positionEvidence, node, run)).toHaveLength(1);
    const packet = evidencePacket({ run, node, pack: record.document, packEvidence: record.positionEvidence, authored: { items: [], hasWithheldAuthoredContent: false } });
    expect(packet.readings).toHaveLength(1);
    expect(packet.declared.some((item) => item.projection.id.startsWith("recorded."))).toBe(true);
    const mismatched = { ...node, fen: reading.fen.replace(/ (\d+) (\d+)$/u, (_all, halfmove, fullmove) => ` ${Number(halfmove) + 2} ${fullmove}`) };
    expect(recordedReadingsAt(record.positionEvidence, mismatched, run)).toHaveLength(0);

    run = attachEvidence(run, node.id, ["tablebase:live"], { kind: "tablebase", source: "tablebase_exact", values: { category: "loss" } }).run;
    expect(recordedReadingsAt(record.positionEvidence, node, run)).toHaveLength(0);
    expect(evidencePacket({ run, node, pack: record.document, packEvidence: record.positionEvidence, authored: { items: [], hasWithheldAuthoredContent: false } }).readings).toEqual([]);
  });

  it("keeps the new PackRecord field out of pack wire projections", async () => {
    const registry = await PackRegistry.loadDefault({ development: true });
    const record = registry.required("anti-caro-advance-c5-race");
    expect(record.positionEvidence.size).toBeGreaterThan(0);
    expect(JSON.stringify(projectPackDocument(record.document, record.assessmentGrounding, record.channel))).not.toContain("positionEvidence");
    expect(JSON.stringify(registry.list())).not.toContain("positionEvidence");
    const source = readFileSync(new URL("./position-evidence.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/EngineSupervisor|LichessTablebaseSource|ExplorerClient|\bfetch\b/);
  });
});
