/**
 * The six registered provider-operation descriptors (rfc/provider-exchange-and-execution.md §§5–8).
 *
 * Each export implements exactly its `ProviderOperationDescriptor<operation-id>`: normalize with the
 * shared runtime normalizer, run the closed preflight, and execute one same-exchange capture. A
 * descriptor never parses a typed chess payload, never builds a receipt and never keeps a queue or
 * cache: the scheduler owns all of that. An unconfigured provider is an honest
 * `provider_unavailable`, never a fabricated result.
 */
import {
  PROVIDER_PROTOCOL_RESOURCE,
  ProviderRequestInvalid,
  STOCKFISH_RESET_COMMANDS,
  explorerRequestUrl,
  maiaCommandImage,
  normalizeProviderRequest,
  providerUtf8,
  syzygyPreflight,
  syzygyRequestUrl,
  type ProviderAcquisitionReceipt,
  type ProviderEndpointMap,
  type ProviderExecutionCapture,
  type ProviderHttpResponseMetadata,
  type ProviderOperationId,
} from "@chess-tabiya/runtime";

import { appliedTargetElo, engineBandProfile } from "./engine-band.js";
import type { EngineExchangeCapture, EngineExchangeRequest, EngineHealth, EngineIdentity, EngineOption } from "./engine-supervisor.js";
import { MAIA3_BAND_RANGE, MAIA3_MODEL_ID, MAIA3_SOURCE_COMMIT } from "./maia.js";
import {
  ProviderSourceUnavailable,
  type ProviderExecutionContext,
  type ProviderOperationDescriptor,
  type ProviderOperationDescriptors,
} from "./provider-exchange.js";

/** The engine surface a descriptor may use; `EngineSupervisor` implements it. */
export interface ProviderEngineClient {
  start(engineId: string): Promise<EngineIdentity>;
  health(engineId: string): EngineHealth;
  exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture>;
  establishedGeneration(engineId: string): number | null;
}

export type ProviderFetch = (url: string, init: { readonly signal: AbortSignal; readonly headers: Readonly<Record<string, string>> }) => Promise<Response>;

const USER_AGENT = "chess-tabiya/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)";
const STOCKFISH_ENGINE_ID = "stockfish-analysis";
const MAIA_ENGINE_ID = "maia-5m";

function endpoint<K extends ProviderOperationId>(operation: K): ProviderEndpointMap[K] {
  return PROVIDER_PROTOCOL_RESOURCE.payload.operations.find((row) => row.operation === operation)!.endpoint as unknown as ProviderEndpointMap[K];
}

const describe = <K extends ProviderOperationId>(descriptor: ProviderOperationDescriptor<K>): ProviderOperationDescriptor<K> => Object.freeze(descriptor);

const untilBestmove =(line: string): boolean => /^bestmove(?:\s|$)/u.test(line);

async function engineExchange(engines: ProviderEngineClient, engineId: string, commands: readonly string[], resetCommands: readonly string[], context: ProviderExecutionContext): Promise<EngineExchangeCapture> {
  return engines.exchange(engineId, { commands, resetCommands, until: untilBestmove, timeoutMs: Math.max(1, Math.floor(context.remainingMs)), signal: context.signal });
}

function uciBytes(capture: EngineExchangeCapture): Uint8Array {
  return providerUtf8(capture.transcript.join("\n"));
}

// ---------------------------------------------------------------------------------------------
// §5 Stockfish
// ---------------------------------------------------------------------------------------------

function stockfishCapture<K extends "stockfish.legal_root_table@1" | "stockfish.position_evaluation@1" | "stockfish.principal_variation@1">(operation: K, capture: EngineExchangeCapture): ProviderExecutionCapture<K> {
  if (capture.artifact?.kind !== "binary") throw new ProviderSourceUnavailable("provider_unavailable", "the launched Stockfish executable was not captured for this generation");
  return Object.freeze({
    endpoint: endpoint(operation),
    actualIdentity: Object.freeze({ id: capture.identity.id, name: capture.identity.name, version: capture.identity.version, binaryDigest: capture.artifact.binaryDigest, uciOptionsDigest: capture.optionImageDigest }),
    generation: capture.generation,
    contentEncoding: "uci-utf8",
    transport: null,
    responseBytes: uciBytes(capture),
  }) as unknown as ProviderExecutionCapture<K>;
}

