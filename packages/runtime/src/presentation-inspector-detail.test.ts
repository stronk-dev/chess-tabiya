// D3983: accepted conditional detail composition, not current Full Inspector2 adoption.
// Genuine source/factory values exercise prospective production specs as unsealed components.
import { describe, expect, it } from "vitest";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { canonicalSemanticEdge } from "./semantic-validation-operations.js";
import { INSPECTOR_DETAIL_SOURCES, inspectorDetailSquares, renderInspectorDetail,
  type InspectorDetailKind, type InspectorDetailPayload, type InspectorDetailScope } from "./inspector-detail.js";
import { inspectorSourceAdapterSpecs } from "./presentation-inspector-adapters.js";
import { adapterComponents, adapterComponentsForEvidence, assertPresentationSourceRetention,
  parseComponentValue, type ComponentValue,
  type ProjectionPresentationAdapter } from "./presentation-contract.js";
import { inspectorSourcePresentationKit as kit } from "./testing/inspector-source-presentation-kit.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const NO_RAYS = "4k3/8/8/8/8/8/P7/4K3 w - - 0 1";
const FULL2 = { id: "module.full_inspector", version: 2 } as const;
const KINDS = ["rays", "square_control", "piece_destinations", "destination_changes", "king_zone", "defender_duties"] as const; // Original geometry ABI. Eight current text-only foundation details have full source/consumer/receiver controls in foundation-snapshot-detail.test.ts.
// The constructor kit delegates text/operand grammar to the actual registered renderer and
// preserves real evidence receipt ownership. It does not seal components or compile a view.
const entryFor = (kind: InspectorDetailKind) => {
  const entry = inspectorSourceAdapterSpecs(kit).find(spec => spec.consumer.id === FULL2.id && spec.consumer.version === 2
    && spec.projection.id === `derived.inspector.detail.${kind}` && spec.projection.version === 1);
  if (entry === undefined) throw new Error(`Missing prospective production detail spec: ${kind}`);
  return entry;
};
function source(kind: InspectorDetailKind, fen = INITIAL): DeclaredEvidence<unknown> {
  if (kind === "destination_changes") {
    const edge = canonicalSemanticEdge({ kind: "edge", beforeFen: INITIAL, moveUci: "b1a3", afterFen: "" });
    return invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", {
      beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen,
    })[0]!;
  }
  return invokeEvidenceValueRoute(INSPECTOR_DETAIL_SOURCES[kind] as never, { fen } as never) as DeclaredEvidence<unknown>;
}
function detail(kind: InspectorDetailKind, original = source(kind), start = 0, scope: InspectorDetailScope = { kind: "whole" }) {
  return invokeEvidenceValueRoute(`derived.inspector.detail.${kind}@1` as never, { source: original, scope, start } as never) as DeclaredEvidence<InspectorDetailPayload>;
}
function components(kind: InspectorDetailKind, evidence: DeclaredEvidence<InspectorDetailPayload>): readonly ComponentValue[] {
  const result = entryFor(kind).construct(evidence);
  return Array.isArray(result) ? result : [result as ComponentValue];
}

