// @vitest-environment happy-dom

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShellKeyboardDispatcher } from "./keyboard.js";
import StreamerModeSettings from "./StreamerModeSettings.svelte";
import { STREAMER_MODE_KEY, STREAMER_MODE_LIMIT, loadStreamerMode, saveStreamerMode, streamerModeActive, toggledStreamerMode } from "./streamer-mode.js";

const lib = join(process.cwd(), "apps/web/src/lib");
const read = (file: string) => readFileSync(join(lib, file), "utf8");

afterEach(() => document.body.replaceChildren());

describe("streamer mode (LIV-a14)", () => {
  it("persists three states, defaults to off, and applies in-run mode only on the run route", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(loadStreamerMode(storage)).toBe("off");
    expect(saveStreamerMode("in_run", storage)).toBe(true);
    expect(values.get(STREAMER_MODE_KEY)).toBe("in_run");
    expect(loadStreamerMode(storage)).toBe("in_run");
    values.set(STREAMER_MODE_KEY, "zen");
    expect(loadStreamerMode(storage)).toBe("off");
    expect(loadStreamerMode({ getItem: () => { throw new Error("blocked"); }, setItem: () => {} })).toBe("off");
    expect(streamerModeActive("in_run", "run")).toBe(true);
    expect(streamerModeActive("in_run", "home")).toBe(false);
    expect(streamerModeActive("always", "settings")).toBe(true);
    expect(streamerModeActive("off", "run")).toBe(false);
  });

  it("Z flips what this screen shows now", () => {
    expect(toggledStreamerMode("off", "in_run", "run")).toBe("in_run");
    expect(toggledStreamerMode("off", "in_run", "home")).toBe("always");
    expect(toggledStreamerMode("in_run", "in_run", "run")).toBe("off");
    expect(toggledStreamerMode("in_run", "in_run", "home")).toBe("always");
    expect(toggledStreamerMode("always", "always", "home")).toBe("off");
  });

  it("is bound to Z in the shell registry and never fires inside text entry", () => {
    const toggleStreamerMode = vi.fn();
    const dispatcher = new ShellKeyboardDispatcher({ navigate: vi.fn(), focusPrimaryNavigation: vi.fn(), openHelp: vi.fn(), closeHelp: vi.fn(), helpIsOpen: () => false, toggleStreamerMode });
    dispatcher.handle(new KeyboardEvent("keydown", { key: "z" }));
    expect(toggleStreamerMode).toHaveBeenCalledTimes(1);
    const input = document.body.appendChild(document.createElement("input"));
    const typed = new KeyboardEvent("keydown", { key: "z" });
    Object.defineProperty(typed, "target", { value: input });
    dispatcher.handle(typed);
    dispatcher.handle(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(toggleStreamerMode).toHaveBeenCalledTimes(1);
    dispatcher.destroy();
  });

  it("is fenced from assistance in both directions: it hides, never unlocks or withholds", () => {
    expect(read("streamer-mode.ts")).not.toMatch(/from\s+["'][^"']*(?:assistance|preset|@chess-tabiya\/runtime)[^"']*["']/u);
    for (const file of readdirSync(lib).filter((name) => /assistance|preset/u.test(name) && !name.includes(".test."))) {
      expect(read(file), file).not.toMatch(/streamer-mode/u);
    }
    const css = read("streamer-mode.css");
    const declarations = [...css.matchAll(/\{([^}]*)\}/gu)].map((match) => match[1]!.trim());
    expect(declarations).toEqual(["display: none !important;", "display: grid;"]);
    expect(STREAMER_MODE_LIMIT).toContain("does not change what your viewers see");
    expect(STREAMER_MODE_LIMIT).toContain("does not withhold anything from your run");
  });

  it("targets regions that exist, so a renamed seat cannot fall silently out of the mode", () => {
    const sources: Record<string, string> = { AssistanceSettings: read("AssistanceSettings.svelte"), ShellFrame: read("ShellFrame.svelte"), RatingScreen: read("RatingScreen.svelte"), DrillScreen: read("DrillScreen.svelte"), Timeline: read("Timeline.svelte") };
    const expected: readonly (readonly [string, string])[] = [
      ["ShellFrame", 'id="primary-navigation"'], ["ShellFrame", 'class="identity-control"'], ["ShellFrame", 'class="run-context'], ["AssistanceSettings", 'class="account-handle"'],
      ["RatingScreen", 'class="rating-card"'],
      ["DrillScreen", 'class="assistance-control"'], ["DrillScreen", 'class="inspector-entry"'], ["DrillScreen", 'class="ambient"'],
      ["DrillScreen", 'id="run-support-region"'], ["DrillScreen", "branch-seat"], ["DrillScreen", 'class="companion-scroll"'],
      ["Timeline", 'class="shape-marker"'], ["Timeline", 'class="pivotal-marker"'],
    ];
    for (const [file, marker] of expected) expect(sources[file], `${file} ${marker}`).toContain(marker);
    const tabs = /<nav class="compact-tabs"[\s\S]*?<\/nav>/u.exec(sources.DrillScreen!)?.[0] ?? "";
    expect(tabs.slice(0, tabs.indexOf("</button>")).endsWith(">Support")).toBe(true);
  });

  it("offers the three states with the limit sentence beside them", async () => {
    const onChange = vi.fn();
    const component = mount(StreamerModeSettings, { target: document.body.appendChild(document.createElement("div")), props: { mode: "off", onChange } });
    await tick();
    const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="streamer-mode"]')];
    expect(radios.map((radio) => radio.value)).toEqual(["off", "always", "in_run"]);
    expect(radios[0]!.checked).toBe(true);
    expect(document.getElementById(radios[0]!.getAttribute("aria-describedby")!)?.textContent).toContain(STREAMER_MODE_LIMIT);
    radios[2]!.click();
    expect(onChange).toHaveBeenCalledWith("in_run");
    expect(document.body.textContent).toContain("not the Stream a rehearsal session");
    await unmount(component);
  });
});
