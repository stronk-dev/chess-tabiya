<script lang="ts">
  import { reviewStoryTitle, selectedStoryMoments, storyEvidenceSourceLabels } from "@chess-tabiya/runtime";
  import type { GameStory, StoryShare } from "./api.js";
  import Chessboard from "./Chessboard.svelte";
  import { recordedEvaluationTrajectory, storyMomentLabel } from "./learner-copy.js";
  import { storyCardDocument } from "./story-card.js";

  interface Props {
    story: GameStory;
    onEnter: (nodeId: string) => void | Promise<void>;
    onExport: () => void | Promise<void>;
    onVoice?: ((nodeId: string) => Promise<string>) | undefined;
    shares?: readonly StoryShare[];
    onShare?: (() => Promise<{ readonly id: string; readonly url: string }>) | undefined;
    onRevoke?: ((tokenId: string) => Promise<void>) | undefined;
  }
  let { story, onEnter, onExport, onVoice, shares = [], onShare, onRevoke }: Props = $props();
  const ranked = $derived(selectedStoryMoments(story));
  let selectedId = $state<string | undefined>();
  let voiceText = $state<string | undefined>();
  let shareUrl = $state<string | undefined>();
  let createdShareId = $state<string | undefined>();
  let shareBusy = $state(false);
  let shareStatus = $state<string | undefined>();
  let shareError = $state<string | undefined>();
  const selected = $derived(ranked.find((moment) => moment.nodeId === selectedId) ?? ranked[0]);
  const imported = $derived(story.source.kind === "native" ? undefined : story.source);
  const title = $derived(reviewStoryTitle(story));
  const sourceLabels = $derived(selected === undefined ? [] : storyEvidenceSourceLabels(selected));

  async function downloadCard(): Promise<void> {
    if (selected === undefined) return;
    const card = storyCardDocument(title, selected);
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(card.svg)}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = card.width; canvas.height = card.height; canvas.getContext("2d")!.drawImage(image, 0, 0);
    const anchor = document.createElement("a"); anchor.download = "tabiya-story.png"; anchor.href = canvas.toDataURL("image/png"); anchor.click();
  }

  function readableDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }

  async function createShare(): Promise<void> {
    if (onShare === undefined || shareBusy) return;
    shareBusy = true;
    shareError = undefined;
    shareStatus = undefined;
    try {
      const created = await onShare();
      createdShareId = created.id;
      shareUrl = created.url;
      const absolute = new URL(created.url, location.href).href;
      try {
        if (navigator.clipboard === undefined) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(absolute);
        shareStatus = "Public story link created and copied.";
      } catch {
        shareStatus = "Public story link created. Copy the visible URL manually; clipboard access was unavailable.";
      }
    } catch (error) {
      shareError = error instanceof Error ? error.message : String(error);
    } finally {
      shareBusy = false;
    }
  }

  async function revokeShare(tokenId: string): Promise<void> {
    if (onRevoke === undefined || shareBusy) return;
    shareBusy = true;
    shareError = undefined;
    try {
      await onRevoke(tokenId);
      if (createdShareId === tokenId) {
        createdShareId = undefined;
        shareUrl = undefined;
      }
      shareStatus = "Future reads through that public link are blocked. Copies already saved elsewhere cannot be recalled.";
    } catch (error) {
      shareError = error instanceof Error ? error.message : String(error);
    } finally {
      shareBusy = false;
    }
  }
</script>

