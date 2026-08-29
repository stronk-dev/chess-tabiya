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

test("D2032: a no-exchange Syzygy result cannot satisfy the receipt-bearing success protocol", () => {
  const resultProtocol = section(
    "type ProviderSourceFailure",
    "interface ProviderExecutionContext",
  );
  const exchange = section("interface ProviderExecutionCapture", "### 5. Stockfish legal-root source");
  const syzygy = section("### 7. Syzygy position source", "### 8. Explorer position source");

  assert.match(resultProtocol, /kind: "success";[\s\S]*delivery: ProviderDelivery/u);
  assert.match(exchange, /execute\([\s\S]*payload:[\s\S]*capture: ProviderExecutionCapture/u);
  assert.match(exchange, /responseBytes: Uint8Array/u);
  assert.match(syzygy, /kind: "outside_domain"/u);
  assert.match(syzygy, /without calling Syzygy/u);

  type ExchangeSuccess = Readonly<{
    kind: "success";
    acquisition: Readonly<{ responseBytes: Uint8Array }>;
  }>;
  const locallyComputed = Object.freeze({
    kind: "outside_domain" as const,
    pieceCount: 8,
    maximumPieceCount: 7 as const,
  });
  assert.equal("acquisition" in locallyComputed, false);
  assert.equal("responseBytes" in locallyComputed, false);
  assert.equal(
    (locallyComputed as unknown as Partial<ExchangeSuccess>).acquisition,
    undefined,
  );
});

test("D2033: subject availability names authentication but no authorization or crossed-subject rule", () => {
  const availability = section(
    "Request-specific satisfaction is a separate authenticated operation:",
    "### 3. One typed exchange receipt",
  );
  assert.match(availability, /kind: "run_event"/u);
  assert.match(availability, /kind: "module"/u);
  assert.match(availability, /kind: "provider_request"/u);
  assert.doesNotMatch(availability, /requireRead|Principal|FORBIDDEN|operator-only|maximum projection|wrong-operation/u);

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

function currentUniqueRequirements(
  occurrences: readonly SourceOccurrence[],
): readonly string[] {
  return [...new Set(occurrences.map((value) => `${value.projection}:provider`))];
}

test("D2034: projection-only source dedupe collapses two required Stockfish exchanges", () => {
  const execution = section("interface CompiledProjectionExecution", "### 2. Confidence inheritance");
  assert.match(execution, /sourceRequirements:[\s\S]*projection: VersionedEvidenceId;[\s\S]*availability:/u);
  assert.doesNotMatch(execution, /sourceRequirements:[\s\S]*occurrence:/u);
  assert.match(execution, /Source requirements are an exact unique set of non-local leaves/u);

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
  assert.deepEqual(currentUniqueRequirements(beforeAndAfter), [
    "live.stockfish.position_eval@1:provider",
  ]);

  const catalogue = readFileSync(
    new URL("../../packages/runtime/src/evidence-catalog.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    catalogue,
    /derived\.story\.eval_shift[\s\S]*operands: \["before", "after", "delta"\][\s\S]*derivation: \{ inputs: \[ref\("live\.stockfish\.eval"\)\] \}/u,
  );
});
