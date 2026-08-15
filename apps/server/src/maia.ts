import type { EngineSpec } from "./engine-supervisor.js";

export const MAIA3_SOURCE_COMMIT =
  "1e13597c42d4858b7cfd7cfdae01e297263364b2" as const;
export const MAIA3_MODEL_ID =
  "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe" as const;
export const DEFAULT_MAIA_IMAGE = "chess-tabiya-maia:1e13597" as const;
// R10 measured the widest interval whose policy trajectory remains ordered and
// whose listed mass remains readable. This is a deployment bound, not a claim
// that Maia plays at a human rating inside the interval.
export const MAIA3_BAND_RANGE = Object.freeze({ min: 1000, max: 2400 });

export interface MaiaDockerSpecOptions {
  readonly image?: string;
  readonly containerDigest?: string;
  readonly transcriptCapacity?: number;
}

export function maiaNetworkSpec(host: string, port: number): EngineSpec {
  return Object.freeze({
    id: "maia-5m",
    kind: "opponent",
    command: "nc",
    args: Object.freeze([host, String(port)]),
    name: "Maia3",
    version: MAIA3_SOURCE_COMMIT,
    modelId: MAIA3_MODEL_ID,
    bandOption: "Elo",
    bandRange: MAIA3_BAND_RANGE,
    handshakeTimeoutMs: 60_000,
  });
}

export function maiaDockerSpec(
  options: MaiaDockerSpecOptions = {},
): EngineSpec {
  return {
    id: "maia-5m",
    kind: "opponent",
    command: "docker",
    args: ["run", "--rm", "-i", options.image ?? DEFAULT_MAIA_IMAGE],
    name: "Maia3",
    version: MAIA3_SOURCE_COMMIT,
    modelId: MAIA3_MODEL_ID,
    bandOption: "Elo",
    bandRange: MAIA3_BAND_RANGE,
    ...(options.containerDigest === undefined
      ? {}
      : { containerDigest: options.containerDigest }),
    ...(options.transcriptCapacity === undefined
      ? {}
      : { transcriptCapacity: options.transcriptCapacity }),
    // First contact: upstream UCI advertises no seed option.
    handshakeTimeoutMs: 30_000,
    restartBackoff: {
      initialMs: 500,
      maximumMs: 5_000,
      maximumAttempts: 5,
    },
  };
}
