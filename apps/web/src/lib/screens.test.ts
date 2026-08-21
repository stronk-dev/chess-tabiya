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
    expect(chessground.configs.at(-1)!.drawable!.shapes).toEqual([{ orig: "a1", dest: "h8", brush: "red" }]);
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
      engine: { id: "maia", name: "Maia", version: "3", seedHonored: false },
      targetElo: 1500,
      candidates: [{ moveUci: "e8e7", mass: .4, rank: 1 }],
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
      .find((button) => button.textContent?.includes("Show recorded human-model split"));
    expect(request).toBeDefined();
    request!.click();
    expect(onHumanSplit).toHaveBeenCalledWith(run.activeCursor.nodeId);
    await vi.waitFor(() => expect(document.querySelector("[aria-label='Human-model evidence']")?.textContent).toContain("e8e7 40%"));
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
    expect(document.querySelector(".guidance-panel")?.textContent).toContain("The queens have left the board.");
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
      reviewStatus: "draft",
      channel: "community",
    };
    const component = mount(PackList, {
      target: target(),
      props: { packs: [summary], onSelect },
    });

    expect(document.body.textContent).toContain("advanced club");
    expect(document.body.textContent).toContain("unreviewed draft");
    expect(document.body.textContent).toContain("opening");
    document.querySelector<HTMLButtonElement>(".pack-card button")!.click();
    expect(onSelect).toHaveBeenCalledWith(pack.id);
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
    expect(document.body.textContent).toContain("Recorded branch strips");
    const compareSections = [...document.querySelectorAll(".compare > section")];
    expect(compareSections.indexOf(document.querySelector(".narrative")!)).toBeLessThan(
      compareSections.indexOf(document.querySelector(".trajectory")!),
    );
    expect(document.querySelector(".boards")?.getAttribute("data-zoom")).toBe("near");
    expect(document.querySelectorAll(".boards [aria-label='Chessboard']")).toHaveLength(1);
    document.querySelector<HTMLButtonElement>(".zoom-control button")!.click();
    await tick();
    expect(document.querySelector(".boards")?.getAttribute("data-zoom")).toBe("far");
    expect(document.querySelectorAll(".boards [aria-label='Chessboard']")).toHaveLength(0);
    expect(document.body.textContent).toContain("active");
    expect(document.querySelectorAll(".sparkline span")).toHaveLength(comparison.columns.reduce((total,column)=>total+comparison.evidence[column.branchId]!.length,0));
    document.querySelector<HTMLButtonElement>(".narrative > button")!.click();
    await tick();
    expect(document.body.textContent).toContain("recorded branches share");
    expectDisabledControlsExplained();
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
