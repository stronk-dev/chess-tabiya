<script lang="ts">
  import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
  import { comparisonEngineTrajectory, comparisonNarrative, comparisonStrips, materialBalanceAt, packAbsentEvidenceRef, positionStructureEvidence, structuralReading, type BranchComparison, type ComparisonEvidenceEntry, type DrillRun, type LineMembershipEntry, type ObjectiveTimelineEntry } from "@chess-tabiya/runtime";
  import type { DrawShape } from "@lichess-org/chessground/draw";
  import { onMount } from "svelte";
  import Chessboard from "./Chessboard.svelte";
  import HonestControl from "./HonestControl.svelte";
  import { HUMAN_MODEL_RUNG_DISCLAIMER } from "./opponent-copy.js";
  import StatusAnnouncement from "./StatusAnnouncement.svelte";
  import { displayedLastMove, type StartSide } from "./board-model.js";
  import { modalBoundary } from "./modal-boundary.js";
  import {
    COMPARISON_CELL_FLOOR_REM,
    defaultComparisonZoom,
    type ComparisonZoomBand,
  } from "./compare-geometry.js";
  import { renderEvidenceRef } from "./evidence-sentences.js";
  import { resistanceModeLabel, resistanceSentences } from "./outcome-presentation.js";
  import { comparisonNode, evidencePayloads } from "./screen-model.js";
  import { renderStructuralObservation } from "./structural-sentences.js";

  interface Props {
    run: DrillRun;
    pack?: DrillPackDefinition | undefined;
    comparison: BranchComparison;
    startSide: StartSide;
    step: number;
    onStep: (step: number) => void;
    onClose: () => void;
    onVoice?: (() => Promise<string>) | undefined;
    onReplayResistance?: ((targetElo: 1000 | 1400 | 1800 | 2200) => void | Promise<void>) | undefined;
  }
  const CANDIDATE_BRUSHES = ["green", "blue", "yellow", "red"] as const;
  let { run, pack, comparison, startSide, step, onStep, onClose, onVoice, onReplayResistance }: Props = $props();
  let maxStep = $derived(comparison.rows.length);
  let heading: HTMLHeadingElement;
  let inspectorOpen = $state(false);
  let inspectorInvoker: HTMLButtonElement | undefined;
  let personaText = $state<string | undefined>();
  // Comparison identity is fixed for this mounted screen; the learner owns later changes.
  // svelte-ignore state_referenced_locally
  let replayBand: 1000 | 1400 | 1800 | 2200 = $state(
    run.opponentPolicy.targetElo === 1000 || run.opponentPolicy.targetElo === 1400 || run.opponentPolicy.targetElo === 1800 || run.opponentPolicy.targetElo === 2200
      ? run.opponentPolicy.targetElo
      : 1400,
  );
  // Comparison identity is fixed for this mounted screen; user changes own the zoom afterwards.
  // svelte-ignore state_referenced_locally
  let zoom: ComparisonZoomBand = $state(defaultComparisonZoom(comparison.columns.length));
  let strips = $derived(comparisonStrips(run, comparison));
  let narrative = $derived(comparisonNarrative(run, comparison, strips));
  let trajectories = $derived(Object.fromEntries(comparison.columns.map((column) => [column.branchId, comparisonEngineTrajectory(comparison, column.branchId)])));
  let evaluationRows = $derived.by(() => {
    const offsets = new Set<number>();
    for (const column of comparison.columns) {
      for (const entry of trajectories[column.branchId] ?? []) offsets.add(entry.plyOffset);
    }
    return [...offsets].sort((left, right) => left - right).map((plyOffset) => ({
      plyOffset,
      entries: Object.freeze(Object.fromEntries(comparison.columns.map((column) => [
        column.branchId,
        (trajectories[column.branchId] ?? []).find((entry) => entry.plyOffset === plyOffset),
      ]))),
    }));
  });
  let payloads = $derived(evidencePayloads(run));
  let forkNode = $derived(run.nodes.find((node) => node.id === comparison.forkNodeId));
  let candidates = $derived.by(() => comparison.columns.flatMap((column, index) => {
    const decision = comparison.consequences[column.branchId]?.decision;
    const node = decision === null || decision === undefined ? undefined : run.nodes.find((candidate) => candidate.id === decision.nodeId);
    if (node === undefined || node.moveUci === null) return [];
    const displayed = displayedLastMove(node.fen, node.moveUci);
    if (displayed === undefined) return [];
    return [{
      branchId: column.branchId,
      label: column.label,
      intent: run.branches.find((branch) => branch.id === column.branchId)?.intent,
      moveSan: node.moveSan ?? node.moveUci,
      actor: node.actor,
      index,
      from: displayed[0],
      to: displayed[1],
    }];
  }));
  let candidateOverlays = $derived(candidates.map((candidate): DrawShape => ({
    orig: candidate.from,
    dest: candidate.to,
    brush: CANDIDATE_BRUSHES[candidate.index % CANDIDATE_BRUSHES.length]!,
    label: { text: String(candidate.index + 1) },
  })));
  let currentRow = $derived(step === 0 ? undefined : comparison.rows[step - 1]);
  let currentNodes = $derived(comparison.columns.flatMap((column) => {
    const node = comparisonNode(run, comparison, step, column.branchId);
    return node === undefined ? [] : [{ column, node }];
  }));
  let positionGroups = $derived.by(() => {
    const groupedBranchIds = step === 0
      ? [comparison.columns.map((column) => column.branchId)]
      : (currentRow?.groups ?? []);
    const presentBranchIds = new Set(groupedBranchIds.flat());
    const groups = groupedBranchIds.map((branchIds) => {
      const columns = branchIds.flatMap((branchId) => {
        const column = comparison.columns.find((candidate) => candidate.branchId === branchId);
        return column === undefined ? [] : [column];
      });
      const representative = columns[0];
      return {
        key: `position:${branchIds.join(":")}`,
        branchIds,
        columns,
        node: representative === undefined
          ? undefined
          : comparisonNode(run, comparison, step, representative.branchId),
      };
    });
    const ended = comparison.columns
      .filter((column) => !presentBranchIds.has(column.branchId))
      .map((column) => ({
        key: `ended:${column.branchId}`,
        branchIds: [column.branchId],
        columns: [column],
        node: undefined,
      }));
    return [...groups, ...ended];
  });

  function timeline(entries: readonly ObjectiveTimelineEntry[]) {
    return entries.map((entry) => {
      if (entry.evidenceRefs.length === 0) throw new TypeError(`Comparison objective transition at event ${entry.eventSeq} has no evidence references`);
      return { ...entry, grounds: entry.evidenceRefs.map((ref) => renderEvidenceRef(ref, pack, payloads)) };
    });
  }
  function score(entry: ComparisonEvidenceEntry): string {
    if (entry.score.kind === "mate") return `M${entry.score.movesTo >= 0 ? "+" : ""}${entry.score.movesTo}`;
    const pawns = entry.score.value / 100;
    return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
  }
  function outcomeAt(nodeId: string): string | undefined {
    const event = [...run.events]
      .reverse()
      .find(
        (candidate) =>
          candidate.type === "outcome.reached" && candidate.data.nodeId === nodeId,
      );
    return event?.type === "outcome.reached" ? event.data.outcome : undefined;
  }
  function actorLabel(actor: "user" | "opponent" | "system"): string {
    return actor === "user" ? "You" : "Opponent";
  }
  function objectiveStateLabel(state: import("@chess-tabiya/runtime").ObjectiveState): string {
    switch (state) {
      case "active": return "The objective is still open.";
      case "preserved": return "This attempt kept the objective intact.";
      case "degraded": return "This attempt made the objective harder.";
      case "failed": return "This attempt did not reach the objective.";
      case "achieved": return "This attempt reached the objective.";
      case "transitioned": return "This attempt reached the next objective stage.";
    }
  }
  function materialLabel(fen: string): string {
    const value = materialBalanceAt(fen, startSide);
    return value === 0 ? "Level" : value > 0 ? `You +${value}` : `Opponent +${Math.abs(value)}`;
  }
  function branchLabel(branchId: string): string {
    return comparison.columns.find((column) => column.branchId === branchId)?.label ?? branchId;
  }
  function recordedPathSentence(): string {
    if (step === 0) return "All attempts share this fork position.";
    const groups = currentRow?.groups ?? [];
    const shared = groups.filter((group) => group.length > 1);
    if (shared.length === 0) return "The recorded paths are separate at this ply.";
    return `${shared.map((group) => group.map(branchLabel).join(" and ")).join("; ")} still share the same recorded continuation.`;
  }
  function positionSentence(): string {
    if (currentNodes.length < comparison.columns.length) return "At least one branch has already ended at this aligned ply.";
    const groups = new Map<string, string[]>();
    for (const { column, node } of currentNodes) groups.set(node.transposeKey, [...(groups.get(node.transposeKey) ?? []), column.label]);
    if (groups.size === 1) return step === 0 ? "Same starting position." : "The branches have re-converged to the same chess position.";
    const shared = [...groups.values()].filter((group) => group.length > 1);
    return shared.length === 0 ? "The chess positions are different at this ply." : `${shared.map((group) => group.join(" and ")).join("; ")} have re-converged; the other positions differ.`;
  }
  function theorySentence(entry: LineMembershipEntry): string {
    if (entry.verdict === "on_line") return `Ply ${entry.ply}: stayed on the authored line${entry.insideBoundary ? "" : " beyond its feedback boundary"}.`;
    if (entry.verdict === "classified_deviation") return `Ply ${entry.ply}: the authored pack classifies this as ${entry.deviationClass?.replaceAll("_", " ") ?? "a deviation"}.`;
    return `Ply ${entry.ply}: the authored line does not classify this move.`;
  }
  function openInspector(event: MouseEvent): void {
    inspectorInvoker = event.currentTarget as HTMLButtonElement;
    inspectorOpen = true;
  }
  function closeInspector(): void {
    inspectorOpen = false;
    queueMicrotask(() => inspectorInvoker?.focus());
  }
  function inspectorKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") closeInspector();
  }
  onMount(() => heading?.focus());
