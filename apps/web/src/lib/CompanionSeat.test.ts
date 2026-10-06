// @vitest-environment happy-dom
// Layout-only controls: no packet, classifier, provider or chess fact is minted by this frame.
import { createRawSnippet, mount, tick, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { afterEach, expect, it, vi } from "vitest";

import CompanionSeat from "./CompanionSeat.svelte";
import { PLAY_SEAT_MODULES, toggleExpanded } from "./module-seats.js";

const mounted: ReturnType<typeof mount>[] = [];
const body = () => createRawSnippet(() => ({ render: () => '<div><label>Layout draft<input aria-label="Layout draft" value="initial"></label></div>' }));
afterEach(async () => {
  for (const component of mounted.splice(0)) await unmount(component);
  document.body.replaceChildren();
});

it("the tools selector shares expansion without becoming an evidence module", () => {
  expect(toggleExpanded("guided_hint", "support_tools")).toBe("support_tools");
  expect(toggleExpanded("support_tools", "theory_breadcrumb")).toBe("theory_breadcrumb");
  expect(PLAY_SEAT_MODULES).not.toContain("support_tools");
});

it.each([undefined, null, 0, 2])("the collapsed selector renders only its supplied count %s and never creates a head", async badge => {
  const toggle = vi.fn();
  mounted.push(mount(CompanionSeat, { target: document.body, props: {
    id: "theory_breadcrumb", module: "theory_breadcrumb", label: "Theory pointer", shortLabel: "Theory",
    band: true, open: false, state: "door", badge, onToggle: toggle, children: body(),
  } }));
  await tick();
  const selector = document.querySelector<HTMLButtonElement>(".queue-selector")!;
  expect(selector.getAttribute("aria-label")).toBe("Theory pointer");
  expect(selector.getAttribute("aria-expanded")).toBe("false");
  expect(selector.textContent).toContain("Theory");
  expect(document.querySelector("[data-queue-head]")).toBeNull();
  expect(document.querySelector<HTMLDivElement>(".seat-card")!.hidden).toBe(true);
  expect(document.querySelector(".seat-badge")?.textContent).toBe(badge == null ? undefined : String(badge));
  selector.click();
  expect(toggle).toHaveBeenCalledTimes(1);
});

it("a disabled door stays native and does not toggle", async () => {
  const toggle = vi.fn();
  mounted.push(mount(CompanionSeat, { target: document.body, props: {
    id: "guided_hint", module: "guided_hint", label: "Hint", band: true, open: false,
    disabled: true, onToggle: toggle, children: body(),
  } }));
  await tick();
  const button = document.querySelector<HTMLButtonElement>(".queue-selector")!;
  button.click();
  expect(button.disabled).toBe(true);
  expect(toggle).not.toHaveBeenCalled();
});

it("responsive and collapse transitions retain the same mounted control state", async () => {
  const flags = new SvelteMap([ ["band", false], ["open", true] ]);
  mounted.push(mount(CompanionSeat, { target: document.body, props: {
    id: "guided_hint", module: "guided_hint", label: "Hint", shortLabel: "Hint", badge: 1,
    get band() { return flags.get("band")!; }, get open() { return flags.get("open")!; },
    onToggle: () => undefined, children: body(),
  } }));
  await tick();
  const draft = document.querySelector<HTMLInputElement>("input")!;
  draft.value = "kept";
  flags.set("band", true);
  await tick();
  expect(document.querySelector("[data-queue-head]")?.getAttribute("data-queue-head")).toBe("guided_hint");
  flags.set("open", false);
  await tick();
  expect(document.querySelector("[data-queue-head]")).toBeNull();
  flags.set("band", false);
  flags.set("open", true);
  await tick();
  expect(document.querySelector("input")).toBe(draft);
  expect(draft.value).toBe("kept");
});

it("a held cue owns a head without adding a second selector or fact", async () => {
  mounted.push(mount(CompanionSeat, { target: document.body, props: {
    id: "blunder_prevention", module: "blunder_prevention", label: "Before you play",
    band: true, headSlot: true, state: "warning", children: body(),
  } }));
  await tick();
  expect(document.querySelectorAll("[data-queue-head]")).toHaveLength(1);
  expect(document.querySelector("[data-seat-state]")?.getAttribute("data-seat-state")).toBe("warning");
  expect(document.querySelector(".queue-selector")).toBeNull();
  expect(document.querySelector(".seat-badge")).toBeNull();
});

it("existing support tools stay mounted outside the band without a fictitious module", async () => {
  const flags = new SvelteMap([ ["band", false] ]);
  mounted.push(mount(CompanionSeat, { target: document.body, props: {
    id: "support_tools", label: "Support tools", shortLabel: "More", tools: true, open: false,
    get band() { return flags.get("band")!; }, onToggle: () => undefined, children: body(),
  } }));
  await tick();
  const draft = document.querySelector<HTMLInputElement>("input")!;
  draft.value = "kept";
  expect(document.querySelector<HTMLDivElement>(".tools-card")!.hidden).toBe(false);
  expect(document.querySelector("[data-module]")).toBeNull();
  expect(document.querySelector(".companion-tools")?.getAttribute("role")).toBe("group");
  flags.set("band", true);
  await tick();
  expect(document.querySelector<HTMLDivElement>(".tools-card")!.hidden).toBe(true);
  expect(document.querySelector(".queue-selector .seat-label")?.textContent).toBe("More");
  expect(document.querySelector("input")).toBe(draft);
  expect(draft.value).toBe("kept");
});
