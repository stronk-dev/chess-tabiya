import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { sha256, writeCanonicalJson } from "./canonical.js";
import { SourcingHttpClient } from "./http.js";
import { withSourceLock } from "./lock.js";
import { CHESS_OPENINGS_COMMIT } from "./openings.js";
import { PUZZLE_DUMP_URL } from "./position-seeds.js";
import { SourcingError } from "./types.js";

export async function fetchOpeningSource(sourceRoot = resolve("content/sources")): Promise<void> {
  const destination = resolve(sourceRoot, "lichess-chess-openings");
  await mkdir(destination, { recursive: true });
  await withSourceLock(sourceRoot, async (lock) => {
    const client = new SourcingHttpClient(lock);
    for (const letter of ["a", "b", "c", "d", "e"] as const) {
      const url = `https://raw.githubusercontent.com/lichess-org/chess-openings/${CHESS_OPENINGS_COMMIT}/${letter}.tsv`;
      const response = await client.request(url);
      const retrievedAt = new Date().toISOString();
      await writeFile(resolve(destination, `${letter}.tsv`), response.body);
      await writeCanonicalJson(resolve(destination, `${letter}.json`), {
        kind: "body",
        url,
        status: response.status,
        sha256: sha256(response.body),
        bytes: response.body.byteLength,
        etag: response.headers.get("etag"),
        retrievedAt,
      });
    }
  });
}

export async function fetchPuzzleHeaders(sourceRoot = resolve("content/sources")): Promise<void> {
  const destination = resolve(sourceRoot, "lichess-puzzle-db");
  await mkdir(destination, { recursive: true });
  await withSourceLock(sourceRoot, async (lock) => {
    const response = await new SourcingHttpClient(lock).request(PUZZLE_DUMP_URL, { method: "HEAD" });
    await writeCanonicalJson(resolve(destination, "headers.json"), {
      kind: "headers-only", url: PUZZLE_DUMP_URL, status: response.status,
      etag: response.headers.get("etag"), contentLength: response.headers.get("content-length"),
      lastModified: response.headers.get("last-modified"), retrievedAt: new Date().toISOString(),
    });
  });
}

async function main(): Promise<number> {
  const source = process.argv[2];
  if (source !== "lichess-chess-openings" && source !== "lichess-puzzle-db") {
    console.error(`Unknown source ${JSON.stringify(source)}; registered sources: lichess-chess-openings, lichess-puzzle-db`);
    return 2;
  }
  if (process.env.OFFLINE === "1") {
    console.log(`Offline: committed ${source} fixture is available; no network request made.`);
    return 0;
  }
  try {
    if (source === "lichess-puzzle-db") await fetchPuzzleHeaders();
    else await fetchOpeningSource();
    console.log(`Fetched ${source} metadata into content/sources/ (gitignored)`);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`);
    else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("source-fetch.js")) process.exitCode = await main();
