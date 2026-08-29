import { describe, expect, it } from "vitest";

import type { LiveSessionDetail, VoteTally } from "./api.js";
import { voteAttribution } from "./live-vote.js";

const window = { id: "v", sessionId: "s", nodeId: "n", prompt: "Plan?", options: [], opensAt: "2026-08-15T12:00:00Z", closesAt: "2026-08-15T12:01:00Z", state: "open", appliedOptionUci: null } as const;
const tally = (total: number, relayed: number): VoteTally => ({ window, tally: [], total, relayed });

describe("live vote attribution", () => {
  it("states all four relay trust cases exactly", () => {
    expect(voteAttribution({})).toBe("No votes yet.");
    expect(voteAttribution({ vote: tally(1, 0) })).toBe("1 vote, all from signed-in members.");
    expect(voteAttribution({ vote: tally(5, 0) })).toBe("5 votes, all from signed-in members.");
    expect(voteAttribution({ vote: tally(5, 3), voteAdapter: { learnerId: "adapter", handle: "chatbridge" } })).toBe("3 of 5 votes relayed by @chatbridge. Tabiya cannot verify chat identities; a tally is only as trustworthy as its adapter.");
    expect(voteAttribution({ vote: tally(5, 3) })).toBe("3 of 5 votes were relayed by an adapter account that is no longer configured. Tabiya cannot verify chat identities.");
  });

  it("keeps the client mirror's relay fields required and optional in the intended directions", () => {
    const detail = { vote: tally(2, 1), voteAdapter: { learnerId: "adapter", handle: "relay" } } satisfies Pick<LiveSessionDetail, "vote" | "voteAdapter">;
    expect(detail.vote.relayed).toBeLessThanOrEqual(detail.vote.total);
  });
});
