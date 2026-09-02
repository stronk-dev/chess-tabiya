import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";

export type LongitudinalFailureCode = "snapshot_invalid" | "derivation_failed" | "publication_conflict";
export type LongitudinalUnavailableReason = "not_requested" | "revision_mismatch" | "profile_suppressed" | "cut_superseded";

interface CutBase {
  readonly runId: string;
  readonly requestedSeq: number;
}

export interface CompleteCut extends CutBase {
  readonly kind: "complete";
  readonly completedSeq: number;
  readonly derivedRev: number;
}

export type LongitudinalCutOutcome =
  | CompleteCut
  | (CutBase & { readonly kind: "pending"; readonly completedSeq: number; readonly derivedRev: number; readonly retryAt?: string })
  | (CutBase & { readonly kind: "failed"; readonly completedSeq: number; readonly derivedRev: number; readonly failureCode: LongitudinalFailureCode; readonly attempts: number })
  | (CutBase & { readonly kind: "unavailable"; readonly reason: LongitudinalUnavailableReason });

export interface LongitudinalRows {
  readonly denominators: readonly unknown[];
  readonly observations: readonly unknown[];
  readonly structureStats: readonly unknown[];
}

export type LongitudinalReadResult =
  | ({ readonly kind: "complete"; readonly cuts: readonly CompleteCut[] } & LongitudinalRows)
  | { readonly kind: "incomplete"; readonly cuts: readonly LongitudinalCutOutcome[] };

export function assembleLongitudinalRead(
  outcomes: readonly LongitudinalCutOutcome[],
  rows: LongitudinalRows,
): LongitudinalReadResult {
  const cuts = [...outcomes].sort((left, right) => left.runId.localeCompare(right.runId));
  for (let index = 1; index < cuts.length; index += 1) {
    if (cuts[index - 1]!.runId === cuts[index]!.runId) throw new TypeError("LONGITUDINAL_DUPLICATE_CUT");
  }
  if (cuts.every((cut): cut is CompleteCut => cut.kind === "complete")) {
    return Object.freeze({ kind: "complete", cuts: Object.freeze(cuts), ...rows });
  }
  return Object.freeze({ kind: "incomplete", cuts: Object.freeze(cuts) });
}

export interface FileBackedDatabaseIdentity {
  readonly kind: "sqlite_file";
  readonly absolutePath: string;
}

export function fileBackedDatabaseIdentity(databasePath: string | undefined, cwd: string): FileBackedDatabaseIdentity {
  const selected = databasePath ?? resolve(cwd, "data", "chess-tabiya.sqlite");
  if (selected.length === 0 || selected === ":memory:" || selected.startsWith("file:")) {
    throw new TypeError("LONGITUDINAL_FILE_DATABASE_REQUIRED");
  }
  return Object.freeze({ kind: "sqlite_file", absolutePath: resolve(cwd, selected) });
}

export interface MoveAuthorshipV1 {
  readonly eventSeq: number;
  readonly nodeId: string;
  readonly learnerId: string | null;
}

export interface LongitudinalSourceImageV1 {
  readonly version: 1;
  readonly runPrefix: unknown;
  readonly ownerLearnerId: string;
  readonly moveAuthorship: readonly MoveAuthorshipV1[];
  readonly importedMainlinePlies: number | null;
  readonly structureAttribution: "single_player" | "unattributable_shared";
}

export const LONGITUDINAL_SOURCE_DIGEST_DOMAIN = "tabiya.longitudinal-source.v1\0";

export function longitudinalSourceDigestV1(image: LongitudinalSourceImageV1): `sha256:${string}` {
  const canonical = canonicalizeJson(image);
  return `sha256:${createHash("sha256").update(LONGITUDINAL_SOURCE_DIGEST_DOMAIN, "utf8").update(canonical, "utf8").digest("hex")}`;
}

export const LONGITUDINAL_APPLICATION_CONTRACT = Object.freeze({
  productionDatabase: "one_absolute_file_identity",
  startup: "reconcile_then_worker_ready_then_listen",
  shutdown: "http_close_then_worker_drain_then_worker_db_then_engine_then_http_db",
  health: "closed_longitudinal_readiness_projection",
  testMemory: "disabled_test_no_worker",
  workerEntrypoint: "apps/server/dist/longitudinal-worker-thread.js",
} as const);

export function assertLongitudinalApplicationContract(value: typeof LONGITUDINAL_APPLICATION_CONTRACT): void {
  if (canonicalizeJson(value) !== canonicalizeJson(LONGITUDINAL_APPLICATION_CONTRACT)) {
    throw new TypeError("LONGITUDINAL_APPLICATION_CONTRACT_INVALID");
  }
}
