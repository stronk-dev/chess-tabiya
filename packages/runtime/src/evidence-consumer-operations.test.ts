import { describe, expect, it } from "vitest";

import {
  assertEvidenceConsumerOperations,
  evidenceConsumerOperation,
  type ConsumerDeclaration,
  type EvidenceConsumerOperation,
} from "./evidence-contract.js";

function declared(id: string, implementation: string): ConsumerDeclaration {
  return {
    id,
    version: 1,
    implementation,
    accepts: [],
    timing: ["analysis"],
    roles: ["operator"],
    sessions: ["pack"],
    forms: ["panel"],
    answerContent: ["fact"],
    latency: { mode: "sync", maxMs: 10 },
    budget: { maxFacts: 1, maxForms: 1 },
    providerOff: "available",
  };
}

function firstConsumer(): void {}
function secondConsumer(): void {}

describe("evidence consumer operation registry", () => {
  const declarations = Object.freeze([
    declared("first", "firstConsumer"),
    declared("second", "secondConsumer"),
  ]);
  const operations = Object.freeze([
    evidenceConsumerOperation("first", firstConsumer),
    evidenceConsumerOperation("second", secondConsumer),
  ]);

  it("binds every current consumer id to the exact exported callable named by its declaration", () => {
    expect(() => assertEvidenceConsumerOperations(["first", "second"], declarations, operations)).not.toThrow();
    expect(Object.isFrozen(operations[0])).toBe(true);
    expect(Object.isFrozen(operations[0]?.consumer)).toBe(true);
  });

  it("refuses a missing operation and a duplicate registration", () => {
    expect(() => assertEvidenceConsumerOperations(["first", "second"], declarations, operations.slice(0, 1))).toThrowError(/not set-equal/u);
    expect(() => assertEvidenceConsumerOperations(["first", "second"], declarations, [operations[0]!, operations[0]!])).toThrowError(/duplicate id/u);
  });

  it("refuses declaration-to-callable drift and unsupported operation versions", () => {
    expect(() => assertEvidenceConsumerOperations(["first", "second"], [declared("first", "secondConsumer"), declarations[1]!], operations)).toThrowError(/declares secondConsumer but exports firstConsumer/u);
    const future = { ...operations[0]!, consumer: { id: "first", version: 2 } } as EvidenceConsumerOperation;
    expect(() => assertEvidenceConsumerOperations(["first", "second"], declarations, [future, operations[1]!])).toThrowError(/unsupported version 2/u);
  });

  it("refuses empty ids and non-callables at registration", () => {
    expect(() => evidenceConsumerOperation(" ", firstConsumer)).toThrowError(/must not be empty/u);
    expect(() => evidenceConsumerOperation("first", "not callable" as unknown as CallableFunction)).toThrowError(/must be callable/u);
  });

  it("refuses a non-callable forged with the correct implementation name at the assertion boundary", () => {
    const forged = { ...operations[0]!, operation: { name: "firstConsumer" } } as unknown as EvidenceConsumerOperation;
    expect(() => assertEvidenceConsumerOperations(["first", "second"], declarations, [forged, operations[1]!])).toThrowError(/must be callable/u);
  });

  it("registers every declared version without replacing its predecessor or hiding a missing callable", () => {
    const successor = { ...declarations[0]!, version: 2, implementation: "secondConsumer" };
    const current = [...declarations, successor];
    const exact = [...operations, evidenceConsumerOperation("first", secondConsumer, 2)];
    expect(() => assertEvidenceConsumerOperations(["first", "second"], current, exact)).not.toThrow();
    expect(() => assertEvidenceConsumerOperations(["first", "second"], current, operations)).toThrow(/not set-equal/u);
    expect(() => assertEvidenceConsumerOperations(["first", "second"], current, [...operations, { ...exact[2]!, operation: firstConsumer }])).toThrow(/declares secondConsumer but exports firstConsumer/u);
    expect(Object.isFrozen(exact[2])).toBe(true);
    expect(Object.isFrozen(exact[2]?.consumer)).toBe(true);
    expect(exact[2]?.consumer).toEqual({ id: "first", version: 2 });
  });

  it("does not let duplicate declaration versions overwrite the registered implementation", () => {
    expect(() => assertEvidenceConsumerOperations(["first", "second"], [...declarations, declared("first", "secondConsumer")], operations)).toThrow(/duplicate/u);
  });

  it("refuses malformed exact operation versions before comparing declarations", () => {
    for (const version of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1", null]) {
      const malformed = { ...operations[0]!, consumer: { id: "first", version } } as EvidenceConsumerOperation;
      expect(() => assertEvidenceConsumerOperations(["first", "second"], declarations, [malformed, operations[1]!])).toThrow(/version/u);
      expect(() => evidenceConsumerOperation("first", firstConsumer, version as number)).toThrow(/version/u);
    }
  });

  it("does not let an unrelated declared operation replace an omitted expected family", () => {
    const unrelated = declared("other", "secondConsumer");
    expect(() => assertEvidenceConsumerOperations(["first", "second"], [...declarations, unrelated], [operations[0]!, evidenceConsumerOperation("other", secondConsumer)])).toThrow(/not set-equal/u);
  });

  it("refuses duplicate expected families and malformed declaration versions", () => {
    expect(() => assertEvidenceConsumerOperations(["first", "first"], declarations, operations)).toThrow(/duplicate expected id/u);
    expect(() => assertEvidenceConsumerOperations(["first", "second"], [{ ...declarations[0]!, version: 0 }, declarations[1]!], operations)).toThrow(/invalid version/u);
  });
});
