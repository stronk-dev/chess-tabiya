<script lang="ts" generics="T">
  import { untrack, type Snippet } from "svelte";

  interface Props {
    label: string;
    load: () => Promise<T>;
    children: Snippet<[T]>;
    onReady?: () => void;
    reload?: () => void;
  }

  let { label, load, children, onReady, reload = () => window.location.reload() }: Props = $props();
  // One module request per mounted boundary. Changing screen data or a callback
  // must not restart delivery or remount a screen with unsaved local state.
  const request = untrack(() => load());
  let readyMarker: HTMLSpanElement | undefined = $state();
  $effect(() => {
    if (readyMarker !== undefined) untrack(() => onReady?.());
  });
</script>

{#await request}
  <section class="screen-delivery" aria-label={label} aria-busy="true">
    <p role="status" aria-live="polite" aria-atomic="true">Loading {label}…</p>
  </section>
{:then screen}
  <span hidden bind:this={readyMarker}></span>
  {@render children(screen)}
{:catch}
  <section class="screen-delivery" aria-label={label}>
    <p role="alert">{label} could not load. Reload this page to try again. Your saved work is unchanged.</p>
    <!-- Reload also reacquires current chunk URLs after a deployment; retrying
         an obsolete module URL alone cannot recover a removed asset. -->
    <button type="button" onclick={reload}>Reload page</button>
  </section>
{/await}

<style>
  .screen-delivery {
    min-width: 0;
    padding: 1rem;
  }
</style>
