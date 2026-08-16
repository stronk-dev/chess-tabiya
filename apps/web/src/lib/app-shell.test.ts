// @vitest-environment happy-dom

import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { createRun } from "@chess-tabiya/runtime";
import { mount, unmount } from "svelte";
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
  PackSummary,
  RunSummary,
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
  engines: [],
  policyModes: ["human_common"],
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
      expect(document.body.textContent).toContain("Choose a position worth returning to."),
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
    expect(key("Tab").defaultPrevented).toBe(true);

    const playLink = document.querySelector<HTMLAnchorElement>(
      "#primary-navigation a[href='/play']",
    )!;
    playLink.focus();
    expect(key("Tab").defaultPrevented).toBe(false);

    main.focus();
    expect(key("g").defaultPrevented).toBe(true);
    expect(key("m").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(
      document.querySelector("#primary-navigation a"),
    );

    playLink.focus();
    key("?");
    await vi.waitFor(() =>
      expect(document.activeElement?.id).toBe("shell-shortcuts-title"),
    );
    key("Escape");
    await vi.waitFor(() => expect(document.activeElement).toBe(playLink));

    main.focus();
    key("?");
    await vi.waitFor(() => expect(document.activeElement?.id).toBe("shortcut-title"));
    key("Escape");
    await vi.waitFor(() => expect(document.activeElement).toBe(main));
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
    expect(document.querySelectorAll("nav a")).toHaveLength(8);
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
      ["/play", "Choose a position worth returning to."],
      ["/learn", "Return to the positions"],
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
});
