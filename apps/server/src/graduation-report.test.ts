import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { describe, expect, it } from "vitest";

import { graduationReport } from "./graduation-report.js";
import { validatePackDocument } from "./pack-validation.js";
import { checkSourcingFile } from "./sourcing/check.js";

async function packFiles(root: string, includeBrowser = false): Promise<string[]> {
  return (await readdir(root)).filter((name) => name.endsWith(".json") && !/\.(?:evidence|job|sources)\.json$/u.test(name) && (includeBrowser || !name.endsWith(".browser.json"))).map((name) => resolve(root, name));
}

describe("pack graduation", () => {
  it("reports no legacy entries, no accidental graduable pack, and a fresh accepted page", async () => {
    const report = graduationReport();
    expect(report.legacy).toBe(0);
    expect(report.graduable).toEqual([]);
    expect(await readFile("content/accepted-conditions.md", "utf8")).toBe(report.acceptedPage);
    expect(report.text).toContain("content/candidates");
    expect(report.text).toContain("**anti-caro-advance-c5-race**");
    expect(report.text).toContain("clears via");
    expect(report.text).not.toMatch(/corpus-wide.*blocking/iu);
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
    for (const file of published) expect((await checkSourcingFile(file)).valid, file).toBe(true);
    const drafts = await packFiles("content/drafts");
    const failing: string[] = [];
    for (const file of drafts) if (!(await checkSourcingFile(file)).valid) failing.push(file);
    expect(failing.length, failing.join("\n")).toBeLessThanOrEqual(18);
  });
});
