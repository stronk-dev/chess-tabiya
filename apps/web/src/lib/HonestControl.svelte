<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    disabled: boolean;
    reasonId: string;
    reason: string;
    children: Snippet<[string | undefined]>;
  }

  let { disabled, reasonId, reason, children }: Props = $props();
</script>

<span class="honest-control">
  {@render children(disabled ? reasonId : undefined)}
  {#if disabled}<span class="reason" id={reasonId}>{reason}</span>{/if}
</span>

<style>
  .honest-control { display: contents; }
  .reason {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
