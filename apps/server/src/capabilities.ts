import { runtimeBuildInfo } from "@chess-tabiya/runtime";

import type { EngineHealth, EngineIdentity } from "./engine-supervisor.js";
import type { OpponentPolicyMode } from "./opponent-selector.js";
import {
  resolveStrongEngineProfile,
  type StrongEngineProfile,
} from "./strong-engine.js";

export const SUPPORTED_POLICY_MODES: readonly OpponentPolicyMode[] = Object.freeze([
  "human_common",
  "strong_engine",
  "theory_strict",
]);

export const SURFACE_IDS = Object.freeze([
  "play",
  "review",
  "learn",
  "live",
  "create",
  "justPlay",
  "fromPosition",
] as const);

export type SurfaceId = (typeof SURFACE_IDS)[number];
export type SurfaceAvailability = "available" | "unavailable-here";
export type CapabilityEngineMode = "mock" | "maia";

export interface CapabilityProviders {
  readonly opponent: "maia" | "mock" | "none";
  readonly judge: "stockfish" | "mock" | "none";
  readonly llm: "none";
}

export type SurfaceCapabilities = Readonly<
  Record<SurfaceId, SurfaceAvailability>
>;

export interface Capabilities {
  readonly engines: readonly EngineIdentity[];
  readonly policyModes: readonly OpponentPolicyMode[];
  readonly runSchemaVersion: string;
  readonly policyProfiles: {
    readonly strong_engine: StrongEngineProfile;
  };
  readonly providers: CapabilityProviders;
  readonly surfaces: SurfaceCapabilities;
}

export interface CapabilitiesProvider {
  get(): Promise<Capabilities>;
}

export interface CapabilityEngineClient {
  health(engineId: string): EngineHealth;
}

export function assertSurfaceCapabilities(
  value: Readonly<Record<string, unknown>>,
): asserts value is SurfaceCapabilities {
  for (const id of SURFACE_IDS) {
    const status = value[id];
    if (status !== "available" && status !== "unavailable-here") {
      throw new TypeError(
        `Surface ${id} must be available or unavailable-here; received ${String(status)}`,
      );
    }
  }
  for (const id of Object.keys(value)) {
    if (!(SURFACE_IDS as readonly string[]).includes(id)) {
      throw new TypeError(`Unknown capability surface: ${id}`);
    }
  }
}

function providers(
  engineMode: CapabilityEngineMode,
  identities: readonly EngineIdentity[],
): CapabilityProviders {
  if (engineMode === "mock") {
    const opponentReady = identities.some((identity) => identity.kind === "opponent");
    return Object.freeze({
      opponent: opponentReady ? "mock" : "none",
      // Mock mode wires MockEvidenceExecutor even though it has no UCI identity.
      judge: "mock",
      llm: "none",
    });
  }
  return Object.freeze({
    opponent: identities.some((identity) => identity.kind === "opponent")
      ? "maia"
      : "none",
    judge: identities.some((identity) => identity.kind === "judge")
      ? "stockfish"
      : "none",
    llm: "none",
  });
}

function surfaces(providerState: CapabilityProviders): SurfaceCapabilities {
  const value: Readonly<Record<string, unknown>> = Object.freeze({
    play: providerState.opponent === "none" ? "unavailable-here" : "available",
    review: "available",
    learn: "unavailable-here",
    live: "unavailable-here",
    create: "unavailable-here",
    justPlay: "unavailable-here",
    fromPosition: "unavailable-here",
  });
  assertSurfaceCapabilities(value);
  return value;
}

export class EngineCapabilities implements CapabilitiesProvider {
  readonly #client: CapabilityEngineClient;
  readonly #engineIds: readonly string[];
  readonly #engineMode: CapabilityEngineMode;
  readonly #strongEngineProfile: StrongEngineProfile;

  constructor(
    client: CapabilityEngineClient,
    engineIds: readonly string[],
    options: {
      readonly engineMode: CapabilityEngineMode;
      readonly strongEngineProfile?: Partial<StrongEngineProfile>;
    },
  ) {
    this.#client = client;
    this.#engineIds = Object.freeze([...engineIds]);
    this.#engineMode = options.engineMode;
    this.#strongEngineProfile = resolveStrongEngineProfile(
      options.strongEngineProfile,
    );
  }

  async get(): Promise<Capabilities> {
    const engines = Object.freeze(
      this.#engineIds.flatMap((engineId) => {
        const health = this.#client.health(engineId);
        return health.status === "ready" && health.identity !== undefined
          ? [health.identity]
          : [];
      }),
    );
    const providerState = providers(this.#engineMode, engines);
    return Object.freeze({
      engines,
      policyModes: SUPPORTED_POLICY_MODES,
      runSchemaVersion: runtimeBuildInfo.runSchemaVersion,
      policyProfiles: Object.freeze({
        strong_engine: this.#strongEngineProfile,
      }),
      providers: providerState,
      surfaces: surfaces(providerState),
    });
  }
}
