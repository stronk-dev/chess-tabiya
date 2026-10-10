<script lang="ts">
  // Existing campaign-core §2.2: one persisted gesture spends one earned rewind.
  // This is contextual UI, never chess evidence or an additional spend authority.
  let { campaignEncounter = false, id, action = "Rewinding" }: {
    campaignEncounter?: boolean;
    id: string;
    action?: string;
  } = $props();
</script>

{#if campaignEncounter}
  <p {id} data-campaign-gesture-cost>{action} uses one earned rewind. Inspecting and comparing saved lines are free.</p>
{/if}

<style>
  p { font-size: .85rem; margin: .4rem 0; overflow-wrap: anywhere; }
</style>
