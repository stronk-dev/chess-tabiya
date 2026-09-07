// @vitest-environment happy-dom

import { mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import GameStoryScreen from "./GameStoryScreen.svelte";
import type { GameStory } from "./api.js";

afterEach(() => document.body.replaceChildren());

describe("game story screen", () => {
  it("uses the shared semantic board for a selected story moment", async () => {
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "white",
      source: { kind: "native" },
      outcome: { kind: "unfinished" },
      moments: [{
        nodeId: "moment-one",
        entryNodeId: "entry-one",
        ply: 1,
        san: "e4",
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        kinds: ["eval_pivot"],
        sentences: ["A recorded moment."],
        evidence: [],
        phase: "opening",
      }],
      rank: ["moment-one"],
    };
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn() },
    });

    const grid = document.querySelector<HTMLElement>(".stage [data-board-input-grid]")!;
    expect(grid).not.toBeNull();
    expect(grid.querySelectorAll("[role=gridcell]")).toHaveLength(64);
    expect([...grid.querySelectorAll<HTMLElement>("[role=gridcell]")].some((cell) => cell.id === grid.getAttribute("aria-activedescendant"))).toBe(true);
    await unmount(component);
  });

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
