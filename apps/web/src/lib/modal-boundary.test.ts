// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";

import { modalBoundary } from "./modal-boundary.js";

afterEach(() => document.body.replaceChildren());

function fixture(): {
  background: HTMLElement;
  dialog: HTMLElement;
  first: HTMLButtonElement;
  last: HTMLButtonElement;
} {
  const background = document.createElement("main");
  const backdrop = document.createElement("div");
  const dialog = document.createElement("section");
  const first = document.createElement("button");
  const last = document.createElement("button");
  first.textContent = "First";
  last.textContent = "Last";
  dialog.append(first, last);
  backdrop.append(dialog);
  document.body.append(background, backdrop);
  return { background, dialog, first, last };
}

function pressTab(target: HTMLElement, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
    shiftKey,
  });
  target.dispatchEvent(event);
  return event;
}

describe("modal boundary", () => {
  it("makes the background inert and owns Tab in both directions", () => {
    const { background, dialog, first, last } = fixture();
    const boundary = modalBoundary(dialog);

    expect(background.inert).toBe(true);

    last.focus();
    expect(pressTab(last).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    first.focus();
    expect(pressTab(first, true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    boundary.destroy();
    expect(background.inert).toBe(false);
  });

  it("restores pre-existing inert state and reference-counts overlapping claims", () => {
    const { background, dialog } = fixture();
    background.inert = true;
    const firstBoundary = modalBoundary(dialog);
    const secondBoundary = modalBoundary(dialog);

    firstBoundary.destroy();
    expect(background.inert).toBe(true);

    secondBoundary.destroy();
    expect(background.inert).toBe(true);
  });
});
