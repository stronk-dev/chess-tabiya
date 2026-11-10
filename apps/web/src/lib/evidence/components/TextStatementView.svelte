<script lang="ts">
  // rfc/evidence-presentation.md §3.10 (claim) and §3.10a (fact_statement) — a registered sentence
  // recomputed from the sealed operand on parse; the claim's binding is its attribution. No caller
  // may attach prose: the only text is the component's own equivalent sentence.
  import { onDestroy, tick } from "svelte";
  import { isNativeFactSummary, presentedNativeFactReport, isGradeMeasurementSummary, presentedGradeMeasurementReport, type GradeMeasurementReport, type PresentedEvidenceItem, type ComponentValue } from "@chess-tabiya/runtime/client";

  interface Props {
    component: Extract<ComponentValue, { id: "claim" | "fact_statement" }>; sentence: string;
    owner?: PresentedEvidenceItem | undefined; selectedItems?: readonly PresentedEvidenceItem[] | undefined; detailsScope?: object | undefined;
    detailsActive?: boolean; detailsGeneration?: number;
  }
  let { component, sentence, owner, selectedItems, detailsScope, detailsActive = false, detailsGeneration = 0 }: Props = $props();
  const binding = $derived(component.id === "claim" ? component.operand.binding : component.operand.binding);
  const componentId = $props.id();
  const reportId = `${componentId}-measurement`;
  let report = $state<GradeMeasurementReport | null>(null);
  let epoch = $state.raw<object>({});
  let alive = true;
  let toggle: HTMLButtonElement | undefined = $state();
  const native = $derived(owner !== undefined && selectedItems?.includes(owner) === true && isNativeFactSummary(owner));
  const eligible = $derived(owner !== undefined && detailsScope !== undefined && detailsActive && (native || isGradeMeasurementSummary(owner)));
  $effect(() => {
    void owner; void selectedItems; void detailsScope; void detailsActive; void detailsGeneration;
    epoch = {}; report = null;
  });
  onDestroy(() => { alive = false; });
  // Each DOM handler belongs to exactly this item, packet and region generation. Retaining and
  // reinserting an old Open OR Close button cannot adopt the next report's authority.
  const controls = $derived.by(() => {
    const item = owner, selection = selectedItems, scope = detailsScope, generation = detailsGeneration, token = epoch;
    const owned = () => alive && eligible && owner === item && selectedItems === selection && detailsScope === scope && detailsGeneration === generation;
    const current = () => owned() && epoch === token;
    const focusCurrent = async (expected: object, previous: Element | null) => {
      await tick();
      const ownsFocus = document.activeElement === previous || previous !== null && !previous.isConnected && document.activeElement === document.body;
      if (ownsFocus && owned() && epoch === expected && toggle?.isConnected) toggle.focus();
    };
    const close = () => {
      if (!current()) return;
      const previous = document.activeElement;
      const next = {}; epoch = next; report = null;
      void focusCurrent(next, previous);
    };
    return {
      open: (event: MouseEvent) => {
        if (!current() || item === undefined) return;
        if (report !== null) { close(); return; }
        const focused = document.activeElement === event.currentTarget;
        report = native ? presentedNativeFactReport(item) : presentedGradeMeasurementReport(item);
        const next = {}; epoch = next;
        if (focused) void focusCurrent(next, event.currentTarget as HTMLButtonElement);
      },
      close,
      escape: (event: KeyboardEvent) => { if (event.key === "Escape" && current() && report !== null) { event.preventDefault(); event.stopPropagation(); close(); } },
    };
  });
</script>

<p class="statement" data-component={component.id} data-binding={binding}>{sentence}</p>
{#if eligible}
  {#each [controls] as renderedControls (renderedControls)}
  <button bind:this={toggle} type="button" class="measurement-toggle" aria-expanded={report !== null} aria-controls={reportId} onclick={renderedControls.open} onkeydown={renderedControls.escape}>{native ? "Inspect this fact" : "How measured"}</button>
  {#if report !== null}
    <section id={reportId} class="measurement-report" aria-label={native ? "Fact details" : "Measurement details"}>
      {#if report.kind === "available"}<p>{report.sentence}</p>
      {:else}<p role="status">{native ? "Fact details exceed this view’s limit." : "Measurement details exceed this view's limit."}</p>{/if}
      <button type="button" onclick={renderedControls.close} onkeydown={renderedControls.escape}>{native ? "Close fact details" : "Close measurement details"}</button>
    </section>
  {/if}
  {/each}
{/if}
{#if component.id === "fact_statement" && (component.operand.rendererId === "play.shape_entry@1" || component.operand.rendererId === "inspector.registered_shape_firing@2")}
  <a class="pattern-entry" href={`/library/shape/${encodeURIComponent(component.operand.operands.entryId)}`}>Open pattern entry</a>
{/if}

<style>
  .statement{margin:0;color:var(--ink);white-space:pre-line;overflow-wrap:anywhere}
  .pattern-entry{display:inline-block;margin-top:.5rem;color:var(--ink);text-underline-offset:.2em}
  .pattern-entry:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
  .measurement-toggle{margin-top:.5rem}
  .measurement-report{margin-top:.5rem;overflow-wrap:anywhere;min-width:0}
  .measurement-report p{white-space:pre-line;margin:0 0 .5rem}
</style>
