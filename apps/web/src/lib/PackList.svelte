<script lang="ts">
  import type { PackSummary } from "./api.js";
  import {
    filterPacks,
    packDifficultyCopy,
    packModeCopy,
    type PackBandFilter,
    type PackPhaseFilter,
    type PackSort,
  } from "./pack-catalog.js";

  interface Props {
    packs: readonly PackSummary[];
    loading?: boolean;
    error?: string | undefined;
    learnerBand?: number | undefined;
    onSelect: (packId: string) => void | Promise<void>;
  }

  let { packs, loading = false, error, learnerBand, onSelect }: Props = $props();
  let phase: PackPhaseFilter = $state("all");
  let band: PackBandFilter = $state("all");
  let search = $state("");
  let sort: PackSort = $state("recommended");
  let visible = $derived(filterPacks(packs, { phase, band, search, sort }));

  const phases: readonly { readonly id: PackPhaseFilter; readonly label: string }[] = Object.freeze([
    { id: "all", label: "All positions" },
    { id: "opening", label: "Openings" },
    { id: "middlegame", label: "Middlegames" },
    { id: "endgame", label: "Endgames" },
    { id: "cross_phase", label: "Trajectories" },
  ]);
</script>

<main id="position-catalogue" class="library" aria-labelledby="pack-list-title" tabindex="-1">
  <header>
    <p class="eyebrow">Rehearsal library</p>
    <h1 id="pack-list-title">Choose the game you want to understand.</h1>
    <p class="lede">Pick a phase, play the consequence, then rewind the decision and try it another way.</p>
  </header>

  <section class="catalogue-controls" aria-label="Filter rehearsal packs">
    <div class="phase-tabs" role="group" aria-label="Chess phase">
      {#each phases as item}
        <button type="button" class:active={phase === item.id} aria-pressed={phase === item.id} onclick={() => phase = item.id}>{item.label}</button>
      {/each}
    </div>
    <label class="search">Search
      <input type="search" bind:value={search} placeholder="Najdorf, Carlsbad, passed pawn…" />
    </label>
    <label>Difficulty
      <select bind:value={band}>
        <option value="all">Every recorded band</option>
        <option value="1000-1400">Online rapid 1000–1400</option>
        <option value="1400-2000">Online rapid 1400–2000</option>
        <option value="2000+">Online rapid 2000+</option>
      </select>
    </label>
    <label>Order
      <select bind:value={sort}>
        <option value="recommended">Curated order</option>
        <option value="title">Title</option>
        <option value="difficulty">Difficulty</option>
      </select>
    </label>
  </section>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if loading}
    <p class="loading" role="status" aria-live="polite" aria-atomic="true">Loading rehearsal packs…</p>
  {:else}
    <p class="result-count" role="status" aria-live="polite" aria-atomic="true">{visible.length} {visible.length === 1 ? "position" : "positions"}</p>
    <section class="pack-grid" aria-label="Available packs">
      {#each visible as pack}
        <article class="pack-card">
          <div class="card-meta">
            <span>{packModeCopy(pack.mode)}</span>
            <span class="phase">{pack.phase?.replaceAll("_", " ") ?? "phase not recorded"}</span>
          </div>
          <h2>{pack.title}</h2>
          <p class="objective">{pack.objectiveSummary}</p>
          <p class="difficulty">{packDifficultyCopy(pack, learnerBand)}</p>
          <button class="open-pack" type="button" aria-label={`Rehearse this position: ${pack.title}`} onclick={() => onSelect(pack.id)}>Rehearse this position <span aria-hidden="true">→</span></button>
          <p class="provenance">{pack.channel === "official" ? "Official" : "Community"}{pack.publisherHandle ? ` · @${pack.publisherHandle}` : ""} · {pack.reviewStatus.replaceAll("_", " ")}</p>
        </article>
      {:else}
        <div class="empty">
          <h2>No positions match those filters.</h2>
          <p>Try another phase, widen the difficulty band, or clear the search.</p>
          <button type="button" onclick={() => { phase = "all"; band = "all"; search = ""; }}>Clear filters</button>
        </div>
      {/each}
    </section>
  {/if}
</main>

<style>
  .library { width: min(76rem, calc(100% - 2rem)); height: 100%; margin: 0 auto; padding: clamp(2rem, 6vw, 5rem) 0; overflow: auto; }
  header { max-width: 52rem; margin-bottom: 2rem; }
  .eyebrow, .card-meta, .difficulty, .provenance, .result-count { font: 700 0.72rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .eyebrow { color: var(--accent); }
  h1 { max-width: 16ch; margin: 0.5rem 0 1rem; font: 500 clamp(2.4rem, 6vw, 5.4rem) / 0.96 var(--display-font); letter-spacing: -0.05em; }
  .lede { max-width: 40rem; color: var(--ink); font-size: 1.08rem; }
  .catalogue-controls { position: sticky; z-index: 2; top: 0; display: grid; grid-template-columns: minmax(16rem, 1fr) auto auto; gap: .75rem; align-items: end; margin-bottom: 1rem; padding: .9rem; border: 1px solid var(--line); border-radius: 1rem; background: color-mix(in srgb, var(--paper) 94%, transparent); backdrop-filter: blur(12px); }
  .phase-tabs { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: .4rem; }
  .phase-tabs button { padding: .55rem .75rem; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--muted); }
  .phase-tabs button.active { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }
  label { display: grid; gap: .3rem; color: var(--muted); font-size: .75rem; }
  input, select { min-height: 2.75rem; padding: .65rem .75rem; border: 1px solid var(--line); border-radius: .65rem; background: var(--paper); color: var(--ink); font: inherit; }
  .result-count { margin: 1rem 0; color: var(--muted); }
  .pack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); gap: 1rem; }
  .pack-card { min-height: 23rem; display: flex; flex-direction: column; padding: 1.4rem; border: 1px solid var(--line); border-radius: 1.25rem; background: var(--panel); box-shadow: var(--shadow); }
  .card-meta { display: flex; justify-content: space-between; gap: 1rem; color: var(--muted); }
  .card-meta span:first-child { max-width: 22ch; color: var(--accent); }
  h2 { max-width: 24ch; margin: 1.5rem 0 .65rem; font: 500 1.65rem/1.08 var(--display-font); }
  .objective { margin: 0; color: var(--ink); line-height: 1.45; }
  .difficulty { margin-top: auto; padding-top: 1rem; color: var(--muted); }
  button { font: inherit; cursor: pointer; }
  .open-pack { width: 100%; margin-top: .75rem; display: flex; justify-content: space-between; padding: .9rem 1rem; border: 0; border-radius: .75rem; background: var(--ink); color: var(--paper); }
  .open-pack:hover, .open-pack:focus-visible { background: var(--accent); color: var(--on-accent); }
  .provenance { margin: .75rem 0 0; color: var(--muted); font-size: .62rem; }
  .empty { grid-column: 1 / -1; padding: 2rem; border: 1px dashed var(--line); border-radius: 1rem; text-align: center; }
  .empty h2 { margin-inline: auto; }
  .empty button { padding: .65rem .8rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); }
  .error { color: var(--ink); }
  @media (max-width: 50rem) { .catalogue-controls { grid-template-columns: 1fr; } .phase-tabs { grid-column: 1; overflow-x: auto; flex-wrap: nowrap; } .phase-tabs button { white-space: nowrap; } }
</style>
