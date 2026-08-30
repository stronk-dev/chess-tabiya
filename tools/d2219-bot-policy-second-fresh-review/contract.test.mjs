// DISPOSABLE second fresh independent review harness — D2219-D2226. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/bot-policy.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const author = read("tools/d1970-bot-policy-author-repair/contract.ts");
const authorTest = read("tools/d1970-bot-policy-author-repair/contract.test.ts");

test("D2219: green model accepts three sampler parameter sets and never runs the captured control", () => {
  assert.match(rfc, /defaults temperature 0\.8 \/ top-p 0\.92/);
  assert.match(author, /temperature: 1\.15, topP: 0\.97/);
  assert.match(authorTest, /temperature: 1, topP: 1/);
  assert.match(author, /page\.appliedBand !== input\.profile\.band/);
  assert.doesNotMatch(author, /page\.temperature !==|page\.topP !==|requestedModel[\s\S]{0,120}profile/);
  assert.match(author, /\*\* \(1 \/ 1\.15\)/);
  assert.doesNotMatch(authorTest, /0\.27|0\.03|positive control|captured production sample/);
});

test("D2220: executable pawn authority is only an a2 prefix", () => {
  assert.equal((author.match(/moveUci\.startsWith\("a2"\)/g) ?? []).length, 2);
  assert.match(authorTest, /\["a2a3", "a2a4", "b2b3"\]/);
  assert.doesNotMatch(authorTest, /b2b3[\s\S]{0,180}pawn_move@1|e7e8[qrbn]|en.?passant/i);
  assert.match(rfc, /Ordinary pawn moves, captures and promotions\s+are positives/);
});

test("D2221: bot persists copied provider fields instead of the admitted delivery", () => {
  assert.match(provider, /must retain the admitted delivery input; no adapter may strip\s+the receipt/);
  assert.match(rfc, /interface ExactBotProviderSourceIdentity/);
  assert.match(rfc, /providerSourceDigests: readonly/);
  const record = rfc.slice(rfc.indexOf("interface BotPolicyDerivation"), rfc.indexOf("readonly policy?: BotPolicyEventEnvelope"));
  assert.doesNotMatch(record, /ProviderEvidenceDelivery|ProviderAcquisitionReceipt|ProviderDelivery/);
});

test("D2222: capability requires live provider state without depending on provider health", () => {
  const header = rfc.slice(0, rfc.indexOf("## Summary"));
  assert.match(rfc, /live provider availability/);
  assert.match(rfc, /roster capability reads compiled profile \+ provider state/);
  assert.doesNotMatch(header, /provider-health-degradation|ProviderRegistrySnapshot/);
});

test("D2223: opponent-ply has outcome names but no result/status protocol", () => {
  assert.match(rfc, /POST \/runs\/:runId\/opponent-ply/);
  assert.match(rfc, /closed outcomes `committed \| replayed_idempotent \| stale_root \|/);
  assert.doesNotMatch(rfc, /interface BotOpponentPlyResult|type BotOpponentPlyResult|OPPONENT_(?:STALE|UNAVAILABLE)|HTTP 409|status: 409/);
});

test("D2224: shared profile identities are claimed catalog-local with no register", () => {
  const normative = rfc.slice(0, rfc.indexOf("## Second fresh independent return"));
  assert.match(normative, /policy\/layer\/profile definitions are \*\*catalog-local/);
  assert.match(normative, /run schema 0\.17→0\.18/);
  assert.match(normative, /`\/capabilities` gains `policyProfiles\.human_common\.profiles`/);
  assert.match(normative, /client declares no parallel family\s+enum/);
  assert.doesNotMatch(normative, /bot-profile-catalog register|profile-catalog head|shared-resource register claim/);
});

test("D2225: decision grammar has undefined identities and an emitted reason outside its union", () => {
  assert.match(rfc, /source: ExactStockfishSourceIdentity/);
  assert.doesNotMatch(rfc, /(?:interface|type) ExactStockfishSourceIdentity/);
  assert.match(rfc, /readonly id: CandidateFeatureId;\s*\/\/ generated/);
  assert.doesNotMatch(rfc, /(?:type|interface) CandidateFeatureId/);
  assert.match(author, /reason: "guard_dependency_abstained"/);
  const reasons = rfc.slice(rfc.indexOf("type BotDegradationReason"), rfc.indexOf("interface BotRootIdentity"));
  assert.doesNotMatch(reasons, /guard_dependency_abstained/);
});

test("D2226: no-call replay cannot compare changed provider identities", () => {
  assert.match(rfc, /checked for the request id \*\*before any\s+provider call\*\*[\s\S]{0,180}returns the stored event envelope/);
  assert.match(rfc, /Reuse with a different root, writer,[\s\S]{0,120}derivation or provider source identity refuses/);
  const begin = author.slice(author.indexOf("export function beginBotOperation"), author.indexOf("export function commitBotOperation"));
  assert.match(begin, /replayed_idempotent/);
  assert.doesNotMatch(begin, /provider|derivationDigest|commitOperandDigest/);
});
