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

function proposedCollisionErrors(claims: readonly Claim[]): readonly string[] {
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

function proposedTreeProjection(declarations: readonly Declaration[]): readonly string[] {
  return declarations
    .map(({ ref }) => `${ref.id}@${ref.version}`)
    .sort();
}

describe("semantic-convention register draft", () => {
  it("allows two live RFCs to claim successive versions of one convention", () => {
    const errors = proposedCollisionErrors([
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

  it("shows the only machine-readable seed authority is labelled disposable and private", () => {
    const seed = readFileSync(
      "tools/d1722-convention-identity-harness/initial-member-census.test.ts",
      "utf8",
    );
    expect(seed).toContain("DISPOSABLE research harness");
    expect(seed).toContain("const INITIAL_CONVENTION_MEMBERS");
    expect(seed).not.toContain("export const INITIAL_CONVENTION_MEMBERS");
  });
});
