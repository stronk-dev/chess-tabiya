import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  assertSealedCheckEvent,
  checkSemanticEvent,
  type DeclaredCheckEvidence,
  type SealedCheckEvent,
} from "./model.js";

const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");

describe("D2553 narrow sealed check-event author repair", () => {
  it("mints one sealed event or an honest absence", () => {
    const fact = Object.freeze({ moveUci: "a1a8" });
    const event = checkSemanticEvent(fact)!;
    expect(event.operands).toBe(fact);
    expect(event.evidence.payload).toBe(fact);
    expect(() => assertSealedCheckEvent(event)).not.toThrow();
    expect(checkSemanticEvent(undefined)).toBeUndefined();
  });

  it("does not let declared evidence reconstruct the event seal", () => {
    const evidence: DeclaredCheckEvidence = Object.freeze({
      projection: "rules.tactic.event.check@1",
      payload: Object.freeze({ moveUci: "a1a8" }),
    });
    expect(() => assertSealedCheckEvent(evidence as unknown as SealedCheckEvent)).toThrow(/not constructor-sealed/u);
  });

  it("specifies one constructor shared by tactical and exact-source compilation", () => {
    expect(rfc).toMatch(/export function checkSemanticEvent\([\s\S]*SemanticEvidenceEvent<CheckEvent> \| undefined/u);
    expect(rfc).toMatch(/`tacticalSemanticEvents` calls `checkSemanticEvent`/u);
    expect(rfc).toMatch(/exact-source compiler calls the same constructor/u);
    expect(rfc).toMatch(/readonly check\?: SemanticEvidenceEvent<CheckEvent>/u);
  });

  it("keeps event retention distinct from evidence projection at each consumer", () => {
    expect(rfc).toContain("passes the whole sealed event");
    expect(rfc).toContain("passes `edge.check.evidence`");
    expect(rfc).toMatch(/does not call `replyBreadth`,\s+`doubleAttackEvent` or `tacticalSemanticEvents`/u);
  });
});
