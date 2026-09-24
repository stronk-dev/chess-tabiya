<script lang="ts">
  // rfc/module-registration.md §2.6/§3 + rfc/play-composition.md §4 — the companion region's module
  // seats. A seat renders only what one strict-parsed, digest-bound packet delivered: collapsed as a
  // badged row, expanded as its card, or quiet when honestly empty. At most one seat is expanded;
  // every change is companion-internal, never stage layout. The head slot belongs to the one
  // board-adjacent cue (blunder_prevention) and appears only while a staged move is held.
  import PresentedEvidence from "./evidence/PresentedEvidence.svelte";
  import type { ParsedModulePacket } from "./module-query-response.js";
  import { seatBadge, unavailableSentences, type PlaySeatModule, type SeatDeclaration, type StagedCue } from "./module-seats.js";

  interface Props {
    seats: readonly SeatDeclaration[];
    packets: ReadonlyMap<PlaySeatModule, ParsedModulePacket>;
    pending: ReadonlySet<PlaySeatModule>;
    failed: ReadonlySet<PlaySeatModule>;
    expanded: PlaySeatModule | undefined;
    /** Why an on-request door cannot open right now (e.g. no subject yet); absent when it can. */
    doorBlocked: Readonly<Partial<Record<PlaySeatModule, string>>>;
    staged: StagedCue | undefined;
    onToggle: (module: PlaySeatModule) => void;
    onRequest: (module: PlaySeatModule) => void;
    onConfirmStaged: () => void;
    onReviseStaged: () => void;
    onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined;
  }
  let { seats, packets, pending, failed, expanded, doorBlocked, staged, onToggle, onRequest, onConfirmStaged, onReviseStaged, onFocusSquares }: Props = $props();

  const NUDGE_HEADLINE = "The consequence exposed something concrete.";
  const NUDGE_CLOSING = "Your played line stays preserved.";

  const railSeats = $derived(seats.filter((seat) => !seat.headSlot && !(seat.emptySilent && (packets.get(seat.module)?.items.length ?? 0) === 0)));
  const headSeat = $derived(seats.find((seat) => seat.headSlot));
</script>

<div class="module-seats" data-seat-count={railSeats.length + (staged === undefined || headSeat === undefined ? 0 : 1)}>
  {#if headSeat !== undefined && staged !== undefined}
    <section class="module-seat head-slot" data-module="blunder_prevention" data-seat-class="board_adjacent" data-seat-state={staged.state} aria-label={headSeat.label}>
      {#if staged.state === "checking"}
        <p role="status">Checking the staged move {staged.move}…</p>
      {:else if staged.state === "warning"}
        <strong>Before you play {staged.move}</strong>
        <PresentedEvidence items={staged.packet.items} {onFocusSquares} />
        <div class="seat-actions">
          <button type="button" class="primary" onclick={onReviseStaged}>Revise</button>
          <button type="button" onclick={onConfirmStaged}>Play {staged.move} anyway</button>
        </div>
      {:else}
        <p>The staged-move check is unavailable right now; nothing was checked.</p>
        <div class="seat-actions">
          <button type="button" class="primary" onclick={onReviseStaged}>Revise</button>
          <button type="button" onclick={onConfirmStaged}>Play {staged.move}</button>
        </div>
      {/if}
    </section>
  {/if}
  {#each railSeats as seat (seat.module)}
    {@const packet = packets.get(seat.module)}
    {@const badge = seatBadge(packet)}
    {@const open = expanded === seat.module}
    {@const state = packet === undefined ? "door" : packet.items.length === 0 ? "empty" : "filled"}
    <section class="module-seat" data-module={seat.module} data-seat-class="rail" data-seat-state={open ? "expanded" : state} aria-label={seat.label}>
      <button type="button" class="seat-row" aria-expanded={open} aria-controls={`seat-card-${seat.module}`} onclick={() => onToggle(seat.module)}>
        <span class="seat-label">{seat.label}</span>
        {#if badge !== null}<span class="seat-badge" aria-label={`${badge} ${badge === 1 ? "fact" : "facts"}`}>{badge}</span>{/if}
      </button>
      {#if open}
        <div class="seat-card" id={`seat-card-${seat.module}`}>
          {#if pending.has(seat.module)}
            <p role="status">Asking…</p>
          {:else if failed.has(seat.module)}
            <p role="alert">This help could not be loaded. Nothing was checked.</p>
            {#if !seat.proactive}<button type="button" onclick={() => onRequest(seat.module)}>Try again</button>{/if}
          {:else if packet === undefined}
            {#if doorBlocked[seat.module] !== undefined}
              <p class="door-reason">{doorBlocked[seat.module]}</p>
            {:else}
              <button type="button" class="seat-request" onclick={() => onRequest(seat.module)}>Show</button>
            {/if}
          {:else}
            {#if seat.module === "postcommit_nudge" && packet.items.length > 0}<strong>{NUDGE_HEADLINE}</strong>{/if}
            {#if packet.items.length > 0}
              <PresentedEvidence items={packet.items} {onFocusSquares} />
            {:else if packet.empty !== null && (packet.empty.kind === "stated_absence" || packet.empty.kind === "unavailable_source")}
              <p class="stated-empty" data-empty={packet.empty.kind}>{packet.empty.sentence}</p>
            {/if}
            {#each unavailableSentences(packet) as sentence}<p class="unavailable">{sentence}</p>{/each}
            {#if seat.module === "postcommit_nudge" && packet.items.length > 0}<p>{NUDGE_CLOSING}</p>{/if}
            {#if !seat.proactive && doorBlocked[seat.module] === undefined}<button type="button" class="seat-request secondary" onclick={() => onRequest(seat.module)}>Ask again here</button>{/if}
          {/if}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .module-seats{display:grid;gap:.45rem}
  .module-seat{display:grid;gap:.35rem;margin:0;padding:.55rem .65rem;border:1px solid var(--line);border-radius:.7rem;background:var(--panel)}
  .head-slot{border-color:var(--warning)}
  .seat-row{display:flex;justify-content:space-between;align-items:center;gap:.5rem;width:100%;padding:0;border:0;background:none;color:var(--ink);font:inherit;font-weight:600;text-align:left;cursor:pointer}
  .seat-badge{min-width:1.3rem;padding:0 .35rem;border-radius:.65rem;background:var(--accent-soft);color:var(--ink);font-size:.72rem;text-align:center;font-variant-numeric:tabular-nums}
  .seat-card{display:grid;gap:.35rem;font-size:.78rem}
  .seat-card p{margin:0}
  .stated-empty,.door-reason,.unavailable{color:var(--muted)}
  .seat-actions{display:flex;flex-wrap:wrap;gap:.4rem}
</style>
