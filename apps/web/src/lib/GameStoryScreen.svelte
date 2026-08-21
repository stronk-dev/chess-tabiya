<script lang="ts">
  import { suggestTitle } from "@chess-tabiya/runtime";
  import type { GameStory } from "./api.js";
  import Chessboard from "./Chessboard.svelte";

  interface Props {
    story: GameStory;
    onEnter: (nodeId: string) => void | Promise<void>;
    onExport: () => void | Promise<void>;
    onVoice?: ((nodeId: string) => Promise<string>) | undefined;
    onShare?: (() => Promise<string>) | undefined;
  }
  let { story, onEnter, onExport, onVoice, onShare }: Props = $props();
  const ranked = $derived(story.rank.slice(0, 8).map((id) => story.moments.find((moment) => moment.nodeId === id)).filter((moment) => moment !== undefined).sort((a, b) => a.ply - b.ply));
  let selectedId = $state<string | undefined>();
  let voiceText = $state<string | undefined>();
  let shareUrl = $state<string | undefined>();
  const selected = $derived(ranked.find((moment) => moment.nodeId === selectedId) ?? ranked[0]);
  const imported = $derived(story.source.kind === "native" ? undefined : story.source);
  const title = $derived(suggestTitle(story));

  function xml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
  async function downloadCard(): Promise<void> {
    if (selected === undefined) return;
    const ranks = selected.fen.split(" ")[0]!.split("/");
    const glyphs: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
    const cells: string[] = Array.from({ length: 64 }, (_, index) => { const file = index % 8, rank = Math.floor(index / 8); return `<rect x="${48 + file * 52}" y="${60 + rank * 52}" width="52" height="52" fill="${(file + rank) % 2 === 0 ? "#eeeade" : "#71806a"}"/>`; });
    for (let rank = 0; rank < 8; rank += 1) { let file = 0; for (const token of ranks[rank]!) { if (/\d/.test(token)) { file += Number(token); continue; } const x = 48 + file * 52, y = 60 + rank * 52; cells.push(`<text x="${x + 26}" y="${y + 38}" text-anchor="middle" font-size="38">${glyphs[token]}</text>`); file += 1; } }
    const sentence = selected.sentences[0] ?? "Recorded Tabiya story moment.";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="900" height="520" fill="#f8f5ec"/>${cells.join("")}<text x="500" y="95" font-family="serif" font-size="34">${xml(title)}</text><foreignObject x="500" y="125" width="350" height="230"><div xmlns="http://www.w3.org/1999/xhtml" style="font:22px sans-serif;color:#171713">${xml(sentence)}</div></foreignObject><text x="500" y="470" font-family="sans-serif" font-size="18">rendered from recorded engine evidence · Tabiya</text></svg>`;
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 520; canvas.getContext("2d")!.drawImage(image, 0, 0);
    const anchor = document.createElement("a"); anchor.download = "tabiya-story.png"; anchor.href = canvas.toDataURL("image/png"); anchor.click();
  }
</script>

<main class="story" aria-labelledby="story-title" data-evidence-consumer="review.story">
  <header>
    <div><p class="eyebrow">{imported ? "Imported game" : "Played run"} / grounded story</p><h1 id="story-title">{imported ? `${imported.headers.White ?? "White"} – ${imported.headers.Black ?? "Black"}` : "Story of this run"}</h1><p>{imported?.result ?? story.outcome.result ?? "finished"} · {story.outcome.kind.replaceAll("_", " ")}</p></div>
    <div class="actions"><button type="button" onclick={() => onExport()}>Export game + branches</button>{#if onShare}<button type="button" onclick={async () => { shareUrl = await onShare!(); await navigator.clipboard?.writeText(new URL(shareUrl, location.href).href); }}>Share story</button>{/if}<a href="/review">Back to review</a></div>
  </header>
  {#if shareUrl}<p class="pending" role="status">Public story: <a href={shareUrl}>{shareUrl}</a> <button type="button" onclick={() => void downloadCard()}>Download card PNG</button></p>{/if}
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
