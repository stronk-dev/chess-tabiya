export type StaticRouteName =
  | "home"
  | "play"
  | "review"
  | "rating"
  | "profile"
  | "learn"
  | "live"
  | "create"
  | "library"
  | "settings";

export type AppRoute =
  | { readonly name: StaticRouteName }
  | { readonly name: "run"; readonly runId: string }
  | { readonly name: "story"; readonly runId: string }
  | { readonly name: "live-session"; readonly sessionId: string }
  | { readonly name: "live-overlay"; readonly runId: string }
  /** rfc/theory-drill-current-joins.md §2.1: an exact pack target and the three theory entries. */
  | { readonly name: "pack"; readonly packId: string }
  | { readonly name: "shape-entry"; readonly shapeId: string }
  | { readonly name: "principle-entry"; readonly principleId: string }
  | { readonly name: "opening-entry"; readonly positionKey: string }
  | { readonly name: "not-found"; readonly pathname: string };

type Subscriber = (route: AppRoute) => void;

const STATIC_ROUTES: Readonly<Record<string, StaticRouteName>> = Object.freeze({
  "/": "home",
  "/play": "play",
  "/review": "review",
  "/rating": "rating",
  "/profile": "profile",
  "/learn": "learn",
  "/live": "live",
  "/create": "create",
  "/library": "library",
  "/settings": "settings",
});

const ROUTE_TITLES: Readonly<Record<AppRoute["name"], string>> = Object.freeze({
  home: "Home",
  play: "Play",
  run: "Rehearsal",
  review: "Review",
  story: "Game review",
  rating: "Rating",
  profile: "Your profile",
  learn: "Learn",
  live: "Live",
  "live-session": "Live session",
  "live-overlay": "Live overlay",
  pack: "Rehearsal pack",
  "shape-entry": "Shape",
  "principle-entry": "Principle",
  "opening-entry": "Opening",
  create: "Create",
  library: "Library",
  settings: "Settings",
  "not-found": "Not found",
});

export function routeTitle(route: AppRoute): string {
  return `${ROUTE_TITLES[route.name]} · Tabiya`;
}

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
  const story = /^\/review\/game\/([^/]+)$/.exec(pathname);
  if (story !== null) {
    try {
      const runId = decodeURIComponent(story[1]!);
      if (runId.trim() !== "") return Object.freeze({ name: "story", runId });
    } catch { /* malformed story ids route to not-found */ }
  }
  const live = /^\/live\/(session|overlay)\/([^/]+)$/.exec(pathname);
  if (live !== null) {
    try {
      const id=decodeURIComponent(live[2]!);
      if(id.trim()!=="")return live[1]==="session"?Object.freeze({name:"live-session",sessionId:id}):Object.freeze({name:"live-overlay",runId:id});
    } catch { /* malformed live ids route to not-found */ }
  }
  // Parameterized theory/pack routes. Query strings are never read (§2.2): all state is a path segment.
  const entry = /^\/(?:play\/(pack)|library\/(shape|principle|opening))\/([^/]+)$/.exec(pathname);
  if (entry !== null) {
    try {
      const id = decodeURIComponent(entry[3]!);
      if (id.trim() !== "") {
        const kind = entry[1] ?? entry[2];
        if (kind === "pack") return Object.freeze({ name: "pack", packId: id });
        if (kind === "shape") return Object.freeze({ name: "shape-entry", shapeId: id });
        if (kind === "principle") return Object.freeze({ name: "principle-entry", principleId: id });
        return Object.freeze({ name: "opening-entry", positionKey: id });
      }
    } catch { /* malformed ids route to not-found */ }
  }
  return Object.freeze({ name: "not-found", pathname });
}

export function routePath(route: Exclude<AppRoute, { name: "not-found" }>): string {
  if(route.name==="run")return `/play/run/${encodeURIComponent(route.runId)}`;
  if(route.name==="story")return `/review/game/${encodeURIComponent(route.runId)}`;
  if(route.name==="live-session")return `/live/session/${encodeURIComponent(route.sessionId)}`;
  if(route.name==="live-overlay")return `/live/overlay/${encodeURIComponent(route.runId)}`;
  if(route.name==="pack")return `/play/pack/${encodeURIComponent(route.packId)}`;
  if(route.name==="shape-entry")return `/library/shape/${encodeURIComponent(route.shapeId)}`;
  if(route.name==="principle-entry")return `/library/principle/${encodeURIComponent(route.principleId)}`;
  if(route.name==="opening-entry")return `/library/opening/${encodeURIComponent(route.positionKey)}`;
  return Object.entries(STATIC_ROUTES).find(([, name]) => name === route.name)![0];
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
