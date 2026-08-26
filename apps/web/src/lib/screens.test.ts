// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  attachEvidence,
  commitMove,
  compareBranches,
  createRun,
  fork,
  reachCheckpoint,
  revealFeedback,
  rewind,
  transitionObjective,
  type DrillRun,
} from "@chess-tabiya/runtime";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import fixtureJson from "../../../../schemas/drill_pack.example.json?raw";
import carlsbadJson from "../../../../content/shapes/carlsbad.json?raw";

const chessground = vi.hoisted(() => ({
  configs: [] as Config[],
  set: vi.fn<(config: Config) => void>(),
  destroy: vi.fn<() => void>(),
}));

vi.mock("@lichess-org/chessground", () => ({
  Chessground: (_element: HTMLElement, config: Config) => {
    chessground.configs.push(config);
    return {
      set: chessground.set,
      destroy: chessground.destroy,
    } as unknown as Api;
  },
}));

import CompareView from "./CompareView.svelte";
import CheckpointSheet from "./CheckpointSheet.svelte";
import DrillScreen from "./DrillScreen.svelte";
import JustPlayStarter from "./JustPlayStarter.svelte";
import PackList from "./PackList.svelte";
import type { Capabilities, PackSummary, ShapeEntryView } from "./api.js";
import type {
  RegionKeyboardHandler,
  RegisterKeyboardRegion,
} from "./keyboard.js";
import { latestCheckpoint } from "./screen-model.js";
import { assistanceKey } from "./assistance-preference.js";
import { RECORDED_READING_GUARD } from "./recorded-reading-sentences.js";

const pack = JSON.parse(fixtureJson) as DrillPackDefinition;
const carlsbad = { ...JSON.parse(carlsbadJson), channel: "official" } as ShapeEntryView;
const at = "2026-08-11T20:00:00.000Z";
let regionKeyboard: RegionKeyboardHandler | undefined;

const registerKeyboardRegion: RegisterKeyboardRegion = (_element, handler) => {
  regionKeyboard = handler;
  return () => {
    if (regionKeyboard === handler) regionKeyboard = undefined;
  };
};

function expectDisabledControlsExplained(): void {
  for (const control of document.querySelectorAll<HTMLElement>(
    ":disabled, [aria-disabled='true']",
  )) {
    const references = control.getAttribute("aria-describedby")?.split(/\s+/) ?? [];
    expect(references.length, control.outerHTML).toBeGreaterThan(0);
    for (const id of references) {
      expect(document.getElementById(id)?.textContent?.trim(), control.outerHTML).toBeTruthy();
    }
  }
}

function branchedRun(): DrillRun {
  let run = createRun({
    id: "screen-run",
    packId: pack.id,
    packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: pack.start.fen,
    seed: 4,
    createdAt: at,
  });
  run = commitMove(run, "c1e3", { at }).run;
  run = reachCheckpoint(run, "plan-commitment", at).run;
  const forkNodeId = run.activeCursor.nodeId;
  run = attachEvidence(
    run,
    forkNodeId,
    ["engine:fork-eval"],
    {
      kind: "eval",
      source: "engine_validated",
      values: { centipawns: 12 },
    },
    at,
  ).run;
  run = commitMove(run, "e7e6", { at }).run;
  run = reachCheckpoint(run, "predict-reply", at).run;
  run = commitMove(run, "f2f3", { at }).run;
  run = rewind(run, forkNodeId, at).run;
  run = fork(run, forkNodeId, {
    label: "early queenside",
    intent: "Test Black's expansion",
    at,
  }).run;
  run = commitMove(run, "b7b5", { at }).run;
  run = attachEvidence(
    run,
    run.activeCursor.nodeId,
    ["engine:alternative-mate"],
    {
      kind: "eval",
      source: "engine_validated",
      values: { mateIn: -2 },
    },
    at,
  ).run;
  run = reachCheckpoint(run, "timing-window", at).run;
  run = transitionObjective(run, "achieved", ["pack:timing-window"], at).run;
  return run;
}

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

