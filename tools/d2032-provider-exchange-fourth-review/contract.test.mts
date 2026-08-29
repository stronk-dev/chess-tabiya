// DISPOSABLE independent review harness — D2032-D2034. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(
  new URL("../../rfc/provider-exchange-and-execution.md", import.meta.url),
  "utf8",
);
const authorization = readFileSync(
  new URL("../../apps/server/src/authorization.ts", import.meta.url),
  "utf8",
);

function section(start: string, end: string): string {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section start ${start}`);
  assert.notEqual(to, -1, `missing section end ${end}`);
  return rfc.slice(from, to);
}

test("D2032: Syzygy local domain preflight is structurally outside receipt-bearing success", () => {
  const resultProtocol = section(
    "type ProviderSourceFailure",
    "interface ProviderExecutionContext",
  );
  const exchange = section("interface ProviderExecutionCapture", "### 5. Stockfish legal-root source");
  const syzygy = section("### 7. Syzygy position source", "### 8. Explorer position source");

  assert.match(resultProtocol, /kind: "success";[\s\S]*delivery: ProviderDelivery/u);
  assert.match(resultProtocol, /type ProviderLocalDomainResult/u);
  assert.match(resultProtocol, /kind: "local_domain_result"/u);
  assert.match(resultProtocol, /ProviderSuccess<K> \| ProviderLocalDomainResult<K> \| ProviderSourceFailure<K>/u);
  assert.match(exchange, /preflight\([\s\S]*ProviderOperationLocalResultMap\[K\] \| null/u);
  assert.match(exchange, /preflight[\s\S]*before[\s\S]*retained lookup[\s\S]*queue admission/u);
  assert.match(syzygy, /interface SyzygyOutsideDomain/u);
  assert.match(syzygy, /rules\.endgame\.tablebase_domain@1/u);
  assert.match(syzygy, /no provider,[\s\S]*response digest,[\s\S]*acquisition,[\s\S]*cache field/u);

  type LocalDomain = Readonly<{
    kind: "local_domain_result";
    operation: "syzygy.position@1";
    payload: Readonly<{ kind: "outside_domain"; pieceCount: number }>;
  }>;
  const locallyComputed: LocalDomain = Object.freeze({
    kind: "local_domain_result",
    operation: "syzygy.position@1",
    payload: Object.freeze({ kind: "outside_domain", pieceCount: 8 }),
  });
  assert.equal("acquisition" in locallyComputed, false);
  assert.equal("delivery" in locallyComputed, false);
  assert.equal("responseBytes" in locallyComputed, false);
});

test("D2033: public subject availability is bounded and composes canonical run authorization", () => {
  const publicSubject = section(
    "interface EvidenceAvailabilitySubject",
    "interface SubjectEvidenceAvailabilityRequest",
  );
  const availability = section(
    "Request-specific satisfaction is a separate authenticated and ownership-checked operation:",
    "### 3. One typed exchange receipt",
  );
  assert.match(publicSubject, /kind: "run_event"/u);
  assert.doesNotMatch(publicSubject, /kind: "module"|ModuleId/u);
  assert.doesNotMatch(publicSubject, /provider_request/u);
  assert.match(availability, /POST \/evidence\/availability/u);
  assert.match(availability, /requireRead\(storage, runId, principal\)/u);
  assert.match(availability, /RUN_NOT_FOUND/u);
  assert.match(availability, /One to 64\s+unique projection ids/u);
  assert.match(availability, /no public arbitrary `provider_request` subject/u);
  assert.match(availability, /operation that differs from the compiled\s+requirement/u);

  // The live server already has an ownership/grant-aware read authority. A new
  // run-addressed endpoint needs to compose it rather than merely require a login.
  assert.match(authorization, /export function requireRead/u);
  assert.match(authorization, /runRole/u);
});

type SourceOccurrence = Readonly<{
  projection: string;
  occurrence: readonly number[];
  normalizedRequestDigest: string;
}>;

function occurrenceRequirements(
  occurrences: readonly SourceOccurrence[],
): readonly string[] {
  return occurrences.map(
    (value) => `${value.occurrence.join(".")}:${value.projection}:${value.normalizedRequestDigest}`,
  );
}

test("D2034: occurrence-addressed source requirements preserve two Stockfish exchanges", () => {
  const execution = section("interface CompiledProjectionExecution", "### 2. Confidence inheritance");
  assert.match(execution, /sourceRequirements:[\s\S]*occurrence: readonly number\[\];[\s\S]*projection: VersionedEvidenceId;[\s\S]*providerOperation:/u);
  assert.match(execution, /exact ordered list of non-local \*\*leaf occurrences\*\*/u);
  assert.match(execution, /Two occurrences of one projection[\s\S]*remain two obligations/u);

  const beforeAndAfter: readonly SourceOccurrence[] = [
    {
      projection: "live.stockfish.position_eval@1",
      occurrence: [0],
      normalizedRequestDigest: "sha256:before",
    },
    {
      projection: "live.stockfish.position_eval@1",
      occurrence: [1],
      normalizedRequestDigest: "sha256:after",
    },
  ];
  assert.equal(beforeAndAfter.length, 2);
  assert.equal(new Set(beforeAndAfter.map((value) => value.normalizedRequestDigest)).size, 2);
  assert.deepEqual(occurrenceRequirements(beforeAndAfter), [
    "0:live.stockfish.position_eval@1:sha256:before",
    "1:live.stockfish.position_eval@1:sha256:after",
  ]);
  assert.match(
    rfc,
    /derived\.story\.eval_shift@1[\s\S]*\[live\.stockfish\.position_eval@1, live\.stockfish\.position_eval@1\]/u,
  );
});

test("D2035: monotonic deadlines and civil receipt time have separate authorities", () => {
  const scheduler = section("### 4. Shared bounded scheduler", "### 5. Stockfish legal-root source");
  assert.match(scheduler, /monotonicNowMs\(\): number/u);
  assert.match(scheduler, /wallNow\(\): string/u);
  assert.match(scheduler, /no implicit unbounded defaults or hidden `Date\.now\(\)` calls/u);
  assert.match(scheduler, /Monotonic values alone drive[\s\S]*deadlines, TTL/u);
  assert.match(scheduler, /wall values alone populate[\s\S]*requestedAt[\s\S]*observedAt/u);
  const capture = section("interface ProviderExecutionCapture", "interface ProviderOperationDescriptor");
  assert.doesNotMatch(capture, /retrievedAt/u);
  assert.match(scheduler, /samples `wallNow\(\)` for `retrievedAt`/u);

  let monotonic = 100;
  let wall = "2026-08-29T12:00:00.000Z";
  const deadline = monotonic + 50;
  const requestedAt = wall;
  wall = "2020-01-01T00:00:00.000Z";
  assert.equal(monotonic < deadline, true, "wall reversal cannot expire the waiter");
  assert.equal(requestedAt, "2026-08-29T12:00:00.000Z");
  monotonic = 151;
  assert.equal(monotonic >= deadline, true, "monotonic time alone expires the waiter");
  assert.equal(wall, "2020-01-01T00:00:00.000Z");
});

test("D2036: provider availability does not reverse-depend on modules or presets", () => {
  const publicSubject = section(
    "interface EvidenceAvailabilitySubject",
    "type ResolvedSourceSubject",
  );
  assert.doesNotMatch(publicSubject, /ModuleId|moduleId|presetId/u);
  assert.match(rfc, /There is deliberately no module\/preset subject in this foundation/u);
  assert.match(rfc, /keeps provider exchange below learner modules and\s+presets/u);
});
