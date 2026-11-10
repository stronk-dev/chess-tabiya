<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";

  import type { ShapeEntryView } from "./api.js";
  import type { GuidedShapeFiringValue } from "../../../../packages/runtime/src/guided-shape-query.js";
  import type { PresentedShapeFiring } from "@chess-tabiya/runtime/client";
  import PresentedEvidence from "./evidence/PresentedEvidence.svelte";
  import { modalBoundary } from "./modal-boundary.js";
  interface Props {
    entry?: ShapeEntryView | undefined;
    match: GuidedShapeFiringValue;
    recognition: PresentedShapeFiring["presentation"];
    onClose: () => void;
    onInspect: () => void;
  }

  let { entry, match, recognition, onClose, onInspect }: Props = $props();
  // This keyed panel owns these callbacks for its entire lifetime. Reactive prop getters
  // from a destroyed panel must never resolve to a replacement selection's handlers.
  const close = untrack(() => onClose), inspect = untrack(() => onInspect);
  let alive = true;
  onDestroy(() => { alive = false; });
  function closeOwned(): void { if (alive) close(); }
  function inspectOwned(): void { if (alive) inspect(); }
  let heading: HTMLHeadingElement;

  onMount(() => heading.focus());

  function keydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeOwned();
  }
</script>

<svelte:window onkeydown={keydown} />

<div class="shape-panel" role="dialog" aria-modal="true" aria-labelledby="shape-panel-title" data-evidence-consumer="theory.shape_firing" use:modalBoundary>
  <header>
    <div>
      <p class="eyebrow">Named structure · {match.authority.channel}{match.authority.publisherHandle ? ` · ${match.authority.publisherHandle}` : ""}</p>
      <h2 id="shape-panel-title" tabindex="-1" bind:this={heading}>{match.authority.name}</h2>
    </div>
    <button type="button" onclick={closeOwned}>Close</button>
  </header>

  <section aria-label="Pattern recognition">
    {#if recognition.kind === "ready"}<PresentedEvidence items={recognition.items} />
    {:else}<p role="status">This pattern recognition could not be displayed. The catalogue below is general authored content.</p>{/if}
  </section>

  {#if entry !== undefined}
  <section aria-labelledby="shape-plans-title">
    <h3 id="shape-plans-title">Named plans</h3>
    <p class="frame">Named plans for this structure — general to the kind of position, not advice for this one.</p>
    {#each ["white", "black"] as side}
      <h4>{side === "white" ? "White" : "Black"}</h4>
      {#each entry.plans.filter((plan) => plan.side === side) as plan}
        <article>
          <strong>{plan.label}</strong>
          <p>{plan.description}</p>
          <p>{plan.success.note}</p>
        </article>
      {/each}
    {/each}
  </section>

  <section class="lists">
    <div><h3>Watch</h3>{#each entry.watch as item}<p>{item}</p>{/each}</div>
    <div><h3>Typical mistakes</h3>{#each entry.typicalMistakes as item}<p>{item}</p>{/each}</div>
  </section>

  {:else}<p role="status">The matching catalogue version is unavailable. General plans cannot be shown for this match.</p>{/if}

  <footer><button type="button" onclick={inspectOwned}>Inspect trigger and sources</button></footer>
</div>

<style>
  .shape-panel{position:absolute;inset:1rem 1rem 1rem auto;z-index:20;width:min(32rem,calc(100% - 2rem));max-height:calc(100dvh - 2rem);overflow:auto;overscroll-behavior:contain;padding:1rem;border:1px solid var(--line);border-radius:1rem;background:var(--panel);box-shadow:var(--shadow)}
  header{display:flex;justify-content:space-between;gap:1rem;align-items:start}h2,h3,h4,p{margin:.35rem 0}h2{font:500 2rem/1 var(--display-font)}h3{margin-top:1.2rem}.eyebrow,footer{color:var(--muted);font-size:.78rem}.eyebrow{text-transform:uppercase;letter-spacing:.1em}.frame{padding:.65rem;border-left:3px solid var(--accent);background:var(--surface)}article{margin:.7rem 0;padding:.7rem;border:1px solid var(--line);border-radius:.7rem}.lists{display:grid;grid-template-columns:1fr 1fr;gap:1rem}footer{margin-top:1rem;padding-top:.6rem;border-top:1px solid var(--line)}button{padding:.5rem .65rem;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:inherit}
  @media(max-width:719px),(max-height:479px){.shape-panel{inset:.5rem;width:calc(100% - 1rem);max-height:calc(100dvh - 1rem);padding:.75rem}.lists{grid-template-columns:1fr}h2{font-size:1.5rem}header button,footer button{min-height:2rem}}
</style>
