<script lang="ts">
  import { untrack } from "svelte";

  import type { DrillClientApi, DueSchedule, RunSummary } from "./api.js";
  import { routePath, type AppRoute } from "./router.js";
  import {
    LIBRARY_PHASE_COPY,
    STANDS_ON_COPY,
    citationAttribution,
    disclosureCopy,
    type LibraryPackRef,
    type LibraryPhase,
    type OpeningEntryView,
    type PackEntryView,
    type PrincipleEntryView,
    type ShapeEntryLibraryView,
  } from "./theory-library.js";

  type EntryRoute = Extract<AppRoute, { readonly name: "pack" | "shape-entry" | "principle-entry" | "opening-entry" }>;
  type Loaded =
    | { readonly kind: "pack"; readonly view: PackEntryView }
    | { readonly kind: "principle"; readonly view: PrincipleEntryView }
    | { readonly kind: "shape"; readonly view: ShapeEntryLibraryView }
    | { readonly kind: "opening"; readonly view: OpeningEntryView };

  interface Props {
    api: DrillClientApi;
    route: EntryRoute;
    busy?: boolean;
    onNavigate: (path: string) => void;
    onRehearse: (packId: string) => void | Promise<void>;
    onStartDue?: ((schedule: DueSchedule) => void | Promise<void>) | undefined;
  }

  let { api, route, busy = false, onNavigate, onRehearse, onStartDue }: Props = $props();

  let loaded: Loaded | undefined = $state();
  let error: string | undefined = $state();
  let dueSchedules: readonly DueSchedule[] = $state([]);
  let packRuns: readonly RunSummary[] = $state([]);
  let returnState: "loading" | "ready" | "unavailable" = $state("loading");
  let generation = 0;

  async function load(target: EntryRoute): Promise<void> {
    const current = ++generation;
    loaded = undefined;
    error = undefined;
    returnState = "loading";
    try {
      let next: Loaded;
      if (target.name === "pack") {
        if (api.packEntry === undefined) throw new Error("unavailable");
        next = { kind: "pack", view: await api.packEntry(target.packId) };
      } else if (target.name === "principle-entry") {
        if (api.principleEntry === undefined) throw new Error("unavailable");
        next = { kind: "principle", view: await api.principleEntry(target.principleId) };
      } else if (target.name === "shape-entry") {
        if (api.shapeEntry === undefined) throw new Error("unavailable");
        next = { kind: "shape", view: await api.shapeEntry(target.shapeId) };
      } else {
        if (api.openingEntry === undefined) throw new Error("unavailable");
        next = { kind: "opening", view: await api.openingEntry(target.positionKey) };
      }
      if (current !== generation) return;
      loaded = next;
      if (next.kind === "pack") void loadReturn(next.view.pack.id, current);
    } catch {
      if (current === generation) error = "This library entry could not be loaded. It may have been withdrawn; return to the library and search again.";
    }
  }

  /** Return state for one pack: the learner's due schedules and preserved rehearsals of it. */
  async function loadReturn(packId: string, current: number): Promise<void> {
    try {
      const [due, page] = await Promise.all([
        api.dueProgress?.() ?? Promise.resolve({ schedules: [], waiting: 0, intakeLimit: 0 }),
        api.runPage?.(50, 0) ?? Promise.resolve({ runs: [], selection: { shown: 0, total: 0 } }),
      ]);
      if (current !== generation) return;
      dueSchedules = due.schedules.filter((schedule) => schedule.packId === packId);
      packRuns = page.runs.filter((run) => run.packId === packId && run.viewerRole === "host");
      returnState = "ready";
    } catch {
      if (current === generation) returnState = "unavailable";
    }
  }

  $effect(() => {
    const target = route;
    untrack(() => void load(target));
  });

  $effect(() => {
    if (loaded === undefined || typeof window === "undefined" || window.location.hash !== "#return") return;
    queueMicrotask(() => document.getElementById("return")?.scrollIntoView({ block: "start" }));
  });

  function go(path: string): (event: MouseEvent) => void {
    return (event) => { event.preventDefault(); onNavigate(path); };
  }

  function phaseList(values: readonly (LibraryPhase | string)[]): string {
    return values.map((value) => LIBRARY_PHASE_COPY[value as LibraryPhase] ?? value).join(" · ");
  }

  // One stable heading element: the shell focuses `main h1` after navigation, so the element must
  // survive the loading → loaded transition rather than being swapped out.
  let eyebrow = $derived(loaded === undefined ? "Library" : loaded.kind === "pack" ? `Rehearsal pack · ${loaded.view.pack.phase === null ? "Phase not recorded" : LIBRARY_PHASE_COPY[loaded.view.pack.phase]}` : loaded.kind === "principle" ? `Principle · ${phaseList(loaded.view.phases)}` : loaded.kind === "shape" ? `Shape · ${phaseList(loaded.view.phases)}` : "Named opening");
  let heading = $derived(error !== undefined ? "Library entry unavailable" : loaded === undefined ? "Loading library entry…" : loaded.kind === "pack" ? loaded.view.pack.title : loaded.kind === "principle" || loaded.kind === "shape" ? loaded.view.name : loaded.view.endpoint?.name ?? "Opening catalogue unavailable");

  function readableDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString(undefined, { dateStyle: "medium" });
  }
