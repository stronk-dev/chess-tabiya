<script lang="ts">
  // rfc/evidence-presentation.md §3.11/§4 — the honest-empty state as a component: bordered, muted,
  // lighter weight, never an error colour and never zero-height. It alone carries `data-abstention`
  // (§4c), so a withheld value and a real zero are told apart by attribute, not by copy.
  import type { ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "abstention" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const reason = $derived(component.operand.kind === "pending" ? component.operand.stage : component.operand.reason);
</script>

<div class="abstention" data-component="abstention" data-abstention={reason} role="note">
  <p>{sentence}</p>
</div>

<style>
  .abstention{border:1px solid var(--line);border-radius:.35rem;padding:.25rem .45rem;color:var(--muted);min-height:1.2rem}
  .abstention p{margin:0}
</style>
