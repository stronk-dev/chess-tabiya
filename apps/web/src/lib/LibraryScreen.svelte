<script lang="ts">
  import { onDestroy, untrack } from "svelte";

  import type { DrillClientApi, DueSchedule, PackSummary } from "./api.js";
  import { routePath } from "./router.js";
  import {
    LIBRARY_KIND_COPY,
    LIBRARY_KINDS,
    LIBRARY_PHASE_COPY,
    LIBRARY_PHASES,
    disclosureCopy,
    type LibraryItem,
    type LibraryKind,
    type LibraryPhase,
    type LibrarySearchResult,
  } from "./theory-library.js";

  interface Props {
    api: DrillClientApi;
    dueSchedules?: readonly DueSchedule[];
    /** Titles for exact pack joins (concept membership); the catalogue itself comes from the server. */
    packs?: readonly PackSummary[];
    busy?: boolean;
    onNavigate: (path: string) => void;
    onRehearse: (packId: string) => void | Promise<void>;
    onStartDue?: ((schedule: DueSchedule) => void | Promise<void>) | undefined;
  }

  let { api, dueSchedules = [], packs = [], busy = false, onNavigate, onRehearse, onStartDue }: Props = $props();

  function packTitle(packId: string): string {
    return packs.find((pack) => pack.id === packId)?.title ?? packId;
  }

  let text = $state("");
  let phase: LibraryPhase | "all" = $state("all");
  let kind: LibraryKind | "all" = $state("all");
  let result: LibrarySearchResult | undefined = $state();
  let loading = $state(true);
  let error: string | undefined = $state();
  let openConcept: string | undefined = $state();
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const phaseTabs: readonly (LibraryPhase | "all")[] = Object.freeze(["all", ...LIBRARY_PHASES]);
  const kindTabs: readonly (LibraryKind | "all")[] = Object.freeze(["all", ...LIBRARY_KINDS]);

  async function load(query: { readonly text: string; readonly phase: LibraryPhase | "all"; readonly kind: LibraryKind | "all" }): Promise<void> {
    const current = ++generation;
    loading = true;
    error = undefined;
    try {
      if (api.librarySearch === undefined) throw new Error("unavailable");
      const next = await api.librarySearch({
        text: query.text,
        ...(query.phase === "all" ? {} : { phase: query.phase }),
        ...(query.kind === "all" ? {} : { kinds: [query.kind] }),
      });
      if (current !== generation) return;
      result = next;
    } catch {
      if (current === generation) error = "The library could not be searched. Your filters are unchanged; try again.";
    } finally {
      if (current === generation) loading = false;
    }
  }

  // Re-query when the phase, kind or (debounced) text changes. The server is the single reader of
  // every registry, so the client never re-derives the catalogue from content files.
  $effect(() => {
    const query = { text, phase, kind };
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => untrack(() => void load(query)), query.text === "" ? 0 : 180);
  });
  onDestroy(() => { if (timer !== undefined) clearTimeout(timer); generation += 1; });

  let grouped = $derived(LIBRARY_KINDS.map((section) => ({ kind: section, items: (result?.items ?? []).filter((item) => item.kind === section) })).filter((group) => group.items.length > 0));
  let officialPacks = $derived((result?.items ?? []).filter((item) => item.kind === "pack" && item.disclosure.channel === "official").length);
  let resultTotal = $derived(result === undefined ? 0 : LIBRARY_KINDS.reduce((sum, section) => sum + result!.totals[section].total, 0));

  function dueFor(packId: string): DueSchedule | undefined {
    return dueSchedules.find((schedule) => schedule.packId === packId);
  }

  function entryPath(item: LibraryItem): string | undefined {
    if (item.kind === "pack") return routePath({ name: "pack", packId: item.id });
    if (item.kind === "principle") return routePath({ name: "principle-entry", principleId: item.id });
    if (item.kind === "shape") return routePath({ name: "shape-entry", shapeId: item.id });
    if (item.kind === "opening") return routePath({ name: "opening-entry", positionKey: item.id });
    return undefined;
  }

  function phaseLabel(item: LibraryItem): string {
    if (item.phases.length === 0) return "Phase not recorded";
    if (item.phases.length === 3 && ["opening", "middlegame", "endgame"].every((value) => item.phases.includes(value as LibraryPhase))) return "Every phase";
    return item.phases.map((value) => LIBRARY_PHASE_COPY[value]).join(" · ");
  }

  function packCountCopy(count: number): string {
    return count === 0 ? "No pack rehearses this yet" : count === 1 ? "1 pack rehearses this" : `${count} packs rehearse this`;
  }

  function clear(): void { text = ""; phase = "all"; kind = "all"; }
</script>

