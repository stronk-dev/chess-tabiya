// DISPOSABLE fresh buildability-review reproduction — D2037/D2038. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const workflow = read(".github/workflows/verify.yml");
const rfc = read("rfc/assistance-config-register.md");
const authorContract = read("tools/d2009-assistance-register-repeat-review/contract.test.mts");
const statusParity = read("tools/status-parity.mjs");

const v5Changes = Object.freeze([
  "packages/runtime/src/assistance-codec.ts#parseAssistanceConfig",
  "packages/runtime/src/assistance.ts#AssistanceConfig.hintDistance",
  "packages/runtime/src/assistance.ts#AssistanceConfig.version",
]);

interface Claim { readonly lane: number; readonly rfc: string; readonly changes: readonly string[]; }
interface HistoryRow { readonly head: number; readonly ownerRfc?: string; }
interface State {
  readonly head: number;
  readonly claims: readonly Claim[];
  readonly history: readonly HistoryRow[];
}

function authorTransition(previous: State, current: State, changedSymbols: readonly string[]): boolean {
  if (current.head !== previous.head + 1) return false;
  const claimant = previous.claims.length === 1 && previous.claims[0]?.lane === current.head
    ? previous.claims[0]
    : undefined;
  if (claimant === undefined || current.claims.length !== 0) return false;
  if (current.history.length !== previous.history.length + 1) return false;
  if (current.history.at(-1)?.ownerRfc !== claimant.rfc) return false;
  return JSON.stringify([...changedSymbols].sort()) === JSON.stringify([...claimant.changes].sort());
}

test("D2037: governance CI checks out no first-parent history", () => {
  const governance = workflow.match(/repository-governance:[\s\S]*?(?=\n  [a-z][a-z-]+:|$)/u)?.[0] ?? "";
  assert.match(governance, /uses: actions\/checkout@v7/u);
  assert.doesNotMatch(governance, /fetch-depth:\s*(?:2|[3-9]|[1-9][0-9]+)/u);
  assert.match(rfc, /committed CI compares the current file with its first parent/u);
});

test("D2037: the implementation boundary forbids the workflow repair it needs", () => {
  const boundary = rfc.match(/### 6\. Files and boundaries[\s\S]*?## Deviations from design/u)?.[0] ?? "";
  assert.doesNotMatch(boundary, /\.github\/workflows\/verify\.yml/u);
  assert.match(rfc, /`git diff` contains no runtime\/web\/schema\/storage\/content\/archive file/u);
});

test("D2037: the existing committed-change reader demonstrates silent shallow-history omission", () => {
  assert.match(statusParity, /changeSets\.committed = names\(\["diff", "--name-only", "HEAD\^", "HEAD"\]\)/u);
  assert.match(statusParity, /catch \{ \/\* non-git fixture root \*\/ \}/u);
});

test("D2038: the author transition admits a parallel browser codec omitted before projection", () => {
  const previous: State = {
    head: 4,
    claims: [{ lane: 5, rfc: "hint-distance.md", changes: v5Changes }],
    history: [{ head: 1 }, { head: 2 }, { head: 3 }, { head: 4 }],
  };
  const current: State = {
    head: 5,
    claims: [],
    history: [...previous.history, { head: 5, ownerRfc: "hint-distance.md" }],
  };
  const actualChangedFiles = Object.freeze([
    ...v5Changes,
    "apps/web/src/lib/validV5.ts#validV5",
  ]);

  assert.equal(actualChangedFiles.length, 4);
  assert.equal(authorTransition(previous, current, v5Changes), true);
  assert.match(rfc, /`validV5` or a\s+parallel web migration authority fails the claim\/transition fixture/u);
  assert.match(authorContract, /function validTransition\(previous: State \| undefined, current: State, changedSymbols: readonly string\[\]\)/u);
  assert.doesNotMatch(authorContract, /changedFiles|authorityRoots|importGraph/u);
});
