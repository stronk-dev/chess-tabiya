<script lang="ts">
  import type { GameStory } from "./api.js";
  import Chessboard from "./Chessboard.svelte";

  interface Props {
    story: GameStory;
    onEnter: (nodeId: string) => void | Promise<void>;
    onExport: () => void | Promise<void>;
    onVoice?: ((nodeId: string) => Promise<string>) | undefined;
  }
  let { story, onEnter, onExport, onVoice }: Props = $props();
  const ranked = $derived(story.rank.slice(0, 8).map((id) => story.moments.find((moment) => moment.nodeId === id)).filter((moment) => moment !== undefined).sort((a, b) => a.ply - b.ply));
  let selectedId = $state<string | undefined>();
  let voiceText = $state<string | undefined>();
  const selected = $derived(ranked.find((moment) => moment.nodeId === selectedId) ?? ranked[0]);
</script>

<main class="story" aria-labelledby="story-title">
  <header>
    <div><p class="eyebrow">Imported game / grounded story</p><h1 id="story-title">{story.source.headers.White ?? "White"} – {story.source.headers.Black ?? "Black"}</h1><p>{story.source.result} · {story.outcome.kind.replaceAll("_", " ")}</p></div>
    <div class="actions"><button type="button" onclick={() => onExport()}>Export game + branches</button><a href="/review">Back to review</a></div>
  </header>
  {#if !story.ready}<p class="pending" role="status">Evaluation pending: {story.pendingEvidence} {story.pendingEvidence === 1 ? "position" : "positions"}. Re-entry unlocks when the recorded pass completes.</p>{/if}
  {#if selected}
    <section class="stage" aria-label="Selected story moment">
      <div class="board"><Chessboard fen={selected.fen} startSide={story.side} disabled={true} onMove={() => {}} /></div>
      <article>
        <p class="eyebrow">Ply {selected.ply}{selected.san ? ` · ${selected.san}` : ""}</p>
        <h2>{selected.kinds.map((kind) => kind.replaceAll("_", " ")).join(" + ")}</h2>
        {#each selected.sentences as sentence}<p>{sentence}</p>{/each}
        {#if voiceText}<p class="voice">{voiceText}</p>{/if}
        {#if selected.evalBefore && selected.evalAfter}<p class="evaluation">Recorded trajectory: {selected.evalBefore.centipawns} → {selected.evalAfter.centipawns} cp</p>{/if}
        <button class="primary" type="button" disabled={!story.ready} aria-describedby={!story.ready ? "story-pending-reason" : undefined} onclick={() => onEnter(selected.entryNodeId)}>Re-enter and play from here</button>
        {#if onVoice}<button type="button" onclick={async () => voiceText = await onVoice!(selected.nodeId)}>Narrate grounded moment</button>{/if}
        {#if !story.ready}<span id="story-pending-reason" class="sr-only">Wait for the recorded evidence pass to finish.</span>{/if}
      </article>
    </section>
  {:else}<p>No grounded moments were detected in this game.</p>{/if}
  <ol class="rail" aria-label="Game story moments">
    {#each ranked as moment, index}
      <li><button type="button" class:active={moment.nodeId === selected?.nodeId} onclick={() => selectedId = moment.nodeId}><span>{index + 1}</span><strong>{moment.kinds[0]?.replaceAll("_", " ") ?? "moment"}</strong><small>ply {moment.ply}{moment.san ? ` · ${moment.san}` : ""}</small></button></li>
    {/each}
  </ol>
</main>

<style>
  .story{height:100%;min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;gap:.75rem;padding:1rem;overflow:hidden}.story header{display:flex;justify-content:space-between;align-items:start;gap:1rem}.story h1,.story h2,.story p{margin:.15rem 0}.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:.75rem}.actions{display:flex;gap:.5rem;align-items:center}.pending{padding:.55rem .75rem;border:1px solid color-mix(in srgb,CanvasText 30%,transparent);border-radius:.5rem}.stage{min-height:0;display:grid;grid-template-columns:minmax(16rem,min(52vh,42vw)) minmax(18rem,1fr);gap:1.25rem;align-items:center;overflow:auto}.board{width:min(52vh,42vw);max-width:100%;justify-self:center}.stage article{max-width:44rem}.evaluation{font-variant-numeric:tabular-nums}.rail{display:flex;gap:.5rem;overflow-x:auto;list-style:none;padding:.25rem;margin:0}.rail button{min-width:10rem;display:grid;grid-template-columns:auto 1fr;gap:.1rem .45rem;text-align:left;padding:.6rem;border:1px solid color-mix(in srgb,CanvasText 25%,transparent);border-radius:.5rem;background:Canvas}.rail button.active{border-color:CanvasText}.rail small{grid-column:2}.primary{margin-top:.75rem}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:760px){.story{overflow:auto;height:auto}.stage{grid-template-columns:1fr;overflow:visible}.board{width:min(80vw,55vh)}header{flex-direction:column}}
</style>
