import { afterEach, describe, expect, it, vi } from "vitest";
import { STRUCTURAL_CONVENTION_REFS, type StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { digestShapeEntry, type ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { probeShapeDocument } from "./shape-probe.js";

const yes = "8/8/8/8/8/4k3/8/4K3 b - - 0 1";
const no = "8/8/8/4k3/8/4P3/8/4K3 b - - 0 1";
function shape(): ShapeEntryDefinition {
  const trigger: StructuralExpression = { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: STRUCTURAL_CONVENTION_REFS.king_opposition } };
  return { id: "probe-source-fixture", version: "1.0.0", name: "Mechanical probe fixture", phases: ["endgame"], trigger,
    plans: [{ id: "white", side: "white", label: "Mechanical", description: "No chess judgement", success: { note: "Exact predicate only", signature: structuredClone(trigger) } },
      { id: "black", side: "black", label: "Not computable", description: "No chess judgement", success: { note: "No signature supplied", signature: null } }],
    watch: ["Mechanical fixture only"], typicalMistakes: ["Mechanical fixture only"], provenance: { licence: "CC0-1.0", sources: ["Mechanical test"],
      attribution: [{ title: "Mechanical fixture", author: "Tabiya tests", licence: "CC0-1.0" }] } };
}
afterEach(() => vi.restoreAllMocks());

describe("shape probe uses the actual document-owned evaluator", () => {
  it("keeps trigger and plan source pointers, real successor positives/negatives and null signatures", async () => {
    const document = shape(), origins: unknown[] = [], routes: string[] = [], invoke = valueRoutes.invokeEvidenceValueRoute;
    vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
      routes.push(route);
      const result = invoke(route, input);
      if (route === "authored.structural_condition.input@2" && result !== null && typeof result === "object" && "payload" in result) origins.push(result.payload);
      return result;
    });
    expect(probeShapeDocument(document, [{ label: "yes", fen: yes }, { label: "no", fen: no }])).toEqual([
      { label: "yes", fen: yes, trigger: true, plans: [{ id: "white", side: "white" }] },
      { label: "no", fen: no, trigger: false, plans: [] },
    ]);
    expect(origins).toHaveLength(5);
    for (const origin of origins) expect(origin).toMatchObject({ origin: { kind: "shape", stage: "draft_validation", documentId: document.id, digest: await digestShapeEntry(document) } });
    expect(origins).toContainEqual(expect.objectContaining({ pointer: "/plans/0/success/signature", authoredNode: document.plans[0]!.success.signature }));
    expect(origins).not.toContainEqual(expect.objectContaining({ pointer: "/plans/1/success/signature" }));
    expect(routes).not.toContain("derived.structural.predicate_result@1");
    expect(routes).not.toContain("rules.structural.predicate.king_opposition@1");
  });

  it("refuses a bare expression and invalid refs before any evaluation", () => {
    const invoke = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute");
    expect(() => probeShapeDocument(shape().trigger, [{ label: "bare", fen: yes }])).toThrow(/Invalid shape/);
    expect(() => probeShapeDocument({ ...shape(), trigger: { kind: "feature", feature: { kind: "king_opposition", color: "white", form: "direct", conventionRef: STRUCTURAL_CONVENTION_REFS.outpost } } }, [{ label: "wrong", fen: yes }])).toThrow(/Invalid shape/);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("refuses a visited unavailable source without publishing false or partial rows", () => {
    const document = shape(), positions = [{ label: "first", fen: no }, { label: "unavailable", fen: yes }];
    expect(probeShapeDocument(document, positions)).toHaveLength(2);
    const invoke = valueRoutes.invokeEvidenceValueRoute;
    vi.spyOn(valueRoutes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: { position?: { payload: { fen: string } } }) =>
      route === "rules.structural.reading.king_opposition@3" && input.position?.payload.fen === yes
        ? { kind: "unavailable", reason: "source_dependency_unavailable" } : invoke(route as never, input as never)) as typeof invoke);
    expect(() => probeShapeDocument(document, positions)).toThrow(/Shape probe unavailable/);
  });
});
