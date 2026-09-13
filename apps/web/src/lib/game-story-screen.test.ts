// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import GameStoryScreen from "./GameStoryScreen.svelte";
import type { GameStory } from "./api.js";

afterEach(() => document.body.replaceChildren());

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("game story screen", () => {
  const moment = (index: number): GameStory["moments"][number] => ({
    nodeId: `moment-${index}`,
    entryNodeId: `entry-${index}`,
    ply: index,
    san: index % 2 === 0 ? "e5" : "e4",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    kinds: ["eval_pivot"],
    sentences: [`Recorded moment ${index}.`],
    evidence: [],
    phase: "opening",
  });

  it("uses the shared semantic board for a selected story moment", async () => {
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "white",
      source: { kind: "native" },
      outcome: { kind: "unfinished" },
      moments: [{
        nodeId: "moment-one",
        entryNodeId: "entry-one",
        ply: 1,
        san: "e4",
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        kinds: ["eval_pivot"],
        sentences: ["A recorded moment."],
        evidence: [],
        evalBefore: { centipawns: -25, engineId: "sf", requestedMovetimeMs: 100 },
        evalAfter: { centipawns: 240, engineId: "sf", requestedMovetimeMs: 100 },
        phase: "opening",
      }],
      rank: ["moment-one"],
    };
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn() },
    });

    const grid = document.querySelector<HTMLElement>(".stage [data-board-input-grid]")!;
    expect(grid).not.toBeNull();
    expect(grid.querySelectorAll("[role=gridcell]")).toHaveLength(64);
    expect([...grid.querySelectorAll<HTMLElement>("[role=gridcell]")].some((cell) => cell.id === grid.getAttribute("aria-activedescendant"))).toBe(true);
    expect(document.querySelector(".evaluation")?.textContent).toBe("Recorded evaluation from the learner's side: −0.25 → +2.40 pawns.");
    expect(document.querySelector(".evaluation")?.textContent).not.toMatch(/\b(?:cp|White)\b/u);
    await unmount(component);
  });

  it("frames a recorded result from the learner's side instead of printing wire values", async () => {
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "black",
      source: {
        kind: "pgn_paste",
        headers: { White: "Ada", Black: "Mina" },
        result: "1-0",
        importedAt: "2026-09-07T12:00:00.000Z",
      },
      outcome: { kind: "recorded_result", result: "1-0" },
      moments: [],
      rank: [],
    };
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn() },
    });

    const header = document.querySelector(".story > header")!;
    expect(header.textContent).toContain("Ada – Mina");
    expect(header.textContent).toContain("You lost · recorded PGN result");
    expect(header.textContent).not.toContain("1-0");
    expect(header.textContent).not.toContain("recorded_result");
    expect(header.textContent).not.toContain("recorded result");
    await unmount(component);
  });

  it("states the selected and total moment counts when the story rail is bounded", async () => {
    const moments = Array.from({ length: 9 }, (_, index) => moment(index + 1));
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "white",
      source: { kind: "native" },
      outcome: { kind: "unfinished" },
      moments,
      rank: moments.map((item) => item.nodeId).reverse(),
    };
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn() },
    });

    const rail = document.querySelector<HTMLUListElement>(".rail")!;
    const budget = document.querySelector<HTMLElement>("#story-moment-budget")!;
    const explanation = document.querySelector<HTMLElement>("#story-moment-order")!;
    expect(rail.querySelectorAll("li")).toHaveLength(8);
    expect(budget.textContent).toBe("Showing 8 of 9 recorded moments selected for this story.");
    expect(explanation.textContent).toBe("These are the moments the game review can explain, in game order. This is not a ranking of your play.");
    expect(document.body.textContent).not.toMatch(/recorded evidence pass|left evidence about|narrate grounded moment/i);
    expect(rail.getAttribute("aria-describedby")).toBe(`${explanation.id} ${budget.id}`);
    expect(rail.tagName).toBe("UL");
    expect(rail.querySelectorAll("button > span")).toHaveLength(0);
    expect(document.body.textContent).not.toContain("educational value");
    await unmount(component);
  });

  it("never carries a completed explanation onto another story moment", async () => {
    const moments = [moment(1), moment(2)];
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "white",
      source: { kind: "native" },
      outcome: { kind: "unfinished" },
      moments,
      rank: moments.map((item) => item.nodeId),
    };
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn(), onVoice: vi.fn().mockResolvedValue("Explanation for the first moment.") },
    });

    const explain = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Explain this moment")!;
    explain.click();
    await tick();
    await Promise.resolve();
    await tick();
    expect(document.querySelector(".voice")?.textContent).toBe("Explanation for the first moment.");

    document.querySelectorAll<HTMLButtonElement>(".rail button")[1]!.click();
    await tick();
    expect(document.querySelector(".voice")).toBeNull();
    expect(document.querySelector(".moment-detail")?.textContent).not.toContain("Explanation for the first moment.");
    await unmount(component);
  });

  it("discards an in-flight explanation when the learner changes moments", async () => {
    const moments = [moment(1), moment(2)];
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "white",
      source: { kind: "native" },
      outcome: { kind: "unfinished" },
      moments,
      rank: moments.map((item) => item.nodeId),
    };
    let resolveVoice!: (text: string) => void;
    const voice = new Promise<string>((resolve) => { resolveVoice = resolve; });
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: { story, onEnter: vi.fn(), onExport: vi.fn(), onVoice: vi.fn().mockReturnValue(voice) },
    });

    const explain = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Explain this moment")!;
    explain.click();
    await tick();
    expect(explain.textContent).toBe("Explaining…");

    document.querySelectorAll<HTMLButtonElement>(".rail button")[1]!.click();
    await tick();
    resolveVoice("Late explanation for the first moment.");
    await voice;
    await tick();
    expect(document.querySelector(".voice")).toBeNull();
    expect(document.querySelector(".moment-detail")?.textContent).not.toContain("Late explanation for the first moment.");
    await unmount(component);
  });

  it("recovers Story actions without duplicate requests or provider diagnostics", async () => {
    const moments = [moment(1)];
    const story: GameStory = {
      ready: true,
      pendingEvidence: 0,
      branchId: "main",
      side: "white",
      source: { kind: "native" },
      outcome: { kind: "unfinished" },
      moments,
      rank: [moments[0]!.nodeId],
    };
    const exportFailure = deferred<void>();
    const entryFailure = deferred<void>();
    const onExport = vi.fn()
      .mockImplementationOnce(() => exportFailure.promise)
      .mockResolvedValueOnce(undefined);
    const onEnter = vi.fn()
      .mockImplementationOnce(() => entryFailure.promise)
      .mockResolvedValueOnce(undefined);
    const onShare = vi.fn()
      .mockRejectedValueOnce(new Error("private share database detail"))
      .mockResolvedValueOnce({ id: "share-two", url: "/public/story-two" });
    const onRevoke = vi.fn().mockRejectedValueOnce(new Error("private revoke database detail"));
    const component = mount(GameStoryScreen, {
      target: document.body,
      props: {
        story, onEnter, onExport, onShare, onRevoke,
        shares: [{ id: "share-one", scope: "story_read", runId: "run-one", branchId: "main", createdAt: "2026-09-13T00:00:00.000Z", revokedAt: null }],
      },
    });

    const exportButton = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Export game + branches")!;
    exportButton.click();
    await tick();
    expect(exportButton.disabled).toBe(true);
    exportButton.click();
    expect(onExport).toHaveBeenCalledTimes(1);
    exportFailure.reject(new Error("private export filesystem detail"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The game export could not be prepared"));
    expect(document.body.textContent).not.toContain("private export filesystem detail");
    exportButton.click();
    await vi.waitFor(() => expect(onExport).toHaveBeenCalledTimes(2));

    const enterButton = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Pick it up from here")!;
    enterButton.click();
    await tick();
    expect(enterButton.disabled).toBe(true);
    enterButton.click();
    expect(onEnter).toHaveBeenCalledTimes(1);
    entryFailure.reject(new Error("private re-entry service detail"));
    await vi.waitFor(() => expect(document.querySelector(".moment-detail [role='alert']")?.textContent).toContain("story is still here"));
    expect(document.body.textContent).not.toContain("private re-entry service detail");
    enterButton.click();
    await vi.waitFor(() => expect(onEnter).toHaveBeenCalledTimes(2));

    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Revoke this link")!
      .click();
    await vi.waitFor(() => expect(document.querySelector(".share-management [role='alert']")?.textContent).toContain("may still be public"));
    expect(document.body.textContent).not.toContain("private revoke database detail");

    const shareButton = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Share story")!;
    shareButton.click();
    await vi.waitFor(() => expect(document.querySelector(".share-management [role='alert']")?.textContent).toContain("could not be created"));
    expect(document.body.textContent).not.toContain("private share database detail");
    shareButton.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("/public/story-two"));

    const decode = vi.spyOn(globalThis.Image.prototype, "decode")
      .mockRejectedValueOnce(new Error("private image decoder detail"));
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Download card PNG")!
      .click();
    await vi.waitFor(() => expect(document.querySelector(".share-management [role='alert']")?.textContent).toContain("story card could not be prepared"));
    expect(document.body.textContent).not.toContain("private image decoder detail");
    decode.mockRestore();

    await unmount(component);
  });
});
