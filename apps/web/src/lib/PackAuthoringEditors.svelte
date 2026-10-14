<script lang="ts">
  import type { ComponentProps } from "svelte";
  import PackVocabularyEditor from "./PackVocabularyEditor.svelte";
  import PackProvenanceEditor from "./PackProvenanceEditor.svelte";

  let props: ComponentProps<typeof PackVocabularyEditor> = $props();
</script>

<PackVocabularyEditor {...props} />
<PackProvenanceEditor documentJson={props.documentJson} onDocumentJson={props.onDocumentJson} />
