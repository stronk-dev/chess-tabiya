// DISPOSABLE process/buildability harness — D1917/D1918. Not production code.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

interface Claim {
  readonly rfc: string;
  readonly refs: readonly string[];
}

interface Declaration {
  readonly ref: Readonly<{ id: string; version: number }>;
  readonly definition: string;
  readonly limitations: readonly string[];
  readonly disclosure: Readonly<{ summary: string; detail: string }>;
}

function originalCollisionErrors(claims: readonly Claim[]): readonly string[] {
  const owners = new Map<string, string>();
  const errors: string[] = [];
  for (const claim of claims) {
    for (const ref of claim.refs) {
      const owner = owners.get(ref);
      if (owner && owner !== claim.rfc) errors.push(`${owner}/${claim.rfc}:${ref}`);
      else owners.set(ref, claim.rfc);
    }
  }
  return errors;
}

function parseRef(value: string): Readonly<{ id: string; version: number }> {
  const match = /^([a-z][a-z0-9_-]*)@([1-9][0-9]*)$/.exec(value);
  if (match === null) throw new TypeError(`Invalid convention ref ${value}`);
  return Object.freeze({ id: match[1]!, version: Number(match[2]) });
}

function lineageErrors(claims: readonly Claim[], landed: readonly string[]): readonly string[] {
  const heads = new Map<string, number>();
  for (const value of landed) {
    const parsed = parseRef(value);
    heads.set(parsed.id, Math.max(heads.get(parsed.id) ?? 0, parsed.version));
  }
  const owners = new Map<string, string>();
  const errors: string[] = [];
  for (const claim of claims) {
    for (const value of claim.refs) {
      const parsed = parseRef(value);
      const owner = owners.get(parsed.id);
      if (owner !== undefined && owner !== claim.rfc) errors.push(`${owner}/${claim.rfc}:${parsed.id}`);
      else owners.set(parsed.id, claim.rfc);
      const expected = (heads.get(parsed.id) ?? 0) + 1;
      if (parsed.version !== expected) errors.push(`${value}:expected@${expected}`);
    }
  }
  return Object.freeze(errors);
}

function proposedTreeProjection(declarations: readonly Declaration[]): readonly string[] {
  return declarations
    .map(({ ref }) => `${ref.id}@${ref.version}`)
    .sort();
}

describe("semantic-convention register draft", () => {
  it("allows two live RFCs to claim successive versions of one convention", () => {
    const errors = originalCollisionErrors([
      { rfc: "space-v2.md", refs: ["space@2"] },
      { rfc: "space-v3.md", refs: ["space@3"] },
    ]);
    expect(errors).toEqual([]);
  });

  it("cannot observe a same-id/version semantic rewrite through its tree projection", () => {
    const before: Declaration[] = [{
      ref: { id: "space", version: 1 },
      definition: "Count controlled squares beyond the home half.",
      limitations: ["Position-local."],
      disclosure: { summary: "Space", detail: "Controlled advanced squares." },
    }];
    const after: Declaration[] = [{
      ...before[0],
      definition: "Count occupied squares beyond the home half.",
      limitations: ["Different truth set."],
      disclosure: { summary: "Space", detail: "Occupied advanced squares." },
    }];
    expect(proposedTreeProjection(after)).toEqual(proposedTreeProjection(before));
  });

  it("shows the original seed authority lived only inside a disposable harness", () => {
    const review = readFileSync("planning/semantic-convention-register/independent-buildability-review-2026-08-27.md", "utf8");
    expect(review).toMatch(/a non-exported constant in a\s+file whose first line labels it a disposable research harness/u);
  });
});

describe("amended semantic-convention register candidate", () => {
  it("serializes one base-id lineage while permitting independent ids", () => {
    expect(lineageErrors([
      { rfc: "space-v2.md", refs: ["space@2"] },
      { rfc: "space-v3.md", refs: ["space@3"] },
    ], ["space@1"])).toEqual([
      "space-v2.md/space-v3.md:space",
      "space@3:expected@2",
    ]);
    expect(lineageErrors([
      { rfc: "space-v2.md", refs: ["space@2"] },
      { rfc: "threat-v2.md", refs: ["threat@2"] },
    ], ["space@1", "threat@1"])).toEqual([]);
  });

  it("requires @1 for new ids and exact head+1 for existing ids", () => {
    expect(lineageErrors([{ rfc: "new.md", refs: ["novel@2"] }], [])).toEqual(["novel@2:expected@1"]);
    expect(lineageErrors([{ rfc: "skip.md", refs: ["space@3"] }], ["space@1"])).toEqual(["space@3:expected@2"]);
    expect(lineageErrors([{ rfc: "next.md", refs: ["space@2"] }], ["space@1"])).toEqual([]);
  });

  it("uses one stable schema-versioned seed authority", () => {
    const seed = JSON.parse(readFileSync("planning/semantic-convention-register/initial-members.json", "utf8")) as {
      readonly schemaVersion: number;
      readonly members: readonly { readonly ref: string }[];
    };
    expect(seed.schemaVersion).toBe(1);
    expect(seed.members).toHaveLength(39);
    expect(seed.members.map((value) => value.ref)).toEqual([...seed.members.map((value) => value.ref)].sort());
    const census = readFileSync("tools/d1722-convention-identity-harness/initial-member-census.test.ts", "utf8");
    expect(census).toContain("planning/semantic-convention-register/initial-members.json");
    expect(census).not.toContain("{ ref: \"space@1\"");
  });

  it("states identity-only scope and routes semantic bytes to append-only history", () => {
    const rfc = readFileSync("rfc/semantic-convention-register.md", "utf8");
    expect(rfc).toContain("identity membership only");
    expect(rfc).toContain("packages/runtime/src/evidence-convention-history.jsonl");
    expect(rfc).toContain("make semantic-convention-history-check");
  });
});
