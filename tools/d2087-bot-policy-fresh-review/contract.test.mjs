// DISPOSABLE fresh independent review harness — D2087-D2096. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/bot-policy.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const author = read("tools/d1970-bot-policy-author-repair/contract.ts");
const authorTest = read("tools/d1970-bot-policy-author-repair/contract.test.ts");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2087: the durable operation receipt has no storage home and embeds its own committed head", () => {
  const record = section(rfc, "interface BotPolicyDerivation", "There is one constructor");
  assert.match(record, /readonly policy\?: BotPolicyDecisionRecord/u);
  assert.doesNotMatch(record, /BotOperationReceipt/u);
  const receipt = section(rfc, "interface BotOperationReceipt", "The derivation digest covers");
  assert.match(receipt, /committedEventHeadDigest/u);
  assert.match(rfc, /same\s+`OpponentSelection\.policy` record/u);
  assert.doesNotMatch(rfc, /BotOperationReceiptEvent|bot_operation_receipts|receipt envelope event/u);
});

test("D2088: three profile identities cannot encode the required four bands by three families", () => {
  const profileType = section(rfc, "type BotProfileId", "type BotLayerId");
  assert.equal([...profileType.matchAll(/@[0-9]+/gu)].length, 3);
  assert.match(rfc, /\[1000, 1400, 1800, 2200\]` bands crossed with three behavior families/u);
  assert.match(rfc, /mutually exclusive with `targetElo`/u);
  const runIdentityStart = rfc.indexOf("readonly profile?:");
  const runIdentity = rfc.slice(runIdentityStart, rfc.indexOf("};", runIdentityStart) + 2);
  assert.doesNotMatch(runIdentity, /band|targetElo/u);
});

test("D2089: the author model invents a provider delivery shape incompatible with its dependency", () => {
  const shared = section(provider, "type ProviderDelivery", "/** The exact payload");
  assert.match(shared, /kind: "live"/u);
  assert.match(shared, /servedAt/u);
  assert.match(shared, /cacheIdentity/u);
  assert.match(shared, /acquisition/u);
  const local = section(author, "export interface ProviderEvidenceDelivery", "const PROVIDER_DELIVERIES");
  assert.match(local, /requestDigest/u);
  assert.match(local, /payloadDigest/u);
  assert.match(local, /root: BotRootIdentity/u);
  assert.doesNotMatch(local, /servedAt|cacheIdentity|acquisition/u);
});

test("D2090: numeric guard loss cannot represent shared mate scores or mixed-domain abstention", () => {
  const shared = section(provider, "interface StockfishLegalRootTable", "`live.stockfish.legal_root_table@1`");
  assert.match(shared, /kind: "mate"/u);
  assert.match(shared, /kind: "centipawns"/u);
  const local = section(author, "export interface StockfishLegalRootTable", "export interface ProviderEvidenceDelivery");
  assert.match(local, /score: number/u);
  assert.match(author, /guardLossCp: number/u);
  assert.doesNotMatch(author, /guard_mixed_domain[\s\S]{0,240}(?:null|undefined|abstained)/u);
});

test("D2091: the sealed decision accepts caller claims instead of deriving transforms and sampling", () => {
  const projector = section(author, "export function projectBotPolicyDecisionRecord", "export function assertBotPolicyDecisionRecord");
  assert.match(projector, /readonly chosenMoveUci: string/u);
  assert.match(projector, /readonly layers: BotPolicyDerivation\["layers"\]/u);
  assert.match(projector, /readonly classifiers: ReadonlyMap/u);
  assert.match(projector, /finalMass: row\.mass/u);
  assert.doesNotMatch(projector, /sampleWeighted|unitInterval|applyPolicy|pawn.*\*|guard.*mask/iu);
});

test("D2092: idempotency omits writer and derivation operands and accepts an invalid request id", () => {
  const commit = section(author, "export function commitAfterProvider", "return Object.freeze({ kind: \"committed\", receipt });");
  const operand = section(commit, "const requestOperandDigest", "if (input.previous");
  assert.doesNotMatch(operand, /writerLeaseDigest|derivationDigest/u);
  assert.match(rfc, /\^botreq_\[A-Za-z0-9_-\]\{16,128\}\$/u);
  assert.match(authorTest, /requestId: "botreq_123"/u);
  assert.ok("botreq_123".length < "botreq_".length + 16);
});

test("D2093: Stockfish is mandatory in the source constructor while baseline is promised without guard", () => {
  const source = section(author, "export function deriveBotSourceView", "export function deriveCandidateFeatureVector");
  assert.match(source, /readonly stockfish: ProviderEvidenceDelivery/u);
  assert.doesNotMatch(source, /stockfish\?:|kind: "unavailable"/u);
  assert.match(rfc, /Optional guard unavailable\/deadline\/incomplete\/mixed-domain evidence leaves the delivered Maia\s+distribution byte-identical/u);
  assert.match(rfc, /Baseline Play remains available/u);
});

test("D2094: Stage B emits all-legal feature rows that the decision projector rejects for bounded Maia", () => {
  const feature = section(author, "export function deriveCandidateFeatureVector", "export interface BotPolicyDerivation");
  assert.match(feature, /return input\.packet\.rows/u);
  const projector = section(author, "export function projectBotPolicyDecisionRecord", "export function assertBotPolicyDecisionRecord");
  assert.match(projector, /feature rows are not set-equal to considered candidates/u);
  assert.match(authorTest, /deriveCandidateFeatureVector\(\{ packet, stockfish \}\)\)\.toBe\(packet\.rows\)/u);
  assert.doesNotMatch(authorTest, /features:\s*deriveCandidateFeatureVector/u);
});

test("D2095: severe-error loss is measured against the best Maia-returned move, not best legal move", () => {
  const projector = section(author, "export function projectBotPolicyDecisionRecord", "export function assertBotPolicyDecisionRecord");
  assert.match(projector, /Math\.max\(\.\.\.input\.source\.candidates/u);
  assert.doesNotMatch(projector, /legalMoves[\s\S]{0,160}Math\.max|stockfish[\s\S]{0,160}Math\.max/u);
  assert.match(author, /legalMoves: Object\.freeze\(legalMoves\)/u);
});

test("D2096: below-floor fallback relies on a selected move absent from MaiaPolicyPage", () => {
  assert.match(rfc, /exact recorded base-mode path if it still contains a legal selected move/u);
  const page = section(provider, "interface MaiaPolicyPage {", "The pending key includes");
  assert.doesNotMatch(page, /selectedMove|bestmove|chosenMove/u);
  assert.match(page, /candidates: readonly/u);
  assert.doesNotMatch(author, /returned_mass_below_profile_floor[\s\S]{0,400}(?:select|sample|fallback)/u);
});
