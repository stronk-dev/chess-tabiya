// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import { HistoryRouter, parseRoute, routePath, routeTitle } from "./router.js";
import { reviewTargetBranch } from "./review-target.js";
import { fork, rewind } from "@chess-tabiya/runtime";
import { REVIEW_FIXTURE_AT, reviewFixtureRun } from "../../../../packages/runtime/src/testing/review-map-fixture.js";
import type { RunGraph } from "./api.js";

describe("application router", () => {
  it("parses every shell route and encoded run deep link", () => {
    expect(
      ["/", "/play", "/review", "/rating", "/profile", "/learn", "/live", "/create", "/library", "/settings"].map(
        (pathname) => parseRoute({ pathname }).name,
      ),
    ).toEqual([
      "home",
      "play",
      "review",
      "rating",
      "profile",
      "learn",
      "live",
      "create",
      "library",
      "settings",
    ]);
    const run = { name: "run", runId: "run / one" } as const;
    expect(routePath(run)).toBe("/play/run/run%20%2F%20one");
    expect(parseRoute({ pathname: routePath(run) })).toEqual(run);
    const story = { name: "story", runId: "run / one" } as const;
    expect(routePath(story)).toBe("/review/game/run%20%2F%20one");
    expect(parseRoute({ pathname: routePath(story) })).toEqual(story);
    const liveSession = { name: "live-session", sessionId: "class / one" } as const;
    expect(parseRoute({ pathname: routePath(liveSession) })).toEqual(liveSession);
    const overlay = { name: "live-overlay", runId: "run / one" } as const;
    expect(parseRoute({ pathname: routePath(overlay) })).toEqual(overlay);
    expect(parseRoute({ pathname: "/nowhere" })).toEqual({
      name: "not-found",
      pathname: "/nowhere",
    });
  });

  it("publishes push, replace, and browser-history navigation", () => {
    history.replaceState(null, "", "/");
    const router = new HistoryRouter(window);
    const names: string[] = [];
    router.subscribe((route) => names.push(route.name));
    router.start();

    router.navigate("/play");
    router.navigate("/review", { replace: true });
    history.pushState(null, "", "/settings");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(location.pathname).toBe("/settings");
    expect(names).toEqual(["home", "play", "review", "settings"]);
    router.destroy();
  });

  it("retains the exact cited Review node through navigation, reload and encoded identity", () => {
    const target = { name: "story", runId: "a / game", nodeId: "node / 100% +" } as const;
    const path = routePath(target);
    const url = new URL(path, "https://tabiya.test");
    expect(parseRoute(url)).toEqual(target);
    history.replaceState(null, "", "/profile");
    const router = new HistoryRouter(window);
    router.navigate(path);
    expect(router.route).toEqual(target);
    const reloaded = new HistoryRouter(window);
    expect(reloaded.route).toEqual(target);
    reloaded.destroy();
    for (const search of ["?node=", "?node=%20", "?node=one&node=two"]) expect(parseRoute({ pathname: "/review/game/a", search }).name).toBe("not-found");
    router.destroy();
  });

  it("resolves the cited move's recorded branch, not the active retry cursor, and refuses foreign/missing targets", async () => {
    const original = reviewFixtureRun({ id: "profile-target", plies: 8 });
    const node = original.nodes[6]!;
    const branched = fork(rewind(original, original.nodes[2]!.id, REVIEW_FIXTURE_AT).run, original.nodes[2]!.id, { label: "retry", at: REVIEW_FIXTURE_AT }).run;
    const graph = { id: branched.id, nodes: branched.nodes, branches: branched.branches, activeCursor: branched.activeCursor } as RunGraph;
    const before = JSON.stringify(branched.events);
    expect(graph.activeCursor.branchId).not.toBe(node.branchId);
    expect(await reviewTargetBranch({ graph: async () => graph }, graph.id, node.id)).toBe(node.branchId);
    await expect(reviewTargetBranch({ graph: async () => graph }, "different-game", node.id)).rejects.toThrow("cited move");
    await expect(reviewTargetBranch({ graph: async () => graph }, graph.id, "missing-node")).rejects.toThrow("cited move");
    expect(JSON.stringify(branched.events)).toBe(before);
  });

  it("gives every route family a page title", () => {
    expect(routeTitle({ name: "home" })).toBe("Home · Tabiya");
    expect(routeTitle({ name: "run", runId: "one" })).toBe("Rehearsal · Tabiya");
    expect(routeTitle({ name: "story", runId: "one" })).toBe("Game review · Tabiya");
    expect(routeTitle({ name: "live-session", sessionId: "one" })).toBe("Live session · Tabiya");
    expect(routeTitle({ name: "not-found", pathname: "/missing" })).toBe("Not found · Tabiya");
    expect(routeTitle({ name: "principle-entry", principleId: "x" })).toBe("Principle · Tabiya");
  });

  it("expresses every theory/pack target as a path segment (rfc/theory-drill-current-joins.md §2, criterion 4)", () => {
    const ids = ["plain", "with/slash", "100%", "with space", "Grünfeld–Индийская", "rnbqk2r/1p2bppp/p2ppn2/6B1/3NPP2/2N5/PPP3PP/R2QKB1R w KQkq -"];
    for (const id of ids) {
      for (const route of [
        { name: "pack", packId: id },
        { name: "shape-entry", shapeId: id },
        { name: "principle-entry", principleId: id },
        { name: "opening-entry", positionKey: id },
      ] as const) {
        const path = routePath(route);
        expect(path.split("/").length, path).toBe(4);
        expect(parseRoute({ pathname: path })).toEqual(route);
      }
    }
    expect(routePath({ name: "pack", packId: "a/b" })).toBe("/play/pack/a%2Fb");
    expect(routePath({ name: "opening-entry", positionKey: "k" })).toBe("/library/opening/k");
    for (const malformed of ["/play/pack/%E0%A4%A", "/library/principle/%20", "/library/shape/", "/library/concept/x", "/play/pack/a/b"]) {
      expect(() => parseRoute({ pathname: malformed })).not.toThrow();
      expect(parseRoute({ pathname: malformed }).name, malformed).toBe("not-found");
    }
  });

  it("keeps the query-string trap red: a ?pack= handoff loses the pack", () => {
    // parseRoute reads the pathname only (§2.2); a query-string target is unrepresentable.
    expect(parseRoute({ pathname: new URL("/play?pack=x", "https://tabiya.test").pathname })).toEqual({ name: "play" });
  });
});
