import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, test } from "vitest";
import { evidenceDigest } from "../../packages/runtime/src/evidence-contract.js";

const rfc = readFileSync("rfc/bounded-policy-targets.md", "utf8");
const author = readFileSync("tools/d2628-bounded-target-fifth-author-repair/contract.test.mjs", "utf8");
const protocolPath = "tools/d2202-bounded-target-third-author-repair/protocol.proposed.ts";
const protocol = readFileSync(protocolPath, "utf8");

function authorShape(sourceText: string): Readonly<Record<string, readonly string[]>> {
  const source = ts.createSourceFile("protocol.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const shape: Record<string, readonly string[]> = {};
  for (const statement of source.statements) {
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (!("name" in statement) || statement.name === undefined || !ts.isIdentifier(statement.name)) continue;
    if (ts.isInterfaceDeclaration(statement) || ts.isClassDeclaration(statement)) {
      shape[statement.name.text] = statement.members
        .map((member) => member.name?.getText(source))
        .filter((name): name is string => name !== undefined)
        .sort();
    } else {
      shape[statement.name.text] = [];
    }
  }
  return shape;
}

describe("bounded-target fifth fresh independent review", () => {
  test("D3042 the author equality cannot observe public field or callable type changes", () => {
    const changed = protocol
      .replace("readonly candidateUci: string;", "readonly candidateUci: number;")
      .replace("readonly requestDigest: string;", "readonly requestDigest: number;")
      .replace(
        "submit(request: BoundedTargetBatchRequest, signal: AbortSignal): Promise<BoundedTargetBatchResult>;",
        "submit(request: unknown): Promise<string>;",
      );
    expect(changed).not.toBe(protocol);
    expect(authorShape(changed)).toEqual(authorShape(protocol));
    expect(author).toContain("memberNames(name, source)");
    expect(author).not.toMatch(/moduleNode\.getText|rfcNode\.getText|SyntaxKind\.ReadonlyKeyword|questionToken/u);
  });

  test("D3043 readonly request syntax does not snapshot a queued caller-owned array", () => {
    const callerOwned: unknown[] = [Object.freeze({ id: "exchange-a" })];
    const request = { exchanges: callerOwned as readonly unknown[] };
    const admittedForLater = request.exchanges;
    callerOwned.push(Object.freeze({ id: "exchange-b" }));
    expect(admittedForLater).toHaveLength(2);
    expect(rfc).toContain("readonly exchanges: readonly LegalExchangeEvidence[];");
    expect(rfc).not.toMatch(/(?:snapshot|cop(?:y|ies)|clone)[^.]{0,120}(?:exchange|request).{0,120}(?:before|prior to).{0,80}(?:queue|dedup)/iu);
  });

  test("D3044 byte dedup returns the first wrapper's ancestry to an equal genuine waiter", () => {
    const first = Object.freeze({ producer: { id: "rules.tactic", version: 1 }, projection: { id: "rules.tactic.consequence.threat", version: 1 }, payload: { fen: "same" } });
    const second = Object.freeze({ producer: { id: "rules.tactic", version: 1 }, projection: { id: "rules.tactic.consequence.threat", version: 1 }, payload: { fen: "same" } });
    expect(first).not.toBe(second);
    const key = evidenceDigest(first);
    expect(evidenceDigest(second)).toBe(key);
    const sharedJobs = new Map<string, Readonly<{ input: typeof first }>>();
    sharedJobs.set(key, Object.freeze({ input: first }));
    const attached = sharedJobs.get(evidenceDigest(second));
    expect(attached?.input).toBe(first);
    expect(attached?.input).not.toBe(second);
    expect(rfc).toMatch(/exact input references\/digests/u);
    expect(rfc).toMatch(/an equal rebuilt input[\s\S]{0,80}fails/u);
    expect(rfc).toMatch(/Each exact request digest owns one queued\/running job/u);
  });

  test("D3045 the promised public result validator is absent from the complete protocol", () => {
    expect(rfc).toMatch(/the public validator removes it and recomputes the same image/u);
    expect(protocol).not.toMatch(/export declare function (?:assert|parse|validate)BoundedTargetBatchResult/u);
    expect(protocol).toContain("export type BoundedTargetBatchResult =");
  });

  test("D3046 cyclic untrusted input throws before the promised seal-failure result", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => evidenceDigest({ domain: "tabiya:bounded-target-input@1", payload: cyclic })).toThrow();
    expect(rfc).toMatch(/A failed seal still receives a stable\s+request identity by hashing the visible triple first/su);
    expect(rfc).toMatch(/Once constructed, `submit\(\)` never throws/u);
  });
});
