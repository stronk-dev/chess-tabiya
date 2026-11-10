import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STRUCTURAL_CONVENTION_REFS as REFS, type StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { authoredStructuralDocument, selectAuthoredStructuralCondition } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { captureAuthoredPredicatePopulation, readAuthoredPredicatePopulation } from "../../../packages/runtime/src/authored-predicate-population.js";
import { readAuthoredPredicateReductionValue } from "../../../packages/runtime/src/internal/authored-predicate-reduction-authority.js";
import * as bindingExecution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as structuralEvidence from "../../../packages/runtime/src/structural-evidence.js";
import * as authoredSources from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { authoredSpineFens } from "./pack-validation.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { validateShapeEntry } from "./shape-validation.js";
import { ShapeRegistry } from "./shape-registry.js";
import { runExpressionCensus } from "./expression-census.js";
import { censusIssuesForFile, checkShapeFile } from "./shape-check.js";
import { authoredExpressionSatisfiability, playAuthoredWitness } from "./expression-satisfiability.js";

const temporary: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
const directory = () => { const path = mkdtempSync(join(tmpdir(), "tabiya-authored-census-")); temporary.push(path); return path; };
const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const kings = "8/8/8/8/8/4k3/8/4K3 b - - 0 1";
const opposition: StructuralExpression = { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: REFS.king_opposition } };
const occupancy: StructuralExpression = { kind: "pieceOnSquare", square: "e5", piece: { color: "black", role: "pawn" } };
function shape(trigger: StructuralExpression = opposition): ShapeEntryDefinition {
  return { id: "census-source-fixture", version: "1.0.0", name: "Mechanical census fixture", phases: ["middlegame"], trigger,
    plans: (["white", "black"] as const).map(side => ({ id: side, side, label: "Occupancy", description: "Mechanical fixture", success: { note: "Mechanical fixture", signature: occupancy } })),
    watch: ["Mechanical fixture"], typicalMistakes: ["Mechanical fixture"], provenance: { licence: "CC0-1.0", sources: ["Mechanical fixture"], attribution: [{ title: "Mechanical fixture", author: "Tests", licence: "CC0-1.0" }] } };
}
function source(expression: StructuralExpression = opposition) {
  const checked = validateShapeEntry(shape(expression));
  if (checked.document === undefined) throw new Error(JSON.stringify(checked.issues));
  return selectAuthoredStructuralCondition(authoredStructuralDocument(checked.document), "/trigger");
}

