// @vitest-environment happy-dom

import { mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import GameStoryScreen from "./GameStoryScreen.svelte";
import type { GameStory } from "./api.js";

afterEach(() => document.body.replaceChildren());

describe("game story screen", () => {
  it("frames a recorded result from the learner's side instead of printing wire values", async () => {
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "black",
      source: {
        kind: "pgn_paste",
        headers: { White: "Ada", Black: "Mina" },
        result: "1-0",
        importedAt: "2026-09-07T12:00:00.000Z",
      },
      outcome: { kind: "recorded_result", result: "1-0" },
      moments: [],
      rank: [],
    };
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn() },
    });

    const header = document.querySelector(".story > header")!;
    expect(header.textContent).toContain("Ada – Mina");
    expect(header.textContent).toContain("You lost · recorded PGN result");
    expect(header.textContent).not.toContain("1-0");
    expect(header.textContent).not.toContain("recorded_result");
    expect(header.textContent).not.toContain("recorded result");
    await unmount(component);
  });
});