function stockfishDescriptor<K extends "stockfish.legal_root_table@1" | "stockfish.position_evaluation@1" | "stockfish.principal_variation@1">(operation: K, engines: ProviderEngineClient | null, weight: (payload: never) => number): ProviderOperationDescriptor<K> {
  return describe<K>({
    operation,
    provider: "stockfish",
    normalizeRequest: (request) => normalizeProviderRequest(operation, request),
    preflight: () => null,
    async execute(identity, context) {
      if (engines === null) throw new ProviderSourceUnavailable("provider_unavailable", "no Stockfish analysis engine is configured");
      const command = (identity as { readonly command: { readonly commands: readonly string[] } }).command;
      return stockfishCapture(operation, await engineExchange(engines, STOCKFISH_ENGINE_ID, command.commands, STOCKFISH_RESET_COMMANDS, context));
    },
    retainedWeight: weight,
    admitRetained: (acquisition: ProviderAcquisitionReceipt<K>) => engines !== null && acquisition.generation !== null && engines.establishedGeneration(STOCKFISH_ENGINE_ID) === acquisition.generation,
  });
}

export function StockfishLegalRootTableOperation(engines: ProviderEngineClient | null): ProviderOperationDescriptor<"stockfish.legal_root_table@1"> {
  return stockfishDescriptor("stockfish.legal_root_table@1", engines, (payload: { readonly rows: readonly unknown[] }) => Math.max(1, payload.rows.length));
}

export function StockfishPositionEvaluationOperation(engines: ProviderEngineClient | null): ProviderOperationDescriptor<"stockfish.position_evaluation@1"> {
  return stockfishDescriptor("stockfish.position_evaluation@1", engines, () => 1);
}

/** §5.2: the bounded principal variation of one fixed-bound single-line search. */
export function StockfishPrincipalVariationOperation(engines: ProviderEngineClient | null): ProviderOperationDescriptor<"stockfish.principal_variation@1"> {
  return stockfishDescriptor("stockfish.principal_variation@1", engines, (payload: { readonly movesUci: readonly unknown[] }) => Math.max(1, payload.movesUci.length));
}

// ---------------------------------------------------------------------------------------------
// §6 Maia
// ---------------------------------------------------------------------------------------------

function requiredOption(options: readonly EngineOption[] | undefined, name: string): EngineOption {
  const matches = options?.filter((candidate) => candidate.name === name) ?? [];
  if (matches.length !== 1) throw new ProviderSourceUnavailable("invalid_response", `Maia must advertise exactly one ${name} option`);
  return matches[0]!;
}

function numericOption(options: readonly EngineOption[] | undefined, name: string): { readonly min: number; readonly max: number } {
  const option = requiredOption(options, name);
  if (option.type !== "spin" || !Number.isSafeInteger(option.min) || !Number.isSafeInteger(option.max) || option.min! > option.max!) {
    throw new ProviderSourceUnavailable("invalid_response", `Maia does not advertise valid integer ${name} bounds`);
  }
  return { min: option.min!, max: option.max! };
}

/** Pinned Maia3 cmd_setoption accepts float strings; its UCI has NO decimal min/max. */
function decimalOption(options: readonly EngineOption[] | undefined, name: "Temperature" | "TopP"): void {
  const option = requiredOption(options, name);
  const numeric = typeof option.default === "string" && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(option.default) ? Number(option.default) : NaN;
  if (option.type !== "string" || option.min !== undefined || option.max !== undefined || !Number.isFinite(numeric) || numeric <= 0 || (name === "TopP" && numeric > 1)) {
    throw new ProviderSourceUnavailable("invalid_response", `Maia ${name} does not match the pinned decimal-string option profile`);
  }
}

/** Refuse-only §6 profile: no invented decimal bounds, clamping or silent default. */
function checkMaiaLiveBounds(request: { readonly band: number; readonly temperature: number; readonly topP: number; readonly requestedWidth: number }, health: EngineHealth, options: readonly EngineOption[] | undefined): number {
  const identity = health.identity;
  if (identity?.id !== MAIA_ENGINE_ID || identity.kind !== "opponent" || identity.modelId !== MAIA3_MODEL_ID || identity.version !== MAIA3_SOURCE_COMMIT) {
    throw new ProviderSourceUnavailable("identity_mismatch", "Maia decimal options require the pinned model/source identity");
  }
  numericOption(options, "Elo");
  if (health.bandOption !== "Elo") throw new ProviderSourceUnavailable("invalid_response", "Maia must apply the advertised Elo option");
  const profile = engineBandProfile(health);
  if (profile.min === null || profile.max === null) throw new ProviderRequestInvalid("Maia advertises no complete band range");
  const min = Math.max(profile.min, MAIA3_BAND_RANGE.min);
  const max = Math.min(profile.max, MAIA3_BAND_RANGE.max);
  if (min > max) throw new ProviderRequestInvalid("Maia's effective band range is empty");
  if (request.band < min || request.band > max) throw new ProviderRequestInvalid(`band ${request.band} is outside ${min}..${max}`);
  const multiPv = numericOption(options, "MultiPV");
  if (multiPv.min < 1) throw new ProviderSourceUnavailable("invalid_response", "Maia MultiPV must advertise a positive minimum");
  if (request.requestedWidth < multiPv.min) throw new ProviderRequestInvalid(`requestedWidth ${request.requestedWidth} is below the advertised MultiPV minimum ${multiPv.min}`);
  if (request.requestedWidth > multiPv.max) throw new ProviderRequestInvalid(`requestedWidth ${request.requestedWidth} exceeds the advertised MultiPV maximum ${multiPv.max}`);
  decimalOption(options, "Temperature");
  decimalOption(options, "TopP");
  let applied: number | undefined;
  try {
    applied = appliedTargetElo(health, request.band);
  } catch (error) {
    throw new ProviderRequestInvalid(error instanceof Error ? error.message : String(error));
  }
  if (applied !== request.band) throw new ProviderSourceUnavailable("identity_mismatch", `Maia would apply band ${String(applied)}, not ${request.band}`);
  return applied;
}

