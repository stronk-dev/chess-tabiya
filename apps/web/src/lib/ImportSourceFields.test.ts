// @vitest-environment happy-dom
import { mount, tick, unmount } from "svelte";
import { SvelteMap } from "svelte/reactivity";
import { afterEach, expect, it, vi } from "vitest";

import ImportSourceFields from "./ImportSourceFields.svelte";
import CreateSeedChooser from "./CreateSeedChooser.svelte";

const mounted: ReturnType<typeof mount>[] = [];
afterEach(async () => {
  for (const component of mounted.splice(0)) await unmount(component);
  document.body.replaceChildren();
});

function description(control: Element): string {
  return control.getAttribute("aria-describedby")!.split(" ").map(id => {
    const target = document.getElementById(id);
    expect(target, `description ${id} exists`).not.toBeNull();
    return target!.textContent;
  }).join(" ");
}

it.each(["game", "repertoire", "arena"] as const)("D3748 binds the %s fields to their own input contract", async kind => {
  mounted.push(mount(ImportSourceFields, { target: document.body, props: { kind, pgn: "" } }));
  await tick();
  const pgn = document.querySelector<HTMLTextAreaElement>("textarea")!;
  expect(document.querySelectorAll("form,button")).toHaveLength(0);
  expect(pgn.labels?.[0]?.textContent).toContain(kind === "repertoire" ? "Repertoire PGN" : "PGN");
  expect(description(pgn)).toContain(kind === "game" ? "without analysis variations" : kind === "repertoire" ? "variations are kept" : "this run's exact position");
  const url = document.querySelector<HTMLInputElement>("input");
  if (kind === "arena") {
    expect(url).toBeNull();
    expect(description(pgn)).toContain("SetUp and FEN");
    expect(description(pgn)).toContain("URLs are not accepted");
  } else {
    expect(url!.labels?.[0]?.textContent).toContain(kind === "game" ? "Lichess game URL" : "Public Lichess study URL");
    expect(description(url!)).toBe(description(pgn));
  }
});

it.each(["game", "repertoire"] as const)("D3748 explains %s URL precedence without changing either input", async kind => {
  const state = new SvelteMap<string, string>([["pgn", "1. e4 *"], ["url", " "]]);
  mounted.push(mount(ImportSourceFields, { target: document.body, props: {
    kind,
    get pgn() { return state.get("pgn")!; }, set pgn(value) { state.set("pgn", value); },
    get url() { return state.get("url")!; }, set url(value) { state.set("url", value); },
  } }));
  await tick();
  expect(document.querySelector('[role="status"]')).toBeNull();
  const url = document.querySelector<HTMLInputElement>("input")!;
  const pgn = document.querySelector<HTMLTextAreaElement>("textarea")!;
  url.value = "https://lichess.org/abcdefgh";
  url.dispatchEvent(new Event("input", { bubbles: true })); await tick();
  expect(state.get("url")).toBe(url.value);
  expect(state.get("pgn")).toBe("1. e4 *");
  expect(description(pgn)).toContain(`The Lichess ${kind === "game" ? "game" : "study"} URL will be used`);
  expect(description(url)).toContain("Clear it to use your pasted PGN");
  url.value = ""; url.dispatchEvent(new Event("input", { bubbles: true })); await tick();
  expect(document.querySelector('[role="status"]')).toBeNull();
  expect(description(pgn)).not.toContain("will be used");
  expect(pgn.value).toBe("1. e4 *");
});

it("D3748 isolates multiple instances and retains fields through busy state", async () => {
  const flags = new SvelteMap([["busy", false]]);
  document.body.insertAdjacentHTML("beforeend", '<p id="import-busy">Importing the retained source…</p>');
  for (const kind of ["game", "repertoire", "arena"] as const) {
    mounted.push(mount(ImportSourceFields, { target: document.body, props: {
      kind, pgn: "1. e4 *", url: kind === "game" ? "https://lichess.org/abcdefgh" : "",
      get disabled() { return flags.get("busy")!; }, describedBy: "import-busy",
    } }));
  }
  await tick();
  const controls = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input,textarea")];
  const originals = controls.map(control => control.value);
  const helpIds = [...document.querySelectorAll("[data-import-source]")].map(section => section.querySelector("p")!.id);
  expect(new Set(helpIds).size).toBe(3);
  flags.set("busy", true); await tick();
  for (const control of controls) {
    expect(control.disabled).toBe(true);
    expect(description(control)).toContain("Importing the retained source");
  }
  flags.set("busy", false); await tick();
  expect(controls.map(control => control.value)).toEqual(originals);
  expect(controls.every(control => !control.disabled)).toBe(true);
});

it("D3748 saved-source preparation replaces URL precedence without clearing or resubmitting inputs", async () => {
  const flags = new SvelteMap([["saved", false]]);
  mounted.push(mount(ImportSourceFields, { target: document.body, props: {
    kind: "game", pgn: "1. e4 *", url: "https://lichess.org/abcdefgh",
    get savedSource() { return flags.get("saved")!; },
  } }));
  await tick();
  const pgn = document.querySelector<HTMLTextAreaElement>("textarea")!;
  expect(description(pgn)).toContain("URL will be used");
  flags.set("saved", true); await tick();
  expect(description(pgn)).toContain("without importing it again");
  expect(description(pgn)).not.toContain("URL will be used");
  expect(pgn.value).toBe("1. e4 *");
  expect(document.querySelector<HTMLInputElement>("input")!.value).toBe("https://lichess.org/abcdefgh");
  expect(document.querySelectorAll("form,button")).toHaveLength(0);
});

it("D3748 authoring submits the existing retained source once and does not replace its form", async () => {
  const onGame = vi.fn();
  mounted.push(mount(CreateSeedChooser, { target: document.body, props: {
    packs: [], runs: [], onPosition: vi.fn(), onGame, onRun: vi.fn(), onPack: vi.fn(), onClearError: vi.fn(),
  } }));
  await tick();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent!.includes("Finished game"))!.click(); await tick();
  const title = document.querySelector<HTMLInputElement>('input[maxlength="120"]')!;
  title.value = "Club game"; title.dispatchEvent(new Event("input", { bubbles: true }));
  const pgn = document.querySelector<HTMLTextAreaElement>("textarea")!;
  pgn.value = "1. d4 *"; pgn.dispatchEvent(new Event("input", { bubbles: true }));
  const url = document.querySelector<HTMLInputElement>('input[type="url"]')!;
  url.value = "https://lichess.org/abcdefgh"; url.dispatchEvent(new Event("input", { bubbles: true })); await tick();
  expect(description(pgn)).toContain("game URL will be used");
  const forms = document.querySelectorAll("form"); expect(forms).toHaveLength(1);
  forms[0]!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(onGame).toHaveBeenCalledExactlyOnceWith({ title: "Club game", side: "white", pgn: "1. d4 *", url: "https://lichess.org/abcdefgh" });
});