describe("D3983 exact conditional Inspector detail composition (unbound prerequisite)", () => {
  it.each(KINDS)("%s has one statement plus neutral actual witness squares, never arrows", kind => {
    const fen = kind === "rays" ? "4k3/4r3/8/8/8/8/4R3/4K3 b - - 0 1"
      : kind === "defender_duties" ? "7k/8/2N1N3/1N3N2/3P4/1N3N2/2N1N3/6K1 w - - 0 1" : INITIAL;
    const value = detail(kind, source(kind, fen));
    const squares = inspectorDetailSquares(value.payload);
    expect(squares.length).toBeGreaterThan(0);
    const entry = entryFor(kind), built = components(kind, value);
    expect(adapterComponents(entry)).toEqual(["fact_statement", "square_set"]);
    expect(adapterComponentsForEvidence(entry, value)).toEqual(["fact_statement", "square_set"]);
    expect(built.map(component => component.id)).toEqual(["fact_statement", "square_set"]);
    expect(() => assertPresentationSourceRetention(value, built)).not.toThrow();
    expect(built.map(component => parseComponentValue(JSON.parse(JSON.stringify(component))))).toEqual(built);
    const statement = built[0]!, board = built[1]!;
    if (statement.id !== "fact_statement" || board.id !== "square_set") throw new Error("Missing complete detail composition");
    expect(statement.operand.operands).toEqual(value.payload);
    expect(statement.operand.renderedText).toBe(renderInspectorDetail(value.payload));
    expect(board.operand.squares).toEqual(squares);
    expect(new Set(board.operand.squares).size).toBe(squares.length);
    expect(board.operand.brush).toBe("blue");
    expect(board.operand.caption).toEqual(statement.operand);
    expect(board.operand.owner.factRef).toBe(`sha256:${evidenceValueReceipt(value).payloadDigest}`);
  });

  it("genuine empty rays retain their statement and omit the optional board component", () => {
    const value = detail("rays", source("rays", NO_RAYS));
    expect(value.payload.members).toEqual([]);
    expect(inspectorDetailSquares(value.payload)).toEqual([]);
    expect(adapterComponentsForEvidence(entryFor("rays"), value)).toEqual(["fact_statement"]);
    const built = components("rays", value);
    expect(built.map(component => component.id)).toEqual(["fact_statement"]);
    expect(() => assertPresentationSourceRetention(value, built)).not.toThrow();
    expect(parseComponentValue(JSON.parse(JSON.stringify(built[0])))).toEqual(built[0]);
  });

  it("genuine unavailable legal control and empty king escape sentinels render text alone", () => {
    const control = detail("square_control", source("square_control", "4k3/8/8/8/8/8/4R1K1/8 b - - 0 1"), 0,
      { kind: "control_target", color: "white", mode: "legal", target: "a1" });
    expect(control.payload.members.map(member => member.kind)).toEqual(["control_unavailable"]);
    const kingSource = source("king_zone"), first = detail("king_zone", kingSource);
    const king = detail("king_zone", kingSource, first.payload.range.total - 1);
    expect(king.payload.members.map(member => member.kind)).toEqual(["king_escapes_empty"]);
    for (const [kind, value] of [["square_control", control], ["king_zone", king]] as const) {
      expect(inspectorDetailSquares(value.payload)).toEqual([]);
      expect(adapterComponentsForEvidence(entryFor(kind), value)).toEqual(["fact_statement"]);
      const built = components(kind, value);
      expect(built.map(component => component.id)).toEqual(["fact_statement"]);
      expect(() => assertPresentationSourceRetention(value, built)).not.toThrow();
    }
  });

  it("the closed optional condition refuses copied evidence and crossed exact scopes", () => {
    const value = detail("rays"), entry = entryFor("rays");
    for (const copy of [{ ...value }, JSON.parse(JSON.stringify(value))]) {
      expect(() => adapterComponentsForEvidence(entry, copy)).toThrow();
    }
    expect(() => adapterComponentsForEvidence(entry, detail("defender_duties"))).toThrow();
    const wrongEntries = [
      { ...entry, consumer: { ...FULL2, version: 1 } },
      { ...entry, consumer: { id: "module.postcommit_nudge", version: 2 } },
      { ...entry, projection: { ...entry.projection, version: 2 } },
      { ...entry, projection: { id: "rules.tactic.reading.ray_classification", version: 1 } },
      { ...entry, composition: { ...entry.composition!, members: entry.composition!.members.map((member, index) => index === 0
        ? { ...member, when: "inspector_detail_has_squares" } : member) } },
      { ...entry, composition: { ...entry.composition!, members: entry.composition!.members.map((member, index) => index === 1
        ? { ...member, when: "caller_choice" } : member) } },
    ];
    for (const wrong of wrongEntries) expect(() => adapterComponentsForEvidence(wrong as ProjectionPresentationAdapter, value)).toThrow();
  });

  it("the existing source-retention seam refuses omissions, extras and foreign board geometry", () => {
    const value = detail("rays", source("rays", "4k3/4r3/8/8/8/8/4R3/4K3 b - - 0 1"));
    const built = components("rays", value), board = built[1]!;
    if (board.id !== "square_set") throw new Error("Missing actual ray geometry");
    expect(() => assertPresentationSourceRetention(value, built)).not.toThrow();
    for (const bad of [built.slice(0, 1), built.slice(1), [...built, built[0]!],
      [built[0]!, { ...board, operand: { ...board.operand, squares: ["a1"] } }],
      [built[0]!, { ...board, operand: { ...board.operand, brush: "red" } }],
      [built[0]!, { ...board, operand: { ...board.operand, caption: { ...board.operand.caption, renderedText: "Caller prose is not the owning statement." } } }],
      [built[0]!, { ...board, operand: { ...board.operand, owner: { factRef: `sha256:${"0".repeat(64)}` } } }],
    ]) expect(() => assertPresentationSourceRetention(value, bad as readonly ComponentValue[])).toThrow();
    const empty = detail("rays", source("rays", NO_RAYS));
    expect(() => assertPresentationSourceRetention(empty, components("rays", empty))).not.toThrow();
    expect(() => assertPresentationSourceRetention(empty, [components("rays", empty)[0]!, board])).toThrow();
    // A real foreign invocation can have identical board geometry but different retained
    // source context. Its own valid statement/caption cannot be paired with this source.
    const foreign = detail("rays", source("rays", "4k3/4r3/8/8/8/8/4R3/4K3 b - - 8 3"));
    expect(inspectorDetailSquares(foreign.payload)).toEqual(inspectorDetailSquares(value.payload));
    const foreignComponents = components("rays", foreign), foreignBoard = foreignComponents[1]!;
    if (foreignBoard.id !== "square_set") throw new Error("Missing genuine foreign geometry");
    expect(() => assertPresentationSourceRetention(foreign, foreignComponents)).not.toThrow();
    expect(() => assertPresentationSourceRetention(value, [foreignComponents[0]!, board])).toThrow();
    expect(() => assertPresentationSourceRetention(value, [built[0]!, { ...board, operand: { ...board.operand, caption: foreignBoard.operand.caption } }])).toThrow();
  });
});
