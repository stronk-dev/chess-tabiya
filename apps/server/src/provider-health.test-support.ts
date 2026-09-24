/**
 * Test construction for the provider-health authority. A registry built here is an ordinary
 * `ProviderRegistry`; states are reached through its real transitions (handshake, admission and
 * settlement), never written directly.
 */
import type { ProviderFailureReason, ProviderHealthCapabilities, ProviderImplementation, ProviderInstanceId } from "@chess-tabiya/runtime";

import { ProviderRegistry, type ProviderInstanceConfiguration, type RegistryTimers } from "./provider-health.js";

export type TestProviderState = "unverified" | "available" | { readonly failed: ProviderFailureReason; readonly retryAfterMs?: number };

const DEFAULT_IMPLEMENTATION: Readonly<Record<ProviderInstanceId, ProviderImplementation>> = Object.freeze({
  "stockfish-play": "uci_sidecar",
  "stockfish-analysis": "uci_sidecar",
  "maia-inference": "uci_sidecar",
  "tablebase-primary": "lichess_http",
  "explorer-primary": "lichess_http",
  "external-voice": "external_http",
  "external-tts": "external_http",
});

export interface TestClock {
  now: number;
  wall: string;
  advance(ms: number): void;
}

export function testClock(start = 1_000): TestClock {
  const clock = {
    now: start,
    wall: "2026-09-24T12:00:00.000Z",
    advance(ms: number) {
      clock.now += ms;
      clock.wall = new Date(Date.parse(clock.wall) + ms).toISOString();
    },
  };
  return clock;
}

/** Timers that never fire on their own: tests drive every deadline through the clock. */
export const MANUAL_TIMERS: RegistryTimers = Object.freeze({ set: () => undefined, clear: () => undefined });

export async function testRegistry(
  states: Partial<Record<ProviderInstanceId, TestProviderState>>,
  options: { readonly clock?: TestClock; readonly implementations?: Partial<Record<ProviderInstanceId, ProviderImplementation>>; readonly exchangeArtifact?: (instanceId: ProviderInstanceId) => boolean } = {},
): Promise<ProviderRegistry> {
  const clock = options.clock ?? testClock();
  const configured: ProviderInstanceConfiguration[] = Object.keys(states).map((instanceId) => ({
    instanceId: instanceId as ProviderInstanceId,
    implementation: options.implementations?.[instanceId as ProviderInstanceId] ?? DEFAULT_IMPLEMENTATION[instanceId as ProviderInstanceId],
    endpoint: `test-${instanceId}`,
    identity: `test identity ${instanceId}`,
  }));
  const registry = new ProviderRegistry({
    configured,
    monotonicNowMs: () => clock.now,
    wallNow: () => clock.wall,
    timers: MANUAL_TIMERS,
    ...(options.exchangeArtifact === undefined ? {} : { exchangeArtifact: options.exchangeArtifact }),
  });
  for (const [instanceId, state] of Object.entries(states) as [ProviderInstanceId, TestProviderState][]) {
    if (state === "unverified") continue;
    await driveTo(registry, instanceId, state);
  }
  return registry;
}

const OPERATION_FOR: Readonly<Record<ProviderInstanceId, Parameters<ProviderRegistry["admit"]>[0]>> = Object.freeze({
  "stockfish-play": "opponent.stockfish_play",
  "stockfish-analysis": "evidence.stockfish_analysis",
  "maia-inference": "opponent.maia_inference",
  "tablebase-primary": "evidence.tablebase_probe",
  "explorer-primary": "evidence.explorer_query",
  "external-voice": "render.voice",
  "external-tts": "render.speech",
});

/** Drives one instance through a real admitted request to `available` or a failed state. */
export async function driveTo(registry: ProviderRegistry, instanceId: ProviderInstanceId, state: Exclude<TestProviderState, "unverified">): Promise<void> {
  const operation = OPERATION_FOR[instanceId];
  if (state === "available" && (instanceId === "stockfish-play" || instanceId === "stockfish-analysis" || instanceId === "maia-inference")) {
    registry.recordHandshake(instanceId);
    return;
  }
  const ticket = await registry.admit(operation);
  registry.settle(ticket, state === "available" ? { kind: "success" } : { kind: "failure", reason: state.failed, ...(state.retryAfterMs === undefined ? {} : { retryAfterMs: state.retryAfterMs }) });
}

/** The `/capabilities` provider-health section of a freshly driven test registry. */
export async function testProviderHealth(states: Partial<Record<ProviderInstanceId, TestProviderState>>, options: Parameters<typeof testRegistry>[1] = {}): Promise<ProviderHealthCapabilities> {
  return ProviderRegistry.wire((await testRegistry(states, options)).snapshot());
}
