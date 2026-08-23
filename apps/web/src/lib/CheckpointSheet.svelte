<script lang="ts">
  import { onMount } from "svelte";

  import HonestControl from "./HonestControl.svelte";
  import { recognizedCheckpointActions, type CheckpointNotice } from "./screen-model.js";
  import type { AuthoredFeedbackItem, ReasoningPage, ReasoningReviewPage, ShapeEntryView } from "./api.js";
  import OutcomeContext from "./OutcomeContext.svelte";
  import type { DrillRun } from "@chess-tabiya/runtime";
  import type { Node } from "@chess-tabiya/runtime";
  import Chessboard from "./Chessboard.svelte";
  import type { StartSide } from "./board-model.js";
  import { theoryVerdictSentence, UNKNOWN_THEORY_NOTE } from "./theory-presentation.js";
  import { claimProvenance } from "./claim-presentation.js";

  interface Props {
    checkpoint: CheckpointNotice;
    canCompare: boolean;
    onContinue: () => void | Promise<void>;
    onRewind: () => void | Promise<void>;
    onCompare: () => void | Promise<void>;
    onStop: () => void;
    authoredItems?: readonly AuthoredFeedbackItem[];
    assessment?: string | undefined;
    resistance?: readonly string[];
    resolution?: string | undefined;
    run: DrillRun;
    node?: Node;
    startSide?: StartSide;
    onPrediction?: (uci: string) => void | Promise<void>;
    onReasoning?: (input: { readonly transcript?: import("@chess-tabiya/runtime").ReasoningTranscript; readonly skipped?: true }) => void | Promise<void>;
    onReasoningReview?: ((checkpointEventSeq: number) => Promise<ReasoningReviewPage>) | undefined;
    reasoning?: ReasoningPage;
    shapes?: readonly ShapeEntryView[];
  }

  let {
    checkpoint,
    canCompare,
    onContinue,
    onRewind,
    onCompare,
    onStop,
    authoredItems = [],
    assessment,
    resistance = [],
    resolution,
    run,
    node,
    startSide = "white",
    onPrediction = () => {},
    onReasoning = () => {},
    onReasoningReview,
    reasoning,
    shapes = [],
  }: Props = $props();
  let heading: HTMLHeadingElement;
  let candidates = $state("");
  let plan = $state("");
  let fears = $state("");
  let recognizedActions = $derived(recognizedCheckpointActions(checkpoint.actions));
  let currentReasoning = $derived(reasoning?.occurrences.find((item) => item.checkpointEventSeq === checkpoint.eventSeq));
  let previousReasoning = $derived(reasoning?.previous ?? (reasoning?.occurrences.filter((item) => item.eventSeq !== currentReasoning?.eventSeq).at(-1) ?? null));
  let review = $state<ReasoningReviewPage | undefined>();
  let reviewBusy = $state(false);
  let reviewError = $state<string | undefined>();

  function matchedWords(detection: import("@chess-tabiya/runtime").ReasoningDetection): string {
    if (!currentReasoning?.transcript || !detection.match) return "";
    const source = detection.match.field === "candidates" ? currentReasoning.transcript.candidates[detection.match.index ?? -1] : currentReasoning.transcript[detection.match.field];
    return source?.normalize("NFKC").toLocaleLowerCase("en-US").replaceAll(/\s+/g, " ").trim().slice(detection.match.start, detection.match.end) ?? "";
  }

  function submitReasoning(): void {
    void onReasoning({ transcript: { candidates: candidates.split("\n").map((item) => item.trim()).filter(Boolean), plan, fears } });
  }

  async function requestReasoningReview(): Promise<void> {
    if (onReasoningReview === undefined || currentReasoning === undefined) return;
    reviewBusy = true;
    reviewError = undefined;
    try {
      review = await onReasoningReview(currentReasoning.checkpointEventSeq);
    } catch (error) {
      reviewError = error instanceof Error ? error.message : String(error);
    } finally {
      reviewBusy = false;
    }
  }

  onMount(() => heading?.focus());
</script>

