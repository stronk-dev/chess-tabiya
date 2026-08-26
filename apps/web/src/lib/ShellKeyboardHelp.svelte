<script lang="ts">
  import KeyboardGuide from "./KeyboardGuide.svelte";
  interface Props { onClose: () => void }
  let { onClose }: Props = $props();
</script>

<KeyboardGuide headingId="shell-shortcuts-title" eyebrow="Application keyboard map" title="Move through the whole workspace." {onClose} />
