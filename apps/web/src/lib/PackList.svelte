<script lang="ts">
  import type { PackSummary } from "./api.js";
  import { difficultyBand } from "./screen-model.js";

  interface Props {
    packs: readonly PackSummary[];
    loading?: boolean;
    error?: string | undefined;
    onSelect: (packId: string) => void | Promise<void>;
  }

  let { packs, loading = false, error, onSelect }: Props = $props();
</script>

<main class="library" aria-labelledby="pack-list-title">
  <header>
    <p class="eyebrow">Tabiya / phase rehearsal</p>
    <h1 id="pack-list-title">Choose a position worth returning to.</h1>
    <p class="lede">
      Play the consequence, rewind the decision, and compare what changed.
    </p>
  </header>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
  {#if loading}
    <p class="loading" aria-live="polite">Loading rehearsal packs…</p>
  {:else}
    <section class="pack-grid" aria-label="Available packs">
      {#each packs as pack}
        <article class="pack-card">
          <div class="card-meta">
            <span>{pack.mode.replaceAll("_", " ")}</span>
            <span class="review-status">{pack.reviewStatus.replaceAll("_", " ")}</span>
          </div>
          <h2>{pack.title}</h2>
          <p class="difficulty">{difficultyBand(pack.difficulty)}</p>
          <button type="button" onclick={() => onSelect(pack.id)}>
            Open position <span aria-hidden="true">↗</span>
          </button>
        </article>
      {:else}
        <p>No packs are available.</p>
      {/each}
    </section>
  {/if}
</main>

<style>
  .library {
    width: min(70rem, calc(100% - 2rem));
    margin: 0 auto;
    padding: clamp(3rem, 9vw, 8rem) 0;
  }

  header {
    max-width: 50rem;
    margin-bottom: 3rem;
  }

  .eyebrow,
  .card-meta,
  .difficulty {
    font: 700 0.72rem/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .eyebrow {
    color: var(--accent);
  }

  h1 {
    max-width: 14ch;
    margin: 0.5rem 0 1rem;
    font: 500 clamp(2.6rem, 7vw, 6.2rem) / 0.94 var(--display-font);
    letter-spacing: -0.055em;
  }

  .lede {
    max-width: 35rem;
    color: var(--muted);
    font-size: 1.08rem;
  }

  .pack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
    gap: 1rem;
  }

  .pack-card {
    min-height: 17rem;
    display: flex;
    flex-direction: column;
    padding: 1.4rem;
    border: 1px solid var(--line);
    border-radius: 1.25rem;
    background: var(--panel);
    box-shadow: var(--shadow);
  }

  .card-meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--muted);
  }

  .review-status {
    color: var(--warning);
  }

  h2 {
    max-width: 22ch;
    margin: 2rem 0 0.6rem;
    font: 500 1.65rem/1.08 var(--display-font);
  }

  .difficulty {
    margin-top: auto;
    color: var(--muted);
  }

  button {
    width: 100%;
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    padding: 0.9rem 1rem;
    border: 0;
    border-radius: 0.75rem;
    background: var(--ink);
    color: var(--paper);
    font: inherit;
    cursor: pointer;
  }

  button:hover,
  button:focus-visible {
    background: var(--accent);
  }

  .error {
    color: var(--danger);
  }
</style>
