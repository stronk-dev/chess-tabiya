import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { afterEach, describe, expect, it } from "vitest";

import { checkSourcingFile } from "./check.js";
import { sha256 } from "./canonical.js";
import { assessmentGrounding, validateManifest } from "./ledger-validation.js";
import { TABLEBASE_RATIONALE, type TablebaseAnswer, type TablebasePayload } from "./syzygy.js";
import { verifyDraft } from "./verify-draft.js";

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

function answer(fen: string, category: string): TablebaseAnswer {
  const payload: TablebasePayload = { checkmate: false, stalemate: false, insufficient_material: false, dtz: 1, precise_dtz: 1, dtm: null, category };
  const retrievedAt = new Date(Date.parse("2026-08-14T00:00:00.000Z") + Number.parseInt(sha256(fen).slice(7, 13), 16)).toISOString();
  return { payload, source: { sourceId: "fixture-tablebase", retrievedAt, origin: { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: `sha256:${"1".repeat(64)}`, bytes: 1, etag: null }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: TABLEBASE_RATIONALE } } };
}

async function fixture(): Promise<{ directory: string; file: string; pack: DrillPackDefinition }> {
  const directory = await mkdtemp(join(tmpdir(), "tabiya-verify-draft-"));
  directories.push(directory);
  const pack = JSON.parse(await readFile(resolvePackPath("lucena-bridge-convert"), "utf8")) as DrillPackDefinition;
  const file = join(directory, "lucena.json");
  await writeFile(file, JSON.stringify(pack), "utf8");
  return { directory, file, pack };
}

async function engineFixture(): Promise<{ directory: string; file: string; pack: DrillPackDefinition }> {
  const directory = await mkdtemp(join(tmpdir(), "tabiya-verify-engine-draft-"));
  directories.push(directory);
  const pack = JSON.parse(await readFile(resolvePackPath("anti-caro-advance"), "utf8")) as DrillPackDefinition;
  const file = join(directory, "anti-caro.json");
  await writeFile(file, JSON.stringify(pack), "utf8");
  return { directory, file, pack };
}