export function MaiaPolicyPageOperation(engines: ProviderEngineClient | null): ProviderOperationDescriptor<"maia.policy_page@1"> {
  return describe<"maia.policy_page@1">({
    operation: "maia.policy_page@1",
    provider: "maia",
    normalizeRequest: (request) => normalizeProviderRequest("maia.policy_page@1", request),
    preflight: () => null,
    async execute(identity, context) {
      if (engines === null) throw new ProviderSourceUnavailable("provider_unavailable", "no Maia engine is configured");
      const { request } = identity;
      await engines.start(MAIA_ENGINE_ID);
      const before = engines.health(MAIA_ENGINE_ID);
      const generation = engines.establishedGeneration(MAIA_ENGINE_ID);
      if (generation === null) throw new ProviderSourceUnavailable("identity_mismatch", "Maia has no established generation");
      if (before.identity?.modelId !== request.requestedModel.id || before.identity.version !== request.requestedModel.version) throw new ProviderSourceUnavailable("identity_mismatch", "Maia live model/source differs from the requested identity");
      checkMaiaLiveBounds(request, before, before.options);
      const capture = await engineExchange(engines, MAIA_ENGINE_ID, maiaCommandImage(request), [], context);
      if (capture.generation !== generation || engines.establishedGeneration(MAIA_ENGINE_ID) !== generation) throw new ProviderSourceUnavailable("identity_mismatch", "Maia generation changed during option admission/exchange");
      // Same-exchange proof: the generation that ran the commands advertises the supported profile.
      checkMaiaLiveBounds(request, { ...before, ...(capture.identity === undefined ? {} : { identity: capture.identity }), options: capture.options }, capture.options);
      const identityCaptured = capture.identity;
      if (identityCaptured.modelId === undefined) throw new ProviderSourceUnavailable("identity_mismatch", "the Maia generation reports no model id");
      if (identityCaptured.eloHonored !== true) throw new ProviderSourceUnavailable("identity_mismatch", "the Maia generation does not honour Elo");
      if (capture.artifact?.kind !== "container") throw new ProviderSourceUnavailable("provider_unavailable", "the launched Maia container identity was not captured for this generation");
      return Object.freeze({
        endpoint: endpoint("maia.policy_page@1"),
        actualIdentity: Object.freeze({
          id: identityCaptured.id,
          kind: "opponent",
          name: identityCaptured.name,
          version: identityCaptured.version,
          modelId: identityCaptured.modelId,
          containerDigest: capture.artifact.containerDigest,
          seedHonored: identityCaptured.seedHonored,
          eloHonored: true,
          optionImageDigest: capture.optionImageDigest,
        }),
        generation: capture.generation,
        contentEncoding: "uci-utf8",
        transport: null,
        responseBytes: uciBytes(capture),
      }) as unknown as ProviderExecutionCapture<"maia.policy_page@1">;
    },
    retainedWeight: (payload) => Math.max(1, payload.candidates.length),
    admitRetained: (acquisition) => engines !== null && acquisition.generation !== null && engines.establishedGeneration(MAIA_ENGINE_ID) === acquisition.generation,
  });
}

// ---------------------------------------------------------------------------------------------
// §§7–8 HTTP providers
// ---------------------------------------------------------------------------------------------

