/**
 * Provider-exchange §7: the learner TablebaseSource adapter. No provider-private queue/cache,
 * parser or result mint. The shared descriptor, scheduler and source factory own acquisition.
 * Health admission happens only when the scheduler executes NEW work, after local preflight,
 * retained lookup and exact-key coalescing. Standalone tooling/fixture sources stay separate.
 */
import { PROVIDER_RESPONSE_PARSERS, ProviderResponseInvalid, providerSourceEvidence } from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import { ProviderSourceUnavailable, type ProviderExchangeScheduler, type ProviderOperationDescriptor } from "./provider-exchange.js";
import { ProviderHttpError, ProviderUnavailableError, classifyProviderError, type ProviderRegistry } from "./provider-health.js";
import { SyzygyPositionOperation, type ProviderFetch } from "./provider-operations.js";
import type { TablebasePosition, TablebaseProbeEvidence, TablebaseProbeOptions, TablebaseSource } from "./tablebase.js";

/** Preserve the actual status/Retry-After for the shared Lichess admission/backoff authority. */
export function healthAdmittedSyzygyOperation(fetcher: ProviderFetch, health: ProviderRegistry): ProviderOperationDescriptor<"syzygy.position@1"> {
  const descriptor = SyzygyPositionOperation(fetcher);
  return Object.freeze<ProviderOperationDescriptor<"syzygy.position@1">>({
    ...descriptor,
    async execute(identity, context) {
      // Per-execution capture, never shared across requests. The ordinary HTTP descriptor wraps
      // transport errors; retain the status internally only until the health authority settles it.
      let httpError: ProviderHttpError | undefined;
      let protocolFailure = false;
      const admitted = SyzygyPositionOperation(async (url, init) => {
        try {
          const response = await fetcher(url, init);
          if (response.status !== 200) throw new ProviderHttpError(response.status, response.headers.get("retry-after"), `Tablebase HTTP ${response.status}`);
          return response;
        } catch (error) {
          if (error instanceof ProviderHttpError) httpError = error;
          throw error;
        }
      });
      try {
        return await health.run("evidence.tablebase_probe", async ({ signal, remainingMs }) => {
          if (context.signal.aborted || signal.aborted) throw Object.assign(new Error("tablebase exchange cancelled"), { name: "AbortError" });
          const capture = await admitted.execute(identity, { ...context, signal, remainingMs: Math.min(context.remainingMs, remainingMs) });
          // Validation is the same registered parser, not a second parser or source constructor.
          // A malformed result must not establish health before scheduler receipt construction.
          PROVIDER_RESPONSE_PARSERS["syzygy.position@1"].parse(capture, identity);
          return capture;
        }, (error) => {
          protocolFailure = httpError === undefined && (error instanceof ProviderResponseInvalid || error instanceof ProviderSourceUnavailable && error.reason === "invalid_response");
          return protocolFailure ? { kind: "failure", reason: "protocol" } : classifyProviderError(httpError ?? error);
        }, {
          signal: context.signal,
          deadlineMonotonic: health.monotonicNow() + context.remainingMs,
        });
      } catch (error) {
        if (error instanceof ProviderUnavailableError) throw new ProviderSourceUnavailable(
          protocolFailure ? "invalid_response" : "provider_unavailable",
          "tablebase provider health refused the exchange",
        );
        throw error;
      }
    },
  });
}

export class ExchangeTablebaseSource implements TablebaseSource {
  readonly kind = "lichess" as const;
  constructor(private readonly options: {
    readonly scheduler: Pick<ProviderExchangeScheduler, "get">;
    readonly monotonicNowMs: () => number;
    readonly health?: ProviderRegistry;
    readonly timeoutMs?: number;
  }) {}

  async probe(fen: string, options: TablebaseProbeOptions = {}): Promise<TablebasePosition> {
    return (await this.probeEvidence(fen, options)).payload.payload.position;
  }

  async probeEvidence(fen: string, options: TablebaseProbeOptions = {}): Promise<TablebaseProbeEvidence> {
    const timeoutMs = this.options.timeoutMs ?? 4_000;
    const remaining = options.deadlineMonotonic === undefined ? timeoutMs : Math.min(timeoutMs, Math.floor(options.deadlineMonotonic - this.options.monotonicNowMs()));
    if (remaining <= 0) throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase operation deadline exceeded", { details: { retryAfterMs: 0 } });
    const result = await this.options.scheduler.get({
      operation: "syzygy.position@1", request: { rules: "chess", variant: "standard", fen, timeoutMs },
    }, { id: "learner:tablebase", budgetMs: remaining }, options.signal ?? new AbortController().signal);
    if (result.kind === "local_domain_result") throw new ServerError("TABLEBASE_OUT_OF_RANGE", `Syzygy covers at most seven pieces; received ${result.payload.pieceCount}`);
    if (result.kind === "source_failure") {
      const state = this.options.health?.snapshot().providers.find((row) => row.instanceId === "tablebase-primary");
      const retryAfterMs = state !== undefined && "retryAfterMs" in state ? state.retryAfterMs : result.reason === "queue_full" ? 4_000 : 0;
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase exchange unavailable", { details: { retryAfterMs } });
    }
    return providerSourceEvidence("syzygy.position@1", result.delivery);
  }
}
