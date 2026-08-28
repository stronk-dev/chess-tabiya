import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const bot = read("rfc/bot-policy.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const packet = read("rfc/shared-candidate-evidence-packet.md");
const storage = read("apps/server/src/storage.ts");

test("D1970: bot acquisition forks the shared provider deliveries", () => {
  assert.match(bot, /`stockfish-guard@1` candidate-set receipt/u);
  assert.match(bot, /`OpponentSelector` internal acquisition/u);
  assert.match(provider, /"stockfish\.legal_root_table@1"/u);
  assert.match(provider, /"maia\.policy_page@1"/u);
  assert.match(provider, /No operation may maintain a private queue, retained cache or receipt constructor/u);
  assert.doesNotMatch(bot, /ProviderEvidenceDelivery<StockfishLegalRootTable>/u);
  assert.doesNotMatch(bot, /ProviderEvidenceDelivery<MaiaPolicyPage>/u);
});

test("D1971: high returned mass does not establish legal-set completeness", () => {
  const legal = new Set(["a2a3", "a2a4", "b2b3"]);
  const page = Object.freeze({
    requestedWidth: legal.size,
    returnedWidth: 2,
    returnedProbabilityMass: 0.99,
    coverage: "bounded_top_k" as const,
    candidates: Object.freeze(["a2a3", "a2a4"]),
  });
  assert.equal(page.returnedProbabilityMass >= 0.97, true);
  assert.equal(page.returnedWidth === legal.size && page.candidates.every((move) => legal.has(move)), false);
  assert.match(provider, /readonly coverage: "bounded_top_k"/u);
  assert.match(bot, /legal-complete by construction/u);
});

test("D1972: the persisted decision grammar admits undeclared authorities", () => {
  for (const openField of [
    /readonly degradedReason\?: string/u,
    /readonly rootIdentity: string/u,
    /readonly classifierIds: readonly string\[\]/u,
    /readonly reason\?: string/u,
    /Readonly<Record<string, number \| string>>/u,
    /readonly id: string;\s+\/\/ e\.g\. "rules\.tactic/u,
  ]) assert.match(bot, openField);
  assert.doesNotMatch(bot, /function (?:create|project|parse)BotPolicyDecisionRecord/u);
});

test("D1973: node-only preconditions cannot close branch, event-head, or concurrent-save races", () => {
  const left = Object.freeze({ nodeId: "root", branchId: "main", eventHead: "h1", seed: 1 });
  const right = Object.freeze({ nodeId: "root", branchId: "alt-1", eventHead: "h9", seed: 2 });
  assert.equal(left.nodeId, right.nodeId);
  assert.notEqual(left.branchId, right.branchId);
  assert.notEqual(left.eventHead, right.eventHead);
  assert.notEqual(left.seed, right.seed);
  assert.match(bot, /\{ expectedNodeId, requestId \}/u);
  assert.doesNotMatch(bot, /expectedBranchId|expectedEventHead/u);
  assert.match(storage, /WHERE id = \? AND active_writer_id = \? AND active_writer_learner_id = \?/u);
  assert.doesNotMatch(storage, /WHERE id = \?[\s\S]{0,180}(?:event_head|expected_event|snapshot_digest)/u);
});

test("D1974: operation bytes vary while policy derivation is claimed byte-identical", () => {
  const first = Object.freeze({ moveUci: "e7e5", requestId: "request-a", elapsedMs: 101 });
  const retryShaped = Object.freeze({ moveUci: "e7e5", requestId: "request-b", elapsedMs: 117 });
  assert.equal(first.moveUci, retryShaped.moveUci);
  assert.notDeepEqual(first, retryShaped);
  assert.match(bot, /readonly requestId: string/u);
  assert.match(bot, /readonly elapsedMs: number/u);
  assert.match(bot, /reproduce the same selection and the same \u00a76 record, byte-identically/u);
});

test("D1975: a failed base model has no distribution from which to select a fallback move", () => {
  type BaseResult = Readonly<{ kind: "delivered"; mass: readonly number[] }> | Readonly<{ kind: "unavailable" }>;
  const select = (base: BaseResult): number | undefined => base.kind === "delivered" ? base.mass.findIndex((mass) => mass > 0) : undefined;
  assert.equal(select({ kind: "unavailable" }), undefined);
  assert.match(bot, /the base model fails[\s\S]{0,180}falls back only through the already-declared Maia\/base-mode behavior/u);
  assert.doesNotMatch(bot, /base_provider_unavailable/u);
});

test("D1976: Stage B conflicts with the one-packet, one-root-table foundation", () => {
  assert.match(bot, /one legal move \+ one evaluation per candidate/u);
  assert.match(packet, /one delivered complete root table/u);
  assert.match(packet, /no longer fans it out once per\s+child/u);
  assert.doesNotMatch(bot, /CandidatePopulationReceipt/u);
  assert.doesNotMatch(bot, /StockfishLegalRootTable/u);
});
