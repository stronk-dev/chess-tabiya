import { mkdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import { readJson, sha256, writeCanonicalJson } from "./canonical.js";
import type { SourceEntry, SourceLicence } from "./types.js";

export async function ingestLocalFile(
  path: string,
  options: {
    readonly sourceId: string;
    readonly licence: SourceLicence;
    readonly sourceRoot?: string;
    readonly now?: () => Date;
  },
): Promise<{ readonly bytes: Uint8Array; readonly entry: SourceEntry }> {
  const absolute = resolve(path);
  const bytes = new Uint8Array(await readFile(absolute));
  const digest = sha256(bytes);
  const sourceRoot = resolve(options.sourceRoot ?? "content/sources");
  const metadataPath = resolve(sourceRoot, "files", `${digest.slice(7)}.json`);
  await mkdir(resolve(metadataPath, ".."), { recursive: true });
  let retrievedAt: string;
  try {
    const metadata = await readJson(metadataPath) as Record<string, unknown>;
    if (metadata.sha256 !== digest || typeof metadata.retrievedAt !== "string") throw new TypeError("invalid file-cache metadata");
    retrievedAt = metadata.retrievedAt;
  } catch {
    retrievedAt = (options.now?.() ?? new Date()).toISOString();
    await writeCanonicalJson(metadataPath, { kind: "file", sha256: digest, bytes: bytes.byteLength, retrievedAt });
  }
  const repositoryPath = relative(resolve("."), absolute).replaceAll("\\", "/");
  return {
    bytes,
    entry: {
      sourceId: options.sourceId,
      retrievedAt,
      origin: { kind: "local-file", path: repositoryPath, sha256: digest, bytes: bytes.byteLength },
      licence: options.licence,
    },
  };
}