/** Status 200 plus exactly one allow-listed ETag (trimmed once); everything else is a source failure. */
async function httpCapture(fetcher: ProviderFetch, url: string, headers: Readonly<Record<string, string>>, context: ProviderExecutionContext, label: string): Promise<{ readonly transport: ProviderHttpResponseMetadata; readonly body: Uint8Array }> {
  let response: Response;
  try {
    response = await fetcher(url, { signal: context.signal, headers: { "user-agent": USER_AGENT, ...headers } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ProviderSourceUnavailable("provider_unavailable", `${label} network failure`);
  }
  if (response.status !== 200) {
    const detail = response.status === 401 || response.status === 403 ? "authorization required" : response.status === 429 ? "rate limited (429)" : response.status >= 500 ? `server error (${response.status})` : `HTTP ${response.status}`;
    throw new ProviderSourceUnavailable("provider_unavailable", `${label} ${detail}`);
  }
  const raw = response.headers.get("etag");
  // Headers joins repeated fields with ", "; a joined value is duplicate/conflicting ETags.
  if (raw !== null && raw.includes(",")) throw new ProviderSourceUnavailable("invalid_response", `${label} returned more than one ETag`);
  const etag = raw === null ? null : raw.trim();
  const body = new Uint8Array(await response.arrayBuffer());
  return { transport: Object.freeze({ statusCode: 200, headers: Object.freeze({ etag: etag === "" ? null : etag }) }), body };
}

export function SyzygyPositionOperation(fetcher: ProviderFetch | null): ProviderOperationDescriptor<"syzygy.position@1"> {
  return describe<"syzygy.position@1">({
    operation: "syzygy.position@1",
    provider: "syzygy",
    normalizeRequest: (request) => normalizeProviderRequest("syzygy.position@1", request),
    preflight: (identity) => syzygyPreflight(identity),
    async execute(identity, context) {
      if (fetcher === null) throw new ProviderSourceUnavailable("provider_unavailable", "no Syzygy tablebase endpoint is configured");
      const { transport, body } = await httpCapture(fetcher, syzygyRequestUrl(identity.request), {}, context, "tablebase");
      const literal = endpoint("syzygy.position@1");
      return Object.freeze({ endpoint: literal, actualIdentity: Object.freeze({ source: "lichess_syzygy", endpoint: literal, apiVersion: "standard-v1" }), generation: null, contentEncoding: "http-body", transport, responseBytes: body }) as unknown as ProviderExecutionCapture<"syzygy.position@1">;
    },
    retainedWeight: (payload) => Math.max(1, payload.position.moves.length),
    admitRetained: () => true,
  });
}

export function ExplorerPositionPageOperation(fetcher: ProviderFetch | null, token: string | null): ProviderOperationDescriptor<"lichess_explorer.position_page@1"> {
  return describe<"lichess_explorer.position_page@1">({
    operation: "lichess_explorer.position_page@1",
    provider: "lichess_explorer",
    normalizeRequest: (request) => normalizeProviderRequest("lichess_explorer.position_page@1", request),
    preflight: () => null,
    async execute(identity, context) {
      if (fetcher === null) throw new ProviderSourceUnavailable("provider_unavailable", "no Lichess explorer endpoint is configured");
      const { transport, body } = await httpCapture(fetcher, explorerRequestUrl(identity.request), token === null ? {} : { authorization: `Bearer ${token}` }, context, "explorer");
      const literal = endpoint("lichess_explorer.position_page@1");
      return Object.freeze({ endpoint: literal, actualIdentity: Object.freeze({ source: "lichess_explorer", endpoint: literal, apiVersion: "lichess-v1" }), generation: null, contentEncoding: "http-body", transport, responseBytes: body }) as unknown as ProviderExecutionCapture<"lichess_explorer.position_page@1">;
    },
    retainedWeight: (payload) => Math.max(1, payload.result.moves.length),
    admitRetained: () => true,
  });
}

export interface ProviderOperationSources {
  readonly engines: ProviderEngineClient | null;
  readonly tablebaseFetch: ProviderFetch | null;
  readonly explorerFetch: ProviderFetch | null;
  readonly explorerToken: string | null;
}

/** The exact mapped descriptor set, one per `ProviderOperationId`. */
export function providerOperationDescriptors(sources: ProviderOperationSources): ProviderOperationDescriptors {
  return Object.freeze({
    "stockfish.legal_root_table@1": StockfishLegalRootTableOperation(sources.engines),
    "stockfish.position_evaluation@1": StockfishPositionEvaluationOperation(sources.engines),
    "stockfish.principal_variation@1": StockfishPrincipalVariationOperation(sources.engines),
    "maia.policy_page@1": MaiaPolicyPageOperation(sources.engines),
    "syzygy.position@1": SyzygyPositionOperation(sources.tablebaseFetch),
    "lichess_explorer.position_page@1": ExplorerPositionPageOperation(sources.explorerFetch, sources.explorerToken),
  });
}
