import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { digestDrillPack, STRUCTURAL_CONVENTION_REFS, type DrillPackDefinition, type StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { declareEvidence, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { authoredStructuralDocument, captureRegisteredShapeStructuralDocument, readAuthoredStructuralConditionSource, selectAuthoredStructuralCondition, sourceForAuthoredExpression } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { invokeEvidenceValueRoute, readAuthoredStructuralInput } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { validateShapeEntry } from "./shape-validation.js";
import { authoredSpineFens, validatePackDocument } from "./pack-validation.js";
import { ShapeRegistry } from "./shape-registry.js";
import { PackRegistry } from "./pack-registry.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { captureAuthoredPredicatePopulation, readAuthoredPredicatePopulation } from "../../../packages/runtime/src/authored-predicate-population.js";
import { readAuthoredPredicateReductionValue } from "../../../packages/runtime/src/internal/authored-predicate-reduction-authority.js";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { expandStructuralExpression, planSignatureResolver } from "./pack-orchestrator.js";
import { createRun, evaluateObjectivePredicate } from "@chess-tabiya/runtime";

afterEach(() => vi.restoreAllMocks());

const occupancy: StructuralExpression = { kind: "pieceOnSquare", square: "e5", piece: { color: "black", role: "pawn" } };
function shape(): ShapeEntryDefinition {
  return { id: "source-authority-fixture", version: "1.0.0", name: "Mechanical source fixture", phases: ["middlegame"], trigger: structuredClone(occupancy),
    plans: (["white", "black"] as const).map(side => ({ id: side, side, label: "Occupancy", description: "Mechanical fixture only", success: { note: "Occupancy only", signature: structuredClone(occupancy) } })),
    watch: ["No chess judgement"], typicalMistakes: ["No chess judgement"], provenance: { licence: "CC0-1.0", sources: ["Mechanical test"], attribution: [{ title: "Mechanical fixture", author: "Tabiya tests", licence: "CC0-1.0" }] } };
}
function pack(): DrillPackDefinition {
  const document = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
  document.authoredBoundary.fenPredicates = [{ type: "structuralFeature", feature: { kind: "pieceOnSquare", square: "e3", piece: { color: "white", role: "bishop" } } }];
  return withDerivedRequires(document) as DrillPackDefinition;
}
const boundary = "/authoredBoundary/fenPredicates/0/feature";
const mint = (document: ShapeEntryDefinition | DrillPackDefinition, pointer: string) => invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: selectAuthoredStructuralCondition(authoredStructuralDocument(document), pointer) });

