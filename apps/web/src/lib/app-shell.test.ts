// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { REVIEW_MAP_CONVENTION, commitMove, createRun, fork as forkRun, rewind as rewindRun } from "@chess-tabiya/runtime";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import fixtureJson from "../../../../schemas/drill_pack.example.json?raw";

vi.mock("@lichess-org/chessground", () => ({
  Chessground: (_element: HTMLElement, _config: Config) =>
    ({ set() {}, destroy() {} }) as unknown as Api,
}));

import App from "../App.svelte";
import type {
  Capabilities,
  AssignedPack,
  ClassroomDetail,
  DrillClientApi,
  LiveSessionSummary,
  LiveSessionDetail,
  PackDraft,
  PackSummary,
  RepertoireGapPage,
  RepertoireSummary,
  RunPage,
  RunSummary,
  ShapeDraft,
  ReviewMap,
  DeletionPreview,
  Learner,
} from "./api.js";
import { saveWorkflowPreference } from "./assistance-preference.js";
import { setPreferenceField } from "@chess-tabiya/runtime";
import { HistoryRouter } from "./router.js";
import { WriterSession, writerStorageKey, type KeyValueStorage } from "./writer-session.js";
import { botRosterFixture } from "./bot-roster.test-support.js";

const pack = JSON.parse(fixtureJson) as DrillPackDefinition;
const E4_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
/** A minimal valid Review Map payload with one moment card (rfc/review-map.md). */
function reviewPayload(options: { readonly runId: string; readonly branchId: string; readonly source: ReviewMap["source"]; readonly ready?: boolean; readonly nodeId?: string; readonly entryNodeId?: string; readonly ply?: number; readonly fen?: string }): ReviewMap {
  const ready = options.ready ?? true;
  return {
    runId: options.runId, branchId: options.branchId, side: "white", ready, pendingEvidence: ready ? 0 : 1,
    source: options.source, outcome: { kind: "unfinished" }, storyTitle: "A game story at move 1",
    viewer: { mayWrite: true }, semanticPath: { kind: "available", events: 0 },
    convention: REVIEW_MAP_CONVENTION, context: "review", rows: [],
    moments: [{ nodeId: options.nodeId ?? "moment-1", entryNodeId: options.entryNodeId ?? "entry-1", ply: options.ply ?? 1, san: "e4", fen: options.fen ?? E4_FEN, phase: "opening", kinds: ["eval_pivot"], heading: "Evaluation shift", moveLabel: "Move 1 · e4", sentences: ["A recorded fact."], sourceLabels: ["Recorded engine analysis"], sourcesSentence: "Sources: Recorded engine analysis." }],
    momentsSentence: "Up to three recorded moments, at most one per game phase, from 1 admitted story moments. This is not a ranking of the play.", considered: 1,
    accuracy: {
      white: { side: "white", kind: "no_decisions", decisions: 0, evaluated: 0, sentence: "White: no accuracy figure, because White made no move on this line." },
      black: { side: "black", kind: "no_decisions", decisions: 0, evaluated: 0, sentence: "Black: no accuracy figure, because Black made no move on this line." },
    },
    coverage: { evaluated: 0, positions: 1, sentence: "Evaluation coverage: 0 of 1 positions on this line carry a recorded engine evaluation." },
    footer: { labels: ["Recorded game"], sentence: "Sources on this review: Recorded game." },
    evalGraph: { kind: "abstained", side: "white", points: [], gaps: [], evaluated: 0, caption: "No position on this line carries a recorded engine evaluation, so no evaluation graph is drawn.", coverage: "0 of 0 moves have a recorded evaluation after them." },
    compareDoors: [], openRetryEntryNodeId: null,
  };
}

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const digest = `sha256:${"a".repeat(64)}`;
const run = createRun({
  id: "route-run",
  packId: pack.id,
  packDigest: digest,
  policyConfig: {
    seedMode: "fixed",
    locus: { executedAt: "server", engineIds: [], modelIds: [] },
  },
  startFen: pack.start.fen,
  seed: 17,
  createdAt: "2026-08-11T20:00:00.000Z",
});

