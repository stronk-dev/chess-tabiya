import { afterEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { STRUCTURAL_CONVENTION_REFS } from "@chess-tabiya/schema/drill-pack";
import { ShapeRegistry } from "./shape-registry.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { shapeFirings } from "../../../packages/runtime/src/shape-firing.js";
import { readRegisteredShapeScan, registeredShapeReceiptImage, RegisteredShapeScanUnavailable,
  type RegisteredShapePath, type RegisteredShapeScan } from "../../../packages/runtime/src/internal/registered-shape-scan.js";
import { assertRegisteredShapeTriggerSource, authoredStructuralDocument, readAuthoredStructuralConditionSource, selectAuthoredStructuralCondition } from "../../../packages/runtime/src/internal/authored-structural-source.js";
import { validateShapeEntry } from "./shape-validation.js";
import { readAuthoredPredicatePopulation } from "../../../packages/runtime/src/authored-predicate-population.js";
import * as predicatePopulation from "../../../packages/runtime/src/authored-predicate-population.js";
import { evidenceDigest, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";

afterEach(() => vi.restoreAllMocks());
const signal = () => new AbortController().signal;
function legalPath() {
  const position = Chess.default(), path = [{ id: "root", fen: makeFen(position.toSetup()) }];
  for (const [index, san] of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6"].entries()) {
    const move = parseSan(position, san)!; expect(position.isLegal(move)).toBe(true); position.play(move);
    path.push({ id: `n${index + 1}`, fen: makeFen(position.toSetup()) });
  }
  return path;
}
async function collect(registry: ShapeRegistry, path: RegisteredShapePath): Promise<RegisteredShapeScan> {
  const builder = await registry.beginCurrentShapeScan(path, signal());
  for (;;) {
    const result = registry.advanceCurrentShapeScan(builder);
    if (result.kind === "complete") return result.scan;
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

describe("current complete registered shape scans", () => {
  it("retains the exact original immutable authored input image and rechecks live record ownership", async () => {
    const registry = new ShapeRegistry(), document = registeredShapeFixture(); await registry.add(document, "official");
    const source = selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(document.id)!, "/trigger");
    const input = routes.invokeEvidenceValueRoute("authored.structural_condition.input@2", { source });
    expect(input.payload).toBe(readAuthoredStructuralConditionSource(source));
    for (let index = 0; index < 5; index++) expect(routes.readAuthoredStructuralInput(input)).toBe(source);
    await registry.add(document, "official"); expect(() => routes.readAuthoredStructuralInput(input)).toThrow(/current/);
  });
  it("D4085 bounds every advance including completion, and leaves complete verification to mint/read", async () => {
    const registry = new ShapeRegistry(); await registry.add(registeredShapeFixture(), "official");
    const path = Array.from({ length: 70 }, (_, index) => ({ id: `n${index}`, fen: legalPath()[1]!.fen }));
    const builder = await registry.beginCurrentShapeScan(path, signal()), read = predicatePopulation.readAuthoredPredicatePopulation;
    const reads = vi.spyOn(predicatePopulation, "readAuthoredPredicatePopulation").mockImplementation(read);
    let scan: RegisteredShapeScan | undefined, chunks = 0;
    const earlier = new Set<object>();
    while (scan === undefined) {
      reads.mockClear(); chunks++;
      const next = registry.advanceCurrentShapeScan(builder);
      const thisChunk = new Set(reads.mock.calls.map(([population]) => population));
      expect(thisChunk.size).toBeLessThanOrEqual(32);
      expect([...thisChunk].some(population => earlier.has(population))).toBe(false);
      for (const population of thisChunk) earlier.add(population);
      if (next.kind === "complete") scan = next.scan;
    }
    expect(chunks).toBeGreaterThanOrEqual(3);
    reads.mockClear();
    expect(routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan })).toHaveLength(1);
    expect(reads.mock.calls.length).toBeGreaterThanOrEqual(70);
  });
  it.each([false, true])("preserves every legal no-ref prefix, negative cells and repeated intervals; black=%s", async black => {
    const registry = new ShapeRegistry(), document = registeredShapeFixture("mechanical-knight-location", black);
    await registry.add(document, "community", "mechanical-author");
    const path = legalPath();
    for (let count = 1; count <= path.length; count++) {
      const prefix = path.slice(0, count), scan = await collect(registry, prefix), data = readRegisteredShapeScan(scan);
      const values = routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan });
      expect(values.map(({ payload: { authority: _authority, ...firing } }) => firing)).toEqual(shapeFirings([{ id: document.id, trigger: document.trigger }], prefix));
      expect(data.rows[0]!.cells).toHaveLength(prefix.length);
      expect(data.roots).toHaveLength(prefix.length);
      for (const [index, cell] of data.rows[0]!.cells.entries()) expect(readAuthoredPredicatePopulation(cell).position).toBe(data.roots[index]);
      expect(routes.readCurrentShapeFiringInvocation(values, scan).inputDigest).toBe(evidenceDigest(data.image));
      for (const value of values) expect(value.payload.authority).toMatchObject({ documentId: document.id, pointer: "/trigger", channel: "community", publisherHandle: "mechanical-author" });
    }
  });

  it("distinguishes complete empty registries/nonmatches, retains exact counters and rejects copied/foreign results", async () => {
    const empty = new ShapeRegistry(), registry = new ShapeRegistry(); await registry.add(registeredShapeFixture(), "official");
    const path = legalPath().slice(0, 1), first = await collect(empty, path), second = await collect(registry, path);
    const values = routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: first });
    expect(values).toEqual([]); expect(routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: second })).toEqual([]);
    expect(readRegisteredShapeScan(first).inputDigest).not.toBe(readRegisteredShapeScan(second).inputDigest);
    expect(() => routes.readCurrentShapeFiringInvocation([...values], first)).toThrow(/original/);
    expect(() => routes.readCurrentShapeFiringInvocation(values, second)).toThrow(/original/);
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: { ...second } } as never)).toThrow(/authority/);
    const counters = await collect(registry, [{ id: "same-board", fen: path[0]!.fen.replace(/ 0 1$/, " 2 2") }]);
    expect(readRegisteredShapeScan(counters).inputDigest).not.toBe(readRegisteredShapeScan(second).inputDigest);
    expect(() => empty.assertCurrentShapeScan(second)).toThrow(/foreign/);
  });

  it("uses explicit current outpost truth and exact complete-row receipts/conventions, not another shape's", async () => {
    const registry = new ShapeRegistry(), base = registeredShapeFixture();
    const feature = { kind: "outpost" as const, color: "white" as const, square: "e5" as const, conventionRef: STRUCTURAL_CONVENTION_REFS.outpost };
    const current = { ...base, id: "current-outpost", trigger: { kind: "feature" as const, feature } };
    await registry.add(current, "official"); await registry.add({ ...base, id: "plain-occupancy" }, "official");
    const path = [{ id: "positive", fen: "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1" },
      { id: "negative", fen: "7k/5p2/8/4N3/3P4/8/8/7K w - - 0 1" }];
    const scan = await collect(registry, path), data = readRegisteredShapeScan(scan);
    const values = routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan });
    expect(values).toHaveLength(1); expect(values[0]!.payload).toMatchObject({ entryId: current.id, firstNodeId: "positive", lastNodeId: "positive", openEnded: false });
    const { conventionRef: _ref, ...legacy } = feature;
    expect(routes.invokeEvidenceValueRoute("rules.structural.predicate.outpost@1", { fen: path[0]!.fen, feature: legacy }).payload.matched).toBe(false);
    const row = data.rows[0]!, item = values[0]!, receipt = evidenceValueReceipt(item);
    expect(row.cells.map(value => readAuthoredPredicatePopulation(value).observation.matched)).toEqual([true, false]);
    const inputs = row.cells.flatMap(value => { const cell = readAuthoredPredicatePopulation(value); return [cell.condition, cell.position, ...cell.leaves.map(row => row.value)]; });
    expect(receipt.sourceDigests).toEqual([evidenceDigest({ document: row.record.document, authority: item.payload.authority }), ...inputs.map(value => evidenceDigest(registeredShapeReceiptImage(value)))]);
    expect(receipt.convention!.refs).toContainEqual(STRUCTURAL_CONVENTION_REFS.outpost);
    expect(receipt.sourceDigests).toHaveLength(7); // Two actual negative/positive cells, not just the firing span.
    expect(receipt.inputDigest).toBe(data.inputDigest);
  });

  it("joins original records rather than equal documents, drafts, pointers or foreign registries", async () => {
    const first = new ShapeRegistry(), second = new ShapeRegistry(), document = registeredShapeFixture();
    const original = await first.add(document, "official"), other = await second.add(document, "official");
    const source = selectAuthoredStructuralCondition(first.captureAuthoredStructuralDocument(document.id)!, "/trigger");
    const row = { recordIdentity: original, document: original.document, digest: original.digest };
    expect(() => assertRegisteredShapeTriggerSource(source, row)).not.toThrow();
    expect(() => assertRegisteredShapeTriggerSource(source, { ...row, recordIdentity: other })).toThrow(/original/);
    const draft = validateShapeEntry(document).document!;
    expect(() => assertRegisteredShapeTriggerSource(selectAuthoredStructuralCondition(authoredStructuralDocument(draft), "/trigger"), row)).toThrow(/original/);
    expect(() => assertRegisteredShapeTriggerSource(selectAuthoredStructuralCondition(first.captureAuthoredStructuralDocument(document.id)!, "/plans/0/success/signature"), row)).toThrow(/original/);
  });

  it("keeps partial builders private and retires work/results after cancellation or same-byte replacement", async () => {
    const registry = new ShapeRegistry(), document = registeredShapeFixture(); await registry.add(document, "official");
    const path = Array.from({ length: 70 }, (_, index) => ({ id: `n${index}`, fen: legalPath()[1]!.fen }));
    const controller = new AbortController(), builder = await registry.beginCurrentShapeScan(path, controller.signal);
    expect(registry.advanceCurrentShapeScan(builder)).toEqual({ kind: "incomplete" });
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: builder } as never)).toThrow(/authority/);
    controller.abort(); expect(() => registry.advanceCurrentShapeScan(builder)).toThrow();
    const replacement = await registry.beginCurrentShapeScan(path, signal()); registry.advanceCurrentShapeScan(replacement);
    await registry.add(document, "official"); expect(() => registry.advanceCurrentShapeScan(replacement)).toThrow(/current/);
    const scan = await collect(registry, legalPath()); const values = routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan });
    await registry.add(document, "official"); expect(() => routes.readCurrentShapeFiringInvocation(values, scan)).toThrow(/current/);
    expect(() => registry.advanceCurrentShapeScan({} as never)).toThrow(/owner/);
  });

  it("refuses unavailable visited sources after earlier positive cells without publishing a partial scan", async () => {
    const registry = new ShapeRegistry(), base = registeredShapeFixture("a-positive"); await registry.add(base, "official");
    const feature = { kind: "outpost" as const, color: "white" as const, square: "e5" as const, conventionRef: STRUCTURAL_CONVENTION_REFS.outpost };
    await registry.add({ ...base, id: "z-unavailable", trigger: { kind: "all", of: [base.trigger, { kind: "feature", feature }] } }, "official");
    const builder = await registry.beginCurrentShapeScan(legalPath().slice(1, 2), signal()), invoke = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((route, input) => route === "derived.square.reading.future_file_challenge@1"
      ? { kind: "unavailable", reason: "source_dependency_unavailable" } as never : invoke(route, input));
    expect(() => registry.advanceCurrentShapeScan(builder)).toThrow(RegisteredShapeScanUnavailable);
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: builder } as never)).toThrow(/authority/);
    expect(() => registry.advanceCurrentShapeScan(builder)).toThrow(/failed/);
  });

  it("preflights every eligible callable and rejects a retained changed binding before more cells", async () => {
    const registry = new ShapeRegistry(); await registry.add(registeredShapeFixture(), "official");
    const builder = await registry.beginCurrentShapeScan(legalPath(), signal()), bindings = routes.inspectAuthoredPredicateFactoryBindings();
    expect(bindings).toHaveLength(23);
    const changed = bindings.map((binding, index) => index === 22 ? { ...binding, callable: (() => {}) as never } : binding);
    vi.spyOn(routes, "inspectAuthoredPredicateFactoryBindings").mockReturnValue(changed);
    expect(() => registry.advanceCurrentShapeScan(builder)).toThrow(/callable/);
  });
});
