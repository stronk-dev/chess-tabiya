<script lang="ts">
  import { onMount } from "svelte";

  import { ApiError, type CohortStandingEntry, type CohortStandingView, type DrillClientApi } from "./api.js";
  import { publishedBandInterval, publishedBandLabel } from "./learner-copy.js";

  interface Props {
    api: DrillClientApi;
    classroomId: string;
    learnerId: string;
    role: "teacher" | "learner";
  }
  let { api, classroomId, learnerId, role }: Props = $props();

  let view: CohortStandingView | undefined = $state();
  let loading = $state(true);
  let actionPending = $state(false);
  let error: string | undefined = $state();
  let confirmingPublish = $state(false);
  let windowFrom = $state(new Date().toISOString().slice(0, 16));
  let windowTo = $state("");

  let ownEntry = $derived(view?.entries.find((entry) => entry.learnerId === learnerId));

  onMount(() => { void load(); });

  async function load(): Promise<void> {
    loading = true;
    error = undefined;
    try {
      view = await api.cohortStanding?.(classroomId);
      if (view) {
        windowFrom = new Date(view.standing.windowFrom).toISOString().slice(0, 16);
        windowTo = view.standing.windowTo === null ? "" : new Date(view.standing.windowTo).toISOString().slice(0, 16);
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "RUN_NOT_FOUND") view = undefined;
      else error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  async function mutate(input: Parameters<NonNullable<DrillClientApi["updateCohortStanding"]>>[1]): Promise<void> {
    if (api.updateCohortStanding === undefined) return;
    actionPending = true;
    error = undefined;
    try {
      await api.updateCohortStanding(classroomId, input);
      confirmingPublish = false;
      await load();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      actionPending = false;
    }
  }

  function iso(value: string): string { return new Date(value).toISOString(); }
  function markLabel(mark: CohortStandingEntry["marks"][number]): string {
    return `Beat band ${mark.band} · ${new Date(mark.earnedAt).toLocaleDateString()}`;
  }
</script>

<section class="standing" aria-labelledby="cohort-standing-title">
  <div class="heading-row"><div><p class="eyebrow">Optional shared record</p><h4 id="cohort-standing-title">Classroom standing</h4></div>{#if view?.standing.closedAt}<span class="status">Closed</span>{:else if view}<span class="status">Open</span>{/if}</div>
  <p class="honest">Learners choose whether to publish their own result record to this classroom. Teachers can open and manage the window, but they never publish or appear in the standing.</p>

  {#if loading}
    <p role="status">Loading standing…</p>
  {:else}
    {#if error}<p role="alert" class="error">{error}</p>{/if}
    {#if !view}
      <p>No standing is open for this classroom.</p>
      {#if role === "teacher"}
        <div class="window-form">
          <label>From <input type="datetime-local" bind:value={windowFrom} /></label>
          <label>Until <input type="datetime-local" bind:value={windowTo} /></label>
          <button type="button" disabled={actionPending || !windowFrom} aria-describedby={!windowFrom ? "standing-window-required" : undefined} onclick={() => void mutate({ op: "open", windowFrom: iso(windowFrom), ...(windowTo ? { windowTo: iso(windowTo) } : {}) })}>Open standing</button>
          {#if !windowFrom}<span id="standing-window-required" class="honest">Choose when the result window begins.</span>{/if}
        </div>
      {/if}
    {:else}
      <p class="limitation">{view.limitation}</p>
      <p class="window">Results from {new Date(view.standing.windowFrom).toLocaleString()}{view.standing.windowTo ? ` through ${new Date(view.standing.windowTo).toLocaleString()}` : " onward"}.</p>

      {#if ownEntry === undefined && view.standing.closedAt === null}
        {#if confirmingPublish}
          <div class="confirmation" role="group" aria-labelledby="standing-confirmation-title">
            <strong id="standing-confirmation-title">Publish your record to this classroom?</strong>
            <p>{view.limitation}</p>
            <p>Your record is visible by default. Your rating remains hidden unless you turn it on separately. You can withdraw later.</p>
            <div class="actions"><button type="button" disabled={actionPending} onclick={() => void mutate({ op: "publish" })}>Publish my record</button><button type="button" onclick={() => confirmingPublish = false}>Cancel</button></div>
          </div>
        {:else}
          <button type="button" onclick={() => confirmingPublish = true}>Join this standing</button>
        {/if}
      {:else if ownEntry}
        <div class="actions" aria-label="Your standing visibility">
          <button type="button" disabled={actionPending} onclick={() => void mutate({ op: ownEntry.record ? "hideRecord" : "showRecord" })}>{ownEntry.record ? "Hide my record" : "Show my record"}</button>
          <button type="button" disabled={actionPending} onclick={() => void mutate({ op: ownEntry.rating ? "hideRating" : "showRating" })}>{ownEntry.rating ? "Hide my rating" : "Show my rating when publishable"}</button>
          <button type="button" disabled={actionPending} onclick={() => void mutate({ op: "withdraw" })}>Withdraw</button>
        </div>
      {/if}

      <div class="table-scroll"><table>
        <thead><tr><th>Learner</th><th>Marks</th><th>Record</th><th>By opponent band</th><th>Rating</th></tr></thead>
        <tbody>{#each view.entries as entry}<tr class:self={entry.learnerId === learnerId}>
          <th scope="row">@{entry.handle}</th>
          <td>{#each entry.marks as mark}<span class={`mark ${mark.mark}`}>{markLabel(mark)}</span>{:else}<span class="muted">None recorded</span>{/each}</td>
          <td>{entry.record ? `${entry.record.wins}–${entry.record.draws}–${entry.record.losses}` : "Hidden"}{#if entry.record}<small>{entry.record.games} games · {entry.record.abandoned} abandoned</small>{/if}</td>
          <td>{#if entry.record?.byOpponentBand.length}{#each entry.record.byOpponentBand as split}<span class="split">{split.opponentBand}: {split.wins}–{split.draws}–{split.losses}</span>{/each}{:else}<span class="muted">Not shown</span>{/if}</td>
          <td>{#if entry.rating?.pointEstimate !== undefined}{publishedBandLabel(entry.rating.pointEstimate)}<small>Interval {publishedBandInterval(entry.rating)}</small>{:else}<span class="muted">Not shown</span>{/if}</td>
        </tr>{:else}<tr><td colspan="5">No learner has published an entry.</td></tr>{/each}</tbody>
      </table></div>
      <ul class="standing-cards" aria-label="Classroom standing">
        {#each view.entries as entry}
          <li class:self={entry.learnerId === learnerId}>
            <h5>@{entry.handle}</h5>
            <dl>
              <div><dt>Marks</dt><dd>{#each entry.marks as mark}<span class={`mark ${mark.mark}`}>{markLabel(mark)}</span>{:else}<span class="muted">None recorded</span>{/each}</dd></div>
              <div><dt>Record</dt><dd>{entry.record ? `${entry.record.wins}–${entry.record.draws}–${entry.record.losses}` : "Hidden"}{#if entry.record}<small>{entry.record.games} games · {entry.record.abandoned} abandoned</small>{/if}</dd></div>
              <div><dt>By opponent band</dt><dd>{#if entry.record?.byOpponentBand.length}{#each entry.record.byOpponentBand as split}<span class="split">{split.opponentBand}: {split.wins}–{split.draws}–{split.losses}</span>{/each}{:else}<span class="muted">Not shown</span>{/if}</dd></div>
              <div><dt>Rating</dt><dd>{#if entry.rating?.pointEstimate !== undefined}{publishedBandLabel(entry.rating.pointEstimate)}<small>Interval {publishedBandInterval(entry.rating)}</small>{:else}<span class="muted">Not shown</span>{/if}</dd></div>
            </dl>
          </li>
        {:else}
          <li>No learner has published an entry.</li>
        {/each}
      </ul>

      {#if role === "teacher" && view.standing.closedAt === null}
        <details><summary>Standing window</summary><div class="window-form"><label>From <input type="datetime-local" bind:value={windowFrom} /></label><label>Until <input type="datetime-local" bind:value={windowTo} /></label><button type="button" disabled={actionPending || !windowFrom} onclick={() => void mutate({ op: "window", windowFrom: iso(windowFrom), ...(windowTo ? { windowTo: iso(windowTo) } : {}) })}>Update window</button><button type="button" disabled={actionPending} onclick={() => void mutate({ op: "close" })}>Close standing</button></div></details>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .standing { margin-top: 1.25rem; padding: 1rem; border: 1px solid var(--line); border-radius: .8rem; background: color-mix(in srgb, var(--panel) 65%, transparent); }
  .heading-row, .actions, .window-form { display: flex; align-items: center; flex-wrap: wrap; gap: .6rem; }
  .heading-row { justify-content: space-between; }
  h4, p { margin-top: 0; }
  .eyebrow { margin-bottom: .25rem; color: var(--muted); font: 700 .68rem/1.2 ui-monospace, monospace; text-transform: uppercase; }
  .status { padding: .25rem .5rem; border-radius: 999px; background: var(--paper); font-size: .72rem; }
  .limitation, .confirmation { padding: .75rem; border-left: .25rem solid var(--warning); background: var(--paper); }
  .window, .muted, small, .honest { color: var(--muted); }
  .window-form label { display: grid; gap: .25rem; }
  .confirmation { margin-bottom: 1rem; }
  .table-scroll { overflow-x: auto; margin-top: 1rem; }
  .standing-cards { display: none; }
  table { width: 100%; border-collapse: collapse; min-width: 48rem; }
  th, td { padding: .65rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
  thead th { color: var(--muted); font-size: .7rem; text-transform: uppercase; }
  tbody tr.self { background: color-mix(in srgb, var(--accent) 8%, transparent); }
  td small { display: block; margin-top: .2rem; }
  .mark { display: inline-flex; justify-content: center; margin: .1rem; padding: .2rem .45rem; border-radius: 999px; font-size: .78rem; overflow-wrap: anywhere; }
  .bronze { background: color-mix(in srgb, var(--danger) 12%, var(--paper)); } .silver { background: color-mix(in srgb, var(--muted) 14%, var(--paper)); } .gold { background: color-mix(in srgb, var(--warning) 16%, var(--paper)); }
  .split { display: block; white-space: nowrap; }
  details { margin-top: 1rem; }
  summary { cursor: pointer; margin-bottom: .75rem; }
  .error { color: var(--ink); }
  @media (max-width: 719px) {
    .standing { padding: .75rem; }
    .table-scroll { display: none; }
    .standing-cards { display: grid; gap: .65rem; margin: 1rem 0 0; padding: 0; list-style: none; }
    .standing-cards > li { min-width: 0; padding: .75rem; border: 1px solid var(--line); border-radius: .65rem; background: var(--paper); }
    .standing-cards > li.self { border-color: var(--accent); }
    .standing-cards h5 { margin: 0 0 .55rem; font: 600 1rem var(--display-font); overflow-wrap: anywhere; }
    .standing-cards dl { display: grid; gap: .45rem; margin: 0; }
    .standing-cards dl div { display: grid; grid-template-columns: minmax(6.5rem, auto) minmax(0, 1fr); gap: .6rem; }
    .standing-cards dt { color: var(--muted); font-size: .7rem; text-transform: uppercase; }
    .standing-cards dd { min-width: 0; margin: 0; overflow-wrap: anywhere; }
  }
</style>
