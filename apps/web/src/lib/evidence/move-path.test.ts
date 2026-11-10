// @vitest-environment happy-dom
// Original source/strict receipt + real Svelte/board-input/modal code. Not native viewport proof.
import { afterEach, describe, expect, it, vi } from "vitest";
import { tick } from "svelte";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { parsePresentationReceipt } from "@chess-tabiya/runtime";
import { createComponentTestScope } from "../component-test-lifecycle.js";
import { movePathFixture } from "./move-path.test-support.js";
import PresentedEvidence from "./PresentedEvidence.svelte";

const boards = vi.hoisted(() => ({ configs: [] as Config[], set: vi.fn<(config: Config) => void>(), destroy: vi.fn() }));
vi.mock("@lichess-org/chessground", () => ({ Chessground: (_element: HTMLElement, config: Config) => {
  boards.configs.push(config);
  return { state: { dom: { bounds: { clear() {} } } }, set: boards.set, destroy: boards.destroy } as unknown as Api;
} }));
const scope = createComponentTestScope();
afterEach(async () => { await scope.cleanup(); document.body.replaceChildren(); boards.configs.length = 0; vi.clearAllMocks(); });

function mounted(one = false, black = false) {
  const f = movePathFixture(one, black), root = document.createElement("div"); document.body.append(root);
  const view = scope.createClassComponent({ component: PresentedEvidence, target: root, props: { items: [f.owner] } });
  return { ...f, root, view };
}
const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(value => value.textContent === label)!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
const fen = () => [...boards.set.mock.calls].reverse().find(([value]) => value.fen !== undefined)?.[0].fen ?? boards.configs.at(-1)?.fen;
const previewIndex = () => document.querySelector("[data-line-preview-position]")?.getAttribute("data-line-preview-position");
// Svelte delegates clicks. A detached node's .click() alone may never execute its old callback.
// Capture the actual emitted handler and invoke it with its original currentTarget, reconnected
// to the live root so ownership/aliveness guards, not connectivity, must reject it.
function retainedClick(control: HTMLButtonElement) {
  const handlers = Object.getOwnPropertySymbols(control).flatMap(symbol => {
    if (symbol.description !== "events") return [];
    const record: unknown = Reflect.get(control, symbol);
    return typeof record === "object" && record !== null && "click" in record && typeof record.click === "function" ? [record.click] : [];
  });
  expect(handlers).toHaveLength(1);
  const handler = handlers[0];
  if (typeof handler !== "function") throw new Error("Expected an actual Svelte delegated click handler");
  return (root: HTMLElement) => {
    root.append(control);
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "currentTarget", { value: control });
    return handler.call(control, event);
  };
}