<div class="backdrop">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="checkpoint-title">
    <p class="eyebrow">Checkpoint</p>
    <h2 id="checkpoint-title" tabindex="-1" bind:this={heading}>{checkpoint.label}</h2>
    <p>You reached a semantic boundary. Continue, replay it, or compare attempts.</p>
    {#if checkpoint.interaction?.type === "prediction" && node}
      <section class="prediction" aria-labelledby="prediction-title">
        <h3 id="prediction-title">Predict the opponent's reply</h3>
        <p>Play one candidate on the board. Tabiya records the policy distribution as numbers, never a verdict.</p>
        <Chessboard
          fen={node.fen}
          startSide={checkpoint.interaction.flipBoard ? (startSide === "white" ? "black" : "white") : startSide}
          lastMove={node.moveUci}
          onMove={onPrediction}
        />
      </section>
    {/if}
    {#if checkpoint.interaction?.type === "stated_reasoning"}
      <section class="reasoning" aria-labelledby="reasoning-title">
        <h3 id="reasoning-title">State your reasoning</h3>
        {#if currentReasoning === undefined}
          <div class="reasoning-entry">
            <div>
              <p>Write what you considered before opening the author's points.</p>
              <label>Candidate moves <textarea aria-label="Candidate moves" rows="3" bind:value={candidates} placeholder="One candidate per line"></textarea></label>
              <label>Your plan <textarea aria-label="Your plan" rows="4" bind:value={plan}></textarea></label>
              <label>What you fear <textarea aria-label="What you fear" rows="3" bind:value={fears}></textarea></label>
              <div class="reasoning-actions">
                <button class="primary" type="button" disabled={plan.trim() === ""} onclick={submitReasoning}>Record reasoning</button>
                <button type="button" onclick={() => void onReasoning({ skipped: true })}>Show the author's points without writing</button>
              </div>
            </div>
            <section aria-label="Your previous attempt"><h4>Your previous attempt</h4>{#if previousReasoning?.skipped}<p>Declined to state reasoning.</p>{:else if previousReasoning?.transcript}<p><strong>Candidates</strong> {previousReasoning.transcript.candidates.join("; ") || "None listed"}</p><p><strong>Plan</strong> {previousReasoning.transcript.plan}</p><p><strong>Fears</strong> {previousReasoning.transcript.fears || "None listed"}</p>{:else}<p>{reasoning?.absenceSentence}</p>{/if}</section>
          </div>
        {:else if currentReasoning.skipped}
          <p>You chose to see the author's points without stating your reasoning first.</p>
        {:else}
          <div class="reasoning-columns">
            <section aria-label="Your reasoning"><h4>Your reasoning</h4><p><strong>Candidates</strong> {currentReasoning.transcript?.candidates.join("; ") || "None listed"}</p><p><strong>Plan</strong> {currentReasoning.transcript?.plan}</p><p><strong>Fears</strong> {currentReasoning.transcript?.fears || "None listed"}</p></section>
            <section aria-label="The author's points"><h4>The author's points</h4>
              {#if currentReasoning.keyPoints && currentReasoning.detections}
                <p class="honesty">{reasoning?.honestySentence}</p>
                <ul>{#each currentReasoning.keyPoints as point, index}<li><strong>{point.label}</strong><p>{currentReasoning.detections[index]?.status === "detected" ? `Mentioned — matched '${matchedWords(currentReasoning.detections[index]!)}'` : "Not detected in your words."}</p>{#each review?.proposals.filter((proposal) => proposal.keyPointId === point.id) ?? [] as proposal}<p class="proposal">{proposal.text}</p>{/each}<small>{point.attribution}</small></li>{/each}</ul>
                {#if onReasoningReview !== undefined}
                  <button type="button" disabled={reviewBusy} onclick={() => void requestReasoningReview()}>{reviewBusy ? "Checking your exact words…" : "Check for another possible mention"}</button>
                  <p class="honesty">The configured language model may select your exact words. It cannot add a detection or grade your reasoning.</p>
                  {#if review !== undefined && review.proposals.length === 0}<p>No additional possible mentions were proposed.</p>{/if}
                  {#if reviewError}<p role="alert">{reviewError}</p>{/if}
                {/if}
              {:else}<p>Author points remain withheld until this segment opens.</p>{/if}
            </section>
            <section aria-label="Your previous attempt"><h4>Your previous attempt</h4>{#if previousReasoning?.skipped}<p>Declined to state reasoning.</p>{:else if previousReasoning?.transcript}<p><strong>Candidates</strong> {previousReasoning.transcript.candidates.join("; ") || "None listed"}</p><p><strong>Plan</strong> {previousReasoning.transcript.plan}</p><p><strong>Fears</strong> {previousReasoning.transcript.fears || "None listed"}</p>{:else}<p>{reasoning?.absenceSentence}</p>{/if}</section>
          </div>
        {/if}
      </section>
    {/if}
    {#if assessment !== undefined || resistance.length > 0}
      <OutcomeContext {assessment} {resistance} {resolution} />
    {/if}
    {#if authoredItems.length > 0}
      <section class="authored-feedback" aria-labelledby="authored-feedback-title">
        <h3 id="authored-feedback-title">Authored commentary</h3>
        <ul>
          {#each authoredItems as item}
            <li>
              {#if item.kind === "annotation"}
                <span class="kind">Line note</span><p>{item.text}</p>
              {:else if item.kind === "deviation"}
                <span class="kind">Alternative move</span><p>{item.note}</p>
              {:else if item.kind === "plan_class"}
                <span class="kind">Plan option</span><strong>{item.label}</strong>
                {#if item.shapePlan}
                  {@const plan = shapes.find((entry) => entry.id === item.shapePlan!.shape)?.plans.find((candidate) => candidate.id === item.shapePlan!.plan)}
                  {#if plan}<p>{plan.description}</p>{/if}
                {/if}
                {#if item.description}<p>{item.description}</p>{/if}
                {#if item.gradability === "declared_uncheckable"}<p>This plan has no structural signature, so the drill does not check it.</p>{#if item.gradabilityNote}<p>{item.gradabilityNote}</p>{/if}{/if}
              {:else if item.kind === "claim"}
                <span class="kind">Author's claim</span><p>{item.text}</p><small>{claimProvenance(item)}</small>
              {:else}
                <span class="kind">Theory</span><p>{theoryVerdictSentence(item, run)}</p>
              {/if}
            </li>
          {/each}
        </ul>
        {#if authoredItems.some((item) => item.kind === "theory_verdict" && item.verdict === "unknown")}
          <p>{UNKNOWN_THEORY_NOTE}</p>
        {/if}
      </section>
    {/if}
    {#if checkpoint.interaction?.type !== "stated_reasoning" || currentReasoning !== undefined}
    <div class="actions">
      <button class="primary" type="button" onclick={onContinue}>Continue</button>
      <button type="button" onclick={onRewind}>Rewind here</button>
      {#if recognizedActions.compare_branches}
        <HonestControl
          disabled={!canCompare}
          reasonId="checkpoint-compare-unavailable"
          reason="Reach this checkpoint on at least two branches before comparing."
        >
          {#snippet children(describedBy)}
            <button
              type="button"
              disabled={!canCompare}
              aria-describedby={describedBy}
              onclick={onCompare}
            >Compare</button>
          {/snippet}
        </HonestControl>
      {/if}
      <button type="button" onclick={onStop}>Stop session</button>
    </div>
    {/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    place-items: end center;
    padding: 1rem;
    background: var(--scrim);
    backdrop-filter: blur(5px);
  }

  .sheet {
    width: min(38rem, 100%);
    max-height: min(88dvh, 48rem);
    overflow: auto;
    padding: 1.4rem;
    border-radius: 1.25rem;
    background: var(--panel);
    box-shadow: var(--shadow);
  }

  .eyebrow {
    color: var(--ink);
    font: 700 0.68rem ui-monospace, monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.35rem 0;
    font: 500 2rem/1 var(--display-font);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.3rem;
  }

  .reasoning { display: grid; gap: 0.75rem; margin-top: 1rem; }
  .reasoning label { display: grid; gap: 0.3rem; font-weight: 650; }
  .reasoning textarea { width: 100%; resize: vertical; padding: 0.55rem; border: 1px solid var(--line); border-radius: 0.5rem; background: var(--surface); color: inherit; font: inherit; }
  .reasoning-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .reasoning-columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
  .reasoning-entry { display: grid; grid-template-columns: minmax(0, 2fr) minmax(14rem, 1fr); gap: 0.75rem; }
  .reasoning-columns section { min-width: 0; padding: 0.7rem; border: 1px solid var(--line); border-radius: 0.6rem; }
  .reasoning-columns h4, .reasoning-columns p { margin: 0 0 0.45rem; }
  .reasoning-columns ul { padding-left: 1rem; }
  .honesty { color: var(--muted); }
  .proposal { padding-left: 0.65rem; border-left: 2px solid var(--accent); }
  @media (max-width: 760px) { .reasoning-columns, .reasoning-entry { grid-template-columns: 1fr; } }

  .authored-feedback {
    margin-top: 1rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .authored-feedback h3,
  .authored-feedback p {
    margin: 0;
  }

  .authored-feedback ul {
    display: grid;
    gap: 0.75rem;
    margin: 0.65rem 0 0;
    padding: 0;
    list-style: none;
  }

  .kind {
    display: block;
    color: var(--muted);
    font: 700 0.62rem ui-monospace, monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  button {
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: white;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
