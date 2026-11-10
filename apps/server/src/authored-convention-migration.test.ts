import { existsSync, linkSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import baseline from "../../../rfc/contracts/foundation-authored-convention-sites-v1.json" with { type: "json" };
import { STRUCTURAL_CONVENTION_REFS as REFS, type StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { authoredConventionMigrationReport } from "./authored-convention-migration.js";
import { runAuthoredConventionMigrationCLI } from "./authored-convention-migration-cli.js";

const paths: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const path of paths.splice(0)) rmSync(path, { recursive: true, force: true }); });
function directory() { const path = mkdtempSync(join(tmpdir(), "tabiya-convention-report-")); paths.push(path); return path; }
const blocked = "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1";
const opposition: StructuralExpression = { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct" } };
function fixture(fen: string, expression: StructuralExpression) {
  const root = directory(), shapes = directory(), file = join(root, "pack.json");
  const document = { id: "convention-report-fixture", version: "1.0.0", title: "Mechanical source comparison", mode: "plan", phase: "endgame",
    start: { fen, side: "white" }, objective: { type: "reach_structure", summary: "Mechanical source comparison", successConditions: [{ kind: "structural_feature", feature: expression }] },
    checkpoints: [{ id: "later", trigger: { atPly: 1 } }], opponentPolicy: { mode: "human_common", seedMode: "fixed" }, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "draft", sources: [], reviewers: [] }, requires: [],
  };
  writeFileSync(file, JSON.stringify(document));
  return { file, root, shapes, document, options: { roots: [root], shapeRoot: shapes } };
}
function compared(report: Awaited<ReturnType<typeof authoredConventionMigrationReport>>) {
  expect(report.sites).toHaveLength(1);
  const row = report.sites[0]!;
  if (row.status !== "compared") throw new Error(JSON.stringify(row));
  return row;
}

