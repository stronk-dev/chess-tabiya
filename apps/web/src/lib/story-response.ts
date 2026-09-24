import type { CreatedStoryShare, RevokedStoryShare, StoryShare } from "./api.js";

// rfc/review-evidence-compiler.md §4: the game-story body is parsed by the runtime's exact
// `parseReviewStoryReceipt` (see `api.ts`); only the share envelopes are checked here.

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function closed(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = new Set(allowed);
  return Object.keys(value).every((key) => keys.has(key));
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function instant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function storyShare(value: unknown, runId: string): value is StoryShare {
  const item = record(value);
  return item !== undefined
    && closed(item, ["id", "scope", "runId", "branchId", "createdAt", "revokedAt"])
    && text(item.id)
    && item.scope === "story_read"
    && item.runId === runId
    && text(item.branchId)
    && instant(item.createdAt)
    && (item.revokedAt === null || (instant(item.revokedAt) && Date.parse(item.revokedAt) >= Date.parse(item.createdAt)));
}

export function assertStoryShares(value: unknown, runId: string): asserts value is readonly StoryShare[] {
  if (!Array.isArray(value) || !value.every((item) => storyShare(item, runId))) throw new TypeError("Invalid story share response");
  if (new Set(value.map((item) => item.id)).size !== value.length) throw new TypeError("Invalid story share response");
}

export function assertCreatedStoryShare(
  value: unknown,
  request: { readonly runId: string; readonly branchId: string },
): asserts value is CreatedStoryShare {
  const item = record(value);
  if (item === undefined
    || !closed(item, ["id", "token", "url", "scope", "runId", "branchId", "createdAt", "revokedAt"])
    || !text(item.id)
    || !text(item.token)
    || item.url !== `/shared/${item.token}`
    || item.scope !== "story_read"
    || item.runId !== request.runId
    || item.branchId !== request.branchId
    || !instant(item.createdAt)
    || item.revokedAt !== null) throw new TypeError("Invalid created story share response");
}

export function assertRevokedStoryShare(
  value: unknown,
  request: { readonly runId: string; readonly tokenId: string },
): asserts value is RevokedStoryShare {
  const item = record(value);
  if (item === undefined
    || !closed(item, ["revoked", "runId", "tokenId", "revokedAt"])
    || item.revoked !== true
    || item.runId !== request.runId
    || item.tokenId !== request.tokenId
    || !instant(item.revokedAt)) throw new TypeError("Invalid revoked story share response");
}
