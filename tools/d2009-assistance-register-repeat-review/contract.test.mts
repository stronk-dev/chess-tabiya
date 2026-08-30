// DISPOSABLE author-repair contract — D2009–D2012. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const hint = read("rfc/hint-distance.md");

const pinned = Object.freeze([
  { head: 1, landing: "e78e7238" },
  { head: 2, landing: "f90d0771" },
  { head: 3, landing: "9e99a541" },
  { head: 4, landing: "765efb56" },
]);
const v5Changes = Object.freeze([
  "apps/web/src/lib/AssistanceSettings.svelte#AssistanceSettings.hintDistance",
  "apps/web/src/lib/assistance-preference.ts#loadAssistance",
  "apps/web/src/lib/assistance-preference.ts#migrate",
  "apps/web/src/lib/assistance-preference.ts#saveAssistance",
  "apps/web/src/lib/assistance-preference.ts#validV4",
  "packages/runtime/src/assistance-codec.ts#parseAssistanceConfig",
  "packages/runtime/src/assistance.ts#AssistanceConfig.hintDistance",
  "packages/runtime/src/assistance.ts#AssistanceConfig.version",
  "packages/runtime/src/assistance.ts#SILENT_ASSISTANCE",
  "packages/runtime/src/assistance.ts#permittedAssistance",
]);

interface Claim { readonly lane: number; readonly rfc: string; readonly changes: readonly string[]; }
interface HistoryRow { readonly head: number; readonly landing?: string; readonly ownerRfc?: string; }
interface State {
  readonly head: number;
  readonly treeHead: number;
  readonly digestMatches: boolean;
  readonly claims: readonly Claim[];
  readonly history: readonly HistoryRow[];
}

function validSnapshot(state: State): boolean {
  if (state.head !== state.treeHead || !state.digestMatches) return false;
  if (state.claims.length > 1) return false;
  if (state.claims.length === 1 && state.claims[0]?.lane !== state.head + 1) return false;
  return state.history.length === state.head
    && state.history.every((row, index) => row.head === index + 1);
}

function validTransition(previous: State | undefined, current: State, changedSymbols: readonly string[]): boolean {
  if (!validSnapshot(current)) return false;
  if (previous === undefined) {
    return current.head === 4
      && current.history.every((row, index) => row.landing === pinned[index]?.landing)
      && current.claims.length === 1
      && current.claims[0]?.rfc === "hint-distance.md"
      && current.claims[0]?.lane === 5
      && JSON.stringify(current.claims[0]?.changes) === JSON.stringify(v5Changes);
  }
  if (!validSnapshot(previous)) return false;
  if (current.head === previous.head) {
    return JSON.stringify(current.history) === JSON.stringify(previous.history) && changedSymbols.length === 0;
  }
  if (current.head !== previous.head + 1) return false;
  const claimant = previous.claims.length === 1 && previous.claims[0]?.lane === current.head
    ? previous.claims[0]
    : undefined;
  if (claimant === undefined || current.claims.length !== 0) return false;
  if (current.history.length !== previous.history.length + 1) return false;
  if (JSON.stringify(current.history.slice(0, -1)) !== JSON.stringify(previous.history)) return false;
  if (current.history.at(-1)?.ownerRfc !== claimant.rfc) return false;
  return JSON.stringify([...changedSymbols].sort()) === JSON.stringify([...claimant.changes].sort());
}

const head4: State = {
  head: 4,
  treeHead: 4,
  digestMatches: true,
  claims: [{ lane: 5, rfc: "hint-distance.md", changes: v5Changes }],
  history: pinned,
};

test("D2009: C9 requires exact contiguous history and prefix-only advancement", () => {
  assert.equal(validSnapshot(head4), true);
  assert.equal(validSnapshot({ ...head4, history: [pinned[3]!] }), false);
  assert.equal(validSnapshot({ ...head4, history: [pinned[0]!, pinned[2]!, pinned[3]!] }), false);
  assert.equal(validSnapshot({ ...head4, history: [pinned[0]!, pinned[1]!, pinned[1]!, pinned[3]!] }), false);
});

test("D2009: the bootstrap pins all four historical landing identities", () => {
  assert.equal(validTransition(undefined, head4, []), true);
  assert.equal(validTransition(undefined, {
    ...head4,
    history: [...pinned.slice(0, 3), { head: 4, landing: "ffffffff" }],
  }, []), false);
});

test("D2010/D2038/D2116: the sole v5 claim names the exact authority delta, never validV5", () => {
  assert.match(rfc, /packages\/runtime\/src\/assistance-codec\.ts#parseAssistanceConfig/u);
  assert.doesNotMatch(rfc, /validV5\/migrate v1-v4 to v5/u);
  assert.match(hint, /contains no parallel `validV5`\/migration switch/u);
  const claim = rfc.match(/assistance-config \| lane 5 \| ([^\n]+)/u)?.[1];
  assert.ok(claim);
  const tokens = claim.split("; ");
  assert.deepEqual(tokens, v5Changes);
  assert.equal(tokens.every((token) => /^[A-Za-z0-9_./-]+\.(?:ts|svelte)#[A-Za-z_$][A-Za-z0-9_$.]*$/u.test(token)), true);
});

test("D2011: the dependent phase stays owner-blocked before repeat review", () => {
  assert.match(rfc, /awaiting the \[\[D1639\]\] owner ceiling ruling, then repeat\s+independent review/u);
  assert.doesNotMatch(rfc, /stale “returned to research” prose to “awaiting independent review/u);
});

test("D2012: no-prior-claim and wrong-owner landings fail", () => {
  const landed: State = {
    head: 5, treeHead: 5, digestMatches: true, claims: [],
    history: [...pinned, { head: 5, ownerRfc: "hint-distance.md" }],
  };
  assert.equal(validTransition({ ...head4, claims: [] }, landed, v5Changes), false);
  assert.equal(validTransition(head4, {
    ...landed,
    history: [...pinned, { head: 5, ownerRfc: "other.md" }],
  }, v5Changes), false);
});

test("D2012: the exact prior claimant advances one head and owns the appended row", () => {
  const landed: State = {
    head: 5, treeHead: 5, digestMatches: true, claims: [],
    history: [...pinned, { head: 5, ownerRfc: "hint-distance.md" }],
  };
  assert.equal(validTransition(head4, landed, v5Changes), true);
  assert.equal(validTransition(head4, landed, v5Changes.slice(0, 2)), false);
  assert.equal(validTransition(head4, landed, [...v5Changes, "apps/web/src/lib/validV5.ts#validV5"]), false);
});

test("D1916 remains closed: a claim cannot excuse current tree or digest drift", () => {
  assert.equal(validSnapshot({ ...head4, digestMatches: false }), false);
  assert.equal(validSnapshot({ ...head4, treeHead: 5 }), false);
});
