<script lang="ts">
  import type { Snippet } from "svelte";

  import type { AppRoute } from "./router.js";

  interface RunContext {
    readonly title: string;
    readonly access: "writer" | "read_only";
    readonly busy: boolean;
  }

  interface Props {
    route: AppRoute;
    runContext?: RunContext | undefined;
    onNavigate: (path: string) => void;
    children: Snippet;
  }

  let { route, runContext, onNavigate, children }: Props = $props();

  const destinations = [
    ["Home", "/", "home"],
    ["Play", "/play", "play"],
    ["Learn", "/learn", "learn"],
    ["Review", "/review", "review"],
    ["Live", "/live", "live"],
    ["Create", "/create", "create"],
    ["Library", "/library", "library"],
    ["Settings", "/settings", "settings"],
  ] as const;

  function active(name: string): boolean {
    return route.name === name || (name === "play" && route.name === "run");
  }

  function follow(event: MouseEvent, path: string): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(path);
  }
</script>

<div class="shell">
  <header class="shell-topbar">
    <a class="wordmark" href="/" onclick={(event) => follow(event, "/")}>Tabiya</a>
    <nav aria-label="Primary navigation">
      {#each destinations as [label, path, name]}
        <a
          href={path}
          aria-current={active(name) ? "page" : undefined}
          onclick={(event) => follow(event, path)}>{label}</a
        >
      {/each}
    </nav>
    <div class="run-context" aria-live="polite">
      {#if runContext}
        <span>{runContext.title}</span>
        <strong class:readonly={runContext.access === "read_only"}>
          {runContext.access === "read_only"
            ? "Read-only"
            : runContext.busy
              ? "Thinking…"
              : "Writer"}
        </strong>
      {:else}
        <span>No active run</span>
      {/if}
    </div>
  </header>
  <div class="shell-content">{@render children()}</div>
</div>

<style>
  .shell {
    min-height: 100vh;
  }

  .shell-topbar {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    min-height: 3.5rem;
    padding: 0.55rem clamp(0.75rem, 2vw, 1.5rem);
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--paper) 94%, white);
  }

  .wordmark {
    color: var(--ink);
    font: 600 1.2rem var(--display-font);
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: 0.15rem;
    overflow-x: auto;
  }

  nav a {
    padding: 0.5rem 0.62rem;
    border-radius: 0.55rem;
    color: var(--muted);
    font-size: 0.78rem;
    text-decoration: none;
    white-space: nowrap;
  }

  nav a:hover,
  nav a:focus-visible,
  nav a[aria-current="page"] {
    background: var(--panel);
    color: var(--ink);
  }

  .run-context {
    display: grid;
    justify-items: end;
    max-width: 15rem;
    color: var(--muted);
    font: 0.68rem/1.25 ui-monospace, monospace;
    text-transform: uppercase;
  }

  .run-context span {
    max-width: 15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .run-context strong {
    color: var(--accent);
  }

  .run-context strong.readonly {
    color: var(--warning);
  }

  @media (max-width: 60rem) {
    .shell-topbar {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .run-context {
      display: none;
    }
  }
</style>
