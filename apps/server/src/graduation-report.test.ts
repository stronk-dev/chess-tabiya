import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { describe, expect, it } from "vitest";

import { graduationReport, runGraduationReport } from "./graduation-report.js";
import { validatePackDocument } from "./pack-validation.js";
import { checkSourcingFile } from "./sourcing/check.js";

async function packFiles(root: string, includeBrowser = false): Promise<string[]> {
  return (await readdir(root)).filter((name) => name.endsWith(".json") && !/\.(?:evidence|job|sources)\.json$/u.test(name) && (includeBrowser || !name.endsWith(".browser.json"))).map((name) => resolve(root, name));
}

describe("pack graduation", () => {
  it("reports no legacy entries, no accidental graduable pack, and a fresh accepted page", async () => {
    const report = await graduationReport();
    expect(report.legacy).toBe(0);
    expect(report.graduable).toEqual([]);
    expect(await readFile("content/accepted-conditions.md", "utf8")).toBe(report.acceptedPage);
    expect(report.text).toContain("content/candidates");
    expect(report.text).toContain("**anti-caro-advance-c5-race**");
    expect(report.text).toContain("clears via");
    expect(report.text).not.toMatch(/corpus-wide.*blocking/iu);
  });

  it("keeps measurement read-only unless accepted-page refresh is explicit", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "tabiya-graduation-report-"));
    const acceptedPage = join(temporary, "accepted-conditions.md");
    try {
      const report = await runGraduationReport({ acceptedPagePath: acceptedPage });
      await expect(readFile(acceptedPage, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
      const refreshed = await runGraduationReport({ updateAcceptedPage: true, acceptedPagePath: acceptedPage });
      expect(await readFile(acceptedPage, "utf8")).toBe(refreshed.acceptedPage);
      expect(refreshed.text).toBe(report.text);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it("resolves one moved pack from either catalogue root and refuses a stale duplicate", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "tabiya-graduation-"));
    const drafts = join(temporary, "drafts");
    const packs = join(temporary, "packs");
    await mkdir(drafts); await mkdir(packs);
    const source = resolvePackPath("anti-caro-advance");
    const draftPath = join(drafts, basename(source));
    try {
      await copyFile(source, draftPath);
      expect(resolvePackPath("anti-caro-advance", [drafts, packs])).toBe(draftPath);
      const published = JSON.parse(await readFile(draftPath, "utf8"));
      published.provenance.reviewStatus = "published";
      published.provenance.graduationBlockers = published.provenance.graduationBlockers.filter((entry: { state: string }) => entry.state !== "blocking");
      await writeFile(draftPath, `${JSON.stringify(published, null, 2)}\n`);
      for (const suffix of ["evidence", "sources"] as const) await copyFile(source.replace(/\.json$/u, `.${suffix}.json`), draftPath.replace(/\.json$/u, `.${suffix}.json`));
      const ledgerPath = draftPath.replace(/\.json$/u, ".evidence.json");
      const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
      ledger.packDigest = await digestDrillPack(published);
      await writeFile(ledgerPath, `${JSON.stringify(ledger)}\n`);
      for (const suffix of ["json", "evidence.json", "sources.json"] as const) {
        const from = suffix === "json" ? draftPath : draftPath.replace(/\.json$/u, `.${suffix}`);
        await rename(from, from.replace(drafts, packs));
      }
      const promotedPath = join(packs, basename(source));
      expect(resolvePackPath("anti-caro-advance", [drafts, packs])).toBe(promotedPath);
      expect((await checkSourcingFile(promotedPath)).valid).toBe(true);
      await copyFile(promotedPath, draftPath);
      expect(() => resolvePackPath("anti-caro-advance", [drafts, packs])).toThrow(/more than one catalogue root/u);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it("fails legacy entries closed and pins accepted citations", async () => {
    const base = JSON.parse(await readFile("schemas/drill_pack.example.json", "utf8"));
    const legacy = structuredClone(base); legacy.provenance.graduationBlockers = ["old blocker"];
    expect(validatePackDocument(legacy).issues).toContainEqual(expect.objectContaining({ code: "GRADUATION_ENTRY_LEGACY_SHAPE", severity: "warning" }));
    const accepted = structuredClone(base); accepted.provenance.graduationBlockers = [{ id: "false-ruling", state: "accepted", statement: "Accepted by assertion.", accepted: { kind: "owner_ruling", ruling: "Owner ruling 2026-08-16", rulingRef: "missing.md" } }];
    expect(validatePackDocument(accepted).issues).toContainEqual(expect.objectContaining({ code: "GRADUATION_RULING_UNCITED" }));
  });

  it("gates every published pack strictly and keeps draft sourcing debt from growing", async () => {
    const published = await packFiles("content/packs");
    for (const file of published) {
      const result = await checkSourcingFile(file);
      expect(result.valid, file).toBe(true);
      expect(result.issues, file).not.toContainEqual(expect.objectContaining({ code: "EVIDENCE_DIGEST_STALE" }));
    }
    const drafts = await packFiles("content/drafts");
    const failing: string[] = [];
    for (const file of drafts) if (!(await checkSourcingFile(file)).valid) failing.push(file);
    expect(failing.length, failing.join("\n")).toBeLessThanOrEqual(18);
  });

  it("withholds an otherwise-graduable pack until its evidence digest is re-confirmed", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "tabiya-graduation-freshness-"));
    try {
      const source = resolvePackPath("anti-caro-advance");
      const packPath = join(temporary, basename(source));
      await copyFile(source, packPath);
      const pack = JSON.parse(await readFile(packPath, "utf8"));
      pack.provenance.graduationBlockers = [];
      await writeFile(packPath, `${JSON.stringify(pack, null, 2)}\n`);
      const ledgerPath = packPath.replace(/\.json$/u, ".evidence.json");
      await copyFile(source.replace(/\.json$/u, ".evidence.json"), ledgerPath);

      const stale = await graduationReport([temporary]);
      expect(stale.graduable).toEqual([]);
      expect(stale.evidenceDigests).toMatchObject({ paired: 1, fresh: 0, stale: 1, invalid: 0, withheld: [pack.id] });

      const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
      ledger.packDigest = await digestDrillPack(pack);
      await writeFile(ledgerPath, `${JSON.stringify(ledger)}\n`);
      const fresh = await graduationReport([temporary]);
      expect(fresh.graduable).toEqual([pack.id]);
      expect(fresh.evidenceDigests).toMatchObject({ paired: 1, fresh: 1, stale: 0, invalid: 0, withheld: [] });

      await writeFile(ledgerPath, "{ malformed", "utf8");
      const invalid = await graduationReport([temporary]);
      expect(invalid.graduable).toEqual([]);
      expect(invalid.evidenceDigests).toMatchObject({ paired: 1, fresh: 0, stale: 0, invalid: 1, withheld: [pack.id] });
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