describe("actual authored structural source issuers", () => {
  it("D4108 refuses an equal-looking copied objective AST beside a genuine source", () => {
    const checked = validatePackDocument(pack());
    expect(checked.document).toBeDefined();
    const document = checked.document!, source = selectAuthoredStructuralCondition(authoredStructuralDocument(document), boundary);
    const feature = readAuthoredStructuralConditionSource(source).effectiveExpression;
    const run = createRun({ id: "objective-original-root", session: { kind: "position", start: document.start, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: "sha256:" + "a".repeat(64), seed: 1, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, createdAt: "2026-11-04T00:00:00.000Z" });
    const original = { type: "fenPredicate" as const, predicate: { type: "structuralFeature" as const, feature, authoredSource: source } };
    expect(() => evaluateObjectivePredicate(run, original)).not.toThrow();
    const copy = structuredClone(feature);
    expect(copy).toEqual(feature);
    expect(() => evaluateObjectivePredicate(run, { ...original, predicate: { ...original.predicate, feature: copy } })).toThrow(/original|identity|authenticated/);
  });
  it("D4083 a warmed immutable proof still retires on actual registered-record replacement", async () => {
    const registry = new ShapeRegistry(), original = shape(); await registry.add(original, "community");
    const source = selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(original.id)!, "/trigger");
    const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: "7k/8/8/4p3/8/8/8/7K w - - 0 1" });
    const captured = captureAuthoredPredicatePopulation(source, position);
    if (captured.kind !== "available") throw new Error(captured.reason);
    const value = invokeEvidenceValueRoute("derived.structural.predicate_result@2", { population: captured.value });
    expect(value.payload.observation.matched).toBe(true);
    for (let index = 0; index < 5; index++) expect(readAuthoredPredicateReductionValue(value, captured.value).reduction).toBeDefined();
    expect(Object.isFrozen(value.payload.observation.source.origin.document)).toBe(true);
    await registry.add({ ...original, version: "1.0.1" }, "community");
    expect(() => readAuthoredPredicateReductionValue(value, captured.value)).toThrow(/current/);
  });

  it("D4083 mutable registered bytes keep their live digest check and frozen bytes keep their exact document identity", async () => {
    // Low-level issuer guard only; real registries already own deeply frozen records.
    const mutable = { ...shape() }, digest = await digestShapeEntry(mutable);
    const row = { document: mutable, digest, summary: { id: mutable.id, version: mutable.version, digest } };
    const source = selectAuthoredStructuralCondition(captureRegisteredShapeStructuralDocument(row, () => row), "/trigger");
    expect(readAuthoredStructuralConditionSource(source).origin.digest).toBe(digest);
    mutable.name = "Changed bytes without a new digest";
    expect(() => readAuthoredStructuralConditionSource(source)).toThrow(/current/);

    const first = new ShapeRegistry(), second = new ShapeRegistry();
    const a = await first.add(shape(), "community"), b = await second.add(shape(), "community");
    const stableRow = { document: a.document, digest: a.digest, summary: a.summary };
    const stableSource = selectAuthoredStructuralCondition(captureRegisteredShapeStructuralDocument(stableRow, () => stableRow), "/trigger");
    expect(readAuthoredStructuralConditionSource(stableSource).origin.digest).toBe(a.digest);
    stableRow.document = b.document; // Equal canonical bytes are a different document object.
    expect(() => readAuthoredStructuralConditionSource(stableSource)).toThrow(/current/);
  });

  it("routes actual shape-presence, consequence-signature and reasoning-ground probes through their document sources", async () => {
    const explicit: StructuralExpression = { kind: "not", of: { kind: "feature", feature: { kind: "outpost", color: "white", square: "e5", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } } };
    const trigger: StructuralExpression = { kind: "all", of: [{ kind: "pieceOnSquare", square: "e3", piece: { color: "white", role: "bishop" } }, explicit] };
    // A consequence becomes true at the actual terminal b5 node, never an absorbing interior node.
    const signature: StructuralExpression = { kind: "all", of: [trigger, { kind: "pieceOnSquare", square: "b5", piece: { color: "black", role: "pawn" } }] };
    const entry = { ...shape(), trigger, plans: shape().plans.map(plan => ({ ...plan, success: { ...plan.success, signature } })) };
    const shapes = new ShapeRegistry(); await shapes.add(entry, "community");
    const base = pack(), document = withDerivedRequires({ ...base, shapes: [entry.id],
      planClasses: [...base.planClasses!, { id: "source-probe", label: "Mechanical probe", shapePlan: { shape: entry.id, plan: "white" } }],
      objective: { ...base.objective, successConditions: [...base.objective.successConditions!, { kind: "plan_consequence", planClassId: "source-probe" }] },
      checkpoints: [...base.checkpoints, { id: "source-reasoning", label: "Mechanical probe", trigger: { atSpineNode: "najdorf-be3" }, interaction: {
        type: "stated_reasoning", keyPoints: [{ id: "source", label: "Mechanical", phrases: ["mechanical source"], ground: { kind: "structural", expression: explicit } }],
      } }],
    }, { shapes }) as DrillPackDefinition;
    const invoke = valueRoutes.invokeEvidenceValueRoute, origins: unknown[] = [];
    vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      const result = invoke(route, input);
      if (route === "authored.structural_condition.input@2" && result !== null && typeof result === "object" && "payload" in result) origins.push(result.payload);
      return result;
    });
    const checked = validatePackDocument(document, { shapes });
    expect(checked.issues.filter(issue => issue.severity === "error")).toEqual([]);
    const refusalCodes = ["STRUCTURAL_SOURCE_UNAVAILABLE", "SHAPE_REFERENCE_NEVER_PRESENT", "PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT", "KEY_POINT_GROUND_FALSE_AT_CHECKPOINT"];
    expect(checked.issues.filter(issue => refusalCodes.includes(issue.code))).toEqual([]);
    expect(origins).toContainEqual(expect.objectContaining({ pointer: "/trigger", origin: expect.objectContaining({ kind: "shape", stage: "registered", documentId: entry.id }) }));
    expect(origins).toContainEqual(expect.objectContaining({ pointer: "/objective/successConditions/1", authoredNode: { kind: "plan_consequence", planClassId: "source-probe" } }));
    const groundPointer = `/checkpoints/${base.checkpoints.length}/interaction/keyPoints/0/ground/expression`;
    expect(origins).toContainEqual(expect.objectContaining({ pointer: groundPointer, authoredNode: explicit, origin: expect.objectContaining({ kind: "pack", stage: "draft_validation", documentId: document.id }) }));

    // Real absence is false; neither missing authority nor an unavailable source is false.
    const absent: StructuralExpression = { kind: "pieceOnSquare", square: "h5", piece: { color: "white", role: "queen" } };
    const absentEntry = { ...entry, trigger: absent, plans: entry.plans.map(plan => ({ ...plan, success: { ...plan.success, signature: absent } })) };
    const absentShapes = new ShapeRegistry(); await absentShapes.add(absentEntry, "community");
    const absentDocument = withDerivedRequires({ ...document, checkpoints: document.checkpoints.map(checkpoint => checkpoint.id === "source-reasoning" ? {
      ...checkpoint, interaction: { type: "stated_reasoning", keyPoints: [{ id: "source", label: "Mechanical", phrases: ["mechanical source"], ground: { kind: "structural", expression: absent } }] },
    } : checkpoint) }, { shapes: absentShapes });
    const negative = validatePackDocument(absentDocument, { shapes: absentShapes });
    expect(negative.issues.map(issue => issue.code)).toEqual(expect.arrayContaining(refusalCodes.slice(1)));
    expect(negative.issues.some(issue => issue.code === "STRUCTURAL_SOURCE_UNAVAILABLE")).toBe(false);

    const target = authoredSpineFens(document)[1]!;
    vi.mocked(valueRoutes.invokeEvidenceValueRoute).mockImplementation(((route: string, input: { position?: { payload: { fen: string } } }) =>
      route === "derived.square.reading.future_file_challenge@1" && input.position?.payload.fen === target
        ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input as never)) as typeof invoke);
    const unavailable = validatePackDocument(document, { shapes });
    expect(unavailable.issues.filter(issue => issue.code === "STRUCTURAL_SOURCE_UNAVAILABLE").map(issue => issue.path)).toEqual(expect.arrayContaining([
      "/shapes/0", "/objective/successConditions/1/planClassId", groundPointer,
    ]));
    expect(unavailable.issues.filter(issue => refusalCodes.slice(1).includes(issue.code))).toEqual([]);
  });

  it("refuses STRUCTURAL_SOURCE_MISMATCH when an expansion substitutes another AST at a genuine pointer", () => {
    const checked = validatePackDocument(pack()), document = checked.document!;
    const expression = (document.authoredBoundary!.fenPredicates![0] as { feature: StructuralExpression }).feature;
    try {
      expandStructuralExpression({ kind: "not", of: expression }, boundary, planSignatureResolver(document));
      throw new Error("Expected a source mismatch refusal");
    } catch (error) {
      expect(error).toMatchObject({ code: "STRUCTURAL_SOURCE_MISMATCH", pointer: boundary });
    }
  });
  it("reports STRUCTURAL_SOURCE_UNAVAILABLE for actual validator dependency failures without a false probe", () => {
    const invoke = valueRoutes.invokeEvidenceValueRoute;
    vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.king_opposition@3"
      ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input)) as typeof invoke);
    const result = validateShapeEntry({ ...shape(), trigger: { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: STRUCTURAL_CONVENTION_REFS.king_opposition } } }, { probeFen: "8/8/8/8/8/4k3/8/4K3 b - - 0 1" });
    expect(result.valid).toBe(false);
    expect(result.issues.filter(issue => issue.code === "STRUCTURAL_SOURCE_UNAVAILABLE")).toHaveLength(2);
    expect(result.probeMatches).toBeUndefined();
  });
  it("binds an actual validator's detached draft to its exact whole-document digest and pointer", async () => {
    const original = shape(), result = validateShapeEntry(original);
    expect(result.valid).toBe(true);
    const document = result.document!, input = mint(document, "/trigger"), payload = input.payload;
    expect(payload.origin).toMatchObject({ kind: "shape", stage: "draft_validation", documentId: document.id, version: document.version, digest: await digestShapeEntry(document) });
    expect(payload.authoredNode).toEqual(document.trigger);
    expect(payload.expression).toEqual(document.trigger);
    expect(payload.effectiveExpression).toEqual(document.trigger);
    expect(payload.substitutions).toEqual([]);
    expect(Object.isFrozen(payload.origin.document)).toBe(true);
    expect(() => authoredStructuralDocument(original)).toThrow(/issuer/);
    expect(() => authoredStructuralDocument(structuredClone(document))).toThrow(/issuer/);
    expect(() => sourceForAuthoredExpression(structuredClone(payload.effectiveExpression))).toThrow(/authenticated/);
    expect(readAuthoredStructuralConditionSource(sourceForAuthoredExpression(payload.effectiveExpression))).toEqual(payload);
    for (const pointer of ["/provenance", "/plans/00/success/signature", "/plans/0/success", "/trigger/feature", "runtime.objective_condition"]) expect(() => mint(document, pointer)).toThrow(/address/);
  });

  it("does not relabel provisional source issuance as semantic validation or publication", () => {
    const original = shape();
    const result = validateShapeEntry({ ...original, trigger: { kind: "pieceOnSquare", square: "e2", piece: { color: "white", role: "pawn" } } });
    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === "SHAPE_TRIGGER_TRUE_AT_INITIAL")).toBe(true);
    expect(mint(result.document!, "/trigger").payload.origin.stage).toBe("draft_validation");
    const invalid = validateShapeEntry({ ...original, trigger: { kind: "feature", feature: { kind: "outpost", color: "white", square: "e5", conventionRef: { id: "wrong", version: 1 } } } });
    expect(invalid.document).toBeUndefined();
    const nonJsonShape = shape();
    const shapeResult = validateShapeEntry({ ...nonJsonShape, provenance: { ...nonJsonShape.provenance, attribution: [{ ...nonJsonShape.provenance.attribution[0], url: undefined }] } });
    expect(shapeResult).toMatchObject({ valid: false, issues: [{ code: "SCHEMA_JSON" }] });
    const packResult = validatePackDocument({ ...pack(), legs: undefined });
    expect(packResult).toMatchObject({ valid: false, issues: [{ code: "SCHEMA_JSON" }] });
  });

  it("uses actual PackRegistry and ShapeRegistry records and rejects replaced record authority", async () => {
    const shapes = new ShapeRegistry(), original = shape();
    const record = await shapes.add(original, "community", "fixture-author");
    const source = selectAuthoredStructuralCondition(shapes.captureAuthoredStructuralDocument(record.document.id)!, "/trigger");
    expect(readAuthoredStructuralConditionSource(source).origin).toMatchObject({ stage: "registered", digest: record.digest });
    const packs = await PackRegistry.fromDocuments([{ source: "mechanical-fixture.json", value: pack() }]);
    const packRecord = packs.list()[0]!, packSource = selectAuthoredStructuralCondition(packs.captureAuthoredStructuralDocument(packRecord.id)!, boundary);
    expect(readAuthoredStructuralConditionSource(packSource).origin).toMatchObject({ kind: "pack", stage: "registered", digest: await digestDrillPack(packs.required(packRecord.id).document) });
    await shapes.add({ ...original, version: "1.0.1" }, "community", "fixture-author");
    expect(() => readAuthoredStructuralConditionSource(source)).toThrow(/current/);
    expect(() => invokeEvidenceValueRoute("authored.structural_condition.input@2", { source })).toThrow(/authority|current/);
    await expect(shapes.add({ ...original, trigger: { kind: "pieceOnSquare", square: "e2", piece: { color: "white", role: "pawn" } } }, "community")).rejects.toMatchObject({ code: "PACK_INVALID" });
  });

  it("retains the literal pack plan use-site and actual registered shape-plan substitution", async () => {
    const shapes = new ShapeRegistry(), entry = shape(); await shapes.add(entry, "community", "fixture-author");
    const original = pack();
    const value = withDerivedRequires({ ...original, shapes: [entry.id], planClasses: [{ id: "selected", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } }],
      objective: { ...original.objective, successConditions: [{ kind: "plan_consequence", planClassId: "selected" }] } }, { shapes });
    const checked = validatePackDocument(value, { shapes });
    const input = mint(checked.document!, "/objective/successConditions/0"), payload = input.payload;
    expect(payload.authoredNode).toMatchObject({ kind: "plan_consequence", planClassId: "selected" });
    expect(payload.expression).toEqual({ kind: "plan_signature", planClassId: "selected" });
    expect(payload.effectiveExpression).toEqual(occupancy);
    expect(payload.substitutions).toMatchObject([{ path: "/objective/successConditions/0", planClassPointer: "/planClasses/0/shapePlan", planClassId: "selected", pointer: "/plans/0/success/signature", shape: { stage: "registered", documentId: entry.id, digest: await digestShapeEntry(entry) } }]);
    await shapes.add({ ...entry, version: "1.0.1" }, "community", "fixture-author");
    expect(() => mint(checked.document!, "/objective/successConditions/0")).toThrow(/current/);
  });

  it("rejects forged handles, extra AST authority and forged sealed inputs", () => {
    const checked = validateShapeEntry(shape()), source = selectAuthoredStructuralCondition(authoredStructuralDocument(checked.document!), "/trigger");
    expect(() => invokeEvidenceValueRoute("authored.structural_condition.input@2", { source: {} as never })).toThrow(/authority/);
    expect(() => invokeEvidenceValueRoute("authored.structural_condition.input@2", { source, expression: occupancy } as never)).toThrow(/authority/);
    const input = invokeEvidenceValueRoute("authored.structural_condition.input@2", { source }), receipt = evidenceValueReceipt(input);
    const copy = declareEvidence(input.producer, input.projection, input.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests });
    expect(readAuthoredStructuralInput(input)).toBe(source);
    expect(() => readAuthoredStructuralInput(copy)).toThrow(/original/);
  });

  it("never aliases source identity across equal or shared AST use-sites", () => {
    const original = shape();
    const checked = validateShapeEntry({ ...original, trigger: { kind: "all", of: [occupancy, occupancy] } });
    const document = authoredStructuralDocument(checked.document!);
    const first = selectAuthoredStructuralCondition(document, "/trigger/of/0"), second = selectAuthoredStructuralCondition(document, "/trigger/of/1");
    const left = readAuthoredStructuralConditionSource(first).effectiveExpression, right = readAuthoredStructuralConditionSource(second).effectiveExpression;
    expect(left).toEqual(right); expect(left).not.toBe(right);
    expect(sourceForAuthoredExpression(left)).toBe(first);
    expect(sourceForAuthoredExpression(right)).toBe(second);
  });

  it("isolates equal plan substitutions at two use-sites and across pack captures", async () => {
    const shapes = new ShapeRegistry(), entry = shape(); await shapes.add(entry, "community");
    const base = pack(), original = withDerivedRequires({ ...base, shapes: [entry.id], planClasses: [{ id: "selected", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } }],
      objective: { ...base.objective, successConditions: [{ kind: "plan_consequence", planClassId: "selected" }, { kind: "plan_consequence", planClassId: "selected" }] } }, { shapes });
    const captures = [original, { ...original, id: "other-pack-source" }].map(value => authoredStructuralDocument(validatePackDocument(value, { shapes }).document!));
    const first = selectAuthoredStructuralCondition(captures[0]!, "/objective/successConditions/0"), second = selectAuthoredStructuralCondition(captures[0]!, "/objective/successConditions/1"), foreign = selectAuthoredStructuralCondition(captures[1]!, "/objective/successConditions/0");
    for (const source of [first, second, foreign]) expect(sourceForAuthoredExpression(readAuthoredStructuralConditionSource(source).effectiveExpression)).toBe(source);
    const duplicate = { ...original, planClasses: [original.planClasses![0], { ...original.planClasses![0], shapePlan: { shape: entry.id, plan: "black" } }] };
    const checked = validatePackDocument(duplicate, { shapes });
    expect(() => selectAuthoredStructuralCondition(authoredStructuralDocument(checked.document!), "/objective/successConditions/0")).toThrow(/ambiguous/);
  });

  it("requires explicit pack re-admission before fresh requests can use a replaced shape version", async () => {
    const shapes = new ShapeRegistry(), baseShape = shape();
    const trigger: StructuralExpression = { kind: "pieceOnSquare", square: "e3", piece: { color: "white", role: "bishop" } };
    const entry = { ...baseShape, trigger, plans: baseShape.plans.map(plan => ({ ...plan, success: { ...plan.success, signature: trigger } })) };
    await shapes.add(entry, "community");
    const base = pack(), original = withDerivedRequires({ ...base, shapes: [entry.id], planClasses: [{ id: "selected", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } }],
      authoredBoundary: { ...base.authoredBoundary, fenPredicates: [{ type: "structuralFeature", feature: { kind: "plan_signature", planClassId: "selected" } }] } }, { shapes });
    // Pack admission also checks its own start; this future occupancy is not initially true.
    const registry = await PackRegistry.fromDocuments([{ source: "source-plan.json", value: original }], { shapes });
    const capture = () => selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(original.id)!, boundary);
    const previous = capture();
    await shapes.add({ ...entry, version: "1.0.1" }, "community");
    expect(() => readAuthoredStructuralConditionSource(previous)).toThrow(/current/);
    expect(() => capture()).toThrow(/shape requirement does not admit/);
    const updated = withDerivedRequires({ ...original, version: "1.0.1" }, { shapes });
    expect(updated.requires).not.toEqual(original.requires);
    const admitted = await PackRegistry.fromDocuments([{ source: "re-admitted-plan.json", value: updated }], { shapes });
    const next = selectAuthoredStructuralCondition(admitted.captureAuthoredStructuralDocument(updated.id)!, boundary);
    const image = readAuthoredStructuralConditionSource(next);
    expect(image.origin.digest).toBe(await digestDrillPack(updated));
    expect(image.origin.digest).not.toBe(await digestDrillPack(original));
    expect(image.substitutions[0]!.shape.version).toBe("1.0.1");
  });

  it.each([false, true])("preflights every genuine substituted mirror before either visitation policy, valid=%s", async valid => {
    const registry = new ShapeRegistry(), baseShape = shape();
    const signature: StructuralExpression = valid
      ? { kind: "feature", feature: { kind: "piece_count", color: "white", role: "pawn", basis: "count", comparison: "atLeast", count: 1 } }
      : { kind: "feature", feature: { kind: "named_structure", id: "iqp-white" } };
    const entry = { ...baseShape, plans: baseShape.plans.map(plan => ({ ...plan, success: { ...plan.success, signature } })) };
    await registry.add(entry, "community");
    const base = pack(), value = withDerivedRequires({ ...base, shapes: [entry.id], planClasses: [{ id: "selected", label: "Mechanical", shapePlan: { shape: entry.id, plan: "white" } }],
      objective: { ...base.objective, successConditions: [{ kind: "structural_feature", feature: { kind: "any", of: [
        { kind: "pieceOnSquare", square: "e1", piece: { color: "white", role: "king" } },
        { kind: "mirrored", axis: "colors", of: { kind: "plan_signature", planClassId: "selected" } },
      ] } }] } }, { shapes: registry });
    const checked = validatePackDocument(value, { shapes: registry });
    expect(checked.document).toBeDefined(); // Actual provisional validator capture, not a fake expression issuer.
    const document = authoredStructuralDocument(checked.document!);
    const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: "4k3/8/8/3p4/8/8/8/4K3 w - - 0 1" });
    const calls = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute");
    for (const policy of ["predicate", "witness"] as const) {
      const select = () => selectAuthoredStructuralCondition(document, "/objective/successConditions/0/feature");
      if (!valid) {
        expect(() => captureAuthoredPredicatePopulation(select(), position, policy)).toThrow(/named_structure cannot appear under mirrored/);
        expect(calls).not.toHaveBeenCalled(); // Includes the branch predicate execution would skip.
      } else {
        const source = select(), captured = captureAuthoredPredicatePopulation(source, position, policy);
        if (captured.kind !== "available") throw new Error(captured.reason);
        const result = invokeEvidenceValueRoute("derived.structural.predicate_result@2", { population: captured.value });
        expect(result.payload.observation.matched).toBe(true);
        expect(readAuthoredPredicatePopulation(captured.value).leaves).toHaveLength(policy === "predicate" ? 0 : 1);
      }
    }
  });
});
