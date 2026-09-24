<script lang="ts">
  // rfc/evidence-presentation.md §2.1/§3 — the client renderer for sealed presented items. It receives
  // only items the exact receipt parser sealed; it selects, queries and grades nothing. Each item is
  // drawn by its one registered component, whose text is the component's own equivalent sentence, so
  // the visual and screen-reader renderings are the same bytes. Abstention is structurally distinct
  // from a value: it alone carries `data-abstention` (§4c).
  import type { PresentedEvidenceItem } from "@chess-tabiya/runtime";

  import AbstentionView from "./components/AbstentionView.svelte";
  import CitationView from "./components/CitationView.svelte";
  import CountView from "./components/CountView.svelte";
  import DistributionView from "./components/DistributionView.svelte";
  import EnumStateView from "./components/EnumStateView.svelte";
  import MagnitudeTrailView from "./components/MagnitudeTrailView.svelte";
  import MagnitudeView from "./components/MagnitudeView.svelte";
  import MovePathView from "./components/MovePathView.svelte";
  import OutcomeSplitView from "./components/OutcomeSplitView.svelte";
  import RelationOverlayView from "./components/RelationOverlayView.svelte";
  import SquareSetView from "./components/SquareSetView.svelte";
  import StructuredDocumentView from "./components/StructuredDocumentView.svelte";
  import TextStatementView from "./components/TextStatementView.svelte";
  import { presentedViews } from "./presented-view.js";

  interface Props {
    items: readonly PresentedEvidenceItem[];
    /** Caption↔square focus binding (§3.5): the owning seat paints the focused fact's squares. */
    onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined;
  }
  let { items, onFocusSquares }: Props = $props();
  const views = $derived(presentedViews(items));
</script>

{#each views as view (view.digest)}
  <div class="presented" data-presented={view.id}>
    {#if view.component.id === "abstention"}<AbstentionView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "distribution"}<DistributionView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "outcome_split"}<OutcomeSplitView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "magnitude"}<MagnitudeView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "magnitude_trail"}<MagnitudeTrailView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "square_set"}<SquareSetView component={view.component} sentence={view.sentence} {onFocusSquares} />
    {:else if view.component.id === "move_path"}<MovePathView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "relation_overlay"}<RelationOverlayView component={view.component} sentence={view.sentence} {onFocusSquares} />
    {:else if view.component.id === "count_with_denominator"}<CountView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "citation"}<CitationView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "enum_state"}<EnumStateView component={view.component} sentence={view.sentence} />
    {:else if view.component.id === "structured_document"}<StructuredDocumentView component={view.component} sentence={view.sentence} />
    {:else}<TextStatementView component={view.component} sentence={view.sentence} />
    {/if}
  </div>
{/each}

<style>
  .presented{display:block;font-size:.78rem}
</style>
