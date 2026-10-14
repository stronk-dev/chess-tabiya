<script lang="ts">
  // Navigation chrome shared by filled and honestly empty help. The run controller, not this
  // presentation component, owns target admission, persistence, charging and stale-action refusal.
  import CampaignGestureCost from "./CampaignGestureCost.svelte";
  import { learnerProse } from "./labels/index.js";
  import type { ModuleSeatAction } from "./module-seats.js";
  import type { Snippet } from "svelte";

  let { action, id, campaignEncounter = false, empty = false, before }: {
    action: ModuleSeatAction;
    id: string;
    campaignEncounter?: boolean;
    empty?: boolean;
    before?: Snippet | undefined;
  } = $props();
</script>

{#if !empty}<p>{action.description}</p>{/if}
<CampaignGestureCost {campaignEncounter} id={`${id}-rewind-cost`} />
<div class="seat-actions">
  {#if before !== undefined}{@render before()}{/if}
  <button type="button" class="primary" data-rehearsal-action data-empty-rewind={empty ? "" : undefined}
    disabled={action.pending || action.blockedReason !== undefined}
    aria-describedby={[campaignEncounter ? `${id}-rewind-cost` : "", action.pending || action.blockedReason !== undefined ? `${id}-action-status` : action.error !== undefined ? `${id}-action-error` : ""].filter(Boolean).join(" ") || undefined}
    onclick={action.onInvoke}>{action.pending ? action.pendingLabel : action.label}</button>
</div>
{#if empty}<p>{action.description}</p>{/if}
{#if action.pending}<p id={`${id}-action-status`} role="status">{action.pendingLabel} Your recorded lines are kept.</p>
{:else if action.blockedReason !== undefined}<p id={`${id}-action-status`} class="door-reason">{learnerProse(action.blockedReason)}</p>{/if}
{#if action.error !== undefined}<p id={`${id}-action-error`} role="alert">{action.error}</p>{/if}

<style>
  .seat-actions { display:flex; flex-wrap:wrap; gap:.4rem; }
  .door-reason { color:var(--muted); }
</style>
