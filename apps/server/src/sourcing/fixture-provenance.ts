import { readFile } from "node:fs/promises";

import type { SourceEntry } from "./types.js";
import { SourcingError } from "./types.js";
import { sha256 } from "./canonical.js";

interface HttpFixtureProvenance {
  readonly schema: "tabiya.test-fixture.http-capture.v1";
  readonly fixture: string;
  readonly sourceId: string;
  readonly capture: {
    readonly method: "GET";
    readonly url: string;
    readonly retrievedAt: string;
    readonly status: number;
    readonly etag: string | null;
    readonly sha256: string;
    readonly bytes: number;
  };
  readonly storage: {
    readonly transform: "append_lf";
    readonly sha256: string;
    readonly bytes: number;
  };
}

function validDigest(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}

export async function readCapturedHttpFixture(options: {
  readonly fixturePath: string;
  readonly provenancePath: string;
  readonly expectedUrl: string;
  readonly licence: SourceEntry["licence"];
}): Promise<{ readonly body: Uint8Array; readonly source: SourceEntry }> {
  const stored = new Uint8Array(await readFile(options.fixturePath));
  let record: HttpFixtureProvenance;
  try {
    record = JSON.parse(await readFile(options.provenancePath, "utf8")) as HttpFixtureProvenance;
  } catch {
    throw new SourcingError("FIXTURE_PROVENANCE_INVALID", `${options.provenancePath} is not a readable provenance record`);
  }
  const captured = stored.at(-1) === 10 ? stored.subarray(0, -1) : stored;
  const shapeValid = record.schema === "tabiya.test-fixture.http-capture.v1"
    && record.fixture === options.fixturePath.split("/").at(-1)
    && typeof record.sourceId === "string" && record.sourceId.length > 0
    && record.capture?.method === "GET"
    && Number.isFinite(Date.parse(record.capture?.retrievedAt))
    && Number.isInteger(record.capture?.status)
    && (record.capture?.etag === null || typeof record.capture?.etag === "string")
    && validDigest(record.capture?.sha256)
    && Number.isInteger(record.capture?.bytes)
    && record.storage?.transform === "append_lf"
    && validDigest(record.storage?.sha256)
    && Number.isInteger(record.storage?.bytes);
  if (!shapeValid
    || stored.at(-1) !== 10
    || record.storage.bytes !== stored.byteLength
    || record.storage.sha256 !== sha256(stored)
    || record.capture.bytes !== captured.byteLength
    || record.capture.sha256 !== sha256(captured)) {
    throw new SourcingError("FIXTURE_PROVENANCE_INVALID", `${record.fixture ?? options.fixturePath} does not match its recorded byte identity`);
  }
  if (record.capture.url !== options.expectedUrl) {
    throw new SourcingError("FIXTURE_REQUEST_MISMATCH", `fixture captured ${record.capture.url}; requested ${options.expectedUrl}`);
  }
  return {
    body: captured,
    source: {
      sourceId: record.sourceId,
      retrievedAt: record.capture.retrievedAt,
      origin: {
        kind: "http",
        url: record.capture.url,
        status: record.capture.status,
        sha256: record.capture.sha256,
        bytes: record.capture.bytes,
        etag: record.capture.etag,
      },
      licence: options.licence,
    },
  };
}
