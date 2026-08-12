export type StaticRouteName =
  | "home"
  | "play"
  | "review"
  | "learn"
  | "live"
  | "create"
  | "library"
  | "settings";

export type AppRoute =
  | { readonly name: StaticRouteName }
  | { readonly name: "run"; readonly runId: string }
  | { readonly name: "not-found"; readonly pathname: string };

type Subscriber = (route: AppRoute) => void;

const STATIC_ROUTES: Readonly<Record<string, StaticRouteName>> = Object.freeze({
  "/": "home",
  "/play": "play",
  "/review": "review",
  "/learn": "learn",
  "/live": "live",
  "/create": "create",
  "/library": "library",
  "/settings": "settings",
});

function normalizedPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function parseRoute(location: Pick<Location, "pathname">): AppRoute {
  const pathname = normalizedPath(location.pathname);
  const staticName = STATIC_ROUTES[pathname];
  if (staticName !== undefined) return Object.freeze({ name: staticName });
  const run = /^\/play\/run\/([^/]+)$/.exec(pathname);
  if (run !== null) {
    try {
      const runId = decodeURIComponent(run[1]!);
      if (runId.trim() !== "") return Object.freeze({ name: "run", runId });
    } catch {
      // Invalid URL encoding is a not-found route, never an app crash.
    }
  }
  return Object.freeze({ name: "not-found", pathname });
}

export function routePath(route: Exclude<AppRoute, { name: "not-found" }>): string {
  return route.name === "run"
    ? `/play/run/${encodeURIComponent(route.runId)}`
    : Object.entries(STATIC_ROUTES).find(([, name]) => name === route.name)![0];
}

/** Minimal history-API router. Route state, not screen components, owns location. */
export class HistoryRouter {
  readonly #window: Window;
  readonly #subscribers = new Set<Subscriber>();
  readonly #onPopState = (): void => this.#publish();
  #route: AppRoute;
  #started = false;

  constructor(targetWindow: Window = window) {
    this.#window = targetWindow;
    this.#route = parseRoute(targetWindow.location);
  }

  get route(): AppRoute {
    return this.#route;
  }

  start(): void {
    if (this.#started) return;
    this.#started = true;
    this.#window.addEventListener("popstate", this.#onPopState);
  }

  stop(): void {
    if (!this.#started) return;
    this.#window.removeEventListener("popstate", this.#onPopState);
    this.#started = false;
  }

  subscribe(subscriber: Subscriber): () => void {
    this.#subscribers.add(subscriber);
    subscriber(this.#route);
    return () => this.#subscribers.delete(subscriber);
  }

  navigate(path: string, options: { readonly replace?: boolean } = {}): void {
    const url = new URL(path, this.#window.location.href);
    if (url.origin !== this.#window.location.origin) {
      throw new TypeError("The application router cannot navigate cross-origin");
    }
    if (options.replace === true) {
      this.#window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } else {
      this.#window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    this.#publish();
  }

  destroy(): void {
    this.stop();
    this.#subscribers.clear();
  }

  #publish(): void {
    this.#route = parseRoute(this.#window.location);
    for (const subscriber of this.#subscribers) subscriber(this.#route);
  }
}
