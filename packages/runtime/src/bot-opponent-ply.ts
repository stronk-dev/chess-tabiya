/**
 * The closed request and result grammar of `POST /runs/:runId/opponent-ply`
 * (rfc/bot-policy.md §4.1). Server route and web client import these; neither declares a
 * parallel status/code/retry/action table.
 *
 * The route persists its decision/operation envelope inside `opponent.move_selected`
 * (`OpponentSelection.policy`, run schema 0.18, migration 29).
 */
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { sha256Hex } from "./assistance-exchange.js";
import type { DrillRunEvent } from "./types.js";

export const BOT_REQUEST_ID_PATTERN = /^botreq_[A-Za-z0-9_-]{16,128}$/u;

/**
 * The run's event-head identity: the compare-and-swap token the browser echoes as
 * `expectedEventHeadDigest`. The event log is append-only with gap-free sequence numbers, so the
 * head event's `(seq, type, at)` under the run id identifies the whole prefix: any append — on any
 * branch, including a rewind or an evidence attachment — moves it. It deliberately excludes event
 * payloads, which the public projection redacts before feedback disclosure, so server and browser
 * compute the same token from their own views. Both share this one definition (the SHA-256 here is
 * dependency-free and synchronous).
 */
export function runEventHeadDigest(run: { readonly id: string; readonly events: readonly Pick<DrillRunEvent, "seq" | "type" | "at">[] }): `sha256:${string}` {
  const head = run.events.at(-1);
  const image = canonicalizeJson({
    protocol: "tabiya.run-event-head@1",
    runId: run.id,
    head: head === undefined ? null : { seq: head.seq, type: head.type, at: head.at },
  });
  return `sha256:${sha256Hex(image)}`;
}

/** A fresh idempotency key; `random` must return uniformly distributed bytes. */
export function botOpponentPlyRequestId(random: (bytes: Uint8Array) => Uint8Array): `botreq_${string}` {
  const bytes = random(new Uint8Array(18));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return `botreq_${[...bytes].map((byte) => alphabet[byte & 63]).join("")}`;
}

export interface BotOpponentPlyRequest {
  readonly requestId: `botreq_${string}`;
  readonly expectedNodeId: string;
  readonly expectedBranchId: string;
  readonly expectedEventHeadDigest: `sha256:${string}`;
}

export class BotOpponentPlyRequestError extends TypeError {
  readonly code = "INVALID_REQUEST" as const;
  constructor(message: string) {
    super(message);
    this.name = "BotOpponentPlyRequestError";
  }
}

const REQUEST_KEYS = Object.freeze(["requestId", "expectedNodeId", "expectedBranchId", "expectedEventHeadDigest"] as const);
const REQUEST_ID = BOT_REQUEST_ID_PATTERN;
const CANONICAL_DIGEST = /^sha256:[0-9a-f]{64}$/u;
const ROOT_IDENTITY = /^[A-Za-z0-9_.:-]{1,128}$/u;

/**
 * The sole request authority: exactly four fields, no FEN/history/seed/profile/candidate bytes.
 * Extra keys refuse rather than being discarded ([[D3028]]).
 */
export function parseBotOpponentPlyRequest(value: unknown): BotOpponentPlyRequest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new BotOpponentPlyRequestError("opponent-ply body must be a JSON object");
  const body = value as Readonly<Record<string, unknown>>;
  const extra = Object.keys(body).filter((key) => !(REQUEST_KEYS as readonly string[]).includes(key));
  if (extra.length > 0) throw new BotOpponentPlyRequestError(`opponent-ply body carries forbidden field(s): ${extra.sort().join(", ")}`);
  const { requestId, expectedNodeId, expectedBranchId, expectedEventHeadDigest } = body;
  if (typeof requestId !== "string" || !REQUEST_ID.test(requestId)) throw new BotOpponentPlyRequestError("requestId must match ^botreq_[A-Za-z0-9_-]{16,128}$");
  if (typeof expectedNodeId !== "string" || !ROOT_IDENTITY.test(expectedNodeId)) throw new BotOpponentPlyRequestError("expectedNodeId must be a bounded non-empty identity");
  if (typeof expectedBranchId !== "string" || !ROOT_IDENTITY.test(expectedBranchId)) throw new BotOpponentPlyRequestError("expectedBranchId must be a bounded non-empty identity");
  if (typeof expectedEventHeadDigest !== "string" || !CANONICAL_DIGEST.test(expectedEventHeadDigest)) {
    throw new BotOpponentPlyRequestError("expectedEventHeadDigest must be a canonical lowercase sha256 digest");
  }
  return Object.freeze({
    requestId: requestId as `botreq_${string}`,
    expectedNodeId,
    expectedBranchId,
    expectedEventHeadDigest: expectedEventHeadDigest as `sha256:${string}`,
  });
}

