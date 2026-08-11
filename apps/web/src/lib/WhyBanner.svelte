<script lang="ts">
  import type { WhyBannerModel } from "./screen-model.js";

  interface Props {
    model?: WhyBannerModel | undefined;
  }

  let { model }: Props = $props();
</script>

{#if model}
  <aside class="why-banner" aria-live="polite" aria-label="Why the objective changed">
    <span class="state">{model.state}</span>
    <div>
      {#each model.sentences as sentence}
        <p><strong>{sentence.sourceLabel}</strong> · {sentence.text}</p>
      {/each}
    </div>
  </aside>
{/if}

<style>
  .why-banner {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    align-items: start;
    padding: 0.9rem 1rem;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line));
    border-radius: 0.9rem;
    background: color-mix(in srgb, var(--accent) 7%, var(--panel));
  }

  .state {
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    background: var(--accent);
    color: white;
    font: 700 0.68rem/1 ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  p {
    margin: 0 0 0.25rem;
    font-size: 0.88rem;
  }

  p:last-child {
    margin-bottom: 0;
  }
</style>
