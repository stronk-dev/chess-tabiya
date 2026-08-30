// DISPOSABLE fresh independent review harness — D2097-D2104. Not production code.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/shared-candidate-evidence-packet.md");
const provider = read("rfc/provider-exchange-and-execution.md");
const semantic = read("packages/runtime/src/semantic-evidence.ts");
const legalMoves = read("packages/runtime/src/legal-moves.ts");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2097: request, service result, and wide projection lose their literal scope correlation", () => {
  const types = section(rfc, "export interface CandidatePopulationRequest", "const CANDIDATE_POPULATION_RECEIPTS");
  assert.match(types, /readonly scope: CandidatePacketScope/u);
  const service = section(rfc, "export interface CandidatePopulationServiceOptions", "`invalid_fen`");
  assert.match(service, /get\(request: CandidatePopulationRequest, signal: AbortSignal\): Promise<CandidatePopulationResult>/u);
  assert.doesNotMatch(service, /get<S extends CandidatePacketScope>/u);
  const projector = section(rfc, "export function projectCandidatePopulationReceipt(", "`compileCandidatePopulationReceipt`");
  assert.match(projector, /receipt: CandidatePopulationReceipt<CandidateWideScope>[\s\S]{0,180}CandidatePopulationProjectionResult<CandidatePacketScope>/u);
  assert.doesNotMatch(projector, /CandidateWideScope[\s\S]{0,180}T extends ProjectableCandidateScope/u);
});

test("D2098: the provider handoff is both wrong-arity and unavailable at the claimed landing", () => {
  assert.match(provider, /type ProviderEvidenceDelivery<T, K extends ProviderOperationId>/u);
  assert.match(rfc, /DeclaredEvidence<ProviderEvidenceDelivery<StockfishLegalRootTable>>/u);
  assert.match(rfc, /provider RFC is a dependency of held Discharge D10, not of this provider-free landing/u);
  assert.match(rfc, /candidate-score-handoff\.ts` \(new; types only\)/u);
  assert.equal(existsSync("packages/runtime/src/provider-exchange.ts"), false);
  assert.equal(existsSync("apps/server/src/provider-exchange.ts"), false);
});

test("D2099: the service promised through the runtime barrel is neither exported nor constructible", () => {
  const service = section(rfc, "export interface CandidatePopulationServiceOptions", "`invalid_fen`");
  assert.match(service, /interface CandidatePopulationService/u);
  assert.doesNotMatch(service, /\nexport interface CandidatePopulationService\s*\{/u);
  assert.doesNotMatch(service, /createCandidatePopulationService|new CandidatePopulationService|constructor\(/u);
  assert.match(rfc, /packages\/runtime\/src\/index\.ts[\s\S]{0,180}public packet\/service/u);
});

test("D2100: projection ids are not an executable projection-to-collector topology", () => {
  assert.match(rfc, /registries are\s+stable-ordered by projection id and sliced into groups/u);
  assert.match(rfc, /packet compiler consumes one exported literal `LOCAL_CANDIDATE_EVENT_PROJECTION_IDS`/u);
  assert.match(semantic, /function localSemanticEvents[\s\S]{0,700}structuralSemanticEvents[\s\S]{0,700}tacticalSemanticEvents/u);
  assert.doesNotMatch(rfc, /interface CandidateCollectorDeclaration|collector:\s*\(.*beforeFen|projectionToCollector|COLLECTOR_EXECUTION/u);
  assert.match(rfc, /packet never calls the flattening `localSemanticEvents` wrapper/u);
});

test("D2101: settled-cache bounds leave unique in-flight compilations unbounded", () => {
  const options = section(rfc, "export interface CandidatePopulationServiceOptions", "interface CandidatePopulationService");
  assert.doesNotMatch(options, /maxConcurrent|maxInFlight|maxPending|queue/u);
  assert.match(rfc, /In-flight entries\s+are never evicted/u);
  assert.doesNotMatch(rfc, /bounded queue|queue capacity|reject.*overload|too_busy/iu);
  assert.match(rfc, /Two concurrent requests for one key compile \*\*once\*\*/u);
});

test("D2102: injected scheduler rejection escapes the claimed closed result algebra", () => {
  const types = section(rfc, "export type CandidateCollectorResult", "const CANDIDATE_POPULATION_RECEIPTS");
  assert.match(types, /readonly projection: string/u);
  assert.doesNotMatch(types, /yield_failed|scheduler_failed|internal_failed/u);
  const service = section(rfc, "export interface CandidatePopulationServiceOptions", "Caller abort\/deadline flows");
  assert.match(service, /yieldControl: \(\) => Promise<void>/u);
  assert.match(service, /tests may inject a deterministic adapter/u);
  assert.doesNotMatch(service, /catch.*yield|yield.*failed|scheduler.*failed/iu);
});

test("D2103: a FEN-only request cannot refuse or distinguish standard and variant rules", () => {
  const request = section(rfc, "export interface CandidatePopulationRequest", "export interface CandidatePopulationReceipt");
  assert.doesNotMatch(request, /variant|ruleset|standard/u);
  assert.match(rfc, /packet would\s+compile in a variant and would carry two features that mean nothing there/u);
  assert.match(rfc, /Refusing to ship it\s+into Tier 2 until D3 lands/u);
  assert.match(legalMoves, /import \{ castlingSide, Chess, normalizeMove \}/u);
  assert.doesNotMatch(rfc, /standard_only|unsupported_variant|ruleset: "standard"/u);
});

test("D2104: receipt reference authority omits the collector results that created abstentions", () => {
  const row = section(rfc, "export interface CandidateEventRow", "export interface CandidatePopulationRequest");
  assert.match(row, /readonly abstentions: readonly CandidatePacketAbstention\[\]/u);
  const receipt = section(rfc, "export interface CandidatePopulationReceipt", "// Generated source");
  assert.doesNotMatch(receipt, /abstention|collectorResult/u);
  const constructor = section(rfc, "function compileCandidatePopulationReceipt", "export function assertCandidatePopulationReceipt");
  assert.doesNotMatch(constructor, /abstention|collectorResult/u);
  assert.match(rfc, /stores the exact packet\/legal\/event\/reading references/u);
});
