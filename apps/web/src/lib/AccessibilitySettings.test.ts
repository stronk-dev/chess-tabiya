// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import AccessibilitySettings from "./AccessibilitySettings.svelte";
import { THEME_STORAGE_KEY } from "./theme/preference.js";

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe("Accessibility settings family (A11-b5)", () => {
  it("switches to the high-contrast board and back to the learner's previous board", async () => {
    const values = new Map<string, string>([[THEME_STORAGE_KEY, JSON.stringify({ appTheme: "paper", boardTheme: "olive", pieceSet: "cburnett", modeOverride: null, animation: "normal" })]]);
    vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
    const component = mount(AccessibilitySettings, { target: document.body.appendChild(document.createElement("div")) });
    await tick();

    expect(document.getElementById("accessibility-settings-title")?.textContent).toBe("Accessibility");
    const toggle = document.querySelector<HTMLInputElement>('#accessibility-settings input[type="checkbox"]')!;
    expect(toggle.checked).toBe(false);
    expect(document.getElementById(toggle.getAttribute("aria-describedby")!)?.textContent).toContain("at least 3:1");
    const stored = () => JSON.parse(values.get(THEME_STORAGE_KEY)!).boardTheme as string;

    toggle.click();
    await tick();
    expect(stored()).toBe("contrast");
    expect(toggle.checked).toBe(true);

    toggle.click();
    await tick();
    expect(stored()).toBe("olive");
    expect(toggle.checked).toBe(false);
    expect(document.querySelector('[data-device-preference="reduced-motion"]')?.textContent).toContain("Reduced motion: off");
    await unmount(component);
  });
});
