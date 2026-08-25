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
});