function completedPositionRun(id: string) {
  let completed = createRun({
    id,
    session: {
      kind: "position",
      start: { fen: INITIAL_FEN, side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common", targetElo: 1800 },
    },
    sessionDigest: `sha256:${"b".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 23,
    createdAt: "2026-09-13T11:30:00.000Z",
  });
  for (const move of ["f2f3", "e7e5", "g2g4", "d8h4"] as const) {
    completed = commitMove(completed, move, { at: "2026-09-13T11:31:00.000Z" }).run;
  }
  return completed;
}

const packSummary: PackSummary = {
  id: pack.id,
  version: pack.version,
  digest,
  title: pack.title as string,
  mode: pack.mode as string,
  phase: "opening",
  difficulty: pack.difficulty,
  objectiveSummary: pack.objective.summary ?? pack.objective.type.replaceAll("_", " "),
  concepts: pack.concepts ?? [],
  reviewStatus: "schema_example",
  channel: "official",
};

const runSummary: RunSummary = {
  id: run.id,
  title: pack.title as string,
  sessionKind: "pack",
  packId: pack.id,
  sessionDigest: digest,
  updatedAt: "2026-08-11T21:00:00.000Z",
  objectiveState: "active",
  branchCount: 1,
  recordedMoveCount: 0,
  viewerRole: "host",
  leaseHeldBy: { learnerId: "learner-test", handle: "test" },
};

const capabilities: Capabilities = {
  evidenceManifest: { digest: "fixture", counts: { producers: 25, projections: 146, consumers: 25, bindings: 182, semanticEvents: 40, eligibility: 40, reasons: 15, selectionPolicies: 1 }, availability: [], bindings: [] },
  engines: [],
  policyModes: ["human_common"],
  unsupportedPolicyModes: [],
  feedbackPolicies: ["delayed_checkpoint", "segment_end", "immediate_guard"],
  guardBasis: ["rules", "engine"],
  recordedReadingKinds: [],
  assessmentCategories: ["win", "loss", "draw", "cursed-win", "blessed-loss"],
  objectiveAssessmentSets: { win: ["win"], hold: ["draw", "cursed-win", "blessed-loss"], save: ["loss", "blessed-loss"], resist: ["loss", "blessed-loss"] },
  runSchemaVersion: "0.6",
  policyProfiles: {
    strong_engine: { movetimeMs: 100, threads: 1, hashMb: 16, multiPv: 1 },
    human_common: {
      elo: { min: null, max: null, default: null, source: "unpublished", advertised: { min: null, max: null } },
      resistance: {
        basis: "measured", metric: "dtz_percentile",
        scope: "positions of at most seven pieces in which every legal move preserves the mover's tablebase category",
        corpus: { dossier: "design/research/maia-endgame-fidelity.md#6", positions: 15, probes: 270, measuredAt: "2026-08-16" },
        bands: [1100, 1500, 1900], bandConditioned: false,
        dtzPercentile: { min: 0.719, max: 0.751, uniformBaseline: 0.38 },
        slowestLosingRate: { min: 0.611, max: 0.689, uniformBaseline: 0.227 },
        fastestLosingRate: { value: 0.033, uniformBaseline: 0.313 },
      },
      profiles: botRosterFixture(),
    },
  },
  providers: { opponent: "mock", judge: "mock", llm: "none", corpus: "mock", tts: "none", tablebase: "mock" },
  surfaces: {
    play: "available",
    review: "available",
    learn: "unavailable-here",
    live: "available",
    create: "unavailable-here",
    justPlay: "unavailable-here",
    fromPosition: "unavailable-here",
  },
};

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function api(): DrillClientApi {
  return {
    async capabilities() {
      return capabilities;
    },
    async packs() {
      return [packSummary];
    },
    async pack() {
      return { document: pack, digest };
    },
    async shapes() { return []; },
    async shape() { throw new Error("no shapes in shell fixture"); },
    async runs() {
      return [runSummary];
    },
    async events(_runId: string, sinceSeq = 0) {
      return {
        events: run.events.filter((event) => event.seq > sinceSeq),
        nextSeq: run.events.at(-1)!.seq,
      };
    },
    async graph() {
      return {
        id: run.id,
        viewer: {
          role: "host" as const,
          mayWrite: true,
          holdsLease: true,
          leaseHeldBy: { learnerId: "learner-a", handle: "alice" },
        },
        nodes: run.nodes,
        branches: run.branches,
        activeCursor: run.activeCursor,
      };
    },
    async authoredFeedback() {
      return { items: [], hasWithheldAuthoredContent: false };
    },
    async pgn() {
      return { filename: "route-run.pgn", text: "[Event \"Tabiya\"]\n" };
    },
  } as unknown as DrillClientApi;
}

function dueQueue(schedules: readonly import("./api.js").ProgressSchedule[], waiting = 0): import("./api.js").DueQueuePage {
  return { schedules: schedules.map((schedule) => ({ ...schedule, frequency: null, standing: "new" as const })), waiting, intakeLimit: 20 };
}

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

function key(value: string, options: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key: value,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  window.dispatchEvent(event);
  return event;
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

afterEach(() => {
  document.body.replaceChildren();
  history.replaceState(null, "", "/");
});

describe("application shell", () => {
  it("offers imported-story narration only after persona voice is selected", async () => {
    history.replaceState(null, "", "/review/game/route-run");
    const story = reviewPayload({ runId: "route-run", branchId: "main", source: { kind: "pgn_paste", headers: { White: "Ada", Black: "Mina" }, result: "*", importedAt: "2026-09-08T12:00:00.000Z" } });
    const voice = vi.fn(async () => ({ text: "Grounded narration.", source: "provider" as const, scope: "story" as const }));
    const storyApi: DrillClientApi = {
      ...api(),
      async capabilities() { return { ...capabilities, providers: { ...capabilities.providers, llm: "external" } }; },
      async review() { return story; },
      voice,
    };

    const authoredStorage = new MemoryStorage();
    const authored = mount(App, { target: target(), props: { api: storyApi, router: new HistoryRouter(window), storage: authoredStorage } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("Ada – Mina"));
    expect([...document.querySelectorAll("button")].some((button) => button.textContent === "Explain this moment")).toBe(false);
    await unmount(authored);
    document.body.replaceChildren();

    const personaStorage = new MemoryStorage();
    saveWorkflowPreference("imported", setPreferenceField("imported", { kind: "unset" }, "voice", "persona"), personaStorage);
    const persona = mount(App, { target: target(), props: { api: storyApi, router: new HistoryRouter(window), storage: personaStorage } });
    const narrate = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Explain this moment");
      expect(button).toBeDefined();
      return button!;
    });
    narrate.click();
    await vi.waitFor(() => expect(voice).toHaveBeenCalledWith("route-run", "moment-1", "story"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Grounded narration."));
    await unmount(persona);
  });

  it("keeps a crossed Story document and share receipt out of the route, then retries the same game", async () => {
    history.replaceState(null, "", "/review/game/route-run");
    const valid = reviewPayload({ runId: "route-run", branchId: "main", source: { kind: "native" } });
    let storyReads = 0;
    const shareStory = vi.fn(async () => ({
      id: "crossed-share",
      token: "crossed-token",
      url: "/shared/crossed-token",
      scope: "story_read" as const,
      runId: "another-run",
      branchId: "main",
      createdAt: "2026-09-13T12:00:00.000Z",
      revokedAt: null,
    }));
    const component = mount(App, {
      target: target(),
      props: {
        api: {
          ...api(),
          async review() {
            storyReads += 1;
            return storyReads === 1 ? { ...valid, runId: "another-run" } : valid;
          },
          async storyShares() { return []; },
          shareStory,
        },
        router: new HistoryRouter(window),
        storage: new MemoryStorage(),
      },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("This page could not be loaded. Check your connection and try again."));
    expect(location.pathname).toBe("/review/game/route-run");
    expect(document.body.textContent).not.toContain("Review of this run");
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Try again")!
      .click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Review of this run"));
    expect(storyReads).toBe(2);

    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Share review")!
      .click();
    await vi.waitFor(() => expect(document.querySelector(".share-management [role='alert']")?.textContent).toContain("could not be created"));
    expect(document.body.textContent).not.toContain("/shared/crossed-token");
    expect(shareStory).toHaveBeenCalledWith("route-run", "main");
    await unmount(component);
  });

  it("keeps the newest Story poll when an older refresh resolves last", async () => {
    vi.useFakeTimers();
    history.replaceState(null, "", "/review/game/route-run");
    const storyWith = (white: string, ready: boolean): ReviewMap => reviewPayload({ runId: "route-run", branchId: "main", ready, source: { kind: "pgn_paste", headers: { White: white, Black: "Black" }, result: "*", importedAt: "2026-09-08T12:00:00.000Z" } });
    const older = deferred<ReviewMap>();
    const newer = deferred<ReviewMap>();
    let storyCalls = 0;
    const storyApi: DrillClientApi = {
      ...api(),
      async review() {
        storyCalls += 1;
        if (storyCalls === 1) return storyWith("Initial", false);
        if (storyCalls === 2) return older.promise;
        return newer.promise;
      },
    };
    const component = mount(App, { target: target(), props: { api: storyApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(document.body.textContent).toContain("Initial – Black");

    await vi.advanceTimersByTimeAsync(1_000);
    expect(storyCalls).toBe(2);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(storyCalls).toBe(3);
    newer.resolve(storyWith("Newer", true));
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(document.body.textContent).toContain("Newer – Black");

    older.resolve(storyWith("Older", true));
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(document.body.textContent).toContain("Newer – Black");
    expect(document.body.textContent).not.toContain("Older – Black");
    await unmount(component);
    vi.useRealTimers();
  });

  it("does not publish a departed Story share into the next game", async () => {
    history.replaceState(null, "", "/review/game/route-run");
    const storyWith = (runId: string, white: string): ReviewMap => reviewPayload({ runId, branchId: `branch-${runId}`, nodeId: `moment-${runId}`, entryNodeId: `entry-${runId}`, source: { kind: "pgn_paste", headers: { White: white, Black: "Black" }, result: "*", importedAt: "2026-09-08T12:00:00.000Z" } });
    const oldShare = deferred<import("./api.js").CreatedStoryShare>();
    const storyShares = vi.fn(async (runId: string) => runId === "other-run" ? [{
      id: "other-share", scope: "story_read" as const, runId, branchId: "branch-other-run",
      createdAt: "2026-09-13T10:00:00.000Z", revokedAt: null,
    }] : []);
    const shareStory = vi.fn(() => oldShare.promise);
    const storyApi: DrillClientApi = {
      ...api(),
      async review(runId) { return storyWith(runId, runId === "route-run" ? "Old game" : "Current game"); },
      storyShares,
      shareStory,
      async revokeStoryShare(runId, tokenId) {
        return { revoked: true, runId, tokenId, revokedAt: "2026-09-13T10:05:00.000Z" };
      },
    };
    const router = new HistoryRouter(window);
    const component = mount(App, { target: target(), props: { api: storyApi, router, storage: new MemoryStorage() } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("Old game – Black"));

    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Share review")!.click();
    await vi.waitFor(() => expect(shareStory).toHaveBeenCalledWith("route-run", "branch-route-run"));
    router.navigate("/review/game/other-run");
    await vi.waitFor(() => expect(document.body.textContent).toContain("Current game – Black"));
    expect(document.querySelectorAll("[aria-label='Review share links'] li")).toHaveLength(1);

    oldShare.resolve({
      id: "departed-share",
      token: "departed-token",
      url: "/shared/departed-token",
      scope: "story_read",
      runId: "route-run",
      branchId: "branch-route-run",
      createdAt: "2026-09-13T10:00:00.000Z",
      revokedAt: null,
    });
    await tick();
    await Promise.resolve();
    expect(storyShares.mock.calls.map(([runId]) => runId)).toEqual(["route-run", "other-run"]);
    expect(document.body.textContent).toContain("Current game – Black");
    expect(document.body.textContent).not.toContain("/stories/departed");
    expect(document.querySelectorAll("[aria-label='Review share links'] li")).toHaveLength(1);
    await unmount(component);
  });

  it("does not persist Story writer authority when taking the lease fails", async () => {
    history.replaceState(null, "", "/review/game/route-run");
    const storage = new MemoryStorage();
    const story = reviewPayload({ runId: "route-run", branchId: run.branches[0]!.id, source: { kind: "native" }, nodeId: run.nodes[0]!.id, entryNodeId: run.nodes[0]!.id, ply: 0, fen: run.nodes[0]!.fen });
    const rewind = vi.fn();
    const component = mount(App, {
      target: target(),
      props: {
        api: {
          ...api(),
          async review() { return story; },
          async claimLease() { throw new Error("private lease holder detail"); },
          rewind,
        },
        router: new HistoryRouter(window),
        storage,
      },
    });

    const enter = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Retry from here");
      expect(button).toBeDefined();
      return button!;
    });
    enter.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("The review is still here; try again."));
    expect(document.body.textContent).not.toContain("private lease holder detail");
    expect(storage.values.size).toBe(0);
    expect(rewind).not.toHaveBeenCalled();
    expect(enter.disabled).toBe(false);
    await unmount(component);
  });

  it("finishes a valid Story re-entry without navigating after leaving that Story", async () => {
    history.replaceState(null, "", "/review/game/route-run");
    const storage = new MemoryStorage();
    const pendingRewind = deferred<ReturnType<typeof rewindRun>>();
    const rewound = rewindRun(run, run.nodes[0]!.id, "2026-09-13T13:10:00.000Z");
    const branched = forkRun(rewound.run, run.nodes[0]!.id, {
      label: "story-reentry",
      intent: "Retry from this reviewed position",
      at: "2026-09-13T13:11:00.000Z",
    });
    const story = reviewPayload({ runId: "route-run", branchId: run.branches[0]!.id, source: { kind: "native" }, nodeId: run.nodes[0]!.id, entryNodeId: run.nodes[0]!.id, ply: 0, fen: run.nodes[0]!.fen });
    const claimLease = vi.fn(async () => undefined);
    const rewind = vi.fn(() => pendingRewind.promise);
    const fork = vi.fn(async () => branched);
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: {
        api: { ...api(), async review() { return story; }, claimLease, rewind, fork },
        router,
        storage,
      },
    });

    const enter = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Retry from here");
      expect(button).toBeDefined();
      return button!;
    });
    enter.click();
    await vi.waitFor(() => expect(rewind).toHaveBeenCalledTimes(1));
    const writerId = storage.values.get(writerStorageKey(run.id));
    expect(writerId).toBeTruthy();
    expect(claimLease).toHaveBeenCalledWith(run.id, writerId);
    router.navigate("/review");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/review"));
    pendingRewind.resolve(rewound);
    await vi.waitFor(() => expect(fork).toHaveBeenCalledWith(
      run.id,
      { nodeId: run.nodes[0]!.id, label: "story-reentry", intent: "Retry from this reviewed position" },
      writerId,
    ));
    expect(window.location.pathname).toBe("/review");
    await unmount(component);
  });

  it("owns one Library PGN download and keeps provider failures out of learner copy", async () => {
    history.replaceState(null, "", "/library");
    const failed = deferred<{ readonly filename: string; readonly text: string }>();
    const pgn = vi.fn()
      .mockImplementationOnce(() => failed.promise)
      .mockResolvedValueOnce({ filename: "route-run.pgn", text: "[Event \"Tabiya\"]\n" });
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:library-export");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), pgn }, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const download = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Download PGN");
      expect(button).toBeDefined();
      return button!;
    });
    download.click();
    await vi.waitFor(() => expect(download.textContent).toBe("Preparing PGN…"));
    download.click();
    expect(pgn).toHaveBeenCalledTimes(1);
    failed.reject(new Error("private PGN storage detail"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("This PGN could not be prepared."));
    expect(document.body.textContent).not.toContain("private PGN storage detail");
    expect(download.disabled).toBe(false);

    download.click();
    await vi.waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    click.mockRestore();
    createObjectURL.mockRestore();
    await unmount(component);
  });

  it("does not start a Library download after the learner leaves", async () => {
    history.replaceState(null, "", "/library");
    const pending = deferred<{ readonly filename: string; readonly text: string }>();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), pgn: vi.fn(() => pending.promise) }, router, storage: new MemoryStorage() },
    });

    const download = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Download PGN");
      expect(button).toBeDefined();
      return button!;
    });
    download.click();
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    pending.resolve({ filename: "departed.pgn", text: "[Event \"Departed\"]\n" });
    await tick();
    await Promise.resolve();
    expect(click).not.toHaveBeenCalled();
    click.mockRestore();
    await unmount(component);
  });

  it("binds Library deletion preview and confirmation to one run and bounded retry state", async () => {
    history.replaceState(null, "", "/library");
    const preview: DeletionPreview = {
      version: 1,
      scope: { kind: "run", runId: runSummary.id },
      digest,
      hardDelete: [{ kind: "run", count: 1, objectIds: [runSummary.id], label: "This private run is permanently deleted" }],
      tombstone: [], revoke: [], retainedPublished: [],
      backupNotice: "Live data is removed immediately.",
    };
    const runDeletionPreview = vi.fn()
      .mockResolvedValueOnce({ ...preview, scope: { kind: "run", runId: "crossed-run" } })
      .mockResolvedValueOnce(preview);
    const failedDelete = deferred<void>();
    const deleteRun = vi.fn()
      .mockImplementationOnce(() => failedDelete.promise)
      .mockResolvedValueOnce(undefined);
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), runDeletionPreview, deleteRun }, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const deleteButton = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Delete this run");
      expect(button).toBeDefined();
      return button!;
    });
    deleteButton.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("The deletion effects could not be loaded."));
    expect(document.body.textContent).not.toContain("crossed-run");
    deleteButton.click();
    const confirm = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Confirm deletion");
      expect(button).toBeDefined();
      return button!;
    });
    confirm.click();
    await vi.waitFor(() => expect(confirm.textContent).toBe("Deleting…"));
    confirm.click();
    expect(deleteRun).toHaveBeenCalledTimes(1);
    expect(deleteRun).toHaveBeenCalledWith(runSummary.id, digest);
    failedDelete.reject(new Error("private deletion database detail"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("This game could not be deleted."));
    expect(document.body.textContent).not.toContain("private deletion database detail");
    expect(document.body.textContent).toContain("This private run is permanently deleted");
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Confirm deletion")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("No saved games yet."));
    expect(deleteRun).toHaveBeenCalledTimes(2);
    await unmount(component);
  });

  it("does not remove a newly loaded Library projection when an old deletion settles", async () => {
    history.replaceState(null, "", "/library");
    const preview: DeletionPreview = {
      version: 1,
      scope: { kind: "run", runId: runSummary.id },
      digest,
      hardDelete: [], tombstone: [], revoke: [], retainedPublished: [],
      backupNotice: "Live data is removed immediately.",
    };
    const pendingDelete = deferred<void>();
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: {
        api: { ...api(), async runDeletionPreview() { return preview; }, deleteRun: vi.fn(() => pendingDelete.promise) },
        router,
        storage: new MemoryStorage(),
      },
    });

    const deleteButton = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Delete this run");
      expect(button).toBeDefined();
      return button!;
    });
    deleteButton.click();
    const confirm = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Confirm deletion");
      expect(button).toBeDefined();
      return button!;
    });
    confirm.click();
    await vi.waitFor(() => expect(confirm.textContent).toBe("Deleting…"));
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    router.navigate("/library");
    await vi.waitFor(() => expect(document.body.textContent).toContain(String(pack.title)));
    pendingDelete.resolve();
    await tick();
    await Promise.resolve();
    expect(window.location.pathname).toBe("/library");
    expect(document.body.textContent).toContain(String(pack.title));
    await unmount(component);
  });

  it("does not start an account archive download after Settings has been left", async () => {
    history.replaceState(null, "", "/settings");
    const pendingExport = deferred<{ readonly blob: Blob; readonly filename: string; readonly digest: string }>();
    const preview: DeletionPreview = {
      version: 1,
      scope: { kind: "account" },
      digest,
      hardDelete: [], tombstone: [], revoke: [], retainedPublished: [],
      backupNotice: "Live data is removed immediately.",
    };
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: {
        api: {
          ...api(),
          async session() { return { id: "learner-a", handle: "alice", createdAt: "2026-09-13T13:30:00.000Z" }; },
          async accountDeletionPreview() { return preview; },
          exportAccount: vi.fn(() => pendingExport.promise),
        },
        router,
        storage: new MemoryStorage(),
      },
    });

    const exportPassword = await vi.waitFor(() => {
      const input = document.querySelector<HTMLInputElement>('#account-settings input[autocomplete="current-password"]');
      expect(input).not.toBeNull();
      return input!;
    });
    exportPassword.value = "export-password";
    exportPassword.dispatchEvent(new Event("input", { bubbles: true }));
    [...document.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find((button) => button.textContent === "Download my data")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Preparing one private account archive."));
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    pendingExport.resolve({ blob: new Blob(["private"]), filename: "tabiya-account.json", digest });
    await tick();
    await Promise.resolve();
    expect(click).not.toHaveBeenCalled();
    click.mockRestore();
    await unmount(component);
  });

  it("turns an empty Home into a direct rehearsal start instead of an empty resume card", async () => {
    const emptyApi: DrillClientApi = { ...api(), async runs() { return []; } };
    const component = mount(App, {
      target: target(),
      props: { api: emptyApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Start the first rehearsal"));
    expect(document.body.textContent).toContain("Do not just learn the move. Rehearse the game it creates.");
    expect(document.body.textContent).toContain("How Tabiya works");
    expect(document.body.textContent).toContain("Play the consequence");
    expect(document.body.textContent).toContain("Your first attempt stays intact");
    expect(document.body.textContent).toContain("Grounded feedback, not invented chess truth");
    expect(document.body.textContent).toContain("0 rehearsals are due");
    expect(document.body.textContent).toContain("Pick up a thread");
    expect(document.body.textContent).not.toContain("No previous run yet");
    await unmount(component);
  });

  it("shows the public catalogue and resumes the chosen rehearsal after registration", async () => {
    history.replaceState(null, "", "/play");
    let authenticated = false;
    let packCalls = 0;
    let createCalls = 0;
    const base = api();
    const authApi: DrillClientApi = {
      ...base,
      async session() {
        throw new Error("AUTH_REQUIRED");
      },
      async register(handle: string) {
        authenticated = true;
        return {
          id: "learner-new",
          handle,
          displayName: handle,
          createdAt: "2026-08-16T20:00:00.000Z",
        };
      },
      async packs() {
        packCalls += 1;
        return [packSummary];
      },
      async createRun(input) {
        createCalls += 1;
        return createRun({
          id: input.id,
          packId: pack.id,
          packDigest: digest,
          policyConfig: input.policyConfig,
          startFen: pack.start.fen,
          seed: input.seed,
          createdAt: "2026-08-29T17:00:00.000Z",
        });
      },
    };
    const component = mount(App, {
      target: target(),
      props: { api: authApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Choose the game you want to understand."));
    expect(document.body.textContent).toContain("Do not just learn the move. Rehearse the game it creates.");
    expect(document.body.textContent).toContain(pack.title);
    expect(packCalls).toBe(1);
    document.querySelector<HTMLButtonElement>(".open-pack")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Create an account or sign in to keep"));
    expect(document.body.textContent).toContain("Create your learner account.");
    expect(document.body.textContent).toContain("Creating an account keeps the games and rehearsals you save");
    expect(document.body.textContent).toContain("preview what deletion removes, anonymizes, or keeps as shared or published history");
    expect(document.querySelector<HTMLButtonElement>(".auth-gate button[type=submit]")?.getAttribute("aria-describedby")).toBe("registration-data-disclosure registration-password-warning");
    const inputs = document.querySelectorAll<HTMLInputElement>(".auth-gate input");
    inputs[0]!.value = "new_learner";
    inputs[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    inputs[1]!.value = "browser-test-password";
    inputs[1]!.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector<HTMLFormElement>(".auth-gate form")!.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(createCalls).toBe(1));
    await tick();
    expect(location.pathname).toMatch(/^\/play\/run\//u);
    expect(createCalls).toBe(1);
    expect(packCalls).toBeGreaterThanOrEqual(2);
    expect(document.body.textContent).not.toContain("AUTH_REQUIRED");
    await unmount(component);
  });

  it("bounds a public catalogue failure and retries the same route", async () => {
    history.replaceState(null, "", "/play");
    let packReads = 0;
    const publicApi: DrillClientApi = {
      ...api(),
      async session() { throw new Error("AUTH_REQUIRED"); },
      async packs() {
        packReads += 1;
        if (packReads === 1) throw new Error("private catalogue topology");
        return [packSummary];
      },
    };
    const component = mount(App, {
      target: target(),
      props: { api: publicApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Rehearsal positions could not be loaded. Check your connection and try again."));
    expect(document.body.textContent).not.toContain("private catalogue topology");
    expect(document.body.textContent).not.toContain("No positions match those filters.");
    const retry = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Try again")!;
    retry.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain(packSummary.title));
    expect(packReads).toBe(2);
    await unmount(component);
  });

  it("bounds an authenticated route failure, retries it, and ignores a departed failure", async () => {
    history.replaceState(null, "", "/library");
    let packReads = 0;
    const departedReview = deferred<RunPage>();
    const routeApi: DrillClientApi = {
      ...api(),
      async packs() {
        packReads += 1;
        if (packReads === 1) throw new Error("private library topology");
        return [packSummary];
      },
      async runPage(_limit = 50, offset = 0) {
        if (location.pathname === "/review") return departedReview.promise;
        return { runs: [runSummary], selection: { shown: offset + 1, total: offset + 1 } };
      },
    };
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: routeApi, router, storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("This page could not be loaded. Check your connection and try again."));
    expect(document.body.textContent).not.toContain("private library topology");
    const retry = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Try again")!;
    retry.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Packs and run artifacts"));

    router.navigate("/review");
    await vi.waitFor(() => expect(location.pathname).toBe("/review"));
    router.navigate("/play");
    await vi.waitFor(() => expect(document.body.textContent).toContain("Choose the game you want to understand."));
    departedReview.reject(new Error("departed private failure"));
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).not.toContain("departed private failure");
    expect(document.body.textContent).not.toContain("This page is temporarily unavailable.");
    await unmount(component);
  });

  it("keeps authentication single-flight and replaces provider diagnostics with retry copy", async () => {
    const pendingLogin = deferred<Learner>();
    let loginCalls = 0;
    const authApi: DrillClientApi = {
      ...api(),
      async session() { throw new Error("AUTH_REQUIRED"); },
      async login() {
        loginCalls += 1;
        return pendingLogin.promise;
      },
    };
    const component = mount(App, {
      target: target(),
      props: { api: authApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Return to your rehearsals."));
    const form = document.querySelector<HTMLFormElement>(".auth-gate form")!;
    const inputs = document.querySelectorAll<HTMLInputElement>(".auth-gate input");
    inputs[0]!.value = "returning_learner";
    inputs[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    inputs[1]!.value = "private-password";
    inputs[1]!.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(loginCalls).toBe(1));
    expect(document.body.textContent).toContain("Signing you in…");
    expect(inputs[0]!.disabled).toBe(true);
    expect(inputs[1]!.disabled).toBe(true);
    pendingLogin.reject(new Error("private authentication database detail"));

    await vi.waitFor(() => expect(document.body.textContent).toContain("You could not be signed in."));
    expect(document.body.textContent).not.toContain("private authentication database detail");
    expect(inputs[0]!.disabled).toBe(false);
    expect(inputs[1]!.disabled).toBe(false);
    expect(inputs[1]!.value).toBe("private-password");
    await unmount(component);
  });

  it("reconstructs a run directly from a reload-safe deep link", async () => {
    history.replaceState(null, "", "/play/run/route-run");
    const component = mount(App, {
      target: target(),
      props: {
        api: api(),
        router: new HistoryRouter(window),
        storage: new MemoryStorage(),
      },
    });

    await vi.waitFor(() => expect(document.querySelector("main.drill")).not.toBeNull());
    expect(document.body.textContent).toContain("Watching");
    expect(location.search).toBe("");
    expectDisabledControlsExplained();

    const main = document.querySelector<HTMLElement>("main.drill")!;
    main.focus();
    expect(key("Tab").defaultPrevented).toBe(false);

    main.focus();
    expect(key("g").defaultPrevented).toBe(true);
    expect(key("m").defaultPrevented).toBe(true);
    expect(document.querySelector("#primary-navigation")).toBeNull();
    expect(document.activeElement).toBe(main);

    main.focus();
    key("?");
    await vi.waitFor(() => expect(document.activeElement?.id).toBe("shortcut-title"));
    key("Escape");
    await vi.waitFor(() => expect(document.activeElement).toBe(main));
    await unmount(component);
  });

  it("owns the in-run match rail through duplicate, failure, retry, and crossed-refresh states", async () => {
    history.replaceState(null, "", "/play/run/route-run");
    const match = {
      sessionId: "match-session",
      whiteLearnerId: "learner-white",
      blackLearnerId: "learner-black",
      pausedAt: null,
      pauseProposedBy: null,
    };
    const detail: LiveSessionDetail = {
      session: {
        id: "match-session",
        runId: run.id,
        kind: "match",
        title: "Position Arena",
        boardControl: "host_directed",
        rotationCursor: 0,
        createdBy: "learner-host",
        createdAt: "2026-09-13T22:00:00.000Z",
      },
      role: "host",
      activeNodeId: run.activeCursor.nodeId,
      activeFen: pack.start.fen,
      leaseHeldBy: { learnerId: "learner-white", handle: "white" },
      grants: [{ learnerId: "learner-host", handle: "coach", role: "host", grantedAt: "2026-09-13T22:00:00.000Z" }],
      moveAuthorship: [],
      proposals: [],
      invitations: [],
      legs: [],
      match,
      marks: [],
    };
    const summary: LiveSessionSummary = {
      ...detail.session,
      board: {
        activeFen: detail.activeFen,
        objectiveState: "active",
        sideToMove: "white",
        plyCount: 0,
        pausedAt: null,
        leaseHeldBy: detail.leaseHeldBy,
        lastMoveAt: null,
      },
      match,
    };
    const firstAction = deferred<typeof match>();
    let actionAttempts = 0;
    const matchOperation = vi.fn(() => ++actionAttempts === 1 ? firstAction.promise : Promise.resolve(match));
    let detailReads = 0;
    const matchApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-host", handle: "coach", createdAt: "2026-09-13T21:00:00.000Z" }; },
      async liveSessions() { return [summary]; },
      async liveSession() {
        detailReads += 1;
        return detailReads === 1 ? detail : { ...detail, session: { ...detail.session, runId: "crossed-run" } };
      },
      matchOperation,
    };
    const component = mount(App, {
      target: target(),
      props: { api: matchApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const pause = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Pause for coaching");
      expect(candidate).toBeDefined();
      return candidate!;
    });
    pause.click();
    pause.click();
    await vi.waitFor(() => expect(matchOperation).toHaveBeenCalledTimes(1));
    expect(matchOperation).toHaveBeenCalledWith("match-session", "pause", undefined);
    expect(pause.disabled).toBe(true);
    expect(pause.getAttribute("aria-describedby")).toBe("active-match-action-busy");
    expect(document.getElementById("active-match-action-busy")?.textContent).toContain("Updating the match");

    firstAction.reject(new Error("private match provider failure"));
    await vi.waitFor(() => expect(document.querySelector("aside[aria-label='Live session rail']")?.textContent).toContain("The match action could not finish."));
    expect(document.body.textContent).not.toContain("private match provider failure");
    expect(pause.disabled).toBe(false);

    pause.click();
    await vi.waitFor(() => expect(matchOperation).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector("aside[aria-label='Live session rail']")?.textContent).toContain("The match action finished, but the board could not refresh."));
    expect(document.body.textContent).not.toContain("crossed-run");
    expect(pause.disabled).toBe(false);
    await unmount(component);
  });

  it("states why a spectator's submitted review rail is closed", async () => {
    const base = api();
    const spectatorApi: DrillClientApi = {
      ...base,
      async graph() {
        return {
          id: run.id,
          viewer: {
            role: "spectator" as const,
            mayWrite: false,
            holdsLease: false,
            leaseHeldBy: { learnerId: "learner-a", handle: "alice" },
            seatedInContest: false,
            reviewing: false,
            reviewRail: "closed_live_session" as const,
          },
          nodes: run.nodes,
          branches: run.branches,
          activeCursor: run.activeCursor,
        };
      },
    };
    history.replaceState(null, "", "/play/run/route-run");
    const component = mount(App, {
      target: target(),
      props: { api: spectatorApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.querySelector("aside[aria-label='Review access']")?.textContent)
      .toContain("Review tools are closed while this run has an open live session"));
    expect(document.querySelector("aside[aria-label='Review access']")?.textContent).toContain("Read access remains available");
    await unmount(component);
  });

  it("retains one distillation request and ignores its settlement after leaving the run", async () => {
    const terminalRun = commitMove(createRun({
      id: "distill-run",
      session: {
        kind: "position",
        start: { fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common" },
      },
      sessionDigest: digest,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 17,
      createdAt: "2026-08-25T12:00:00.000Z",
    }), "g6g7", { at: "2026-08-25T12:01:00.000Z" }).run;
    const draft: PackDraft = {
      id: "distilled-draft",
      packId: "distilled-distill-run",
      document: { ...pack, id: "distilled-distill-run" },
      digest,
      state: "draft",
      validation: { valid: false, issues: [] },
    };
    const first = deferred<{ draft: PackDraft; proposals: readonly Record<string, unknown>[]; dropped: readonly string[] }>();
    const second = deferred<{ draft: PackDraft; proposals: readonly Record<string, unknown>[]; dropped: readonly string[] }>();
    const distillRun = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const base = api();
    const distillApi: DrillClientApi = {
      ...base,
      async events(_runId: string, sinceSeq = 0) {
        return {
          events: terminalRun.events.filter((event) => event.seq > sinceSeq),
          nextSeq: terminalRun.events.at(-1)!.seq,
        };
      },
      async graph() {
        return {
          id: terminalRun.id,
          viewer: {
            role: "host" as const,
            mayWrite: true,
            holdsLease: true,
            leaseHeldBy: { learnerId: "learner-a", handle: "alice" },
            seatedInContest: false,
            reviewing: false,
            reviewRail: "not_applicable" as const,
          },
          nodes: terminalRun.nodes,
          branches: terminalRun.branches,
          activeCursor: terminalRun.activeCursor,
        };
      },
      distillRun,
      async packDrafts() { return []; },
    };
    history.replaceState(null, "", "/play/run/distill-run");
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: distillApi, router, storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Distill to draft"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Distill run'] > button")!.click();
    await vi.waitFor(() => expect(document.querySelector("#distilled-draft-title")).not.toBeNull());
    const input = document.querySelector<HTMLInputElement>("#distilled-draft-title")!;
    input.value = "  My mating-net branches  ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector<HTMLFormElement>("form[aria-label='Name distilled draft']")!.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );
    document.querySelector<HTMLFormElement>("form[aria-label='Name distilled draft']")!.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledWith("distill-run", {
      packId: "distilled-distill-run",
      title: "My mating-net branches",
      branchId: terminalRun.activeCursor.branchId,
    }));
    expect(distillRun).toHaveBeenCalledTimes(1);
    first.reject(new Error("private distillation worker trace"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The draft could not be created."));
    expect(document.body.textContent).not.toContain("private distillation worker trace");
    expect(input.value).toBe("  My mating-net branches  ");

    document.querySelector<HTMLFormElement>("form[aria-label='Name distilled draft']")!.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledTimes(2));
    router.navigate("/review");
    await vi.waitFor(() => expect(location.pathname).toBe("/review"));
    second.resolve({ draft, proposals: [], dropped: [] });
    await tick();
    await Promise.resolve();
    expect(location.pathname).toBe("/review");
    await unmount(component);
  });

  it("deep-links to review, opens a run, and derives read-only before rendering", async () => {
    history.replaceState(null, "", "/review");
    const router = new HistoryRouter(window);
    const storage = new MemoryStorage();
    const component = mount(App, {
      target: target(),
      props: { api: api(), router, storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Your games and rehearsals"));
    expect(document.querySelectorAll("nav a")).toHaveLength(9);
    expect(document.querySelector<HTMLAnchorElement>('nav a[href="/review"]')?.textContent).toBe("Review & import");
    document.querySelector<HTMLButtonElement>(".item-list button")!.click();

    await vi.waitFor(() => expect(document.querySelector("main.drill")).not.toBeNull());
    expect(location.pathname).toBe("/play/run/route-run");
    expect(document.body.textContent).toContain("Watching");
    expect(document.body.textContent).toContain(pack.title as string);
    expect(storage.values.size).toBe(0);
    expectDisabledControlsExplained();
    await unmount(component);
  });

  it("renders saved run identity and progress in learner vocabulary", async () => {
    const legacySummary: RunSummary = {
      ...runSummary,
      title: pack.id,
      objectiveState: "degraded",
    };
    const legacyApi: DrillClientApi = {
      ...api(),
      async runs() { return [legacySummary]; },
    };
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: legacyApi, router, storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.querySelector("#resume-title")?.textContent).toBe(packSummary.title));
    expect(document.querySelector(".resume-card")?.textContent).toContain("Objective weakened");
    expect(document.querySelector(".resume-card")?.textContent).not.toContain(pack.id);
    expect(document.querySelector(".resume-card")?.textContent).not.toContain("degraded");

    router.navigate("/review");
    await vi.waitFor(() => expect(document.querySelector(".item-list h2")?.textContent).toBe(packSummary.title));
    expect(document.querySelector(".item-list")?.textContent).toContain("Objective weakened");
    expect(document.querySelector(".item-list")?.textContent).not.toContain(pack.id);
    expect(document.querySelector(".item-list")?.textContent).not.toContain("degraded");
    await unmount(component);
  });

  it("does not let an older route response overwrite the current screen", async () => {
    const slowPlay = deferred<readonly PackSummary[]>();
    const oldPack = { ...packSummary, id: "old-route-pack", title: "Old route pack" };
    const currentPack = { ...packSummary, id: "current-library-pack", title: "Current library pack" };
    let packCalls = 0;
    const routedApi: DrillClientApi = {
      ...api(),
      async packs() {
        packCalls += 1;
        if (packCalls === 2) return slowPlay.promise;
        if (packCalls === 3) return [currentPack];
        return [packSummary];
      },
    };
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: routedApi, router, storage: new MemoryStorage() },
    });
    await vi.waitFor(() => expect(packCalls).toBe(1));

    router.navigate("/play");
    await vi.waitFor(() => expect(packCalls).toBe(2));
    router.navigate("/library");
    await vi.waitFor(() => expect(document.body.textContent).toContain(currentPack.title));

    slowPlay.resolve([oldPack]);
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).toContain(currentPack.title);
    expect(document.body.textContent).not.toContain(oldPack.title);
    expect(location.pathname).toBe("/library");
    await unmount(component);
  });

  it("renders a writer-aware Home resume card and every reserved shell route", async () => {
    const storage = new MemoryStorage();
    WriterSession.claimFor(run.id, storage, () => "writer-a");
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: api(), router, storage },
    });

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("You hold the board"),
    );
    expect(document.title).toBe("Home · Tabiya");
    key("?");
    await vi.waitFor(() => expect(document.activeElement?.id).toBe("shell-shortcuts-title"));
    expect(document.querySelector('[aria-labelledby="shell-shortcuts-title"]')?.textContent).toContain("Workspace");
    expect(document.querySelector('[aria-labelledby="shell-shortcuts-title"]')?.textContent).toContain("Rehearsal");
    expect(document.querySelector('[aria-labelledby="shell-shortcuts-title"]')?.textContent).toContain("Shift + R");
    key("Escape");
    const skip = document.querySelector<HTMLAnchorElement>(".skip-link")!;
    expect(skip.textContent).toBe("Skip to content");
    expect(skip.getAttribute("href")).toBe("#main-content");
    expect(document.getElementById("main-content")?.getAttribute("tabindex")).toBe("-1");
    document
      .querySelector<HTMLButtonElement>(".resume-card button")!
      .click();
    await vi.waitFor(() => expect(document.querySelector("main.drill")).not.toBeNull());
    expect(location.pathname).toBe("/play/run/route-run");
    expect(document.body.textContent).toContain("Your move");
    expect(document.body.textContent).not.toContain("Writer");
    router.navigate("/");
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("You hold the board"),
    );

    const routes = [
      ["/play", "Choose the game you want to understand."],
      ["/learn", "Return to the positions"],
      ["/rating", "Your measured record"],
      ["/live", "Rehearse with other people"],
      ["/create", "Author against the real validator"],
      ["/library", "Packs and run artifacts"],
      ["/settings", "Settings"],
      ["/missing", "This route is not part of Tabiya"],
    ] as const;
    for (const [path, copy] of routes) {
      router.navigate(path);
      await vi.waitFor(() => expect(document.body.textContent).toContain(copy));
      await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector("#main-content main h1")));
      expect(document.title.endsWith(" · Tabiya")).toBe(true);
      expect(document.title).not.toBe("Tabiya");
      expectDisabledControlsExplained();
      if (path === "/settings") {
        expect([...document.querySelectorAll(".settings-toc a")].map((link) => link.textContent)).toEqual(["Appearance", "Playing", "Account", "About"]);
        expect(document.querySelector("#about-deployment-title")?.textContent).toBe("About this deployment");
        expect(document.body.textContent).toContain("Human-like opponents");
        expect(document.body.textContent).toContain("Exact endgame results");
        expect(document.body.textContent).toContain("Review and import");
        expect(document.querySelector<HTMLDetailsElement>(".technical-details")?.open).toBe(false);
        expect(document.querySelector(".technical-details summary")?.textContent).toBe("Technical details");
        expect(document.querySelectorAll("#external-voice-unavailable")).toHaveLength(1);
      }
    }

    expect(document.body.textContent).toContain("/missing");
    await unmount(component);
  });

  it("renders only factual triage signals on the live wall", async () => {
    const wallSession: LiveSessionSummary = {
      id: "session-wall",
      runId: run.id,
      kind: "match",
      title: "Student board",
      boardControl: "match",
      rotationCursor: 0,
      createdBy: "learner-a",
      createdAt: "2026-08-27T09:00:00.000Z",
      classroom: { id: "classroom-wall", name: "Thursday endgames" },
      board: {
        activeFen: run.nodes[0]!.fen,
        objectiveState: "active",
        sideToMove: "black",
        plyCount: 7,
        pausedAt: "2026-08-27T09:08:00.000Z",
        leaseHeldBy: { learnerId: "learner-black", handle: "student-black" },
        lastMoveAt: "2026-08-27T09:07:00.000Z",
        players: {
          white: { learnerId: "learner-white", handle: "student-white" },
          black: { learnerId: "learner-black", handle: "student-black" },
        },
      },
    };
    const wallApi: DrillClientApi = {
      ...api(),
      async liveSessions() { return [wallSession]; },
      async classrooms() { return []; },
    };
    history.replaceState(null, "", "/live");
    const component = mount(App, {
      target: target(),
      props: { api: wallApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const card = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll(".live-wall article")].find((article) => article.textContent?.includes("Student board"));
      expect(candidate).toBeDefined();
      return candidate!;
    });
    expect(card.textContent).toContain("@student-black to move");
    expect(card.textContent).toContain("Classroom: Thursday endgames");
    expect(card.textContent).toContain("Match session · Two players share the match board");
    expect(card.textContent).toContain("paused since");
    expect(card.textContent).toContain("Objective: In progress");
    expect(card.textContent).not.toContain("Objective state: active");
    expect(card.textContent).toContain("Last move");
    expect(document.body.textContent).toContain("never ordered or labelled by engine evaluation");
    expect(card.textContent).not.toContain("struggling");
    await unmount(component);
  });

  it("keeps live overlay marks visibly and semantically attributed", async () => {
    const session = {
      id: "overlay-session",
      runId: run.id,
      kind: "stream" as const,
      title: "Coach stream",
      boardControl: "host_directed" as const,
      rotationCursor: 0,
      createdBy: "learner-coach",
      createdAt: "2026-09-07T12:00:00.000Z",
    };
    const summary: LiveSessionSummary = {
      ...session,
      board: {
        activeFen: run.nodes[0]!.fen,
        objectiveState: "active",
        sideToMove: "white",
        plyCount: 0,
        pausedAt: null,
        leaseHeldBy: { learnerId: "learner-coach", handle: "coach" },
        lastMoveAt: null,
      },
    };
    const detail: LiveSessionDetail = {
      session,
      role: "spectator",
      activeNodeId: run.activeCursor.nodeId,
      activeFen: INITIAL_FEN,
      leaseHeldBy: { learnerId: "learner-coach", handle: "coach" },
      grants: [{ learnerId: "learner-coach", handle: "coach", role: "host", grantedAt: "2026-09-07T12:00:00.000Z" }],
      moveAuthorship: [],
      proposals: [],
      invitations: [],
      legs: [],
      marks: [{ scope: "position", brush: "green", orig: "e2", dest: "e4", drawnBy: { learnerId: "learner-coach", handle: "coach" }, at: "2026-09-07T12:01:00.000Z" }],
    };
    const overlayApi: DrillClientApi = {
      ...api(),
      async liveSessions() { return [summary]; },
      async liveSession() { return detail; },
    };
    history.replaceState(null, "", `/live/overlay/${run.id}`);
    const component = mount(App, {
      target: target(),
      props: { api: overlayApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const grid = await vi.waitFor(() => {
      const candidate = document.querySelector<HTMLElement>(".live-overlay [data-board-input-grid]");
      expect(candidate).not.toBeNull();
      return candidate!;
    });
    const attributionId = grid.getAttribute("aria-describedby")!;
    expect(attributionId).toBe("live-overlay-mark-attribution");
    expect(document.getElementById(attributionId)?.textContent).toBe("Marks drawn by @coach.");
    expect(document.querySelector(".live-overlay [aria-label=Chessboard]")?.getAttribute("aria-describedby")).toBe(attributionId);
    await unmount(component);
  });

  it("retains one exact Live creation through duplicate, failure, retry, and crossed response", async () => {
    history.replaceState(null, "", "/live");
    const createdSession = {
      id: "rotation-session",
      runId: run.id,
      kind: "academy" as const,
      title: "Tuesday relay",
      boardControl: "rotation" as const,
      rotation: ["learner-host", "learner-student"],
      rotationCursor: 0,
      createdBy: "learner-host",
      createdAt: "2026-08-27T11:00:00.000Z",
    };
    const firstCreation = deferred<typeof createdSession>();
    const createLiveSession = vi.fn()
      .mockImplementationOnce(() => firstCreation.promise)
      .mockResolvedValueOnce({ ...createdSession, runId: "crossed-run" });
    const liveApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-host", handle: "coach", createdAt: "2026-08-27T10:00:00.000Z" }; },
      async liveSessions() { return []; },
      async classrooms() { return []; },
      createLiveSession,
    };
    const component = mount(App, {
      target: target(),
      props: { api: liveApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Choose the source run"));
    expect(document.body.textContent).toContain("Teach or coach");
    expect(document.body.textContent).toContain("Share one rehearsal, hand over the board, and compare attempts together.");
    const labelled = (text: string): HTMLInputElement | HTMLSelectElement => {
      const label = [...document.querySelectorAll("label")].find((candidate) => candidate.textContent?.trim().startsWith(text));
      expect(label).toBeDefined();
      return label!.querySelector("input, select")!;
    };
    const board = labelled("Board") as HTMLSelectElement;
    board.selectedIndex = [...board.options].findIndex((option) => option.value === "rotation");
    board.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Rotation handles"));
    const createButton = () => [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Create academy");
    await vi.waitFor(() => {
      const candidate = createButton();
      expect(candidate).toBeDefined();
    });
    await vi.waitFor(() => expect(createButton()?.disabled).toBe(true));
    expect(createButton()?.getAttribute("aria-describedby")).toBe(`live-disabled-${run.id}`);
    expect(document.getElementById(`live-disabled-${run.id}`)?.textContent).toContain("Add at least one handle to the rotation");
    const title = labelled("Session title") as HTMLInputElement;
    title.value = "Tuesday relay";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    const handles = labelled("Rotation handles") as HTMLInputElement;
    handles.value = "coach, student, coach";
    handles.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(createButton()?.disabled).toBe(false));
    const create = createButton()!;
    create.click();
    create.click();
    await vi.waitFor(() => expect(createLiveSession).toHaveBeenCalledTimes(1));
    expect(createLiveSession).toHaveBeenNthCalledWith(1, expect.objectContaining({
      runId: run.id,
      title: "Tuesday relay",
      boardControl: "rotation",
      rotationHandles: ["coach", "student"],
    }));
    expect(create.disabled).toBe(true);
    expect(create.getAttribute("aria-describedby")).toBe("live-create-busy");
    expect(title.disabled).toBe(true);
    expect(board.disabled).toBe(true);
    expect(handles.disabled).toBe(true);
    expect(document.getElementById("live-create-busy")?.textContent).toContain("Creating the session");

    firstCreation.reject(new Error("private session provider failure"));
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("This session could not be created. Your setup is unchanged; check it and try again."));
    expect(document.body.textContent).not.toContain("private session provider failure");
    expect(title.value).toBe("Tuesday relay");
    expect(handles.value).toBe("coach, student, coach");
    expect(create.disabled).toBe(false);

    create.click();
    await vi.waitFor(() => expect(createLiveSession).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("A session may have been created, but its response could not be matched. Reload or reopen Live before creating another."));
    expect(window.location.pathname).toBe("/live");
    expect(document.body.textContent).not.toContain("crossed-run");
    expect(create.disabled).toBe(true);
    expect(document.getElementById(`live-disabled-${run.id}`)?.textContent).toContain("Reload or reopen Live");
    await unmount(component);
  });

  it("shows the authoritative rotation order and lets its host advance it", async () => {
    history.replaceState(null, "", "/live/session/rotation-session");
    const storage = new MemoryStorage();
    WriterSession.claimFor("rotation-run", storage, () => "writer-rotation");
    let detail: LiveSessionDetail = {
      session: {
        id: "rotation-session",
        runId: "rotation-run",
        kind: "academy",
        title: "Tuesday relay",
        boardControl: "rotation",
        rotation: ["learner-host", "learner-student"],
        rotationCursor: 0,
        createdBy: "learner-host",
        createdAt: "2026-08-27T11:00:00.000Z",
      },
      role: "host",
      activeNodeId: "node-one",
      activeFen: INITIAL_FEN,
      leaseHeldBy: { learnerId: "learner-host", handle: "coach" },
      grants: [
        { learnerId: "learner-host", handle: "coach", role: "host", grantedAt: "2026-08-27T11:00:00.000Z" },
        { learnerId: "learner-student", handle: "student", role: "participant", grantedAt: "2026-08-27T11:01:00.000Z" },
      ],
      moveAuthorship: [],
      proposals: [],
      invitations: [],
      legs: [],
      marks: [],
    };
    const boardControl = vi.fn(async () => {
      detail = { ...detail, session: { ...detail.session, rotationCursor: 1 } };
      return detail.session;
    });
    const liveApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-host", handle: "coach", createdAt: "2026-08-27T10:00:00.000Z" }; },
      async liveSession() { return detail; },
      async sessionJournal() { return { entries: [], nextSeq: 0 }; },
      boardControl,
    };
    const component = mount(App, {
      target: target(),
      props: { api: liveApi, router: new HistoryRouter(window), storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Current: @coach"));
    const advance = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Advance rotation")!;
    advance.click();
    await vi.waitFor(() => expect(boardControl).toHaveBeenCalledWith("rotation-session", "writer-rotation", "advance"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Current: @student"));
    await unmount(component);
  });

  it("owns a live-session invitation through duplicate, failure, retry, and partial-refresh states", async () => {
    history.replaceState(null, "", "/live/session/invite-session");
    const detail: LiveSessionDetail = {
      session: {
        id: "invite-session",
        runId: "invite-run",
        kind: "academy",
        title: "Invitation workshop",
        boardControl: "host_directed",
        handoffLearnerId: "learner-host",
        rotationCursor: 0,
        createdBy: "learner-host",
        createdAt: "2026-09-13T20:00:00.000Z",
      },
      role: "host",
      activeNodeId: "node-one",
      activeFen: INITIAL_FEN,
      leaseHeldBy: { learnerId: "learner-host", handle: "coach" },
      grants: [{ learnerId: "learner-host", handle: "coach", role: "host", grantedAt: "2026-09-13T20:00:00.000Z" }],
      moveAuthorship: [],
      proposals: [],
      invitations: [],
      legs: [],
      marks: [],
    };
    const firstInvitation = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["inviteToSession"]>>>>();
    const invitation = {
      id: "invitation-one",
      sessionId: detail.session.id,
      leg: null,
      invitedHandle: "student",
      invitedRole: "participant" as const,
      externalChallengeUrl: null,
      state: "open" as const,
      createdAt: "2026-09-13T20:01:00.000Z",
    };
    const pendingWatchLink = deferred<{ readonly id: string; readonly token: string; readonly url: string }>();
    let invitationAttempts = 0;
    const inviteToSession = vi.fn(() => ++invitationAttempts === 1 ? firstInvitation.promise : Promise.resolve(invitation));
    let detailReads = 0;
    const liveApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-host", handle: "coach", createdAt: "2026-09-13T19:00:00.000Z" }; },
      async liveSession() {
        if (++detailReads === 1) return detail;
        throw new Error("private provider refresh detail");
      },
      async sessionJournal() { return { entries: [], nextSeq: 0 }; },
      inviteToSession,
      mintSessionLink: vi.fn(() => pendingWatchLink.promise),
    };
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: liveApi, router, storage: new MemoryStorage() },
    });

    const input = await vi.waitFor(() => {
      const label = [...document.querySelectorAll("label")].find((candidate) => candidate.textContent?.includes("Tabiya handle"));
      expect(label).toBeDefined();
      return label!.querySelector<HTMLInputElement>("input")!;
    });
    input.value = "  student  ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Create invitation")!;
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    button.click();
    button.click();
    await vi.waitFor(() => expect(inviteToSession).toHaveBeenCalledTimes(1));
    expect(inviteToSession).toHaveBeenCalledWith("invite-session", { handle: "student" });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-describedby")).toBe("live-session-action-busy");
    expect(input.disabled).toBe(true);
    expect(input.value).toBe("  student  ");
    expect(document.getElementById("live-session-action-busy")?.textContent).toContain("Updating this session");

    firstInvitation.reject(new Error("private provider mutation detail"));
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("The invitation could not be created. Your participant details remain here; check them and try again."));
    expect(document.body.textContent).not.toContain("private provider mutation detail");
    expect(input.value).toBe("  student  ");
    expect(button.disabled).toBe(false);

    button.click();
    await vi.waitFor(() => expect(inviteToSession).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("The invitation was created, but this session could not refresh. Reload it to see the invitation."));
    expect(document.body.textContent).not.toContain("private provider refresh detail");
    expect(input.value).toBe("");
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-describedby")).toBe("invite-disabled");

    const watch = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Create watch link")!;
    watch.click();
    await vi.waitFor(() => expect(watch.disabled).toBe(true));
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    pendingWatchLink.resolve({ id: "departed-link", token: "secret", url: "/shared/must-not-render" });
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).not.toContain("must-not-render");
    await unmount(component);
  });

  it("lets a live-session host identify and resolve a learner proposal", async () => {
    history.replaceState(null, "", "/live/session/session-one");
    const storage = new MemoryStorage();
    WriterSession.claimFor("live-run", storage, () => "writer-live");
    const proposal = {
      id: "proposal-one",
      sessionId: "session-one",
      nodeId: "node-one",
      moveUci: "e2e4",
      proposedBy: "learner-guest",
      at: "2026-08-27T12:00:00.000Z",
      status: "open" as const,
      resolvedRunSeq: null,
    };
    const voteWindow = {
      id: "host-vote",
      sessionId: "session-one",
      nodeId: "node-one",
      prompt: "Which plan?",
      options: [{ moveUci: "e2e4", label: "Claim the centre" }, { moveUci: "g1f3", label: "Develop" }],
      opensAt: "2026-08-27T12:00:00.000Z",
      closesAt: "2026-08-27T12:01:00.000Z",
      state: "open" as const,
      appliedOptionUci: null,
    };
    let detail: LiveSessionDetail = {
      session: {
        id: "session-one",
        runId: "live-run",
        kind: "academy",
        title: "Endgame workshop",
        boardControl: "host_directed",
        handoffLearnerId: "learner-host",
        rotationCursor: 0,
        createdBy: "learner-host",
        createdAt: "2026-08-27T11:00:00.000Z",
      },
      classroom: { id: "classroom-one", name: "Endgame club" },
      role: "host",
      activeNodeId: "node-one",
      activeFen: INITIAL_FEN,
      leaseHeldBy: { learnerId: "learner-guest", handle: "student" },
      grants: [
        { learnerId: "learner-host", handle: "coach", role: "host", grantedAt: "2026-08-27T11:00:00.000Z" },
        { learnerId: "learner-guest", handle: "student", role: "participant", grantedAt: "2026-08-27T11:01:00.000Z" },
      ],
      moveAuthorship: [],
      proposals: [proposal],
      vote: { window: voteWindow, tally: voteWindow.options.map((option) => ({ ...option, count: 0 })), total: 0, relayed: 0 },
      invitations: [],
      legs: [],
      marks: [],
    };
    const claimLease = vi.fn(async () => undefined);
    const resolveProposal = vi.fn(async () => ({ ...proposal, status: "applied" as const, resolvedRunSeq: 4 }));
    const boardControl = vi.fn(async () => {
      detail = { ...detail, leaseHeldBy: { learnerId: "learner-host", handle: "coach" } };
      return detail.session;
    });
    const mintSessionLink = vi.fn(async () => ({ id: "watch-one", token: "secret", url: "/shared/watch-token" }));
    const updateGrants = vi.fn(async (_runId: string, operation: { readonly op: string; readonly handle: string; readonly role?: string }) => {
      if (operation.op === "grant") detail = { ...detail, grants: detail.grants.map((grant) => grant.handle === operation.handle ? { ...grant, role: operation.role as "participant" | "spectator" } : grant) };
      return detail.grants;
    });
    const closeVote = vi.fn(async (_sessionId: string, _windowId: string, appliedOptionUci?: string) => {
      const vote = { ...detail.vote!, window: { ...detail.vote!.window, state: "closed" as const, appliedOptionUci: appliedOptionUci ?? null } };
      detail = { ...detail, vote };
      return vote;
    });
    const liveApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-host", handle: "coach", createdAt: "2026-08-27T10:00:00.000Z" }; },
      async liveSession() { return detail; },
      async sessionJournal() { return { entries: [], nextSeq: 0 }; },
      claimLease,
      resolveProposal,
      boardControl,
      mintSessionLink,
      updateGrants,
      closeVote,
    };
    const component = mount(App, {
      target: target(),
      props: { api: liveApi, router: new HistoryRouter(window), storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("proposed by @student"));
    expect(document.body.textContent).toContain("Classroom: Endgame club");
    expect(document.body.textContent).toContain("Academy lesson");
    expect(document.body.textContent).toContain("rewind, branch, compare, and return without discarding the original line");
    expect(document.querySelector("[aria-label='Move proposals']")?.textContent).toContain("e4");
    expect(document.querySelector("[aria-label='Move proposals']")?.textContent).not.toContain("e2e4");
    expect([...document.querySelectorAll<HTMLSelectElement>(".vote-editor select")][0]?.options).toHaveLength(21);
    const reclaim = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Take back board…")!;
    reclaim.click();
    expect(boardControl).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Take the board from @student?"));
    expect(document.body.textContent).toContain("their attempt-in-progress ends as an active learning turn");
    expect(document.body.textContent).toContain("Nothing in the learner's line is deleted");
    const cancel = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Cancel")!;
    cancel.click();
    await vi.waitFor(() => expect(document.body.textContent).not.toContain("Take the board from @student?"));
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Take back board…")!.click();
    const confirm = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm — take the board");
      expect(candidate).toBeDefined();
      return candidate!;
    });
    confirm.click();
    await vi.waitFor(() => expect(boardControl).toHaveBeenCalledWith("session-one", "writer-live", "reclaim"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("@coach holds the board"));
    const play = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Play proposal")!;
    play.click();
    await vi.waitFor(() => expect(resolveProposal).toHaveBeenCalledWith("session-one", "proposal-one", "apply", "writer-live"));
    expect(claimLease).toHaveBeenCalledWith("live-run", "writer-live");
    const watch = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Create watch link")!;
    watch.click();
    await vi.waitFor(() => expect(mintSessionLink).toHaveBeenCalledWith("session-one", { invitedRole: "spectator" }));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Watch link: /shared/watch-token"));
    expect(document.body.textContent).toContain("Single use · expires after 14 days · grants spectator access only");
    expect(document.body.textContent).toContain("Audience output");
    expect(document.body.textContent).toContain("never the host's private evidence panels or controls");
    expect(document.body.textContent).toContain("No board delay:");
    expect(document.body.textContent).toContain("sign in once inside OBS");
    const overlayUrl = document.querySelector<HTMLInputElement>('input[readonly]')!;
    expect(overlayUrl.value).toBe("http://localhost:3000/live/overlay/live-run");
    const preview = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "See what your audience sees")!;
    expect(preview.getAttribute("aria-controls")).toBe("audience-preview");
    const makeSpectator = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Make spectator")!;
    makeSpectator.click();
    await vi.waitFor(() => expect(updateGrants).toHaveBeenCalledWith("live-run", { op: "grant", handle: "student", role: "spectator" }, "writer-live"));
    await vi.waitFor(() => expect(document.querySelector("[aria-label='Session access list']")?.textContent).toContain("@student — Spectator"));
    const applied = [...document.querySelectorAll("label")].find((label) => label.textContent?.includes("Applied option"))!.querySelector("select")!;
    applied.value = "e2e4";
    applied.dispatchEvent(new Event("change", { bubbles: true }));
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Close vote")!.click();
    await vi.waitFor(() => expect(closeVote).toHaveBeenCalledWith("session-one", "host-vote", "e2e4"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Vote closed. Recorded Claim the centre as applied; no move was played."));
    await unmount(component);
  });

  it("lets a signed-in live viewer cast and change an advisory vote without supplying an external identity", async () => {
    history.replaceState(null, "", "/live/session/session-vote");
    const voteWindow = {
      id: "vote-one",
      sessionId: "session-vote",
      nodeId: "node-one",
      prompt: "Which continuation?",
      options: [
        { moveUci: "e2e4", label: "Claim the centre" },
        { moveUci: "g1f3", label: "Develop first" },
      ],
      opensAt: "2026-08-27T12:00:00.000Z",
      closesAt: "2026-08-27T12:01:00.000Z",
      state: "open" as const,
      appliedOptionUci: null,
    };
    const detail: LiveSessionDetail = {
      session: {
        id: "session-vote",
        runId: "live-run",
        kind: "stream",
        title: "Club stream",
        boardControl: "host_directed",
        rotationCursor: 0,
        createdBy: "learner-host",
        createdAt: "2026-08-27T11:00:00.000Z",
      },
      role: "spectator",
      activeNodeId: "node-one",
      activeFen: INITIAL_FEN,
      leaseHeldBy: { learnerId: "learner-host", handle: "host" },
      grants: [
        { learnerId: "learner-host", handle: "host", role: "host", grantedAt: "2026-08-27T11:00:00.000Z" },
        { learnerId: "learner-viewer", handle: "viewer", role: "spectator", grantedAt: "2026-08-27T11:01:00.000Z" },
      ],
      moveAuthorship: [],
      proposals: [],
      vote: {
        window: voteWindow,
        tally: voteWindow.options.map((option) => ({ ...option, count: 0 })),
        total: 0,
        relayed: 0,
      },
      invitations: [],
      legs: [],
      marks: [],
    };
    const firstVote = deferred<NonNullable<LiveSessionDetail["vote"]>>();
    let voteAttempts = 0;
    const validTally = (choiceUci: string): NonNullable<LiveSessionDetail["vote"]> => ({
      window: voteWindow,
      tally: voteWindow.options.map((option) => ({ ...option, count: option.moveUci === choiceUci ? 1 : 0 })),
      total: 1,
      relayed: 0,
    });
    const castVote = vi.fn((_sessionId: string, _windowId: string, choiceUci: string) => {
      voteAttempts += 1;
      if (voteAttempts === 1) return firstVote.promise;
      if (voteAttempts === 2) return Promise.resolve({
        ...validTally(choiceUci),
        window: { ...voteWindow, sessionId: "crossed-session" },
      });
      return Promise.resolve(validTally(choiceUci));
    });
    const liveApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-viewer", handle: "viewer", createdAt: "2026-08-27T10:00:00.000Z" }; },
      async liveSession() { return detail; },
      async sessionJournal() { return { entries: [], nextSeq: 0 }; },
      castVote,
    };
    const component = mount(App, {
      target: target(),
      props: { api: liveApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const centreVote = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent?.includes("Vote for Claim the centre"));
      expect(candidate).toBeDefined();
      return candidate!;
    });
    expect(document.querySelector("[aria-label='Which continuation?']")).not.toBeNull();
    centreVote.click();
    centreVote.click();
    await vi.waitFor(() => expect(castVote).toHaveBeenCalledWith("session-vote", "vote-one", "e2e4"));
    expect(castVote).toHaveBeenCalledTimes(1);
    expect(castVote.mock.calls[0]).toHaveLength(3);
    expect(centreVote.disabled).toBe(true);
    expect(centreVote.getAttribute("aria-describedby")).toBe("live-session-action-busy");
    expect(document.getElementById("live-session-action-busy")?.textContent).toContain("Updating this session");

    firstVote.reject(new Error("private vote provider failure"));
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("Your vote could not be recorded. The tally is unchanged; try again."));
    expect(document.body.textContent).not.toContain("private vote provider failure");
    expect(document.body.textContent).toContain("Claim the centre · 0");

    centreVote.click();
    await vi.waitFor(() => expect(castVote).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("Your vote may have been recorded, but its tally could not be matched. Reload before voting again."));
    expect(document.body.textContent).toContain("Claim the centre · 0");

    centreVote.click();
    await vi.waitFor(() => expect(castVote).toHaveBeenCalledTimes(3));
    await vi.waitFor(() => expect(document.body.textContent).toContain("Vote recorded for Claim the centre"));
    expect(document.body.textContent).toContain("Claim the centre · 1");
    expect(document.body.textContent).toContain("1 vote, all from signed-in members");
    await unmount(component);
  });

  it("does not publish an old live mutation into a newly opened session", async () => {
    history.replaceState(null, "", "/live/session/session-old");
    const voteWindow = {
      id: "vote-old",
      sessionId: "session-old",
      nodeId: "node-old",
      prompt: "Which continuation?",
      options: [
        { moveUci: "e2e4", label: "Claim the centre" },
        { moveUci: "g1f3", label: "Develop first" },
      ],
      opensAt: "2026-09-13T12:00:00.000Z",
      closesAt: "2026-09-13T12:01:00.000Z",
      state: "open" as const,
      appliedOptionUci: null,
    };
    const detailFor = (sessionId: string, title: string, withVote: boolean): LiveSessionDetail => ({
      session: {
        id: sessionId,
        runId: `run-${sessionId}`,
        kind: "stream",
        title,
        boardControl: "host_directed",
        rotationCursor: 0,
        createdBy: "learner-host",
        createdAt: "2026-09-13T11:00:00.000Z",
      },
      role: "spectator",
      activeNodeId: withVote ? "node-old" : "node-current",
      activeFen: INITIAL_FEN,
      leaseHeldBy: { learnerId: "learner-host", handle: "host" },
      grants: [
        { learnerId: "learner-host", handle: "host", role: "host", grantedAt: "2026-09-13T11:00:00.000Z" },
        { learnerId: "learner-viewer", handle: "viewer", role: "spectator", grantedAt: "2026-09-13T11:01:00.000Z" },
      ],
      moveAuthorship: [],
      proposals: [],
      ...(withVote ? { vote: { window: voteWindow, tally: voteWindow.options.map((option) => ({ ...option, count: 0 })), total: 0, relayed: 0 } } : {}),
      invitations: [],
      legs: [],
      marks: [],
    });
    const oldDetail = detailFor("session-old", "Departed session", true);
    const currentDetail = detailFor("session-current", "Current session", false);
    const pendingVote = deferred<NonNullable<LiveSessionDetail["vote"]>>();
    const castVote = vi.fn(() => pendingVote.promise);
    const liveApi: DrillClientApi = {
      ...api(),
      async session() { return { id: "learner-viewer", handle: "viewer", createdAt: "2026-09-13T10:00:00.000Z" }; },
      async liveSession(sessionId) { return sessionId === "session-old" ? oldDetail : currentDetail; },
      async sessionJournal() { return { entries: [], nextSeq: 0 }; },
      castVote,
    };
    const router = new HistoryRouter(window);
    const component = mount(App, { target: target(), props: { api: liveApi, router, storage: new MemoryStorage() } });
    const voteButton = await vi.waitFor(() => {
      const candidate = [...document.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent?.includes("Vote for Claim the centre"));
      expect(candidate).toBeDefined();
      return candidate!;
    });
    voteButton.click();
    await vi.waitFor(() => expect(castVote).toHaveBeenCalledWith("session-old", "vote-old", "e2e4"));

    router.navigate("/live/session/session-current");
    await vi.waitFor(() => expect(document.body.textContent).toContain("Current session"));
    pendingVote.resolve({
      window: voteWindow,
      tally: voteWindow.options.map((option) => ({ ...option, count: option.moveUci === "e2e4" ? 1 : 0 })),
      total: 1,
      relayed: 0,
    });
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).toContain("Current session");
    expect(document.body.textContent).not.toContain("Departed session");
    expect(document.body.textContent).not.toContain("Vote recorded for Claim the centre");
    await unmount(component);
  });

  it("makes assignment sharing an identified, bounded consent step", async () => {
    history.replaceState(null, "", "/learn");
    const assignment: AssignedPack = {
      id: "assignment-one",
      classroomId: "classroom-one",
      packId: pack.id,
      assignedBy: "teacher-one",
      note: "Compare both plans",
      dueAt: "2026-08-20T12:00:00.000Z",
      createdAt: "2026-08-18T12:00:00.000Z",
      withdrawnAt: null,
      classroomName: "Thursday group",
      assignedByHandle: "coach",
      teacherHandles: ["coach"],
      submissions: [],
    };
    const submitAssignment = vi.fn(async () => ({
      assignmentId: assignment.id,
      learnerId: "learner-test",
      runId: runSummary.id,
      grantedLearnerIds: ["teacher-one"],
      submittedAt: "2026-08-27T12:00:00.000Z",
      accessExpiresAt: "2026-11-25T12:00:00.000Z",
      withdrawnAt: null,
    }));
    const assignedApi: DrillClientApi = {
      ...api(),
      async assignments() { return [assignment]; },
      submitAssignment,
    };
    const component = mount(App, {
      target: target(),
      props: { api: assignedApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect([...document.querySelectorAll("h3")].some((heading) => heading.textContent === packSummary.title)).toBe(true));
    expect([...document.querySelectorAll("h3")].some((heading) => heading.textContent === pack.id)).toBe(false);
    expect(document.body.textContent).toContain("assigned by @coach");
    expect(document.body.textContent).toContain("overdue");
    expect(document.body.textContent).toContain("Compare both plans");
    const runSelect = document.querySelector<HTMLSelectElement>("select[aria-label='Completed run']")
      ?? [...document.querySelectorAll<HTMLSelectElement>("select")].find((select) => select.parentElement?.textContent?.includes("Completed run"))!;
    runSelect.value = runSummary.id;
    runSelect.dispatchEvent(new Event("change", { bubbles: true }));
    const share = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Share with teachers")!;
    await vi.waitFor(() => expect(share.disabled).toBe(false));
    share.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain(`@coach will be able to read this run for up to 90 days.`));
    expect(document.body.textContent).toContain("They do not gain access to your other runs.");
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing")!.click();
    await vi.waitFor(() => expect(submitAssignment).toHaveBeenCalledWith(assignment.id, runSummary.id));
    await unmount(component);
  });

  it("explains classroom consent before creation and names a pending invitation", async () => {
    history.replaceState(null, "", "/live");
    const respondClassroomInvite = vi.fn(async () => undefined);
    const classroomApi: DrillClientApi = {
      ...api(),
      async classrooms() {
        return [{
          id: "classroom-invite",
          ownerLearnerId: "teacher-one",
          name: "Endgame study",
          createdAt: "2026-08-18T12:00:00.000Z",
          archivedAt: null,
          memberRole: "learner" as const,
          memberState: "invited" as const,
          invitation: {
            invitedAt: "2026-08-27T12:00:00.000Z",
            invitedBy: { learnerId: "teacher-one", handle: "coach" },
          },
        }];
      },
      respondClassroomInvite,
    };
    const component = mount(App, {
      target: target(),
      props: { api: classroomApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Endgame study"));
    const classroomSection = document.querySelector("[aria-labelledby='classrooms-title']")!;
    expect(classroomSection.textContent).toContain("A classroom lets a teacher assign packs to you and schedule sessions");
    expect(classroomSection.textContent).toContain("It does not let them see your runs");
    expect(classroomSection.textContent).toContain("Invited by @coach");
    expect(classroomSection.textContent).toContain("Accepting lets teachers assign packs to you and schedule sessions");
    expect(classroomSection.textContent).toContain("you share attempts one at a time and can withdraw them");
    expect(classroomSection.textContent).toContain("keeps your membership as shared classroom history");
    expect(classroomSection.textContent).toContain("stay read-only with your identity removed");
    const accept = [...classroomSection.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Accept")!;
    expect(accept.getAttribute("aria-describedby")).toBe("classroom-retention-classroom-invite");
    accept.click();
    await vi.waitFor(() => expect(respondClassroomInvite).toHaveBeenCalledWith("classroom-invite", "accept"));
    await unmount(component);
  });

  it("renders the teacher's roster by assignment with named submissions and absences", async () => {
    history.replaceState(null, "", "/live");
    const classroom: ClassroomDetail = {
      classroom: { id: "classroom-one", ownerLearnerId: "learner-test", name: "Thursday group", createdAt: "2026-08-18T12:00:00.000Z", archivedAt: null },
      membership: { classroomId: "classroom-one", learnerId: "learner-test", handle: "coach", memberRole: "teacher", state: "active", invitedBy: null, invitedAt: "2026-08-18T12:00:00.000Z", joinedAt: "2026-08-18T12:00:00.000Z", leftAt: null },
      members: [
        { classroomId: "classroom-one", learnerId: "learner-test", handle: "coach", memberRole: "teacher", state: "active", invitedBy: null, invitedAt: "2026-08-18T12:00:00.000Z", joinedAt: "2026-08-18T12:00:00.000Z", leftAt: null },
        { classroomId: "classroom-one", learnerId: "student-one", handle: "submitted", memberRole: "learner", state: "active", invitedBy: "learner-test", invitedAt: "2026-08-18T12:00:00.000Z", joinedAt: "2026-08-18T12:01:00.000Z", leftAt: null },
        { classroomId: "classroom-one", learnerId: "student-two", handle: "waiting", memberRole: "learner", state: "active", invitedBy: "learner-test", invitedAt: "2026-08-18T12:00:00.000Z", joinedAt: "2026-08-18T12:01:00.000Z", leftAt: null },
      ],
      assignments: [{ id: "assignment-one", classroomId: "classroom-one", packId: pack.id, assignedBy: "learner-test", note: "Compare both plans", dueAt: "2026-08-20T12:00:00.000Z", createdAt: "2026-08-18T12:00:00.000Z", withdrawnAt: null }],
      submissions: [{ assignmentId: "assignment-one", learnerId: "student-one", runId: runSummary.id, grantedLearnerIds: ["learner-test"], submittedAt: "2026-08-19T12:00:00.000Z", accessExpiresAt: "2026-11-17T12:00:00.000Z", withdrawnAt: null, access: "available" }],
      upcomingSessions: [],
    };
    const classroomApi: DrillClientApi = {
      ...api(),
      async classrooms() { return [{ ...classroom.classroom, memberRole: "teacher", memberState: "active" }]; },
      async classroom() { return classroom; },
      async liveSessions() { return []; },
    };
    const component = mount(App, {
      target: target(),
      props: { api: classroomApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Thursday group"));
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Open")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Assignments and submissions"));
    expect(document.body.textContent).toContain(packSummary.title);
    expect(document.body.textContent).toContain("Compare both plans");
    expect(document.body.textContent).toContain("@submitted");
    expect(document.body.textContent).toContain("@waiting");
    expect(document.body.textContent).toContain("not submitted");
    expect(document.body.textContent).toContain("access available");
    expect([...document.querySelectorAll<HTMLButtonElement>("button")].some((button) => button.textContent === "Review @submitted's run")).toBe(true);
    await unmount(component);
  });

  it("keeps the latest classroom when detail requests resolve out of order", async () => {
    history.replaceState(null, "", "/live");
    const pendingFirst = deferred<ClassroomDetail>();
    const pendingSecond = deferred<ClassroomDetail>();
    const classroomDetail = (id: string, name: string): ClassroomDetail => ({
      classroom: { id, ownerLearnerId: "learner-test", name, createdAt: "2026-09-13T12:00:00.000Z", archivedAt: null },
      membership: { classroomId: id, learnerId: "learner-test", handle: "coach", memberRole: "teacher", state: "active", invitedBy: null, invitedAt: "2026-09-13T12:00:00.000Z", joinedAt: "2026-09-13T12:00:00.000Z", leftAt: null },
      members: [], assignments: [], submissions: [], upcomingSessions: [],
    });
    const classroomApi: DrillClientApi = {
      ...api(),
      async classrooms() {
        return [
          { ...classroomDetail("classroom-first", "First classroom").classroom, memberRole: "teacher" as const, memberState: "active" as const },
          { ...classroomDetail("classroom-second", "Second classroom").classroom, memberRole: "teacher" as const, memberState: "active" as const },
        ];
      },
      classroom(id) { return id === "classroom-first" ? pendingFirst.promise : pendingSecond.promise; },
    };
    const component = mount(App, { target: target(), props: { api: classroomApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Second classroom"));
    const classroomCards = [...document.querySelectorAll<HTMLElement>("[aria-labelledby='classrooms-title'] .item-list > article")];
    classroomCards[0]!.querySelector<HTMLButtonElement>("button")!.click();
    classroomCards[1]!.querySelector<HTMLButtonElement>("button")!.click();
    pendingSecond.resolve(classroomDetail("classroom-second", "Second classroom"));
    await vi.waitFor(() => expect(document.querySelector(".classroom-detail h3")?.textContent).toBe("Second classroom"));
    pendingFirst.resolve(classroomDetail("classroom-first", "First classroom"));
    await tick();
    await Promise.resolve();
    expect(document.querySelector(".classroom-detail h3")?.textContent).toBe("Second classroom");
    await unmount(component);
  });

  it("retains assignment consent with a bounded retry after sharing fails", async () => {
    history.replaceState(null, "", "/learn");
    const assignment: AssignedPack = {
      id: "assignment-retry", classroomId: "classroom-one", packId: pack.id, assignedBy: "teacher-one",
      note: null, dueAt: null, createdAt: "2026-09-13T12:00:00.000Z", withdrawnAt: null,
      classroomName: "Retry group", assignedByHandle: "coach", teacherHandles: ["coach"], submissions: [],
    };
    const submitAssignment = vi.fn()
      .mockRejectedValueOnce(new Error("private provider detail"))
      .mockResolvedValueOnce({ assignmentId: assignment.id, learnerId: "learner-test", runId: runSummary.id, grantedLearnerIds: ["teacher-one"], submittedAt: "2026-09-13T12:00:00.000Z", accessExpiresAt: "2026-12-12T12:00:00.000Z", withdrawnAt: null });
    const assignedApi: DrillClientApi = { ...api(), async assignments() { return [assignment]; }, submitAssignment };
    const component = mount(App, { target: target(), props: { api: assignedApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Retry group"));
    const runSelect = [...document.querySelectorAll<HTMLSelectElement>("select")].find((select) => select.parentElement?.textContent?.includes("Completed run"))!;
    runSelect.value = runSummary.id;
    runSelect.dispatchEvent(new Event("change", { bubbles: true }));
    const share = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Share with teachers")!;
    await vi.waitFor(() => expect(share.disabled).toBe(false));
    share.click();
    await vi.waitFor(() => expect([...document.querySelectorAll<HTMLButtonElement>("button")].some((button) => button.textContent === "Confirm sharing")).toBe(true));
    const confirm = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing")!;
    confirm.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("This run could not be shared. Nothing changed; try again."));
    expect(document.body.textContent).not.toContain("private provider detail");
    expect(document.querySelector("#submission-confirm-title")?.textContent).toContain(runSummary.title);
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm sharing")!.click();
    await vi.waitFor(() => expect(submitAssignment).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.querySelector("#submission-confirm-title")).toBeNull());
    await unmount(component);
  });

  it("refuses a repertoire scan page for a different repertoire", async () => {
    history.replaceState(null, "", "/learn");
    const summary: RepertoireSummary = {
      id: "repertoire-one", name: "Black repertoire", side: "black", targetElo: 1600,
      coverageDenominator: 100, digest, updatedAt: "2026-09-13T12:00:00.000Z",
      scan: { scannedAt: "2026-09-13T12:00:00.000Z", stale: false, truncated: false, gapCount: 1 },
    };
    const page = (repertoire: RepertoireSummary): RepertoireGapPage => ({
      status: "ready", stale: false, repertoire,
      scan: {
        scannedAt: "2026-09-13T12:00:00.000Z",
        population: { source: "lichess-explorer", ratings: [1600], speeds: ["rapid"], since: "2025-01", until: "2026-09" },
        gaps: [{ key: "gap-one", representativeFen: INITIAL_FEN, replySan: "e4", replyUci: "e2e4", line: [], mass: 0.5, gamesUntilSeen: 2, state: "open", runId: null, firstMoves: [], answer: null }],
        alternateGaps: [], unknown: [], uncoveredMass: 0.5, truncated: false, sourceFailures: 0, queriesUsed: 1, unreachedKeys: 0, guard: "Public rapid games", partiality: null,
      },
    });
    let gapRead = 0;
    const repertoireApi: DrillClientApi = {
      ...api(),
      async repertoires() { return [summary]; },
      async repertoireGaps() {
        gapRead += 1;
        return gapRead === 1 ? page(summary) : page({ ...summary, id: "repertoire-crossed", name: "Wrong repertoire" });
      },
      async scanRepertoire() {},
    };
    const component = mount(App, { target: target(), props: { api: repertoireApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Black repertoire"));
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Rescan")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("The repertoire scan could not finish. Try again."));
    expect(document.body.textContent).not.toContain("Wrong repertoire");
    await unmount(component);
  });

  it("does not navigate when a gap entry finishes after leaving Learn", async () => {
    history.replaceState(null, "", "/learn");
    const pendingEntry = deferred<{ readonly runId: string; readonly writerId: string | null; readonly alreadyEntered: boolean }>();
    const summary: RepertoireSummary = { id: "repertoire-entry", name: "Entry repertoire", side: "white", targetElo: 1600, coverageDenominator: 100, digest, updatedAt: "2026-09-13T12:00:00.000Z", scan: null };
    const page: RepertoireGapPage = {
      status: "ready", stale: false, repertoire: summary,
      scan: {
        scannedAt: "2026-09-13T12:00:00.000Z",
        population: { source: "lichess-explorer", ratings: [1600], speeds: ["rapid"], since: "2025-01", until: "2026-09" },
        gaps: [{ key: "entry-gap", representativeFen: INITIAL_FEN, replySan: "e5", replyUci: "e7e5", line: ["e4"], mass: 0.4, gamesUntilSeen: 3, state: "open", runId: null, firstMoves: [], answer: null }],
        alternateGaps: [], unknown: [], uncoveredMass: 0.4, truncated: false, sourceFailures: 0, queriesUsed: 1, unreachedKeys: 0, guard: "Public rapid games", partiality: null,
      },
    };
    const router = new HistoryRouter(window);
    const enterRepertoireGap = vi.fn(() => pendingEntry.promise);
    const repertoireApi: DrillClientApi = { ...api(), async repertoires() { return [summary]; }, async repertoireGaps() { return page; }, enterRepertoireGap };
    const component = mount(App, { target: target(), props: { api: repertoireApi, router, storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Entry repertoire"));
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Enter with human-like resistance")!.click();
    await vi.waitFor(() => expect(enterRepertoireGap).toHaveBeenCalledWith("repertoire-entry", "entry-gap", "human_common"));
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    pendingEntry.resolve({ runId: "departed-gap-run", writerId: "writer-departed", alreadyEntered: false });
    await tick();
    await Promise.resolve();
    expect(window.location.pathname).toBe("/");
    await unmount(component);
  });

  it("retries Story preparation without importing the game twice", async () => {
    history.replaceState(null, "", "/review");
    const storage = new MemoryStorage();
    const reveal = vi.fn(async () => ({} as never));
    reveal.mockRejectedValueOnce(new Error("private reveal failure"));
    const importGame = vi.fn(async (input: Parameters<NonNullable<DrillClientApi["importGame"]>>[0]) => ({
      run: { ...run, id: input.id }, importRecord: {} as never, evidencePass: { jobs: 0 },
    }));
    const importApi: DrillClientApi = { ...api(), importGame, reveal };
    const component = mount(App, { target: target(), props: { api: importApi, router: new HistoryRouter(window), storage } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Import one game"));
    const pgn = document.querySelector<HTMLTextAreaElement>("textarea[placeholder='[Event …]']")!;
    pgn.value = `[Event "Retry"]\n[Result "*"]\n\n1. e4 *`;
    pgn.dispatchEvent(new Event("input", { bubbles: true }));
    const build = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Build game story")!;
    await vi.waitFor(() => expect(build.disabled).toBe(false));
    build.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("The game is saved, but its Story could not be prepared."));
    expect(document.body.textContent).not.toContain("private reveal failure");
    expect(importGame).toHaveBeenCalledTimes(1);
    const retry = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Finish Story setup")!;
    retry.click();
    await vi.waitFor(() => expect(reveal).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(window.location.pathname).toMatch(/^\/review\/game\/import-/u));
    expect(importGame).toHaveBeenCalledTimes(1);
    await unmount(component);
  });

  it("does not navigate or permit a duplicate when an import crosses a Review departure", async () => {
    history.replaceState(null, "", "/review");
    const storage = new MemoryStorage();
    const pendingImport = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["importGame"]>>>>();
    let requestedRunId = "";
    const importGame = vi.fn((input: Parameters<NonNullable<DrillClientApi["importGame"]>>[0]) => { requestedRunId=input.id;return pendingImport.promise; });
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: {
        api: { ...api(), importGame, reveal: vi.fn(async () => ({} as never)) },
        router,
        storage,
      },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Import one game"));
    const pgn = document.querySelector<HTMLTextAreaElement>("textarea[placeholder='[Event …]']")!;
    pgn.value = `[Event "Departed"]\n[Result "*"]\n\n1. d4 *`;
    pgn.dispatchEvent(new Event("input", { bubbles: true }));
    const build = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Build game story")!;
    await vi.waitFor(() => expect(build.disabled).toBe(false));
    build.click();
    await vi.waitFor(() => expect(importGame).toHaveBeenCalledTimes(1));
    expect(storage.values.size).toBe(0);
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    router.navigate("/review");
    await vi.waitFor(() => expect(document.body.textContent).toContain("Import one game"));
    const inFlight = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Preparing…")!;
    expect(inFlight.disabled).toBe(true);
    inFlight.click();
    expect(importGame).toHaveBeenCalledTimes(1);
    pendingImport.resolve({ run: { ...run, id: requestedRunId }, importRecord: {} as never, evidencePass: { jobs: 0 } });
    await vi.waitFor(() => expect(inFlight.textContent).toBe("Build game story"));
    expect(inFlight.disabled).toBe(true);
    expect(window.location.pathname).toBe("/review");
    expect(document.body.textContent).toContain("The game is saved and its Story is ready.");
    expect(storage.values.get(writerStorageKey(requestedRunId))).toBeTruthy();
    await unmount(component);
  });

  it("persists rated-game authority only after creation and never navigates from a departed Rating screen", async () => {
    history.replaceState(null, "", "/rating");
    const storage = new MemoryStorage();
    const pendingGame = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["createRatedGame"]>>>>();
    let requestedRunId = "";
    const createRatedGame = vi.fn((input: Parameters<NonNullable<DrillClientApi["createRatedGame"]>>[0]) => {
      requestedRunId = input.id;
      return pendingGame.promise;
    });
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), createRatedGame }, router, storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Start rated game"));
    document.querySelector<HTMLButtonElement>("button[type=submit]")!.click();
    await vi.waitFor(() => expect(createRatedGame).toHaveBeenCalledTimes(1));
    expect(storage.values.size).toBe(0);
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    pendingGame.resolve({ ...run, id: requestedRunId });
    await tick();
    await Promise.resolve();
    expect(window.location.pathname).toBe("/");
    expect(storage.values.get(writerStorageKey(requestedRunId))).toBeTruthy();
    await unmount(component);
  });

  it("does not persist rated-game authority when creation fails", async () => {
    history.replaceState(null, "", "/rating");
    const storage = new MemoryStorage();
    const createRatedGame = vi.fn(async () => { throw new Error("private provider failure"); });
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), createRatedGame }, router: new HistoryRouter(window), storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Start rated game"));
    const start = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Start rated game")!;
    start.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("The rated game could not be opened."));
    expect(document.body.textContent).not.toContain("private provider failure");
    expect(storage.values.size).toBe(0);
    expect(start.disabled).toBe(false);
    await unmount(component);
  });

  it("refuses a crossed rated-game response without claiming its run", async () => {
    history.replaceState(null, "", "/rating");
    const storage = new MemoryStorage();
    const createRatedGame = vi.fn(async () => ({ ...run, id: "crossed-rated-run" }));
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), createRatedGame }, router: new HistoryRouter(window), storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Start rated game"));
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Start rated game")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("The rated game could not be opened."));
    expect(storage.values.size).toBe(0);
    expect(window.location.pathname).toBe("/rating");
    await unmount(component);
  });

  it("does not navigate when a valid opposite-side replay finishes after leaving its run", async () => {
    const source = completedPositionRun("flip-source-run");
    const derived = createRun({
      id: "flip-derived-run",
      session: {
        kind: "position",
        start: { fen: source.nodes[0]!.fen, side: "black" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common", targetElo: 1800 },
      },
      sessionDigest: `sha256:${"c".repeat(64)}`,
      policyConfig: source.policyConfig,
      seed: 29,
      createdAt: "2026-09-13T11:32:00.000Z",
    });
    const pendingFlip = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["flipRun"]>>>>();
    const flipRun = vi.fn(() => pendingFlip.promise);
    const storage = new MemoryStorage();
    WriterSession.claimFor(source.id, storage, () => "writer-source");
    const routedApi: DrillClientApi = {
      ...api(),
      events: async () => ({ events: source.events, nextSeq: source.events.at(-1)!.seq }),
      graph: async () => ({
        id: source.id,
        viewer: {
          role: "host",
          mayWrite: true,
          holdsLease: true,
          leaseHeldBy: { learnerId: "learner-a", handle: "alice" },
          seatedInContest: false,
          reviewing: false,
          reviewRail: "not_applicable",
        },
        nodes: source.nodes,
        branches: source.branches,
        activeCursor: source.activeCursor,
      }),
      flipRun,
    };
    history.replaceState(null, "", `/play/run/${source.id}`);
    const router = new HistoryRouter(window);
    const component = mount(App, { target: target(), props: { api: routedApi, router, storage } });

    const replay = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Replay this as Black");
      expect(button).toBeDefined();
      return button!;
    });
    replay.click();
    await vi.waitFor(() => expect(flipRun).toHaveBeenCalledWith(source.id, source.nodes[0]!.id));
    router.navigate("/play");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/play"));
    pendingFlip.resolve({
      run: derived,
      writerId: "writer-derived",
      derivation: {
        derivedRunId: derived.id,
        sourceRunId: source.id,
        sourceBranchId: source.nodes[0]!.branchId,
        sourceNodeId: source.nodes[0]!.id,
        kind: "flip_sides",
        createdAt: "2026-09-13T11:32:00.000Z",
      },
    });
    await vi.waitFor(() => expect(storage.values.get(writerStorageKey(derived.id))).toBe("writer-derived"));
    expect(window.location.pathname).toBe("/play");
    await unmount(component);
  });

  it("expands recorded attempts into honestly labelled related rehearsals", async () => {
    history.replaceState(null, "", "/learn");
    const base = api();
    const relatedProgress = vi.fn(async () => [
      { relation: "same_position" as const, runId: "earlier-run", branchId: "main", attemptCount: 2 },
      { relation: "same_pack" as const, runId: "pack-run", branchId: "main", attemptCount: 1 },
    ]);
    const duplicateRun = vi.fn(async (_sourceRunId: string, input: { readonly id: string; readonly seed: number }) => createRun({
      id: input.id,
      packId: pack.id,
      packDigest: digest,
      policyConfig: run.policyConfig,
      startFen: pack.start.fen,
      seed: input.seed,
      createdAt: "2026-08-23T13:00:00.000Z",
    }));
    const learnApi: DrillClientApi = {
      ...base,
      async progress() {
        return [{
          runId: run.id,
          branchId: run.branches[0]!.id,
          packId: pack.id,
          branchLabel: "main",
          attemptNo: 1,
          countable: true,
          graded: true,
          verdict: "stable",
          result: null,
          userPlyCount: 3,
          origin: "fresh",
          endedAt: "2026-08-23T12:00:00.000Z",
        }];
      },
      relatedProgress,
      duplicateRun,
    };
    const component = mount(App, {
      target: target(),
      props: { api: learnApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${packSummary.title} · attempt 1`));
    expect(document.body.textContent).not.toContain(pack.id);
    document.querySelector<HTMLButtonElement>("button[aria-expanded='false']")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Same position · 2 attempts on that material"));
    expect(document.body.textContent).toContain("Same pack, different position · 1 attempt on that material");
    expect(relatedProgress).toHaveBeenCalledWith(run.id, run.branches[0]!.forkNodeId);
    expect(document.body.textContent).toContain("not a mastery score");
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Try this again")!.click();
    await vi.waitFor(() => expect(duplicateRun).toHaveBeenCalledWith(
      run.id,
      expect.objectContaining({ id: expect.stringMatching(/^run-/u), seed: expect.any(Number) }),
      expect.any(String),
    ));
    await unmount(component);
  });

  it("cancels, retries, and bounds a related-attempt lookup without reopening stale results", async () => {
    history.replaceState(null, "", "/learn");
    const attempt = {
      runId: run.id,
      branchId: run.branches[0]!.id,
      packId: pack.id,
      branchLabel: "main",
      attemptNo: 1,
      countable: true,
      graded: true,
      verdict: "stable" as const,
      result: null,
      userPlyCount: 3,
      origin: "fresh" as const,
      endedAt: "2026-09-13T21:00:00.000Z",
    };
    const firstLookup = deferred<readonly { readonly relation: "same_position"; readonly runId: string; readonly branchId: string; readonly attemptCount: number }[]>();
    const relatedProgress = vi.fn()
      .mockImplementationOnce(() => firstLookup.promise)
      .mockRejectedValueOnce(new Error("private related query detail"))
      .mockResolvedValueOnce([{ relation: "same_position" as const, runId: "related-run", branchId: "main", attemptCount: 2 }]);
    const component = mount(App, {
      target: target(),
      props: {
        api: { ...api(), async progress() { return [attempt]; }, relatedProgress },
        router: new HistoryRouter(window),
        storage: new MemoryStorage(),
      },
    });

    const relatedButton = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Related attempts");
      expect(button).toBeDefined();
      return button!;
    });
    relatedButton.click();
    await vi.waitFor(() => expect(relatedButton.textContent).toBe("Cancel related search"));
    relatedButton.click();
    await vi.waitFor(() => expect(relatedButton.textContent).toBe("Related attempts"));
    firstLookup.resolve([{ relation: "same_position", runId: "stale-related-run", branchId: "main", attemptCount: 9 }]);
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).not.toContain("9 attempts on that material");
    expect(relatedButton.textContent).toBe("Related attempts");

    relatedButton.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("Related attempts could not be loaded. This attempt is unchanged; try again."));
    expect(document.body.textContent).not.toContain("private related query detail");
    expect(relatedButton.textContent).toBe("Retry related attempts");
    relatedButton.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Same position · 2 attempts on that material"));
    expect(relatedProgress).toHaveBeenCalledTimes(3);
    await unmount(component);
  });

  it("starts a due return directly instead of sending the learner back to its source", async () => {
    history.replaceState(null, "", "/learn");
    const schedule = {
      id: "schedule-due",
      sessionKind: "pack" as const,
      packId: pack.id,
      kind: "blocked" as const,
      variant: null,
      dueAt: "2026-08-23T12:00:00.000Z",
      sourceRunId: run.id,
    };
    const createRunRequest = vi.fn(async (input: import("./api.js").CreateRunRequest) => createRun({
      id: input.id,
      packId: pack.id,
      packDigest: digest,
      policyConfig: input.policyConfig,
      startFen: pack.start.fen,
      seed: input.seed,
      createdAt: "2026-08-23T13:00:00.000Z",
    }));
    const learnApi: DrillClientApi = {
      ...api(),
      async dueProgress() { return dueQueue([schedule]); },
      createRun: createRunRequest,
    };
    const component = mount(App, {
      target: target(),
      props: { api: learnApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const start = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Start due attempt");
      expect(button).toBeDefined();
      return button!;
    });
    expect(document.body.textContent).toContain("Repeat the blocked attempt");
    expect(document.body.textContent).toContain(packSummary.title);
    expect(document.body.textContent).not.toContain(pack.id);
    start.click();
    await vi.waitFor(() => expect(createRunRequest).toHaveBeenCalledWith(
      expect.objectContaining({ intent: { origin: "fresh", scheduleId: schedule.id } }),
      expect.any(String),
    ));
    await unmount(component);
  });

  it("names the variation, the frequency population, waiting returns and difficult positions on Learn", async () => {
    history.replaceState(null, "", "/learn");
    const population = { source: "lichess-explorer" as const, ratings: [1600], speeds: ["blitz", "rapid"], since: "2023-10", until: "2026-09" };
    const learnApi: DrillClientApi = {
      ...api(),
      async dueProgress() {
        return {
          schedules: [
            { id: "named", sessionKind: "pack" as const, packId: pack.id, kind: "varied" as const, variant: "opposite_side", dueAt: "2026-09-20T09:00:00.000Z", sourceRunId: run.id, frequency: { games: 12_345, population }, standing: "established" as const },
            { id: "seeded", sessionKind: "pack" as const, packId: pack.id, kind: "varied" as const, variant: null, dueAt: "2026-09-21T09:00:00.000Z", sourceRunId: run.id, frequency: null, standing: "learning" as const },
          ],
          waiting: 3,
          intakeLimit: 2,
        };
      },
      async difficultRoots() {
        return { threshold: 3, total: 2, roots: [{ sessionKind: "pack" as const, packId: pack.id, unstableCount: 4, lastUnstableAt: "2026-09-19T10:00:00.000Z", runs: [{ runId: run.id, endedAt: "2026-09-19T10:00:00.000Z" }] }] };
      },
    };
    const component = mount(App, { target: target(), props: { api: learnApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("the pack names this variation: Same structure, opposite side"));
    const text = document.body.textContent ?? "";
    expect(text).toContain("Varied repetition · the variation is a fresh opponent seed");
    expect(text).toContain("Position reached in 12,345 games · Lichess games · rating groups 1600");
    expect(text).toContain("3 more returns are waiting. At most 2 are shown at once");
    expect(text).toContain("Listed after 3 or more unstable graded attempts at the same starting position.");
    expect(text).toContain("4 unstable attempts recorded");
    expect(text).toContain("Showing 1 of 2 positions that meet this rule.");
    // Discharge D2: each due card renders its standing word beside its due date, with the fixed explanation.
    const dueCards = [...document.querySelectorAll<HTMLElement>('section[aria-labelledby="due-title"] article')];
    expect(dueCards).toHaveLength(2);
    const expected = [{ standing: "established", dueAt: "2026-09-20T09:00:00.000Z" }, { standing: "learning", dueAt: "2026-09-21T09:00:00.000Z" }] as const;
    for (const [index, card] of dueCards.entries()) {
      const { standing, dueAt } = expected[index]!;
      const label = card.querySelector<HTMLElement>(".return-standing");
      expect(label?.dataset.returnStanding).toBe(standing);
      expect(label?.textContent).toBe(`${standing} (based on how many spaced returns you've held)`);
      expect(label?.parentElement?.textContent).toContain(`${new Date(dueAt).toLocaleString()} · ${standing}`);
    }
    for (const id of ["due-title", "difficult-title"]) {
      expect(document.querySelector(`section[aria-labelledby="${id}"]`), id).not.toBeNull();
      expect(document.querySelector(`section[aria-labelledby="${id}"]`)?.textContent ?? "", id).not.toMatch(/\d+\s*%|mastery|level \d/iu);
    }
    const open = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.startsWith("Open run ·"));
    expect(open).toBeDefined();
    open!.click();
    await vi.waitFor(() => expect(location.pathname).toBe(`/play/run/${encodeURIComponent(run.id)}`));
    await unmount(component);
  });

  it("dismisses a due return only after success and ignores a settlement from a departed Learn route", async () => {
    history.replaceState(null, "", "/learn");
    const retrySchedule = {
      id: "schedule-retry",
      sessionKind: "pack" as const,
      packId: pack.id,
      kind: "blocked" as const,
      variant: null,
      dueAt: "2026-09-13T21:10:00.000Z",
      sourceRunId: run.id,
    };
    const departedSchedule = { ...retrySchedule, id: "schedule-departed", dueAt: "2026-09-13T21:20:00.000Z" };
    const firstDismiss = deferred<void>();
    const departedDismiss = deferred<void>();
    const dismissSchedule = vi.fn()
      .mockImplementationOnce(() => firstDismiss.promise)
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(() => departedDismiss.promise);
    let dueReads = 0;
    const learnApi: DrillClientApi = {
      ...api(),
      async dueProgress() { return dueQueue(++dueReads === 1 ? [retrySchedule, departedSchedule] : [departedSchedule]); },
      dismissSchedule,
    };
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: learnApi, router, storage: new MemoryStorage() },
    });
    const dueLabel=(value:string)=>new Date(value).toLocaleString();
    const dismissFor = (scheduleId:string):HTMLButtonElement => {
      const article=[...document.querySelectorAll<HTMLElement>("article")].find((candidate)=>candidate.querySelector(`#schedule-dismiss-busy-${scheduleId}`)!==null||candidate.textContent?.includes(scheduleId==="schedule-retry"?dueLabel(retrySchedule.dueAt):dueLabel(departedSchedule.dueAt)));
      return [...(article?.querySelectorAll<HTMLButtonElement>("button")??[])].find((candidate)=>candidate.textContent==="Dismiss")!;
    };

    await vi.waitFor(() => expect([...document.querySelectorAll<HTMLButtonElement>("button")].filter((candidate) => candidate.textContent === "Dismiss")).toHaveLength(2));
    let dismiss = dismissFor(retrySchedule.id);
    dismiss.click();
    dismiss.click();
    await vi.waitFor(() => expect(dismissSchedule).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(dismiss.disabled).toBe(true));
    expect(dismiss.getAttribute("aria-describedby")).toBe(`schedule-dismiss-busy-${retrySchedule.id}`);
    firstDismiss.reject(new Error("private dismissal detail"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("This return could not be dismissed. It remains in your queue; try again."));
    expect(document.body.textContent).not.toContain("private dismissal detail");
    expect(document.body.textContent).toContain(dueLabel(retrySchedule.dueAt));

    dismiss.click();
    await vi.waitFor(() => expect(dismissSchedule).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(document.body.textContent).not.toContain(dueLabel(retrySchedule.dueAt)));

    dismiss = dismissFor(departedSchedule.id);
    dismiss.click();
    await vi.waitFor(() => expect(dismissSchedule).toHaveBeenCalledTimes(3));
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    router.navigate("/learn");
    await vi.waitFor(() => expect(document.body.textContent).toContain(dueLabel(departedSchedule.dueAt)));
    departedDismiss.resolve();
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).toContain(dueLabel(departedSchedule.dueAt));
    await unmount(component);
  });

  it("uses pack titles across Learn recommendations and refuses unknown registry ids", async () => {
    history.replaceState(null, "", "/learn");
    const unknownPackId = "missing-in-catalogue";
    const createRunRequest = vi.fn(async (input: import("./api.js").CreateRunRequest) => createRun({
      id: "shape-recommendation-run",
      packId: pack.id,
      packDigest: digest,
      policyConfig: input.policyConfig,
      startFen: pack.start.fen,
      seed: input.seed,
      createdAt: "2026-08-23T13:00:00.000Z",
    }));
    const learnApi: DrillClientApi = {
      ...api(),
      createRun: createRunRequest,
      async recommendations() {
        return {
          recommendations: [{
            kind: "shape_encounter" as const,
            shapeId: "shape-one",
            shapeName: "Open file",
            runCount: 1,
            runIds: [run.id],
            packIds: [pack.id],
          }],
          selection: { shown: 1, total: 4 },
        };
      },
      async dueProgress() {
        return dueQueue([{ id: "unknown-schedule", sessionKind: "pack" as const, packId: unknownPackId, kind: "blocked" as const, variant: null, dueAt: "2026-08-23T12:00:00.000Z", sourceRunId: run.id }]);
      },
    };
    const component = mount(App, {
      target: target(),
      props: { api: learnApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    const rehearsal = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === `Opening · Rehearse ${packSummary.title}`);
      expect(button).toBeDefined();
      return button!;
    });
    expect(document.body.textContent).toContain("Showing 1 of 4 grounded recommendations.");
    expect(document.body.textContent).toContain("Unavailable rehearsal");
    expect(document.body.textContent).not.toContain(pack.id);
    expect(document.body.textContent).not.toContain(unknownPackId);
    rehearsal.click();
    await vi.waitFor(() => expect(createRunRequest).toHaveBeenCalledWith(expect.objectContaining({ session: { kind: "pack", packId: pack.id } }), expect.any(String)));
    await unmount(component);
  });

  it("retains the saved-run page through duplicate, failure, crossed response, retry, and departure", async () => {
    history.replaceState(null, "", "/review");
    const older = { ...runSummary, id: "older-run", title: "Older rehearsal", updatedAt: "2026-08-10T21:00:00.000Z" };
    const departed = { ...runSummary, id: "departed-run", title: "Departed rehearsal", updatedAt: "2026-08-09T21:00:00.000Z" };
    const firstPage = deferred<RunPage>();
    const departedPage = deferred<RunPage>();
    const pages: number[] = [];
    let offsetOneCalls = 0;
    const pagedApi: DrillClientApi = {
      ...api(),
      async runPage(_limit = 50, offset = 0) {
        pages.push(offset);
        if (offset === 0) return { runs: [runSummary], selection: { shown: 1, total: 4 } };
        if (offset === 1) {
          offsetOneCalls += 1;
          if (offsetOneCalls === 1) return firstPage.promise;
          if (offsetOneCalls === 2) return { runs: [runSummary], selection: { shown: 2, total: 4 } };
          return { runs: [older], selection: { shown: 2, total: 4 } };
        }
        return departedPage.promise;
      },
    };
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: pagedApi, router, storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Showing 1 of 4 saved games and rehearsals."));
    let loadMore = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Load more")!;
    loadMore.click();
    loadMore.click();
    await vi.waitFor(() => expect(pages).toEqual([0, 1]));
    expect(loadMore.disabled).toBe(true);
    firstPage.reject(new Error("private storage detail"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("More saved games could not be loaded. Your current list is unchanged; try again."));
    expect(document.body.textContent).not.toContain("private storage detail");
    expect(document.body.textContent).toContain(runSummary.title);

    loadMore = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Load more")!;
    loadMore.click();
    await vi.waitFor(() => expect(pages).toEqual([0, 1, 1]));
    await vi.waitFor(() => expect(document.body.textContent).toContain("More saved games could not be loaded."));
    expect(document.querySelectorAll(".item-list article")).toHaveLength(1);

    loadMore = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Load more")!;
    loadMore.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Older rehearsal"));
    expect(document.body.textContent).toContain("Showing 2 of 4 saved games and rehearsals.");

    loadMore = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Load more")!;
    loadMore.click();
    await vi.waitFor(() => expect(pages).toEqual([0, 1, 1, 1, 2]));
    router.navigate("/");
    await vi.waitFor(() => expect(window.location.pathname).toBe("/"));
    departedPage.resolve({ runs: [departed], selection: { shown: 3, total: 4 } });
    await tick();
    await Promise.resolve();
    expect(document.body.textContent).not.toContain("Departed rehearsal");
    await unmount(component);
  });

  it("bounds an invalid initial saved-run page before it reaches a route", async () => {
    history.replaceState(null, "", "/review");
    const component = mount(App, {
      target: target(),
      props: {
        api: { ...api(), async runPage() { throw new Error("private database topology"); } },
        router: new HistoryRouter(window),
        storage: new MemoryStorage(),
      },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Saved games could not be loaded. Reload this page to try again."));
    expect(document.body.textContent).not.toContain("private database topology");
    await unmount(component);
  });

  it("saves and starts a validation-clean Studio draft without authoring run policy", async () => {
    history.replaceState(null, "", "/create");
    const draft = { id: "draft-one", packId: pack.id, document: pack, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    const updatePackDraft = vi.fn(async () => draft);
    const lintPackDraft = vi.fn(async () => draft.validation);
    const playtestPackDraft = vi.fn(async (_draftId: string, _writerId: string) => ({ run, url: `/play/run/${run.id}` }));
    const studioApi: DrillClientApi = { ...api(), async packDrafts() { return [draft]; }, updatePackDraft, lintPackDraft, playtestPackDraft };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    await vi.waitFor(() => expect(document.querySelector<HTMLButtonElement>("button.primary")?.disabled).toBe(false));
    expect(lintPackDraft).toHaveBeenCalledWith(draft.id, expect.objectContaining({ id: pack.id }));
    document.querySelector<HTMLButtonElement>("button.primary")!.click();
    await vi.waitFor(() => expect(playtestPackDraft).toHaveBeenCalled());
    expect(updatePackDraft).toHaveBeenCalledWith(draft.id, draft.digest, expect.objectContaining({ id: pack.id }));
    expect(playtestPackDraft).toHaveBeenCalledWith(draft.id, expect.stringMatching(/^writer-/));
    await vi.waitFor(() => expect(location.pathname).toBe(`/play/run/${run.id}`));
    await unmount(component);
  });

  it("keeps Studio save single-flight and replaces storage diagnostics with retry copy", async () => {
    history.replaceState(null, "", "/create");
    const draft = { id: "save-lifecycle-draft", packId: pack.id, document: pack, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    const first = deferred<PackDraft>();
    const second = deferred<PackDraft>();
    const updatePackDraft = vi.fn((_draftId: string, _digest: string, _document: unknown) => first.promise);
    updatePackDraft.mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const studioApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return [draft]; },
      async lintPackDraft() { return draft.validation; },
      updatePackDraft,
    };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    const save = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Save");
      expect(button).toBeDefined();
      return button!;
    });
    save.click();
    save.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => expect(updatePackDraft).toHaveBeenCalledTimes(1));
    expect(document.body.textContent).toContain("Saving the retained draft…");
    first.reject(new Error("private optimistic-lock database trace"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("This draft could not be saved."));
    expect(document.body.textContent).not.toContain("private optimistic-lock database trace");
    expect(document.querySelector<HTMLTextAreaElement>("#studio-json")!.disabled).toBe(false);

    save.click();
    await vi.waitFor(() => expect(updatePackDraft).toHaveBeenCalledTimes(2));
    second.resolve({ ...draft, digest: `sha256:${"b".repeat(64)}` });
    await vi.waitFor(() => expect(document.body.textContent).not.toContain("Saving the retained draft…"));
    await unmount(component);
  });

  it("keeps successful registration distinct from a failed draft-list refresh", async () => {
    history.replaceState(null, "", "/create");
    const draft = { id: "register-lifecycle-draft", packId: pack.id, document: pack, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    let listCalls = 0;
    const registerPackDraft = vi.fn(async () => ({ ...packSummary, id: pack.id, reviewStatus: "published" as const, channel: "community" as const }));
    const studioApi: DrillClientApi = {
      ...api(),
      async packDrafts() {
        listCalls += 1;
        if (listCalls > 1) throw new Error("private refresh trace");
        return [draft];
      },
      async lintPackDraft() { return draft.validation; },
      registerPackDraft,
    };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    const register = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Register community pack")!;
      expect(button.disabled).toBe(false);
      return button;
    });
    register.click();
    await vi.waitFor(() => expect(registerPackDraft).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The pack was registered, but the draft list could not refresh."));
    expect(document.body.textContent).not.toContain("private refresh trace");
    expect(document.body.textContent).toContain(`${pack.id} · registered`);
    await unmount(component);
  });

  it("shows graduation conditions from the current unsaved Studio bytes", async () => {
    history.replaceState(null, "", "/create");
    const documentWithConditions = structuredClone(pack) as unknown as Record<string, unknown>;
    documentWithConditions.provenance = {
      ...(documentWithConditions.provenance as Record<string, unknown>),
      graduationBlockers: [
        { id: "needs-source", state: "blocking", statement: "Attach the source." },
        { id: "engine-checked", state: "resolved", statement: "Engine evidence attached.", resolved: { at: "2026-08-25", by: "fixture" } },
      ],
    };
    const draft = { id: "draft-one", packId: pack.id, document: documentWithConditions, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    const studioApi: DrillClientApi = { ...api(), async packDrafts() { return [draft]; }, async lintPackDraft() { return draft.validation; } };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    await vi.waitFor(() => expect(document.querySelector(".graduation-column")?.textContent).toContain("1 blocking · 1 discharged"));
    expect(document.querySelector(".graduation-column")?.textContent).toContain("needs-source");

    const next = structuredClone(documentWithConditions) as Record<string, unknown>;
    (next.provenance as { graduationBlockers: { state: string }[] }).graduationBlockers[0]!.state = "resolved";
    const textarea = document.querySelector<HTMLTextAreaElement>("#studio-json")!;
    textarea.value = JSON.stringify(next, null, 2);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector(".graduation-column")?.textContent).toContain("0 blocking · 2 discharged"));
    await unmount(component);
  });

  it("debounces unsaved Studio lint, reports invalid JSON locally, and never saves while typing", async () => {
    history.replaceState(null, "", "/create");
    const draft = { id: "draft-one", packId: pack.id, document: pack, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    const updatePackDraft = vi.fn(async () => draft);
    let resolveSlow: ((validation: PackDraft["validation"]) => void) | undefined;
    const lintPackDraft = vi.fn(async (_draftId: string, document: unknown) => {
      const title = (document as { title?: string }).title;
      if (title === "Slow stale title") return new Promise<PackDraft["validation"]>((resolve) => { resolveSlow = resolve; });
      return title === "Unsaved invalid title"
        ? { valid: false, issues: [{ code: "TITLE_FIXTURE", path: "/title", message: "The unsaved title is rejected." }] }
        : title === "Newer invalid title"
          ? { valid: false, issues: [{ code: "NEWER_FIXTURE", path: "/title", message: "The newer result wins." }] }
        : draft.validation;
    });
    const studioApi: DrillClientApi = { ...api(), async packDrafts() { return [draft]; }, updatePackDraft, lintPackDraft };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    await vi.waitFor(() => expect(lintPackDraft).toHaveBeenCalledTimes(1));
    const textarea = document.querySelector<HTMLTextAreaElement>("#studio-json")!;
    textarea.value = JSON.stringify({ ...pack, title: "Unsaved invalid title" }, null, 2);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The unsaved title is rejected."));
    expect(document.querySelector<HTMLButtonElement>("button.primary")?.disabled).toBe(true);
    expect(updatePackDraft).not.toHaveBeenCalled();

    textarea.value = JSON.stringify({ ...pack, title: "Slow stale title" }, null, 2);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(lintPackDraft).toHaveBeenCalledTimes(3));
    textarea.value = JSON.stringify({ ...pack, title: "Newer invalid title" }, null, 2);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The newer result wins."));
    resolveSlow?.({ valid: false, issues: [{ code: "STALE_FIXTURE", path: "/title", message: "The stale result replaced the new one." }] });
    await tick();
    expect(document.body.textContent).not.toContain("The stale result replaced the new one.");

    const callsBeforeMalformed = lintPackDraft.mock.calls.length;
    textarea.value = "{ not json";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(document.body.textContent).toContain("JSON is not valid:"));
    expect(lintPackDraft).toHaveBeenCalledTimes(callsBeforeMalformed);
    expect(updatePackDraft).not.toHaveBeenCalled();
    await unmount(component);
  });

  it("shows every rejected shape action instead of dropping the promise", async () => {
    history.replaceState(null, "", "/create");
    let rejectSave = true;
    let rejectProbe = false;
    const shapeDraft: ShapeDraft = {
      id: "shape-draft-one",
      shapeId: "shape-one",
      document: { id: "shape-one", version: "1.0.0" },
      digest,
      state: "draft",
      validation: { valid: true, issues: [] },
    };
    const shapeApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return []; },
      async shapeDrafts() { return [shapeDraft]; },
      async createShapeDraft() { throw new Error("create shape failed"); },
      async updateShapeDraft() {
        if (rejectSave) throw new Error("save shape failed");
        return shapeDraft;
      },
      async lintShapeDraft() {
        if (rejectProbe) throw new Error("lint shape failed");
        return shapeDraft.validation;
      },
      async registerShapeDraft() { throw new Error("register shape failed"); },
    };
    const component = mount(App, { target: target(), props: { api: shapeApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("What are you starting from?"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    await vi.waitFor(() => expect([...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Register community shape")?.disabled).toBe(false));
    for (const [label, message, prepare] of [
      ["Create shape draft", "The shape draft could not be created. Check the JSON and try again.", () => {}],
      ["Save shape", "This shape could not be saved. Your editor bytes are unchanged; try again.", () => {}],
      ["Lint + probe", "The shape probe could not finish. Your editor bytes and FEN are unchanged; try again.", () => { rejectProbe = true; }],
      ["Register community shape", "The shape was saved, but could not be registered. Resolve any publication blocker and try registration again.", () => { rejectSave = false; }],
    ] as const) {
      prepare();
      [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === label)!.click();
      await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe(message));
    }
    await unmount(component);
  });

  it("keeps Shape Studio creation single-flight and inert across a route generation", async () => {
    history.replaceState(null, "", "/create");
    const pending = deferred<ShapeDraft>();
    const shapeDraft: ShapeDraft = {
      id: "shape-draft-one",
      shapeId: "shape-one",
      document: { id: "shape-one", version: "1.0.0" },
      digest,
      state: "draft",
      validation: { valid: true, issues: [] },
    };
    const createShapeDraft = vi.fn(() => pending.promise);
    const shapeApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return []; },
      async shapeDrafts() { return [shapeDraft]; },
      createShapeDraft,
      async lintShapeDraft() { return shapeDraft.validation; },
    };
    const router = new HistoryRouter(window);
    const component = mount(App, { target: target(), props: { api: shapeApi, router, storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("shape-one · draft"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    const create = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Create shape draft")!;
    create.click();
    create.click();
    await vi.waitFor(() => expect(createShapeDraft).toHaveBeenCalledTimes(1));
    expect(document.querySelector<HTMLFieldSetElement>(".shape-editor-fields")?.getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector<HTMLTextAreaElement>("#shape-studio-json")?.disabled).toBe(true);

    router.navigate("/review");
    pending.resolve({ ...shapeDraft, id: "departed-shape-draft", document: { ...shapeDraft.document as Record<string, unknown>, name: "Departed mutation" } });
    await tick();
    router.navigate("/create");
    await vi.waitFor(() => expect(document.querySelector("aside[aria-label='Your shape drafts'] button")).not.toBeNull());
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    expect(document.querySelector<HTMLTextAreaElement>("#shape-studio-json")?.value).not.toContain("Departed mutation");
    await unmount(component);
  });

  it("retains successful shape registration when the secondary list refresh fails", async () => {
    history.replaceState(null, "", "/create");
    let listCalls = 0;
    const shapeDraft: ShapeDraft = {
      id: "shape-draft-one",
      shapeId: "shape-one",
      document: { id: "shape-one", version: "1.0.0" },
      digest,
      state: "draft",
      validation: { valid: true, issues: [] },
    };
    const shapeApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return []; },
      async shapeDrafts() {
        listCalls += 1;
        if (listCalls > 1) throw new Error("refresh failed");
        return [shapeDraft];
      },
      async updateShapeDraft() { return shapeDraft; },
      async lintShapeDraft() { return shapeDraft.validation; },
      async registerShapeDraft() {
        return { id: "shape-one", version: "1.0.0", digest, name: "Shape one", phases: ["middlegame"], licence: "CC-BY-SA-4.0", channel: "community", usedByPacks: 0 };
      },
    };
    const component = mount(App, { target: target(), props: { api: shapeApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("shape-one · draft"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    const register = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Register community shape")!;
    await vi.waitFor(() => expect(register.disabled).toBe(false));
    register.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("shape-one · registered"));
    expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe("The shape was registered, but the draft list could not refresh. Reload Create to see its current state.");
    await unmount(component);
  });

  it("keeps a seed request single-flight and does not publish it after Create is left", async () => {
    history.replaceState(null, "", "/create");
    const first = deferred<PackDraft>();
    const second = deferred<PackDraft>();
    const requested: unknown[] = [];
    const createPackDraft = vi.fn((document: unknown) => {
      requested.push(document);
      return requested.length === 1 ? first.promise : second.promise;
    });
    const router = new HistoryRouter(window);
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), createPackDraft }, router, storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("What are you starting from?"));
    [...document.querySelectorAll<HTMLButtonElement>(".seed-doors button")].find((button) => button.textContent?.includes("Position"))!.click();
    await tick();
    const form = document.querySelector<HTMLFormElement>(".seed-chooser form")!;
    const title = form.querySelector<HTMLInputElement>('input[placeholder="What consequence will this rehearse?"]')!;
    title.value = "Retained position";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(createPackDraft).toHaveBeenCalledTimes(1));
    expect(title.disabled).toBe(true);
    first.reject(new Error("private pack writer trace"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("This draft could not be created."));
    expect(document.body.textContent).not.toContain("private pack writer trace");

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(createPackDraft).toHaveBeenCalledTimes(2));
    const secondDocument = requested[1] as DrillPackDefinition;
    router.navigate("/review");
    await vi.waitFor(() => expect(location.pathname).toBe("/review"));
    second.resolve({
      id: "departed-position-draft",
      packId: secondDocument.id,
      document: secondDocument,
      digest,
      state: "draft",
      validation: { valid: false, issues: [] },
    });
    await tick();
    await Promise.resolve();
    expect(location.pathname).toBe("/review");
    expect(document.querySelector("#pack-studio-editor")).toBeNull();
    await unmount(component);
  });

  it("resumes game-to-draft preparation without importing the saved game twice", async () => {
    history.replaceState(null, "", "/create");
    const pendingImport = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["importGame"]>>>>();
    const firstDistill = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["distillRun"]>>>>();
    const secondDistill = deferred<Awaited<ReturnType<NonNullable<DrillClientApi["distillRun"]>>>>();
    const importGame = vi.fn((_input: Parameters<NonNullable<DrillClientApi["importGame"]>>[0], _writerId: string) => pendingImport.promise);
    const distillRun = vi.fn((_runId: string, _input: Parameters<NonNullable<DrillClientApi["distillRun"]>>[1]) => firstDistill.promise);
    distillRun.mockImplementationOnce(() => firstDistill.promise).mockImplementationOnce(() => secondDistill.promise);
    const storage = new MemoryStorage();
    const component = mount(App, {
      target: target(),
      props: { api: { ...api(), importGame, distillRun }, router: new HistoryRouter(window), storage },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("What are you starting from?"));
    [...document.querySelectorAll<HTMLButtonElement>(".seed-doors button")].find((button) => button.textContent?.includes("Finished game"))!.click();
    await tick();
    const form = document.querySelector<HTMLFormElement>(".seed-chooser form")!;
    const title = form.querySelector<HTMLInputElement>('input[placeholder="What should this game\'s rehearsal teach?"]')!;
    title.value = "Saved game lesson";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    const pgn = form.querySelector<HTMLTextAreaElement>("textarea")!;
    pgn.value = "1. e4 e5 2. Nf3 Nc6";
    pgn.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(importGame).toHaveBeenCalledTimes(1));
    const [request, writerId] = importGame.mock.calls[0]!;
    expect(storage.getItem(writerStorageKey(request.id))).toBeNull();
    pendingImport.resolve({ run: { ...run, id: request.id }, importRecord: {} as never, evidencePass: { jobs: 0 } });
    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledTimes(1));
    expect(storage.getItem(writerStorageKey(request.id))).toContain(writerId);
    firstDistill.reject(new Error("private distillation trace"));
    await vi.waitFor(() => expect(document.body.textContent).toContain("The game is saved, but its draft could not be prepared."));
    expect(document.body.textContent).not.toContain("private distillation trace");

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledTimes(2));
    expect(importGame).toHaveBeenCalledTimes(1);
    const [retryRunId, retryInput] = distillRun.mock.calls[1]!;
    expect(retryRunId).toBe(request.id);
    const draftDocument = { ...pack, id: retryInput.packId, title: retryInput.title };
    secondDistill.resolve({
      draft: { id: "prepared-game-draft", packId: retryInput.packId, document: draftDocument, digest, state: "draft", validation: { valid: false, issues: [] } },
      proposals: [],
      dropped: [],
    });
    await vi.waitFor(() => expect(document.querySelector("#pack-studio-editor")).not.toBeNull());
    await unmount(component);
  });

  it("opens Create on four working seed doors instead of a raw pack textarea", async () => {
    history.replaceState(null, "", "/create");
    const createdDocuments: unknown[] = [];
    const draftFor = (document: unknown, index = createdDocuments.length): PackDraft => ({
      id: `seed-draft-${index}`,
      packId: String((document as { id?: string }).id ?? `seed-${index}`),
      document,
      digest,
      state: "draft",
      validation: { valid: false, issues: [] },
    });
    const createPackDraft = vi.fn(async (document: unknown) => {
      createdDocuments.push(document);
      return draftFor(document);
    });
    const distillRun = vi.fn(async (_runId: string, input: { readonly packId: string; readonly title: string }) => ({
      draft: draftFor({ ...pack, id: input.packId, title: input.title, provenance: { reviewStatus: "draft", graduationBlockers: ["Review"] } }),
      proposals: [],
      dropped: [],
    }));
    const importGame = vi.fn(async (input: { readonly id: string }) => ({ run: { ...run, id: input.id }, importRecord: {} as never, evidencePass: { jobs: 0 } }));
    const exportPack = vi.fn(async () => ({ document: pack, digest }));
    const studioApi: DrillClientApi = { ...api(), createPackDraft, distillRun, importGame, exportPack };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });
    const backToDoors = async (): Promise<void> => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Back to four choices")!;
      await vi.waitFor(() => expect(button.disabled).toBe(false));
      button.click();
      await tick();
    };

    await vi.waitFor(() => expect(document.body.textContent).toContain("What are you starting from?"));
    for (const label of ["Position", "Finished game", "Run you played", "Existing pack"]) expect(document.body.textContent).toContain(label);
    expect(document.querySelector("#studio-json")).toBeNull();

    [...document.querySelectorAll<HTMLButtonElement>(".seed-doors button")].find((button) => button.textContent?.includes("Position"))!.click();
    await tick();
    const positionForm = document.querySelector<HTMLFormElement>(".seed-chooser form")!;
    const title = positionForm.querySelector<HTMLInputElement>('input[placeholder="What consequence will this rehearse?"]')!;
    title.value = "Queenside squeeze";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    positionForm.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(createPackDraft).toHaveBeenCalledTimes(1));
    const scaffold = createdDocuments[0] as Record<string, unknown>;
    expect(Object.keys(scaffold)).toEqual(expect.arrayContaining(["id", "version", "title", "mode", "start", "objective", "checkpoints", "opponentPolicy", "feedbackPolicy", "provenance"]));
    await vi.waitFor(() => expect(document.querySelector("#studio-json")).not.toBeNull());

    await backToDoors();
    [...document.querySelectorAll<HTMLButtonElement>(".seed-doors button")].find((button) => button.textContent?.includes("Finished game"))!.click();
    await tick();
    const gameForm = document.querySelector<HTMLFormElement>(".seed-chooser form")!;
    const gameInputs = gameForm.querySelectorAll<HTMLInputElement>("input");
    gameInputs[0]!.value = "Game lesson";
    gameInputs[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    const pgn = gameForm.querySelector<HTMLTextAreaElement>("textarea")!;
    pgn.value = "1. e4 e5 2. Nf3 Nc6";
    pgn.dispatchEvent(new Event("input", { bubbles: true }));
    gameForm.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(importGame).toHaveBeenCalledTimes(1));
    const [gameImportRequest] = importGame.mock.calls[0]!;
    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledWith(gameImportRequest.id, expect.objectContaining({ title: "Game lesson", branchId: run.activeCursor.branchId })));

    await backToDoors();
    [...document.querySelectorAll<HTMLButtonElement>(".seed-doors button")].find((button) => button.textContent?.includes("Run you played"))!.click();
    await tick();
    const runForm = document.querySelector<HTMLFormElement>(".seed-chooser form")!;
    const runSelect = runForm.querySelector<HTMLSelectElement>("select")!;
    runSelect.selectedIndex = 1;
    runSelect.value = run.id;
    runSelect.dispatchEvent(new Event("input", { bubbles: true }));
    runSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    const runName = runForm.querySelector<HTMLInputElement>("input")!;
    runName.value = "Run lesson";
    runName.dispatchEvent(new Event("input", { bubbles: true }));
    runForm.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledWith(run.id, expect.objectContaining({ title: "Run lesson" })));

    await backToDoors();
    [...document.querySelectorAll<HTMLButtonElement>(".seed-doors button")].find((button) => button.textContent?.includes("Existing pack"))!.click();
    await tick();
    const packForm = document.querySelector<HTMLFormElement>(".seed-chooser form")!;
    const packSelect = packForm.querySelector<HTMLSelectElement>("select")!;
    packSelect.value = pack.id;
    packSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    packForm.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(exportPack).toHaveBeenCalledWith(pack.id));
    await vi.waitFor(() => expect(createPackDraft).toHaveBeenCalledTimes(2));
    expect((createdDocuments[1] as DrillPackDefinition).id).toMatch(new RegExp(`^${pack.id}-copy-`, "u"));
    await unmount(component);
  });

  it("makes a null plan signature an explicit noted choice in Shape Studio", async () => {
    history.replaceState(null, "", "/create");
    const shapeDraft: ShapeDraft = {
      id: "shape-signature-draft",
      shapeId: "duration-shape",
      document: {
        id: "duration-shape",
        plans: [{ id: "hold-over-time", label: "Hold over time", success: {} }],
        provenance: { licence: "CC-BY-SA-4.0", sources: ["original"], attribution: [] },
      },
      digest,
      state: "draft",
      validation: { valid: false, issues: [] },
    };
    const shapeApi: DrillClientApi = { ...api(), async packDrafts() { return []; }, async shapeDrafts() { return [shapeDraft]; } };
    const component = mount(App, { target: target(), props: { api: shapeApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("duration-shape · draft"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("No success signature has been chosen."));
    const reason = document.querySelector<HTMLTextAreaElement>(".signature-editor article textarea")!;
    reason.value = "Duration cannot be certified by one position.";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    const choose = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Mark deliberately uncheckable")!;
    expect(choose.disabled).toBe(false);
    choose.click();
    await tick();

    const bytes = JSON.parse(document.querySelector<HTMLTextAreaElement>("#shape-studio-json")!.value);
    expect(bytes.plans[0].success).toEqual({ signature: null, note: "Duration cannot be certified by one position." });
    expect(document.body.textContent).toContain("Honest refusal:");
    expect(document.body.textContent).toContain("not missing work");
    await unmount(component);
  });

  it("authors recursive shape triggers and plan checks without hand-editing JSON", async () => {
    history.replaceState(null, "", "/create");
    const shapeDraft: ShapeDraft = {
      id: "shape-builder-draft",
      shapeId: "builder-shape",
      document: {
        id: "builder-shape",
        trigger: { kind: "feature", feature: { kind: "named_structure", id: "carlsbad" } },
        plans: [{ id: "prepare-break", label: "Prepare the break", success: { note: "One position can certify this." } }],
        provenance: { licence: "CC-BY-SA-4.0", sources: ["original"], attribution: [] },
      },
      digest,
      state: "draft",
      validation: { valid: false, issues: [] },
    };
    const lintShapeDraft = vi.fn(async (): Promise<ShapeDraft["validation"]> => ({
      valid: true,
      issues: [],
      corpusPreview: {
        fires: 1,
        of: 12,
        matches: [{ packId: pack.id, packTitle: String(pack.title), ply: 3, fen: pack.start.fen, startSide: pack.start.side }],
      },
    }));
    const shapeApi: DrillClientApi = { ...api(), async packDrafts() { return []; }, async shapeDrafts() { return [shapeDraft]; }, lintShapeDraft };
    const component = mount(App, { target: target(), props: { api: shapeApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("builder-shape · draft"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    await vi.waitFor(() => expect(document.querySelector("#signature-editor-title")?.textContent).toBe("Structural expression builder"));

    const triggerKind = document.querySelector<HTMLSelectElement>(".trigger-expression .expression-node > label select")!;
    triggerKind.value = "all";
    triggerKind.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    [...document.querySelectorAll<HTMLButtonElement>(".trigger-expression button")].find((button) => button.textContent === "Add condition")!.click();
    await tick();

    [...document.querySelectorAll<HTMLButtonElement>(".signature-list article button")].find((button) => button.textContent === "Add structural check")!.click();
    await tick();

    const bytes = JSON.parse(document.querySelector<HTMLTextAreaElement>("#shape-studio-json")!.value);
    expect(bytes.trigger.kind).toBe("all");
    expect(bytes.trigger.of).toHaveLength(2);
    expect(bytes.plans[0].success.signature).toEqual({ kind: "feature", feature: { kind: "named_structure", id: "carlsbad" } });
    expect(document.body.textContent).toContain("The Shape JSON above stays live");
    await vi.waitFor(() => expect(lintShapeDraft).toHaveBeenCalled());
    await vi.waitFor(() => expect(document.body.textContent).toContain("1 of 12 authored positions match this trigger."));
    const match = [...document.querySelectorAll<HTMLButtonElement>(".shape-corpus-results button")].find((button) => button.textContent?.includes(String(pack.title)))!;
    match.click();
    await tick();
    expect(document.querySelector("[aria-label='Selected matching position']")?.textContent).toContain("authored ply 3");
    expect(document.querySelector(".shape-corpus-board [data-board-theme]")).not.toBeNull();
    await unmount(component);
  });

  it("shows live vocabulary usage and unavailable policies to pack authors", async () => {
    history.replaceState(null, "", "/create");
    const studioApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return []; },
      async shapeDrafts() { return []; },
      async shapes() {
        return [
          { id: "used-shape", version: "1", digest, name: "Used shape", phases: ["middlegame"], licence: "CC-BY-SA-4.0", channel: "official", usedByPacks: 2 },
          { id: "orphan-shape", version: "1", digest, name: "Unclaimed outpost", phases: ["middlegame"], licence: "CC-BY-SA-4.0", channel: "official", usedByPacks: 0 },
        ];
      },
      async principles() {
        return [{ id: "orphan-principle", version: "1", digest, name: "Loose principle", statement: "A grounded statement.", phases: ["middlegame"], licence: "CC-BY-SA-4.0", usedByPacks: 0 }];
      },
      async capabilities() {
        return { ...capabilities, unsupportedPolicyModes: [{ mode: "plan_defense", reason: "No move selector implements this declared mode." }] };
      },
    };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.querySelector("#vocabulary-status-title")?.textContent).toBe("Vocabulary status"));
    const status = document.querySelector<HTMLElement>(".vocabulary-status")!;
    expect(status.textContent).toContain("Loose principle");
    expect(status.textContent).toContain("orphan-principle");
    expect(status.textContent).toContain("Unclaimed outpost");
    expect(status.textContent).not.toContain("Used shape");
    expect(status.textContent).toContain("plan_defense");
    expect(status.textContent).toContain("No move selector implements this declared mode.");
    await unmount(component);
  });

  it("writes an explicit whole-pack provenance posture into the unsaved buffer", async () => {
    history.replaceState(null, "", "/create");
    const draft = {
      id: "provenance-draft",
      packId: pack.id,
      document: { ...pack, provenance: { reviewStatus: "draft" as const, sources: ["reference-only"] } },
      digest,
      state: "draft" as const,
      validation: { valid: true, issues: [] },
    };
    const studioApi: DrillClientApi = { ...api(), async packDrafts() { return [draft]; } };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    await vi.waitFor(() => expect(document.querySelector("#provenance-editor-title")?.textContent).toBe("Provenance"));
    const posture = [...document.querySelectorAll<HTMLInputElement>("input[name='pack-provenance-posture']")].find((input) => input.parentElement?.textContent?.includes("CC BY-SA"))!;
    posture.click();
    await tick();
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Add credit")!.click();
    await tick();
    const sourceId = [...document.querySelectorAll<HTMLInputElement>(".credit-row input")].find((input) => input.parentElement?.textContent?.includes("Source id"))!;
    sourceId.value = "wikibooks-french";
    sourceId.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();

    const bytes = JSON.parse(document.querySelector<HTMLTextAreaElement>("#studio-json")!.value);
    expect(bytes.provenance).toMatchObject({
      reviewStatus: "draft",
      sources: ["reference-only"],
      licence: "CC-BY-SA-4.0",
      attribution: [{ sourceId: "wikibooks-french", licence: "CC-BY-SA-4.0" }],
    });
    expect(document.body.textContent).toContain("cannot represent a credited CC0 entry");
    expect(document.body.textContent).toContain("does not track licensing per paragraph");
    await unmount(component);
  });

  it("edits every pack registry reference through named pickers", async () => {
    history.replaceState(null, "", "/create");
    const packDocument = {
      ...pack,
      shapes: [],
      feedbackClaims: [{ id: "claim-one", text: "Development must precede the break.", evidenceTypes: ["author_principle"] }],
      provenance: { ...pack.provenance, reviewStatus: "draft" as const },
    };
    const draft = { id: "vocabulary-draft", packId: pack.id, document: packDocument, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    const studioApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return [draft]; },
      async shapes() { return [{ id: "carlsbad", version: "1", digest, name: "Carlsbad structure", phases: ["middlegame"], licence: "CC-BY-SA-4.0", channel: "official", usedByPacks: 4 }]; },
      async principles() { return [{ id: "development-first", version: "1", digest, name: "Development before action", statement: "Finish development before opening the position.", phases: ["opening", "middlegame"], licence: "CC-BY-SA-4.0", usedByPacks: 7 }]; },
    };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    await vi.waitFor(() => expect(document.querySelector("#vocabulary-editor-title")?.textContent).toBe("Pack vocabulary"));
    const shapeLabel = [...document.querySelectorAll<HTMLLabelElement>(".vocabulary-editor .picker-choice")].find((label) => label.textContent?.includes("Carlsbad structure"))!;
    shapeLabel.querySelector<HTMLInputElement>("input")!.click();
    await tick();
    const relation = shapeLabel.parentElement!.querySelector<HTMLSelectElement>("select")!;
    relation.value = "prospective";
    relation.dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    const principleLabel = [...document.querySelectorAll<HTMLLabelElement>(".vocabulary-editor .picker-choice")].find((label) => label.textContent?.includes("Development before action"))!;
    expect(principleLabel.textContent).toContain("Finish development before opening the position.");
    principleLabel.querySelector<HTMLInputElement>("input")!.click();
    await tick();

    const bytes = JSON.parse(document.querySelector<HTMLTextAreaElement>("#studio-json")!.value);
    expect(bytes.shapes).toEqual([{ shape: "carlsbad", relation: "prospective" }]);
    expect(bytes.feedbackClaims[0].principles).toEqual(["development-first"]);
    await unmount(component);
  });

  it("requires confirmation before withdrawing a mutable Studio draft", async () => {
    history.replaceState(null, "", "/create");
    const draft = { id: "draft-one", packId: pack.id, document: pack, digest, state: "draft" as const, validation: { valid: true, issues: [] } };
    const withdrawPackDraft = vi.fn(async () => undefined);
    const studioApi: DrillClientApi = { ...api(), async packDrafts() { return [draft]; }, withdrawPackDraft };
    const component = mount(App, { target: target(), props: { api: studioApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · draft`));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your drafts'] button")!.click();
    const withdraw = await vi.waitFor(() => {
      const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find((candidate) => candidate.textContent === "Withdraw…");
      expect(button).toBeDefined();
      expect(button!.disabled).toBe(false);
      return button!;
    });
    withdraw.click();
    expect(withdrawPackDraft).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Existing private playtest runs keep their exact tested bytes."));
    const confirm = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Confirm withdrawal")!;
    confirm.click();
    await vi.waitFor(() => expect(withdrawPackDraft).toHaveBeenCalledWith(draft.id));
    await vi.waitFor(() => expect(document.body.textContent).toContain("This draft is withdrawn; its saved bytes remain read-only."));
    await unmount(component);
  });
});
