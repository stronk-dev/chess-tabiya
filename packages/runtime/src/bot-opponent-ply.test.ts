import { describe, expect, it } from "vitest";

import { BOT_OPPONENT_PLY_RESULTS, BOT_OPPONENT_PLY_RESULT_KINDS, parseBotOpponentPlyResultRow } from "./bot-opponent-ply.js";
import { BOT_PROFILE_CATALOG, BotProfileError, resolveBotProfileReference } from "./bot-profile-catalog.js";

describe("bot opponent-ply result table (rfc/bot-policy.md §4.1)", () => {
  it("pins each refusal row's status, code, retryability and action", () => {
    expect(BOT_OPPONENT_PLY_RESULTS.request_reused_with_different_operands).toEqual({ kind: "request_reused_with_different_operands", status: 409, code: "OPPONENT_REQUEST_REUSED", retryable: false, action: "issue_new_request" });
    expect(BOT_OPPONENT_PLY_RESULTS.concurrent_commit_conflict).toEqual({ kind: "concurrent_commit_conflict", status: 409, code: "OPPONENT_CONCURRENT_CONFLICT", retryable: true, action: "refresh_and_retry" });
    expect(BOT_OPPONENT_PLY_RESULTS.base_provider_unavailable).toEqual({ kind: "base_provider_unavailable", status: 503, code: "OPPONENT_PROVIDER_UNAVAILABLE", retryable: true, action: "retry_or_change_opponent" });
    expect(BOT_OPPONENT_PLY_RESULTS.provider_failed).toEqual({ kind: "provider_failed", status: 502, code: "OPPONENT_PROVIDER_FAILED", retryable: true, action: "retry_or_change_opponent" });
    for (const kind of BOT_OPPONENT_PLY_RESULT_KINDS) expect(parseBotOpponentPlyResultRow({ ...BOT_OPPONENT_PLY_RESULTS[kind] })).toEqual(BOT_OPPONENT_PLY_RESULTS[kind]);
  });

  it("refuses a row whose code was swapped for another refusal", () => {
    expect(() => parseBotOpponentPlyResultRow({ ...BOT_OPPONENT_PLY_RESULTS.provider_failed, code: "OPPONENT_PROVIDER_UNAVAILABLE" })).toThrow(TypeError);
  });

  it("types an unregistered profile reference as BOT_PROFILE_INVALID", () => {
    const [entry] = BOT_PROFILE_CATALOG;
    let caught: unknown;
    try { resolveBotProfileReference({ ...entry!.reference, id: "guarded-human.1400@2" } as unknown); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(BotProfileError);
    expect((caught as BotProfileError).code).toBe("BOT_PROFILE_INVALID");
  });
});
