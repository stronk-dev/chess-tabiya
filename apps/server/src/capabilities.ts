import { runtimeBuildInfo } from "@chess-tabiya/runtime";

import type { EngineIdentity } from "./engine-supervisor.js";
import type { OpponentPolicyMode } from "./opponent-selector.js";

export const SUPPORTED_POLICY_MODES: readonly OpponentPolicyMode[] = Object.freeze([
  "human_common",
  "strong_engine",
  "theory_strict",
]);

export interface Capabilities {
  readonly engines: readonly EngineIdentity[];
  readonly policyModes: readonly OpponentPolicyMode[];
  readonly runSchemaVersion: string;
}

export interface CapabilitiesProvider {
  get(): Promise<Capabilities>;
}

export interface CapabilityEngineClient {
  start(engineId: string): Promise<EngineIdentity>;
}

export class EngineCapabilities implements CapabilitiesProvider {
  readonly #client: CapabilityEngineClient;
  readonly #engineIds: readonly string[];

  constructor(client: CapabilityEngineClient, engineIds: readonly string[]) {
    this.#client = client;
    this.#engineIds = Object.freeze([...engineIds]);
  }

  async get(): Promise<Capabilities> {
    const engines = await Promise.all(
      this.#engineIds.map((engineId) => this.#client.start(engineId)),
    );
    return Object.freeze({
      engines: Object.freeze(engines),
      policyModes: SUPPORTED_POLICY_MODES,
      runSchemaVersion: runtimeBuildInfo.runSchemaVersion,
    });
  }
}