</script>

{#snippet packList(packs: readonly (LibraryPackRef & { readonly claimId?: string })[], empty: string)}
  {#if packs.length === 0}
    <p class="honest">{empty}</p>
  {:else}
    <ul class="packs">
      {#each packs as pack (pack.targetId)}
        <li>
          <div><span class="origin" class:draft={pack.disclosure.channel === "community"}>{disclosureCopy(pack.disclosure)}</span>{#if pack.phase}<span> · {LIBRARY_PHASE_COPY[pack.phase]}</span>{/if}</div>
          <a href={routePath({ name: "pack", packId: pack.packId })} onclick={go(routePath({ name: "pack", packId: pack.packId }))}>{pack.title}</a>
          <button class="primary" type="button" disabled={busy} aria-label={`Rehearse: ${pack.title}`} onclick={() => void onRehearse(pack.packId)}>Rehearse</button>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<div class="entry">
  <p class="crumb"><a href="/library" onclick={go("/library")}>← Library</a></p>
  <p class="eyebrow">{eyebrow}</p>
  <h1 id="entry-title">{heading}</h1>
  {#if error}
    <p role="alert">{error}</p>
  {:else if loaded === undefined}
    <p role="status">Loading this library entry…</p>
  {:else if loaded.kind === "pack"}
    {@const view = loaded.view}
    <p class="origin-line" class:draft={view.disclosure.channel === "community"}>{disclosureCopy(view.disclosure)}</p>
    <p class="lede">{view.pack.objectiveSummary}</p>
    {#if view.pack.difficultyLabel}<p class="honest">Recorded for: {view.pack.difficultyLabel}</p>{/if}
    <div class="row"><button class="primary" type="button" disabled={busy} onclick={() => void onRehearse(view.pack.id)}>Rehearse this pack</button></div>

    <section aria-labelledby="understand-title">
      <h2 id="understand-title">Understand</h2>
      <dl>
        <dt>Opening at the start</dt>
        <dd>{#if view.opening}<a href={routePath({ name: "opening-entry", positionKey: view.opening.positionKey })} onclick={go(routePath({ name: "opening-entry", positionKey: view.opening.positionKey }))}>{view.opening.eco} {view.opening.name}</a>{:else}The start position is not a named endpoint in the opening catalogue.{/if}</dd>
        <dt>Shapes</dt>
        <dd>{#if view.shapes.length === 0}No registered shape is named by this pack.{:else}<ul>{#each view.shapes as shape}<li><a href={routePath({ name: "shape-entry", shapeId: shape.id })} onclick={go(routePath({ name: "shape-entry", shapeId: shape.id }))}>{shape.name}</a>{#if shape.relation === "prospective"} <small>(may arise later; not present at the start)</small>{/if}</li>{/each}</ul>{/if}</dd>
        <dt>Principles its authored claims name</dt>
        <dd>{#if view.principles.length === 0}No authored claim in this pack names a registered principle.{:else}<ul>{#each view.principles as principle}<li><a href={routePath({ name: "principle-entry", principleId: principle.id })} onclick={go(routePath({ name: "principle-entry", principleId: principle.id }))}>{principle.name}</a></li>{/each}</ul>{/if}</dd>
        <dt>Concepts</dt>
        <dd>{#if view.concepts.length === 0}No concept is recorded.{:else}{view.concepts.map((concept) => concept.label).join(" · ")}{/if}</dd>
      </dl>
    </section>

    <section id="return" aria-labelledby="return-title">
      <h2 id="return-title">Return</h2>
      {#if returnState === "loading"}
        <p role="status">Loading your return queue…</p>
      {:else if returnState === "unavailable"}
        <p class="honest">Your return queue could not be loaded. Returns you scheduled are unchanged.</p>
      {:else if dueSchedules.length > 0}
        <ul class="packs">
          {#each dueSchedules as schedule (schedule.id)}
            <li><span>A {schedule.kind === "varied" ? "varied" : "repeat"} return is due {readableDate(schedule.dueAt)}.</span>{#if onStartDue}<button class="primary" type="button" disabled={busy} onclick={() => void onStartDue!(schedule)}>Start the due return</button>{/if}</li>
          {/each}
        </ul>
      {:else if packRuns.length > 0}
        <p>No return is scheduled for this pack. A return is planned from a finished rehearsal: open your latest one and choose <strong>Schedule a retry from here</strong>.</p>
        <div class="row"><button type="button" onclick={() => onNavigate(routePath({ name: "run", runId: packRuns[0]!.id }))}>Open your latest rehearsal of this pack</button></div>
      {:else}
        <p class="honest">You have not rehearsed this pack yet. When a rehearsal finishes, it offers <strong>Schedule a retry from here</strong>, and the return then appears here and in Learn.</p>
      {/if}
    </section>
  {:else if loaded.kind === "principle"}
    {@const view = loaded.view}
    <p class="origin-line">{disclosureCopy(view.disclosure)} · {view.licence}</p>
    <p class="lede">{view.statement}</p>
    <section aria-labelledby="counter-title"><h2 id="counter-title">Where it stops holding</h2><p>{view.counterCase}</p></section>
    <section aria-labelledby="basis-title">
      <h2 id="basis-title">What it stands on</h2>
      <p>{STANDS_ON_COPY[view.standsOn]}</p>
      {#each view.citations as citation (citation.sourceId + citation.quotedText)}
        <figure class="citation">
          <blockquote cite={citation.revisionUrl}>{citation.quotedText}</blockquote>
          <figcaption>{citationAttribution(citation)} <a href={citation.revisionUrl} rel="external noopener" target="_blank">Pinned revision</a> · <a href={citation.licence.url} rel="external noopener license" target="_blank">Licence</a> · {citation.sectionRef}{citation.proof === "source_unavailable" ? " · Pinned bytes not present on this server; digest recorded." : ""}</figcaption>
        </figure>
      {/each}
      {#each view.sourceNotes as note}<p class="honest">{note}</p>{/each}
    </section>
    <section aria-labelledby="rehearse-title">
      <h2 id="rehearse-title">Rehearse it</h2>
      <p class="honest">These packs contain an authored claim that names this principle.</p>
      {@render packList(view.anchoredPacks, "No pack's authored claims name this principle yet.")}
    </section>
  {:else if loaded.kind === "shape"}
    {@const view = loaded.view}
    <p class="origin-line">{disclosureCopy(view.disclosure)} · {view.licence}</p>
    {#if view.plans.length > 0}
      <section aria-labelledby="plans-title"><h2 id="plans-title">Plans</h2>
        <ul class="plain">{#each view.plans as plan (plan.id)}<li><strong>{plan.label}</strong> <small>({plan.side})</small><p>{plan.description}</p></li>{/each}</ul>
      </section>
    {/if}
    {#if view.watch.length > 0}<section aria-labelledby="watch-title"><h2 id="watch-title">Watch for</h2><ul class="plain">{#each view.watch as item}<li>{item}</li>{/each}</ul></section>{/if}
    {#if view.typicalMistakes.length > 0}<section aria-labelledby="mistakes-title"><h2 id="mistakes-title">Typical mistakes</h2><ul class="plain">{#each view.typicalMistakes as item}<li>{item}</li>{/each}</ul></section>{/if}
    <section aria-labelledby="rehearse-title">
      <h2 id="rehearse-title">Rehearse it</h2>
      {@render packList(view.packs, "No pack rehearses this shape yet.")}
    </section>
    {#if view.sourceNotes.length > 0}<section aria-labelledby="sources-title"><h2 id="sources-title">Sources</h2>{#each view.sourceNotes as note}<p class="honest">{note}</p>{/each}</section>{/if}
  {:else}
    {@const view = loaded.view}
    {#if view.endpoint}
      <p class="origin-line">{disclosureCopy(view.disclosure)}</p>
      <p class="lede">ECO {view.endpoint.eco} · named after {view.endpoint.sourcePly} {view.endpoint.sourcePly === 1 ? "ply" : "plies"} in the catalogue{view.samePositions.length > 0 ? ` · ${view.samePositions.length + 1} catalogue positions share this name` : ""}.</p>
      {#if view.source}<p class="honest">Source: <a href={view.source.url} rel="external noopener" target="_blank">{view.source.name} at {view.source.commit.slice(0, 7)}</a> ({view.source.licence}).</p>{/if}
    {:else}
      <p class="honest">The opening catalogue is not installed on this server, so this position cannot be named.</p>
    {/if}
    <section aria-labelledby="rehearse-title">
      <h2 id="rehearse-title">Rehearse it</h2>
      {@render packList(view.packs, "No pack is linked to this opening yet. Search the library by name for packs that rehearse its ideas.")}
    </section>
  {/if}
</div>

<style>
  .entry { width: min(52rem, calc(100% - 2rem)); margin: 0 auto; padding: clamp(1.25rem, 4vw, 3rem) 0 3rem; }
  .crumb a { color: var(--muted); text-decoration: none; }
  .eyebrow { color: var(--accent); font: 700 0.72rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { margin: .4rem 0 .6rem; font: 500 clamp(1.9rem, 4.5vw, 3.2rem) / 1.05 var(--display-font); letter-spacing: -0.03em; }
  h2 { margin: 1.8rem 0 .6rem; font: 500 1.35rem/1.15 var(--display-font); }
  .origin-line { color: var(--accent); font-size: .9rem; }
  .origin-line.draft, .origin.draft { color: var(--muted); }
  .origin { color: var(--accent); font-size: .8rem; }
  .lede { font-size: 1.1rem; line-height: 1.5; }
  .honest { color: var(--muted); }
  .row { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0; }
  button { padding: .6rem .9rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
  button.primary { border-color: var(--ink); background: var(--ink); color: var(--paper); }
  button.primary:hover, button.primary:focus-visible { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  dl { display: grid; grid-template-columns: minmax(9rem, auto) 1fr; gap: .6rem 1rem; }
  dt { color: var(--muted); }
  dd { margin: 0; }
  dd ul, .plain { margin: 0; padding-left: 1.1rem; }
  .plain li { margin: .35rem 0; }
  .plain p { margin: .2rem 0 0; }
  .packs { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; }
  .packs li { display: grid; grid-template-columns: 1fr auto; gap: .25rem 1rem; align-items: center; padding: .8rem 1rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); }
  .packs li > div { grid-column: 1 / -1; font-size: .8rem; color: var(--muted); }
  .packs a { color: var(--ink); }
  .citation { margin: 1rem 0; padding: .9rem 1rem; border-left: 3px solid var(--accent); background: var(--panel); }
  blockquote { margin: 0 0 .5rem; font-style: italic; }
  figcaption { color: var(--muted); font-size: .85rem; }
  @media (max-width: 40rem) { dl { grid-template-columns: 1fr; } .packs li { grid-template-columns: 1fr; } }
</style>
