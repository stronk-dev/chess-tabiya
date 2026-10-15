<script lang="ts">
  import { tick, untrack } from "svelte";
  // rfc/module-registration.md §2.6/§3 + rfc/play-composition.md §4 — the companion region's module
  // seats. A seat renders only what one strict-parsed, digest-bound packet delivered: collapsed as a
  // badged row, expanded as its card, or quiet when honestly empty. At most one seat is expanded;
  // every change is companion-internal, never stage layout. The head slot belongs to the one
  // board-adjacent cue (blunder_prevention) and appears only while a staged move is held.
  import PresentedEvidence from "./evidence/PresentedEvidence.svelte";
  import RehearsalAction from "./RehearsalAction.svelte";
  import CompanionSeat from "./CompanionSeat.svelte";
  import type { ParsedModulePacket } from "./module-query-response.js";
  import { COMPACT_SEAT_LABELS, occupiedRailSeats, seatBadge, unavailableSentences, type MissingAttemptRecovery, type ModuleSeatActions, type PlaySeatModule, type SeatDeclaration, type StagedCue } from "./module-seats.js";

  interface Props {
    seats: readonly SeatDeclaration[];
    packets: ReadonlyMap<PlaySeatModule, ParsedModulePacket>;
    pending: ReadonlySet<PlaySeatModule>;
    failed: ReadonlySet<PlaySeatModule>;
    expanded: PlaySeatModule | undefined;
    band?: boolean;
    campaignEncounter?: boolean;
    /** Why an on-request door cannot open right now (e.g. no subject yet); absent when it can. */
    doorBlocked: Readonly<Partial<Record<PlaySeatModule, string>>>;
    staged: StagedCue | undefined;
    actions?: ModuleSeatActions;
    emptyRewindActions?: Readonly<Partial<Record<PlaySeatModule, import("./module-seats.js").ModuleSeatAction>>>;
    emptyRewindUnavailable?: string | undefined;
    missingAttemptRecovery?: MissingAttemptRecovery | undefined;
    onKeepPlaying?: ((module: PlaySeatModule, packet: ParsedModulePacket) => void) | undefined;
    keepPlayingBlocked?: string | undefined;
    onToggle: (module: PlaySeatModule) => void;
    onRequest: (module: PlaySeatModule) => void;
    onConfirmStaged: () => void;
    onReviseStaged: () => void;
    onFocusSquares?: ((squares: readonly string[] | undefined) => void) | undefined;
  }
  let { seats, packets, pending, failed, expanded, band = false, campaignEncounter = false, doorBlocked, staged, actions = {}, emptyRewindActions = {}, emptyRewindUnavailable, missingAttemptRecovery, onKeepPlaying, keepPlayingBlocked, onToggle, onRequest, onConfirmStaged, onReviseStaged, onFocusSquares }: Props = $props();

  const NUDGE_HEADLINE = "The consequence exposed something concrete.";
  const NUDGE_CLOSING = "Your played line stays preserved.";

  const railSeats = $derived(occupiedRailSeats(seats, packets, pending, failed));
  const headSeat = $derived(seats.find((seat) => seat.headSlot));

  let frame: HTMLDivElement;
  const expandedPacket = $derived(expanded === undefined ? undefined : packets.get(expanded));
  const expandedPending = $derived(expanded !== undefined && pending.has(expanded));
  const expandedFailed = $derived(expanded !== undefined && failed.has(expanded));
  const expandedRecovery = $derived(expanded === "compare_coach" ? missingAttemptRecovery : undefined);
  $effect(() => {
    const module = expanded, tablet = band;
    // Observe only this seat's current delivery, never other packets or the user's scroll.
    void expandedPacket; void expandedPending; void expandedFailed; void expandedRecovery;
    if (module === undefined) return;
    let current = true;
    void tick().then(() => {
      if (!current || !frame?.isConnected) return;
      const seat = frame.querySelector<HTMLElement>(`[data-module="${module}"]`);
      const card = seat?.querySelector<HTMLElement>(".seat-card");
      if (!seat || !card || card.hidden || seat.getClientRects().length === 0) return;
      const region = tablet ? card : frame.closest<HTMLElement>(".companion-section");
      if (!region || region.clientHeight === 0 || getComputedStyle(region).overflowY !== "auto") return;
      const bounds = region.getBoundingClientRect();
      const actions = card.querySelector("[data-keep-playing]")?.closest<HTMLElement>(".seat-actions");
      if (actions) {
        const box = actions.getBoundingClientRect();
        // Leave a small inset: fractional layout and integer scrollTop rounding must not
        // leave even the last border pixel of a recovery control behind the clipping edge.
        const top = bounds.top + region.clientTop + 4, bottom = bounds.top + region.clientTop + region.clientHeight - 4;
        if (box.bottom > bottom) region.scrollTop += box.bottom - bottom;
        else if (box.top < top) region.scrollTop += box.top - top;
      } else if (!tablet) region.scrollTop += seat.getBoundingClientRect().top - bounds.top - region.clientTop;
      // Only the bounded region scrolls. No focus change, page scroll, request or remount.
    });
    return () => { current = false; };
  });

  let recoveryFocus: { readonly module: PlaySeatModule; readonly button: HTMLButtonElement } | undefined;
  $effect.pre(() => {
    const failures = failed, requests = pending;
    untrack(() => {
      const focus = recoveryFocus;
      if (focus === undefined || failures.has(focus.module) || requests.has(focus.module)) return;
      recoveryFocus = undefined;
      if (document.activeElement !== focus.button) return;
      const selector = focus.button.closest(".module-seat")?.querySelector<HTMLButtonElement>(".seat-row");
      void tick().then(() => {
        if (document.activeElement !== document.body && document.activeElement !== focus.button) return;
        if (selector?.isConnected) selector.focus();
      });
    });
  });

  function retry(module: PlaySeatModule, button: HTMLButtonElement): void {
    if (pending.has(module) || !failed.has(module)) return;
    recoveryFocus = { module, button };
    onRequest(module);
  }
