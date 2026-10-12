// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Fixture from "./deferred-screen.test-support.svelte";

function pending() {
  let resolve!: (value: { title: string }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ title: string }>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

afterEach(() => { document.body.replaceChildren(); });

describe("route-local component delivery", () => {
  it("keeps navigation outside the loading boundary and renders only after delivery", async () => {
    const target = document.createElement("div");
    document.body.innerHTML = '<a href="/play">Play</a>';
    document.body.append(target);
    const request = pending();
    const load = vi.fn(() => request.promise);
    const component = mount(Fixture, { target, props: { load } });
    try {
      await tick();
      expect(load).toHaveBeenCalledTimes(1);
      expect(target.querySelector('[aria-busy="true"] [role="status"]')?.textContent).toBe("Loading Library…");
      expect(document.querySelector("a")?.textContent).toBe("Play");
      expect(target.querySelector("h1")).toBeNull();
      request.resolve({ title: "Your library" });
      await tick();
      expect(target.querySelector("h1")?.textContent).toBe("Your library");
      expect(target.querySelector('[aria-busy="true"]')).toBeNull();
    } finally { await unmount(component); }
  });

  it("shows fixed error copy and reloads only when explicitly asked, without retrying the module", async () => {
    const target = document.createElement("div"); document.body.append(target);
    const first = pending();
    const load = vi.fn(() => first.promise), reload = vi.fn();
    const component = mount(Fixture, { target, props: { load, reload } });
    try {
      await tick();
      first.reject(new Error("private provider diagnostics / secret path"));
      await tick();
      expect(target.querySelector('[role="alert"]')?.textContent).toBe("Library could not load. Reload this page to try again. Your saved work is unchanged.");
      expect(target.textContent).not.toContain("secret");
      expect(load).toHaveBeenCalledTimes(1);
      expect(reload).not.toHaveBeenCalled();
      target.querySelector("button")!.click();
      await tick();
      expect(reload).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledTimes(1);
    } finally { await unmount(component); }
  });

  it("retains the mounted screen and its local draft when surrounding props change", async () => {
    const target = document.createElement("div"); document.body.append(target);
    const request = pending(), ready = vi.fn();
    const load = vi.fn(() => request.promise);
    const component = mount(Fixture, { target, props: { load, onReady: ready } });
    try {
      await tick();
      expect(ready).not.toHaveBeenCalled();
      request.resolve({ title: "Your library" });
      await tick();
      expect(ready).toHaveBeenCalledTimes(1);
      const input = target.querySelector("input")!;
      input.value = "unsaved local text";
      component.rename("Renamed library");
      await tick();
      expect(load).toHaveBeenCalledTimes(1);
      expect(ready).toHaveBeenCalledTimes(1);
      expect(target.querySelector("input")).toBe(input);
      expect(input.value).toBe("unsaved local text");
    } finally { await unmount(component); }
  });

  it.each(["resolve", "reject"] as const)("does not revive a departed screen after late %s", async (finish) => {
    const target = document.createElement("div"); document.body.append(target);
    const request = pending();
    const component = mount(Fixture, { target, props: { load: () => request.promise } });
    await tick();
    await unmount(component);
    if (finish === "resolve") request.resolve({ title: "Departed library" });
    else request.reject(new Error("late failed chunk"));
    await tick();
    expect(target.textContent).toBe("");
  });

  it("does not add eager imports of the seven deferred screens to the app shell", () => {
    const source = readFileSync("apps/web/src/App.svelte", "utf8");
    for (const name of ["DrillScreen", "ReviewMapScreen", "CampaignScreen", "RatingScreen", "ProfileScreen", "TheoryEntryScreen", "LibraryScreen"]) {
      expect(source).not.toMatch(new RegExp(`import\\s+${name}\\s+from`));
      expect(source).toContain(`import("./lib/${name}.svelte")`);
    }
  });
});
