import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LIVE_WALL_ORDER_SENTENCE, orderLiveWall, type LiveWallClockFacts } from "./live-wall.js";

const card = (id: string, lastMoveAt: string | null, extra: { createdAt?: string; pausedAt?: string | null; closedAt?: string } = {}): LiveWallClockFacts & { readonly evaluation: number } => ({
  id, title: `Board ${id}`, createdAt: extra.createdAt ?? "2026-09-24T09:00:00Z", ...(extra.closedAt === undefined ? {} : { closedAt: extra.closedAt }),
  board: { lastMoveAt, pausedAt: extra.pausedAt ?? null },
  evaluation: 0,
});

describe("simul wall order (TCH-a6)", () => {
  it("orders live boards by elapsed time since the last move, longest wait first; paused then closed follow", () => {
    const ordered = orderLiveWall([
      card("recent", "2026-09-24T10:05:00Z"),
      card("closed", "2026-09-24T08:00:00Z", { closedAt: "2026-09-24T09:30:00Z" }),
      card("stalled", "2026-09-24T10:00:00Z"),
      card("paused", "2026-09-24T09:10:00Z", { pausedAt: "2026-09-24T09:20:00Z" }),
      card("untouched", null, { createdAt: "2026-09-24T09:45:00Z" }),
    ]);
    expect(ordered.map((item) => item.id)).toEqual(["untouched", "stalled", "recent", "paused", "closed"]);
  });

  it("never orders by evaluation: changing any non-clock field leaves the order unchanged", () => {
    const boards = [card("a", "2026-09-24T10:00:00Z"), card("b", "2026-09-24T10:01:00Z"), card("c", "2026-09-24T10:02:00Z")];
    const baseline = orderLiveWall(boards).map((item) => item.id);
    const rescored = boards.map((item, index) => ({ ...item, evaluation: [900, -900, 0][index]! }));
    expect(orderLiveWall(rescored).map((item) => item.id)).toEqual(baseline);
    const source = readFileSync(join(process.cwd(), "apps/web/src/lib/live-wall.ts"), "utf8").replace(/\/\/.*$/gmu, "").replace(/"[^"]*"/gu, "");
    expect(source).not.toMatch(/evaluation|\beval\b|score|accuracy|centipawn|objectiveState/iu);
    expect(LIVE_WALL_ORDER_SENTENCE).toContain("never ordered or labelled by engine evaluation");
  });
});
