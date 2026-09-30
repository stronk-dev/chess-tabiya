<script lang="ts">
  import { LIVE_PREAMBLE_ORDER, LIVE_PREAMBLE_QUESTIONS, livePreamble } from "./live-preamble.js";
  import type { LiveWorkflow } from "./live-creation.js";

  interface Props { workflow: LiveWorkflow; id: string; }
  let { workflow, id }: Props = $props();
  const preamble = $derived(livePreamble(workflow));
</script>

{#if preamble}
  <dl class="live-preamble" {id} data-live-preamble={workflow}>
    {#each LIVE_PREAMBLE_ORDER as key (key)}
      <div data-preamble-answer={key}><dt>{LIVE_PREAMBLE_QUESTIONS[key]}</dt><dd>{preamble[key]}</dd></div>
    {/each}
  </dl>
{/if}

<style>
  .live-preamble{flex:1 1 100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:.5rem .9rem;margin:.5rem 0 1rem;padding:.75rem .9rem;border:1px solid var(--line);border-radius:.7rem;background:var(--panel);max-width:60rem}
  .live-preamble div{min-width:0}
  .live-preamble dt{font-weight:700;font-size:.85rem}
  .live-preamble dd{margin:.15rem 0 0;overflow-wrap:anywhere}
</style>