function key(value: string, options: KeyboardEventInit = {}): void {
  regionKeyboard?.(
    new KeyboardEvent("keydown", {
      key: value,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  );
}

afterEach(() => {
  document.body.replaceChildren();
  chessground.configs.length = 0;
  chessground.set.mockClear();
  chessground.destroy.mockClear();
  regionKeyboard = undefined;
  vi.restoreAllMocks();
});

describe("Layer 3 screens", () => {
  it("turns a real first run into a four-step rehearsal and opens its two preserved attempts", async () => {
    const run = branchedRun();
    const onCompare = vi.fn();
    const onFirstRehearsalComplete = vi.fn();
    const component = mount(DrillScreen, { target: target(), props: {
      pack,
      firstRehearsal: true,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare, onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), onFirstRehearsalComplete, registerKeyboardRegion,
    } });
    await tick();

    const guide = document.querySelector<HTMLElement>(".rehearsal-guide")!;
    expect(guide.textContent).toContain("First rehearsal · 4 of 4");
    expect(guide.textContent).toContain("Both consequences survived");
    const compare = [...guide.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.includes("Compare both attempts"))!;
    compare.click();
    await tick();

    expect(onCompare).toHaveBeenCalledWith(run.branches.slice(0, 2).map((branch) => branch.id));
    expect(onFirstRehearsalComplete).toHaveBeenCalledOnce();
    await unmount(component);
  });

  it("keeps a drawn mark in parent state and saves it against the node where the gesture began", async () => {
    vi.useFakeTimers();
    const run = branchedRun();
    const onSaveMarks = vi.fn(() => new Promise<never>(() => {}));
    const component = mount(DrillScreen, { target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), onLoadMarks: async () => [], onSaveMarks,
      registerKeyboardRegion,
    } });
    await tick();

    chessground.configs.at(-1)!.drawable!.onChange!([{ orig: "a1", dest: "h8", brush: "red" }]);
    await tick();
    const earlier = document.querySelector<HTMLButtonElement>('.timeline button[aria-label^="Ply 1:"]')!;
    earlier.click();
    await tick();
    vi.advanceTimersByTime(400);
    await tick();
    expect(onSaveMarks).toHaveBeenCalledWith(expect.objectContaining({ nodeId: run.activeCursor.nodeId, branchId: run.activeCursor.branchId }));

    earlier.click();
    await tick();
    expect(chessground.set.mock.calls.at(-1)?.[0].drawable!.shapes).toEqual([{ orig: "a1", dest: "h8", brush: "red" }]);
    expect(chessground.configs).toHaveLength(1);
    await unmount(component);
    vi.useRealTimers();
  });

  it("keeps read-only followers on inspect-only controls without write errors", async () => {
    const run = branchedRun();
    const onRewind = vi.fn();
    const onFork = vi.fn();
    const onCreateGroup = vi.fn();
    const component = mount(DrillScreen, { target: target(), props: {
      snapshot: { run, access: "read_only", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind, onFork, onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onCreateGroup, registerKeyboardRegion,
    } });
    await tick();

    const button = (label: string) => [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent?.trim().startsWith(label));
    const forkButton = button("Fork")!;
    const groupButton = button("Branch group")!;
    expect(forkButton.disabled).toBe(true);
    expect(groupButton.disabled).toBe(true);
    expect(document.getElementById(forkButton.getAttribute("aria-describedby")!)?.textContent).toContain("read-only");
    expect(document.getElementById(groupButton.getAttribute("aria-describedby")!)?.textContent).toContain("read-only");

    document.querySelector<HTMLButtonElement>(".timeline ol button")!.click();
    await tick();
    const rewindButton = button("Rewind to preview")!;
    expect(rewindButton.disabled).toBe(true);
    expect(document.getElementById(rewindButton.getAttribute("aria-describedby")!)?.textContent).toContain("read-only");

    expect(regionKeyboard?.(new KeyboardEvent("keydown", { key: "b" }))).toBe(true);
    expect(regionKeyboard?.(new KeyboardEvent("keydown", { key: "r" }))).toBe(true);
    expect(regionKeyboard?.(new KeyboardEvent("keydown", { key: "Enter" }))).toBe(true);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(onFork).not.toHaveBeenCalled();
    expect(onRewind).not.toHaveBeenCalled();
    expect(onCreateGroup).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("keeps pivotal markers off by default, passive when enabled, and removable again", async () => {
    const initial = createRun({ id: "pivotal-ui", session: { kind: "position", start: { fen: "r3k2r/ppppqppp/2nbbn2/8/8/2NBBN2/PPPPQPPP/R3K2R w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const child = { ...initial.nodes[0]!, id: "pivotal-ui:node:1", parentId: initial.nodes[0]!.id, fen: "4k2r/8/8/8/8/8/RP6/4K3 b - - 0 1", transposeKey: "4k2r/8/8/8/8/8/RP6/4K3 b - -", moveUci: "a2a3", moveSan: "a3", ply: 1, actor: "user" as const };
    const run = { ...initial, nodes: [...initial.nodes, child], activeCursor: { nodeId: child.id, branchId: initial.activeCursor.branchId } } as DrillRun;
    const preferences = new Map([[assistanceKey("position"), JSON.stringify({ version: 4, markers: "live", guided: "off", humanSplit: "off", corpus: "off", voice: "persona", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" })]]);
    const assistanceStorage = { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => { preferences.set(key, value); } };
    const capabilities = { providers: { opponent: "mock", judge: "mock", llm: "external", corpus: "none", tts: "none", tablebase: "none" } } as Capabilities;
    const onVoice = vi.fn(async () => ({ text: "Recorded reading at this position: fixture fact.", source: "provider" as const, scope: "marker" as const }));
    const component = mount(DrillScreen, { target: target(), props: { snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage, capabilities, onVoice, onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion } });
    await tick();
    expect(document.querySelector(".pivotal-marker")).not.toBeNull();
    expect(document.querySelector('.guidance-panel[role="dialog"]')).toBeNull();
    document.querySelector<HTMLButtonElement>(".pivotal-marker")!.click(); await tick();
    expect(document.querySelector(".guidance-panel")?.textContent).toContain("A concrete change was recorded");
    expect(document.querySelector(".guidance-panel")?.textContent).not.toContain("phase bands");
    document.querySelector<HTMLButtonElement>(".guidance-panel button")!.click(); await tick();
    expect(document.querySelector('[aria-label="Recorded moment evidence"]')?.textContent).toContain("material-census convention");
    const revoice = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Revoice this evidence")!;
    revoice.click(); await tick();
    expect(onVoice).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect([...document.querySelectorAll("p")].filter((element) => element.textContent === RECORDED_READING_GUARD)).toHaveLength(1));
    document.querySelector<HTMLButtonElement>(".inspector-surface header button")!.click(); await tick();
    const checkbox = document.querySelector<HTMLInputElement>('.assistance-grid input[type="checkbox"]')!;
    checkbox.click(); await tick();
    expect(document.querySelector(".pivotal-marker")).toBeNull();
    await unmount(component);
  });

  it("opens the Support companion from ambient presence", async () => {
    const run = createRun({
      id: "ambient-assistance",
      session: { kind: "position", start: { fen: pack.start.fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"9".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const assistanceStorage = {
      getItem: () => JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "on" }),
      setItem: vi.fn(),
    };
    const component = mount(DrillScreen, { target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();

    const ambient = document.querySelector<HTMLButtonElement>('button[aria-label="Open assistance"]')!;
    const tabs = [...document.querySelectorAll<HTMLButtonElement>(".compact-tabs button:not(.sheet-close)")];
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute("aria-pressed")])).toEqual([
      ["Support", "false"],
      ["Branches", "false"],
      ["Actions", "true"],
    ]);
    expect(ambient.getAttribute("aria-controls")).toBe("run-support-region");
    expect(document.querySelector(".rail-stack")?.classList.contains("sheet-open")).toBe(false);
    ambient.click();
    await tick();
    expect(document.querySelector(".rail-stack")?.classList.contains("sheet-open")).toBe(true);
    expect(document.getElementById("run-support-region")?.classList.contains("compact-active")).toBe(true);
    expect(tabs[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(tabs[2]?.getAttribute("aria-pressed")).toBe("false");
    await unmount(component);
  });

  it("requests the human-model split without requiring pivotal markers", async () => {
    const initial = createRun({
      id: "split-without-marker",
      session: {
        kind: "position",
        start: { fen: "4k3/8/8/8/8/8/P7/4K3 w - - 0 1", side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common", targetElo: 1500 },
      },
      sessionDigest: `sha256:${"f".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const run = revealFeedback(initial, at).run;
    const onHumanSplit = vi.fn(async () => ({
      nodeId: run.activeCursor.nodeId,
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: false, eloHonored: false },
      targetElo: 1500,
      candidates: [{ moveUci: "e1e2", mass: .4, rank: 1 }],
    }));
    const assistanceStorage = {
      getItem: () => JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "on_request", corpus: "off", voice: "authored", spoken: "off", boardLighting: "off", arrows: "off", ambient: "off" }),
      setItem: vi.fn(),
    };
    const component = mount(DrillScreen, { target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onHumanSplit, registerKeyboardRegion,
    } });
    await tick();

    expect(document.querySelector(".pivotal-marker")).toBeNull();
    const request = [...document.querySelectorAll<HTMLButtonElement>(".assistance-grid button")]
      .find((button) => button.textContent?.includes("Open human-model evidence inspector"));
    expect(request).toBeDefined();
    request!.click();
    expect(onHumanSplit).toHaveBeenCalledWith(run.activeCursor.nodeId);
    document.querySelector<HTMLButtonElement>(".inspector-entry")!.click();
    await vi.waitFor(() => {
      const evidence = document.querySelector("[aria-label='Human-model evidence']")?.textContent;
      expect(evidence).toContain("Target Elo 1500 was requested but is not recorded as applied");
      expect(evidence).toContain("Ke2 40%");
      expect(evidence).not.toContain("e1e2");
    });
    await unmount(component);
  });

  it("renders only live-admitted irreversibility markers", async () => {
    const config = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
    const session = (fen: string) => ({ kind: "position" as const, start: { fen, side: "white" as const }, feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } });
    const props = (run: DrillRun) => ({
      snapshot: { run, access: "writer" as const, pendingEvidence: 0, withheld: false },
      assistanceStorage: { getItem: () => JSON.stringify({ version: 4, markers: "live", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    });

    const castleRoot = createRun({ id: "live-castle", session: session("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"), sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig: config, seed: 1, createdAt: at });
    const castle = commitMove(castleRoot, "e1g1", { at }).run;
    let component = mount(DrillScreen, { target: target(), props: props(castle) });
    await tick();
    expect(document.querySelectorAll(".pivotal-marker")).toHaveLength(0);
    await unmount(component);
    document.body.replaceChildren();

    const queenRoot = createRun({ id: "live-queens-off", session: session("4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), sessionDigest: `sha256:${"e".repeat(64)}`, policyConfig: config, seed: 1, createdAt: at });
    const queen = commitMove(queenRoot, "e2e7", { at }).run;
    component = mount(DrillScreen, { target: target(), props: props(queen) });
    await tick();
    expect(document.querySelectorAll(".pivotal-marker")).toHaveLength(1);
    document.querySelector<HTMLButtonElement>(".pivotal-marker")!.click();
    await tick();
    expect(document.querySelector(".guidance-panel")?.textContent).not.toContain("The queens have left the board.");
    document.querySelector<HTMLButtonElement>(".guidance-panel button")!.click();
    await tick();
    expect(document.querySelector('[aria-label="Recorded moment evidence"]')?.textContent).toContain("The queens have left the board.");
    await unmount(component);
  });

  it("shows a guided shape marker with markers off and opens the attributed plans panel", async () => {
    const run = createRun({
      id: "just-play-shape",
      session: { kind: "position", start: { fen: "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10", side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"b".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at,
    });
    const component = mount(DrillScreen, { target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, shapes: [carlsbad],
      assistanceStorage: { getItem: () => JSON.stringify({ version: 4, markers: "off", guided: "live", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    expect(document.body.textContent).toContain("Nothing is authored about this position — Tabiya reads it as you play");
    expect(document.querySelector<HTMLButtonElement>(".shape-marker")?.textContent).toContain("Carlsbad structure");
    document.querySelector<HTMLButtonElement>(".shape-marker")!.click(); await tick();
    expect(document.querySelector(".shape-panel")?.textContent).toContain("Named plans for this structure — general to the kind of position, not advice for this one.");
    expect(document.querySelector(".shape-panel")?.textContent).not.toContain("shape trigger");
    expect(document.querySelector(".shape-panel")?.textContent).toContain("Minority attack");
    document.querySelector<HTMLButtonElement>(".shape-panel footer button")!.click(); await tick();
    expect(document.querySelector('[aria-label="Named structure evidence"]')?.textContent).toContain("CC-BY-SA-4.0");
    await unmount(component);
  });

  it("exposes reveal only to writable attempt-end runs and reports the open window", async () => {
    const run = createRun({
      id: "reveal-screen",
      session: { kind: "position", start: { fen: pack.start.fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"c".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const onReveal = vi.fn();
    const shared = { onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion };
    let component = mount(DrillScreen, { target: target(), props: { snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, onReveal, ...shared } });
    await tick();
    const reveal = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Open evidence for this position")!;
    expect(reveal.disabled).toBe(false);
    reveal.click();
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("Recorded on the run as a disclosure");
    await unmount(component);

    document.body.replaceChildren();
    component = mount(DrillScreen, { target: target(), props: { snapshot: { run, access: "read_only", pendingEvidence: 0, withheld: false }, onReveal, ...shared } });
    await tick();
    expect(document.body.textContent).not.toContain("Open evidence for this position");
    await unmount(component);
  });

  it("presents terminal authored commentary and recorded engine evidence", async () => {
    const terminalPack = {
      ...pack,
      id: "terminal-screen",
      start: { fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", side: "white" },
      spine: [{ id: "mate", moveUci: "g6g7", moveSan: "Qg7#", children: [] }],
      checkpoints: [],
    } as DrillPackDefinition;
    let run = createRun({
      id: "terminal-screen-run",
      session: {
        kind: "pack",
        packId: terminalPack.id,
        packDigest: `sha256:${"a".repeat(64)}`,
        start: terminalPack.start as { fen: string; side: "white" },
        feedbackPolicy: "delayed_checkpoint",
        opponentPolicy: { mode: "human_common" },
      },
      sessionDigest: `sha256:${"b".repeat(64)}`,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 4,
      createdAt: at,
    });
    run = commitMove(run, "g6g7", { at }).run;
    run = attachEvidence(
      run,
      run.activeCursor.nodeId,
      ["engine:terminal-eval"],
      { kind: "eval", source: "engine_validated", values: { centipawns: 0 } },
      at,
    ).run;
    const outcome = run.events.find((event) => event.type === "outcome.reached")!;
    const onRewind = vi.fn();
    const component = mount(DrillScreen, {
      target: target(),
      props: {
        pack: terminalPack,
        snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
        authoredFeedback: {
          items: [{
            kind: "annotation",
            id: "mate#0",
            revealedBy: { kind: "outcome", eventSeq: outcome.seq },
            anchor: { spineNodeId: "mate" },
            text: "The terminal authored explanation.",
          }, {
            kind: "claim",
            id: "claim#terminal",
            revealedBy: { kind: "outcome", eventSeq: outcome.seq },
            anchor: { claimId: "terminal" },
            text: "The terminal authored claim.",
            evidenceTypes: ["derived_feature"],
            earnedEvidenceTypes: [],
            binding: "self_declared",
            authorSpans: [],
            principles: [],
          }],
          hasWithheldAuthoredContent: false,
        },
        onMove: vi.fn(),
        onRewind,
        onFork: vi.fn(),
        onSwitchBranch: vi.fn(),
        onCompare: vi.fn(),
        onCloseCompare: vi.fn(),
        onContinueCheckpoint: vi.fn(),
        onExport: vi.fn(),
        onStop: vi.fn(),
        registerKeyboardRegion,
      },
    });
    await tick();

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("You won.");
    expect(document.body.textContent).toContain("The terminal authored explanation.");
    expect(document.body.textContent).toContain("The terminal authored claim.");
    expect(document.body.textContent).toContain("No machine record is attached.");
    expect(document.body.textContent).toContain("Engine evidence recorded");
    document.querySelector<HTMLButtonElement>(".sheet .actions button")!.click();
    expect(onRewind).toHaveBeenCalledWith({ nodeId: run.nodes[0]!.id });
    await unmount(component);
  });

  it("shows pack mode, difficulty band, and honest review status", async () => {
    const onSelect = vi.fn<(packId: string) => void>();
    const summary: PackSummary = {
      id: pack.id,
      version: pack.version,
      digest: `sha256:${"a".repeat(64)}`,
      title: pack.title as string,
      mode: pack.mode as string,
      phase: "opening",
      difficulty: pack.difficulty,
      objectiveSummary: pack.objective.summary ?? pack.objective.type.replaceAll("_", " "),
      concepts: pack.concepts ?? [],
      reviewStatus: "draft",
      channel: "community",
    };
    const component = mount(PackList, {
      target: target(),
      props: { packs: [summary], onSelect },
    });

    expect(document.body.textContent).toContain("advanced club");
    expect(document.body.textContent).toContain("draft");
    expect(document.body.textContent).toContain(summary.objectiveSummary);
    expect(document.body.textContent).toContain("opening");
    const open = document.querySelector<HTMLButtonElement>(".pack-card button")!;
    expect(open.getAttribute("aria-label")).toBe(`Rehearse this position: ${summary.title}`);
    open.click();
    expect(onSelect).toHaveBeenCalledWith(pack.id);
    await unmount(component);
  });

  it("filters the catalogue over authored objectives and keeps the empty state recoverable", async () => {
    const opening: PackSummary = {
      id: "najdorf", version: "0.27", digest: `sha256:${"b".repeat(64)}`,
      title: "Najdorf English Attack", mode: "line", phase: "opening",
      difficulty: { minOnlineRapid: 1800, maxOnlineRapid: 2200 },
      objectiveSummary: "Continue beyond the opening fork.", concepts: ["sicilian-defense"],
      reviewStatus: "draft", channel: "community",
    };
    const ending: PackSummary = {
      id: "lucena", version: "0.27", digest: `sha256:${"c".repeat(64)}`,
      title: "Lucena bridge", mode: "outcome", phase: "endgame",
      difficulty: { minOnlineRapid: 1000, maxOnlineRapid: 1600 },
      objectiveSummary: "Build the bridge and promote.", concepts: ["rook-ending"],
      reviewStatus: "draft", channel: "community",
    };
    const component = mount(PackList, { target: target(), props: { packs: [opening, ending], onSelect: vi.fn() } });
    const search = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = "rook-ending";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(document.querySelectorAll(".pack-card")).toHaveLength(1);
    expect(document.body.textContent).toContain("Lucena bridge");
    document.querySelectorAll<HTMLButtonElement>(".phase-tabs button")[1]!.click();
    await tick();
    expect(document.body.textContent).toContain("No positions match those filters");
    document.querySelector<HTMLButtonElement>(".empty button")!.click();
    await tick();
    expect(document.querySelectorAll(".pack-card")).toHaveLength(2);
    await unmount(component);
  });

  it("starts Just Play with a named Maia rung and keeps strong-engine play distinct", async () => {
    const onStart = vi.fn();
    const component = mount(JustPlayStarter, { target: target(), props: { onStart } });
    const radios = document.querySelectorAll<HTMLInputElement>('input[name="opponent"]');
    radios[2]!.click();
    document.querySelector<HTMLFormElement>(".just-play form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    expect(onStart).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "human_common", targetElo: 1800 }));
    radios[4]!.click();
    document.querySelector<HTMLFormElement>(".just-play form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    expect(onStart).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "strong_engine" }));
    expect(onStart.mock.calls.at(-1)?.[0]).not.toHaveProperty("targetElo");
    await unmount(component);
  });

  it("renders a derived sibling-pack link at the rehearsal entry point", async () => {
    const related = { ...structuredClone(pack), variantOf: { packId: "related-pack", relation: { kind: "same_root_other_objective" as const } } };
    const run = createRun({ id: "variant-run", packId: related.id, packDigest: `sha256:${"b".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, startFen: related.start.fen, seed: 1, createdAt: at });
    const onSelectPack = vi.fn();
    const component = mount(DrillScreen, { target: target(), props: {
      pack: related,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), onSelectPack, registerKeyboardRegion,
    } });
    await tick();
    expect(document.querySelector(".variant-link")?.textContent).toContain("Same position, other objective");
    document.querySelector<HTMLButtonElement>(".variant-link button")!.click();
    expect(onSelectPack).toHaveBeenCalledWith("related-pack");
    await unmount(component);
  });

  it("composes board, objective, why-banner, timeline preview, branch rail, and checkpoint sheet", async () => {
    const run = branchedRun();
    const checkpoint = latestCheckpoint(pack, run)!;
    const onRewind = vi.fn();
    const component = mount(DrillScreen, {
      target: target(),
      props: {
        pack,
        snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
        checkpoint,
        authoredFeedback: {
          items: [
            {
              kind: "annotation",
              id: "najdorf-be3#earlier",
              revealedBy: {
                kind: "checkpoint",
                checkpointId: checkpoint.id,
                eventSeq: checkpoint.eventSeq - 1,
              },
              anchor: { spineNodeId: "najdorf-be3" },
              text: "Earlier occurrence must stay out of this sheet.",
            },
            {
              kind: "annotation",
              id: "najdorf-be3#0",
              revealedBy: { kind: "checkpoint", checkpointId: checkpoint.id, eventSeq: checkpoint.eventSeq },
              anchor: { spineNodeId: "najdorf-be3" },
              text: "Authored setup explanation.",
            },
          ],
          hasWithheldAuthoredContent: true,
        },
        onMove: vi.fn(),
        onRewind,
        onFork: vi.fn(),
        onSwitchBranch: vi.fn(),
        onCompare: vi.fn(),
        onCloseCompare: vi.fn(),
        onContinueCheckpoint: vi.fn(),
        onExport: vi.fn(),
        onStop: vi.fn(),
        registerKeyboardRegion,
      },
    });
    await tick();

    expect(document.body.textContent).toContain(
      "Select a setup and execute its first plan through the timing window.",
    );
    expect(document.body.textContent).toContain(
      "Checkpoint reached: Critical race resolved.",
    );
    expect(document.body.textContent).toContain("early queenside");
    expect(document.querySelectorAll(".timeline li.checkpoint").length).toBe(2);
    expect(document.querySelector('[role="dialog"] h2')?.textContent).toBe(
      "Critical race resolved",
    );
    expect(document.activeElement?.textContent).toBe("Critical race resolved");
    expect(document.body.textContent).toContain("Authored setup explanation.");
    expect(document.body.textContent).not.toContain(
      "Earlier occurrence must stay out of this sheet.",
    );
    expect(document.body.textContent).toContain(
      "Authored commentary withheld until checkpoints",
    );
    expect(document.querySelectorAll(".timeline .authored-marker")).toHaveLength(1);

    document.querySelector<HTMLButtonElement>(".timeline li button")!.click();
    await tick();
    expect(document.body.textContent).toContain("Preview");
    document.querySelector<HTMLButtonElement>(".timeline .confirm")!.click();
    expect(onRewind).toHaveBeenCalledWith({ nodeId: "screen-run:node:1" });
    await unmount(component);
  });

  it("renders aligned dual-board comparison with absent-side dimming and strips", async () => {
    const run = branchedRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const component = mount(CompareView, {
      target: target(),
      props: {
        run,
        pack,
        comparison,
        startSide: "white",
        step: 2,
        onStep: vi.fn(),
        onClose: vi.fn(),
      },
    });
    await tick();

    expect(document.body.textContent).toContain("Aligned ply 2 / 2");
    expect(document.activeElement?.id).toBe("compare-title");
    expect(document.body.textContent).toContain("Line ended");
    expect(document.querySelector(".boards article.absent")).not.toBeNull();
    expect(document.body.textContent).toContain("main");
    expect(document.body.textContent).toContain("active → achieved");
    expect(document.body.textContent).toContain("objective achieved");
    expect(document.body.textContent).toContain("M-2");
    expect(document.querySelector('[data-evidence-ref="pack-absent:timing-window"]')?.textContent).toBe(
      "Checkpoint not reached on this branch: Critical race resolved.",
    );
    expect(document.body.textContent).toContain("Where the attempts split");
    expect(document.body.textContent).toContain("Intent: Test Black's expansion");
    expect(document.body.textContent).toContain("Recorded differences by branch");
    expect(document.body.textContent).toContain("Opponent and authored-line context");
    expect(document.body.textContent).not.toContain("Evidence inspector");
    const compareSections = [...document.querySelectorAll(".compare > section")];
    expect(compareSections.indexOf(document.querySelector(".narrative")!)).toBeLessThan(
      compareSections.indexOf(document.querySelector(".trajectory")!),
    );
    expect(document.querySelector(".boards")?.getAttribute("data-zoom")).toBe("near");
    expect(document.querySelectorAll("[aria-label='Chessboard']")).toHaveLength(2);
    expect(chessground.configs[0]!.drawable!.autoShapes).toHaveLength(2);
    document.querySelector<HTMLButtonElement>(".zoom-control button")!.click();
    await tick();
    expect(document.querySelector(".boards")?.getAttribute("data-zoom")).toBe("far");
    expect(document.querySelectorAll("[aria-label='Chessboard']")).toHaveLength(1);
    expect(document.body.textContent).toContain("active");
    expect(document.querySelectorAll(".sparkline span")).toHaveLength(comparison.columns.reduce((total,column)=>total+comparison.evidence[column.branchId]!.length,0));
    expect(document.body.textContent).toContain("recorded branches share");
    expect(document.querySelector<HTMLButtonElement>(".narrative-heading button")?.getAttribute("aria-expanded")).toBe("true");
    expectDisabledControlsExplained();
    await unmount(component);
  });

  it("renders no machine score through any summary field while comparison feedback is withheld", async () => {
    const run = branchedRun();
    const full = compareBranches(run, run.branches.map((branch) => branch.id));
    const comparison = {
      ...full,
      machineFeedback: "withheld" as const,
      evidence: Object.fromEntries(full.columns.map((column) => [column.branchId, []])),
      lines: Object.fromEntries(full.columns.map((column) => [column.branchId, []])),
      consequences: Object.fromEntries(Object.entries(full.consequences).map(([branchId, consequence]) => [
        branchId,
        { ...consequence, deepestScore: null },
      ])),
    };
    const component = mount(CompareView, { target: target(), props: {
      run, pack, comparison, startSide: "white", step: 0,
      onStep: vi.fn(), onClose: vi.fn(),
    } });
    await tick();

    expect(document.querySelector('[aria-label="Recorded engine evaluation"]')).toBeNull();
    expect(document.querySelector('[data-evidence-consumer="compare.engine_trajectory"]')).toBeNull();
    expect(document.body.textContent).not.toContain("M-2");
    await unmount(component);
  });

  it("announces positional re-convergence independently from shared node identity", async () => {
    const source = branchedRun();
    const comparison = compareBranches(source, source.branches.map((branch) => branch.id));
    const row = comparison.rows[0]!;
    const [leftId, rightId] = comparison.columns.map((column) => row.nodes[column.branchId]!.id);
    const leftKey = source.nodes.find((node) => node.id === leftId)!.transposeKey;
    const run = { ...source, nodes: source.nodes.map((node) => node.id === rightId ? { ...node, transposeKey: leftKey } : node) };
    const component = mount(CompareView, { target: target(), props: {
      run, pack, comparison, startSide: "white", step: 1,
      onStep: vi.fn(), onClose: vi.fn(),
    } });
    await tick();

    expect(document.body.textContent).toContain("re-converged to the same chess position");
    expect(document.body.textContent).toContain("The recorded paths are separate at this ply");
    await unmount(component);
  });

  it("renders comparison objective grounds from the run's attached payload", async () => {
    const run = branchedRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const [branchId, timeline] = Object.entries(comparison.objectiveTimelines)
      .find(([, entries]) => entries.length > 0)!;
    const grounded = {
      ...comparison,
      objectiveTimelines: {
        ...comparison.objectiveTimelines,
        [branchId]: timeline.map((entry, index) => index === 0
          ? { ...entry, evidenceRefs: ["engine:fork-eval"] }
          : entry),
      },
    };
    const component = mount(CompareView, { target: target(), props: {
      run, pack, comparison: grounded, startSide: "white", step: 0,
      onStep: vi.fn(), onClose: vi.fn(),
    } });
    await tick();

    expect(document.body.textContent).toContain("eval evidence recorded.");
    expect(document.body.textContent).not.toContain("details are pending");
    await unmount(component);
  });

  it("rejects an ungrounded objective transition instead of inventing copy", () => {
    const run = branchedRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const branchId = run.branches[1]!.id;
    const grounded = comparison.objectiveTimelines[branchId]![0]!;
    const invalid = {
      ...comparison,
      objectiveTimelines: {
        ...comparison.objectiveTimelines,
        [branchId]: [{ ...grounded, evidenceRefs: [] }],
      },
    };

    expect(() =>
      mount(CompareView, {
        target: target(),
        props: {
          run,
          pack,
          comparison: invalid,
          startSide: "white",
          step: 0,
          onStep: vi.fn(),
          onClose: vi.fn(),
        },
      }),
    ).toThrow(/has no evidence references/);
  });

  it("explains why checkpoint comparison is disabled", async () => {
    const component = mount(CheckpointSheet, {
      target: target(),
      props: {
        run: branchedRun(),
        checkpoint: {
          id: "predict-reply",
          label: "Predict the reply",
          nodeId: "node-1",
          eventSeq: 2,
          actions: ["compare_branches"],
        },
        canCompare: false,
        onContinue: vi.fn(),
        onRewind: vi.fn(),
        onCompare: vi.fn(),
        onStop: vi.fn(),
      },
    });
    await tick();

    expectDisabledControlsExplained();
    expect(document.body.textContent).toContain(
      "Reach this checkpoint on at least two branches before comparing.",
    );
    await unmount(component);
  });

  it("offers provider-gated reasoning review and renders only the checked fixed frame", async () => {
    const onReasoningReview = vi.fn(async () => ({
      provider: "external" as const,
      proposals: [{
        keyPointId: "improve-piece",
        quotation: "I would improve the knight",
        text: "Possible mention, proposed by the configured language model and not a detection: you wrote \"I would improve the knight\" — the author's point \"Improve the worst piece\".",
      }],
    }));
    const component = mount(CheckpointSheet, {
      target: target(),
      props: {
        run: branchedRun(),
        checkpoint: {
          id: "reasoning-checkpoint",
          label: "State the plan",
          nodeId: "node-1",
          eventSeq: 12,
          actions: [],
          interaction: { type: "stated_reasoning" as const },
        },
        reasoning: {
          checkpointId: "reasoning-checkpoint",
          occurrences: [{
            eventSeq: 13,
            checkpointEventSeq: 12,
            branchId: "main",
            skipped: false,
            transcript: { candidates: ["Ne5"], plan: "I would improve the knight", fears: "" },
            detections: [{ keyPointId: "improve-piece", status: "not_detected" }],
            keyPoints: [{ id: "improve-piece", label: "Improve the worst piece", ground: { kind: "claim", claimId: "piece-activity" }, attribution: "Authored claim: piece activity" }],
          }],
          previous: null,
          absenceSentence: "No earlier attempt has stated reasoning at this checkpoint.",
          honestySentence: "Detected means literal phrase overlap, not correctness.",
        },
        onReasoningReview,
        canCompare: false,
        onContinue: vi.fn(),
        onRewind: vi.fn(),
        onCompare: vi.fn(),
        onStop: vi.fn(),
      },
    });
    await tick();

    expect(document.body.textContent).toContain("It cannot add a detection or grade your reasoning.");
    const reviewButton = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.includes("another possible mention"));
    reviewButton!.click();
    await vi.waitFor(() => expect(onReasoningReview).toHaveBeenCalledWith(12));
    await tick();
    expect(document.body.textContent).toContain("Possible mention, proposed by the configured language model and not a detection");
    expect(document.body.textContent).toContain("I would improve the knight");
    await unmount(component);
  });

  it("maps every keyboard command and keeps modal focus accessible", async () => {
    const run = branchedRun();
    const onRewind = vi.fn();
    const onFork = vi.fn();
    const onSwitchBranch = vi.fn();
    const onCompare = vi.fn();
    const onCloseCompare = vi.fn();
    const onExport = vi.fn();
    const component = mount(DrillScreen, {
      target: target(),
      props: {
        pack,
        snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
        onMove: vi.fn(),
        onRewind,
        onFork,
        onSwitchBranch,
        onCompare,
        onCloseCompare,
        onContinueCheckpoint: vi.fn(),
        onExport,
        onStop: vi.fn(),
        registerKeyboardRegion,
      },
    });
    await tick();
    const main = document.querySelector<HTMLElement>("main.drill")!;
    expect(document.activeElement).toBe(main);
    expect(document.querySelector<HTMLElement>(".rail")?.dataset.activeBranchId).toBe(run.activeCursor.branchId);
    expect(document.querySelector<HTMLButtonElement>('.branch-card[aria-current="true"]')?.textContent).toContain(run.branches.find((branch) => branch.id === run.activeCursor.branchId)?.label);

    key("r");
    expect(onRewind).toHaveBeenCalledWith({ checkpointId: "plan-commitment" });
    key("R", { shiftKey: true });
    await tick();
    expect(document.body.textContent).toContain("Choose a checkpoint.");
    expect(document.activeElement?.id).toBe("picker-title");
    key("Escape");
    await tick();

    main.focus();
    key("b");
    await tick();
    expect(document.activeElement).toBe(
      document.querySelector('input[placeholder="alt-2"]'),
    );
    key("Escape");
    await tick();

    main.focus();
    key("1");
    expect(onSwitchBranch).toHaveBeenCalledWith("screen-run:node:3", run.branches[0]!.id);
    const compareKey = new KeyboardEvent("keydown", {
      key: "c", code: "KeyC", altKey: true, bubbles: true, cancelable: true,
    });
    Object.defineProperty(compareKey, "target", { value: main });
    regionKeyboard?.(compareKey);
    expect(onCompare).toHaveBeenCalledWith([
      run.activeCursor.branchId,
      run.branches[0]!.id,
    ]);
    const compareCalls = onCompare.mock.calls.length;
    const contenteditable = document.createElement("div");
    contenteditable.contentEditable = "true";
    main.append(contenteditable);
    for (const target of [
      document.querySelector(".assistance-control summary")!,
      document.querySelector(".text-move input")!,
      document.querySelector("[data-board-input-grid]")!,
      contenteditable,
    ]) {
      const blocked = new KeyboardEvent("keydown", { key: "c", code: "KeyC", altKey: true, bubbles: true, cancelable: true });
      Object.defineProperty(blocked, "target", { value: target });
      Object.defineProperty(blocked, "composedPath", { value: () => [target, main] });
      expect(regionKeyboard?.(blocked)).toBe(false);
    }
    expect(onCompare).toHaveBeenCalledTimes(compareCalls);
    key("ArrowLeft");
    await tick();
    expect(document.body.textContent).toContain("Preview");
    key(" ");
    await tick();
    expect(
      document.querySelector<HTMLButtonElement>('[aria-pressed="true"]'),
    ).not.toBeNull();
    key("e");
    expect(onExport).toHaveBeenCalledOnce();

    key("?");
    await tick();
    expect(document.querySelector('[aria-labelledby="shortcut-title"]')).not.toBeNull();
    expect(document.activeElement?.id).toBe("shortcut-title");
    expect(document.body.textContent).toContain("Shift + R");
    key("Escape");
    await tick();
    expect(document.activeElement).toBe(main);

    const helpButton = document.querySelector<HTMLButtonElement>('button[aria-label="Keyboard shortcuts"]')!;
    helpButton.click();
    await tick();
    document.querySelector<HTMLButtonElement>('[aria-labelledby="shortcut-title"] button')!.click();
    await tick();
    expect(document.activeElement).toBe(helpButton);
    await unmount(component);
  });
});
