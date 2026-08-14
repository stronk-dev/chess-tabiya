<script lang="ts">
  import type { ShapeEntryView } from "./api.js";
  import { renderStructuralExpressionSpec } from "./structural-sentences.js";

  interface Props {
    entry: ShapeEntryView;
    onClose: () => void;
  }

  let { entry, onClose }: Props = $props();
</script>

<aside class="shape-panel" aria-labelledby="shape-panel-title">
  <header>
    <div>
      <p class="eyebrow">Detected structure · {entry.channel}{entry.publisherHandle ? ` · ${entry.publisherHandle}` : ""}</p>
      <h2 id="shape-panel-title">{entry.name}</h2>
    </div>
    <button type="button" onclick={onClose}>Close</button>
  </header>

  <section aria-labelledby="shape-detection-title">
    <h3 id="shape-detection-title">Detection</h3>
    <p>Tabiya's shape trigger for {entry.name} matches this position.</p>
    <p class="spec">{renderStructuralExpressionSpec(entry.trigger)}</p>
  </section>

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
          {#if plan.success.signature !== null}
            <p class="spec">Success, structurally: {renderStructuralExpressionSpec(plan.success.signature)}.</p>
          {/if}
        </article>
      {/each}
    {/each}
  </section>

  <section class="lists">
    <div><h3>Watch</h3>{#each entry.watch as item}<p>{item}</p>{/each}</div>
    <div><h3>Typical mistakes</h3>{#each entry.typicalMistakes as item}<p>{item}</p>{/each}</div>
  </section>

  <footer>
    <p>{entry.id}@{entry.version} · {entry.channel} · {entry.provenance.licence}</p>
    {#each entry.provenance.attribution as source}
      <p>{source.title} — {source.author} ({source.licence}){#if source.url} · <a href={source.url} rel="noreferrer">source</a>{/if}</p>
    {/each}
    {#each entry.provenance.sources as source}<p>{source}</p>{/each}
  </footer>
</aside>

<style>
  .shape-panel{position:absolute;inset:1rem 1rem 1rem auto;z-index:20;width:min(32rem,calc(100% - 2rem));overflow:auto;padding:1rem;border:1px solid var(--line);border-radius:1rem;background:var(--panel);box-shadow:0 1rem 3rem rgb(20 28 24 / .22)}
  header{display:flex;justify-content:space-between;gap:1rem;align-items:start}h2,h3,h4,p{margin:.35rem 0}h2{font:500 2rem/1 var(--display-font)}h3{margin-top:1.2rem}.eyebrow,.spec,footer{color:var(--muted);font-size:.78rem}.eyebrow{text-transform:uppercase;letter-spacing:.1em}.frame{padding:.65rem;border-left:3px solid var(--accent);background:var(--paper-soft)}article{margin:.7rem 0;padding:.7rem;border:1px solid var(--line);border-radius:.7rem}.lists{display:grid;grid-template-columns:1fr 1fr;gap:1rem}footer{margin-top:1rem;padding-top:.6rem;border-top:1px solid var(--line)}button{padding:.5rem .65rem;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:inherit}
</style>
