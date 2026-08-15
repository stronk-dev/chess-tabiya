import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { validatePackDocument } from "./pack-validation.js";
import { evidenceSupports, renderEngineMoveLoss } from "./sourcing/check.js";
import { engineWalk } from "./sourcing/engine-walk.js";
import { assessmentGrounding } from "./sourcing/ledger-validation.js";
import type { EvidenceLedger, EvidenceRecord, SourceManifest, SourcingIssue } from "./sourcing/types.js";

async function artifact(stem: string): Promise<{ pack: DrillPackDefinition; ledger: EvidenceLedger; manifest: SourceManifest }> {
  const root = resolve("content/drafts");
  return {
    pack: JSON.parse(await readFile(resolve(root, `${stem}.json`), "utf8")),
    ledger: JSON.parse(await readFile(resolve(root, `${stem}.evidence.json`), "utf8")),
    manifest: JSON.parse(await readFile(resolve(root, `${stem}.sources.json`), "utf8")),
  };
}

function grounding(pack: DrillPackDefinition, ledger: EvidenceLedger, manifest: SourceManifest): string {
  return assessmentGrounding({ document: pack, ledger, manifest });
}

describe("opening engine evidence", () => {
  it("migrates every non-browser opening draft into manifest-linked engine evidence", async () => {
    const names = (await readdir("content/drafts")).filter((name) => name.endsWith(".json") && !name.endsWith(".browser.json") && !name.endsWith(".evidence.json") && !name.endsWith(".sources.json") && !name.endsWith(".job.json"));
    const openings: string[] = [];
    for (const name of names) {
      const pack = JSON.parse(await readFile(resolve("content/drafts", name), "utf8")) as DrillPackDefinition & { provenance: Record<string, unknown> };
      if (pack.phase !== "opening") continue;
      openings.push(name);
      expect(pack.provenance.engineValidation, name).toBeUndefined();
      expect(pack.objective.grading?.assessedBy.kind, name).toBe("engine");
      const stem = name.slice(0, -5), value = await artifact(stem);
      expect(grounding(value.pack, value.ledger, value.manifest), name).toBe("ledger_verified");
      const root = value.ledger.records.find((record) => record.kind === "engine_eval" && record.supports.includes("/start/fen"));
      const source = value.manifest.entries.find((entry) => entry.sourceId === root?.sourceId && entry.retrievedAt === root?.retrievedAt);
      expect(source?.origin.kind, name).toBe("engine");
      if (source?.origin.kind === "engine") expect(source.origin.fen, name).toBe(pack.start.fen);
    }
    expect(openings).toHaveLength(20);
  });

  it("requires one exact root record and its exact engine instrument", async () => {
    const { pack, ledger, manifest } = await artifact("anti-caro-advance");
    expect(grounding(pack, ledger, manifest)).toBe("ledger_verified");
    const rootIndex = ledger.records.findIndex((record) => record.kind === "engine_eval" && record.supports.includes("/start/fen"));
    const mutations: Array<(next: any) => void> = [
      (next) => { next.ledger.records[rootIndex].kind = "position_legality"; },
      (next) => { next.ledger.records[rootIndex].grounds = "citable_source"; },
      (next) => { next.ledger.records[rootIndex].values.fen = "8/8/8/8/8/8/4k3/4K3 w - - 0 1"; },
      (next) => { if (next.ledger.records[rootIndex].values.centipawns !== undefined) next.ledger.records[rootIndex].values.centipawns += 1; else next.ledger.records[rootIndex].values.mateIn += 1; },
      (next) => { next.ledger.records[rootIndex].values.perspective = "black"; },
      (next) => { next.ledger.records[rootIndex].values.depth += 1; },
      (next) => { next.ledger.records[rootIndex].values.multiPv = 2; },
      (next) => { next.ledger.records[rootIndex].values.engineId = "other"; },
      (next) => { next.ledger.records[rootIndex].values.engineVersion = "other"; },
      (next) => { next.ledger.records[rootIndex].sourceId = "other"; },
      (next) => { next.ledger.records[rootIndex].retrievedAt = "2026-08-14T00:00:00.000Z"; },
      (next) => { next.ledger.records[rootIndex].supports = []; },
      (next) => { next.ledger.packId = "other"; },
      (next) => { const entry = next.manifest.entries.find((value: any) => value.sourceId === next.ledger.records[rootIndex].sourceId && value.retrievedAt === next.ledger.records[rootIndex].retrievedAt); entry.origin.kind = "http"; },
      (next) => { const entry = next.manifest.entries.find((value: any) => value.sourceId === next.ledger.records[rootIndex].sourceId && value.retrievedAt === next.ledger.records[rootIndex].retrievedAt); entry.origin.budget.depth += 1; },
      (next) => { const entry = next.manifest.entries.find((value: any) => value.sourceId === next.ledger.records[rootIndex].sourceId && value.retrievedAt === next.ledger.records[rootIndex].retrievedAt); entry.origin.engineVersion = "other"; },
      (next) => { const entry = next.manifest.entries.find((value: any) => value.sourceId === next.ledger.records[rootIndex].sourceId && value.retrievedAt === next.ledger.records[rootIndex].retrievedAt); entry.origin.profile.multiPv = 2; },
    ];
    for (const mutate of mutations) {
      const next = structuredClone({ pack, ledger, manifest });
      mutate(next);
      expect(grounding(next.pack, next.ledger, next.manifest)).toBe("unverified");
    }
    const duplicate = structuredClone(ledger) as any;
    duplicate.records.push(structuredClone(duplicate.records[rootIndex]));
    expect(grounding(pack, duplicate, manifest)).toBe("unverified");
  });

  it("walks engine positions without editing and refuses exhaustive enumeration", async () => {
    const { pack } = await artifact("anti-caro-advance");
    const evaluate = async (fen: string) => ({ source: { sourceId: "fixture", retrievedAt: "2026-08-15T00:00:00.000Z", origin: { kind: "engine" as const, engineId: "fixture", engineName: "Fixture", engineVersion: "1", profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: { depth: 22 }, fen, evidenceKind: "engine_eval" }, licence: { basis: "no-rights-asserted" as const, spdx: null, noticeText: null, rationale: "fixture" } }, values: { fen, centipawns: 0, depth: 22, perspective: "white", threads: 1, hashMb: 16, multiPv: 1, timeoutMs: 1, engineId: "fixture", engineName: "Fixture", engineVersion: "1" } });
    const report = await engineWalk({ pack, evaluate, maxQueries: 100 });
    expect((report.subject as any).instrument).toBe("engine");
    await expect(engineWalk({ pack, evaluate, enumerate: "all" })).rejects.toMatchObject({ code: "WALK_ENUMERATE_UNSUPPORTED" });
  });

  it("refuses inline provenance evidence mechanically", async () => {
    const { pack } = await artifact("anti-caro-advance");
    const invalid = structuredClone(pack) as any;
    invalid.provenance.engineValidation = {};
    expect(validatePackDocument(invalid).issues).toContainEqual(expect.objectContaining({ code: "PROVENANCE_EVIDENCE_INLINE", path: "/provenance/engineValidation" }));
  });

  it("keeps engine evidence out of human judgments and pins the move-loss template", async () => {
    const { pack } = await artifact("anti-caro-advance");
    const base: EvidenceRecord = { kind: "engine_eval", anchor: { fen: pack.start.fen }, sourceId: "fixture", retrievedAt: "2026-08-15T00:00:00.000Z", grounds: "machine_validation", values: { fen: pack.start.fen, centipawns: 20, perspective: "white", depth: 22, threads: 1, hashMb: 16, multiPv: 1, timeoutMs: 1, engineId: "fixture", engineName: "Stockfish", engineVersion: "18" }, supports: [] };
    for (const pointer of ["/deviations/0/class", "/deviations/0/offObjective", "/difficulty/label", "/checkpoints/0/label"]) {
      const issues: SourcingIssue[] = [];
      evidenceSupports(pack, { schema: "tabiya.sourcing.evidence.v1", sourcedAt: base.retrievedAt, records: [{ ...base, supports: [pointer] }], abstentions: [] }, undefined, issues);
      expect(issues, pointer).toContainEqual(expect.objectContaining({ code: "EVIDENCE_OVERREACH" }));
    }

    const values = { atFen: pack.start.fen, moveSan: "Bf5", bestSan: "c5", lossCp: 10, candidates: [{ san: "Bf5", uci: "c8f5", centipawns: 20 }, { san: "c5", uci: "c6c5", centipawns: 10 }], perspective: "white", depth: 22, threads: 1, hashMb: 16, multiPv: 1, timeoutMs: 1, engineId: "fixture", engineName: "Stockfish", engineVersion: "18" };
    const templatedPack = structuredClone(pack) as any;
    templatedPack.feedbackClaims[0].text = renderEngineMoveLoss(values);
    const record = { ...base, templateId: "engine-move-loss/v1", values, supports: ["/feedbackClaims/0/text"] };
    const valid: SourcingIssue[] = [];
    evidenceSupports(templatedPack, { schema: "tabiya.sourcing.evidence.v1", sourcedAt: base.retrievedAt, records: [record], abstentions: [] }, undefined, valid);
    expect(valid).toEqual([]);
    const invalid: SourcingIssue[] = [];
    evidenceSupports(templatedPack, { schema: "tabiya.sourcing.evidence.v1", sourcedAt: base.retrievedAt, records: [{ ...record, values: { ...values, lossCp: 11 } }, record], abstentions: [] }, undefined, invalid);
    expect(invalid.map((issue) => issue.code)).toEqual(expect.arrayContaining(["EVIDENCE_VALUES_INVALID", "EVIDENCE_TEMPLATE_CONFLICT"]));
  });
});
