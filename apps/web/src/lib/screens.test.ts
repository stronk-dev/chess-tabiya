// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  appendEvents,
  attachEvidence,
  BOT_PROFILE_CATALOG,
  commitMove,
  compareBranches,
  createRun,
  fork,
  reachCheckpoint,
  revealFeedback,
  rewind,
  transitionObjective,
  MODULE_SOURCE_AUTHORITY,
  compileAuthoritativeAssistance,
  finalizeAssistanceEffects,
  serverAvailabilityFromProviders,
  type DrillRun,
  type FinalizedAssistanceV1,
  type OrdinaryWorkflowContextOrigin,
  type RequestedAssistanceV1,
  type RunMark,
} from "@chess-tabiya/runtime";
import type { ComponentProps } from "svelte";
import { mount, tick, unmount } from "svelte";
import { botRosterFixture } from "./bot-roster.test-support.js";
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
import WhyBanner from "./WhyBanner.svelte";
import type { Capabilities, PackSummary, ShapeEntryView, SimulationResult, VoicePage } from "./api.js";
import type {
  RegionKeyboardHandler,
  RegisterKeyboardRegion,
} from "./keyboard.js";
import { latestCheckpoint } from "./screen-model.js";
import { workflowPreferenceKey } from "./assistance-preference.js";

const assistanceKey = (context: string): string => `tabiya.assistance.v1.${context}`;
const workflowKey = (context: string): string => `tabiya.workflow.v1.${context}`;

/** Test double for the server stage (rest.ts `POST /runs/:id/assistance`): same runtime functions, permissive host access. */
const TEST_ORIGINS: Readonly<Record<string, OrdinaryWorkflowContextOrigin>> = {
  pack: { sessionKind: "pack", feedbackPolicy: "attempt_end" },
  position: { sessionKind: "position", feedbackPolicy: "attempt_end" },
  imported: { sessionKind: "imported", feedbackPolicy: "attempt_end" },
  onramp: { sessionKind: "pack", feedbackPolicy: "immediate_guard" },
  match: { sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "match" },
  stream: { sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "stream" },
  academy: { sessionKind: "position", feedbackPolicy: "attempt_end", liveKind: "academy" },
};
async function testAssistanceAuthority(request: RequestedAssistanceV1): Promise<FinalizedAssistanceV1> {
  const availability = serverAvailabilityFromProviders({ opponent: "mock", judge: "mock", llm: "external", corpus: "mock", tts: "external", tablebase: "none" });
  const authoritative = compileAuthoritativeAssistance(request, { origin: TEST_ORIGINS[request.contextHint]!, access: { deliveryOpen: true, role: "host", seatedInContest: false, reviewing: false }, availability });
  return finalizeAssistanceEffects(authoritative, { authority: MODULE_SOURCE_AUTHORITY, availability });
}
function explicitPreference(preset: string, overrides: Record<string, string> = {}): string {
  return JSON.stringify({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset, overrides, moduleOverrides: { include: [], exclude: [] } } });
}
async function assistanceSettled(): Promise<void> {
  await vi.waitFor(() => expect(document.querySelector("[data-preset-state]")?.getAttribute("data-preset-state")).toBe("ready"));
}
function mountDrill(options: { readonly target: HTMLElement; readonly props: ComponentProps<typeof DrillScreen> }) {
  return mount(DrillScreen, { target: options.target, props: { onAssistanceQuery: testAssistanceAuthority, ...options.props } });
}
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

function groupedRun(): DrillRun {
  const run = branchedRun();
  const [main, alternative] = run.branches;
  return appendEvents(run, [{
    type: "group.created",
    at,
    data: {
      groupId: `${run.id}:group:1`,
      sourceNodeId: alternative!.forkNodeId,
      source: "hand_picked",
      resistance: "fixed",
      members: [
        { branchId: main!.id, seedMoveUci: "e7e6" },
        { branchId: alternative!.id, seedMoveUci: "b7b5" },
      ],
    },
  }]);
}

