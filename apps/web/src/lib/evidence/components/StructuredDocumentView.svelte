<script lang="ts">
  // rfc/evidence-presentation.md §3.12 — author/operator surfaces only: a read-only labelled viewer of
  // one schema-coupled document, with its canonical raw JSON behind an explicit toggle. This module is
  // the single named JSON exemption of the label sweep (criterion 10).
  import { STRUCTURED_DOCUMENT_SCHEMAS, type ComponentValue } from "@chess-tabiya/runtime";

  interface Props { component: Extract<ComponentValue, { id: "structured_document" }>; sentence: string }
  let { component, sentence }: Props = $props();
  const schema = $derived(STRUCTURED_DOCUMENT_SCHEMAS[component.operand.schemaId]);
  const rows = $derived(schema.fields.map((field) => ({ field, value: component.operand.document[field] })));
  const scalar = (value: unknown): string => (typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : value === null ? "none" : Array.isArray(value) ? `${value.length} entries` : "record");
</script>

<section class="document" data-component="structured_document" aria-label={sentence}>
  <dl>
    {#each rows as row (row.field)}<dt>{row.field}</dt><dd>{scalar(row.value)}</dd>{/each}
  </dl>
  <details><summary>Raw record</summary><pre>{component.operand.canonicalBytes}</pre></details>
</section>

<style>
  .document{display:grid;gap:.3rem;font-size:.75rem}
  dl{display:grid;grid-template-columns:max-content 1fr;gap:.15rem .6rem;margin:0}
  dt{color:var(--muted)}
  dd{margin:0;color:var(--ink)}
  pre{margin:0;padding:.4rem;overflow:auto;background:var(--surface);border:1px solid var(--line);border-radius:.3rem;color:var(--ink)}
</style>
