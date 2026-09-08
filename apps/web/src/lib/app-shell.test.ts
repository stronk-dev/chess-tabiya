// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { commitMove, createRun } from "@chess-tabiya/runtime";
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
  RunSummary,
  ShapeDraft,
} from "./api.js";
import { HistoryRouter } from "./router.js";
import { WriterSession, type KeyValueStorage } from "./writer-session.js";

const pack = JSON.parse(fixtureJson) as DrillPackDefinition;
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

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
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
    expect(document.body.textContent).toContain("Read-only follower");
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

  it("sends the author's title when distilling a completed run", async () => {
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
      document: pack,
      digest,
      state: "draft",
      validation: { valid: false, issues: [] },
    };
    const distillRun = vi.fn(async () => ({ draft, proposals: [], dropped: [] }));
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
    const component = mount(App, {
      target: target(),
      props: { api: distillApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
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

    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledWith("distill-run", {
      packId: "distilled-distill-run",
      title: "My mating-net branches",
      branchId: terminalRun.activeCursor.branchId,
    }));
    await vi.waitFor(() => expect(location.pathname).toBe("/create"));
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
    expect(document.body.textContent).toContain("Read-only follower");
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
    expect(document.body.textContent).toContain("Writer");
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

  it("collects a named rotation, explains incomplete setup, and renders creation failures", async () => {
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
    const createLiveSession = vi.fn()
      .mockRejectedValueOnce(new Error("Rotation learner student needs write access"))
      .mockResolvedValueOnce(createdSession);
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
    createButton()!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Rotation learner student needs write access"));
    expect(createLiveSession).toHaveBeenNthCalledWith(1, expect.objectContaining({
      runId: run.id,
      title: "Tuesday relay",
      boardControl: "rotation",
      rotationHandles: ["coach", "student"],
    }));
    createButton()!.click();
    await vi.waitFor(() => expect(createLiveSession).toHaveBeenCalledTimes(2));
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
    expect(document.querySelector("[aria-label='Move proposals']")?.textContent).toContain("e2e4");
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
    await vi.waitFor(() => expect(document.querySelector("[aria-label='Session access list']")?.textContent).toContain("@student — spectator"));
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
    const castVote = vi.fn(async (_sessionId: string, _windowId: string, choiceUci: string) => ({
      window: voteWindow,
      tally: voteWindow.options.map((option) => ({ ...option, count: option.moveUci === choiceUci ? 1 : 0 })),
      total: 1,
      relayed: 0,
    }));
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
    await vi.waitFor(() => expect(castVote).toHaveBeenCalledWith("session-vote", "vote-one", "e2e4"));
    expect(castVote.mock.calls[0]).toHaveLength(3);
    await vi.waitFor(() => expect(document.body.textContent).toContain("Vote recorded for Claim the centre"));
    expect(document.body.textContent).toContain("Claim the centre · 1");
    expect(document.body.textContent).toContain("1 vote, all from signed-in members");
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
      async dueProgress() { return [schedule]; },
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
            sentence: "You recorded this shape in one preserved run.",
          }],
          selection: { shown: 1, total: 4 },
        };
      },
      async dueProgress() {
        return [{ id: "unknown-schedule", sessionKind: "pack" as const, packId: unknownPackId, kind: "blocked" as const, variant: null, dueAt: "2026-08-23T12:00:00.000Z", sourceRunId: run.id }];
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

  it("states the saved-run denominator and loads the next page", async () => {
    history.replaceState(null, "", "/review");
    const older = { ...runSummary, id: "older-run", title: "Older rehearsal", updatedAt: "2026-08-10T21:00:00.000Z" };
    const pages: number[] = [];
    const pagedApi: DrillClientApi = {
      ...api(),
      async runPage(_limit = 50, offset = 0) {
        pages.push(offset);
        return offset === 0
          ? { runs: [runSummary], selection: { shown: 1, total: 2 } }
          : { runs: [older], selection: { shown: 2, total: 2 } };
      },
    };
    const component = mount(App, {
      target: target(),
      props: { api: pagedApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Showing 1 of 2 saved games and rehearsals."));
    const loadMore = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Load more")!;
    loadMore.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Older rehearsal"));
    expect(document.body.textContent).not.toContain("Showing 1 of 2");
    expect(pages).toEqual([0, 1]);
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
    const shapeDraft: ShapeDraft = {
      id: "shape-draft-one",
      shapeId: "shape-one",
      document: { id: "shape-one" },
      digest,
      state: "draft",
      validation: { valid: true, issues: [] },
    };
    const shapeApi: DrillClientApi = {
      ...api(),
      async packDrafts() { return []; },
      async shapeDrafts() { return [shapeDraft]; },
      async createShapeDraft() { throw new Error("create shape failed"); },
      async updateShapeDraft() { throw new Error("save shape failed"); },
      async lintShapeDraft() { throw new Error("lint shape failed"); },
      async registerShapeDraft() { throw new Error("register shape failed"); },
    };
    const component = mount(App, { target: target(), props: { api: shapeApi, router: new HistoryRouter(window), storage: new MemoryStorage() } });

    await vi.waitFor(() => expect(document.body.textContent).toContain("What are you starting from?"));
    document.querySelector<HTMLButtonElement>("aside[aria-label='Your shape drafts'] button")!.click();
    for (const [label, message] of [
      ["Create shape draft", "create shape failed"],
      ["Save shape", "save shape failed"],
      ["Lint + probe", "lint shape failed"],
      ["Register community shape", "register shape failed"],
    ] as const) {
      [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === label)!.click();
      await vi.waitFor(() => expect(document.querySelector<HTMLElement>("p[role='alert']")?.textContent).toBe(message));
    }
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
    const importGame = vi.fn(async () => ({ run, importRecord: {} as never, evidencePass: { jobs: 0 } }));
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
    await vi.waitFor(() => expect(distillRun).toHaveBeenCalledWith(run.id, expect.objectContaining({ title: "Game lesson", branchId: run.activeCursor.branchId })));

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