describe("verify-draft", () => {
  it("reports machine-labelled claims even when their evidence ledger is absent", async () => {
    const { file, pack } = await engineFixture();
    const labelled = structuredClone(pack) as DrillPackDefinition & {
      feedbackClaims: Array<{ id: string; text: string; evidenceTypes: string[] }>;
    };
    labelled.feedbackClaims = [{
      id: "fixture-machine-label",
      text: "Fixture claim used only to exercise missing-ledger routing.",
      evidenceTypes: ["corpus_observed"],
    }];
    await writeFile(file, JSON.stringify(labelled), "utf8");
    const checked = await checkSourcingFile(file);
    expect(checked.issues.map((issue) => issue.code)).toContain("EVIDENCE_READ_ERROR");
    expect(checked.issues.map((issue) => issue.code)).toContain("EVIDENCE_TYPE_UNBACKED");
  });

  it("writes flat sidecars that earn the existing ledger_verified admission", async () => {
    const { file, pack } = await fixture();
    const firstDeviation = pack.deviations![0]!;
    const anchor = Chess.fromSetup(parseFen("fen" in firstDeviation.at ? firstDeviation.at.fen : pack.start.fen).unwrap()).unwrap();
    anchor.play(parseUci(firstDeviation.moveUci)!);
    const regressedFen = makeFen(anchor.toSetup());
    const result = await verifyDraft(file, { query: async (fen) => answer(fen, fen === regressedFen ? "win" : fen.split(" ")[1] === "w" ? "win" : "loss"), now: () => new Date("2026-08-14T01:00:00.000Z") });
    expect(result.paths).toEqual({ ledger: file.replace(/\.json$/, ".evidence.json"), manifest: file.replace(/\.json$/, ".sources.json"), job: file.replace(/\.json$/, ".job.json") });
    expect(assessmentGrounding({ document: result.pack, ledger: result.ledger, manifest: result.manifest })).toBe("ledger_verified");
    expect(result.ledger.packDigest).toBe(await digestDrillPack(result.pack));
    expect(result.ledger.records.some((record) => record.supports[0]?.startsWith("/spine/"))).toBe(true);
    expect(result.ledger.records.some((record) => record.supports[0]?.startsWith("/deviations/"))).toBe(true);
    expect(result.pack.deviations?.some((deviation) => deviation.cost?.kind === "category")).toBe(true);
    expect(result.pack.deviations?.find((deviation) => "fen" in deviation.at)?.cost).toMatchObject({
      kind: "category",
      basis: "tablebase",
    });
  });

  it("stamps current-invocation engine costs before digesting and is idempotent", async () => {
    const { file } = await engineFixture();
    const options = {
      offline: true,
      now: () => new Date("2026-08-16T00:00:00.000Z"),
    } as const;
    const first = await verifyDraft(file, options);
    const bound = first.pack.deviations?.filter((deviation) => deviation.cost?.kind === "cp" && deviation.cost.basis === "engine") ?? [];
    expect(bound.length).toBeGreaterThan(0);
    expect(first.ledger.packDigest).toBe(await digestDrillPack(first.pack));
    const firstPack = await readFile(file, "utf8");
    const second = await verifyDraft(file, options);
    expect(await readFile(file, "utf8")).toBe(firstPack);
    expect(second.ledger.packDigest).toBe(first.ledger.packDigest);
  });

  it("records offline tablebase fixtures as local input and does not grant ledger_verified", async () => {
    const { file } = await fixture();
    const result = await verifyDraft(file, {
      offline: true,
      now: () => new Date("2026-08-15T12:00:00.000Z"),
    });
    const tablebaseSource = result.manifest.entries.find((entry) => entry.sourceId === "syzygy-offline-fixture");
    expect(tablebaseSource?.origin.kind).toBe("local-file");
    expect(assessmentGrounding({ document: result.pack, ledger: result.ledger, manifest: result.manifest })).toBe("unverified");

    const forgedManifest = structuredClone(result.manifest) as any;
    const forged = forgedManifest.entries.find((entry: any) => entry.sourceId === "syzygy-offline-fixture");
    forged.origin = {
      kind: "http",
      url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(result.pack.start.fen)}`,
      status: 200,
      sha256: `sha256:${"2".repeat(64)}`,
      bytes: 2,
      etag: null,
    };
    await writeFile(result.paths.manifest, JSON.stringify(forgedManifest), "utf8");
    const checked = await checkSourcingFile(file);
    expect(checked.issues.map((issue) => issue.code)).toContain("OFFLINE_JOB_HTTP_PROVENANCE");
  });

  it("refuses the deterministic timestamp shape used by manufactured tablebase provenance", () => {
    const fen = "8/8/8/8/8/8/4k3/4K3 w - - 0 1";
    const offset = Number.parseInt(sha256(fen).slice(7, 15), 16) % 86_400_000;
    const issues: any[] = [];
    validateManifest({
      schema: "tabiya.sourcing.manifest.v1",
      entries: [{
        ...answer(fen, "draw").source,
        retrievedAt: new Date(Date.UTC(2026, 7, 14) + offset).toISOString(),
      }],
    }, issues);
    expect(issues.map((issue) => issue.code)).toContain("MANIFEST_PROVENANCE_SYNTHETIC");
  });

  it("refuses a contradicted declaration without writing sidecars", async () => {
    const { file } = await fixture();
    await expect(verifyDraft(file, { query: async (fen) => answer(fen, "draw") })).rejects.toMatchObject({ code: "VERIFY_ASSESSMENT_CONTRADICTED" });
    await expect(readFile(file.replace(/\.json$/, ".evidence.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("refuses an indeterminate queried root before writing sidecars", async () => {
    const { file } = await fixture();
    await expect(
      verifyDraft(file, { query: async (fen) => answer(fen, "unknown") }),
    ).rejects.toMatchObject({ code: "VERIFY_ASSESSMENT_INDETERMINATE" });
    await expect(
      readFile(file.replace(/\.json$/, ".evidence.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a learner spine category regression", async () => {
    const { file, pack } = await fixture();
    const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
    const first = parseUci(pack.spine![0]!.moveUci)!;
    root.play(first);
    const firstChild = makeFen(root.toSetup());
    await expect(verifyDraft(file, { query: async (fen) => answer(fen, fen === firstChild ? "win" : fen.split(" ")[1] === "w" ? "win" : "loss") })).rejects.toMatchObject({ code: "VERIFY_SPINE_CATEGORY_REGRESSION" });
  });

  it("records an opponent spine category regression as a warning", async () => {
    const { file, pack } = await fixture();
    const board = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
    const first = pack.spine![0]!;
    board.play(parseUci(first.moveUci)!);
    board.play(parseUci(first.children[0]!.moveUci)!);
    const opponentChild = makeFen(board.toSetup());
    const result = await verifyDraft(file, { query: async (fen) => answer(fen, fen === opponentChild ? "draw" : fen.split(" ")[1] === "w" ? "win" : "loss") });
    expect(result.warnings).toContainEqual(expect.stringContaining("opponent choice changes learner category win -> draw"));
  });
});
