// Direct dispositions for the bot-policy §4.1 opponent-ply result codes. Added with the
// longitudinal-store landing (2026-09-24) because `refusal-coverage.test.ts` found the five codes
// introduced by ae13a523 with no test disposition, which kept `make verify-content` red at main.
import { describe, expect, it } from "vitest";

import { BOT_OPPONENT_PLY_RESULTS, BOT_OPPONENT_PLY_RESULT_KINDS, parseBotOpponentPlyResultRow } from "./bot-opponent-ply.js";

describe("bot opponent-ply result table", () => {
  it("pins every refusal code to its status, retryability and client action", () => {
    expect(BOT_OPPONENT_PLY_RESULT_KINDS.map((kind) => {
      const row = BOT_OPPONENT_PLY_RESULTS[kind];
      return [row.code, row.status, row.retryable, row.action];
    })).toEqual([
      [null, 200, false, "continue"],
      [null, 200, false, "continue"],
      [null, 200, false, "continue"],
      ["OPPONENT_STALE_ROOT", 409, false, "refresh_position"],
      ["OPPONENT_REQUEST_REUSED", 409, false, "issue_new_request"],
      ["OPPONENT_CONCURRENT_CONFLICT", 409, true, "refresh_and_retry"],
      ["OPPONENT_PROVIDER_UNAVAILABLE", 503, true, "retry_or_change_opponent"],
      ["OPPONENT_PROVIDER_FAILED", 502, true, "retry_or_change_opponent"],
    ]);
  });

  it("refuses a wire row whose status, code, retryability or action disagrees with its kind", () => {
    for (const kind of BOT_OPPONENT_PLY_RESULT_KINDS) {
      const row = BOT_OPPONENT_PLY_RESULTS[kind];
      expect(parseBotOpponentPlyResultRow({ ...row })).toEqual(row);
      expect(() => parseBotOpponentPlyResultRow({ ...row, retryable: !row.retryable })).toThrow(TypeError);
    }
    expect(() => parseBotOpponentPlyResultRow({ ...BOT_OPPONENT_PLY_RESULTS.provider_failed, code: "OPPONENT_PROVIDER_UNAVAILABLE" })).toThrow(TypeError);
    expect(() => parseBotOpponentPlyResultRow({ ...BOT_OPPONENT_PLY_RESULTS.stale_root, kind: "invented" })).toThrow(/closed vocabulary/u);
    expect(() => parseBotOpponentPlyResultRow({ ...BOT_OPPONENT_PLY_RESULTS.committed, extra: true })).toThrow(/invalid shape/u);
  });
});
