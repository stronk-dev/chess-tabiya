// DISPOSABLE fresh buildability review — D2552/D2553. This exercises the
// real chess line, runtime event seal and exact-source call boundary. It does
// not implement the collector repair.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { declareCheckEventEvidence } from "../../packages/runtime/src/evidence-source-adapters.js";
import {
  assertSemanticEvidenceEvent,
  deflectionObservedOperands,
  localSemanticEvents,
  tacticalSemanticEvents,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
} from "../../packages/runtime/src/semantic-evidence.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";
import { checkEvent, replyBreadth, type CheckEvent } from "../../packages/runtime/src/tactics.js";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
const sourceCompiler = readFileSync("tools/d1931-recorded-path-source-harness/source-closure.test.ts", "utf8");
const costCompiler = readFileSync("tools/d1930-recorded-path-cost-harness/recorded-path-cost.test.ts", "utf8");

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

const key = (event: SemanticEvidenceEvent): string => `${event.projection.id}@${event.projection.version}`;

describe("D2552 deflection check-source fresh review", () => {
  const path = anchors("1B6/r3q3/1kn5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
  const payload = deflectionObservedOperands(path)[0]!;
  const firstCheck = localSemanticEvents(path[0]!.beforeFen, path[0]!.moveUci, path[0]!.afterFen)
    .find((event): event is SemanticEvidenceEvent<CheckEvent> => key(event) === "rules.tactic.event.check@1")!;

  it("the required dual-arm fixture is legal and satisfies bait capture plus edge-one check", () => {
    expect(payload).toBeDefined();
    expect(payload).toMatchObject({
      baitMove: { moveUci: "b8a7" },
      defenderBefore: { square: "c6" },
      defenderAfter: { square: "a7" },
      lostDuty: { target: { square: "e7" } },
    });
    expect(firstCheck).toBeDefined();
    const replyCapture = transitionSemanticEvents(path[1]!.beforeFen, path[1]!.moveUci, path[1]!.afterFen)
      .find((event) => key(event) === "rules.transition.event.capture@1");
    expect(replyCapture?.operands).toMatchObject({ family: "capture", captured: { color: "white" } });
    expect(path[1]!.moveUci.slice(2, 4)).toBe(path[0]!.moveUci.slice(2, 4));
  });

  it("the real edge-one check event is sealed and exactly anchored", () => {
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, firstCheck)).not.toThrow();
    expect(firstCheck.anchor).toMatchObject({
      beforeFen: path[0]!.beforeFen,
      moveUci: path[0]!.moveUci,
      afterFen: path[0]!.afterFen,
    });
    expect(firstCheck.evidence.payload).toBe(firstCheck.operands);
  });

  it("declared evidence alone remains unsealed while exact-source retains the event", () => {
    const raw = checkEvent(path[0]!.beforeFen, path[0]!.moveUci)!;
    const evidenceOnly = declareCheckEventEvidence(raw) as unknown as SemanticEvidenceEvent<CheckEvent>;
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, evidenceOnly)).toThrow();
    expect(sourceCompiler).toMatch(/readonly check\?: SemanticEvidenceEvent<CheckEvent>/u);
    expect(sourceCompiler).toMatch(/checkEvidence = checkSemanticEvent\(anchor\.beforeFen, anchor\.moveUci, anchor\.afterFen\)/u);
    expect(sourceCompiler).not.toMatch(/checkEvidence = value === undefined \? undefined : declareCheckEventEvidence\(value\)/u);
  });

  it("both compilers retain an event without widening exact-source collection", () => {
    expect(costCompiler).toMatch(/function check\(edge: PreparedEdge\): SemanticEvidenceEvent \| undefined/u);
    const tactical = tacticalSemanticEvents(path[0]!.beforeFen, path[0]!.moveUci, path[0]!.afterFen);
    expect(tactical.map(key)).toContain("rules.tactic.event.check@1");
    expect(tactical.map(key)).toContain("rules.tactic.consequence.reply_breadth@1");
    expect(rfc).toContain("all three call sites");
    expect(rfc).toContain("sealed first-edge check event");
    expect(sourceCompiler).not.toContain("tacticalSemanticEvents(");
  });
});
