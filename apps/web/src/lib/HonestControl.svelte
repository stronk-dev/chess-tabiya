<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    disabled: boolean;
    reasonId: string;
    reason: string;
    children: Snippet<[string | undefined]>;
  }

  let { disabled, reasonId, reason: reasonText, children }: Props = $props();
</script>

<span class="honest-control">
  {@render children(disabled ? reasonId : undefined)}
  {#if disabled}<span class="reason" id={reasonId}>{reasonText}</span>{/if}
</span>

<style>
  .honest-control { display: contents; }
  .reason {
    display: block;
    margin: .25rem 0;
    color: var(--muted);
    font-size: .72rem;
    line-height: 1.35;
  }
</style>