describe("read-only authored convention migration report", () => {
  it("compares the actual literal independently of an earlier true containing branch", async () => {
    const target = fixture(blocked, { kind: "any", of: [{ kind: "pieceOnSquare", square: "e1", piece: { color: "white", role: "king" } }, opposition] });
    const before = readFileSync(target.file, "utf8"), report = await authoredConventionMigrationReport(target.options), row = compared(report);
    expect(row.site).toMatchObject({ family: "king_opposition", pointer: "/objective/successConditions/0/feature/of/1/feature", contextPointer: "/objective/successConditions/0/feature" });
    expect(row.literal).toMatchObject({ cases: 1, paired: 1, changed: 1, legacyMatched: 1, successorMatched: 0 });
    expect(row.context).toMatchObject({ cases: 1, paired: 1, changed: 0, legacyMatched: 1, successorMatched: 1 });
    expect(row.samples[0]?.legacy.literal).toMatchObject({ kind: "available", trace: [expect.objectContaining({ leaf: expect.objectContaining({ projection: { id: "rules.structural.predicate.king_opposition", version: 1 } }) })] });
    expect(row.samples[0]?.successor.literal).toMatchObject({ kind: "available", matched: false, trace: [expect.objectContaining({ leaf: expect.objectContaining({ projection: { id: "rules.structural.predicate.king_opposition", version: 2 } }) })] });
    if (row.samples[0]?.successor.context.kind !== "available") throw new Error("Expected available containing condition");
    expect(row.samples[0].successor.context.trace.some(node => node.leaf !== undefined)).toBe(false);
    expect(row.successorRef).toEqual(REFS.king_opposition);
    expect(row.legacy.source).toMatchObject({ stage: "draft_validation", documentId: target.document.id, version: target.document.version });
    expect(row.successor.source.digest).not.toBe(row.legacy.source.digest);
    expect(row.decision).toBe("pending_author_review");
    expect(readFileSync(target.file, "utf8")).toBe(before);
    expect(JSON.parse(before).requires).toEqual([]);
    expect(report.population.actual).toEqual({ king_opposition: 1, backward_pawn: 0, outpost: 0 });
    expect(report.population.matches).toBe(false); // A small fixture is not the accepted36-site population.
    expect(report.comparisonComplete).toBe(false);
  });

  it.each([
    { family: "backward_pawn", fen: "7k/8/2p5/2p5/1P6/1P6/8/7K w - - 0 1", feature: { kind: "backward_pawn", color: "white", file: "b" } },
    { family: "outpost", fen: "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", feature: { kind: "outpost", color: "white", square: "e5" } },
  ] as const)("uses original/current sources for the $family pair", async ({ family, fen, feature }) => {
    const expression: StructuralExpression = { kind: "feature", feature }, target = fixture(fen, expression);
    const row = compared(await authoredConventionMigrationReport(target.options));
    expect(row.site.family).toBe(family); expect(row.successorRef).toEqual(REFS[family]);
    expect(row.literal).toMatchObject({ paired: 1, successorMatched: 1, legacyMatched: matchesStructuralExpression(fen, expression) ? 1 : 0 });
    expect(row.samples[0]?.successor.literal).toMatchObject({ kind: "available", matched: true, trace: [expect.objectContaining({ leaf: expect.objectContaining({ projection: { id: `rules.structural.predicate.${family}`, version: 2 } }) })] });
  });

  it("keeps unavailable evidence unpaired instead of describing no semantic change", async () => {
    const target = fixture(blocked, opposition), invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.king_opposition@3"
      ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input)) as typeof invoke);
    const row = compared(await authoredConventionMigrationReport(target.options));
    expect(row.literal).toMatchObject({ cases: 1, paired: 0, changed: 0, legacyAvailable: 1, successorAvailable: 0 });
    expect(row.samples[0]?.successor.literal).toEqual({ kind: "unavailable", reason: "source_dependency_unavailable" });
    expect(row.samples[0]?.successor.literal).not.toHaveProperty("matched");
  });

  it("does not strip an already selected convention or silently decide its author migration", async () => {
    const target = fixture(blocked, { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: REFS.king_opposition } });
    const before = readFileSync(target.file, "utf8"), report = await authoredConventionMigrationReport(target.options);
    expect(report.sites[0]).toMatchObject({ status: "blocked", decision: "pending_author_review", reason: expect.stringContaining("already selects") });
    expect(readFileSync(target.file, "utf8")).toBe(before);
  });

  it("is deterministic and retains repeated real corpus positions", async () => {
    const target = fixture(blocked, opposition), copy = { ...target.document, id: "second-occurrence" };
    copy.objective = { ...copy.objective, successConditions: [] };
    writeFileSync(join(target.root, "second.json"), JSON.stringify(copy));
    const first = await authoredConventionMigrationReport(target.options), row = compared(first);
    expect(first.population.positions).toBe(2);
    expect(row.literal).toMatchObject({ cases: 2, paired: 2, changed: 2 });
    expect(JSON.stringify(await authoredConventionMigrationReport(target.options))).toBe(JSON.stringify(first));
    expect(row.samples.length).toBeLessThanOrEqual(4);
  });

  it("refuses a count-preserving replacement of the accepted literal site population", async () => {
    const families = [
      ...Array.from({ length: 8 }, () => opposition),
      ...Array.from({ length: 5 }, (): StructuralExpression => ({ kind: "feature", feature: { kind: "backward_pawn", color: "white", file: "b" } })),
      ...Array.from({ length: 23 }, (): StructuralExpression => ({ kind: "feature", feature: { kind: "outpost", color: "white", square: "e5" } })),
    ];
    const target = fixture(blocked, { kind: "all", of: [families[0]!, ...families.slice(1)] }), report = await authoredConventionMigrationReport(target.options);
    expect(report.sites).toHaveLength(36);
    expect(report.population.actual).toEqual(report.population.expected);
    expect(report.population.countsMatch).toBe(true);
    expect(report.population.sitesMatch).toBe(false);
    expect(report.population.missingSites).toHaveLength(36);
    expect(report.population.additionalSites).toHaveLength(36);
    expect(report.comparisonComplete).toBe(false);
  });

  it("writes only an explicit diagnostic artifact, retains unknown scope and refuses input-directory output", async () => {
    const target = fixture(blocked, opposition), output = join(directory(), "comparison.json");
    const before = readFileSync(target.file, "utf8");
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const args = ["--corpus", target.root, "--shapes", target.shapes];
    expect(await runAuthoredConventionMigrationCLI([...args, "--out", output])).toBe(1);
    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report.decision).toBe("pending_author_review");
    expect(report.comparisonComplete).toBe(false);
    expect(stdout.mock.calls.map(([text]) => text).join("")).toContain("Comparison incomplete; author review pending");
    const forbidden = join(target.root, "generated-report.json");
    expect(await runAuthoredConventionMigrationCLI([...args, "--out", forbidden])).toBe(2);
    expect(existsSync(forbidden)).toBe(false);
    expect(await runAuthoredConventionMigrationCLI([...args, "--apply"])).toBe(2);
    expect(readFileSync(target.file, "utf8")).toBe(before);
  });

  it.each(["file", "directory", "nested directory"] as const)("refuses a real %s symlink from output into authored inputs", async kind => {
    const target = fixture(blocked, opposition), outputDirectory = directory(), before = readFileSync(target.file, "utf8");
    const link = join(outputDirectory, "alias");
    symlinkSync(kind === "file" ? target.file : target.root, link, kind === "file" ? "file" : "dir");
    const out = kind === "file" ? link : join(link, kind === "nested directory" ? "nested/generated.json" : "generated.json");
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await runAuthoredConventionMigrationCLI(["--corpus", target.root, "--shapes", target.shapes, "--out", out])).toBe(2);
    expect(readFileSync(target.file, "utf8")).toBe(before);
    expect(existsSync(join(target.root, "generated.json"))).toBe(false);
    expect(existsSync(join(target.root, "nested"))).toBe(false);
  });

  it("exposes illegal branches and their unreachable descendants instead of calling the legal subset complete", async () => {
    const target = fixture(blocked, opposition);
    const document = { ...target.document, spine: [{ id: "illegal", moveUci: "e1e8", moveSan: "Ke8", children: [{ id: "unreachable", moveUci: "e3d3", moveSan: "Kd3", children: [] }] }] };
    writeFileSync(target.file, JSON.stringify(document));
    const report = await authoredConventionMigrationReport(target.options);
    expect(report.population.positions).toBe(1);
    expect(report.population.replay).toMatchObject({ expectedPositions: 3, retainedPositions: 1, omittedPositions: 2 });
    expect(report.population.replay.faults).toEqual([expect.objectContaining({ file: target.file, packId: document.id, expectedPositions: 3, replayedPositions: 1, omittedPositions: 2 })]);
    expect(report.comparisonComplete).toBe(false);
  });

  it("makes replay omission alone fail comparison completeness within an otherwise matching inventory", async () => {
    const expressions: StructuralExpression[] = [
      ...Array.from({ length: 8 }, () => opposition),
      ...Array.from({ length: 5 }, (): StructuralExpression => ({ kind: "feature", feature: { kind: "backward_pawn", color: "white", file: "b" } })),
      ...Array.from({ length: 23 }, (): StructuralExpression => ({ kind: "feature", feature: { kind: "outpost", color: "white", square: "e5" } })),
    ];
    const target = fixture(blocked, { kind: "all", of: [expressions[0]!, ...expressions.slice(1)] });
    const discovered = await authoredConventionMigrationReport(target.options), originalInventory = [...baseline.sites];
    // Change only this test's inventory metadata; validators, actual replay and all source routes stay real.
    baseline.sites.splice(0, baseline.sites.length, ...discovered.sites.map(row => row.site));
    try {
      const positive = await authoredConventionMigrationReport(target.options);
      expect(positive.population.matches).toBe(true);
      expect(positive.comparisonComplete).toBe(true);
      writeFileSync(target.file, JSON.stringify({ ...target.document, spine: [{ id: "illegal", moveUci: "e1e8", moveSan: "Ke8", children: [] }] }));
      const omitted = await authoredConventionMigrationReport(target.options);
      expect(omitted.population.matches).toBe(true);
      expect(omitted.population.admissionFaults).toEqual([]);
      expect(omitted.sites.every(row => row.status === "compared" && row.literal.paired === omitted.population.positions && row.context.paired === omitted.population.positions)).toBe(true);
      expect(omitted.population.replay.omittedPositions).toBe(1);
      expect(omitted.comparisonComplete).toBe(false);
    } finally { baseline.sites.splice(0, baseline.sites.length, ...originalInventory); }
  });

  it("atomically replaces an output hard link without truncating its authored input", async () => {
    const target = fixture(blocked, opposition), output = join(directory(), "report.json"), before = readFileSync(target.file, "utf8");
    linkSync(target.file, output);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    expect(await runAuthoredConventionMigrationCLI(["--corpus", target.root, "--shapes", target.shapes, "--out", output])).toBe(1);
    expect(readFileSync(target.file, "utf8")).toBe(before);
    expect(JSON.parse(readFileSync(output, "utf8")).schema).toBe("tabiya.authored-convention-migration.v1");
  });

  it("keeps standalone literal truth separate from its transformed mirror context", async () => {
    const target = fixture(blocked, { kind: "all", of: [
      { kind: "pieceOnSquare", square: "e1", piece: { color: "white", role: "king" } },
      { kind: "mirrored", axis: "colors", of: opposition },
    ] });
    const report = await authoredConventionMigrationReport(target.options), row = compared(report);
    expect(report.literalScope).toContain("standalone");
    expect(report.counterfactualPolicy).toContain("one literal ref");
    expect(row.literal).toMatchObject({ changed: 1, legacyMatched: 1, successorMatched: 0 });
    expect(row.context).toMatchObject({ changed: 0, legacyMatched: 0, successorMatched: 0 });
    const context = row.samples[0]?.successor.context;
    if (context?.kind !== "available") throw new Error("Expected available mirrored context");
    expect(context.trace).toContainEqual(expect.objectContaining({ piece: { kind: "pieceOnSquare", square: "e1", piece: { color: "white", role: "king" } } }));
    expect(context.trace).toContainEqual(expect.objectContaining({ leaf: expect.objectContaining({ feature: expect.objectContaining({ kind: "king_opposition", color: "black", conventionRef: REFS.king_opposition }) }) }));
  });

  it("retains a quantified authored template while evaluating its actual expanded members", async () => {
    const target = fixture("7k/8/2p5/2p5/1P6/1P6/8/7K w - - 0 1", {
      kind: "quantified", quantifier: "some", over: { files: { from: "b", to: "b" } }, feature: { kind: "backward_pawn", color: "white" },
    });
    const row = compared(await authoredConventionMigrationReport(target.options));
    expect(row.successor.source.expression).toMatchObject({ kind: "quantified", feature: { kind: "backward_pawn", color: "white", conventionRef: REFS.backward_pawn } });
    expect(row.literal).toMatchObject({ cases: 1, paired: 1, successorMatched: 1 });
    const literal = row.samples[0]?.successor.literal;
    if (literal?.kind !== "available") throw new Error("Expected available quantified literal");
    expect(literal.trace).toContainEqual(expect.objectContaining({ leaf: expect.objectContaining({ projection: { id: "rules.structural.predicate.backward_pawn", version: 2 }, feature: expect.objectContaining({ file: "b" }) }) }));
  });
});