describe("issuer-backed authored census and witnesses", () => {
  it("uses each explicit convention through the genuine current authoring path", () => {
    const expressions: StructuralExpression[] = [opposition,
      { kind: "feature", feature: { kind: "outpost", color: "white", square: "e5", conventionRef: REFS.outpost } },
      { kind: "feature", feature: { kind: "backward_pawn", color: "white", file: "e", conventionRef: REFS.backward_pawn } }];
    const invoke = routes.invokeEvidenceValueRoute, admitted: unknown[] = [];
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      const result = invoke(route, input);
      if (route === "authored.structural_condition.input@2" && "payload" in result) admitted.push(result.payload);
      return result;
    });
    for (const [index, expression] of expressions.entries()) {
      const result = playAuthoredWitness({ id: `explicit-${index}`, from: kings, sans: [], role: "reference", expect: index === 0 }, source(expression));
      expect(result).toMatchObject({ fen: kings, actual: index === 0 });
      expect(result.error).toBeUndefined();
    }
    expect(admitted).toEqual(expect.arrayContaining(expressions.map(expression => expect.objectContaining({ pointer: "/trigger", authoredNode: expression, origin: expect.objectContaining({ kind: "shape", stage: "draft_validation" }) }))));
  });

  it("refuses copied or retired source handles before corpus and witness shortcuts", async () => {
    const original = source();
    expect(() => authoredExpressionSatisfiability(structuredClone(original), [kings])).toThrow(/original|issuer/);
    expect(() => authoredExpressionSatisfiability(original, ["not a FEN"])).toThrow();
    expect(() => authoredExpressionSatisfiability(original, [kings, "not a FEN"])).toThrow();
    expect(() => authoredExpressionSatisfiability(original, [initial])).toThrow(/does not match/);
    expect(authoredExpressionSatisfiability(original, [kings])).toMatchObject({ verdict: "satisfiable", basis: "corpus", sampleFen: kings });
    const registry = new ShapeRegistry(); await registry.add(shape(), "community");
    const registered = selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(shape().id)!, "/trigger");
    await registry.add({ ...shape(), version: "1.0.1" }, "community");
    expect(() => authoredExpressionSatisfiability(registered, [kings])).toThrow(/current/);
    expect(playAuthoredWitness({ id: "retired", from: kings, sans: [], role: "reference", expect: true }, registered)).toMatchObject({ code: "WITNESS_EVALUATION_FAILED" });
  });

  it("keeps legal replay, actual false, illegal lines and unavailable evidence distinct", () => {
    const condition = source(), witness = { id: "legal-e4", from: initial, sans: ["e4"], role: "reference" as const, expect: false };
    expect(playAuthoredWitness(witness, condition)).toMatchObject({ actual: false, fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" });
    expect(playAuthoredWitness({ ...witness, sans: ["e5"] }, condition)).toMatchObject({ code: "WITNESS_LINE_ILLEGAL" });
    const invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.king_opposition@3" ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input)) as typeof invoke);
    const unavailable = playAuthoredWitness(witness, condition);
    expect(unavailable).toMatchObject({ code: "WITNESS_EVALUATION_FAILED", fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" });
    expect(unavailable).not.toHaveProperty("actual");
  });

  it("counts only typed root sites and does not register selected external drafts", async () => {
    const packs = directory(), shapes = directory(), drafts = directory();
    const pack = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    writeFileSync(join(packs, "pack.json"), JSON.stringify(pack));
    const external = join(drafts, "shape.json");
    writeFileSync(external, JSON.stringify(shape({ kind: "all", of: [{ kind: "pieceOnSquare", square: "e6", piece: { color: "black", role: "pawn" } }, { kind: "not", of: opposition }] })));
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [external] });
    expect(report.corpus.shapeEntries).toBe(0);
    expect(report.subjects.map(row => row.site.pointer).sort()).toEqual(["/plans/0/success/signature", "/plans/1/success/signature", "/trigger"]);
    expect(report.subjects.every(row => !row.observations.includes("EVALUATION_FAULT"))).toBe(true);
    expect(report.subjects.find(row => row.site.pointer === "/trigger")?.coverage.corpus.fires).toBeGreaterThan(0);
  });

  it("selects subject sources only for requested files while retaining the whole validated corpus", async () => {
    const packs = directory(), shapes = directory();
    const packFile = join(packs, "pack.json");
    writeFileSync(packFile, readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    const selected = join(shapes, "selected.json"), other = { ...shape(), id: "unselected-census-source-fixture" };
    writeFileSync(selected, JSON.stringify(shape()));
    writeFileSync(join(shapes, "other.json"), JSON.stringify(other));
    const full = await runExpressionCensus({ roots: [packs], shapeRoot: shapes });
    const original = authoredSources.selectAuthoredStructuralCondition;
    const visits: { id: string; pointer: string }[] = [];
    vi.spyOn(authoredSources, "selectAuthoredStructuralCondition").mockImplementation((document, pointer) => {
      const value = original(document, pointer);
      visits.push({ id: authoredSources.readAuthoredStructuralConditionSource(value).origin.documentId, pointer });
      return value;
    });
    const filtered = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [selected] });
    expect(filtered.corpus).toEqual(full.corpus);
    expect(filtered.evidence).toEqual(full.evidence);
    expect(filtered.subjects).toEqual(full.subjects.filter(row => row.site.subject.shape === shape().id));
    // Unselected shapes still undergo original trigger validation, without unused plan-source work.
    expect(visits).toContainEqual({ id: other.id, pointer: "/trigger" });
    expect(visits.some(visit => visit.id === other.id && visit.pointer.startsWith("/plans/"))).toBe(false);
    expect(filtered.corpus.packs).toBe(1); expect(filtered.corpus.positions).toBeGreaterThan(1);
    // File selection cannot conceal a duplicate id elsewhere in the population.
    writeFileSync(join(packs, "duplicate.json"), readFileSync(packFile, "utf8"));
    await expect(runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [selected] })).rejects.toThrow(/duplicate pack id/u);
  });

  it("reports source failure on empty corpora and trigger denominators instead of no-fire", async () => {
    const packs = directory(), shapes = directory();
    writeFileSync(join(shapes, "shape.json"), JSON.stringify(shape()));
    const invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.king_opposition@3" ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input)) as typeof invoke);
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes });
    // Dependency failure is visited by degenerate/witness probes even with no corpus.
    const trigger = report.subjects.find(row => row.site.pointer === "/trigger")!;
    expect(trigger.observations).toContain("EVALUATION_FAULT");
    expect(trigger.degenerateFaults?.length).toBeGreaterThan(0);
    // With actual corpus rows the unknown trigger must not become an empty denominator.
    writeFileSync(join(packs, "pack.json"), readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url)));
    const populated = await runExpressionCensus({ roots: [packs], shapeRoot: shapes });
    const plan = populated.subjects.find(row => row.site.pointer === "/plans/0/success/signature")!;
    expect(plan.coverage.inShape?.faults?.count).toBeGreaterThan(0);
    expect(plan.observations).toContain("EVALUATION_FAULT");
    expect(plan.observations).not.toContain("IN_SHAPE_DENOMINATOR_EMPTY");
    expect(plan.observations).not.toContain("NEVER_FIRES_IN_SHAPE");
  });

  it("includes actual plan-consequence and transition-position roots with registered dependencies", async () => {
    const packs = directory(), shapes = directory();
    const entry = shape(occupancy);
    writeFileSync(join(shapes, "shape.json"), JSON.stringify(entry));
    const pack = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    pack.shapes = [entry.id];
    pack.planClasses.push({ id: "mechanical", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } });
    pack.objective.successConditions = [
      { kind: "plan_consequence", planClassId: "mechanical" },
      { kind: "transition_feature", transition: { kind: "position", at: "after", expression: { kind: "not", of: opposition } } },
    ];
    const file = join(packs, "pack.json"); writeFileSync(file, JSON.stringify(pack));
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [file] });
    const consequence = report.subjects.find(row => row.site.pointer === "/objective/successConditions/0")!;
    const transition = report.subjects.find(row => row.site.pointer === "/objective/successConditions/1/transition/expression")!;
    expect(consequence.site.subject.kind).toBe("pack_plan_consequence");
    expect(transition.site.subject.kind).toBe("pack_transition_position");
    expect(consequence.observations).not.toContain("EVALUATION_FAULT");
    expect(transition.observations).not.toContain("EVALUATION_FAULT");
    expect(report.subjects.filter(row => row.site.pointer.startsWith("/objective/successConditions/1/transition/expression"))).toHaveLength(1);
    // Merely selecting an external draft cannot supply this dependency.
    const emptyRegistry = directory();
    const unavailable = await runExpressionCensus({ roots: [packs], shapeRoot: emptyRegistry, files: [file, join(shapes, "shape.json")] });
    const missing = unavailable.subjects.find(row => row.site.pointer === "/objective/successConditions/0")!;
    expect(missing.observations).toContain("EVALUATION_FAULT");
    expect(missing.observations).not.toContain("NEVER_FIRES_IN_CORPUS");
    expect(missing.satisfiability.verdict).toBe("unknown");
  });

  it("refuses duplicate registry identities rather than silently replacing a dependency", async () => {
    const shapes = directory();
    writeFileSync(join(shapes, "one.json"), JSON.stringify(shape()));
    writeFileSync(join(shapes, "two.json"), JSON.stringify({ ...shape(), version: "1.0.1" }));
    await expect(runExpressionCensus({ roots: [], shapeRoot: shapes })).rejects.toThrow(/duplicate shape id/);
  });

  it("delivers witness-only evaluation faults to the external-file CLI join", async () => {
    const packs = directory(), shapes = directory(), drafts = directory();
    writeFileSync(join(packs, "pack.json"), readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url)));
    const external = join(drafts, "shape.json");
    writeFileSync(external, JSON.stringify(shape()));
    const invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: { position?: { payload: { fen: string } } }) =>
      route === "rules.structural.reading.king_opposition@3" && input.position?.payload.fen === kings
        ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input as never)) as typeof invoke);
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [external], witnesses: {
      [`${external}#/trigger`]: [{ id: "only-this-witness-fails", from: kings, sans: [], role: "reference", expect: true }],
    } });
    const trigger = report.subjects.find(row => row.site.pointer === "/trigger")!;
    expect(trigger.coverage.corpus.faults).toBeUndefined();
    expect(trigger.degenerateFaults).toBeUndefined();
    expect(trigger.satisfiability).toMatchObject({ verdict: "unknown", witnesses: [{ code: "WITNESS_EVALUATION_FAILED", fen: kings }] });
    expect(trigger.observations).toContain("EVALUATION_FAULT");
    expect(report.totals.evaluationFaults).toBe(1);
    expect(censusIssuesForFile(report, external)).toEqual(expect.arrayContaining([expect.objectContaining({
      severity: "error", code: "STRUCTURAL_SOURCE_UNAVAILABLE", path: "/trigger", message: expect.stringContaining("source_dependency_unavailable"),
    })]));
    expect(censusIssuesForFile(report, join(drafts, "other.json"))).toEqual([]);
  });

  it("reuses only exact-source/full-FEN results while retaining every corpus occurrence", async () => {
    const packs = directory(), shapes = directory();
    const base = shape(), entry = { ...base, plans: base.plans.map(plan => ({ ...plan, success: { ...plan.success, signature: opposition } })) };
    writeFileSync(join(shapes, "shape.json"), JSON.stringify(entry));
    const template = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    const documents = [0, 1, 2].map(index => ({ ...structuredClone(template), id: `occurrence-${index}` }));
    documents[2]!.start.fen = documents[2]!.start.fen.replace(" 0 6", " 1 6");
    documents.forEach((document, index) => writeFileSync(join(packs, `${index}.json`), JSON.stringify(document)));
    const positions = documents.flatMap(document => authoredSpineFens(document));
    const unique = new Set(positions);
    expect(unique.size).toBeLessThan(positions.length);
    expect(unique.has(template.start.fen.replace(" 0 6", " 1 6"))).toBe(true);
    const match = structuralEvidence.matchesCurrentStructuralExpression, visits = new Map<string, string[]>();
    vi.spyOn(structuralEvidence, "matchesCurrentStructuralExpression").mockImplementation((fen, expression, purpose) => {
      const image = authoredSources.readAuthoredStructuralConditionSource(authoredSources.sourceForAuthoredExpression(expression));
      if (image.origin.documentId === entry.id && image.origin.stage === "draft_validation") visits.set(image.pointer, [...visits.get(image.pointer) ?? [], fen]);
      return match(fen, expression, purpose);
    });
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [join(shapes, "shape.json")], degenerates: false });
    expect(report.corpus.positions).toBe(positions.length);
    for (const row of report.subjects) {
      expect(row.coverage.corpus).toMatchObject({ of: positions.length, fires: 0 });
      expect(row.coverage.corpus.faults).toBeUndefined();
      expect(visits.get(row.site.pointer)?.length).toBe(unique.size);
      expect(new Set(visits.get(row.site.pointer))).toEqual(unique);
    }
    expect(visits.size).toBe(3); // Equal ASTs at different original pointers never share authority.
  });

  it("retries a failed duplicate instead of caching unavailable as false", async () => {
    const packs = directory(), shapes = directory();
    const document = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    for (let index = 0; index < 2; index++) writeFileSync(join(packs, `${index}.json`), JSON.stringify({ ...document, id: `retry-${index}` }));
    const file = join(shapes, "shape.json"); writeFileSync(file, JSON.stringify(shape()));
    const invoke = routes.invokeEvidenceValueRoute; let rootCalls = 0;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: { position?: { payload: { fen: string } } }) => {
      if (route === "rules.structural.reading.king_opposition@3" && input.position?.payload.fen === document.start.fen && ++rootCalls === 1) return { kind: "unavailable", reason: "source_dependency_unavailable" };
      return invoke(route as never, input as never);
    }) as typeof invoke);
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [file], degenerates: false });
    const trigger = report.subjects.find(row => row.site.pointer === "/trigger")!;
    expect(rootCalls).toBe(2);
    expect(trigger.coverage.corpus).toMatchObject({ fires: 0, of: report.corpus.positions-1, faults: { count: 1 } });
    expect(trigger.observations).toContain("EVALUATION_FAULT");
    expect(trigger.observations).not.toContain("NEVER_FIRES_IN_CORPUS");
  });

  it("rejects actual registered dependency retirement after a successful cached evaluation", async () => {
    const packs = directory(), shapes = directory(), entry = shape(occupancy);
    const replacement = { ...entry, version: "1.0.1" }, replacementDigest = await digestShapeEntry(replacement);
    writeFileSync(join(shapes, "shape.json"), JSON.stringify(entry));
    const pack = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    pack.shapes = [entry.id];
    pack.planClasses.push({ id: "mechanical", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } });
    pack.objective.successConditions = [{ kind: "plan_consequence", planClassId: "mechanical" }];
    const file = join(packs, "pack.json"); writeFileSync(file, JSON.stringify(pack));
    let registry: ShapeRegistry | undefined, warmed = false, readsAfterWarm = 0, replaced = false;
    const add = ShapeRegistry.prototype.add;
    vi.spyOn(ShapeRegistry.prototype, "add").mockImplementation(function (this: ShapeRegistry, ...args) { registry = this; return add.apply(this, args); });
    const read = authoredSources.readAuthoredStructuralConditionSource, match = structuralEvidence.matchesCurrentStructuralExpression;
    vi.spyOn(structuralEvidence, "matchesCurrentStructuralExpression").mockImplementation((fen, expression, purpose) => {
      const result = match(fen, expression, purpose);
      const image = read(authoredSources.sourceForAuthoredExpression(expression));
      if (image.origin.documentId === pack.id && image.pointer === "/objective/successConditions/0") warmed = true;
      return result;
    });
    vi.spyOn(authoredSources, "readAuthoredStructuralConditionSource").mockImplementation(source => {
      const image = read(source);
      if (warmed && image.origin.documentId === pack.id && ++readsAfterWarm === 2) {
        // A genuine precomputed digest lets the real async registry replace synchronously;
        // no fake source, mutable-record shortcut or alternate evaluator is supplied.
        void registry!.add(replacement, "community", undefined, replacementDigest);
        replaced = true;
      }
      return read(source);
    });
    await expect(runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [file], degenerates: false })).rejects.toThrow(/current/);
    expect(warmed).toBe(true); expect(replaced).toBe(true);
  });

  it("distinguishes actual standalone compiler refusal from unreadable JSON and invalid schema", async () => {
    const root = directory(), file = join(root, "shape.json");
    writeFileSync(file, JSON.stringify(shape()));
    expect((await checkShapeFile(file)).valid).toBe(true);
    vi.spyOn(bindingExecution, "compileEvidenceConsumerExecutionV2").mockImplementation(() => { throw new TypeError("actual authoring admission refused"); });
    const refused = await checkShapeFile(file);
    expect(refused.valid).toBe(false);
    expect(refused.issues).toEqual([expect.objectContaining({ source: "runtime", code: "STRUCTURAL_SOURCE_UNAVAILABLE", message: "actual authoring admission refused" })]);
    vi.restoreAllMocks();
    expect((await checkShapeFile(join(root, "missing.json"))).issues).toEqual([expect.objectContaining({ source: "schema", code: "FILE_READ_ERROR" })]);
    writeFileSync(file, "{");
    expect((await checkShapeFile(file)).issues).toEqual([expect.objectContaining({ source: "schema", code: "FILE_READ_ERROR" })]);
    writeFileSync(file, "{}");
    const schema = await checkShapeFile(file);
    expect(schema.valid).toBe(false);
    expect(schema.issues.length).toBeGreaterThan(0);
    expect(schema.issues.every(issue => issue.source === "schema" && issue.code.startsWith("SCHEMA_"))).toBe(true);
  });

  it("preserves positive corpus, own-pack and trigger coverage against an unoptimized finite census", async () => {
    const packs = directory(), shapes = directory();
    const trigger: StructuralExpression = { kind: "pieceOnSquare", square: "e6", piece: { color: "black", role: "pawn" } };
    const signature: StructuralExpression = { kind: "pieceOnSquare", square: "b5", piece: { color: "black", role: "pawn" } };
    const base = shape(trigger), entry = { ...base, plans: base.plans.map(plan => ({ ...plan, success: { ...plan.success, signature } })) };
    const shapeFile = join(shapes, "shape.json"); writeFileSync(shapeFile, JSON.stringify(entry));
    const template = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
    template.objective.successConditions = [{ kind: "structural_feature", feature: signature }];
    const documents = [0, 1].map(index => ({ ...structuredClone(template), id: `positive-${index}` }));
    const files = documents.map((document, index) => { const file = join(packs, `${index}.json`); writeFileSync(file, JSON.stringify(document)); return file; });
    const plyNumber = (fen: string) => { const fields = fen.split(" "); return Number(fields[5])*2 + (fields[1] === "b" ? 1 : 0); };
    const positions = documents.flatMap(document => authoredSpineFens(document).map(fen => ({ packId: document.id, ply: plyNumber(fen)-plyNumber(document.start.fen), fen })));
    // Deliberately recompute every occurrence for this rules-only reference table.
    const hits = positions.filter(position => matchesStructuralExpression(position.fen, signature));
    const eligible = positions.filter(position => matchesStructuralExpression(position.fen, trigger));
    expect(hits.length).toBeGreaterThan(0); expect(eligible.length).toBeGreaterThan(hits.length);
    const report = await runExpressionCensus({ roots: [packs], shapeRoot: shapes, files: [files[0]!, shapeFile], degenerates: false });
    const pack = report.subjects.find(row => row.site.subject.pack === documents[0]!.id && row.site.pointer === "/objective/successConditions/0/feature")!;
    const plan = report.subjects.find(row => row.site.pointer === "/plans/0/success/signature")!;
    const expected = { fires: hits.length, of: positions.length,
      packs: documents.map(document => ({ id: document.id, count: hits.filter(row => row.packId === document.id).length })),
      plies: [...new Set(hits.map(row => row.ply))], samples: hits.slice(0, 3) };
    expect(pack.coverage.corpus).toEqual(expected);
    expect(plan.coverage.corpus).toEqual(expected);
    expect(pack.coverage.inPack).toEqual({ fires: hits.filter(row => row.packId === documents[0]!.id).length, of: positions.filter(row => row.packId === documents[0]!.id).length });
    expect(plan.coverage.inShape).toEqual({ basis: { kind: "shape_trigger", shape: entry.id }, fires: hits.filter(hit => eligible.includes(hit)).length, of: eligible.length });
  });

  it("reuses only the original immutable authored input and refuses it after actual registry retirement", async () => {
    const registry = new ShapeRegistry(); await registry.add(shape(), "community");
    const document = registry.captureAuthoredStructuralDocument(shape().id)!;
    const original = selectAuthoredStructuralCondition(document, "/trigger");
    const first = routes.invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: original });
    expect(routes.invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: original })).toBe(first);
    expect(routes.readAuthoredStructuralInput(first)).toBe(original);
    const different = selectAuthoredStructuralCondition(document, "/trigger");
    const other = routes.invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: different });
    expect(other.payload).toEqual(first.payload); expect(other).not.toBe(first);
    expect(routes.readAuthoredStructuralInput(other)).toBe(different);
    expect(() => routes.invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: structuredClone(original) })).toThrow();
    const fens = [kings, "8/8/8/8/8/4k3/4P3/4K3 b - - 0 1"];
    const populations = fens.map(fen => {
      const position = routes.invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
      const population = captureAuthoredPredicatePopulation(original, position);
      if (population.kind !== "available") throw new Error(population.reason);
      const data = readAuthoredPredicatePopulation(population.value);
      expect(data.condition).toBe(first); expect(data.position).toBe(position);
      const result = routes.invokeEvidenceValueRoute("derived.structural.predicate_result@2", { population: population.value });
      readAuthoredPredicateReductionValue(result, population.value);
      return { population: population.value, result };
    });
    expect(populations.map(row => row.result.payload.observation.matched)).toEqual([true, false]);
    expect(populations[0]!.result).not.toBe(populations[1]!.result);
    expect(() => readAuthoredPredicateReductionValue(populations[1]!.result, populations[0]!.population)).toThrow();
    // Same bytes/digest still replace the actual registry record identity.
    await registry.add(shape(), "community");
    expect(() => routes.invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: original })).toThrow();
    expect(() => routes.readAuthoredStructuralInput(first)).toThrow(/current/);
  });
});