</script>

<div bind:this={frame} class="module-seats" class:band data-seat-count={railSeats.length + (staged === undefined || headSeat === undefined ? 0 : 1)}>
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
    {@const badge = pending.has(seat.module) || failed.has(seat.module) ? null : seatBadge(packet)}
    {@const open = expanded === seat.module}
    {@const state = packet === undefined ? "door" : packet.items.length === 0 ? "empty" : "filled"}
    <CompanionSeat id={seat.module} module={seat.module} label={seat.label} shortLabel={COMPACT_SEAT_LABELS[seat.module]}
      {band} {open} {state} {badge} onToggle={() => onToggle(seat.module)}>
          {#if pending.has(seat.module)}
            <p role="status">Asking…</p>
          {:else if failed.has(seat.module)}
            <p role="alert">This help could not be loaded. Nothing was checked.</p>
          {:else if packet === undefined}
            {#if doorBlocked[seat.module] !== undefined}
              <p class="door-reason">{doorBlocked[seat.module]}</p>
              {#if seat.module === "compare_coach" && missingAttemptRecovery !== undefined}
                {@const recovery = missingAttemptRecovery}
                <div data-missing-attempt-recovery>
                  {#snippet continuePlaying()}
                    <button type="button" data-keep-playing disabled={recovery.keepPlayingBlocked !== undefined}
                      aria-describedby={recovery.keepPlayingBlocked === undefined ? undefined : "compare-missing-continue-status"}
                      onclick={recovery.onKeepPlaying}>Keep playing</button>
                  {/snippet}
                  {#if recovery.rewind !== undefined}
                    <RehearsalAction action={recovery.rewind} id="compare-missing-attempt" {campaignEncounter} empty before={continuePlaying} />
                  {:else}
                    <div class="seat-actions">{@render continuePlaying()}</div>
                    {#if recovery.rewindUnavailable !== undefined}<p class="door-reason">{recovery.rewindUnavailable}</p>{/if}
                  {/if}
                  {#if recovery.keepPlayingBlocked !== undefined}<p id="compare-missing-continue-status" class="door-reason">{recovery.keepPlayingBlocked}</p>{/if}
                </div>
              {/if}
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
            {#if packet.items.length === 0 && packet.empty !== null && (packet.empty.kind === "stated_absence" || packet.empty.kind === "unavailable_source")}
              {#snippet keepPlaying()}
              {#if onKeepPlaying !== undefined}
                <button type="button" data-keep-playing disabled={keepPlayingBlocked !== undefined}
                  aria-describedby={keepPlayingBlocked === undefined ? undefined : `${seat.module}-keep-playing-status`}
                  onclick={() => onKeepPlaying?.(seat.module, packet)}>Keep playing</button>
              {/if}
              {/snippet}
              {@const action = emptyRewindActions[seat.module]}
              {#if action !== undefined}<RehearsalAction {action} id={`${seat.module}-empty`} {campaignEncounter} empty before={keepPlaying} />
              {:else}<div class="seat-actions">{@render keepPlaying()}</div>
                {#if emptyRewindUnavailable !== undefined}<p class="door-reason">{emptyRewindUnavailable}</p>{/if}
              {/if}
              {#if onKeepPlaying !== undefined && keepPlayingBlocked !== undefined}<p id={`${seat.module}-keep-playing-status`} class="door-reason">{keepPlayingBlocked}</p>{/if}
            {/if}
            {#each unavailableSentences(packet) as sentence}<p class="unavailable">{sentence}</p>{/each}
            {#if seat.module === "postcommit_nudge" && packet.items.length > 0}<p>{NUDGE_CLOSING}</p>{/if}
            {#if packet.items.length > 0 && (seat.module === "postcommit_nudge" || seat.module === "compare_coach")}
              {@const action = actions[seat.module]}
              {#if action !== undefined}
                <RehearsalAction {action} id={seat.module} {campaignEncounter} />
              {/if}
            {/if}
            {#if !seat.proactive && doorBlocked[seat.module] === undefined}<button type="button" class="seat-request secondary" onclick={() => onRequest(seat.module)}>Ask again here</button>{/if}
          {/if}
          {#if failed.has(seat.module)}
            <button type="button" aria-disabled={pending.has(seat.module)} onclick={(event) => retry(seat.module, event.currentTarget)}>Try again</button>
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
