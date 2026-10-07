<script lang="ts">
  // rfc/module-registration.md §2.6/§3 + rfc/play-composition.md §4 — the companion region's module
  // seats. A seat renders only what one strict-parsed, digest-bound packet delivered: collapsed as a
  // badged row, expanded as its card, or quiet when honestly empty. At most one seat is expanded;
  // every change is companion-internal, never stage layout. The head slot belongs to the one
  // board-adjacent cue (blunder_prevention) and appears only while a staged move is held.
  import PresentedEvidence from "./evidence/PresentedEvidence.svelte";
  import { learnerProse } from "./labels/index.js";
  import CompanionSeat from "./CompanionSeat.svelte";
  import type { ParsedModulePacket } from "./module-query-response.js";
  import { COMPACT_SEAT_LABELS, occupiedRailSeats, seatBadge, unavailableSentences, type ModuleSeatActions, type PlaySeatModule, type SeatDeclaration, type StagedCue } from "./module-seats.js";

  interface Props {
    seats: readonly SeatDeclaration[];
    packets: ReadonlyMap<PlaySeatModule, ParsedModulePacket>;
    pending: ReadonlySet<PlaySeatModule>;
    failed: ReadonlySet<PlaySeatModule>;
    expanded: PlaySeatModule | undefined;
    band?: boolean;
    /** Why an on-request door cannot open right now (e.g. no subject yet); absent when it can. */
    doorBlocked: Readonly<Partial<Record<PlaySeatModule, string>>>;
    staged: StagedCue | undefined;
    actions?: ModuleSeatActions;
    onToggle: (module: PlaySeatModule) => void;
    onRequest: (module: PlaySeatModule) => void;
    onConfirmStaged: () => void;
    onReviseStaged: () => void;
    onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined;
  }
  let { seats, packets, pending, failed, expanded, band = false, doorBlocked, staged, actions = {}, onToggle, onRequest, onConfirmStaged, onReviseStaged, onFocusSquares }: Props = $props();

  const NUDGE_HEADLINE = "The consequence exposed something concrete.";
  const NUDGE_CLOSING = "Your played line stays preserved.";

  const railSeats = $derived(occupiedRailSeats(seats, packets));
  const headSeat = $derived(seats.find((seat) => seat.headSlot));
</script>

<div class="module-seats" class:band data-seat-count={railSeats.length + (staged === undefined || headSeat === undefined ? 0 : 1)}>
  {#if headSeat !== undefined && staged !== undefined}
    <CompanionSeat id="blunder_prevention" module="blunder_prevention" label={headSeat.label} headSlot {band} state={staged.state}>
      {#if staged.state === "checking"}
        <p role="status">Checking the staged move {staged.move}…</p>
      {:else if staged.state === "warning"}
        {@const badge = seatBadge(staged.packet)!}
        <div class="cue-heading"><strong>Before you play {staged.move}</strong><span class="seat-badge" aria-label={`${badge} ${badge === 1 ? "fact" : "facts"}`}>{badge}</span></div>
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
    </CompanionSeat>
  {/if}
  {#each railSeats as seat (seat.module)}
    {@const packet = packets.get(seat.module)}
    {@const badge = seatBadge(packet)}
    {@const open = expanded === seat.module}
    {@const state = packet === undefined ? "door" : packet.items.length === 0 ? "empty" : "filled"}
    <CompanionSeat id={seat.module} module={seat.module} label={seat.label} shortLabel={COMPACT_SEAT_LABELS[seat.module]}
      {band} {open} {state} {badge} onToggle={() => onToggle(seat.module)}>
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
            {#if packet.items.length > 0 && (seat.module === "postcommit_nudge" || seat.module === "compare_coach")}
              {@const action = actions[seat.module]}
              {#if action !== undefined}
                <p>{action.description}</p>
                <div class="seat-actions">
                  <button type="button" class="primary" data-rehearsal-action disabled={action.pending || action.blockedReason !== undefined}
                    aria-describedby={action.pending || action.blockedReason !== undefined ? `${seat.module}-action-status` : action.error !== undefined ? `${seat.module}-action-error` : undefined}
                    onclick={action.onInvoke}>{action.pending ? action.pendingLabel : action.label}</button>
                </div>
                {#if action.pending}<p id={`${seat.module}-action-status`} role="status">{action.pendingLabel} Your recorded lines are kept.</p>
                {:else if action.blockedReason !== undefined}<p id={`${seat.module}-action-status`} class="door-reason">{learnerProse(action.blockedReason)}</p>{/if}
                {#if action.error !== undefined}<p id={`${seat.module}-action-error`} role="alert">{action.error}</p>{/if}
              {/if}
            {/if}
            {#if !seat.proactive && doorBlocked[seat.module] === undefined}<button type="button" class="seat-request secondary" onclick={() => onRequest(seat.module)}>Ask again here</button>{/if}
          {/if}
    </CompanionSeat>
  {/each}
</div>

<style>
  .module-seats{display:grid;gap:.45rem}
  .module-seats.band{display:contents}
  .cue-heading{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
  .seat-badge{min-width:1.3rem;padding:0 .35rem;border-radius:.65rem;background:var(--accent-soft);color:var(--ink);font-size:.72rem;text-align:center;font-variant-numeric:tabular-nums}
  .stated-empty,.door-reason,.unavailable{color:var(--muted)}
  .seat-actions{display:flex;flex-wrap:wrap;gap:.4rem}
</style>
