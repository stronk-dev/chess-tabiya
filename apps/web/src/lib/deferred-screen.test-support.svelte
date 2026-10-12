<script lang="ts">
  import DeferredScreen from "./DeferredScreen.svelte";

  let { load, label = "Library", detail = "current", reload, onReady }: {
    load: () => Promise<{ title: string }>;
    label?: string;
    detail?: string;
    reload?: () => void;
    onReady?: () => void;
  } = $props();
  export function rename(next: string): void { label = next; }
</script>

<DeferredScreen {load} {label} {...reload === undefined ? {} : { reload }} {...onReady === undefined ? {} : { onReady }}>
  {#snippet children(screen)}
    <h1>{screen.title}</h1><input aria-label="Local draft" value={detail} />
  {/snippet}
</DeferredScreen>
