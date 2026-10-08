<script lang="ts">
  import { CampaignApi, parseCampaignEncounterReview, type CampaignEncounterReview } from "./campaign-api.js";

  interface Props {
    campaigns: CampaignApi;
    campaignRunId: string;
    nodeId: string;
    runId: string;
    campaignDocumentDigest: string;
    abandoned?: boolean;
    onNavigate: (path: string) => void;
  }
  let { campaigns, campaignRunId, nodeId, runId, campaignDocumentDigest, abandoned = false, onNavigate }: Props = $props();
  type Subject = { campaignRunId: string; nodeId: string; runId: string; campaignDocumentDigest: string; abandoned: boolean };
  type Destination = "play" | "review" | false;
  let state = $state<{ kind: "loading"; opening: Destination } | { kind: "ready"; review: CampaignEncounterReview } | { kind: "failed" }>({ kind: "loading", opening: false });
  let generation = 0;

  $effect(() => {
    const subject = { campaignRunId, nodeId, runId, campaignDocumentDigest, abandoned };
    const current = ++generation;
    state = { kind: "loading", opening: false };
    void read(subject, current, false);
    return () => { generation += 1; };
  });

  async function read(subject: Subject, current: number, opening: Destination): Promise<void> {
    try {
      const resolved = parseCampaignEncounterReview(await campaigns.review(subject.campaignRunId, subject.nodeId), subject);
      if (current !== generation) return;
      state = { kind: "ready", review: resolved };
      if (opening && resolved.kind !== "unavailable") {
        const route = opening === "review" ? resolved.reviewRoute : resolved.route;
        if (route !== null) onNavigate(route);
      }
    } catch {
      if (current === generation) state = { kind: "failed" };
    }
  }

  function check(opening: Destination): void {
    if (state.kind === "loading") return;
    const current = ++generation;
    state = { kind: "loading", opening };
    // Re-read on activation: a game deleted after the map loaded is not a valid navigation target.
    void read({ campaignRunId, nodeId, runId, campaignDocumentDigest, abandoned }, current, opening);
  }
</script>

<div class="encounter-history" data-history-node={nodeId}>
  {#if state.kind === "loading"}
    <p class="honest" role="status">{state.opening === "review" ? "Opening Game Review…" : state.opening ? "Opening the recorded encounter…" : "Checking recorded encounter…"}</p>
  {:else if state.kind === "failed"}
    <p role="alert">The recorded encounter could not be checked. Your campaign history is unchanged.</p>
    <button type="button" onclick={() => check(false)}>Try again</button>
  {:else if state.review.kind === "unavailable"}
    <p class="honest" role="note" data-history-reason={state.review.reason}>{state.review.reason === "campaign_encounter_run_deleted"
      ? "This encounter's recorded game was deleted. Its campaign seal and earned rewards are kept."
      : "This abandoned attempt's recorded game was deleted. Its abandonment remains in campaign history."}</p>
    <button type="button" onclick={() => check(false)}>Check again</button>
  {:else}
    {#if state.review.reviewRoute === null}
      <p class="honest" role="note">Game Review is withheld until this rehearsal opens feedback. You can still open the recorded encounter.</p>
    {:else}
      <button type="button" onclick={() => check("review")}>Review encounter</button>
    {/if}
    <button type="button" onclick={() => check("play")}>Open recorded encounter</button>
  {/if}
</div>

<style>
  .encounter-history { margin-top: .5rem; overflow-wrap: anywhere; }
  p { margin: 0 0 .5rem; }
  .honest { color: var(--muted); }
  button { min-height: 2.75rem; padding: .55rem .9rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
</style>
