// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

const chessground = vi.hoisted(() => ({
  configs: [] as Config[],
  state: { selected: undefined as string | undefined },
  set: vi.fn<(config: Config) => void>(),
  redrawAll: vi.fn<() => void>(),
  destroy: vi.fn<() => void>(),
}));

vi.mock("@lichess-org/chessground", () => ({
  Chessground: (_element: HTMLElement, config: Config) => {
    chessground.configs.push(config);
    return {
      state: chessground.state,
      set: chessground.set,
      redrawAll: chessground.redrawAll,
      destroy: chessground.destroy,
    } as unknown as Api;
  },
}));

import Chessboard from "./Chessboard.svelte";

afterEach(() => {
  document.body.replaceChildren();
  chessground.configs.length = 0;
  chessground.state.selected = undefined;
  chessground.set.mockClear();
  chessground.redrawAll.mockClear();
  chessground.destroy.mockClear();
  vi.unstubAllGlobals();
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
      animation: { enabled: true, duration: 250 },
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

  it.each(["pointer", "keyboard", "text"] as const)(
    "announces no authoritative commit when %s input is refused",
    async (mode) => {
      let settle: ((committed: boolean) => void) | undefined;
      const onMove = vi.fn(() => new Promise<boolean>((resolve) => { settle = resolve; }));
      const onMoveCommitted = vi.fn();
      const target = document.createElement("div");
      document.body.append(target);
      const component = mount(Chessboard, {
        target,
        props: {
          fen: "8/8/8/8/8/8/4P3/4K2k w - - 0 1",
          startSide: "white",
          onMove,
          onMoveCommitted,
        },
      });
      await tick();

      if (mode === "pointer") {
        chessground.configs.at(-1)!.movable!.events!.after!("e2", "e4", { premove: false, holdTime: 0 });
      } else if (mode === "keyboard") {
        const grid = target.querySelector<HTMLElement>("[data-board-input-grid]")!;
        for (const key of ["ArrowUp", "Enter", "ArrowUp", "ArrowUp", "Enter"]) {
          grid.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
        }
      } else {
        const details = target.querySelector<HTMLDetailsElement>("details.text-move")!;
        details.open = true;
        const input = target.querySelector<HTMLInputElement>(".text-move input")!;
        input.value = "e4";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        target.querySelector<HTMLFormElement>(".text-move form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
      }
      await tick();
      expect(onMove).toHaveBeenCalledWith("e2e4");
      expect(target.querySelector("[role=status]")?.textContent).toContain("Move staged:");
      expect(onMoveCommitted).not.toHaveBeenCalled();

      settle?.(false);
      await tick();
      await Promise.resolve();
      expect(onMoveCommitted).not.toHaveBeenCalled();
      expect(target.querySelector("[role=status]")?.textContent).toContain("not committed");
      expect(chessground.set).toHaveBeenCalled();
      await unmount(component);
    },
  );

  it("announces a commit only after the authoritative mutation succeeds", async () => {
    let settle: ((committed: boolean) => void) | undefined;
    const onMove = vi.fn(() => new Promise<boolean>((resolve) => { settle = resolve; }));
    const onMoveCommitted = vi.fn();
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Chessboard, {
      target,
      props: { fen: "8/8/8/8/8/8/4P3/4K2k w - - 0 1", startSide: "white", onMove, onMoveCommitted },
    });
    await tick();
    chessground.configs[0]!.movable!.events!.after!("e2", "e4", { premove: false, holdTime: 0 });
    await tick();
    expect(onMoveCommitted).not.toHaveBeenCalled();
    settle?.(true);
    await tick();
    await Promise.resolve();
    expect(onMoveCommitted).toHaveBeenCalledOnce();
    expect(onMoveCommitted).toHaveBeenCalledWith("Move committed: e4.");
    expect(target.querySelector("[role=status]")?.textContent).toBe("Move committed: e4.");
    await unmount(component);
  });

  it("keeps learner shapes separate from system overlays without snapping or erasing", async () => {
    const onMarksChange = vi.fn();
    const target = document.createElement("div");document.body.append(target);
    const component = mount(Chessboard,{target,props:{fen:"8/8/8/8/8/8/8/K6k w - - 0 1",startSide:"white",onMove:vi.fn(),drawingEnabled:true,marks:[{orig:"a1",dest:"h8",brush:"red"}],overlays:[{orig:"b2",brush:"blue"}],onMarksChange}});
    await tick();
    expect(chessground.configs[0]!.drawable).toMatchObject({enabled:true,defaultSnapToValidMove:false,eraseOnMovablePieceClick:false,shapes:[{orig:"a1",dest:"h8",brush:"red"}],autoShapes:[{orig:"b2",brush:"blue"}],onChange:onMarksChange});
    await unmount(component);
  });

  it("lets a contained preview override board and piece artwork without changing the global theme", async () => {
    const target = document.createElement("div"); document.body.append(target);
    const component = mount(Chessboard, { target, props: { fen: "8/8/8/8/8/8/8/K6k w - - 0 1", startSide: "white", boardTheme: "olive", pieceSet: "mono", selectedSquare: "a1", disabled: true, onMove: vi.fn() } });
    await tick();
    expect(target.querySelector(".board-shell")?.getAttribute("data-board-theme")).toBe("olive");
    expect(target.querySelector(".board-shell")?.getAttribute("data-piece-set")).toBe("mono");
    expect(chessground.configs[0]?.selected).toBe("a1");
    expect(document.documentElement.dataset.boardTheme).not.toBe("olive");
    await unmount(component);
  });

  it("refreshes cached bounds and publishes Chessground's settled selection", async () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const onSelect = vi.fn();
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Chessboard, {
      target,
      props: {
        fen: "8/8/8/8/8/8/4P3/4K2k w - - 0 1",
        startSide: "white",
        onSelect,
        onMove: vi.fn(),
      },
    });
    await tick();
    const redrawsBeforeSelection = chessground.redrawAll.mock.calls.length;

    chessground.state.selected = "e2";
    chessground.configs[0]!.events!.select!("e2");

    expect(onSelect).toHaveBeenCalledWith("e2");
    expect(chessground.redrawAll.mock.calls.length).toBeGreaterThan(redrawsBeforeSelection);

    chessground.state.selected = undefined;
    chessground.configs[0]!.events!.select!("e2");
    expect(onSelect).toHaveBeenLastCalledWith(undefined);
    await unmount(component);
  });

  it("requests square sight only when the keyboard activates an origin", async () => {
    const onSelect = vi.fn();
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Chessboard, {
      target,
      props: {
        fen: "8/8/8/8/8/8/4P3/4K2k w - - 0 1",
        startSide: "white",
        onSelect,
        onMove: vi.fn(),
      },
    });
    await tick();

    const grid = target.querySelector<HTMLElement>("[data-board-input-grid]")!;
    grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(onSelect).not.toHaveBeenCalled();
    grid.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("e2");
    await unmount(component);
  });
});
