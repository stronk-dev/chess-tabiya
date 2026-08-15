import type { EngineSpec } from "./engine-supervisor.js";

export const MAIA3_SOURCE_COMMIT =
  "1e13597c42d4858b7cfd7cfdae01e297263364b2" as const;
export const MAIA3_MODEL_ID =
  "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe" as const;
export const DEFAULT_MAIA_IMAGE = "chess-tabiya-maia:1e13597" as const;

export interface MaiaDockerSpecOptions {
  readonly image?: string;
  readonly containerDigest?: string;
  readonly transcriptCapacity?: number;
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