</script>

<section class="compare" aria-labelledby="compare-title">
  <header>
    <div><p>Branch comparison</p><h2 id="compare-title" tabindex="-1" bind:this={heading}>Same decision, {comparison.columns.length === 2 ? "two" : comparison.columns.length} consequences.</h2></div>
    <div class="header-actions">
      <button type="button" onclick={openInspector}>Evidence inspector</button>
      <button type="button" onclick={onClose}>Close comparison</button>
    </div>
  </header>

  <div class="zoom-control" aria-label="Comparison detail">
    <button type="button" aria-pressed={zoom === "far"} onclick={() => (zoom = "far")}>Overview</button>
    <button type="button" aria-pressed={zoom === "mid"} onclick={() => (zoom = "mid")}>Summary</button>
    <button type="button" aria-pressed={zoom === "near"} onclick={() => (zoom = "near")}>Boards</button>
  </div>

  {#if forkNode && candidates.length > 0}
    <section class="divergence" aria-labelledby="divergence-title">
      <div class="fork-board"><Chessboard fen={forkNode.fen} {startSide} overlays={candidateOverlays} disabled onMove={() => {}} /></div>
      <div>
        <p class="eyebrow">One decision</p>
        <h3 id="divergence-title">Where the attempts split</h3>
        <ol>
          {#each candidates as candidate}
            <li>
              <span class="candidate-number">{candidate.index + 1}</span>
              <div><strong>{candidate.label} · {candidate.moveSan}</strong><small>{actorLabel(candidate.actor)} moved</small><p>{candidate.intent ?? "No intent was recorded for this attempt."}</p></div>
            </li>
          {/each}
        </ol>
      </div>
    </section>
  {/if}

  <section class="narrative" aria-label="Grounded comparison">
    <div class="narrative-heading"><div><p class="eyebrow">Grounded comparison</p><h3>What the recorded attempts show</h3></div><button type="button" onclick={openInspector}>Inspect the recorded facts</button></div>
    <p>{recordedPathSentence()}</p><p>{positionSentence()}</p>
  </section>

  <aside class="alignment" aria-label="Aligned position relationship"><p>{recordedPathSentence()}</p><p>{positionSentence()}</p></aside>

  <StatusAnnouncement message={`Comparison position ${step} of ${maxStep}`} />
  <div
    class="boards"
    data-zoom={zoom}
    style={`--branches:${positionGroups.length};--cell-floor:${COMPARISON_CELL_FLOOR_REM[zoom]}rem`}
  >
    {#each positionGroups as group (group.key)}
      <article class:absent={!group.node} class:shared={group.columns.length > 1} data-branch-ids={group.branchIds.join(" ")}>
        <h3>{group.columns.map((column) => `${column.label}${column.origin === "simulated" ? " · preview line" : ""}`).join(" + ")}</h3>
        {#if group.columns.length > 1}<p class="group-marker">Shared recorded position · {group.columns.length} attempts</p>{/if}
        {#if group.columns.length === 1 && run.branches.find((branch) => branch.id === group.branchIds[0])?.intent}<p class="branch-intent">Intent: {run.branches.find((branch) => branch.id === group.branchIds[0])?.intent}</p>{/if}
        {#if group.node}
          {@const outcome = outcomeAt(group.node.id)}
          <p class="cell-state">{objectiveStateLabel(group.node.objectiveState)}{outcome === undefined ? "" : ` ${outcome === "checkmate" ? "The game ended in checkmate." : `The recorded outcome is ${outcome.replaceAll("_", " ")}.`}`}</p>
          {#if zoom === "mid" || zoom === "near"}
            <dl>
              <div><dt>Last move</dt><dd>{group.node.moveSan ?? "No move"}</dd></div>
              <div><dt>Moved by</dt><dd>{actorLabel(group.node.actor)}</dd></div>
              <div><dt>Material</dt><dd>{materialLabel(group.node.fen)}</dd></div>
              <div><dt>Half-moves played</dt><dd>{group.node.ply}</dd></div>
              <div><dt>Checkpoints</dt><dd>{group.node.checkpointRefs.length}</dd></div>
            </dl>
          {/if}
          {#if zoom === "near"}<Chessboard fen={group.node.fen} {startSide} lastMove={group.node.moveUci} disabled onMove={() => {}} />{/if}
        {:else}<div class="line-ended">Line ended</div>{/if}
      </article>
    {/each}
  </div>

  <div class="stepper">
    <HonestControl disabled={step === 0} reasonId="compare-previous-unavailable" reason="The comparison is already at its first aligned position.">
      {#snippet children(describedBy)}<button type="button" disabled={step === 0} aria-describedby={describedBy} onclick={() => onStep(step - 1)}>← Previous</button>{/snippet}
    </HonestControl>
    <span>Position {step} / {maxStep}</span>
    <HonestControl disabled={step === maxStep} reasonId="compare-next-unavailable" reason="The comparison is already at its last aligned position.">
      {#snippet children(describedBy)}<button type="button" disabled={step === maxStep} aria-describedby={describedBy} onclick={() => onStep(step + 1)}>Next →</button>{/snippet}
    </HonestControl>
  </div>

  {#if onReplayResistance}
    <section class="replay-resistance" aria-labelledby="replay-resistance-title">
      <div><p class="eyebrow">Try the same decision again</p><h3 id="replay-resistance-title">Change the practical resistance, not the recorded attempts.</h3><p>Your comparison stays saved. You choose the next rung; Tabiya never changes it silently.</p></div>
      <label>Human-like rung <select bind:value={replayBand}><option value={1000}>First rung · 1000</option><option value={1400}>Steady · 1400</option><option value={1800}>Testing · 1800</option><option value={2200}>Top measured rung · 2200</option></select></label>
      <button type="button" onclick={() => void onReplayResistance?.(Number(replayBand) as 1000 | 1400 | 1800 | 2200)}>Start a new replay</button>
      <small>{HUMAN_MODEL_RUNG_DISCLAIMER}</small>
    </section>
  {/if}

  <section class="results" aria-label="Per-branch consequences">
    {#each comparison.columns as column}
      {@const consequence = comparison.consequences[column.branchId]}
      {@const entries = timeline(comparison.objectiveTimelines[column.branchId] ?? [])}
      <article>
        <h3>{column.label}</h3>
        <p>{consequence?.decision ? `Decision: ${consequence.decision.moveSan} at +${consequence.decision.plyOffset}.` : "No moves on this branch yet."}</p>
        {#if consequence}<p>{objectiveStateLabel(consequence.objectiveState)}</p>{/if}
        {#each consequence?.checkpointsMissed ?? [] as checkpoint}
          {@const absentRef = packAbsentEvidenceRef(checkpoint)}
          <p data-evidence-ref={absentRef}>{renderEvidenceRef(absentRef, pack).text}</p>
        {/each}
        <span class="validated-timeline" aria-hidden="true">{entries.length} recorded objective changes</span>
      </article>
    {/each}
  </section>

  {#if inspectorOpen}
    <div class="inspector-backdrop" role="presentation">
      <div class="comparison-inspector" role="dialog" aria-modal="true" aria-labelledby="comparison-inspector-title" tabindex="-1" use:modalBoundary onkeydown={inspectorKeydown}>
        <header>
          <div><p>Evidence inspector</p><h3 id="comparison-inspector-title">Recorded facts behind this comparison</h3></div>
          <button type="button" onclick={closeInspector}>Return to comparison</button>
        </header>
        <p class="inspector-intro">Raw evaluations, source labels, objective-state records and detector output stay here. They are evidence for deliberate analysis, not the comparison summary.</p>
        <section aria-label="Recorded comparison narrative">
          {#each narrative.groups as group}<div>{#each group.sentences as sentence}<p>{sentence}</p>{/each}</div>{/each}
          {#if onVoice}<button type="button" onclick={() => void onVoice().then((text) => personaText = text)}>Revoice grounded comparison</button>{/if}
          {#if personaText}<p>{personaText}</p>{/if}
        </section>
        {#if comparison.machineFeedback === "available"}
          <section class="evaluation-axis" aria-label="Recorded engine evaluation" data-evidence-consumer="compare.engine_trajectory">
            <h4>Recorded engine evaluation on one shared ply axis</h4>
            <div class="evaluation-table-wrap">
              <table>
                <thead><tr><th scope="col">Position</th>{#each comparison.columns as column}<th scope="col">{column.label}</th>{/each}</tr></thead>
                <tbody>
                  {#each evaluationRows as row}
                    <tr>
                      <th scope="row">{#if row.plyOffset === 0}<span class="fork-marker">Fork</span>{:else}+{row.plyOffset}{/if}</th>
                      {#each comparison.columns as column}
                        {@const entry = row.entries[column.branchId]}
                        <td class="evidence-cell" data-ply-offset={row.plyOffset}>{#if entry}<span class="evidence-entry">{score(entry)}</span>{:else}<span class="no-record">No record</span>{/if}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </section>
        {/if}
        <section class="strip-band" aria-label="Recorded per-branch differences" data-evidence-consumer="compare.structure_strip">
          <h4>Recorded differences by branch</h4>
          {#each comparison.columns as column}
            <article><strong>{column.label}</strong>
              <details><summary>Structure and timing facts</summary>{#each strips[column.branchId]?.structure ?? [] as entry}<p>+{entry.plyOffset}: {entry.observation ? renderStructuralObservation(entry.observation) : entry.sentence} {entry.attribution}.</p>{/each}{#each strips[column.branchId]?.timing ?? [] as entry}<p>+{entry.plyOffset}: {entry.sentence} {entry.attribution}.</p>{/each}</details>
              <details><summary>Piece routes</summary>{#each strips[column.branchId]?.routes ?? [] as route}<p>{route.pieceId}: {route.squares.join(" → ")}</p>{:else}<p>No piece route past the fork.</p>{/each}</details>
            </article>
          {/each}
        </section>
        <section class="inspector-results" aria-label="Per-branch evidence records">
          {#each comparison.columns as column}
            {@const consequence = comparison.consequences[column.branchId]}
            {@const entries = timeline(comparison.objectiveTimelines[column.branchId] ?? [])}
            <article><h4>{column.label}</h4>
              <p>Recorded objective state: {consequence?.objectiveState ?? "unknown"}.</p>
              {#if consequence}<p>Opponent: {resistanceModeLabel(consequence.resistance.requested.mode)}{consequence.resistance.requested.targetElo === undefined ? "" : ` · target ${consequence.resistance.requested.targetElo}`}.</p>{/if}
              {#each entries as entry}<div><strong>{entry.from} → {entry.to}</strong>{#each entry.grounds as ground}<p>{ground.sourceLabel}: {ground.text}</p>{/each}</div>{/each}
              {#if consequence}<details><summary>Opponent and authored-line context</summary>{#each resistanceSentences(run, column.leafNodeId, pack) as sentence}<p>{sentence}</p>{/each}{#each consequence.theory ?? [] as entry}<p>{theorySentence(entry)}</p>{:else}<p>No authored line is attached to this comparison.</p>{/each}</details>
                <details data-evidence-consumer="inspector.position_structure"><summary>Position structure facts</summary>{#each positionStructureEvidence(structuralReading(run.nodes.find((node) => node.id === column.leafNodeId)?.fen ?? run.nodes[0]!.fen)) as observation}<p>{renderStructuralObservation(observation)}</p>{/each}</details>{/if}
            </article>
          {/each}
        </section>
      </div>
    </div>
  {/if}
</section>

<style>
  .compare{width:min(96rem,calc(100% - 2rem));height:100%;margin:auto;padding:1rem 0;overflow:auto}.compare>header,.stepper,.comparison-inspector>header{display:flex;justify-content:space-between;align-items:center;gap:1rem}.header-actions{display:flex;gap:.5rem;flex-wrap:wrap}.compare header p{margin:0;color:var(--accent);font:700 .68rem ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}h2{margin:.2rem 0 0;font:500 clamp(1.6rem,3vw,2.8rem)/1 var(--display-font)}button,select{padding:.65rem .8rem;border:1px solid var(--line);border-radius:.65rem;background:var(--panel);color:inherit}.zoom-control{display:flex;justify-content:flex-end;gap:.25rem;margin-top:1rem}.zoom-control button[aria-pressed="true"]{border-color:var(--accent)}.divergence{display:grid;grid-template-columns:minmax(15rem,24rem) 1fr;gap:1.25rem;align-items:center;margin:1rem 0;padding:1rem;border:1px solid var(--line);border-radius:.9rem;background:var(--panel)}.fork-board{width:min(100%,24rem);justify-self:center}.divergence h3,.narrative h3{margin:.15rem 0 .6rem}.divergence ol{display:grid;gap:.55rem;padding:0;list-style:none}.divergence li{display:grid;grid-template-columns:2rem 1fr;gap:.55rem;align-items:start}.divergence li small{display:block;color:var(--muted)}.divergence li p{margin:.15rem 0}.candidate-number{display:grid;place-items:center;width:1.75rem;aspect-ratio:1;border-radius:50%;background:var(--accent);color:var(--on-accent);font-weight:700}.eyebrow{margin:0;color:var(--accent);font:700 .68rem ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}.narrative{padding:1rem;border:1px solid var(--accent);border-radius:.8rem;background:color-mix(in srgb,var(--accent) 6%,var(--panel))}.narrative-heading{display:flex;justify-content:space-between;align-items:start;gap:1rem}.alignment{display:flex;gap:.75rem;flex-wrap:wrap;margin:.75rem 0}.alignment p{margin:0;padding:.45rem .65rem;border-radius:999px;background:var(--surface);color:var(--muted);font-size:.78rem}.boards,.results,.strip-band,.inspector-results{display:grid;grid-template-columns:repeat(var(--branches,2),minmax(var(--cell-floor,15rem),1fr));gap:.8rem;margin:1rem 0;overflow-x:auto;overscroll-behavior:contain}.strip-band>h4{grid-column:1/-1}.strip-band article,.boards article,.results>article,.inspector-results>article{min-width:var(--cell-floor,15rem);padding:.7rem;border:1px solid var(--line);border-radius:.8rem;background:var(--panel)}.boards h3,.boards p{overflow-wrap:anywhere}.branch-intent{padding:.35rem .5rem;border-left:3px solid var(--accent);color:var(--muted);font-size:.78rem}.group-marker{display:inline-block;margin:.1rem 0 .4rem;padding:.28rem .45rem;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,var(--surface));color:var(--accent);font:700 .68rem ui-monospace,monospace}.cell-state{color:var(--muted);font-size:.72rem}.boards dl{display:grid;gap:.2rem;margin:.45rem 0;font-size:.7rem}.boards dl div{display:flex;justify-content:space-between;gap:.35rem}.boards dt{color:var(--muted)}.boards dd{margin:0}.boards article.shared{border-color:var(--accent)}.boards article.absent{opacity:.45}.line-ended{min-height:3rem;display:grid;place-items:center;background:var(--surface)}.boards[data-zoom="near"] .line-ended{aspect-ratio:1}.stepper{justify-content:center}.replay-resistance{display:grid;grid-template-columns:minmax(16rem,1fr) auto auto;gap:.75rem;align-items:end;margin:1rem 0;padding:1rem;border:1px solid var(--accent);border-radius:.9rem;background:color-mix(in srgb,var(--accent) 6%,var(--panel))}.replay-resistance h3,.replay-resistance p{margin:.2rem 0}.replay-resistance label{display:grid;gap:.25rem;font-size:.75rem}.replay-resistance small{grid-column:1/-1;color:var(--muted)}.evaluation-axis{margin:1rem 0}.evaluation-table-wrap{overflow-x:auto;overscroll-behavior:contain}.evaluation-axis table{width:100%;min-width:28rem;border-collapse:collapse;background:var(--panel)}.evaluation-axis th,.evaluation-axis td{padding:.55rem .7rem;border:1px solid var(--line);text-align:left;white-space:nowrap}.evaluation-axis thead th{color:var(--muted);font-size:.72rem}.evaluation-axis tbody th{width:6rem}.fork-marker{display:inline-block;color:var(--accent);font:700 .75rem ui-monospace,monospace}.evidence-entry{font:.76rem ui-monospace,monospace}.no-record{color:var(--muted);font-size:.72rem}.results{grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));--cell-floor:16rem}.results p,.inspector-results p{margin:.35rem 0;color:var(--muted)}.validated-timeline{display:none}.inspector-backdrop{position:fixed;inset:0;z-index:40;display:grid;padding:1rem;background:var(--scrim)}.comparison-inspector{width:min(76rem,100%);height:min(92dvh,64rem);margin:auto;overflow:auto;padding:1rem;border:1px solid var(--line);border-radius:1rem;background:var(--surface);box-shadow:var(--shadow)}.comparison-inspector h3{margin:.15rem 0}.inspector-intro{max-width:70ch;color:var(--muted)}@media(max-width:760px){.divergence{grid-template-columns:1fr}.fork-board{width:min(82vw,22rem)}}
  @media(max-width:760px){
    .compare{width:calc(100% - 1rem);padding:.5rem 0;overflow-x:hidden;overflow-y:auto}
    .compare>header,.stepper,.narrative-heading{flex-wrap:wrap}
    .boards,.results,.strip-band{grid-template-columns:minmax(0,1fr);overflow-x:visible}
    .strip-band>h4{grid-column:1}
    .strip-band article,.boards article,.results>article{min-width:0}
    .boards article{overflow:hidden}
    .replay-resistance{grid-template-columns:1fr;align-items:stretch}.replay-resistance small{grid-column:1}
  }
</style>
