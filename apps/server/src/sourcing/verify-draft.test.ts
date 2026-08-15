import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { afterEach, describe, expect, it } from "vitest";

import { assessmentGrounding } from "./ledger-validation.js";
import { TABLEBASE_RATIONALE, type TablebaseAnswer, type TablebasePayload } from "./syzygy.js";
import { verifyDraft } from "./verify-draft.js";

const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

function answer(fen: string, category: string): TablebaseAnswer {
  const payload: TablebasePayload = { checkmate: false, stalemate: false, insufficient_material: false, dtz: 1, precise_dtz: 1, dtm: null, category };
  return { payload, source: { sourceId: `fixture:${fen}`, retrievedAt: "2026-08-14T00:00:00.000Z", origin: { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: `sha256:${"1".repeat(64)}`, bytes: 1, etag: null }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: TABLEBASE_RATIONALE } } };
}

async function fixture(): Promise<{ directory: string; file: string; pack: DrillPackDefinition }> {
  const directory = await mkdtemp(join(tmpdir(), "tabiya-verify-draft-"));
  directories.push(directory);
  const pack = JSON.parse(await readFile("content/drafts/lucena-bridge-convert.json", "utf8")) as DrillPackDefinition;
  const file = join(directory, "lucena.json");
  await writeFile(file, JSON.stringify(pack), "utf8");
  return { directory, file, pack };
}

describe("verify-draft", () => {
  it("writes flat sidecars that earn the existing ledger_verified admission", async () => {
    const { file } = await fixture();
    const result = await verifyDraft(file, { query: async (fen) => answer(fen, fen.split(" ")[1] === "w" ? "win" : "loss"), now: () => new Date("2026-08-14T01:00:00.000Z") });
    expect(result.paths).toEqual({ ledger: file.replace(/\.json$/, ".evidence.json"), manifest: file.replace(/\.json$/, ".sources.json"), job: file.replace(/\.json$/, ".job.json") });
    expect(assessmentGrounding({ document: result.pack, ledger: result.ledger, manifest: result.manifest })).toBe("ledger_verified");
    expect(result.ledger.packDigest).toBe(await digestDrillPack(result.pack));
    expect(result.ledger.records.some((record) => record.supports[0]?.startsWith("/spine/"))).toBe(true);
    expect(result.ledger.records.some((record) => record.supports[0]?.startsWith("/deviations/"))).toBe(true);
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
