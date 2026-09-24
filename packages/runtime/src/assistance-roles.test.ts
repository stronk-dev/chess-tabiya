import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { accessPermission } from "./assistance.js";

// LIV-a20: docs/live-sessions.md once said player and spectator receive "the same projection".
// They share one run projection, but a live spectator's assistance is strictly narrower. The doc
// sentence and the permission function are pinned together so neither can drift back alone.
describe("live spectator assistance is narrower than the player's", () => {
  const open = { deliveryOpen: true, seatedInContest: false, reviewing: false } as const;

  it("withholds human split and corpus and caps lighting and arrows at sight for a spectator", () => {
    const solo = accessPermission({ ...open, role: "solo" });
    const spectator = accessPermission({ ...open, role: "spectator" });
    expect(solo).toMatchObject({ humanSplit: "free", corpus: "free", boardLighting: "evidence", arrows: "evidence" });
    expect(spectator).toMatchObject({ humanSplit: "locked_off", corpus: "locked_off", boardLighting: "sight", arrows: "sight" });
  });

  it("documents the difference instead of claiming one shared projection covers assistance", () => {
    const docs = readFileSync(join(process.cwd(), "docs/live-sessions.md"), "utf8").replace(/\s+/gu, " ");
    expect(docs).toContain("but **not the same assistance**");
    expect(docs).toContain("no human-model split, no corpus counts, and board lighting and arrows capped at `sight`");
  });
});
