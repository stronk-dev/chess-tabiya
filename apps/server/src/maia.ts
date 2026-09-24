import { connect } from "node:net";

import { digestEngineContainer } from "@chess-tabiya/runtime";

import type { EngineArtifactCapture, EngineArtifactProbe, EngineSpec } from "./engine-supervisor.js";

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

/**
 * The Maia container-identity probe (rfc/provider-exchange-and-execution.md §3, left open there;
 * closed by rfc/provider-health-degradation.md). Immediately before each networked-Maia generation
 * spawns, it opens one connection to the sidecar, sends `tabiya-identity`, and reads exactly one
 * JSON line naming the running container's OCI identity, which the release compiler injected from
 * the registry's own manifest/config digests. Anything else — no answer, a refusal, a malformed or
 * partial identity — is `null`, so Maia exchanges stay honestly unavailable rather than inventing an
 * artifact from a spec label.
 */
export function maiaContainerProbe(host: string, port: number, options: { readonly timeoutMs?: number } = {}): EngineArtifactProbe {
  const timeoutMs = options.timeoutMs ?? 2_000;
  return () => new Promise<EngineArtifactCapture | null>((resolve) => {
    let settled = false;
    let buffer = "";
    const socket = connect({ host, port });
    const finish = (value: EngineArtifactCapture | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    socket.setEncoding("utf8");
    socket.once("connect", () => socket.write("tabiya-identity\n"));
    socket.on("data", (chunk: string) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline < 0) {
        if (buffer.length > 4_096) finish(null);
        return;
      }
      finish(parseMaiaContainerIdentity(buffer.slice(0, newline)));
    });
    socket.once("error", () => finish(null));
    socket.once("close", () => finish(null));
  });
}

const OCI_DIGEST = /^sha256:[0-9a-f]{64}$/u;

/** Parses the sidecar's one identity line: exact keys and digest shapes, or null. */
export function parseMaiaContainerIdentity(line: string): EngineArtifactCapture | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== "configDigest,imageId,manifestDigest,runtime") return null;
  const { runtime, imageId, manifestDigest, configDigest } = record;
  if (runtime !== "oci" || typeof imageId !== "string" || imageId === "" || typeof manifestDigest !== "string" || typeof configDigest !== "string") return null;
  if (!OCI_DIGEST.test(manifestDigest) || !OCI_DIGEST.test(configDigest)) return null;
  return Object.freeze({
    kind: "container",
    containerDigest: digestEngineContainer({ runtime: "oci", imageId, manifestDigest: manifestDigest as `sha256:${string}`, configDigest: configDigest as `sha256:${string}` }),
  });
}
