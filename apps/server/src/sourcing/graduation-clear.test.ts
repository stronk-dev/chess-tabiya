import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { graduationReport } from "../graduation-report.js";
import { clearGraduationEntries, GraduationClearanceError } from "./graduation-clear.js";

const SOURCE = resolve("content/drafts/mate-k-q-technique.json");
const FIRST_RUN_SOURCES = [
  "mate-k-q-technique",
  "mate-k-r-technique",
  "mate-two-bishops",
  "philidor-passive-rook-convert",
].map((id) => resolve(`content/drafts/${id}.json`));

async function fixture(source = SOURCE): Promise<{ directory: string; file: string }> {
  const directory = await mkdtemp(join(tmpdir(), "tabiya-graduation-clear-"));
  const file = join(directory, basename(source));
  await Promise.all([
    copyFile(source, file),
    copyFile(source.replace(/\.json$/u, ".evidence.json"), file.replace(/\.json$/u, ".evidence.json")),
    copyFile(source.replace(/\.json$/u, ".sources.json"), file.replace(/\.json$/u, ".sources.json")),
  ]);
  const pack = JSON.parse(await readFile(file, "utf8"));
  pack.provenance.graduationBlockers = pack.provenance.graduationBlockers.map((entry: { id: string }) => entry.id.startsWith("the-syzygy-root-assessment")
    ? { ...entry, clearance: { kind: "assessment_grounded", subject: "/objective/grading/assessedBy", instrument: "make verify-draft" } }
    : entry);
  await writeFile(file, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  const ledgerPath = file.replace(/\.json$/u, ".evidence.json");
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  ledger.packDigest = await digestDrillPack(pack);
  await writeFile(ledgerPath, `${JSON.stringify(ledger)}\n`, "utf8");
  return { directory, file };
}

describe("graduation clearance writer", () => {
  it.each(FIRST_RUN_SOURCES)("resolves only the named first-run assessment entry in %s and records the digest transition", async (source) => {
    const { directory, file } = await fixture(source);
    try {
      const result = await clearGraduationEntries(file, { now: () => new Date("2026-08-23T12:00:00.000Z"), census: { subjects: [] } });
      expect(result.transitions).toHaveLength(1);
      expect(result.transitions[0]).toMatchObject({ from: "blocking", to: "resolved", clearance: { kind: "assessment_grounded" } });
      expect(result.held).toHaveLength(5);
      expect(result.held.every((entry) => entry.verdict === "no predicate")).toBe(true);
      const pack = JSON.parse(await readFile(file, "utf8"));
      const resolved = pack.provenance.graduationBlockers.find((entry: { id: string }) => entry.id === result.transitions[0]!.id);
      expect(resolved.resolved.clearance).toEqual(result.transitions[0]!.clearance);
      const ledger = JSON.parse(await readFile(file.replace(/\.json$/u, ".evidence.json"), "utf8"));
      expect(ledger.packDigest).toBe(await digestDrillPack(pack));
      expect(JSON.parse(await readFile(file.replace(/\.json$/u, ".graduation.json"), "utf8"))).toEqual(result);
      expect((await graduationReport([directory])).text).toContain("documents: 1;");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("is read-only in check mode", async () => {
    const { directory, file } = await fixture();
    try {
      const before = await readFile(file, "utf8");
      const result = await clearGraduationEntries(file, { check: true, census: { subjects: [] } });
      expect(result.transitions).toHaveLength(1);
      expect(await readFile(file, "utf8")).toBe(before);
      await expect(readFile(file.replace(/\.json$/u, ".graduation.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("refuses a newly introduced already-holding predicate before writing anything", async () => {
    const { directory, file } = await fixture();
    try {
      const pack = JSON.parse(await readFile(file, "utf8"));
      pack.id = "not-a-first-run-exemption";
      pack.provenance.graduationBlockers = [{ id: "authored", state: "blocking", statement: "Replace placeholder.", clearance: { kind: "pointer_authored", subject: "/objective/summary", placeholder: "not the current summary", instrument: "author" } }];
      await writeFile(file, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
      const before = await readFile(file, "utf8");
      await expect(clearGraduationEntries(file, { census: { subjects: [] } })).rejects.toMatchObject({ code: "GRADUATION_CLEARANCE_VACUOUS" } satisfies Partial<GraduationClearanceError>);
      expect(await readFile(file, "utf8")).toBe(before);
      await expect(readFile(file.replace(/\.json$/u, ".graduation.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("does not widen a named first-run exemption to another blocker in the same pack", async () => {
    const { directory, file } = await fixture();
    try {
      const pack = JSON.parse(await readFile(file, "utf8"));
      pack.provenance.graduationBlockers.push({
        id: "second-assessment-grounding-claim",
        state: "blocking",
        statement: "A second blocker must not borrow the historical exemption.",
        clearance: {
          kind: "assessment_grounded",
          subject: "/objective/grading/assessedBy",
          instrument: "make verify-draft",
        },
      });
      await writeFile(file, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
      const ledgerPath = file.replace(/\.json$/u, ".evidence.json");
      const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
      ledger.packDigest = await digestDrillPack(pack);
      await writeFile(ledgerPath, `${JSON.stringify(ledger)}\n`, "utf8");

      const beforePack = await readFile(file, "utf8");
      const beforeLedger = await readFile(ledgerPath, "utf8");
      await expect(clearGraduationEntries(file, { census: { subjects: [] } })).rejects.toMatchObject({
        code: "GRADUATION_CLEARANCE_VACUOUS",
      } satisfies Partial<GraduationClearanceError>);
      expect(await readFile(file, "utf8")).toBe(beforePack);
      expect(await readFile(ledgerPath, "utf8")).toBe(beforeLedger);
      await expect(readFile(file.replace(/\.json$/u, ".graduation.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
