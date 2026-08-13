<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import DrillScreen from "./lib/DrillScreen.svelte";
  import PackList from "./lib/PackList.svelte";
  import ShellFrame from "./lib/ShellFrame.svelte";
  import ShellKeyboardHelp from "./lib/ShellKeyboardHelp.svelte";
  import {
    DrillApi,
    PLANNED_SURFACES,
    type Capabilities,
    type DrillClientApi,
    type PackSummary,
    type RunSummary,
    type SurfaceId,
    type Learner,
    type ProgressAttempt,
    type ProgressSchedule,
  } from "./lib/api.js";
  import { HistoryRouter, routePath, type AppRoute } from "./lib/router.js";
  import { ShellKeyboardDispatcher } from "./lib/keyboard.js";
  import {
    DrillSessionController,
    type DrillSessionState,
  } from "./lib/session-controller.js";
  import { WriterSession, type KeyValueStorage } from "./lib/writer-session.js";

  interface Props {
    api?: DrillClientApi;
    router?: HistoryRouter;
    storage?: KeyValueStorage;
  }

  let {
    api: apiProp,
    router: routerProp,
    storage: storageProp,
  }: Props = $props();

  const api = untrack(
    () => apiProp ?? new DrillApi(import.meta.env.VITE_API_URL ?? ""),
  );
  const router = untrack(() => routerProp ?? new HistoryRouter());
  const storage = untrack(() => storageProp);

  const controller = new DrillSessionController(api, {
    ...(storage === undefined ? {} : { storage }),
    onRunStarted: ({ runId }) => router.navigate(routePath({ name: "run", runId })),
  });
  let route: AppRoute = $state(router.route);
  let session: DrillSessionState = $state(controller.state);
  let packs: readonly PackSummary[] = $state([]);
  let runs: readonly RunSummary[] = $state([]);
  let attempts: readonly ProgressAttempt[] = $state([]);
  let dueSchedules: readonly ProgressSchedule[] = $state([]);
  let capabilities: Capabilities | undefined = $state();
  let routeLoading = $state(true);
  let routeError: string | undefined = $state();
  let shellHelpOpen = $state(false);
  let learner: Learner | undefined = $state();
  let authLoading = $state(true);
  let authError: string | undefined = $state();
  let authHandle = $state("");
  let authPassword = $state("");
  let authRegister = $state(false);
  let routerStarted = false;
  const onUnauthenticated = (): void => {
    controller.stopSession();
    learner = undefined;
    router.stop();
    routerStarted = false;
  };
  let shellHelpReturnFocus: HTMLElement | undefined;
  let unsubscribeController: (() => void) | undefined;
  let unsubscribeRouter: (() => void) | undefined;
  let loadGeneration = 0;

  const keyboardDispatcher = new ShellKeyboardDispatcher({
    navigate,
    focusPrimaryNavigation,
    openHelp: openShellHelp,
    closeHelp: closeShellHelp,
    helpIsOpen: () => shellHelpOpen,
  });

  let recentRun = $derived(runs[0]);
  let runContext = $derived(
    route.name === "run" && session.pack && session.runState
      ? {
          title: session.pack.title as string,
          access: session.runState.access,
          busy: session.busy,
        }
      : undefined,
  );

  function navigate(path: string): void {
    if (shellHelpOpen) closeShellHelp();
    router.navigate(path);
  }

  function focusPrimaryNavigation(): void {
    document.querySelector<HTMLElement>("#primary-navigation a")?.focus();
  }

  function openShellHelp(): void {
    shellHelpReturnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    shellHelpOpen = true;
  }

  function closeShellHelp(): void {
    shellHelpOpen = false;
    const target = shellHelpReturnFocus;
    shellHelpReturnFocus = undefined;
    void tick().then(() => target?.focus());
  }

  function boardStance(run: RunSummary): "you" | "someone-else" | "unclaimed" {
    if (run.leaseHeldBy.handle === "__legacy") return "unclaimed";
    return run.leaseHeldBy.learnerId === learner?.id ? "you" : "someone-else";
  }

  function readableDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }

  async function loadRoute(next: AppRoute): Promise<void> {
    const generation = ++loadGeneration;
    routeLoading = true;
    routeError = undefined;
    if (
      next.name !== "run" ||
      session.runState?.run.id !== next.runId
    ) {
      controller.stopSession();
    }
    try {
      if (next.name === "home" || next.name === "review") {
        runs = await api.runs(50, 0);
      } else if (next.name === "play") {
        packs = await api.packs();
      } else if (next.name === "library") {
        [packs, runs] = await Promise.all([api.packs(), api.runs(50, 0)]);
      } else if (next.name === "settings") {
        capabilities = await api.capabilities();
      } else if (next.name === "learn") {
        [attempts, dueSchedules] = await Promise.all([
          api.progress?.() ?? Promise.resolve([]),
          api.dueProgress?.() ?? Promise.resolve([]),
        ]);
      } else if (
        next.name === "run" &&
        session.runState?.run.id !== next.runId
      ) {
        await controller.resume(next.runId);
      }
    } catch (error) {
      if (generation === loadGeneration) {
        routeError = error instanceof Error ? error.message : String(error);
      }
    } finally {
      if (generation === loadGeneration) routeLoading = false;
    }
  }

  function startRouter(): void {
    if (routerStarted) return;
    routerStarted = true;
    router.start();
  }

  async function authenticate(): Promise<void> {
    authError = undefined;
    try {
      const method = authRegister ? api.register : api.login;
      if (method === undefined) throw new Error("Authentication is not available");
      learner = authRegister
        ? await method.call(api, authHandle, authPassword)
        : await method.call(api, authHandle, authPassword);
      authPassword = "";
      startRouter();
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    }
  }

  async function signOut(): Promise<void> {
    await api.logout?.();
    controller.stopSession();
    learner = undefined;
    router.stop?.();
    routerStarted = false;
  }

  async function deleteAccount(): Promise<void> {
    const password = window.prompt("Re-enter your password. Runs are reassigned, not deleted.");
    if (password === null) return;
    await api.deleteAccount?.(password);
    controller.stopSession();
    learner = undefined;
    router.stop?.();
    routerStarted = false;
  }

  async function exportPgn(): Promise<void> {
    const download = await controller.exportPgn();
    const url = URL.createObjectURL(
      new Blob([download.text], { type: "text/x-chess-pgn;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = download.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  onMount(() => {
    window.addEventListener("tabiya:unauthenticated", onUnauthenticated);
    unsubscribeController = controller.subscribe((next) => (session = next));
    unsubscribeRouter = router.subscribe((next) => {
      route = next;
      void loadRoute(next);
    });
    void (async () => {
      try {
        learner = api.session === undefined
          ? { id: "learner-test", handle: "test", createdAt: new Date(0).toISOString() }
          : await api.session();
        startRouter();
      } catch {
        learner = undefined;
      } finally {
        authLoading = false;
      }
    })();
  });

  onDestroy(() => {
    window.removeEventListener("tabiya:unauthenticated", onUnauthenticated);
    unsubscribeController?.();
    unsubscribeRouter?.();
    controller.destroy();
    keyboardDispatcher.destroy();
    router.destroy();
  });
</script>

<svelte:window onkeydown={(event) => keyboardDispatcher.handle(event)} />

{#if authLoading}
  <main class="auth-gate" aria-busy="true"><p>Loading Tabiya…</p></main>
{:else if !learner}
  <main class="auth-gate" aria-labelledby="auth-title">
    <p class="eyebrow">Tabiya / hosted rehearsal</p>
    <h1 id="auth-title">{authRegister ? "Create your learner account." : "Return to your rehearsals."}</h1>
    <form onsubmit={(event) => { event.preventDefault(); void authenticate(); }}>
      <label>Handle <input autocomplete="username" bind:value={authHandle} required /></label>
      <label>Password <input type="password" autocomplete={authRegister ? "new-password" : "current-password"} bind:value={authPassword} minlength="10" maxlength="256" required /></label>
      <button class="primary" type="submit">{authRegister ? "Register" : "Sign in"}</button>
    </form>
    {#if authError}<p role="alert">{authError}</p>{/if}
    <button type="button" onclick={() => { authRegister = !authRegister; authError = undefined; }}>
      {authRegister ? "Use an existing account" : "Create an account"}
    </button>
    <p class="honest">There is no password recovery yet. Keep your password somewhere safe.</p>
  </main>
{:else}
<ShellFrame {route} {runContext} {learner} onNavigate={navigate} onSignOut={() => void signOut()} onDeleteAccount={() => void deleteAccount()}>
  {#if routeLoading}
    <main class="shell-view" aria-busy="true"><p>Loading Tabiya…</p></main>
  {:else if routeError}
    <main class="shell-view"><h1>Something interrupted the route.</h1><p role="alert">{routeError}</p></main>
  {:else if route.name === "home"}
    <main class="shell-view home" aria-labelledby="home-title">
      <p class="eyebrow">Tabiya / rehearsal workspace</p>
      <h1 id="home-title">Return to the decision, not the answer.</h1>
      {#if recentRun}
        <section class="resume-card" aria-labelledby="resume-title">
          <p class="eyebrow">Resume</p>
          <h2 id="resume-title">{recentRun.title}</h2>
          <p>{recentRun.branchCount} {recentRun.branchCount === 1 ? "branch" : "branches"} · {recentRun.objectiveState} · {readableDate(recentRun.updatedAt)}</p>
          <p class="access">
            {boardStance(recentRun) === "you" ? "You hold the board." : boardStance(recentRun) === "unclaimed" ? "No one holds the board." : `@${recentRun.leaseHeldBy.handle} holds the board.`}
            {recentRun.viewerRole === "spectator" ? " You can follow read-only." : " You may take the board."}
          </p>
          <button type="button" onclick={() => navigate(routePath({ name: "run", runId: recentRun.id }))}>Resume run</button>
        </section>
      {:else}
        <p>No previous run yet. Start with a rehearsal pack.</p>
      {/if}
      <button class="primary" type="button" onclick={() => navigate("/play")}>Go to Play</button>
    </main>
  {:else if route.name === "play"}
    <PackList
      {packs}
      loading={session.busy}
      error={session.error}
      onSelect={(packId) => controller.startPack(packId)}
    />
  {:else if route.name === "run"}
    {#if session.pack && session.runState}
      {#if session.runState.access === "read_only" && session.viewer?.mayWrite}
        <div class="claim-banner">
          <span>@{session.viewer.leaseHeldBy.handle} holds the board.</span>
          <button type="button" onclick={() => void controller.claimLease()}>Take the board on this device</button>
        </div>
      {/if}
      <DrillScreen
        pack={session.pack}
        snapshot={session.runState}
        checkpoint={session.checkpoint}
        authoredFeedback={session.authoredFeedback}
        comparison={session.comparison}
        comparisonBranchIds={session.comparisonBranchIds}
        busy={session.busy}
        error={session.error}
        onMove={(uci) => controller.move(uci)}
        onRewind={(target) => controller.rewind(target)}
        onFork={(label, intent) => controller.fork(label, intent)}
        onSwitchBranch={(nodeId) => controller.switchBranch(nodeId)}
        onCompare={(branchIds) => controller.compare(branchIds)}
        onCloseCompare={() => controller.closeCompare()}
        onContinueCheckpoint={() => controller.continueCheckpoint()}
        onExport={exportPgn}
        onStop={() => navigate("/play")}
        registerKeyboardRegion={keyboardDispatcher.registerRegion}
      />
    {:else}
      <main class="shell-view"><h1>Run unavailable.</h1><p role="alert">{session.error ?? "The run could not be loaded."}</p></main>
    {/if}
  {:else if route.name === "review"}
    <main class="shell-view" aria-labelledby="review-title">
      <p class="eyebrow">Review</p><h1 id="review-title">Run history</h1>
      <p>Open a run to replay, branch, compare, or export it. Standalone comparison is not part of this shell release.</p>
      <div class="item-list">
        {#each runs as run}
          <article>
            <div><h2>{run.title}</h2><p>{readableDate(run.updatedAt)} · {run.branchCount} {run.branchCount === 1 ? "branch" : "branches"} · {run.objectiveState}</p></div>
            <button type="button" onclick={() => navigate(routePath({ name: "run", runId: run.id }))}>Open run</button>
          </article>
        {:else}<p>No runs to review yet.</p>{/each}
      </div>
    </main>
  {:else if route.name === "learn"}
    <main class="shell-view" aria-labelledby="learn-title">
      <p class="eyebrow">Learn / return loop</p>
      <h1 id="learn-title">Return to the positions that need another attempt.</h1>
      <section aria-labelledby="due-title">
        <h2 id="due-title">Due now</h2>
        <div class="item-list">
          {#each dueSchedules as schedule}
            <article>
              <div>
                <h3>{schedule.packId ?? "Position rehearsal"}</h3>
                <p>{schedule.kind === "blocked" ? "Repeat the blocked attempt" : "Try a varied repetition"} · {readableDate(schedule.dueAt)}</p>
              </div>
              <div class="row-actions">
                {#if schedule.sourceRunId}<button type="button" onclick={() => navigate(routePath({ name: "run", runId: schedule.sourceRunId! }))}>Open source</button>{/if}
                <button type="button" onclick={async () => { await api.dismissSchedule?.(schedule.id); dueSchedules = dueSchedules.filter((item) => item.id !== schedule.id); }}>Dismiss</button>
              </div>
            </article>
          {:else}<p>Nothing is due yet. Played attempts create this queue.</p>{/each}
        </div>
      </section>
      <section aria-labelledby="recorded-title">
        <h2 id="recorded-title">What is recorded</h2>
        <div class="item-list">
          {#each attempts as attempt}
            <article>
              <div>
                <h3>{attempt.packId ?? "Position rehearsal"} · attempt {attempt.attemptNo || "—"}</h3>
                <p>{attempt.graded ? attempt.verdict : "not graded"} · {attempt.userPlyCount} learner plies · {readableDate(attempt.endedAt)}</p>
              </div>
              <button type="button" onclick={() => navigate(routePath({ name: "run", runId: attempt.runId }))}>Open run</button>
            </article>
          {:else}<p>No attempts recorded yet.</p>{/each}
        </div>
      </section>
      <p class="honest">This is an attempt history and return queue, not a mastery score.</p>
    </main>
  {:else if route.name === "live" || route.name === "create"}
    <main class="shell-view empty-state" aria-labelledby="empty-title">
      <p class="eyebrow">{route.name}</p>
      <h1 id="empty-title">
        {route.name === "live" ? "Rehearse with other people." : "Turn games into training."}
      </h1>
      <p>
        {route.name === "live"
            ? "Streamer, academy, spectator, and arena sessions arrive in program item 8."
            : "Pack authoring, imports, review, and session distillation arrive in program item 6."}
      </p>
      <p class="honest">This route reserves the application surface; it does not simulate functionality that is not implemented.</p>
    </main>
  {:else if route.name === "library"}
    <main class="shell-view" aria-labelledby="library-title">
      <p class="eyebrow">Library</p><h1 id="library-title">Packs and run artifacts</h1>
      <section><h2>Rehearsal packs</h2><ul>{#each packs as pack}<li>{pack.title} <small>{pack.reviewStatus.replaceAll("_", " ")}</small></li>{:else}<li>No packs available.</li>{/each}</ul></section>
      <section><h2>Runs with exportable PGN</h2><ul>{#each runs as run}<li><button class="link-button" type="button" onclick={() => navigate(routePath({ name: "run", runId: run.id }))}>{run.title}</button> <small>{run.branchCount} branches</small></li>{:else}<li>No run artifacts yet.</li>{/each}</ul></section>
    </main>
  {:else if route.name === "settings"}
    <main class="shell-view" aria-labelledby="settings-title">
      <p class="eyebrow">Settings</p><h1 id="settings-title">This deployment</h1>
      {#if capabilities}
        <dl class="providers">
          <div><dt>Opponent</dt><dd>{capabilities.providers.opponent}</dd></div>
          <div><dt>Judge</dt><dd>{capabilities.providers.judge}</dd></div>
          <div><dt>LLM</dt><dd>{capabilities.providers.llm}</dd></div>
        </dl>
        <h2>Surface availability</h2>
        <ul>{#each Object.entries(capabilities.surfaces) as [id, availability]}<li>{id}: {PLANNED_SURFACES.includes(id as SurfaceId) ? "planned" : availability}</li>{/each}</ul>
      {/if}
    </main>
  {:else if route.name === "not-found"}
    <main class="shell-view empty-state" aria-labelledby="not-found-title">
      <p class="eyebrow">404</p><h1 id="not-found-title">This route is not part of Tabiya.</h1>
      <p>{route.pathname}</p><button type="button" onclick={() => navigate("/")}>Return home</button>
    </main>
  {:else}
    <main class="shell-view"><p role="alert">The route could not be rendered.</p></main>
  {/if}
</ShellFrame>
{/if}

{#if shellHelpOpen}<ShellKeyboardHelp onClose={closeShellHelp} />{/if}

<style>
  :global(*) { box-sizing: border-box; }
  :global(:root) {
    color-scheme: light;
    --ink: #171713;
    --paper: #eeeade;
    --paper-soft: #e5e0d2;
    --panel: #f8f5ec;
    --muted: #6f6b61;
    --line: #cbc4b4;
    --accent: #3858c8;
    --warning: #df9d32;
    --danger: #ad3c32;
    --display-font: Iowan Old Style, Palatino Linotype, Book Antiqua, Palatino, Georgia, serif;
    --shadow: 0 0.8rem 2.5rem rgb(40 35 25 / 10%);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: var(--paper);
  }
  :global(html), :global(body), :global(#app) { height: 100%; overflow: hidden; }
  :global(body) {
    min-width: 20rem;
    min-height: 100vh;
    margin: 0;
    background: radial-gradient(circle at 12% 5%, rgb(255 255 255 / 65%), transparent 30rem), linear-gradient(135deg, transparent 0 58%, rgb(56 88 200 / 4%) 58% 100%), var(--paper);
  }
  :global(button), :global(input), :global(textarea) { font: inherit; }
  :global(:focus-visible) { outline: 3px solid color-mix(in srgb, var(--accent) 65%, white); outline-offset: 2px; }
  :global(::selection) { background: color-mix(in srgb, var(--accent) 25%, white); }
  .shell-view { width: min(70rem, calc(100% - 2rem)); height: 100%; margin: 0 auto; padding: clamp(2rem, 6vw, 5rem) 0; overflow: auto; }
  .auth-gate { width: min(32rem, calc(100% - 2rem)); margin: 10vh auto; }
  .auth-gate h1 { font: 500 clamp(2rem, 6vw, 4rem)/1 var(--display-font); }
  .auth-gate form { display: grid; gap: 1rem; margin: 2rem 0 1rem; }
  .auth-gate label { display: grid; gap: 0.35rem; }
  .auth-gate input { padding: 0.7rem; border: 1px solid var(--line); border-radius: 0.5rem; }
  .claim-banner { position: fixed; z-index: 20; top: 4rem; right: 1rem; display: flex; gap: 0.7rem; align-items: center; padding: 0.6rem; background: var(--panel); border: 1px solid var(--line); border-radius: 0.7rem; }
  .shell-view > h1 { max-width: 18ch; margin: 0.4rem 0 1rem; font: 500 clamp(2.3rem, 6vw, 5rem)/0.96 var(--display-font); letter-spacing: -0.045em; }
  .eyebrow { color: var(--accent); font: 700 0.72rem/1.2 ui-monospace, monospace; letter-spacing: 0.12em; text-transform: uppercase; }
  .home > h1 { max-width: 15ch; }
  .resume-card { max-width: 42rem; margin: 2.5rem 0 1rem; padding: 1.4rem; border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); box-shadow: var(--shadow); }
  .resume-card h2, .item-list h2 { margin: 0.2rem 0; font: 500 1.5rem var(--display-font); }
  .resume-card p, .item-list p { color: var(--muted); }
  .access, .honest { font-size: 0.88rem; }
  button { padding: 0.72rem 0.9rem; border: 1px solid var(--line); border-radius: 0.65rem; background: var(--panel); color: var(--ink); cursor: pointer; }
  button:hover, button:focus-visible, button.primary { border-color: var(--accent); background: var(--accent); color: white; }
  .item-list { display: grid; gap: 0.7rem; max-height: min(55dvh, 36rem); margin-top: 2rem; overflow: auto; }
  .item-list article { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .row-actions { display: flex; gap: 0.5rem; }
  .empty-state p { max-width: 42rem; color: var(--muted); font-size: 1.05rem; }
  section + section { margin-top: 2rem; }
  li { margin: 0.45rem 0; }
  small { color: var(--muted); }
  .link-button { padding: 0; border: 0; background: transparent; color: var(--accent); }
  .link-button:hover, .link-button:focus-visible { background: transparent; color: var(--ink); }
  .providers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; max-width: 42rem; }
  .providers div { padding: 1rem; border: 1px solid var(--line); border-radius: 0.8rem; background: var(--panel); }
  .providers dt { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; }
  .providers dd { margin: 0.3rem 0 0; font: 500 1.35rem var(--display-font); }
</style>
