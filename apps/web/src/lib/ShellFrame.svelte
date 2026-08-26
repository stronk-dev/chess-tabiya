<script lang="ts">
  import type { Snippet } from "svelte";

  import type { AppRoute } from "./router.js";
  import type { Learner } from "./api.js";

  interface RunContext {
    readonly title: string;
    readonly access: "writer" | "read_only";
    readonly busy: boolean;
  }

  interface Props {
    route: AppRoute;
    runContext?: RunContext | undefined;
    onNavigate: (path: string) => void;
    learner?: Learner;
    onSignOut?: () => void;
    chrome?: boolean;
    children: Snippet;
  }

  let { route, runContext, onNavigate, learner, onSignOut, chrome = true, children }: Props = $props();

  const destinations = [
    ["Home", "/", "home"],
    ["Play", "/play", "play"],
    ["Learn", "/learn", "learn"],
    ["Review", "/review", "review"],
    ["Rating", "/rating", "rating"],
    ["Live", "/live", "live"],
    ["Create", "/create", "create"],
    ["Library", "/library", "library"],
    ["Settings", "/settings", "settings"],
  ] as const;

  function active(name: string): boolean {
    return route.name === name || (name === "play" && route.name === "run") || (name === "review" && route.name === "story") || (name === "live" && (route.name === "live-session" || route.name === "live-overlay"));
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
  {#if chrome}
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="shell-topbar">
    <a class="wordmark" href="/" onclick={(event) => follow(event, "/")}>Tabiya</a>
    <nav id="primary-navigation" aria-label="Primary navigation">
      {#each destinations as [label, path, name]}
        <a
          href={path}
          aria-current={active(name) ? "page" : undefined}
          onclick={(event) => follow(event, path)}>{label}</a
        >
      {/each}
    </nav>
    <div class="run-context visually-hidden-below-rail" aria-live="polite">
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
    {#if learner}
      <div class="identity-control">
        <strong>@{learner.handle}</strong>
        <button type="button" onclick={onSignOut}>Sign out</button>
      </div>
    {/if}
  </header>
  {/if}
  <div id="main-content" class="shell-content" tabindex="-1">{@render children()}</div>
</div>

<style>
  .shell {
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  .shell:has(> .shell-content:only-child) { grid-template-rows: minmax(0, 1fr); }

  .skip-link {
    position: fixed;
    z-index: 50;
    top: 0.35rem;
    left: 0.35rem;
    padding: 0.6rem 0.8rem;
    border-radius: 0.5rem;
    background: var(--ink);
    color: var(--paper);
    transform: translateY(-150%);
  }

  .skip-link:focus { transform: translateY(0); }

  .shell-topbar {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 1rem;
    min-height: 3.5rem;
    padding: 0.55rem clamp(0.75rem, 2vw, 1.5rem);
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--paper) 94%, var(--on-accent));
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
    color: var(--ink);
  }

  .identity-control { display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; }
  .identity-control button { padding: 0.35rem 0.5rem; font-size: 0.68rem; }

  .shell-content {
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 60rem) {
    .shell-topbar {
      grid-template-columns: auto minmax(0, 1fr);
    }

  }

  @media (max-width: 719px) {
    .shell-topbar { grid-template-columns: auto minmax(0, 1fr); align-items: start; }
    nav { grid-column: 1 / -1; order: 3; width: 100%; }
    .identity-control { justify-self: end; }
  }
</style>
