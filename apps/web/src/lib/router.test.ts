// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import { HistoryRouter, parseRoute, routePath, routeTitle } from "./router.js";

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
