// DISPOSABLE independent-review falsifiers for D2753-D2761. Not production code.
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";
import { describe, expect, test } from "vitest";

import {
  APPLICATION_OPERATIONS,
  AtomicExactCache,
  acquireLease,
  circuitSuccess,
  failOpponent,
  requireSealedText,
  retryOpponent,
  sealRenderedText,
  settleOperation,
  type BackoffLeaseState,
  type ExchangeDelivery,
  type OpponentRecoveryState,
  type ProviderCircuitState,
} from "../d2575-provider-health-fourth-author-repair/contract";

const contractPath = "tools/d2575-provider-health-fourth-author-repair/contract.ts";
const contractSource = readFileSync(contractPath, "utf8");
const makefile = readFileSync("Makefile", "utf8");

async function loadContract(source: string): Promise<Record<string, unknown>> {
  const compiled = transformSync(source, { format: "esm", loader: "ts", target: "es2022" }).code;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`) as Promise<Record<string, unknown>>;
}

describe("provider-health fourth repair fresh-review returns", () => {
  test("D2753 promised checkpoint authorities are absent or renamed", () => {
    expect(contractSource).not.toMatch(/export (?:type|interface|class|function) ProviderRegistrySnapshot\b/u);
    expect(contractSource).not.toMatch(/export (?:type|interface|class|function) ApplicationProviderOutcome\b/u);
    expect(contractSource).not.toMatch(/export (?:type|interface|class|function) ProfileAvailability/u);
    expect(contractSource).not.toMatch(/export (?:type|interface|class|function) .*ReleaseReceipt/u);
    expect(contractSource).toMatch(/export type ApplicationOperationOutcome\b/u);
  });

  test("D2754 obligations and declarations can move together without a live consumer", async () => {
    const crossed = await loadContract(contractSource.replaceAll("opponent.stockfish_play", "opponent.unowned_side_door"));
    const compile = crossed.compileApplicationOperations as (input: readonly unknown[]) => readonly unknown[];
    const operations = crossed.APPLICATION_OPERATIONS as readonly unknown[];
    expect(() => compile(operations)).not.toThrow();
    expect(contractSource).not.toMatch(/readFileSync|apps\/server\/src|apps\/web\/src/u);
  });

  test("D2755 any caller can mint a displayed-text authority", () => {
    const invented = sealRenderedText({
      textDigest: "invented-by-caller",
      runId: "unrelated-run",
      nodeId: "never-rendered",
      scope: "compare",
    });
    expect(requireSealedText(invented)).toBe(invented);
  });

  test("D2756 exact cache accepts crossed provenance and exceeds 512 entries", () => {
    const cache = new AtomicExactCache<string>();
    const crossed: ExchangeDelivery<string> = {
      operation: "maia.policy_page@1",
      generation: "other-generation",
      normalizedRequestDigest: "other-request",
      payload: "origin-payload",
    };
    for (let index = 0; index < 513; index += 1) {
      cache.put(
        {
          operation: "stockfish.position_evaluation@1",
          generation: "expected-generation",
          requestDigest: `expected-request-${index}`,
          keyDigest: `key-${index}`,
        },
        `unrelated-value-${index}`,
        crossed,
        10_000,
      );
    }
    const oldest = cache.resolve(
      {
        operation: "stockfish.position_evaluation@1",
        generation: "expected-generation",
        requestDigest: "expected-request-0",
        keyDigest: "key-0",
      },
      1,
    );
    expect(oldest.kind).toBe("hit");
    if (oldest.kind === "hit") {
      expect(oldest.value).toBe("unrelated-value-0");
      expect(oldest.original).toBe(crossed);
    }
  });

  test("D2757 a crossed structural delivery settles as complete", () => {
    const declaration = APPLICATION_OPERATIONS.find((row) => row.operationId === "evidence.stockfish_analysis")!;
    const outcome = settleOperation(
      declaration,
      [{
        kind: "success",
        stageId: "analyse",
        delivery: {
          operation: "maia.policy_page@1",
          generation: "wrong-generation",
          normalizedRequestDigest: "wrong-request",
          payload: "wrong-provider",
        },
      }],
      "accepted-value",
    );
    expect(outcome.kind).toBe("complete");
  });

  test("D2758 caller-authored unverified state heals without a live settlement", () => {
    const invented: ProviderCircuitState = {
      state: "unverified",
      generation: "invented-generation",
      transientOpenTimes: [-1],
    };
    expect(circuitSuccess(invented, -10)).toMatchObject({ state: "available", generation: "invented-generation" });
  });

  test("D2759 a newer generation remains blocked by the old generation lease", () => {
    const oldClaim: BackoffLeaseState = {
      blockedUntilMonotonic: 0,
      claim: { token: "old-token", generationSet: "generation-1", expiresAtMonotonic: 100 },
    };
    expect(acquireLease(oldClaim, 1, "generation-2", "new-token", 10)).toMatchObject({ kind: "claimed" });
  });

  test("D2760 JSON-round-tripped caller state authorizes opponent recovery", () => {
    const invented = JSON.parse(JSON.stringify({
      state: "waiting",
      pending: {
        runId: "unloaded-run",
        learnerMoveEventSeq: 99,
        afterFen: "not-validated",
        requestDigest: "request",
        policyDigest: "policy",
      },
      attempt: 0,
    })) as OpponentRecoveryState;
    const failed = failOpponent(invented, 100, "timeout");
    expect(retryOpponent(failed, "request")).toMatchObject({ state: "waiting", attempt: 1 });
  });

  test("D2761 ordinary verification does not run the cited author gate", () => {
    const verifyLine = makefile.split("\n").find((line) => line.startsWith("verify-governance:")) ?? "";
    expect(verifyLine).not.toContain("provider-health-fourth-author-repair");
  });
});
