// Accepted maia-task-source §3: one shared exchange, not a Maia-only transport/cache.
import { PROVIDER_RESPONSE_PARSERS, ProviderRequestInvalid, ProviderResponseInvalid, assertProviderDelivery, canonicalProviderJson, normalizeProviderRequest, providerSourceEvidence,
  type DeclaredEvidence, type MaiaInferenceTaskRequest, type MaiaInferenceTaskResult, type ProviderEvidenceDelivery } from "@chess-tabiya/runtime";
import { engineUnavailable } from "./errors.js";
import { ProviderSourceUnavailable, type ProviderExchangeScheduler, type ProviderOperationDescriptor } from "./provider-exchange.js";
import { ProviderUnavailableError, classifyProviderError, type ProviderRegistry } from "./provider-health.js";
import { MaiaInferenceTaskOperation, type ProviderEngineClient } from "./provider-operations.js";

export type MaiaTaskEvidence = DeclaredEvidence<ProviderEvidenceDelivery<MaiaInferenceTaskResult, "maia.inference_task@1">>;
export interface MaiaTaskSource {
  currentGeneration(): number | null;
  acquire(request: MaiaInferenceTaskRequest, options: { readonly signal: AbortSignal; readonly deadlineMonotonic: number }): Promise<MaiaTaskEvidence>;
}

/** Health admission/settlement only for new exchange work, never a retained observation. */
export function healthAdmittedMaiaTaskOperation(engines: ProviderEngineClient, health: ProviderRegistry): ProviderOperationDescriptor<"maia.inference_task@1"> {
  const descriptor = MaiaInferenceTaskOperation(engines);
  return Object.freeze<ProviderOperationDescriptor<"maia.inference_task@1">>({ ...descriptor, async execute(identity, context) {
    let protocolFailure = false;
    try {
      return await health.run("opponent.maia_inference", async ({ signal, remainingMs }) => {
        const capture = await descriptor.execute(identity, { ...context, signal, remainingMs: Math.min(context.remainingMs, remainingMs) });
        PROVIDER_RESPONSE_PARSERS["maia.inference_task@1"].parse(capture, identity);
        return capture;
      }, error => {
        if (error instanceof ProviderRequestInvalid) return { kind: "cancelled", by: "caller" };
        protocolFailure = error instanceof ProviderResponseInvalid || error instanceof ProviderSourceUnavailable && (error.reason === "invalid_response" || error.reason === "identity_mismatch");
        return protocolFailure ? { kind: "failure", reason: "protocol" } : classifyProviderError(error);
      }, { signal: context.signal, deadlineMonotonic: health.monotonicNow() + context.remainingMs });
    } catch (error) {
      if (error instanceof ProviderUnavailableError) throw new ProviderSourceUnavailable(protocolFailure ? "invalid_response" : "provider_unavailable", "Maia provider health refused the task");
      throw error;
    }
  } });
}

export class ExchangeMaiaTaskSource implements MaiaTaskSource {
  constructor(private readonly options: { readonly scheduler: Pick<ProviderExchangeScheduler, "get">; readonly engines: Pick<ProviderEngineClient, "establishedGeneration">;
    readonly monotonicNowMs: () => number; readonly health?: ProviderRegistry }) {}
  currentGeneration(): number | null { return this.options.engines.establishedGeneration("maia-5m"); }
  async acquire(request: MaiaInferenceTaskRequest, options: { readonly signal: AbortSignal; readonly deadlineMonotonic: number }): Promise<MaiaTaskEvidence> {
    options.signal.throwIfAborted();
    const remaining = Math.floor(options.deadlineMonotonic - this.options.monotonicNowMs());
    if (remaining < 1) throw engineUnavailable("maia-5m", 0);
    const normalized = normalizeProviderRequest("maia.inference_task@1", request).request;
    const result = await this.options.scheduler.get({ operation: "maia.inference_task@1", request: normalized }, { id: "opponent:maia-task", budgetMs: remaining }, options.signal);
    options.signal.throwIfAborted();
    if (result.kind !== "success") {
      const state = this.options.health?.snapshot().providers.find(row => row.instanceId === "maia-inference");
      throw engineUnavailable("maia-5m", state !== undefined && "retryAfterMs" in state ? state.retryAfterMs ?? 0 : 0);
    }
    assertProviderDelivery("maia.inference_task@1", result.delivery);
    if (this.currentGeneration() !== result.delivery.acquisition.generation || canonicalProviderJson(result.delivery.payload.request) !== canonicalProviderJson(normalized)) throw engineUnavailable("maia-5m", 0);
    return providerSourceEvidence("maia.inference_task@1", result.delivery);
  }
}