describe("D3979 real original-item line preview", () => {
  for (const one of [false, true]) for (const black of [false, true]) {
    it(`steps the actual ${one ? "one-edge" : "recorded window"}/${black ? "mirrored" : "ordinary"} positions without moves`, async () => {
      const f = mounted(one, black), original = JSON.stringify(f.run);
      const opener = f.root.querySelector<HTMLButtonElement>(".san")!;
      opener.focus(); opener.click(); await tick(); await tick();
      expect(dialog()).not.toBeNull();
      expect(document.activeElement).toBe(dialog());
      expect(fen()).toBe(f.run.nodes[1]!.fen);
      expect(previewIndex()).toBe("1");
      expect(dialog()!.querySelector('[data-board-input-grid]')?.getAttribute("aria-readonly")).toBe("true");
      expect(dialog()!.querySelectorAll('[role="gridcell"]')).toHaveLength(64);
      expect(dialog()!.querySelector(".board-notation, .promotion-picker")).toBeNull();
      expect(boards.configs.at(-1)!.movable?.free).toBe(false);
      expect(boards.configs.at(-1)!.movable?.dests?.size).toBe(0);
      expect(boards.configs.at(-1)!.drawable?.enabled).toBe(false);
      button("Start").click(); await tick();
      expect(fen()).toBe(f.run.nodes[0]!.fen);
      expect(button("Previous").disabled).toBe(true);
      for (let index = 1; index < f.run.nodes.length; index += 1) {
        button("Next").click(); await tick();
        expect(fen()).toBe(f.run.nodes[index]!.fen);
        expect(previewIndex()).toBe(String(index));
      }
      expect(button("Next").disabled).toBe(true);
      expect(boards.configs).toHaveLength(1); // One preview board, position updates rather than remounts.
      button("Close").click(); await tick(); await tick();
      expect(dialog()).toBeNull(); expect(document.activeElement).toBe(opener);
      expect(JSON.stringify(f.run)).toBe(original);
    });
  }
  it("Escape from the read-only semantic grid closes once and restores the original SAN", async () => {
    const f = mounted(), opener = f.root.querySelector<HTMLButtonElement>(".san")!;
    opener.click(); await tick(); await tick();
    const grid = dialog()!.querySelector<HTMLElement>("[data-board-input-grid]")!;
    grid.focus(); grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(dialog()).not.toBeNull();
    grid.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick(); await tick();
    expect(dialog()).toBeNull(); expect(document.activeElement).toBe(opener);
  });
  it("D4059 retires same-byte replacement and retained original SAN/position/close handlers", async () => {
    const f = mounted(), opener = f.root.querySelector<HTMLButtonElement>(".san")!;
    opener.click(); await tick(); await tick();
    const oldNext = button("Next"), oldClose = button("Close");
    const oldOpenHandler = retainedClick(opener), oldNextHandler = retainedClick(oldNext), oldCloseHandler = retainedClick(oldClose);
    const replacement = parsePresentationReceipt(JSON.parse(JSON.stringify(f.receipt))).find(item => item.component.id === "move_path")!;
    expect(replacement).not.toBe(f.owner); expect(replacement.componentDigest).toBe(f.owner.componentDigest);
    f.view.$set({ items: [replacement] }); await tick(); await tick();
    expect(dialog()).toBeNull(); expect(opener.isConnected).toBe(false);
    oldOpenHandler(f.root); oldNextHandler(f.root); oldCloseHandler(f.root); await tick(); await tick();
    expect(dialog()).toBeNull();
    opener.remove(); oldNext.remove(); oldClose.remove();
    const currentOpener = f.root.querySelector<HTMLButtonElement>(".san")!;
    currentOpener.click(); await tick(); await tick();
    expect(dialog()).not.toBeNull(); expect(previewIndex()).toBe("1");
    oldNextHandler(f.root); oldCloseHandler(f.root); await tick();
    expect(dialog()).not.toBeNull(); expect(previewIndex()).toBe("1");
  });
  it("D4059 a pending Close cannot pull focus from a same-owner reopened preview", async () => {
    const f = mounted(), openers = [...f.root.querySelectorAll<HTMLButtonElement>(".san")];
    openers[0]!.click(); await tick(); await tick();
    button("Close").click(); openers[1]!.click();
    await tick(); await tick();
    expect(dialog()).not.toBeNull(); expect(previewIndex()).toBe("2");
    expect(document.activeElement).toBe(dialog());
  });
  it("D4059 old connected handlers cannot alter a reopened preview of the same owner", async () => {
    const f = mounted(), openers = [...f.root.querySelectorAll<HTMLButtonElement>(".san")];
    openers[0]!.click(); await tick(); await tick();
    const oldClose = retainedClick(button("Close")), oldNext = retainedClick(button("Next"));
    button("Close").click(); await tick(); await tick();
    openers[1]!.click(); await tick(); await tick();
    expect(previewIndex()).toBe("2");
    oldClose(f.root); oldNext(f.root); await tick(); await tick();
    expect(dialog()).not.toBeNull(); expect(previewIndex()).toBe("2");
  });
  it.each(["removed", "unmounted"])("retires retained controls when its owner is %s", async ending => {
    const f = mounted(), opener = f.root.querySelector<HTMLButtonElement>(".san")!;
    opener.click(); await tick(); await tick();
    const next = button("Next");
    const openHandler = retainedClick(opener), nextHandler = retainedClick(next);
    if (ending === "removed") f.view.$set({ items: [] }); else f.view.$destroy();
    await tick(); await tick();
    expect(dialog()).toBeNull();
    openHandler(f.root); nextHandler(f.root); await tick();
    expect(dialog()).toBeNull();
  });
});