function nestedForkRun(): DrillRun {
  let run = createRun({
    id: "nested-fork-run",
    packId: pack.id,
    packDigest: `sha256:${"b".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    seed: 7,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { at }).run;
  const shallowFork = run.activeCursor.nodeId;
  run = commitMove(run, "e7e5", { at }).run;
  const deepFork = run.activeCursor.nodeId;
  run = commitMove(run, "g1f3", { at }).run;
  run = rewind(run, deepFork, at).run;
  run = fork(run, deepFork, { label: "Bishop development", at }).run;
  run = commitMove(run, "f1c4", { at }).run;
  run = rewind(run, shallowFork, at).run;
  run = fork(run, shallowFork, { label: "Sicilian reply", at }).run;
  run = commitMove(run, "c7c5", { at }).run;
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
  it("renders an unresolved checkpoint without exposing its storage id", async () => {
    let run = createRun({
      id: "checkpoint-copy-run",
      packId: pack.id,
      packDigest: `sha256:${"1".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      startFen: pack.start.fen,
      seed: 1,
      createdAt: at,
    });
    run = commitMove(run, "c1e3", { at }).run;
    run = reachCheckpoint(run, "internal-stop", at).run;
    const withoutLabel = { ...pack, checkpoints: [{ id: "internal-stop", trigger: { atPly: 1 } }] } as DrillPackDefinition;
    const checkpoint = latestCheckpoint(withoutLabel, run);
    const component = mountDrill({ target: target(), props: {
      pack: withoutLabel,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      checkpoint,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();

    expect(document.querySelector('[role="dialog"] h2')?.textContent).toBe("Recorded checkpoint");
    expect(document.body.textContent).not.toContain("internal-stop");
    await unmount(component);
  });

  it("keeps objective-change evidence detail out of ordinary Support copy", async () => {
    const component = mount(WhyBanner, {
      target: target(),
      props: {
        model: {
          state: "degraded",
          eventSeq: 7,
          sentences: [
            { reference: "rules:structure-outpost", sourceLabel: "Rules", text: "Tabiya's strict outpost detector condition holds." },
            { reference: "engine:root", sourceLabel: "Engine", text: "Centipawn evidence recorded." },
          ],
        },
      },
    });
    await tick();

    const banner = document.querySelector<HTMLElement>(".why-banner")!;
    expect(banner.textContent).toContain("Objective weakened");
    expect(banner.textContent).toContain("A rules-based position feature affected the drill objective.");
    expect(banner.textContent).toContain("A recorded engine assessment affected the drill objective.");
    expect(banner.textContent).not.toContain("detector");
    expect(banner.textContent).not.toContain("Centipawn");
    expect(banner.textContent).not.toContain("Engine ·");
    await unmount(component);
  });

  it("turns a real first run into a four-step rehearsal and opens its two preserved attempts", async () => {
    const run = branchedRun();
    const onCompare = vi.fn();
    const onFirstRehearsalComplete = vi.fn();
    const component = mountDrill({ target: target(), props: {
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
    const guideStatus = guide.querySelector<HTMLElement>('[role="status"]')!;
    expect(guideStatus.textContent).toContain("First rehearsal, step 4 of 4");
    expect(guideStatus.getAttribute("aria-atomic")).toBe("true");
    expect(guideStatus.querySelector("button, [tabindex]")).toBeNull();
    expect(guide.getAttribute("aria-live")).toBeNull();
    const compare = [...guide.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.includes("Compare both attempts"))!;
    compare.click();
    await tick();

    expect(onCompare).toHaveBeenCalledWith(run.branches.slice(0, 2).map((branch) => branch.id));
    expect(onFirstRehearsalComplete).toHaveBeenCalledOnce();
    await unmount(component);
  });

  it("previews authored consequences as scratch positions and offers explicit entry", async () => {
    let run = createRun({
      id: "simulation-ui",
      packId: pack.id,
      packDigest: `sha256:${"8".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      startFen: pack.start.fen,
      seed: 8,
      createdAt: at,
    });
    run = commitMove(run, "c1e3", { actor: "system", at }).run;
    run = commitMove(run, "e7e6", { actor: "system", at }).run;
    const onSimulate = vi.fn();
    let component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), onSimulate,
      registerKeyboardRegion,
    } });
    await tick();
    const previewButton = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Preview authored lines")!;
    expect(previewButton.disabled).toBe(false);
    previewButton.click();
    await tick();
    expect(onSimulate).toHaveBeenCalledOnce();
    await unmount(component);

    document.body.replaceChildren();
    const simulation: SimulationResult = {
      simulationId: "simulation-one",
      comparison: { machineFeedback: "available", forkNodeId: run.activeCursor.nodeId, columns: [], rows: [], objectiveTimelines: {}, checkpointHits: {}, evidence: {}, lines: {}, consequences: {} },
      branches: [
        { index: 0, label: "f3", leafFen: run.nodes.at(-1)!.fen, plies: 2, truncatedAt: "internal-authored-node-4" },
        { index: 1, label: "Be2", leafFen: run.nodes.at(-1)!.fen, plies: 1 },
      ],
    };
    const onEnterSimulation = vi.fn(async () => true);
    const onCloseSimulation = vi.fn();
    component = mountDrill({ target: target(), props: {
      pack,
      simulation,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), onSimulate,
      onEnterSimulation, onCloseSimulation, registerKeyboardRegion,
    } });
    await tick();
    const dialog = document.querySelector<HTMLElement>('[aria-labelledby="simulation-title"]')!;
    expect(dialog.textContent).toContain("These are demonstrations from the drill, not moves added to your attempt");
    expect(dialog.textContent).toContain("f3");
    expect(dialog.textContent).toContain("Be2");
    expect(dialog.textContent).toContain("This preview stops before a later authored position.");
    expect(dialog.textContent).not.toContain("internal-authored-node-4");
    expect(dialog.textContent).not.toContain("drill node");
    expect(dialog.querySelectorAll(":scope > .line-grid > article > .board")).toHaveLength(2);
    dialog.querySelector<HTMLButtonElement>('button[aria-label="Close authored line preview"]')!.click();
    expect(onCloseSimulation).toHaveBeenCalledOnce();
    const enter = [...dialog.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Enter this line")!;
    enter.click();
    expect(onEnterSimulation).toHaveBeenCalledWith(0);
    await unmount(component);
  });

  it("keeps an authored-line preview actionable when entry fails", async () => {
    let run = createRun({
      id: "simulation-retry-ui",
      packId: pack.id,
      packDigest: `sha256:${"8".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      startFen: pack.start.fen,
      seed: 8,
      createdAt: at,
    });
    run = commitMove(run, "c1e3", { actor: "system", at }).run;
    const simulation: SimulationResult = {
      simulationId: "simulation-retry",
      comparison: { machineFeedback: "available", forkNodeId: run.activeCursor.nodeId, columns: [], rows: [], objectiveTimelines: {}, checkpointHits: {}, evidence: {}, lines: {}, consequences: {} },
      branches: [{ index: 0, label: "f3", leafFen: run.nodes.at(-1)!.fen, plies: 2 }],
    };
    let settle!: (accepted: boolean) => void;
    const onEnterSimulation = vi.fn(() => new Promise<boolean>((resolve) => { settle = resolve; }));
    const onCloseSimulation = vi.fn();
    const component = mountDrill({ target: target(), props: {
      pack,
      simulation,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onEnterSimulation, onCloseSimulation, registerKeyboardRegion,
    } });
    await tick();
    const dialog = document.querySelector<HTMLElement>('[aria-labelledby="simulation-title"]')!;
    const enter = [...dialog.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Enter this line")!;
    const close = dialog.querySelector<HTMLButtonElement>('button[aria-label="Close authored line preview"]')!;

    enter.click();
    enter.click();
    await tick();
    expect(onEnterSimulation).toHaveBeenCalledOnce();
    expect(enter.disabled).toBe(true);
    expect(close.disabled).toBe(true);
    expect(dialog.querySelector('[role="status"]')?.textContent).toContain("preview will close only after the run has changed");

    settle(false);
    await vi.waitFor(() => expect(dialog.querySelector('[role="alert"]')?.textContent).toContain("run and this preview are unchanged"));
    expect(enter.disabled).toBe(false);
    expect(enter.textContent).toContain("Try this line again");

    enter.click();
    await tick();
    expect(onEnterSimulation).toHaveBeenCalledTimes(2);
    settle(true);
    await tick();
    await unmount(component);
  });

  it("makes authored-line preview creation single-flight and retryable at its action", async () => {
    let run = createRun({
      id: "simulation-open-retry-ui",
      packId: pack.id,
      packDigest: `sha256:${"8".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      startFen: pack.start.fen,
      seed: 8,
      createdAt: at,
    });
    run = commitMove(run, "c1e3", { actor: "system", at }).run;
    run = commitMove(run, "e7e6", { actor: "system", at }).run;
    let settle!: (accepted: boolean) => void;
    const onSimulate = vi.fn(() => new Promise<boolean>((resolve) => { settle = resolve; }));
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onSimulate, registerKeyboardRegion,
    } });
    await tick();
    const preview = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Preview authored lines")!;

    preview.click();
    preview.click();
    await tick();
    expect(onSimulate).toHaveBeenCalledOnce();
    expect(preview.disabled).toBe(true);
    expect(document.querySelector("#drill-simulation-opening")?.textContent).toContain("Preparing scratch lines");

    settle(false);
    await vi.waitFor(() => expect(document.querySelector("#drill-simulation-error")?.textContent).toContain("preview did not open"));
    expect(preview.disabled).toBe(false);
    expect(preview.textContent).toContain("Try authored lines again");

    preview.click();
    await tick();
    expect(onSimulate).toHaveBeenCalledTimes(2);
    settle(true);
    await tick();
    await unmount(component);
  });

  it("keeps a drawn mark in parent state and saves it against the node where the gesture began", async () => {
    vi.useFakeTimers();
    const run = branchedRun();
    const onSaveMarks = vi.fn(() => new Promise<never>(() => {}));
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), onLoadMarks: async () => [], onSaveMarks,
      registerKeyboardRegion,
    } });
    await tick();

    chessground.configs.at(-1)!.drawable!.onChange!([{ orig: "a1", dest: "h8", brush: "red" }]);
    await tick();
    const earlier = document.querySelector<HTMLButtonElement>('.timeline button[aria-label^="Rehearsal step 1:"]')!;
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

  it("keeps the newest board marks when an older save response arrives last", async () => {
    vi.useFakeTimers();
    const run = branchedRun();
    const first = deferred<readonly RunMark[]>();
    const second = deferred<readonly RunMark[]>();
    const onSaveMarks = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), onLoadMarks: async () => [], onSaveMarks,
      registerKeyboardRegion,
    } });
    await tick();

    const scopeKey = run.nodes.at(-1)!.transposeKey;
    const oneMark: readonly RunMark[] = [
      { scope: "position", scopeKey, brush: "red", orig: "a1", dest: "h8", at },
    ];
    const twoMarks: readonly RunMark[] = [
      ...oneMark,
      { scope: "position", scopeKey, brush: "blue", orig: "b1", dest: "b8", at },
    ];
    chessground.configs.at(-1)!.drawable!.onChange!([{ orig: "a1", dest: "h8", brush: "red" }]);
    vi.advanceTimersByTime(400);
    await tick();
    chessground.configs.at(-1)!.drawable!.onChange!([
      { orig: "a1", dest: "h8", brush: "red" },
      { orig: "b1", dest: "b8", brush: "blue" },
    ]);
    vi.advanceTimersByTime(400);
    await tick();

    second.resolve(twoMarks);
    await tick();
    first.resolve(oneMark);
    await tick();
    expect(document.querySelector('[aria-label="Board marks"]')?.textContent).toContain("2/64 marks");
    expect(onSaveMarks).toHaveBeenCalledTimes(2);

    await unmount(component);
    vi.useRealTimers();
  });

  it("keeps failed optimistic marks visible and retries without exposing provider errors", async () => {
    vi.useFakeTimers();
    const run = branchedRun();
    const persisted: readonly RunMark[] = [
      { scope: "position", scopeKey: run.nodes.at(-1)!.transposeKey, brush: "green", orig: "c1", dest: "c8", at },
    ];
    const onSaveMarks = vi.fn()
      .mockRejectedValueOnce(new Error("sqlite write failed at /private/data"))
      .mockResolvedValueOnce(persisted);
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), onLoadMarks: async () => [], onSaveMarks,
      registerKeyboardRegion,
    } });
    await tick();

    chessground.configs.at(-1)!.drawable!.onChange!([{ orig: "c1", dest: "c8", brush: "green" }]);
    await vi.advanceTimersByTimeAsync(400);
    await tick();
    const alert = document.querySelector<HTMLElement>('[aria-label="Board marks"] [role="alert"]')!;
    expect(alert.textContent).toContain("remain visible on this screen");
    expect(alert.textContent).not.toContain("sqlite");
    expect(document.querySelector('[aria-label="Board marks"]')?.textContent).toContain("1/64 marks");

    [...document.querySelectorAll<HTMLButtonElement>('[aria-label="Board marks"] button')]
      .find((button) => button.textContent === "Retry saving marks")!
      .click();
    await Promise.resolve();
    await tick();
    expect(onSaveMarks).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[aria-label="Board marks"] [role="alert"]')).toBeNull();
    expect(document.querySelector('[aria-label="Board marks"]')?.textContent).toContain("1/64 marks");

    await unmount(component);
    vi.useRealTimers();
  });

  it("recovers mark loading and rescoping through the same visible persistence state", async () => {
    const run = branchedRun();
    const node = run.nodes.at(-1)!;
    const positionMark: RunMark = {
      scope: "position", scopeKey: node.transposeKey, brush: "yellow", orig: "d4", at,
    };
    const branchMark: RunMark = {
      ...positionMark, scope: "branch", scopeKey: `${run.activeCursor.branchId}:${node.id}`,
    };
    const onLoadMarks = vi.fn()
      .mockRejectedValueOnce(new Error("private load detail"))
      .mockResolvedValueOnce([positionMark]);
    const onRescopeMarks = vi.fn()
      .mockRejectedValueOnce(new Error("private rescope detail"))
      .mockResolvedValueOnce([branchMark]);
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(),
      onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(),
      onExport: vi.fn(), onStop: vi.fn(), onLoadMarks, onSaveMarks: vi.fn(), onRescopeMarks,
      registerKeyboardRegion,
    } });
    const markControls = document.querySelector<HTMLElement>('[aria-label="Board marks"]')!;
    await vi.waitFor(() => expect(markControls.querySelector('[role="alert"]')?.textContent).toContain("Saved board marks are unavailable"));
    expect(markControls.textContent).not.toContain("private load detail");
    [...markControls.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Retry loading marks")!
      .click();
    await vi.waitFor(() => expect(markControls.textContent).toContain("1/64 marks"));

    [...markControls.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Move marks to the other scope")!
      .click();
    await vi.waitFor(() => expect(markControls.querySelector('[role="alert"]')?.textContent).toContain("could not be moved"));
    expect(markControls.textContent).not.toContain("private rescope detail");
    [...markControls.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Retry moving marks")!
      .click();
    await vi.waitFor(() => expect(onRescopeMarks).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(markControls.querySelector<HTMLSelectElement>("select")?.value).toBe("branch"));
    expect(markControls.textContent).toContain("1/64 marks");

    await unmount(component);
  });

  it("keeps read-only followers on inspect-only controls without write errors", async () => {
    const run = branchedRun();
    const onRewind = vi.fn();
    const onFork = vi.fn();
    const onCreateGroup = vi.fn();
    const component = mountDrill({ target: target(), props: {
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
    expect(document.body.textContent).toContain("Watching");
    expect(document.body.textContent).toContain("moves and rewinds happen there");
    expect(document.body.textContent).not.toContain("Read-only follower");
    expect(document.body.textContent).not.toContain("Another browser owns");

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

  it("creates a branch group once and preserves its choices for a safe retry", async () => {
    const run = branchedRun();
    const first = deferred<import("./api.js").CreateGroupResult>();
    const onCreateGroup = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce({
        run,
        group: { sourceNodeId: run.activeCursor.nodeId },
      } as unknown as import("./api.js").CreateGroupResult);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onCreateGroup, registerKeyboardRegion,
    } });
    await tick();

    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Branch group")!
      .click();
    await tick();
    const creator = document.querySelector<HTMLElement>(".group-creator")!;
    const legalMoves = [...chessground.configs.at(-1)!.movable!.dests!.entries()]
      .flatMap(([from, destinations]) => destinations.map((to) => [from, to] as const));
    expect(legalMoves.length).toBeGreaterThanOrEqual(2);
    chessground.configs.at(-1)!.movable!.events!.after!(...legalMoves[0]!, {} as never);
    chessground.configs.at(-1)!.movable!.events!.after!(...legalMoves[1]!, {} as never);
    await tick();
    const create = [...creator.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Create group")!;
    create.click();
    await tick();
    expect(create.disabled).toBe(true);
    expect(create.textContent).toContain("Creating group");
    create.click();
    expect(onCreateGroup).toHaveBeenCalledTimes(1);

    first.reject(new Error("private group storage detail"));
    await vi.waitFor(() => expect(creator.querySelector("[role='alert']")?.textContent).toContain("Your choices are still here"));
    expect(creator.textContent).not.toContain("private group storage detail");
    expect(creator.querySelectorAll(".candidate-chips button")).toHaveLength(2);
    expect(create.disabled).toBe(false);

    create.click();
    await vi.waitFor(() => expect(onCreateGroup).toHaveBeenCalledTimes(2));
    expect(onCreateGroup).toHaveBeenLastCalledWith({
      source: "hand_picked",
      resistance: "fixed",
      candidates: legalMoves.slice(0, 2).map(([from, to]) => `${from}${to}`),
    });
    await vi.waitFor(() => expect(document.querySelector(".group-creator")).toBeNull());
    await unmount(component);
  });

  it("refuses a branch-group response crossed from another run", async () => {
    const run = branchedRun();
    const onCreateGroup = vi.fn().mockResolvedValue({
      run: { ...run, id: "crossed-run" },
      group: { sourceNodeId: run.activeCursor.nodeId },
    } as unknown as import("./api.js").CreateGroupResult);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onCreateGroup, registerKeyboardRegion,
    } });
    await tick();
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Branch group")!
      .click();
    await tick();
    const creator = document.querySelector<HTMLElement>(".group-creator")!;
    const legalMoves = [...chessground.configs.at(-1)!.movable!.dests!.entries()]
      .flatMap(([from, destinations]) => destinations.map((to) => [from, to] as const));
    chessground.configs.at(-1)!.movable!.events!.after!(...legalMoves[0]!, {} as never);
    chessground.configs.at(-1)!.movable!.events!.after!(...legalMoves[1]!, {} as never);
    await tick();
    const create = [...creator.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Create group")!;
    create.click();

    await vi.waitFor(() => expect(creator.querySelector("[role='alert']")?.textContent).toContain("did not match this run and position"));
    expect(create.disabled).toBe(true);
    expect(creator.textContent).not.toContain("crossed-run");
    expect(document.querySelector(".group-creator")).toBe(creator);
    await unmount(component);
  });

  it("keeps fork intent for a single-flight retry after creation fails", async () => {
    const run = branchedRun();
    const first = deferred<boolean>();
    const onFork = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork, onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.getAttribute("aria-label") === "Fork branch")!
      .click();
    await tick();
    const dialog = document.querySelector<HTMLElement>('[aria-labelledby="fork-title"]')!;
    const intent = dialog.querySelector<HTMLTextAreaElement>("textarea")!;
    const label = dialog.querySelector<HTMLInputElement>("input")!;
    intent.value = "Keep the knight and challenge the centre";
    intent.dispatchEvent(new Event("input", { bubbles: true }));
    label.value = "Knight plan";
    label.dispatchEvent(new Event("input", { bubbles: true }));
    const create = dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    create.click();
    await tick();
    expect(create.disabled).toBe(true);
    expect(create.textContent).toContain("Creating branch");
    create.click();
    expect(onFork).toHaveBeenCalledTimes(1);

    first.resolve(false);
    await vi.waitFor(() => expect(dialog.querySelector("[role='alert']")?.textContent).toContain("name and intent are still here"));
    expect(intent.value).toBe("Keep the knight and challenge the centre");
    expect(label.value).toBe("Knight plan");
    expect(create.disabled).toBe(false);

    create.click();
    await vi.waitFor(() => expect(onFork).toHaveBeenCalledTimes(2));
    expect(onFork).toHaveBeenLastCalledWith("Knight plan", "Keep the knight and challenge the centre");
    await vi.waitFor(() => expect(document.querySelector('[aria-labelledby="fork-title"]')).toBeNull());
    await unmount(component);
  });

  it("keeps a failed checkpoint continuation open for a single-flight retry", async () => {
    const run = branchedRun();
    const checkpoint = latestCheckpoint(pack, run)!;
    const first = deferred<boolean>();
    const onContinueCheckpoint = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      checkpoint,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint, onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    const sheet = document.querySelector<HTMLElement>('[aria-labelledby="checkpoint-title"]')!;
    const continueButton = [...sheet.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Continue")!;
    const rewindButton = [...sheet.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Rewind here")!;
    continueButton.click();
    await tick();
    expect(continueButton.disabled).toBe(true);
    expect(rewindButton.disabled).toBe(true);
    continueButton.click();
    expect(onContinueCheckpoint).toHaveBeenCalledTimes(1);

    first.resolve(false);
    await vi.waitFor(() => expect(sheet.querySelector("[role='alert']")?.textContent).toContain("position is unchanged"));
    expect(continueButton.disabled).toBe(false);
    expect(document.querySelector('[aria-labelledby="checkpoint-title"]')).toBe(sheet);

    continueButton.click();
    await vi.waitFor(() => expect(onContinueCheckpoint).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(sheet.querySelector("[role='alert']")).toBeNull());
    await unmount(component);
  });

  it("keeps a failed timeline rewind on its selected preview for retry", async () => {
    const run = branchedRun();
    const first = deferred<boolean>();
    const onRewind = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind, onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    document.querySelector<HTMLButtonElement>(".timeline ol button")!.click();
    await tick();
    const timeline = document.querySelector<HTMLElement>(".timeline")!;
    const rewindButton = timeline.querySelector<HTMLButtonElement>('button[aria-label="Rewind to preview"]')!;

    rewindButton.click();
    rewindButton.click();
    await tick();
    expect(onRewind).toHaveBeenCalledOnce();
    expect(rewindButton.disabled).toBe(true);
    expect(timeline.querySelector("#timeline-rewind-busy")?.textContent).toContain("target remains selected");

    first.resolve(false);
    await vi.waitFor(() => expect(timeline.querySelector("#timeline-rewind-error")?.textContent).toContain("target are unchanged"));
    expect(timeline.querySelector(".preview")).not.toBeNull();
    expect(rewindButton.disabled).toBe(false);
    expect(rewindButton.textContent).toContain("Try rewind again");

    rewindButton.click();
    await vi.waitFor(() => expect(onRewind).toHaveBeenCalledTimes(2));
    await unmount(component);
  });

  it("keeps a failed checkpoint rewind visible and retryable", async () => {
    const run = branchedRun();
    const checkpoint = latestCheckpoint(pack, run)!;
    const first = deferred<boolean>();
    const onRewind = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      checkpoint,
      onMove: vi.fn(), onRewind, onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    const sheet = document.querySelector<HTMLElement>('[aria-labelledby="checkpoint-title"]')!;
    const rewindButton = [...sheet.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Rewind here")!;

    rewindButton.click();
    rewindButton.click();
    await tick();
    expect(onRewind).toHaveBeenCalledOnce();
    expect([...sheet.querySelectorAll<HTMLButtonElement>(".actions button")].every((button) => button.disabled)).toBe(true);
    expect(sheet.querySelector("#checkpoint-rewind-busy")?.textContent).toContain("remains open");

    first.resolve(false);
    await vi.waitFor(() => expect(sheet.querySelector("#checkpoint-rewind-error")?.textContent).toContain("target are unchanged"));
    expect(document.querySelector('[aria-labelledby="checkpoint-title"]')).toBe(sheet);
    expect(rewindButton.textContent).toContain("Try rewind again");

    rewindButton.click();
    await vi.waitFor(() => expect(onRewind).toHaveBeenCalledTimes(2));
    await unmount(component);
  });

  it("keeps checkpoint comparison single-flight and retryable inside the checkpoint", async () => {
    const run = branchedRun();
    const checkpoint = latestCheckpoint(pack, run)!;
    const first = deferred<boolean>();
    const onCompare = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      checkpoint,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare,
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    const sheet = document.querySelector<HTMLElement>('[aria-labelledby="checkpoint-title"]')!;
    const compareButton = [...sheet.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Compare")!;

    compareButton.click();
    compareButton.click();
    await tick();
    expect(onCompare).toHaveBeenCalledOnce();
    expect([...sheet.querySelectorAll<HTMLButtonElement>(".actions button")].every((button) => button.disabled)).toBe(true);
    expect(sheet.querySelector("#checkpoint-compare-busy")?.textContent).toContain("checkpoint remains open");

    first.resolve(false);
    await vi.waitFor(() => expect(sheet.querySelector("#checkpoint-compare-error")?.textContent).toContain("branches are unchanged"));
    expect(compareButton.disabled).toBe(false);
    expect(compareButton.textContent).toContain("Try comparison again");
    expect(document.querySelector('[aria-labelledby="checkpoint-title"]')).toBe(sheet);

    compareButton.click();
    await vi.waitFor(() => expect(onCompare).toHaveBeenCalledTimes(2));
    await unmount(component);
  });

  it("keeps run-action comparison single-flight and retryable at its invoker", async () => {
    const run = branchedRun();
    const first = deferred<boolean>();
    const onCompare = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare,
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    const compareButton = document.querySelector<HTMLButtonElement>('button[aria-label="Compare branches"]')!;

    compareButton.click();
    compareButton.click();
    await tick();
    expect(onCompare).toHaveBeenCalledOnce();
    expect(compareButton.disabled).toBe(true);
    expect(document.querySelector("#drill-compare-opening")?.textContent).toContain("Preparing the selected branch comparison");

    first.resolve(false);
    await vi.waitFor(() => expect(document.querySelector("#drill-compare-error")?.textContent).toContain("branches are unchanged"));
    expect(compareButton.disabled).toBe(false);
    expect(compareButton.textContent).toContain("Try comparison again");

    compareButton.click();
    await vi.waitFor(() => expect(onCompare).toHaveBeenCalledTimes(2));
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
    const component = mountDrill({ target: target(), props: { snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage, capabilities, onVoice, onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion } });
    await vi.waitFor(() => expect(document.querySelector(".pivotal-marker")).not.toBeNull());
    // A stale tab's legacy write is not an authority any more (rfc/intent-presets.md §5.3).
    preferences.set(assistanceKey("position"), JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "persona", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }));
    globalThis.dispatchEvent(new StorageEvent("storage", { key: assistanceKey("position") }));
    await tick();
    expect(document.querySelector(".pivotal-marker")).not.toBeNull();
    preferences.set(workflowPreferenceKey("position"), explicitPreference("quiet", { markers: "off", voice: "persona" }));
    globalThis.dispatchEvent(new StorageEvent("storage", { key: workflowPreferenceKey("position") }));
    await vi.waitFor(() => expect(document.querySelector(".pivotal-marker")).toBeNull());
    preferences.set(workflowPreferenceKey("position"), explicitPreference("quiet", { markers: "live", voice: "persona" }));
    globalThis.dispatchEvent(new StorageEvent("storage", { key: workflowPreferenceKey("position") }));
    await vi.waitFor(() => expect(document.querySelector(".pivotal-marker")).not.toBeNull());
    expect(document.querySelector('.guidance-panel[role="dialog"]')).toBeNull();
    document.querySelector<HTMLButtonElement>(".pivotal-marker")!.click(); await tick();
    expect(document.querySelector(".guidance-panel")?.textContent).toContain("This move changed something concrete");
    expect(document.querySelector(".guidance-panel")?.textContent).not.toContain("phase bands");
    document.querySelector<HTMLButtonElement>(".guidance-panel button")!.click(); await tick();
    expect(document.querySelector('[aria-label="Recorded moment evidence"]')?.textContent).toContain("material-census convention");
    const revoice = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Revoice this evidence")!;
    revoice.click(); await tick();
    expect(onVoice).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect([...document.querySelectorAll("p")].filter((element) => element.textContent === RECORDED_READING_GUARD)).toHaveLength(1));
    const checkbox = document.querySelector<HTMLInputElement>('.assistance-grid input[type="checkbox"]')!;
    checkbox.click(); await tick();
    await vi.waitFor(() => expect(document.querySelector(".pivotal-marker")).toBeNull());
    document.querySelector<HTMLButtonElement>(".inspector-surface header button")!.click(); await tick();
    await unmount(component);
  });

  it("inspects and revoices current-position endgame evidence without a pivotal marker", async () => {
    let run = createRun({
      id: "endgame-without-marker",
      session: {
        kind: "position",
        start: { fen: "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1", side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common" },
      },
      sessionDigest: `sha256:${"a".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    run = commitMove(run, "b2b3").run;
    run = commitMove(run, "h8h7").run;
    const onVoice = vi.fn(async (_nodeId: string, scope: VoicePage["scope"]) => ({
      text: "Recorded reading at this position: rook and pawn versus rook.",
      source: "provider" as const,
      scope,
    }));
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      capabilities: { providers: { opponent: "mock", judge: "mock", llm: "external", corpus: "none", tts: "none", tablebase: "none" } } as Capabilities,
      assistanceStorage: { getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "persona", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onVoice,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    expect(document.querySelector(".pivotal-marker")).toBeNull();
    const inspectorButton = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Inspector")!;
    inspectorButton.click();
    await tick();
    const endgameEvidence = document.querySelector('[aria-label="Current-position endgame evidence"]')!;
    expect(endgameEvidence.textContent).toContain("Rook and pawn versus rook");
    // rfc/evidence-value-authority §3.4: material classification never names a technique, and this
    // KRPKR position fails every registered setup convention (lucena-setup@1,
    // philidor-third-rank-setup@1, vancura-setup@1), so no technique is named.
    expect(endgameEvidence.textContent).not.toMatch(/Lucena|Philidor|Vancura|Vančura/u);
    const revoice = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Revoice current-position evidence")!;
    revoice.click();
    await vi.waitFor(() => expect(onVoice).toHaveBeenCalledWith(run.activeCursor.nodeId, "reading"));
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Current-position evidence rendering"]')?.textContent).toContain("rook and pawn versus rook"));
    document.querySelector<HTMLButtonElement>('.timeline button[aria-label^="Rehearsal step 1:"]')!.click();
    await tick();
    expect(document.querySelector('[aria-label="Current-position evidence rendering"]')?.textContent).not.toContain("rook and pawn versus rook");
    await unmount(component);
  });

  it("binds concurrent revoicing to the requested moment, position, and scope", async () => {
    const root = createRun({
      id: "scoped-revoice",
      session: { kind: "position", start: { fen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"9".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const pivotal = commitMove(root, "e2e7").run;
    const run = commitMove(pivotal, "e8e7").run;
    let resolveMarker!: (page: VoicePage) => void;
    let resolveReading!: (page: VoicePage) => void;
    const markerResponse = new Promise<VoicePage>((resolve) => { resolveMarker = resolve; });
    const readingResponse = new Promise<VoicePage>((resolve) => { resolveReading = resolve; });
    const onVoice = vi.fn((_nodeId: string, scope: VoicePage["scope"]) => {
      if (onVoice.mock.calls.length === 1) return markerResponse;
      if (onVoice.mock.calls.length === 2) return readingResponse;
      return Promise.resolve({ text: "crossed-scope payload", source: "provider" as const, scope: scope === "reading" ? "marker" as const : "reading" as const });
    });
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      capabilities: { providers: { opponent: "mock", judge: "mock", llm: "external", corpus: "none", tts: "none", tablebase: "none" } } as Capabilities,
      assistanceStorage: { getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "live", guided: "off", humanSplit: "off", corpus: "off", voice: "persona", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onVoice,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await vi.waitFor(() => expect(document.querySelector(".pivotal-marker")).not.toBeNull());
    document.querySelector<HTMLButtonElement>(".pivotal-marker")!.click();
    await tick();
    document.querySelector<HTMLButtonElement>(".guidance-panel button")!.click();
    await tick();

    const markerSection = document.querySelector<HTMLElement>("[aria-label='Recorded moment evidence']")!;
    const readingSection = document.querySelector<HTMLElement>("[aria-label='Current-position evidence rendering']")!;
    markerSection.querySelector<HTMLButtonElement>("button")!.click();
    readingSection.querySelector<HTMLButtonElement>("button")!.click();
    await tick();
    expect(onVoice.mock.calls[0]).toEqual([pivotal.activeCursor.nodeId, "marker"]);
    expect(onVoice.mock.calls[1]).toEqual([run.activeCursor.nodeId, "reading"]);

    resolveReading({ text: "Current-position explanation.", source: "provider", scope: "reading" });
    await readingResponse;
    await tick();
    expect(readingSection.textContent).toContain("Current-position explanation.");
    resolveMarker({ text: "Late marker explanation.", source: "provider", scope: "marker" });
    await markerResponse;
    await tick();
    expect(markerSection.textContent).not.toContain("Late marker explanation.");
    expect(readingSection.textContent).toContain("Current-position explanation.");

    readingSection.querySelector<HTMLButtonElement>("button")!.click();
    await vi.waitFor(() => expect(readingSection.querySelector("[role='alert']")?.textContent).toContain("no longer matches this view"));
    expect(readingSection.textContent).not.toContain("crossed-scope payload");
    await unmount(component);
  });

  it("recovers spoken endgame guidance when the external voice service fails", async () => {
    const run = createRun({
      id: "spoken-endgame-recovery",
      session: { kind: "position", start: { fen: "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"8".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const onSpeech = vi.fn().mockRejectedValue(new Error("tts endpoint detail"));
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      capabilities: { providers: { opponent: "mock", judge: "mock", llm: "none", corpus: "none", tts: "external", tablebase: "none" } } as Capabilities,
      assistanceStorage: { getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "provider", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onSpeech,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Inspector")!.click();
    await tick();
    const section = document.querySelector<HTMLElement>("[aria-label='Current-position endgame evidence']")!;
    const speak = section.querySelector<HTMLButtonElement>("button")!;
    speak.click();
    await vi.waitFor(() => expect(section.querySelector("[role='alert']")?.textContent).toBe("Spoken guidance is unavailable right now. Try again."));
    expect(section.textContent).not.toContain("tts endpoint detail");
    expect(speak.disabled).toBe(false);
    expect(onSpeech).toHaveBeenCalledWith(run.activeCursor.nodeId, "reading");
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
      getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "on" }),
      setItem: vi.fn(),
    };
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await vi.waitFor(() => expect(document.querySelector('button[aria-label="Open assistance"]')).not.toBeNull());

    const ambient = document.querySelector<HTMLButtonElement>('button[aria-label="Open assistance"]')!;
    const tabs = [...document.querySelectorAll<HTMLButtonElement>(".compact-tabs button:not(.sheet-close)")];
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute("aria-pressed")])).toEqual([
      ["Support", "true"],
      ["Branches", "false"],
      ["Actions", "false"],
    ]);
    expect(ambient.getAttribute("aria-controls")).toBe("run-support-region");
    expect(document.querySelector(".rail-stack")?.classList.contains("sheet-open")).toBe(false);
    tabs[2]!.click();
    await tick();
    expect(tabs[2]?.getAttribute("aria-pressed")).toBe("true");
    ambient.click();
    await tick();
    expect(document.querySelector(".rail-stack")?.classList.contains("sheet-open")).toBe(true);
    expect(document.getElementById("run-support-region")?.classList.contains("compact-active")).toBe(true);
    expect(tabs[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(tabs[2]?.getAttribute("aria-pressed")).toBe("false");
    await unmount(component);
  });

  it("keeps the selected help style and its promise visible without exposing evidence switches", async () => {
    const run = createRun({
      id: "support-preset-identity",
      session: { kind: "position", start: { fen: pack.start.fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"6".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const preferences = new Map<string, string>([
      [workflowKey("position"), JSON.stringify({ version: 1, preset: "support" })],
    ]);
    const assistanceStorage = {
      getItem: (key: string) => preferences.get(key) ?? null,
      setItem: (key: string, value: string) => { preferences.set(key, value); },
    };
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();

    const selector = document.querySelector<HTMLDetailsElement>("details.assistance-control")!;
    // The pill shows the learner's requested style at once; the promise waits for the compiled truth.
    expect(selector.querySelector("summary")?.getAttribute("aria-label")).toBe("Support style: Support");
    expect(selector.querySelector(".preset-pill")?.textContent).toBe("Support");
    const promise = "Staged-move risk warnings, on request, before you commit. Never the best move.";
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Active support promise"]')?.textContent).toContain(promise));
    expect(selector.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    // Support activates its modules: the ambient opener and lit sight are on without any raw switch.
    expect(document.querySelector('button[aria-label="Open assistance"]')).not.toBeNull();

    preferences.set(workflowPreferenceKey("position"), explicitPreference("theory_only"));
    globalThis.dispatchEvent(new StorageEvent("storage", { key: workflowPreferenceKey("position") }));
    await vi.waitFor(() => expect(selector.querySelector("summary")?.getAttribute("aria-label")).toBe("Support style: Theory only"));
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Active support promise"]')?.textContent).toContain("no evaluation, no candidates, no line"));
    await unmount(component);
  });

  it("delivers the Post-commit Nudge only through the compiled effect, never retroactively on a preset raise (Checkpoint B, criterion 9)", async () => {
    const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const initial = createRun({ id: "nudge-seat", session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: `sha256:${"3".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const run = revealFeedback(commitMove(initial, "e2e4", { at }).run, at).run;
    const moveNodeId = run.nodes.find((node) => node.moveUci === "e2e4")!.id;
    const onNudge = vi.fn(async (nodeId: string) => ({ runId: run.id, kind: "packet" as const, nodeId, facts: [{ projection: "rules.fixture.fact@1", sentence: "Fixture consequence.", source: "fixture" }], headline: "After e4", closing: "Try the other idea.", receipt: { offered: 1, admitted: 1, afterReducers: 1, noveltyAbstained: false } }));
    const mountWith = (entries: readonly (readonly [string, string])[]) => {
      const preferences = new Map<string, string>(entries);
      return mountDrill({ target: target(), props: {
        snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, onNudge,
        assistanceStorage: { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => { preferences.set(key, value); } },
        onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
        onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
      } });
    };
    const seat = () => document.querySelector('[data-module="postcommit_nudge"]');

    // Guided composes postcommit_nudge: the server-compiled effect admits the seat after disclosure opened.
    let component = mountWith([[workflowPreferenceKey("position"), explicitPreference("guided")]]);
    await vi.waitFor(() => expect(seat()?.textContent).toContain("Fixture consequence."));
    expect(onNudge).toHaveBeenCalledWith(moveNodeId);
    await unmount(component);
    document.body.replaceChildren();
    onNudge.mockClear();

    // Guided with an explicit markers:"off" removes exactly the governed automatic effect.
    component = mountWith([[workflowPreferenceKey("position"), explicitPreference("guided", { markers: "off" })]]);
    await assistanceSettled();
    expect(seat()).toBeNull();
    expect(onNudge).not.toHaveBeenCalled();
    await unmount(component);
    document.body.replaceChildren();

    // Quiet → Guided mid-run with no new learner move renders nothing new (criterion 9 arm a).
    component = mountWith([]);
    await assistanceSettled();
    [...document.querySelectorAll<HTMLInputElement>('.preset-options input[type="radio"]')].find((input) => input.value === "guided")!.click();
    await vi.waitFor(() => expect(document.querySelector('[aria-label="Active support promise"]')?.textContent).toContain("After you commit"));
    await tick();
    expect(onNudge).not.toHaveBeenCalled();
    expect(seat()).toBeNull();
    await unmount(component);
  });

  it("activates each preset's modules from the pill, offers only allowed presets, and states suppressions (criteria 2, 7, 16)", async () => {
    const make = (id: string, liveKind?: "match" | "academy") => ({ run: createRun({
      id,
      session: { kind: "position", start: { fen: pack.start.fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"4".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    }), liveKind });
    const preferences = new Map<string, string>();
    const assistanceStorage = { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => { preferences.set(key, value); } };
    const queries: RequestedAssistanceV1[] = [];
    const onAssistanceQuery = (request: RequestedAssistanceV1) => { queries.push(request); return testAssistanceAuthority(request); };
    const { run } = make("preset-activation");
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage, onAssistanceQuery,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    const footer = () => document.querySelector('[aria-label="Active support promise"]')?.textContent ?? "";
    await vi.waitFor(() => expect(footer()).toContain("no chess guidance appears unless you ask"));
    expect(document.querySelector('button[aria-label="Open assistance"]')).toBeNull();
    const options = [...document.querySelectorAll<HTMLInputElement>('.preset-options input[type="radio"]')];
    expect(options.map((input) => input.value)).toEqual(["quiet", "guided", "theory_only", "support", "analysis"]);
    expect(options.find((input) => input.value === "quiet")?.checked).toBe(true);

    // Guided: the ambient opener (on_request modules) and the named-pattern / marker effects turn on.
    options.find((input) => input.value === "guided")!.click();
    await vi.waitFor(() => expect(footer()).toContain("After you commit, a small consequence nudge"));
    expect(document.querySelector('button[aria-label="Open assistance"]')).not.toBeNull();
    expect(JSON.parse(preferences.get(workflowPreferenceKey("position"))!).intent).toEqual({ kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } });
    expect([...preferences.keys()].filter((key) => key.includes(".v1."))).toEqual([]);
    expect(queries.at(-1)?.preference).toEqual({ kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } });

    // Advanced stays complete: a raw field above Guided's projection is visibly Custom, never "Guide me".
    document.querySelector<HTMLButtonElement>(".inspector-entry")!.click();
    await tick();
    const advanced = document.querySelector<HTMLElement>('[aria-label="Advanced support controls"]')!;
    const lighting = advanced.querySelector<HTMLSelectElement>(".assistance-fields select")!;
    expect(lighting.value).toBe("sight");
    lighting.value = "evidence";
    lighting.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector(".preset-pill")?.textContent).toBe("Custom"));
    expect(advanced.querySelectorAll('.module-toggles input[type="checkbox"]')).toHaveLength(10);
    const inspectorToggle = [...advanced.querySelectorAll<HTMLInputElement>('.module-toggles input[type="checkbox"]')].find((input) => input.parentElement?.textContent?.includes("Full inspector"))!;
    expect(inspectorToggle.checked).toBe(false);
    inspectorToggle.click();
    await vi.waitFor(() => expect(JSON.parse(preferences.get(workflowPreferenceKey("position"))!).intent.moduleOverrides).toEqual({ include: ["full_inspector"], exclude: [] }));
    await unmount(component);
    document.body.replaceChildren();

    // Match: only Quiet is offered and wider stored intent is stated as a context suppression.
    const matchRun = make("preset-match").run;
    preferences.set(workflowPreferenceKey("match"), explicitPreference("quiet", { arrows: "sight" }));
    const match = mountDrill({ target: target(), props: {
      snapshot: { run: matchRun, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage, liveSessionKind: "match",
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await vi.waitFor(() => expect(footer()).toContain("Arrows is limited to off in a match."));
    expect(footer()).not.toContain("no chess guidance appears unless you ask");
    expect([...document.querySelectorAll<HTMLInputElement>('.preset-options input[type="radio"]')].map((input) => input.value)).toEqual(["quiet"]);
    await unmount(match);
  });

  it("keeps individual evidence controls out of the ordinary Support menu", async () => {
    const run = createRun({
      id: "advanced-support-controls",
      session: { kind: "position", start: { fen: pack.start.fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"7".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();

    const menu = document.querySelector<HTMLDetailsElement>("details.assistance-control")!;
    menu.querySelector("summary")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(menu.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    expect(menu.textContent).toContain("Open support");
    expect(menu.textContent).toContain("Advanced support controls");

    [...menu.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Advanced support controls")!
      .click();
    await tick();
    expect(menu.open).toBe(false);
    const advanced = document.querySelector<HTMLElement>('[aria-label="Advanced support controls"]')!;
    expect(advanced).not.toBeNull();
    const fieldLabels = [...advanced.querySelectorAll(".assistance-fields label")].map((label) => label.textContent?.trim() ?? "");
    expect(fieldLabels).toHaveLength(9);
    for (const label of ["Board lighting", "Arrows", "Passive markers", "Named-pattern guidance", "Human move split on request", "Corpus counts on request", "External voice", "Spoken guidance", "Ambient presence"]) {
      expect(fieldLabels.some((value) => value.startsWith(label)), label).toBe(true);
    }
    expect(advanced.querySelectorAll('.assistance-fields input[type="checkbox"]')).toHaveLength(6);
    expect(advanced.querySelectorAll(".assistance-fields select")).toHaveLength(3);
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
      getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "on_request", corpus: "off", voice: "authored", spoken: "off", boardLighting: "off", arrows: "off", ambient: "off" }),
      setItem: vi.fn(),
    };
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, assistanceStorage,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onHumanSplit, registerKeyboardRegion,
    } });
    await tick();

    expect(document.querySelector(".pivotal-marker")).toBeNull();
    document.querySelector<HTMLButtonElement>(".inspector-entry")!.click();
    await tick();
    const request = [...document.querySelectorAll<HTMLButtonElement>(".assistance-grid button")]
      .find((button) => button.textContent?.includes("Load human move-model evidence"));
    expect(request).toBeDefined();
    request!.click();
    expect(onHumanSplit).toHaveBeenCalledWith(run.activeCursor.nodeId);
    await vi.waitFor(() => {
      const evidence = document.querySelector("[aria-label='Human-model evidence']")?.textContent;
      expect(evidence).toContain("human-model rung 1500 was requested but is not recorded as applied");
      expect(evidence).toContain("not FIDE, Lichess, or Chess.com ratings");
      expect(evidence).toContain("Ke2 40%");
      expect(evidence).not.toContain("e1e2");
    });
    await unmount(component);
  });

  it("refuses human-model and corpus pages returned for a different position", async () => {
    const run = revealFeedback(createRun({
      id: "crossed-inspector-evidence",
      session: {
        kind: "position",
        start: { fen: "4k3/8/8/8/8/8/P7/4K3 w - - 0 1", side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common", targetElo: 1500 },
      },
      sessionDigest: `sha256:${"c".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    }), at).run;
    const wrongNodeId = `${run.activeCursor.nodeId}:other`;
    const onHumanSplit = vi.fn(async () => ({
      nodeId: wrongNodeId,
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: false, eloHonored: false },
      targetElo: 1500,
      candidates: [{ moveUci: "e1e2", mass: .4, rank: 1 }],
    }));
    const onCorpus = vi.fn(async () => ({
      nodeId: wrongNodeId,
      committedMoveSan: null,
      result: {
        kind: "abstention" as const,
        reason: "no_data_at_band" as const,
        detail: "crossed response detail",
        population: { source: "lichess-explorer" as const, ratings: [1600], speeds: ["rapid"], since: "2020-01", until: "2026-09" },
      },
    }));
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      assistanceStorage: { getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "off", guided: "off", humanSplit: "on_request", corpus: "on_request", voice: "authored", spoken: "off", boardLighting: "off", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      capabilities: { providers: { opponent: "mock", judge: "mock", llm: "none", corpus: "mock", tts: "none", tablebase: "none" } } as Capabilities,
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onHumanSplit, onCorpus, registerKeyboardRegion,
    } });
    await tick();
    document.querySelector<HTMLButtonElement>(".inspector-entry")!.click();
    await tick();

    const humanSection = document.querySelector<HTMLElement>("[aria-label='Human-model evidence']")!;
    humanSection.querySelector<HTMLButtonElement>("button")!.click();
    await vi.waitFor(() => expect(humanSection.querySelector("[role='alert']")?.textContent).toContain("no longer match this position"));
    expect(humanSection.textContent).not.toContain("Ke2 40%");

    const corpusSection = document.querySelector<HTMLElement>("[aria-label='Corpus evidence']")!;
    corpusSection.querySelector<HTMLButtonElement>("button")!.click();
    await vi.waitFor(() => expect(corpusSection.querySelector("[role='alert']")?.textContent).toContain("no longer match this position"));
    expect(corpusSection.textContent).not.toContain("crossed response detail");
    await unmount(component);
  });

  it("renders only live-admitted irreversibility markers", async () => {
    const config = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
    const session = (fen: string) => ({ kind: "position" as const, start: { fen, side: "white" as const }, feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } });
    const props = (run: DrillRun) => ({
      snapshot: { run, access: "writer" as const, pendingEvidence: 0, withheld: false },
      assistanceStorage: { getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "live", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    });

    const castleRoot = createRun({ id: "live-castle", session: session("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"), sessionDigest: `sha256:${"d".repeat(64)}`, policyConfig: config, seed: 1, createdAt: at });
    const castle = commitMove(castleRoot, "e1g1", { at }).run;
    let component = mountDrill({ target: target(), props: props(castle) });
    await tick();
    await assistanceSettled();
    expect(document.querySelectorAll(".pivotal-marker")).toHaveLength(0);
    await unmount(component);
    document.body.replaceChildren();

    const queenRoot = createRun({ id: "live-queens-off", session: session("4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1"), sessionDigest: `sha256:${"e".repeat(64)}`, policyConfig: config, seed: 1, createdAt: at });
    const queen = commitMove(queenRoot, "e2e7", { at }).run;
    component = mountDrill({ target: target(), props: props(queen) });
    await tick();
    await assistanceSettled();
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
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, shapes: [carlsbad],
      assistanceStorage: { getItem: (key: string) => !key.startsWith("tabiya.assistance.v1.") ? null : JSON.stringify({ version: 4, markers: "off", guided: "live", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" }), setItem: vi.fn() },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    await assistanceSettled();
    expect(document.body.textContent).toContain("Nothing is authored about this position — Tabiya reads it as you play");
    const marker = document.querySelector<HTMLButtonElement>(".shape-marker")!;
    expect(marker.textContent).toContain("Carlsbad structure");
    marker.focus(); marker.click(); await tick();
    expect(document.querySelector(".shape-panel")?.getAttribute("role")).toBe("dialog");
    expect(document.querySelector(".shape-panel")?.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement?.id).toBe("shape-panel-title");
    expect(marker.closest("[inert]")).not.toBeNull();
    expect(document.querySelector(".shape-panel")?.textContent).toContain("Named plans for this structure — general to the kind of position, not advice for this one.");
    expect(document.querySelector(".shape-panel")?.textContent).not.toContain("shape trigger");
    expect(document.querySelector(".shape-panel")?.textContent).toContain("Minority attack");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await tick();
    expect(document.querySelector(".shape-panel")).toBeNull();
    expect(document.activeElement).toBe(marker);
    marker.click(); await tick();
    document.querySelector<HTMLButtonElement>(".shape-panel footer button")!.click(); await tick();
    expect(document.querySelector('[aria-label="Named structure evidence"]')?.textContent).toContain("CC-BY-SA-4.0");
    expect(document.querySelector<HTMLButtonElement>(".quick-actions button")?.getAttribute("aria-label")).toBe("Fork branch");
    expect([...document.querySelectorAll<HTMLButtonElement>(".quick-actions button")].find((button) => button.textContent?.includes("Replay"))?.getAttribute("aria-label")).toBe("Replay");
    expect([...document.querySelectorAll<HTMLButtonElement>(".quick-actions button")].find((button) => button.textContent?.includes("Export"))?.getAttribute("aria-label")).toBe("Export");
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
    let component = mountDrill({ target: target(), props: { snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false }, onReveal, ...shared } });
    await tick();
    const reveal = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Show support for this position")!;
    expect(reveal.disabled).toBe(false);
    expect(reveal.getAttribute("aria-describedby")).toBe("temporary-help-cost");
    expect(document.getElementById("temporary-help-cost")?.textContent).toContain("closes again after your next committed move");
    reveal.click();
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("closes again after your next committed move");
    expect(document.body.textContent).not.toContain("Recorded on the run as a disclosure");
    await unmount(component);

    document.body.replaceChildren();
    component = mountDrill({ target: target(), props: { snapshot: { run, access: "read_only", pendingEvidence: 0, withheld: false }, onReveal, ...shared } });
    await tick();
    expect(document.body.textContent).not.toContain("Show support for this position");
    await unmount(component);
  });

  it("turns an unrecognized structure into continue-or-rewind loop actions", async () => {
    const run = createRun({
      id: "support-empty-screen",
      session: { kind: "position", start: { fen: "8/8/8/8/8/4k3/8/R3K3 w - - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"d".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: at,
    });
    const component = mountDrill({ target: target(), props: {
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();

    const empty = document.querySelector<HTMLElement>('.support-empty[aria-labelledby="support-empty-title"]')!;
    expect(empty.textContent).toContain("Nothing recognizes this structure yet");
    expect(empty.textContent).toContain("Play it and see what the consequence exposes");
    expect(empty.textContent).not.toContain("Rewind to a decision");
    empty.querySelector<HTMLButtonElement>("button")!.click();
    await tick();
    expect(document.activeElement).toBe(document.querySelector("[data-board-input-grid]"));
    await unmount(component);
  });

  it("offers an optional calculation from Support without exposing evidence-pipeline copy", async () => {
    const run = branchedRun();
    const onAnalyzeMissing = vi.fn(async () => true);
    const capabilities = {
      providers: { opponent: "mock", judge: "stockfish", llm: "none", corpus: "none", tts: "none", tablebase: "none" },
    } as Capabilities;
    const component = mountDrill({ target: target(), props: {
      pack,
      capabilities,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onAnalyzeMissing, registerKeyboardRegion,
    } });
    await tick();

    expect(document.querySelector(".group-panel")).toBeNull();
    const module = document.querySelector<HTMLElement>('.analysis-request[aria-labelledby="analysis-request-title"]')!;
    expect(module.textContent).toContain("one concrete continuation");
    expect(module.textContent).toContain("does not grade your move or tell you what you must play");
    expect(module.textContent).not.toMatch(/recorded evidence|projection|provider|packet/i);
    expect(module.textContent).toContain("A recorded calculation is available for this position.");
    const request = [...module.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Calculate this position")!;
    expect(request.disabled).toBe(false);
    request.click();
    await tick();

    expect(onAnalyzeMissing).toHaveBeenCalledWith([run.activeCursor.nodeId]);
    expect(module.textContent).toContain("Preparing calculation…");
    expect(module.textContent).toContain("Inspect recorded calculation");
    await unmount(component);
  });

  it("recovers the Support calculation control after rejection or refusal", async () => {
    const run = branchedRun();
    const onAnalyzeMissing = vi.fn()
      .mockRejectedValueOnce(new Error("provider transport detail"))
      .mockResolvedValueOnce(false);
    const component = mountDrill({ target: target(), props: {
      pack,
      capabilities: { providers: { opponent: "mock", judge: "stockfish", llm: "none", corpus: "none", tts: "none", tablebase: "none" } } as Capabilities,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onAnalyzeMissing, registerKeyboardRegion,
    } });
    await tick();

    const module = document.querySelector<HTMLElement>('.analysis-request[aria-labelledby="analysis-request-title"]')!;
    const request = [...module.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Calculate this position")!;
    request.click();
    await vi.waitFor(() => expect(module.querySelector("[role='alert']")?.textContent).toBe("The calculation is unavailable right now. Try again."));
    expect(module.textContent).not.toContain("provider transport detail");
    expect(request.disabled).toBe(false);

    request.click();
    await vi.waitFor(() => expect(module.querySelector("[role='alert']")?.textContent).toBe("The calculation did not start. Try again."));
    expect(request.disabled).toBe(false);
    expect(onAnalyzeMissing).toHaveBeenCalledTimes(2);
    await unmount(component);
  });

  it("keeps branch-group comparison preparation single-flight and retryable", async () => {
    const run = groupedRun();
    const first = deferred<boolean>();
    const onAnalyzeMissing = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(),
      onAnalyzeMissing, registerKeyboardRegion,
    } });
    await tick();

    const panel = document.querySelector<HTMLElement>(".group-panel")!;
    const prepare = panel.querySelector<HTMLButtonElement>("button.analysis")!;
    const expectedNodeId = run.nodes.filter((node) => node.branchId === run.branches[0]!.id).at(-1)!.id;
    prepare.click();
    prepare.click();
    await tick();
    expect(onAnalyzeMissing).toHaveBeenCalledTimes(1);
    expect(onAnalyzeMissing).toHaveBeenCalledWith([expectedNodeId]);
    expect(prepare.disabled).toBe(true);
    expect(prepare.textContent).toContain("Preparing comparison");
    expect(panel.querySelector("#group-analysis-status")?.textContent).toContain("The group stays here");
    expect([...panel.querySelectorAll<HTMLButtonElement>(".cell-heading")].every((button) => button.disabled)).toBe(true);

    first.resolve(false);
    await first.promise;
    await tick();
    expect(panel.querySelector('[role="alert"]')?.textContent).toContain("This group is unchanged; try again");
    expect(panel.textContent).not.toContain("provider transport detail");
    expect(prepare.disabled).toBe(false);
    expect(prepare.textContent).toContain("Try preparing comparisons");

    prepare.click();
    await vi.waitFor(() => expect(onAnalyzeMissing).toHaveBeenCalledTimes(2));
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
    const rewindAttempt = deferred<boolean>();
    const onRewind = vi.fn()
      .mockImplementationOnce(() => rewindAttempt.promise)
      .mockResolvedValueOnce(true);
    const onScheduleReturn = vi.fn(async () => true);
    const component = mountDrill({
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
        onScheduleReturn,
        registerKeyboardRegion,
      },
    });
    await tick();

    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("You won.");
    expect(document.body.textContent).toContain("The terminal authored explanation.");
    expect(document.body.textContent).toContain("The terminal authored claim.");
    expect(document.body.textContent).toContain("No machine record is attached.");
    expect(document.body.textContent).toContain("Your completed attempt stays saved.");
    expect(document.body.textContent).toContain("Rewinds are free in rehearsals");
    const primaryActions = [...document.querySelectorAll<HTMLButtonElement>(".primary-actions button")];
    expect(primaryActions.map((button) => button.textContent)).toEqual(["Play it again from here", "Schedule a retry from here"]);
    expect(document.querySelector('[role="dialog"]')?.textContent).not.toMatch(/accuracy|grade count|rating movement|great move/i);
    expect(document.querySelector('[role="dialog"]')?.textContent).not.toContain("Engine evidence recorded");
    const inspect = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("Inspect analysis details"))!;
    inspect.click();
    await tick();
    const attachedEvidence = document.querySelector('[aria-label="Evidence attached to this position"]')?.textContent;
    expect(attachedEvidence).toContain("Recorded engine evaluation: +0.00 pawns from White's perspective.");
    expect(attachedEvidence).not.toContain("details are pending");
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Return to play")!.click();
    await tick();
    const terminalRewind = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Play it again from here")!;
    terminalRewind.click();
    expect(onRewind).toHaveBeenCalledWith({ nodeId: run.nodes[0]!.id });
    await tick();
    expect(terminalRewind.disabled).toBe(true);
    expect(terminalRewind.textContent).toContain("Rewinding");
    expect(document.querySelector("#terminal-rewind-busy")?.textContent).toContain("completed attempt remains open");
    rewindAttempt.resolve(false);
    await vi.waitFor(() => expect(document.querySelector("#terminal-rewind-error")?.textContent).toContain("target are unchanged"));
    expect(terminalRewind.textContent).toContain("Try this rewind again");
    terminalRewind.click();
    await vi.waitFor(() => expect(onRewind).toHaveBeenCalledTimes(2));
    const scheduleReturn = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Schedule a retry from here")!;
    await vi.waitFor(() => expect(scheduleReturn.disabled).toBe(false));
    scheduleReturn.click();
    await vi.waitFor(() => expect(onScheduleReturn).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(document.body.textContent).toContain("Added to return queue"));
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
      concepts: (pack.concepts ?? []).map((id) => ({ id, label: id, status: "active" as const })),
      reviewStatus: "draft",
      channel: "community",
    };
    const component = mount(PackList, {
      target: target(),
      props: { packs: [summary], onSelect },
    });

    expect(document.body.textContent).toContain("advanced club");
    expect(document.querySelector(".provenance")?.textContent).toBe("Community draft");
    expect(document.body.textContent).toContain(summary.objectiveSummary);
    expect(document.querySelector(".phase")?.textContent).toBe("Opening");
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
      objectiveSummary: "Continue beyond the opening fork.", concepts: [{ id: "sicilian-defense", label: "Sicilian defense", status: "active" as const }],
      reviewStatus: "draft", channel: "community",
    };
    const ending: PackSummary = {
      id: "lucena", version: "0.27", digest: `sha256:${"c".repeat(64)}`,
      title: "Lucena bridge", mode: "outcome", phase: "endgame",
      difficulty: { minOnlineRapid: 1000, maxOnlineRapid: 1600 },
      objectiveSummary: "Build the bridge and promote.", concepts: [{ id: "rook-ending", label: "Rook ending", status: "active" as const }],
      reviewStatus: "draft", channel: "community",
    };
    const component = mount(PackList, { target: target(), props: { packs: [opening, ending], onSelect: vi.fn() } });
    const countStatus = document.querySelector<HTMLElement>('[role="status"]')!;
    expect(countStatus.textContent).toBe("2 positions");
    expect(countStatus.getAttribute("aria-atomic")).toBe("true");
    const search = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = "rook-ending";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    expect(document.querySelectorAll(".pack-card")).toHaveLength(1);
    expect(countStatus.textContent).toBe("1 position");
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
    const startingSupport = document.querySelector<HTMLElement>(".starting-support")!;
    expect(startingSupport.textContent).toContain("Starting support");
    expect(startingSupport.textContent).toContain("Quiet");
    expect(startingSupport.textContent).toContain("no chess guidance appears unless you ask");
    expect(startingSupport.textContent).toContain("Advanced support controls");
    expect(startingSupport.textContent).not.toContain("Change the help style");
    expect(startingSupport.querySelectorAll("input, select, button")).toHaveLength(0);
    const radios = document.querySelectorAll<HTMLInputElement>('input[name="opponent"]');
    expect(document.querySelector(".ladder")?.contains(radios[4]!)).toBe(false);
    expect(document.querySelector(".engine-choice")?.contains(radios[4]!)).toBe(true);
    expect(document.querySelector(".ladder")?.textContent).toContain("not FIDE, Lichess, or Chess.com ratings");
    radios[2]!.click();
    document.querySelector<HTMLFormElement>(".just-play form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    expect(onStart).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "human_common", targetElo: 1800 }));
    radios[4]!.click();
    document.querySelector<HTMLFormElement>(".just-play form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    expect(onStart).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "strong_engine" }));
    expect(onStart.mock.calls.at(-1)?.[0]).not.toHaveProperty("targetElo");
    await unmount(component);
  });

  // rfc/opponent-experience.md §§2–3, bounded by bot-policy/bot-roster: honest catalogue cards are the
  // default path, raw rungs sit under Advanced, nothing is preselected (D1611 is unruled), no
  // display name is invented (D1610) and no strength number is shown while uncalibrated.
  it("offers the bot roster as grouped honest cards with raw rungs under Advanced", async () => {
    const onStart = vi.fn();
    const roster = botRosterFixture().map((row) => row.reference.family === "pawn-forward"
      ? { ...row, startable: { kind: "unavailable" as const, blockedBy: ["stockfish_unavailable" as const] } }
      : row.reference.family === "guarded-human"
        ? { ...row, startable: { kind: "conditional" as const, conditions: ["guard_release_receipt_absent" as const] } }
        : row);
    const component = mount(JustPlayStarter, { target: target(), props: { onStart, roster } });
    const bots = document.querySelectorAll<HTMLInputElement>('[data-bot-profile] input[name="opponent"]');
    expect(bots).toHaveLength(12);
    expect([...document.querySelectorAll(".bot-roster .family h3")].map((heading) => heading.textContent)).toEqual(["Human baseline", "Guarded human", "Pawn-forward"]);
    expect([...document.querySelectorAll('input[name="opponent"]')].some((input) => (input as HTMLInputElement).checked)).toBe(false);
    const start = document.querySelector<HTMLButtonElement>(".start")!;
    expect(start.disabled).toBe(true);
    expect(document.getElementById(start.getAttribute("aria-describedby")!)?.textContent).toBe("Choose an opponent to start.");
    expect(document.querySelector(".advanced")?.hasAttribute("open")).toBe(false);
    expect(document.querySelector(".advanced .ladder")).not.toBeNull();
    const text = document.querySelector(".bot-roster")!.textContent!;
    expect(text).toContain("Uncalibrated");
    expect(text).not.toMatch(/\bElo\b|\bpersona\b/u);
    // Unavailable cards stay visible with their reason and cannot be chosen.
    const pawn = document.querySelector<HTMLLabelElement>('[data-bot-profile="pawn-forward.1400@1"]')!;
    expect(pawn.querySelector("input")!.disabled).toBe(true);
    expect(pawn.textContent).toContain("Stockfish check this bot needs is not reachable");
    expect(document.querySelector('[data-bot-profile="guarded-human.1400@1"]')!.textContent).toContain("not yet release-measured");
    // Choosing a bot shows its full grounded card and starts a run with the exact reference.
    document.querySelector<HTMLInputElement>('[data-bot-profile="human-baseline.1800@1"] input')!.click();
    await tick();
    expect(document.querySelector(".bot-card h3")?.textContent).toBe("Human baseline · band 1800");
    expect(document.querySelectorAll(".bot-card [data-card-statement]").length).toBeGreaterThan(0);
    expect(start.disabled).toBe(false);
    document.querySelector<HTMLFormElement>(".just-play form")!.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    const chosen = BOT_PROFILE_CATALOG.find((entry) => entry.reference.id === "human-baseline.1800@1")!.reference;
    expect(onStart).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "human_common", profile: chosen }));
    expect(onStart.mock.calls.at(-1)?.[0]).not.toHaveProperty("targetElo");
    await unmount(component);
  });

  it("renders a derived sibling-pack link at the rehearsal entry point", async () => {
    const related = { ...structuredClone(pack), variantOf: { packId: "related-pack", relation: { kind: "same_root_other_objective" as const } } };
    const relatedPack = { ...structuredClone(pack), id: "related-pack", title: "Bishop and knight mate" };
    const run = createRun({ id: "variant-run", packId: related.id, packDigest: `sha256:${"b".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, startFen: related.start.fen, seed: 1, createdAt: at });
    const onSelectPack = vi.fn();
    const component = mountDrill({ target: target(), props: {
      pack: related,
      relatedPack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), onSelectPack, registerKeyboardRegion,
    } });
    await tick();
    expect(document.querySelector(".variant-link")?.textContent).toContain("Same position, other objective");
    expect(document.querySelector(".variant-link")?.textContent).toContain("Bishop and knight mate");
    expect(document.querySelector(".variant-link")?.textContent).not.toContain("related-pack");
    document.querySelector<HTMLButtonElement>(".variant-link button")!.click();
    expect(onSelectPack).toHaveBeenCalledWith("related-pack");
    await unmount(component);
  });

  it("renders a root-after-move sibling relation in SAN from the sibling position", async () => {
    const related = { ...structuredClone(pack), variantOf: { packId: "philidor-hold", relation: { kind: "root_after_move" as const, moveUci: "h6h8" } } };
    const relatedPack = {
      ...structuredClone(pack),
      id: "philidor-hold",
      title: "Philidor: hold the third rank",
      start: { ...pack.start, fen: "4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1", side: "black" as const },
    };
    const run = createRun({ id: "root-after-move-run", packId: related.id, packDigest: `sha256:${"c".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, startFen: related.start.fen, seed: 1, createdAt: at });
    const component = mountDrill({ target: target(), props: {
      pack: related,
      relatedPack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(), onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), onSelectPack: vi.fn(), registerKeyboardRegion,
    } });
    await tick();
    expect(document.querySelector(".variant-link")?.textContent).toContain("After Rh8");
    expect(document.querySelector(".variant-link")?.textContent).toContain("Philidor: hold the third rank");
    expect(document.querySelector(".variant-link")?.textContent).not.toContain("h6h8");
    expect(document.querySelector(".variant-link")?.textContent).not.toContain("philidor-hold");
    await unmount(component);
  });

  it("composes board, objective, why-banner, timeline preview, branch rail, and checkpoint sheet", async () => {
    const run = branchedRun();
    const checkpoint = latestCheckpoint(pack, run)!;
    const onRewind = vi.fn();
    const component = mountDrill({
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
    const whyBanner = document.querySelector<HTMLElement>(".why-banner")!;
    expect(whyBanner.textContent).not.toContain("Pack ·");
    const inspector = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.trim() === "Inspector")!;
    inspector.click();
    await tick();
    const objectiveEvidence = document.querySelector<HTMLElement>('[aria-label="Objective change evidence"]')!;
    expect(objectiveEvidence.textContent).toContain("Pack · Checkpoint reached: Critical race resolved.");
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.trim() === "Return to play")!.click();
    await tick();
    expect(document.body.textContent).toContain("early queenside");
    expect(document.querySelectorAll(".timeline li.checkpoint").length).toBe(2);
    expect(document.querySelector('[role="dialog"] h2')?.textContent).toBe(
      "Critical race resolved",
    );
    expect(document.activeElement?.textContent).toBe("Critical race resolved");
    const pausedBoard = document.querySelector<HTMLElement>(".board-frame.checkpoint-paused")!;
    expect(pausedBoard.textContent).toContain("Board paused");
    expect(pausedBoard.textContent).toContain("Choose a checkpoint action to continue.");
    const pausedGrid = pausedBoard.querySelector<HTMLElement>("[data-board-input-grid]")!;
    expect(pausedGrid.getAttribute("aria-readonly")).toBe("true");
    expect(pausedGrid.getAttribute("aria-describedby")).toBe("checkpoint-board-paused");
    expect(document.body.textContent).toContain("Authored setup explanation.");
    expect(document.body.textContent).not.toContain(
      "Earlier occurrence must stay out of this sheet.",
    );
    expect(document.body.textContent).toContain(
      "Commentary opens at a checkpoint",
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
    const base = branchedRun();
    const comparison = compareBranches(base, base.branches.map((branch) => branch.id));
    const outcomeNodeId = Object.values(comparison.rows.at(-1)!.nodes)[0]!.id;
    const run: DrillRun = Object.freeze({
      ...base,
      events: Object.freeze([...base.events, Object.freeze({
        seq: base.events.at(-1)!.seq + 1,
        type: "outcome.reached" as const,
        at,
        data: Object.freeze({ nodeId: outcomeNodeId, outcome: "win" as const }),
      })]),
    });
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
        onReplayResistance: vi.fn(),
      },
    });
    await tick();

    expect(document.body.textContent).toContain("Consequence step 2 / 2");
    const comparisonStatus = document.querySelector<HTMLElement>('[data-status-announcement]')!;
    expect(comparisonStatus.textContent).toBe("Comparison consequence step 2 of 2");
    expect(document.querySelector(".boards")?.getAttribute("aria-live")).toBeNull();
    expect(comparisonStatus.querySelector("button, [tabindex]")).toBeNull();
    expect(document.activeElement?.id).toBe("compare-title");
    expect(document.body.textContent).toContain("Line ended");
    expect(document.body.textContent).toContain("Game won.");
    expect(document.body.textContent).not.toContain("The recorded outcome is win");
    expect(document.querySelector(".boards article.absent")).not.toBeNull();
    expect(document.body.textContent).toContain("main");
    expect(document.body.textContent).toContain("This attempt reached the objective.");
    expect(document.body.textContent).not.toContain("active → achieved");
    expect(document.body.textContent).not.toContain("M-2");
    expect(document.querySelector('[data-evidence-ref="pack-absent:timing-window"]')?.textContent).toBe(
      "Checkpoint not reached on this branch: Critical race resolved.",
    );
    expect(document.body.textContent).toContain("Where the attempts split");
    expect(document.querySelector(".alignment")).toBeNull();
    expect(document.body.textContent).not.toContain(" at +");
    expect(document.body.textContent).toContain("from the shared fork");
    expect(document.body.textContent).toContain("Intent: Test Black's expansion");
    expect(document.body.textContent).toContain("Change the practical resistance, not the recorded attempts.");
    expect(document.body.textContent).not.toContain("Recorded differences by branch");
    expect(document.body.textContent).not.toContain("Opponent and authored-line context");
    expect(document.body.textContent).not.toContain("Tabiya structural detector");
    expect(document.querySelector('[role="dialog"][aria-labelledby="comparison-inspector-title"]')).toBeNull();
    document.querySelector<HTMLButtonElement>(".header-actions button")!.click();
    await tick();
    expect(document.querySelector('[role="dialog"][aria-labelledby="comparison-inspector-title"]')).not.toBeNull();
    expect(document.body.textContent).toContain("active → achieved");
    expect(document.body.textContent).toContain("M-2");
    expect(document.body.textContent).toContain("Recorded differences by branch");
    expect(document.body.textContent).toContain("Opponent and authored-line context");
    expect(document.querySelector(".boards")?.getAttribute("data-zoom")).toBe("near");
    expect(document.querySelectorAll("[aria-label='Chessboard']")).toHaveLength(2);
    const semanticGrids = [...document.querySelectorAll<HTMLElement>("[data-board-input-grid]")];
    expect(semanticGrids).toHaveLength(2);
    const semanticCellIds = semanticGrids.flatMap((grid) => [...grid.querySelectorAll<HTMLElement>("[role=gridcell]")].map((cell) => cell.id));
    expect(new Set(semanticCellIds).size).toBe(128);
    for (const grid of semanticGrids) {
      const activeId = grid.getAttribute("aria-activedescendant");
      expect([...grid.querySelectorAll<HTMLElement>("[role=gridcell]")].some((cell) => cell.id === activeId)).toBe(true);
    }
    expect(chessground.configs[0]!.drawable!.autoShapes).toHaveLength(2);
    document.querySelector<HTMLButtonElement>(".zoom-control button")!.click();
    await tick();
    expect(document.querySelector(".boards")?.getAttribute("data-zoom")).toBe("far");
    expect(document.querySelectorAll("[aria-label='Chessboard']")).toHaveLength(1);
    expect(document.body.textContent).toContain("active");
    const evaluationOffsets = new Set(comparison.columns.flatMap((column) => comparison.evidence[column.branchId]!.map((entry) => entry.plyOffset)));
    expect(document.querySelectorAll(".evaluation-axis")).toHaveLength(1);
    expect(document.querySelectorAll(".evaluation-axis tbody tr")).toHaveLength(evaluationOffsets.size);
    expect(document.querySelectorAll(".evaluation-axis .evidence-entry")).toHaveLength(comparison.columns.reduce((total,column)=>total+comparison.evidence[column.branchId]!.length,0));
    expect(document.querySelector(".sparkline")).toBeNull();
    expect(document.body.textContent).toContain("recorded branches share");
    document.querySelector<HTMLButtonElement>(".comparison-inspector header button")!.click();
    await tick();
    expect(document.querySelector(".comparison-inspector")).toBeNull();
    expect(document.activeElement).toBe(document.querySelector(".header-actions button"));
    expectDisabledControlsExplained();
    await unmount(component);
  });

  it("keeps branch classification single-flight and recoverable without leaking failures", async () => {
    const run = branchedRun();
    const first = deferred<Readonly<Record<string, import("@chess-tabiya/runtime").Decidedness>>>();
    const onClassifyBranches = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce((branchIds: readonly string[]) => Promise.resolve(Object.freeze(Object.fromEntries(branchIds.map((branchId) => [branchId, Object.freeze({
        state: "decided" as const,
        ground: Object.freeze({ kind: "terminal_outcome" as const, outcome: "draw" as const, nodeId: run.activeCursor.nodeId }),
        admitted: true,
        shortfall: false,
      })])))));
    const component = mountDrill({ target: target(), props: {
      pack,
      snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
      onMove: vi.fn(), onRewind: vi.fn(), onFork: vi.fn(), onSwitchBranch: vi.fn(), onCompare: vi.fn(),
      onClassifyBranches,
      onCloseCompare: vi.fn(), onContinueCheckpoint: vi.fn(), onExport: vi.fn(), onStop: vi.fn(), registerKeyboardRegion,
    } });
    await tick();

    const classify = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === "Classify remaining")!;
    classify.click();
    await tick();
    expect(classify.disabled).toBe(true);
    expect(classify.textContent).toContain("Checking branches");
    classify.click();
    expect(onClassifyBranches).toHaveBeenCalledTimes(1);

    first.reject(new Error("private tablebase provider detail"));
    await vi.waitFor(() => expect(document.querySelector(".rail-actions [role='alert']")?.textContent).toBe("Branch status is unavailable right now. Try again."));
    expect(document.querySelector(".rail-actions")?.textContent).not.toContain("private tablebase provider detail");
    expect(classify.disabled).toBe(false);

    classify.click();
    await vi.waitFor(() => expect(onClassifyBranches).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.body.textContent).not.toContain("Classify remaining"));
    expect(document.querySelector(".rail-actions [role='alert']")).toBeNull();
    await unmount(component);
  });

  it("recovers comparison narration and resistance replay without duplicate actions", async () => {
    const run = branchedRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const voiceFailure = deferred<string>();
    const replayFailure = deferred<void>();
    const onVoice = vi.fn()
      .mockImplementationOnce(() => voiceFailure.promise)
      .mockResolvedValueOnce("The recorded branches differ after the shared decision.");
    const onReplayResistance = vi.fn()
      .mockImplementationOnce(() => replayFailure.promise)
      .mockResolvedValueOnce(undefined);
    const component = mount(CompareView, { target: target(), props: {
      run, pack, comparison, startSide: "white", step: 0,
      onStep: vi.fn(), onClose: vi.fn(), onVoice, onReplayResistance,
    } });
    await tick();

    const replay = [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Start a new replay")!;
    replay.click();
    await tick();
    expect(replay.disabled).toBe(true);
    replay.click();
    expect(onReplayResistance).toHaveBeenCalledTimes(1);
    replayFailure.reject(new Error("private replay transport detail"));
    await vi.waitFor(() => expect(document.querySelector(".replay-resistance [role='alert']")?.textContent).toContain("comparison is still here"));
    expect(document.querySelector(".replay-resistance")?.textContent).not.toContain("private replay transport detail");
    replay.click();
    await vi.waitFor(() => expect(onReplayResistance).toHaveBeenCalledTimes(2));

    document.querySelector<HTMLButtonElement>(".header-actions button")!.click();
    await tick();
    const inspector = document.querySelector<HTMLElement>(".comparison-inspector")!;
    const voice = [...inspector.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Revoice grounded comparison")!;
    voice.click();
    await tick();
    expect(voice.disabled).toBe(true);
    voice.click();
    expect(onVoice).toHaveBeenCalledTimes(1);
    voiceFailure.reject(new Error("private voice provider detail"));
    await vi.waitFor(() => expect(inspector.querySelector("[role='alert']")?.textContent).toContain("unavailable right now"));
    expect(inspector.textContent).not.toContain("private voice provider detail");
    voice.click();
    await vi.waitFor(() => expect(onVoice).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(inspector.textContent).toContain("The recorded branches differ after the shared decision."));

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
    expect(document.querySelector('[data-abstention="feedback_withheld"]')?.textContent).toContain("withheld until this attempt reaches its disclosure boundary");
    expect(document.body.textContent).toContain("Recorded paths, positions, and objective changes remain available");
    expect(document.body.textContent).not.toContain("M-2");
    document.querySelector<HTMLButtonElement>(".header-actions button")!.click();
    await tick();
    expect(document.querySelector('[aria-label="Recorded engine evaluation"]')).toBeNull();
    expect(document.querySelector('[data-evidence-consumer="compare.engine_trajectory"]')).toBeNull();
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
    expect(document.body.textContent).toContain("The recorded paths are separate at this rehearsal step");
    await unmount(component);
  });

  it("renders one position cell for each exact shared-node group", async () => {
    const run = nestedForkRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    expect(comparison.rows[0]!.groups.map((group) => group.length).sort()).toEqual([1, 2]);
    const component = mount(CompareView, { target: target(), props: {
      run, pack, comparison, startSide: "white", step: 1,
      onStep: vi.fn(), onClose: vi.fn(),
    } });
    await tick();

    const cells = [...document.querySelectorAll<HTMLElement>(".boards > article")];
    expect(cells).toHaveLength(2);
    const shared = cells.find((cell) => cell.dataset.branchIds?.split(" ").length === 2);
    expect(shared).toBeDefined();
    expect(shared?.textContent).toContain("Shared recorded position · 2 attempts");
    [...document.querySelectorAll<HTMLButtonElement>(".zoom-control button")].at(-1)!.click();
    await tick();
    expect(shared?.querySelectorAll('[aria-label="Chessboard"]')).toHaveLength(1);
    expect(cells.filter((cell) => cell.classList.contains("absent"))).toHaveLength(0);
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

    expect(document.body.textContent).not.toContain("Recorded engine evaluation:");
    document.querySelector<HTMLButtonElement>(".header-actions button")!.click();
    await tick();
    expect(document.body.textContent).toContain("Recorded engine evaluation: +0.12 pawns from White's perspective.");
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
    expect(document.body.textContent).toContain("This drill paused here so you can choose what to do next.");
    expect(document.body.textContent).toContain("Escape does not dismiss this checkpoint.");
    expect(document.body.textContent).not.toContain("semantic boundary");
    await unmount(component);
  });

  it("offers provider-gated reasoning review and renders only the checked fixed frame", async () => {
    const onReasoningReview = vi.fn(async () => ({
      provider: "external" as const,
      proposals: [{
        keyPointId: "improve-piece",
        quotation: "I would improve the knight",
        text: "This provider-authored sentence must never render or grade the learner.",
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
    expect(document.body.textContent).not.toContain("provider-authored sentence");
    expect(document.body.textContent).not.toContain("grade the learner");
    await unmount(component);
  });

  it("binds reasoning review to one checkpoint and contains malformed, duplicate, and departed settlements", async () => {
    const first = deferred<import("./api.js").ReasoningReviewPage>();
    const departed = deferred<import("./api.js").ReasoningReviewPage>();
    const onReasoningReview = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce({ provider: "external", proposals: [{ keyPointId: "improve-piece", quotation: "improve the knight", text: "private provider prose" }] })
      .mockImplementationOnce(() => departed.promise);
    const props = {
      run: branchedRun(),
      checkpoint: { id: "reasoning-checkpoint", label: "State the plan", nodeId: "node-1", eventSeq: 12, actions: [], interaction: { type: "stated_reasoning" as const } },
      reasoning: {
        checkpointId: "reasoning-checkpoint",
        occurrences: [{
          eventSeq: 13, checkpointEventSeq: 12, branchId: "main", skipped: false,
          transcript: { candidates: ["Ne5"], plan: "I would improve the knight", fears: "" },
          detections: [{ keyPointId: "improve-piece", status: "not_detected" as const }],
          keyPoints: [{ id: "improve-piece", label: "Improve the worst piece", ground: { kind: "claim" as const, claimId: "piece-activity" }, attribution: "Authored claim: piece activity" }],
        }],
        previous: null,
        absenceSentence: "No earlier attempt has stated reasoning at this checkpoint.",
        honestySentence: "Detected means literal phrase overlap, not correctness.",
      },
      onReasoningReview,
      canCompare: false,
      onContinue: vi.fn(), onRewind: vi.fn(), onCompare: vi.fn(), onStop: vi.fn(),
    };
    const component = mount(CheckpointSheet, { target: target(), props });
    await tick();
    const reviewButton = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("another possible mention"))!;
    reviewButton.click();
    reviewButton.click();
    expect(onReasoningReview).toHaveBeenCalledTimes(1);
    first.resolve({ provider: "external", proposals: [{ keyPointId: "improve-piece", quotation: "invented phrase", text: "private provider failure" }] });
    await vi.waitFor(() => expect(document.body.textContent).toContain("Your words could not be checked right now"));
    expect(document.body.textContent).not.toContain("invented phrase");
    expect(document.body.textContent).not.toContain("private provider failure");
    reviewButton.click();
    await vi.waitFor(() => expect(onReasoningReview).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.body.textContent).toContain("the author's point “Improve the worst piece”"));
    expect(document.body.textContent).not.toContain("private provider prose");
    await unmount(component);

    const departedComponent = mount(CheckpointSheet, { target: target(), props });
    await tick();
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.includes("another possible mention"))!.click();
    await vi.waitFor(() => expect(onReasoningReview).toHaveBeenCalledTimes(3));
    await unmount(departedComponent);
    departed.reject(new Error("private late provider failure"));
    await tick();
    expect(document.body.textContent).not.toContain("private late provider failure");
  });

  it("maps every keyboard command and keeps modal focus accessible", async () => {
    const run = branchedRun();
    const onRewind = vi.fn();
    const onFork = vi.fn();
    const onSwitchBranch = vi.fn();
    const firstCompare = deferred<boolean>();
    const secondCompare = deferred<boolean>();
    const onCompare = vi.fn()
      .mockImplementationOnce(() => firstCompare.promise)
      .mockImplementationOnce(() => secondCompare.promise);
    const onCloseCompare = vi.fn();
    const onExport = vi.fn();
    const component = mountDrill({
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
    const activeBranch = document.querySelector<HTMLButtonElement>('.branch-card[aria-current="true"]');
    expect(activeBranch?.textContent).toContain(run.branches.find((branch) => branch.id === run.activeCursor.branchId)?.label);
    expect(activeBranch?.textContent).toContain("Objective reached");
    expect(activeBranch?.textContent).not.toMatch(/\b(active|preserved|degraded|failed|achieved|transitioned)\b/u);

    key("r");
    expect(onRewind).toHaveBeenCalledWith({ checkpointId: "plan-commitment" });
    key("R", { shiftKey: true });
    await tick();
    expect(document.body.textContent).toContain("Choose a checkpoint.");
    expect(document.querySelector(".checkpoint-options")?.textContent).toContain("Choose the setup");
    expect(document.querySelector(".checkpoint-options")?.textContent).not.toContain("plan-commitment");
    expect(document.activeElement?.id).toBe("picker-title");
    key("Escape");
    await tick();

    main.focus();
    key("b");
    await tick();
    expect(document.activeElement).toBe(
      document.querySelector('textarea[placeholder*="keep the knight"]'),
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
    firstCompare.resolve(true);
    await firstCompare.promise;
    await Promise.resolve();
    await tick();
    const compareCalls = onCompare.mock.calls.length;
    const contenteditable = document.createElement("div");
    contenteditable.contentEditable = "true";
    main.append(contenteditable);
    for (const target of [
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
    const ordinaryButton = document.querySelector<HTMLButtonElement>('button[aria-label="Keyboard shortcuts"]')!;
    const compareFromButton = new KeyboardEvent("keydown", { key: "c", code: "KeyC", altKey: true, bubbles: true, cancelable: true });
    Object.defineProperty(compareFromButton, "target", { value: ordinaryButton });
    Object.defineProperty(compareFromButton, "composedPath", { value: () => [ordinaryButton, main] });
    expect(regionKeyboard?.(compareFromButton)).toBe(true);
    expect(onCompare).toHaveBeenCalledTimes(compareCalls + 1);
    secondCompare.resolve(true);

    const timelineButton = document.querySelector<HTMLButtonElement>(".timeline [data-timeline-node][tabindex='0']")!;
    timelineButton.focus();
    const timelineArrow = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
    Object.defineProperty(timelineArrow, "target", { value: timelineButton });
    Object.defineProperty(timelineArrow, "composedPath", { value: () => [timelineButton, timelineButton.closest(".timeline")!, main] });
    expect(regionKeyboard?.(timelineArrow)).toBe(true);
    await tick();
    expect(document.body.textContent).toContain("Preview");
    expect(document.activeElement).toBe(document.querySelector(".timeline [data-timeline-node][tabindex='0']"));
    expect(document.querySelectorAll(".timeline [data-timeline-node][tabindex='0']")).toHaveLength(1);

    const nativeSpace = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    Object.defineProperty(nativeSpace, "target", { value: ordinaryButton });
    Object.defineProperty(nativeSpace, "composedPath", { value: () => [ordinaryButton, main] });
    expect(regionKeyboard?.(nativeSpace)).toBe(false);
    main.focus(); key(" ");
    await tick();
    expect(
      document.querySelector<HTMLButtonElement>('[aria-pressed="true"]'),
    ).not.toBeNull();
    key("e");
    expect(onExport).toHaveBeenCalledOnce();

    ordinaryButton.focus(); key("Escape"); await tick();
    expect(document.activeElement).toBe(main);

    key("?");
    await tick();
    expect(document.querySelector('[aria-labelledby="shortcut-title"]')).not.toBeNull();
    expect(document.activeElement?.id).toBe("shortcut-title");
    expect(document.querySelector('[aria-labelledby="shortcut-title"]')?.textContent).toContain("Workspace");
    expect(document.querySelector('[aria-labelledby="shortcut-title"]')?.textContent).toContain("G then H");
    expect(document.querySelector('[aria-labelledby="shortcut-title"]')?.textContent).toContain("Rehearsal");
    expect(document.body.textContent).toContain("Shift + R");
    expect(main.closest("[inert]")).not.toBeNull();
    const modalClose = document.querySelector<HTMLButtonElement>('[aria-labelledby="shortcut-title"] button')!;
    modalClose.focus();
    const wrappedTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    modalClose.dispatchEvent(wrappedTab);
    expect(wrappedTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(modalClose);
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

  it("shares one branch-switch lifecycle across every branch entry and keeps a failed target retryable", async () => {
    const run = branchedRun();
    const first = deferred<boolean>();
    const onSwitchBranch = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(true);
    const component = mountDrill({
      target: target(),
      props: {
        pack,
        snapshot: { run, access: "writer", pendingEvidence: 0, withheld: false },
        onMove: vi.fn(),
        onRewind: vi.fn(),
        onFork: vi.fn(),
        onSwitchBranch,
        onCompare: vi.fn(),
        onCloseCompare: vi.fn(),
        onContinueCheckpoint: vi.fn(),
        onExport: vi.fn(),
        onStop: vi.fn(),
        registerKeyboardRegion,
      },
    });
    await tick();
    const targetBranch = run.branches.find((branch) => branch.id !== run.activeCursor.branchId)!;
    const branchButton = document.querySelector<HTMLButtonElement>(`.branch-card[aria-label*="${targetBranch.label}"]`)!;

    branchButton.click();
    branchButton.click();
    await tick();
    expect(onSwitchBranch).toHaveBeenCalledTimes(1);
    expect(document.querySelector("#branch-switch-status")?.textContent).toContain(`Opening ${targetBranch.label}`);
    expect([...document.querySelectorAll<HTMLButtonElement>(".branch-card, .branch-links button")].every((button) => button.disabled)).toBe(true);

    first.resolve(false);
    await first.promise;
    await tick();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(`${targetBranch.label} did not open`);
    expect(branchButton.disabled).toBe(false);

    branchButton.click();
    await vi.waitFor(() => expect(onSwitchBranch).toHaveBeenCalledTimes(2));
    await unmount(component);
  });
});
