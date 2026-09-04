// DISPOSABLE fresh buildability review — D2553. This reconstructs the proposed
// narrow operation from the live manifest/compiler and compares it with the
// broad production collector. It does not import the disposable author model.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { declareCheckEventEvidence } from "../../packages/runtime/src/evidence-source-adapters.js";
import {
  assertSemanticEvidenceEvent,
  compileSemanticEvidenceEvent,
  localSemanticEvents,
  tacticalSemanticEvents,
  type SemanticEvidenceEvent,
} from "../../packages/runtime/src/semantic-evidence.js";
import { checkEvent, replyBreadth, type CheckEvent } from "../../packages/runtime/src/tactics.js";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
const sourceCompiler = readFileSync("tools/d1931-recorded-path-source-harness/source-closure.test.ts", "utf8");

const key = (event: SemanticEvidenceEvent): string => `${event.projection.id}@${event.projection.version}`;

function proposedCheckSemanticEvent(
  beforeFen: string,
  moveUci: string,
  afterFen: string,
): SemanticEvidenceEvent<CheckEvent> | undefined {
  const fact = checkEvent(beforeFen, moveUci);
  if (fact === undefined) return undefined;
  return compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, {
    evidence: declareCheckEventEvidence(fact),
    anchor: { beforeFen, moveUci, afterFen, side: positionFromFen(beforeFen).turn },
    sign: "state",
    operands: fact,
  });
}

function played(beforeFen: string, moveUci: string): string {
  return replyBreadth(beforeFen, moveUci).afterFen;
}

function broadCheck(beforeFen: string, moveUci: string, afterFen: string): SemanticEvidenceEvent<CheckEvent> {
  return tacticalSemanticEvents(beforeFen, moveUci, afterFen)
    .find((event): event is SemanticEvidenceEvent<CheckEvent> => key(event) === "rules.tactic.event.check@1")!;
}

describe("D2553 deflection check-seal fresh review", () => {
  const checkOnlyFen = "7k/4q1r1/8/8/8/8/8/R1K1R3 w - - 0 1";
  const dualFen = "1B6/r3q3/1kn5/8/8/8/8/4R1K1 w - - 0 1";

  it.each([
    ["check-only", checkOnlyFen, "a1a8"],
    ["dual-arm", dualFen, "b8a7"],
  ] as const)("mints the same sealed event identity as the broad collector on %s", (_name, beforeFen, moveUci) => {
    const afterFen = played(beforeFen, moveUci);
    const narrow = proposedCheckSemanticEvent(beforeFen, moveUci, afterFen)!;
    const broad = broadCheck(beforeFen, moveUci, afterFen);
    const local = localSemanticEvents(beforeFen, moveUci, afterFen)
      .find((event) => key(event) === "rules.tactic.event.check@1")!;

    expect(narrow.id).toBe(broad.id);
    expect(narrow.id).toBe(local.id);
    expect(narrow.anchor).toEqual(broad.anchor);
    expect(narrow.operands).toEqual(broad.operands);
    expect(narrow.evidence.payload).toBe(narrow.operands);
    expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, narrow)).not.toThrow();
  });

  it("returns honest absence and refuses a crossed after-FEN before minting", () => {
    const quietFen = "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1";
    const quietAfter = played(quietFen, "b8a7");
    expect(proposedCheckSemanticEvent(quietFen, "b8a7", quietAfter)).toBeUndefined();
    expect(() => proposedCheckSemanticEvent(checkOnlyFen, "a1a8", checkOnlyFen)).toThrow(/after FEN does not match/u);
  });

  it("specifies event retention without widening the exact-source collector", () => {
    expect(rfc).toContain("readonly check?: SemanticEvidenceEvent<CheckEvent>");
    expect(rfc).toContain("does not call `replyBreadth`");
    expect(rfc).toContain("Eager and exact-source modes therefore retain byte-identical check-event ids");
    expect(sourceCompiler).toContain("readonly check?: DeclaredEvidence<unknown>");
    expect(sourceCompiler).not.toContain("tacticalSemanticEvents(");
  });
});
