<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { ApiError } from "./api.js";
  import CampaignEncounterHistory from "./CampaignEncounterHistory.svelte";
  import {
    CAMPAIGN_MODULE_LABELS,
    CampaignApi,
    newCampaignCommandId,
    assertCampaignCommand,
    rewardText,
    verdictText,
    type CampaignProjection,
    type CampaignRunReward,
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
  let submission: { campaign: CampaignProjection; campaignRunId: string; nodeId: string; input: { runId: string; branchId: string; expectedRevision: number; commandId: string } } | undefined;
  let generation = 0;
  let readGeneration = 0;
  let subject: string | undefined;

  let active = $derived(campaign?.activeEncounter?.playRunId === runId && campaign.activeEncounter.nodeId === origin.nodeId);
  let nodeTitle = $derived(campaign?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((card) => card.nodeId === origin.nodeId)?.title ?? origin.nodeId);
  let suppressed = $derived(campaign?.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((card) => card.nodeId === origin.nodeId)?.suppress ?? []);

  $effect(() => {
    void runRevision;
    const nextSubject = JSON.stringify([origin.campaignRunId, origin.nodeId, runId, branchId]);
    untrack(() => {
      if (subject !== nextSubject) {
        subject = nextSubject;
        generation++;
        campaign = undefined;
        sealed = undefined;
        submission = undefined;
        busy = false;
        error = undefined;
      }
      void refresh();
    });
  });
  onMount(() => () => { generation++; readGeneration++; });

  function ownsView(current: number, requestedSubject: string | undefined): boolean {
    return current === generation && requestedSubject === JSON.stringify([origin.campaignRunId, origin.nodeId, runId, branchId]);
  }

  async function refresh(): Promise<void> {
    const current = generation, requestedSubject = subject, reading = ++readGeneration;
    const requestedId = origin.campaignRunId;
    try {
      const next = await campaigns.read(requestedId);
      if (!ownsView(current, requestedSubject) || reading !== readGeneration) return;
      if (next.campaignRun.id !== requestedId || (campaign !== undefined && next.campaignRun.documentDigest !== campaign.campaignRun.documentDigest)) throw new Error("Crossed campaign read");
      campaign = next;
      onRevision(next.activeEncounter?.playRunId === runId && next.activeEncounter.nodeId === origin.nodeId ? { campaignRevision: next.campaignRun.revision, active: true } : null);
    } catch (caught) {
      if (ownsView(current, requestedSubject) && reading === readGeneration) error = caught instanceof ApiError ? caught.message : "Campaign state could not be loaded.";
    }
  }

  export function declareError(): string | undefined {
    return error;
  }

  export async function declareDone(): Promise<boolean> {
    if (busy || campaign === undefined || (!active && submission === undefined)) return false;
    if (sealed !== undefined) return true;
    const current = generation, requestedSubject = subject;
    busy = true;
    error = undefined;
    submission ??= { campaign, campaignRunId: origin.campaignRunId, nodeId: origin.nodeId, input: { runId, branchId, expectedRevision: campaign.campaignRun.revision, commandId: newCampaignCommandId() } };
    const requested = submission;
    try {
      const done = await campaigns.submit(requested.campaignRunId, requested.nodeId, requested.input);
      if (!ownsView(current, requestedSubject)) return false;
      const originalCard = requested.campaign.acts.flatMap(act => act.layers.flatMap(layer => layer.choices)).find(card => card.nodeId === requested.nodeId);
      assertCampaignCommand(done, requested.campaign, originalCard?.kind === "boss_game" ? "boss_game_committed" : "node_committed");
      const card = done.campaign.acts.flatMap(act => act.layers.flatMap(layer => layer.choices)).find(card => card.nodeId === requested.nodeId);
      if (done.result.response?.nodeId !== requested.nodeId || card?.seal == null || card.seal.kind !== originalCard?.kind || card.seal.playRunId !== requested.input.runId) throw new Error("Crossed encounter seal");
      readGeneration++;
      submission = undefined;
      sealed = { verdict: verdictText(card.seal), reward: card.reward, completed: done.campaign.campaignRun.status === "completed" };
      campaign = done.campaign;
      onRevision(null);
      return true;
    } catch (caught) {
      if (!ownsView(current, requestedSubject)) return false;
      error = caught instanceof ApiError ? caught.message : "The encounter could not be declared done. Try again.";
      if (caught instanceof ApiError && caught.code === "CAMPAIGN_REVISION_STALE") { submission = undefined; await refresh(); }
    } finally {
      if (ownsView(current, requestedSubject)) busy = false;
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
      {#if campaign}<CampaignEncounterHistory {campaigns} campaignRunId={origin.campaignRunId} nodeId={origin.nodeId} {runId} campaignDocumentDigest={campaign.campaignRun.documentDigest} {onNavigate} />{/if}
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
