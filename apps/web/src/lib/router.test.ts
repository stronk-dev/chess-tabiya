// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import { HistoryRouter, parseRoute, routePath } from "./router.js";

describe("application router", () => {
  it("parses every shell route and encoded run deep link", () => {
    expect(
      ["/", "/play", "/review", "/learn", "/live", "/create", "/library", "/settings"].map(
        (pathname) => parseRoute({ pathname }).name,
      ),
    ).toEqual([
      "home",
      "play",
      "review",
      "learn",
      "live",
      "create",
      "library",
      "settings",
    ]);
    const run = { name: "run", runId: "run / one" } as const;
    expect(routePath(run)).toBe("/play/run/run%20%2F%20one");
    expect(parseRoute({ pathname: routePath(run) })).toEqual(run);
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
});