export const BOT_OPPONENT_PLY_RESULT_KINDS = Object.freeze([
  "committed",
  "replayed_idempotent",
  "replayed_concurrent_winner",
  "stale_root",
  "request_reused_with_different_operands",
  "concurrent_commit_conflict",
  "base_provider_unavailable",
  "provider_failed",
] as const);
export type BotOpponentPlyResultKind = (typeof BOT_OPPONENT_PLY_RESULT_KINDS)[number];

export interface BotOpponentPlyResultRow {
  readonly kind: BotOpponentPlyResultKind;
  readonly status: 200 | 409 | 502 | 503;
  readonly code: null | "OPPONENT_STALE_ROOT" | "OPPONENT_REQUEST_REUSED" | "OPPONENT_CONCURRENT_CONFLICT" | "OPPONENT_PROVIDER_UNAVAILABLE" | "OPPONENT_PROVIDER_FAILED";
  readonly retryable: boolean;
  readonly action: "continue" | "refresh_position" | "issue_new_request" | "refresh_and_retry" | "retry_or_change_opponent";
}

/** The §4.1 table, verbatim. */
export const BOT_OPPONENT_PLY_RESULTS: Readonly<Record<BotOpponentPlyResultKind, BotOpponentPlyResultRow>> = Object.freeze({
  committed: Object.freeze({ kind: "committed", status: 200, code: null, retryable: false, action: "continue" }),
  replayed_idempotent: Object.freeze({ kind: "replayed_idempotent", status: 200, code: null, retryable: false, action: "continue" }),
  replayed_concurrent_winner: Object.freeze({ kind: "replayed_concurrent_winner", status: 200, code: null, retryable: false, action: "continue" }),
  stale_root: Object.freeze({ kind: "stale_root", status: 409, code: "OPPONENT_STALE_ROOT", retryable: false, action: "refresh_position" }),
  request_reused_with_different_operands: Object.freeze({ kind: "request_reused_with_different_operands", status: 409, code: "OPPONENT_REQUEST_REUSED", retryable: false, action: "issue_new_request" }),
  concurrent_commit_conflict: Object.freeze({ kind: "concurrent_commit_conflict", status: 409, code: "OPPONENT_CONCURRENT_CONFLICT", retryable: true, action: "refresh_and_retry" }),
  base_provider_unavailable: Object.freeze({ kind: "base_provider_unavailable", status: 503, code: "OPPONENT_PROVIDER_UNAVAILABLE", retryable: true, action: "retry_or_change_opponent" }),
  provider_failed: Object.freeze({ kind: "provider_failed", status: 502, code: "OPPONENT_PROVIDER_FAILED", retryable: true, action: "retry_or_change_opponent" }),
} satisfies Record<BotOpponentPlyResultKind, BotOpponentPlyResultRow>);

/**
 * Parses a result row from the wire: `kind` selects the expected row and every other field must
 * equal it, so a tampered status/code/retry/action cannot reach the client.
 */
export function parseBotOpponentPlyResultRow(value: unknown): BotOpponentPlyResultRow {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("opponent-ply result must be an object");
  const row = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(row).sort();
  if (keys.join(",") !== "action,code,kind,retryable,status") throw new TypeError("opponent-ply result has an invalid shape");
  if (typeof row.kind !== "string" || !(BOT_OPPONENT_PLY_RESULT_KINDS as readonly string[]).includes(row.kind)) {
    throw new TypeError("opponent-ply result kind is outside the closed vocabulary");
  }
  const expected = BOT_OPPONENT_PLY_RESULTS[row.kind as BotOpponentPlyResultKind];
  if (row.status !== expected.status || row.code !== expected.code || row.retryable !== expected.retryable || row.action !== expected.action) {
    throw new TypeError(`opponent-ply result ${row.kind} does not match its closed row`);
  }
  return expected;
}
