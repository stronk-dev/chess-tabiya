<script lang="ts">
  import KeyboardGuide from "./KeyboardGuide.svelte";
  interface Props { onClose: () => void }
  let { onClose }: Props = $props();
</script>

<KeyboardGuide headingId="shortcut-title" eyebrow="Keyboard map" title="Keep your hands on the position." {onClose} />
