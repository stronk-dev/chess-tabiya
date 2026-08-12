import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

export function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export async function writeCanonicalJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${canonicalizeJson(value)}\n`, "utf8");
}

export async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

export function emissionJobDigest(
  pipeline: string,
  args: Readonly<Record<string, unknown>>,
  sourceEtags: readonly (string | null)[],
): string {
  return sha256(canonicalizeJson({ pipeline, args, sourceEtags }));
}
