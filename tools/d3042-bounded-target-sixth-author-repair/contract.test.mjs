import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(path, "utf8");
const protocol = read("tools/d2202-bounded-target-third-author-repair/protocol.proposed.ts");
const consumer = read("tools/d2202-bounded-target-third-author-repair/protocol.typecheck.ts");
const rfc = read("rfc/bounded-policy-targets.md");
const fifthAuthor = read("tools/d2628-bounded-target-fifth-author-repair/contract.test.mjs");

const publicImage = (sourceText) => {
  const source = ts.createSourceFile("protocol.ts", sourceText, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ removeComments: true });
  return source.statements
    .filter((statement) => statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
    .map((statement) => printer.printNode(ts.EmitHint.Unspecified, statement, source))
    .join("\n");
};

test("D3042 canonical declaration images observe types, modifiers, generics and callables", () => {
  const mutations = [
    protocol.replace("readonly candidateUci: string;", "readonly candidateUci: number;"),
    protocol.replace("readonly requestDigest: string;", "requestDigest?: string;"),
    protocol.replace(
      "export type ProjectionEvidence<Id extends string, Payload>",
      "export type ProjectionEvidence<Id, Payload extends object>",
    ),
    protocol.replace(
      "submit(request: BoundedTargetBatchRequest, signal: AbortSignal): Promise<BoundedTargetBatchResult>;",
      "submit(request: unknown): Promise<string>;",
    ),
  ];
  for (const mutation of mutations) {
    assert.notEqual(mutation, protocol);
    assert.notEqual(publicImage(mutation), publicImage(protocol));
  }
  assert.match(fifthAuthor, /printer\.printNode/u);
  assert.match(fifthAuthor, /assert\.equal\(declarationImage\(name, source\), declarationImage\(name, rfcSource\)/u);
});

test("D3043 admission owns a frozen exchange container while retaining exact wrappers", () => {
  const exchange = Object.freeze({ id: "exchange-a" });
  const caller = [exchange];
  const request = Object.freeze({
    kind: "source_position_batch",
    threat: Object.freeze({ id: "threat" }),
    exchanges: caller,
    sourcePosition: Object.freeze({ id: "position" }),
  });
  const owned = Object.freeze({ ...request, exchanges: Object.freeze([...request.exchanges]) });
  caller.push(Object.freeze({ id: "exchange-b" }));

  assert.equal(owned.exchanges.length, 1);
  assert.equal(owned.exchanges[0], exchange);
  assert.equal(Object.isFrozen(owned), true);
  assert.equal(Object.isFrozen(owned.exchanges), true);
  assert.match(rfc, /No digest, queue lookup or job state is\s+touched before this owned image exists/u);
});

test("D3044 dedup requires both byte bucket and exact authority equivalence", () => {
  const threat = Object.freeze({ bytes: "same" });
  const sourcePosition = Object.freeze({ bytes: "same-position" });
  const first = Object.freeze({ bytes: "exchange" });
  const rebuilt = Object.freeze({ bytes: "exchange" });
  const a = { requestDigest: "same-digest", threat, sourcePosition, exchanges: [first] };
  const reorderedSame = { requestDigest: "same-digest", threat, sourcePosition, exchanges: [first] };
  const rebuiltEqual = { requestDigest: "same-digest", threat, sourcePosition, exchanges: [rebuilt] };
  const sameAuthorities = (left, right) =>
    left.requestDigest === right.requestDigest
    && left.threat === right.threat
    && left.sourcePosition === right.sourcePosition
    && left.exchanges.length === right.exchanges.length
    && left.exchanges.every((item) => right.exchanges.includes(item));

  assert.equal(sameAuthorities(a, reorderedSame), true);
  assert.equal(sameAuthorities(a, rebuiltEqual), false);
  assert.match(rfc, /sameBoundedTargetAuthorities\(a, b\)/u);
  assert.match(rfc, /independently\s+genuine byte-equal wrappers do not/u);
});

test("D3045 the public result assertion is declared and exercised by the consumer", () => {
  assert.match(protocol, /export declare function assertBoundedTargetBatchResult\(value: unknown\): asserts value is BoundedTargetBatchResult;/u);
  assert.match(consumer, /import \{ assertBoundedTargetBatchResult, createBoundedTargetBackgroundService \}/u);
  assert.match(consumer, /assertBoundedTargetBatchResult\(untrusted\);/u);
  assert.match(rfc, /parses exact keys and every\s+nested discriminant/u);
});

test("D3046 malformed input is rejected before recursive digest work", () => {
  let digestCalls = 0;
  const genuine = new WeakSet();
  const admitted = (value) => {
    try {
      if (value === null || typeof value !== "object") throw new Error("shape");
      if (Object.keys(value).sort().join(",") !== "exchanges,kind,sourcePosition,threat") throw new Error("keys");
      if (value.kind !== "source_position_batch" || !Array.isArray(value.exchanges)) throw new Error("shape");
      if (!genuine.has(value.threat) || !genuine.has(value.sourcePosition)
        || !value.exchanges.every((item) => genuine.has(item))) throw new Error("seal");
      digestCalls += 1;
      return { kind: "admitted" };
    } catch {
      return Object.freeze({ kind: "rejected", reason: "invalid_request" });
    }
  };
  const cyclic = {};
  cyclic.self = cyclic;
  const result = admitted({
    kind: "source_position_batch",
    threat: cyclic,
    exchanges: [],
    sourcePosition: cyclic,
  });
  assert.deepEqual(result, { kind: "rejected", reason: "invalid_request" });
  assert.equal(digestCalls, 0);
  assert.match(rfc, /that arm has no request\/result identity/u);
  assert.match(protocol, /readonly kind: "rejected";\s+readonly reason: BoundedTargetBatchRejectionReason;/u);
});
