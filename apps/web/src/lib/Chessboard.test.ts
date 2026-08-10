// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

const chessground = vi.hoisted(() => ({
  configs: [] as Config[],
  set: vi.fn<(config: Config) => void>(),
  destroy: vi.fn<() => void>(),
}));

vi.mock("@lichess-org/chessground", () => ({
  Chessground: (_element: HTMLElement, config: Config) => {
    chessground.configs.push(config);
    return {
      set: chessground.set,
      destroy: chessground.destroy,
    } as unknown as Api;
  },
}));

import Chessboard from "./Chessboard.svelte";

afterEach(() => {
  document.body.replaceChildren();
  chessground.configs.length = 0;
  chessground.set.mockClear();
  chessground.destroy.mockClear();
});

describe("Chessboard", () => {
  it("configures chessground from the pack side with legal/check/last-move highlights", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Chessboard, {
      target,
      props: {
        fen: "4k3/8/8/8/8/8/8/4R1K1 b - - 0 1",
        startSide: "black",
        lastMove: "e1e8",
        onMove: vi.fn(),
      },
    });
    await tick();

    const config = chessground.configs[0]!;
    expect(config).toMatchObject({
      orientation: "black",
      turnColor: "black",
      check: true,
      lastMove: ["e1", "e8"],
      highlight: { lastMove: true, check: true },
      movable: { color: "black", free: false, showDests: true },
    });
    expect(config.movable?.dests?.size).toBeGreaterThan(0);
    await unmount(component);
    expect(chessground.destroy).toHaveBeenCalledOnce();
  });

  it("requires an explicit promotion choice before emitting UCI", async () => {
    const onMove = vi.fn<(uci: string) => void>();
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Chessboard, {
      target,
      props: {
        fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
        startSide: "white",
        onMove,
      },
    });
    await tick();

    chessground.configs[0]!.movable!.events!.after!("a7", "a8", {
      premove: false,
      holdTime: 0,
    });
    await tick();
    expect(onMove).not.toHaveBeenCalled();
    expect(target.querySelector('[role="dialog"]')).not.toBeNull();

    const queen = [...target.querySelectorAll("button")].find(
      (button) => button.textContent === "queen",
    );
    queen?.click();
    await tick();
    expect(onMove).toHaveBeenCalledWith("a7a8q");
    await unmount(component);
  });
});
