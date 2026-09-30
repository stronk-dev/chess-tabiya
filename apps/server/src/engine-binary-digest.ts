import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { realpath } from "node:fs/promises";
import { basename, delimiter, isAbsolute, join } from "node:path";

import { PROVIDER_DIGEST_DOMAINS, type EngineBinaryDigest } from "@chess-tabiya/runtime";
import type { EngineArtifactCapture, EngineSpec } from "./engine-supervisor.js";

/** Resolve exactly the executable being launched; never stamp a wrapper/model with binary identity. */
export async function streamingBinaryArtifactProbe(spec: EngineSpec): Promise<EngineArtifactCapture | null> {
  if (spec.modelId !== undefined || ["docker", "podman", "nc", "ncat", "socat"].includes(basename(spec.command))) return null;
  const candidates = isAbsolute(spec.command)
    ? [spec.command]
    : (process.env.PATH ?? "").split(delimiter).filter(Boolean).map((directory) => join(directory, spec.command));
  for (const candidate of candidates) {
    try {
      const bytes = createReadStream(await realpath(candidate), { highWaterMark: 64 * 1024 });
      return Object.freeze({ kind: "binary", binaryDigest: await digestExecutableStream(bytes) });
    } catch { /* An unreadable executable is no artifact; never substitute a spec label. */ }
  }
  return null;
}

/**
 * Server-only streaming adapter for the existing fixed-domain executable-byte authority.
 * Standard SHA-256, not a new identity or parser implementation. Equality is tested against
 * digestEngineBinary; the frozen runtime source closure must not change for this memory repair.
 */
export async function digestExecutableStream(chunks: AsyncIterable<Uint8Array>): Promise<EngineBinaryDigest> {
  const domain: (typeof PROVIDER_DIGEST_DOMAINS)[number] = "engine.binary.v1";
  const hash = createHash("sha256").update(`tabiya/${domain}\u0000`, "utf8");
  let size = 0;
  for await (const chunk of chunks) {
    if (!(chunk instanceof Uint8Array)) throw new TypeError("Engine binary stream requires executable byte chunks");
    size += chunk.byteLength;
    if (!Number.isSafeInteger(size)) throw new TypeError("Executable byte count exceeds the safe integer range");
    hash.update(chunk);
  }
  if (size === 0) throw new TypeError("Engine binary digest requires the launched executable's non-empty bytes");
  return `sha256:${hash.digest("hex")}` as EngineBinaryDigest;
}