<div id="library-catalogue" class="library-screen" tabindex="-1">
  <header>
    <p class="eyebrow">Library</p>
    <h1 id="library-title">Find it, understand it, rehearse it, come back to it.</h1>
    <p class="lede">Search packs, principles, shapes, concepts and named openings. Official material is listed first; community drafts say so.</p>
  </header>

  <section class="controls" aria-label="Search and filter the library">
    <div class="tabs" role="group" aria-label="Chess phase">
      {#each phaseTabs as item}
        <button type="button" class:active={phase === item} aria-pressed={phase === item} onclick={() => phase = item}>{LIBRARY_PHASE_COPY[item]}</button>
      {/each}
    </div>
    <label class="search">Search the library
      <input type="search" bind:value={text} maxlength="200" placeholder="Najdorf, rook ending, tempo, outpost…" />
    </label>
    <div class="tabs kinds" role="group" aria-label="Kind of material">
      {#each kindTabs as item}
        <button type="button" class:active={kind === item} aria-pressed={kind === item} onclick={() => kind = item}>{item === "all" ? "Everything" : LIBRARY_KIND_COPY[item]}</button>
      {/each}
    </div>
  </section>

  {#if error}
    <div class="notice"><p role="alert">{error}</p><button type="button" onclick={() => void load({ text, phase, kind })}>Try again</button></div>
  {:else if loading && result === undefined}
    <p role="status" aria-live="polite">Searching the library…</p>
  {:else if result !== undefined}
    <p class="count" role="status" aria-live="polite" aria-atomic="true">{loading ? "Searching…" : `${resultTotal} ${resultTotal === 1 ? "result" : "results"}`}</p>
    {#if grouped.length === 0}
      <div class="empty">
        <h2>Nothing in the library matches that.</h2>
        <p>Try another phase or fewer words. The library never substitutes a near match.</p>
        <button type="button" onclick={clear}>Clear search and filters</button>
      </div>
    {/if}
    {#each grouped as group}
      <section class="group" aria-labelledby={`library-${group.kind}`}>
        <div class="group-head">
          <h2 id={`library-${group.kind}`}>{LIBRARY_KIND_COPY[group.kind]}</h2>
          <p class="honest">{result.totals[group.kind].shown < result.totals[group.kind].total ? `Showing ${result.totals[group.kind].shown} of ${result.totals[group.kind].total}. Narrow the search to see the rest.` : `${result.totals[group.kind].total} found`}</p>
        </div>
        {#if group.kind === "pack" && officialPacks === 0}
          <p class="honest">No official pack has graduated yet. Every pack below is a community draft and is labelled as one.</p>
        {/if}
        {#if group.kind === "opening" && result.query.tokens.length === 0}
          <p class="honest">Search by name to browse the named-opening catalogue.</p>
        {/if}
        <ul class="items">
          {#each group.items as item (`${item.kind}:${item.id}`)}
            {@const path = entryPath(item)}
            <li class="item" data-kind={item.kind}>
              <div class="meta"><span class="origin" class:draft={item.disclosure.channel === "community"}>{disclosureCopy(item.disclosure)}</span><span>{phaseLabel(item)}</span></div>
              <h3>{#if path}<a href={path} onclick={(event) => { event.preventDefault(); onNavigate(path); }}>{item.title}</a>{:else}{item.title}{/if}</h3>
              {#if item.kind === "opening"}
                <p class="summary">ECO {item.summary}{item.positions !== undefined && item.positions > 1 ? ` · ${item.positions} catalogue positions share this name` : ""}</p>
              {:else if item.summary !== ""}
                <p class="summary">{item.summary}</p>
              {/if}
              <div class="actions">
                {#if item.kind === "pack"}
                  {@const due = dueFor(item.id)}
                  <button class="primary" type="button" disabled={busy} aria-label={`Rehearse: ${item.title}`} onclick={() => void onRehearse(item.id)}>Rehearse</button>
                  <a class="action" href={path} onclick={(event) => { event.preventDefault(); onNavigate(path!); }} aria-label={`Understand: ${item.title}`}>Understand</a>
                  {#if due && onStartDue}
                    <button type="button" disabled={busy} aria-label={`Start the due return: ${item.title}`} onclick={() => void onStartDue!(due)}>Return is due</button>
                  {:else}
                    <a class="action" href={`${path}#return`} onclick={(event) => { event.preventDefault(); onNavigate(`${path}#return`); }} aria-label={`Plan a return: ${item.title}`}>Return later</a>
                  {/if}
                {:else if item.kind === "concept"}
                  <button type="button" aria-expanded={openConcept === item.id} aria-controls={`concept-${item.id}`} onclick={() => openConcept = openConcept === item.id ? undefined : item.id}>{packCountCopy(item.packIds.length)}</button>
                {:else if item.kind === "opening"}
                  <a class="action" href={path} onclick={(event) => { event.preventDefault(); onNavigate(path!); }} aria-label={`Understand: ${item.title}`}>Understand</a>
                  <span class="honest">No pack is linked to this opening yet</span>
                {:else}
                  <a class="action" href={path} onclick={(event) => { event.preventDefault(); onNavigate(path!); }} aria-label={`Understand: ${item.title}`}>Understand</a>
                  <span class="honest">{packCountCopy(item.packIds.length)}</span>
                {/if}
              </div>
              {#if item.kind === "concept" && openConcept === item.id}
                <ul id={`concept-${item.id}`} class="concept-packs">
                  {#each item.packIds as packId}
                    <li><a href={routePath({ name: "pack", packId })} onclick={(event) => { event.preventDefault(); onNavigate(routePath({ name: "pack", packId })); }}>{packTitle(packId)}</a> <button type="button" disabled={busy} aria-label={`Rehearse: ${packTitle(packId)}`} onclick={() => void onRehearse(packId)}>Rehearse</button></li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</div>

<style>
  .library-screen { width: min(76rem, calc(100% - 2rem)); margin: 0 auto; padding: clamp(1.5rem, 5vw, 4rem) 0 2rem; }
  .library-screen:focus { outline: none; }
  header { max-width: 52rem; margin-bottom: 1.5rem; }
  .eyebrow, .meta, .count { font: 700 0.72rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .eyebrow { color: var(--accent); }
  h1 { max-width: 20ch; margin: 0.5rem 0 1rem; font: 500 clamp(2rem, 5vw, 4rem) / 1 var(--display-font); letter-spacing: -0.04em; }
  .lede { max-width: 42rem; color: var(--ink); }
  .controls { position: sticky; z-index: 2; top: 0; display: grid; gap: .7rem; margin-bottom: 1rem; padding: .9rem; border: 1px solid var(--line); border-radius: 1rem; background: color-mix(in srgb, var(--paper) 94%, transparent); backdrop-filter: blur(12px); }
  .tabs { display: flex; flex-wrap: wrap; gap: .4rem; }
  .tabs button { padding: .5rem .75rem; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--muted); font: inherit; cursor: pointer; }
  .tabs button.active { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }
  .kinds button { font-size: .85rem; }
  label.search { display: grid; gap: .3rem; color: var(--muted); font-size: .8rem; }
  input { min-height: 2.75rem; padding: .65rem .75rem; border: 1px solid var(--line); border-radius: .65rem; background: var(--paper); color: var(--ink); font: inherit; }
  .count { color: var(--muted); margin: 1rem 0; }
  .group { margin: 1.5rem 0 2rem; }
  .group-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: .5rem 1rem; border-bottom: 1px solid var(--line); margin-bottom: .75rem; }
  .group-head h2 { margin: 0 0 .4rem; font: 500 1.5rem/1.1 var(--display-font); }
  .honest { color: var(--muted); font-size: .9rem; margin: .25rem 0; }
  .items { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr)); gap: .8rem; }
  .item { display: flex; flex-direction: column; gap: .4rem; padding: 1rem 1.1rem; border: 1px solid var(--line); border-radius: 1rem; background: var(--panel); }
  .meta { display: flex; justify-content: space-between; gap: .75rem; color: var(--muted); font-size: .64rem; }
  .origin { color: var(--accent); }
  .origin.draft { color: var(--muted); }
  h3 { margin: .2rem 0; font: 500 1.2rem/1.2 var(--display-font); }
  h3 a { color: var(--ink); text-decoration: none; }
  h3 a:hover, h3 a:focus-visible { text-decoration: underline; }
  .summary { margin: 0; color: var(--ink); line-height: 1.45; }
  .actions { margin-top: auto; padding-top: .5rem; display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
  .actions button, .actions .action, .concept-packs button { padding: .5rem .8rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); font: inherit; font-size: .9rem; text-decoration: none; cursor: pointer; }
  .actions .primary { border-color: var(--ink); background: var(--ink); color: var(--paper); }
  .actions .primary:hover, .actions .primary:focus-visible { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .concept-packs { margin: .4rem 0 0; padding-left: 1rem; display: grid; gap: .35rem; }
  .empty, .notice { padding: 1.5rem; border: 1px dashed var(--line); border-radius: 1rem; }
  .empty button, .notice button { padding: .6rem .8rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); font: inherit; }
  @media (max-width: 40rem) { .tabs { flex-wrap: nowrap; overflow-x: auto; } .tabs button { white-space: nowrap; } }
</style>
