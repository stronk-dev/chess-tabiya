// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import { ShellKeyboardDispatcher } from "./keyboard.js";

afterEach(() => document.body.replaceChildren());

function targetedKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  Object.defineProperty(event, "target", { value: target });
  return event;
}

describe("shell keyboard ownership", () => {
  it("never arms a navigation chord inside the board grid", () => {
    const navigate = vi.fn();
    const dispatcher = new ShellKeyboardDispatcher({
      navigate,
      focusPrimaryNavigation: vi.fn(),
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      helpIsOpen: () => false,
    });
    const region = document.createElement("main");
    const board = document.createElement("div");
    board.dataset.boardInputGrid = "";
    region.append(board);
    document.body.append(region);
    dispatcher.registerRegion(region, () => false);

    dispatcher.handle(targetedKey(board, "g"));
    dispatcher.handle(targetedKey(board, "h"));
    expect(navigate).not.toHaveBeenCalled();

    dispatcher.handle(targetedKey(region, "g"));
    dispatcher.handle(targetedKey(region, "h"));
    expect(navigate).toHaveBeenCalledWith("/");
    dispatcher.destroy();
  });
});
