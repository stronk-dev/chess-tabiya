import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { EMITTER_TEMPLATE_IDS } from "../graduation-blocker-templates.mjs";
import { graduationReport } from "../graduation-report.js";
import {
  clearGraduationEntries,
  createGraduationContentDeclaration,
  emitterGraduationClearance,
  evaluateGraduationClearance,
  GraduationClearanceError,
} from "./graduation-clear.js";

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
  pack.provenance.graduationBlockers = pack.provenance.graduationBlockers.map((entry: { id: string; statement: string }) => entry.id.startsWith("the-syzygy-root-assessment")
    ? {
        id: entry.id,
        state: "blocking",
        statement: entry.statement,
        clearance: { kind: "assessment_grounded", subject: "/objective/grading/assessedBy", instrument: "make verify-draft" },
      }
    : entry);
  await writeFile(file, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  const ledgerPath = file.replace(/\.json$/u, ".evidence.json");
  const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  ledger.packDigest = await digestDrillPack(pack);
  await writeFile(ledgerPath, `${JSON.stringify(ledger)}\n`, "utf8");
  return { directory, file };
}

describe("graduation clearance writer", () => {
  it("runs every registered emitter plan through false, true, and stale-false in production", async () => {
    const original = JSON.parse(await readFile(SOURCE, "utf8"));
    const ledger = JSON.parse(await readFile(SOURCE.replace(/\.json$/u, ".evidence.json"), "utf8"));
    const manifest = JSON.parse(await readFile(SOURCE.replace(/\.json$/u, ".sources.json"), "utf8"));
    const emptyLedger = { ...ledger, records: [] };
    const emptyManifest = { ...manifest, entries: [] };
    const at = "2026-09-08T12:00:00.000Z";
    const evaluate = async (pack: any, entryId: string, clearance: ReturnType<typeof emitterGraduationClearance>, grounded = true) =>
      evaluateGraduationClearance(
        pack,
        await digestDrillPack(pack),
        grounded ? ledger : emptyLedger,
        grounded ? manifest : emptyManifest,
        entryId,
        clearance,
        { subjects: [] },
      )?.holds;

    expect(EMITTER_TEMPLATE_IDS).toHaveLength(9);
    for (const entryId of EMITTER_TEMPLATE_IDS) {
      const pack = structuredClone(original);
      if (entryId === "outcome-ungraded") {
        pack.objective.type = "play_until_checkpoint";
        delete pack.objective.grading;
      }
      if (entryId === "target-elo-authored") pack.opponentPolicy = { mode: "human_common", targetElo: 1600, seedMode: "per_branch" };
      if (entryId === "authored-teaching-absent") {
        pack.planClasses = [];
        pack.deviations = [];
        pack.feedbackClaims = [];
      }
      if (entryId === "tablebase-opponent-not-selected") pack.opponentPolicy = { mode: "strong_engine" };
      const clearance = emitterGraduationClearance(pack, entryId);

      expect(await evaluate(pack, entryId, clearance, entryId !== "start-assessment-absent"), `${entryId}: emitted`).toBe(false);

      let current = clearance;
      switch (entryId) {
        case "mechanical-objective-placeholder":
          pack.objective.summary = `${pack.objective.summary} Authored consequence.`;
          current = { ...current, declaration: createGraduationContentDeclaration(pack, entryId, at) };
          break;
        case "outcome-ungraded":
          pack.objective = structuredClone(original.objective);
          break;
        case "start-assessment-absent":
          break;
        case "authored-teaching-absent":
          pack.feedbackClaims = [{ id: "author-supplied", text: "Author-supplied fixture.", evidenceTypes: ["author_principle"] }];
          current = { ...current, declaration: createGraduationContentDeclaration(pack, entryId, at) };
          break;
        case "tablebase-opponent-not-selected":
          pack.opponentPolicy = { mode: "perfect_tablebase" };
          break;
        default:
          current = { ...current, declaration: createGraduationContentDeclaration(pack, entryId, at) };
      }
      expect(await evaluate(pack, entryId, current), `${entryId}: true`).toBe(true);

      switch (entryId) {
        case "outcome-ungraded":
          delete pack.objective.grading;
          break;
        case "start-assessment-absent":
          break;
        case "target-elo-authored":
          pack.opponentPolicy.targetElo += 1;
          break;
        case "authored-teaching-absent":
          pack.feedbackClaims.push({ id: "changed", text: "Changed.", evidenceTypes: ["author_principle"] });
          break;
        case "opponent-policy-authored":
          pack.opponentPolicy = { mode: "strong_engine" };
          break;
        case "tablebase-opponent-not-selected":
          pack.opponentPolicy = { mode: "strong_engine" };
          break;
        case "recorded-play-needs-authoring":
          pack.spine = [...pack.spine, structuredClone(pack.spine[0])];
          break;
        default:
          pack.objective.summary = `${pack.objective.summary} changed`;
      }
      expect(await evaluate(pack, entryId, current, entryId !== "start-assessment-absent"), `${entryId}: stale`).toBe(false);
    }
  });

  it("evaluates registered exact-value and content-declaration plans without caller-selected operands", async () => {
    const pack = JSON.parse(await readFile(SOURCE, "utf8"));
    const ledger = JSON.parse(await readFile(SOURCE.replace(/\.json$/u, ".evidence.json"), "utf8"));
    const manifest = JSON.parse(await readFile(SOURCE.replace(/\.json$/u, ".sources.json"), "utf8"));
    const digest = await digestDrillPack(pack);
    const evaluate = (entryId: string, clearance: ReturnType<typeof emitterGraduationClearance>) =>
      evaluateGraduationClearance(pack, digest, ledger, manifest, entryId, clearance, { subjects: [] });

    pack.opponentPolicy = { mode: "strong_engine" };
    const exact = emitterGraduationClearance(pack, "tablebase-opponent-not-selected");
    expect(evaluate("tablebase-opponent-not-selected", exact)?.holds).toBe(false);
    pack.opponentPolicy = { mode: "perfect_tablebase" };
    expect(evaluate("tablebase-opponent-not-selected", exact)?.holds).toBe(true);
    expect(() => evaluate("tablebase-opponent-not-selected", { ...exact, expected: "strong_engine" })).toThrow(/registered plan field expected/u);

    pack.opponentPolicy = { mode: "human_common", targetElo: 1600, seedMode: "per_branch" };
    let declared = emitterGraduationClearance(pack, "target-elo-authored");
    expect(evaluate("target-elo-authored", declared)?.holds).toBe(false);
    declared = { ...declared, declaration: createGraduationContentDeclaration(pack, "target-elo-authored", "2026-09-08T12:00:00.000Z") };
    expect(evaluate("target-elo-authored", declared)?.holds).toBe(true);
    pack.opponentPolicy.targetElo = 1700;
    expect(evaluate("target-elo-authored", declared)?.holds).toBe(false);
  });

  it("keeps an unchanged generated objective and empty authored collections blocking", async () => {
    const pack = JSON.parse(await readFile(SOURCE, "utf8"));
    const ledger = JSON.parse(await readFile(SOURCE.replace(/\.json$/u, ".evidence.json"), "utf8"));
    const manifest = JSON.parse(await readFile(SOURCE.replace(/\.json$/u, ".sources.json"), "utf8"));
    const digest = await digestDrillPack(pack);
    const evaluate = (entryId: string, clearance: ReturnType<typeof emitterGraduationClearance>) =>
      evaluateGraduationClearance(pack, digest, ledger, manifest, entryId, clearance, { subjects: [] });

    let placeholder = emitterGraduationClearance(pack, "mechanical-objective-placeholder");
    placeholder = { ...placeholder, declaration: createGraduationContentDeclaration(pack, "mechanical-objective-placeholder", "2026-09-08T12:00:00.000Z") };
    expect(evaluate("mechanical-objective-placeholder", placeholder)?.holds).toBe(false);
    pack.objective.summary = `${pack.objective.summary} Authored consequence.`;
    placeholder = { ...placeholder, declaration: createGraduationContentDeclaration(pack, "mechanical-objective-placeholder", "2026-09-08T12:01:00.000Z") };
    expect(evaluate("mechanical-objective-placeholder", placeholder)?.holds).toBe(true);

    pack.planClasses = [];
    pack.deviations = [];
    pack.feedbackClaims = [];
    let teaching = emitterGraduationClearance(pack, "authored-teaching-absent");
    teaching = { ...teaching, declaration: createGraduationContentDeclaration(pack, "authored-teaching-absent", "2026-09-08T12:02:00.000Z") };
    expect(evaluate("authored-teaching-absent", teaching)?.holds).toBe(false);
    expect(() => createGraduationContentDeclaration(pack, "target-elo-authored", "yesterday")).toThrow(/RFC 3339/u);
  });

  it.each(FIRST_RUN_SOURCES)("resolves only the named first-run assessment entry in %s and records the digest transition", async (source) => {
    const { directory, file } = await fixture(source);
    try {
      const result = await clearGraduationEntries(file, { now: () => new Date("2026-08-23T12:00:00.000Z"), census: { subjects: [] } });
      expect(result.transitions).toHaveLength(1);
      expect(result.transitions[0]).toMatchObject({ from: "blocking", to: "resolved", clearance: { kind: "assessment_grounded" } });
      expect(result.held).toHaveLength(5);
      expect(result.held.every((entry) => entry.verdict === "no predicate" || entry.verdict === "does not hold")).toBe(true);
      expect(result.held.some((entry) => entry.verdict === "does not hold")).toBe(true);
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
