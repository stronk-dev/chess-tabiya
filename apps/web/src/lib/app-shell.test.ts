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
  DrillClientApi,
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

  it("waits for authentication before loading and reloads the current route after registration", async () => {
    history.replaceState(null, "", "/play");
    let authenticated = false;
    let packCalls = 0;
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
        if (!authenticated) throw new Error("AUTH_REQUIRED");
        return [packSummary];
      },
    };
    const component = mount(App, {
      target: target(),
      props: { api: authApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain("Create an account"));
    expect(packCalls).toBe(0);
    document.querySelector<HTMLButtonElement>(".auth-gate > button")!.click();
    const inputs = document.querySelectorAll<HTMLInputElement>(".auth-gate input");
    inputs[0]!.value = "new_learner";
    inputs[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    inputs[1]!.value = "browser-test-password";
    inputs[1]!.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector<HTMLFormElement>(".auth-gate form")!.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Choose the game you want to understand."),
    );
    expect(packCalls).toBe(1);
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

    await vi.waitFor(() => expect(document.body.textContent).toContain("Run history"));
    expect(document.querySelectorAll("nav a")).toHaveLength(9);
    document.querySelector<HTMLButtonElement>(".item-list button")!.click();

    await vi.waitFor(() => expect(document.querySelector("main.drill")).not.toBeNull());
    expect(location.pathname).toBe("/play/run/route-run");
    expect(document.body.textContent).toContain("Read-only follower");
    expect(document.body.textContent).toContain(pack.title as string);
    expect(storage.values.size).toBe(0);
    expectDisabledControlsExplained();
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
      ["/settings", "This deployment"],
      ["/missing", "This route is not part of Tabiya"],
    ] as const;
    for (const [path, copy] of routes) {
      router.navigate(path);
      await vi.waitFor(() => expect(document.body.textContent).toContain(copy));
      expectDisabledControlsExplained();
    }

    expect(document.body.textContent).toContain("/missing");
    await unmount(component);
  });

  it("expands recorded attempts into honestly labelled related rehearsals", async () => {
    history.replaceState(null, "", "/learn");
    const base = api();
    const relatedProgress = vi.fn(async () => [
      { relation: "same_position" as const, runId: "earlier-run", branchId: "main", attemptCount: 2 },
      { relation: "same_pack" as const, runId: "pack-run", branchId: "main", attemptCount: 1 },
    ]);
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
    };
    const component = mount(App, {
      target: target(),
      props: { api: learnApi, router: new HistoryRouter(window), storage: new MemoryStorage() },
    });

    await vi.waitFor(() => expect(document.body.textContent).toContain(`${pack.id} · attempt 1`));
    document.querySelector<HTMLButtonElement>("button[aria-expanded='false']")!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Same position · 2 attempts on that material"));
    expect(document.body.textContent).toContain("Same pack, different position · 1 attempt on that material");
    expect(relatedProgress).toHaveBeenCalledWith(run.id, run.branches[0]!.forkNodeId);
    expect(document.body.textContent).toContain("not a mastery score");
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

    await vi.waitFor(() => expect(document.body.textContent).toContain("Paste a v0.27 pack to begin."));
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
    const withdraw = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Withdraw…")!;
    await vi.waitFor(() => expect(withdraw.disabled).toBe(false));
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
