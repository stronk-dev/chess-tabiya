// DISPOSABLE fresh buildability review — D2536. This probes existing evidence
// authority and amendment seams; it does not implement the collector repair.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import {
  assertSemanticEvidenceEvent,
  deflectionObservedOperands,
  localSemanticEvents,
  type SemanticEvidenceEvent,
} from "../../packages/runtime/src/semantic-evidence.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";
import { replyBreadth, type CheckEvent } from "../../packages/runtime/src/tactics.js";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
const authorModel = readFileSync("tools/d2536-deflection-check-authority-author-contract/model.ts", "utf8");
const costCompiler = readFileSync("tools/d1930-recorded-path-cost-harness/recorded-path-cost.test.ts", "utf8");
const sourceCompiler = readFileSync("tools/d1931-recorded-path-source-harness/source-closure.test.ts", "utf8");
const moduleGenerator = readFileSync("tools/d2120-module-registration-author-contract/generate.ts", "utf8");

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return Object.freeze(moves.map((moveUci, index) => {
    const afterFen = replyBreadth(current, moveUci).afterFen;
    const anchor = Object.freeze({
      beforeNodeId: `n${index}`,
      afterNodeId: `n${index + 1}`,
      beforeFen: current,
      moveUci,
      afterFen,
    });
    current = afterFen;
    return anchor;
  }));
}

const projectionKey = (event: SemanticEvidenceEvent): string => `${event.projection.id}@${event.projection.version}`;

describe("D2536 deflection check-authority fresh review", () => {
  const path = anchors("7k/4q1r1/8/8/8/8/8/R1K1R3 w - - 0 1", ["a1a8", "g7g8", "e1e7"]);
  const payload = deflectionObservedOperands(path)[0]!;
  const check = localSemanticEvents(path[0]!.beforeFen, path[0]!.moveUci, path[0]!.afterFen)
    .find((event): event is SemanticEvidenceEvent<CheckEvent> => projectionKey(event) === "rules.tactic.event.check@1")!;

  it("the legal check-induced fixture has one exact sealed edge-one check authority", () => {
    expect(payload).toBeDefined();
    expect(check).toBeDefined();
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, check)).not.toThrow();
    expect(check.anchor).toMatchObject({
      beforeFen: path[0]!.beforeFen,
      moveUci: path[0]!.moveUci,
      afterFen: path[0]!.afterFen,
    });
    expect(check.evidence.payload).toBe(check.operands);
    expect(check.operands.triggeringMove).toBe(path[0]!.moveUci);
  });

  it("the existing runtime seal rejects copied or crossed check events", () => {
    const copied = { ...check };
    const crossed = { ...check, anchor: { ...check.anchor, moveUci: "h1h8" } };
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, copied)).toThrow(/not constructed/u);
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, crossed)).toThrow(/not constructed/u);
  });

  it("the compiled event authority already supports an exact two-member derivation union", () => {
    const attraction = PRIMARY_EVIDENCE_MANIFEST.semanticEvents.find(
      (event) => `${event.projection.id}@${event.projection.version}` === "derived.tactic.attraction_observed@1",
    )!;
    expect(attraction.derivationAnyOf).toHaveLength(2);
    expect(attraction.derivationAnyOf!.map((member) => member.map((value) => `${value.id}@${value.version}`))).toEqual([
      ["run.record.move@1", "rules.transition.event.capture@1", "rules.tactic.event.check@1"],
      ["run.record.move@1", "rules.transition.event.capture@1"],
    ]);
    expect(moduleGenerator.indexOf("if (projection.derivation?.anyOf !== undefined)"))
      .toBeLessThan(moduleGenerator.indexOf("if (projection.dependsOn.length > 0)"));
  });

  it("the amendment names the exact runtime assertions and all three production-facing call sites", () => {
    expect(rfc).toMatch(/asserts the `SemanticEvidenceEvent` runtime seal/u);
    expect(rfc).toMatch(/byte-equal edge-1 before-FEN\/UCI\/after-FEN anchor/u);
    expect(rfc).toMatch(/bait capture before check/u);
    expect(rfc).toMatch(/semantic-tactic-sequences\.test\.ts/u);
    expect(rfc).toMatch(/d1930-recorded-path-cost-harness/u);
    expect(rfc).toMatch(/d1931-recorded-path-source-harness/u);
    expect(costCompiler).toMatch(/function check\(edge: PreparedEdge\): SemanticEvidenceEvent \| undefined/u);
    expect(sourceCompiler).toMatch(/checkEvent\(anchor\.beforeFen, anchor\.moveUci\)/u);
  });

  it("the disposable author model is not mistaken for proof of the runtime seal", () => {
    expect(authorModel).toMatch(/interface SealedCheckEventIdentity/u);
    expect(authorModel).not.toMatch(/assertSemanticEvidenceEvent/u);
    expect(rfc).toMatch(/Production bytes did not\s+change in the author or review\s+checkpoint/u);
  });
});
