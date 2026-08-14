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
import PackList from "./PackList.svelte";
import type { PackSummary, ShapeEntryView } from "./api.js";
import type {
  RegionKeyboardHandler,
  RegisterKeyboardRegion,
} from "./keyboard.js";
import { latestCheckpoint } from "./screen-model.js";
import { assistanceKey } from "./assistance-preference.js";

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
  it("keeps pivotal markers off by default, passive when enabled, and removable again", async () => {
    const initial = createRun({ id: "pivotal-ui", session: { kind: "position", start: { fen: "r3k2r/ppppqppp/2nbbn2/8/8/2NBBN2/PPPPQPPP/R3K2R w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const child = { ...initial.nodes[0]!, id: "pivotal-ui:node:1", parentId: initial.nodes[0]!.id, fen: "4k2r/8/8/8/8/8/RP6/4K3 b - - 0 1", transposeKey: "4k2r/8/8/8/8/8/RP6/4K3 b - -", moveUci: "a2a3", moveSan: "a3", ply: 1, actor: "user" as const };
    const run = { ...initial, nodes: [...initial.nodes, child], activeCursor: { nodeId: child.id, branchId: initial.activeCursor.branchId } } as DrillRun;
    const preferences = new Map([[assistanceKey("position"), JSON.stringify({ version: 2, markers: "live", guided: "off", humanSplit: "off", corpus: "off", voice: "authored" })]]);
    const assistanceStorage = { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => { preferences.set(key, value); } };
    const component = mount(DrillScreen, { target: target(), props: { snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage, onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion } });
    await tick();
    expect(document.querySelector(".pivotal-marker")).not.toBeNull();
    expect(document.querySelector('.guidance-panel[role="dialog"]')).toBeNull();
    document.querySelector<HTMLButtonElement>(".pivotal-marker")!.click(); await tick();
    expect(document.querySelector(".guidance-panel")?.textContent).toContain("Tabiya's phase bands");
    expect(document.querySelector(".guidance-panel")?.textContent).toContain("material-census convention");
    document.querySelector<HTMLButtonElement>(".guidance-panel button:last-child")!.click(); await tick();
    const checkbox = document.querySelector<HTMLInputElement>('.assistance-grid input[type="checkbox"]')!;
    checkbox.click(); await tick();
    expect(document.querySelector(".pivotal-marker")).toBeNull();
    await unmount(component);
  });

  it("shows a passive shape marker in pack-free play and opens the attributed plans panel", async () => {
    const run = createRun({
      id: "just-play-shape",
      session: { kind: "position", start: { fen: "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10", side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"b".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at,
    });
    const component = mount(DrillScreen, { target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, shapes: [carlsbad],
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    expect(document.body.textContent).toContain("No pack is loaded. Nothing is claimed about this position.");
    expect(document.querySelector<HTMLButtonElement>(".shape-marker")?.textContent).toContain("Carlsbad structure");
    document.querySelector<HTMLButtonElement>(".shape-marker")!.click(); await tick();
    expect(document.querySelector(".shape-panel")?.textContent).toContain("Named plans for this structure — general to the kind of position, not advice for this one.");
    expect(document.querySelector(".shape-panel")?.textContent).toContain("CC-BY-SA-4.0");
    expect(document.querySelector(".shape-panel")?.textContent).toContain("Minority attack");
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
      reviewStatus: "schema_example",
      channel: "official",
    };
    const component = mount(PackList, {
      target: target(),
      props: { packs: [summary], onSelect },
    });

    expect(document.body.textContent).toContain("advanced club");
    expect(document.body.textContent).toContain("schema example");
    expect(document.body.textContent).toContain("opening");
    document.querySelector<HTMLButtonElement>(".pack-card button")!.click();
    expect(onSelect).toHaveBeenCalledWith(pack.id);
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
    expectDisabledControlsExplained();
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
    expect(onSwitchBranch).toHaveBeenCalledWith("screen-run:node:3");
    key("Tab");
    expect(onCompare).toHaveBeenCalledWith([
      run.activeCursor.branchId,
      run.branches[0]!.id,
    ]);
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
    await unmount(component);
  });
});