<main class="story" aria-labelledby="story-title" data-evidence-consumer="review.story">
  <header>
    <div><p class="eyebrow">{imported ? "Imported game" : "Played run"} / grounded story</p><h1 id="story-title">{imported ? `${imported.headers.White ?? "White"} – ${imported.headers.Black ?? "Black"}` : "Story of this run"}</h1><p>{imported?.result ?? story.outcome.result ?? "finished"} · {story.outcome.kind.replaceAll("_", " ")}</p></div>
    <div class="actions"><button type="button" onclick={() => onExport()}>Export game + branches</button>{#if onShare}<button type="button" disabled={shareBusy} aria-describedby="story-share-lifetime" onclick={() => void createShare()}>Share story</button>{/if}<a href="/review">Back to review</a></div>
  </header>
  {#if onShare}
    <section class="share-management" aria-labelledby="story-share-title">
      <div><h2 id="story-share-title">Public story links</h2><p id="story-share-lifetime">A public story link does not expire. Anyone with it can read the bounded story until you revoke the link or delete your account. Revoking blocks future reads; it cannot erase copies someone already saved.</p></div>
      {#if shareUrl}<p class="pending">New public story: <a href={shareUrl}>{shareUrl}</a> <button type="button" onclick={() => void downloadCard()}>Download card PNG</button></p>{/if}
      {#if shareStatus}<p role="status" aria-live="polite" aria-atomic="true">{shareStatus}</p>{/if}
      {#if shareError}<p role="alert">{shareError}</p>{/if}
      {#if shares.length > 0}
        <ul aria-label="Story share links">
          {#each shares as share}
            <li><span>Created {readableDate(share.createdAt)} · {share.revokedAt === null ? "public" : `revoked ${readableDate(share.revokedAt)}`}</span>{#if share.revokedAt === null && onRevoke}<button type="button" disabled={shareBusy} onclick={() => void revokeShare(share.id)}>Revoke this link</button>{/if}</li>
          {/each}
        </ul>
      {:else}<p>No public story links yet.</p>{/if}
    </section>
  {/if}
  {#if !story.ready}<p class="pending" role="status">Evaluation pending: {story.pendingEvidence} {story.pendingEvidence === 1 ? "position" : "positions"}. Re-entry unlocks when the recorded pass completes.</p>{/if}
  {#if selected}
    <section class="stage" aria-label="Selected story moment">
      <div class="board"><Chessboard fen={selected.fen} startSide={story.side} disabled={true} onMove={() => {}} /></div>
      <article>
        <p class="eyebrow">Ply {selected.ply}{selected.san ? ` · ${selected.san}` : ""}</p>
        <h2>{selected.kinds.map(storyMomentLabel).join(" + ")}</h2>
        {#each selected.sentences as sentence}<p>{sentence}</p>{/each}
        <p class="provenance">Sources: {sourceLabels.join(" · ") || "recorded story"}</p>
        {#if voiceText}<p class="voice">{voiceText}</p>{/if}
        {#if selected.evalBefore && selected.evalAfter}<p class="evaluation">{recordedEvaluationTrajectory(selected.evalBefore.centipawns, selected.evalAfter.centipawns)}</p>{/if}
        <button class="primary" type="button" disabled={!story.ready} aria-describedby={!story.ready ? "story-pending-reason" : undefined} onclick={() => onEnter(selected.entryNodeId)}>Re-enter and play from here</button>
        {#if onVoice}<button type="button" onclick={async () => voiceText = await onVoice!(selected.nodeId)}>Narrate grounded moment</button>{/if}
        {#if !story.ready}<span id="story-pending-reason" class="visually-hidden">Wait for the recorded evidence pass to finish.</span>{/if}
      </article>
    </section>
  {:else}<p>No grounded moments were detected in this game.</p>{/if}
  <ol class="rail" aria-label="Game story moments">
    {#each ranked as moment, index}
      <li><button type="button" class:active={moment.nodeId === selected?.nodeId} onclick={() => selectedId = moment.nodeId}><span>{index + 1}</span><strong>{moment.kinds[0] ? storyMomentLabel(moment.kinds[0]) : "Moment"}</strong><small>ply {moment.ply}{moment.san ? ` · ${moment.san}` : ""}</small></button></li>
    {/each}
  </ol>
</main>

<style>
  .story{height:100%;min-height:0;display:grid;grid-template-rows:auto auto auto minmax(0,1fr) auto;gap:.75rem;padding:1rem;overflow:hidden}.story header{display:flex;justify-content:space-between;align-items:start;gap:1rem}.story h1,.story h2,.story p{margin:.15rem 0}.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:.75rem}.actions{display:flex;gap:.5rem;align-items:center}.pending{padding:.55rem .75rem;border:1px solid color-mix(in srgb,var(--ink) 30%,transparent);border-radius:.5rem}.share-management{display:grid;gap:.55rem;padding:.75rem;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:.6rem;background:var(--panel)}.share-management h2{font-size:1rem}.share-management ul{display:grid;gap:.4rem;margin:.25rem 0 0;padding:0;list-style:none}.share-management li{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding-top:.4rem;border-top:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.stage{min-height:0;display:grid;grid-template-columns:minmax(16rem,min(52vh,42vw)) minmax(18rem,1fr);gap:1.25rem;align-items:center;overflow:auto}.board{width:min(52vh,42vw);max-width:100%;justify-self:center}.stage article{max-width:44rem}.evaluation{font-variant-numeric:tabular-nums}.provenance{color:var(--muted);font-size:.85rem}.rail{display:flex;gap:.5rem;overflow-x:auto;list-style:none;padding:.25rem;margin:0}.rail button{min-width:10rem;display:grid;grid-template-columns:auto 1fr;gap:.1rem .45rem;text-align:left;padding:.6rem;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:.5rem;background:var(--panel)}.rail button.active{border-color:var(--ink)}.rail small{grid-column:2}.primary{margin-top:.75rem}@media(max-width:760px){.story{overflow:auto;height:auto}.stage{grid-template-columns:1fr;overflow:visible}.board{width:min(80vw,55vh)}header{flex-direction:column}.share-management li{align-items:start;flex-direction:column}}
</style>
