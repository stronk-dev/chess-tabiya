// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  attachEvidence,
  commitMove,
  compare,
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
import type { PackSummary } from "./api.js";
import type {
  RegionKeyboardHandler,
  RegisterKeyboardRegion,
} from "./keyboard.js";
import { latestCheckpoint } from "./screen-model.js";

const pack = JSON.parse(fixtureJson) as DrillPackDefinition;
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
  it("shows pack mode, difficulty band, and honest review status", async () => {
    const onSelect = vi.fn<(packId: string) => void>();
    const summary: PackSummary = {
      id: pack.id,
      version: pack.version,
      digest: `sha256:${"a".repeat(64)}`,
      title: pack.title as string,
      mode: pack.mode as string,
      difficulty: pack.difficulty,
      reviewStatus: "schema_example",
    };
    const component = mount(PackList, {
      target: target(),
      props: { packs: [summary], onSelect },
    });

    expect(document.body.textContent).toContain("advanced club");
    expect(document.body.textContent).toContain("schema example");
    document.querySelector<HTMLButtonElement>(".pack-card button")!.click();
    expect(onSelect).toHaveBeenCalledWith(pack.id);
    await unmount(component);
  });

  it("composes board, objective, why-banner, timeline preview, branch rail, and checkpoint sheet", async () => {
    const run = branchedRun();
    const onRewind = vi.fn();
    const component = mount(DrillScreen, {
      target: target(),
      props: {
        pack,
        snapshot: { run, access: "writer", pendingEvidence: 0 },
        checkpoint: latestCheckpoint(pack, run),
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

    document.querySelector<HTMLButtonElement>(".timeline li button")!.click();
    await tick();
    expect(document.body.textContent).toContain("Preview");
    document.querySelector<HTMLButtonElement>(".timeline .confirm")!.click();
    expect(onRewind).toHaveBeenCalledWith({ nodeId: "screen-run:node:1" });
    await unmount(component);
  });

  it("renders aligned dual-board comparison with absent-side dimming and strips", async () => {
    const run = branchedRun();
    const comparison = compare(run, run.branches[0]!.id, run.branches[1]!.id);
    const component = mount(CompareView, {
      target: target(),
      props: {
        run,
        pack,
        comparison,
        branchLabels: ["main", "early queenside"],
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
    expect(document.body.textContent).toContain("predict-reply");
    expect(document.body.textContent).toContain("timing-window");
    expect(document.body.textContent).toContain("active → achieved");
    expect(document.body.textContent).toContain(
      "Checkpoint reached: Critical race resolved.",
    );
    expect(document.querySelectorAll(".fork-marker")).toHaveLength(1);
    expect(
      document.querySelectorAll(
        '.evidence-cell[data-ply-offset="0"] .evidence-entry',
      ),
    ).toHaveLength(2);
    expect(document.body.textContent).toContain("M-2");
    expectDisabledControlsExplained();
    await unmount(component);
  });

  it("rejects an ungrounded objective transition instead of inventing copy", () => {
    const run = branchedRun();
    const comparison = compare(run, run.branches[0]!.id, run.branches[1]!.id);
    const grounded = comparison.objectiveTimelines.b[0]!;
    const invalid = {
      ...comparison,
      objectiveTimelines: {
        ...comparison.objectiveTimelines,
        b: [{ ...grounded, evidenceRefs: [] }],
      },
    };

    expect(() =>
      mount(CompareView, {
        target: target(),
        props: {
          run,
          pack,
          comparison: invalid,
          branchLabels: ["main", "early queenside"],
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
        snapshot: { run, access: "writer", pendingEvidence: 0 },
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
