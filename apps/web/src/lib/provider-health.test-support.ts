/**
 * Client test fixtures for the `/capabilities` provider-health section. Every value built here is
 * run back through the shared runtime parser, so a fixture cannot drift from the server wire.
 */
import {
  APPLICATION_PROVIDER_EXECUTION,
  POLICY_MODE_OPERATIONS,
  PROVIDER_INSTANCE_DECLARATIONS,
  RUN_OPPONENT_MODES,
  combineOperationAvailability,
  instanceOperationAvailability,
  parseProviderHealthCapabilities,
  type ProviderFailureReason,
  type ProviderHealthCapabilities,
  type ProviderHealthSnapshot,
  type ProviderImplementation,
  type ProviderInstanceId,
} from "@chess-tabiya/runtime";

export type FixtureProviderState =
  | "unverified"
  | "available"
  | { readonly failed: ProviderFailureReason; readonly cachedEntries?: number };

const AT = "2026-09-24T12:00:00.000Z";

export function fixtureProviderHealth(
  states: Partial<Record<ProviderInstanceId, FixtureProviderState>>,
  implementations: Partial<Record<ProviderInstanceId, ProviderImplementation>> = {},
): ProviderHealthCapabilities {
  const providers: ProviderHealthSnapshot[] = PROVIDER_INSTANCE_DECLARATIONS.map((declaration) => {
    const state = states[declaration.instanceId];
    if (state === undefined) return { instanceId: declaration.instanceId, familyId: declaration.familyId, state: "not_configured" };
    const base = { instanceId: declaration.instanceId, familyId: declaration.familyId, implementation: implementations[declaration.instanceId] ?? declaration.allowedImplementations[0], generation: `sha256:${"a".repeat(64)}` };
    if (state === "unverified") return { ...base, state: "unverified", retryAfterMs: null };
    if (state === "available") return { ...base, state: "available", reason: null, checkedAt: AT, lastSuccessAt: AT, lastFailureAt: null };
    const times = { checkedAt: AT, lastSuccessAt: null, lastFailureAt: AT };
    return state.cachedEntries !== undefined && state.cachedEntries > 0
      ? { ...base, ...times, state: "degraded_cached_only", reason: state.failed, retryAfterMs: 5_000, cacheScope: "exact_request", validExactEntries: state.cachedEntries, cacheRevision: 1 }
      : { ...base, ...times, state: "unavailable", reason: state.failed, retryAfterMs: 5_000, cacheScope: "none" };
  });
  const byInstance = new Map(providers.map((row) => [row.instanceId, row] as const));
  const operations = APPLICATION_PROVIDER_EXECUTION.map((row) => ({ operation: row.operation, availability: instanceOperationAvailability(byInstance.get(row.instanceId)!) }));
  const byOperation = new Map(operations.map((row) => [row.operation, row.availability] as const));
  const policyModes = RUN_OPPONENT_MODES.map((mode) => ({ mode, availability: combineOperationAvailability(POLICY_MODE_OPERATIONS[mode].map((operation) => byOperation.get(operation)!)) }));
  return parseProviderHealthCapabilities(JSON.parse(JSON.stringify({ generatedAt: AT, providers, operations, policyModes })));
}

/** The mock deployment the web tests model: local fixtures for engines, Explorer and tablebase. */
export const MOCK_PROVIDER_HEALTH: ProviderHealthCapabilities = fixtureProviderHealth(
  { "stockfish-play": "available", "stockfish-analysis": "available", "maia-inference": "available", "explorer-primary": "available", "tablebase-primary": "available" },
  { "stockfish-play": "local_fixture", "stockfish-analysis": "local_fixture", "maia-inference": "local_fixture", "explorer-primary": "local_fixture", "tablebase-primary": "local_fixture" },
);
