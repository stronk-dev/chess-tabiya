/**
 * Health-reporting adapters for the providers that are not already registry-admitted clients
 * (rfc/provider-health-degradation.md §5, §8). Each adapter admits a NEW request through the
 * registry (circuit, group single-flight, deadline), passes the operation's abort signal to the
 * provider, and settles the real outcome. Domain answers (tablebase out-of-range, a fixture that
 * does not know a position, Explorer `no_data_at_band`) are successful provider outcomes.
 *
 * The Lichess tablebase and Explorer clients integrate health themselves (their retained caches
 * must bypass admission); these adapters wrap fixtures and the external voice/TTS providers.
 */
import type { ApplicationProviderOperationId } from "@chess-tabiya/runtime";

import type { CorpusQuery, CorpusResult, CorpusSource } from "./corpus.js";
import { ServerError } from "./errors.js";
import type { ReasoningReviewProvider, ReasoningReviewRequest } from "./external-voice.js";
import type { TtsProvider, TtsResult } from "./external-tts.js";
import type { VoiceEvidenceView, VoiceProvider, VoiceScope } from "./guidance.js";
import { ProviderUnavailableError, classifyProviderError, type ProviderRegistry, type ProviderSettlement } from "./provider-health.js";
import type { TablebaseProbeOptions, TablebasePosition, TablebaseSource } from "./tablebase.js";

const DOMAIN: ProviderSettlement = Object.freeze({ kind: "success" });

/** A local tablebase source (fixture or local service) reporting to `tablebase-primary`. */
export function healthReportedTablebase(source: TablebaseSource, health: ProviderRegistry): TablebaseSource {
  return Object.freeze({
    kind: source.kind,
    probe: (fen: string, options: TablebaseProbeOptions = {}): Promise<TablebasePosition> => health.run(
      "evidence.tablebase_probe",
      () => source.probe(fen, options),
      // A position the source does not cover is its domain answer, not a provider failure.
      (error) => error instanceof ServerError ? DOMAIN : classifyProviderError(error),
      options.deadlineMonotonic === undefined ? {} : { deadlineMonotonic: options.deadlineMonotonic },
    ),
  });
}

/** A local corpus source reporting to `explorer-primary`; `source_unavailable` is a failure. */
export function healthReportedCorpus(source: CorpusSource, health: ProviderRegistry): CorpusSource {
  return Object.freeze({
    async stats(query: CorpusQuery): Promise<CorpusResult> {
      try {
        return await health.run("evidence.explorer_query", async () => {
          const result = await source.stats(query);
          if (result.kind === "abstention" && result.reason === "source_unavailable") throw new CorpusSourceUnavailable(result);
          return result;
        }, (error) => error instanceof CorpusSourceUnavailable ? { kind: "failure", reason: "network" } : classifyProviderError(error));
      } catch (error) {
        if (error instanceof ProviderUnavailableError) {
          return Object.freeze({ kind: "abstention", reason: "source_unavailable", detail: error.availability.state === "unavailable" ? `provider ${error.availability.reason}` : `provider ${error.availability.state}`, population: Object.freeze({ source: "lichess-explorer", ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until }) }) as CorpusResult;
        }
        throw error;
      }
    },
  });
}

class CorpusSourceUnavailable extends Error {
  constructor(readonly result: CorpusResult) {
    super("corpus source unavailable");
  }
}

function voiceOperation(scope: VoiceScope): ApplicationProviderOperationId {
  return scope === "compare" ? "render.voice_compare" : scope === "story" ? "render.voice_story" : "render.voice";
}

/**
 * External voice under provider health. The caller's signal (one total budget shared by both
 * attempts) bounds the admission and the call; a caller abort is cancellation, not a failure.
 */
export function healthReportedVoice(provider: VoiceProvider, health: ProviderRegistry): VoiceProvider {
  return Object.freeze({
    render: (view: VoiceEvidenceView, persona: string, deterministicText: string, scope: VoiceScope, signal?: AbortSignal): Promise<string> =>
      health.run(voiceOperation(scope), ({ signal: operationSignal }) => provider.render(view, persona, deterministicText, scope, operationSignal), classifyProviderError, signal === undefined ? {} : { signal }),
  });
}

export function healthReportedReasoningReview(provider: ReasoningReviewProvider, health: ProviderRegistry): ReasoningReviewProvider {
  return Object.freeze({
    review: (request: ReasoningReviewRequest, signal?: AbortSignal): Promise<string> =>
      health.run("review.reasoning", ({ signal: operationSignal }) => provider.review(request, operationSignal), classifyProviderError, signal === undefined ? {} : { signal }),
  });
}

export function healthReportedTts(provider: TtsProvider, health: ProviderRegistry): TtsProvider {
  return Object.freeze({
    synthesize: (text: string, signal?: AbortSignal): Promise<TtsResult> =>
      health.run("render.speech", ({ signal: operationSignal }) => provider.synthesize(text, operationSignal), classifyProviderError, signal === undefined ? {} : { signal }),
  });
}
