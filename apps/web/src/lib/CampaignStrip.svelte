<script lang="ts">
  import { ApiError } from "./api.js";
  import {
    CAMPAIGN_MODULE_LABELS,
    CampaignApi,
    newCampaignCommandId,
    rewardText,
    type CampaignProjection,
    type CampaignRunReward,
    type CampaignVerdict,
  } from "./campaign-api.js";

  // rfc/campaign-core.md §7.1 "In-run context": the campaign rail seat beside the board. It renders
  // the node title, `⟲ N` BEFORE any spend (criterion 4), the effective kit and "Declare done". It
  // never inserts content between the board and its controls and never resizes the board.

  interface Props {
    campaigns: CampaignApi;
    origin: { readonly campaignRunId: string; readonly nodeId: string };
    runId: string;
    branchId: string;
    /** Bumps whenever the play run changes, so a settled charge re-reads the balance. */
    runRevision: number;
    onNavigate: (path: string) => void;
    /** Publishes the campaign revision the charged gestures must carry (null when not active). */
    onRevision: (state: { readonly campaignRevision: number; readonly active: boolean } | null) => void;
  }
  let { campaigns, origin, runId, branchId, runRevision, onNavigate, onRevision }: Props = $props();

  let campaign: CampaignProjection | undefined = $state();
  let error: string | undefined = $state();
  let busy = $state(false);
  let sealed: { readonly verdict: string; readonly reward: CampaignRunReward | null; readonly completed: boolean } | undefined = $state();
  let submitCommand: string | undefined;
  let generation = 0;

  let active = $derived(campaign?.activeEncounter?.playRunId === runId);
  let nodeTitle = $derived(campaign?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((card) => card.nodeId === origin.nodeId)?.title ?? origin.nodeId);
  let suppressed = $derived(campaign?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((card) => card.nodeId === origin.nodeId)?.suppress ?? []);

  $effect(() => {
    void runRevision;
    void origin.campaignRunId;
    void refresh();
  });

  async function refresh(): Promise<void> {
    const current = ++generation;
    try {
      const next = await campaigns.read(origin.campaignRunId);
      if (current !== generation) return;
      campaign = next;
      onRevision(next.activeEncounter?.playRunId === runId ? { campaignRevision: next.campaignRun.revision, active: true } : null);
    } catch (caught) {
      if (current === generation) error = caught instanceof ApiError ? caught.message : "Campaign state could not be loaded.";
    }
  }

  function verdictCopy(response: Readonly<Record<string, unknown>>): string {
    if (response.kind === "boss_game") return response.outcome === "win" ? "Game won" : response.outcome === "loss" ? "Game lost" : "Game drawn";
    const verdict = response.verdict as CampaignVerdict;
    return verdict === "achieved" ? "Objective reached" : verdict === "failed" ? "Objective not reached" : verdict === "transitioned" ? "Objective transitioned" : "Played to the authored boundary";
  }

  export function declareError(): string | undefined {
    return error;
  }

  export async function declareDone(): Promise<boolean> {
    if (campaign === undefined) return false;
    busy = true;
    error = undefined;
    submitCommand ??= newCampaignCommandId();
    try {
      const done = await campaigns.submit(origin.campaignRunId, origin.nodeId, { runId, branchId, expectedRevision: campaign.campaignRun.revision, commandId: submitCommand });
      submitCommand = undefined;
      const response = done.result.response ?? {};
      sealed = { verdict: verdictCopy(response), reward: (response.reward ?? null) as CampaignRunReward | null, completed: response.terminal === "completed" || response.campaignTerminal === "completed" };
      campaign = done.campaign;
      onRevision(null);
      return true;
    } catch (caught) {
      error = caught instanceof ApiError ? caught.message : "The encounter could not be declared done. Try again.";
      if (caught instanceof ApiError && caught.code === "CAMPAIGN_REVISION_STALE") { submitCommand = undefined; await refresh(); }
    } finally {
      busy = false;
    }
    return false;
  }
</script>

<aside class="session-banner campaign-strip" aria-label="Campaign encounter">
  {#if sealed}
    <div class="node-result" role="status">
      <strong>{nodeTitle}: {sealed.verdict}</strong>
      <span>{sealed.reward === null ? "No reward on this node." : `${rewardText(sealed.reward)} — now in your campaign kit for later encounters.`}</span>
      {#if sealed.completed}<span>The campaign run is complete.</span>{/if}
    </div>
    <div class="row-actions">
      <button type="button" onclick={() => onNavigate(`/campaign/${encodeURIComponent(origin.campaignRunId)}`)}>{sealed.completed ? "See the run result" : "Continue to the map"}</button>
    </div>
  {:else if campaign}
    <strong>Campaign · {nodeTitle}</strong>
    <span class="charges" data-testid="campaign-strip-charges" aria-label={`Earned rewinds: ${campaign.charges.balance} remaining this campaign`}><span aria-hidden="true">⟲ {campaign.charges.balance}</span> Earned rewinds: {campaign.charges.balance} remaining this campaign</span>
    {#if active}
      <span class="kit">Kit: {campaign.kit.equipped.filter((id) => !suppressed.includes(id)).map((id) => CAMPAIGN_MODULE_LABELS[id]).join(", ") || "legal moves only"}{suppressed.length > 0 ? ` · set aside: ${suppressed.map((id) => CAMPAIGN_MODULE_LABELS[id]).join(", ")}` : ""}</span>
      <div class="row-actions">
        <button type="button" disabled={busy} onclick={() => void declareDone()}>{busy ? "Declaring…" : "Declare done"}</button>
        <button type="button" class="quiet" onclick={() => onNavigate(`/campaign/${encodeURIComponent(origin.campaignRunId)}`)}>Map</button>
      </div>
    {:else}
      <span>This run was a campaign encounter.</span>
      <button type="button" class="quiet" onclick={() => onNavigate(`/campaign/${encodeURIComponent(origin.campaignRunId)}`)}>Open the campaign map</button>
    {/if}
  {/if}
  {#if error}<p role="alert">{error}</p>{/if}
</aside>

<style>
  .campaign-strip { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: center; }
  .campaign-strip .charges { font-variant-numeric: tabular-nums; }
  .campaign-strip .kit { color: var(--muted); }
  .node-result { display: grid; gap: .25rem; }
  .row-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
</style>
