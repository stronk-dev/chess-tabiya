// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import Timeline from "./Timeline.svelte";
import type { TimelineEntry } from "./screen-model.js";

const entries: readonly TimelineEntry[] = Object.freeze([
  Object.freeze({ nodeId: "move-1", ply: 1, moveSan: "Nf3", moveUci: "g1f3", actor: "user" as const, checkpointIds: Object.freeze([]), guardGenerated: false }),
  Object.freeze({ nodeId: "checkpoint-1", ply: 2, moveSan: "d5", moveUci: "d7d5", actor: "system" as const, checkpointIds: Object.freeze(["reply-seen"]), guardGenerated: false }),
]);

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

afterEach(() => document.body.replaceChildren());

describe("timeline rewind timing", () => {
  it("announces the detected moment instead of a generic pivotal marker", async () => {
    const component = mount(Timeline, { target: target(), props: {
      entries,
      activeNodeId: "checkpoint-1",
      onPreview: vi.fn(),
      onConfirm: vi.fn(),
      rewindPolicy: "free",
      pivotalMarkers: Object.freeze([
        Object.freeze({ nodeId: "move-1", label: "Irreversible change" }),
        Object.freeze({ nodeId: "move-1", label: "Phase transition" }),
      ]),
    } });
    await tick();

    expect(document.querySelector('[aria-label="Open Irreversible change and Phase transition at rehearsal step 1"]')).not.toBeNull();
    expect(document.querySelector('[aria-label*="Open pivotal marker"]')).toBeNull();
    await unmount(component);
  });

  it("keeps arbitrary history inspectable without presenting it as an undo point", async () => {
    const onConfirm = vi.fn();
    const component = mount(Timeline, { target: target(), props: {
      entries,
      activeNodeId: "checkpoint-1",
      previewNodeId: "move-1",
      onPreview: vi.fn(),
      onConfirm,
      rewindPolicy: "free",
      rewindableNodeIds: new Set(["checkpoint-1"]),
    } });
    await tick();

    expect(document.body.textContent).toContain("Preview only. Rewind is offered when a consequence closes.");
    expect(document.querySelector('[aria-label="Rewind to preview"]')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("offers a preserved branch only at a recorded consequence boundary", async () => {
    const onConfirm = vi.fn();
    const component = mount(Timeline, { target: target(), props: {
      entries,
      activeNodeId: "checkpoint-1",
      previewNodeId: "checkpoint-1",
      onPreview: vi.fn(),
      onConfirm,
      rewindPolicy: "free",
      rewindableNodeIds: new Set(["checkpoint-1"]),
    } });
    await tick();

    expect(document.body.textContent).toContain("Rewinding here costs nothing. Your attempt is kept. Going back makes a second one.");
    const button = document.querySelector<HTMLButtonElement>('[aria-label="Rewind to preview"]')!;
    expect(button).not.toBeNull();
    button.click();
    expect(onConfirm).toHaveBeenCalledWith("checkpoint-1");
    await unmount(component);

    const earned = mount(Timeline, { target: target(), props: {
      entries,
      activeNodeId: "checkpoint-1",
      previewNodeId: "checkpoint-1",
      onPreview: vi.fn(),
      onConfirm: vi.fn(),
      rewindPolicy: "earned",
      rewindableNodeIds: new Set(["checkpoint-1"]),
    } });
    await tick();
    expect(document.body.textContent).toContain("This uses one earned rewind. Your attempt is kept.");
    expect(document.body.textContent).not.toContain("Rewinding here costs nothing");
    await unmount(earned);
  });
});
