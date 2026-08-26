<script lang="ts">
  interface Props {
    message: string;
    priority?: "polite" | "assertive";
  }

  let { message, priority = "polite" }: Props = $props();
</script>

<span
  class="visually-hidden"
  role="status"
  aria-live={priority}
  aria-atomic="true"
  data-status-announcement
>{message}</span>
