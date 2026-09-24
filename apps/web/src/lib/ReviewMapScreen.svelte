<script lang="ts">
  // rfc/review-map.md: the learner-facing whole-game Review Map. Every authored string on this
  // surface is a registered template (`reviewText`); everything else is payload data rendered as is.
  import { reviewText } from "@chess-tabiya/runtime";
  import { onDestroy } from "svelte";

  import type { ReviewAnalysisPage, ReviewMap, StoryShare } from "./api.js";
  import Chessboard from "./Chessboard.svelte";
  import ReviewEvalGraph from "./ReviewEvalGraph.svelte";
  import { storyCardDocument } from "./story-card.js";

  interface Props {
    review: ReviewMap;
    onRetry: (entryNodeId: string) => void | Promise<void>;
    onExport: () => void | Promise<void>;
    onVoice?: ((nodeId: string) => Promise<string>) | undefined;
    shares?: readonly StoryShare[];
    onShare?: (() => Promise<{ readonly id: string; readonly url: string }>) | undefined;
    onRevoke?: ((tokenId: string) => Promise<void>) | undefined;
    /** §4: hands the listed lines to the shipped N-way compare (reviewed line first). */
    onCompare?: ((branchIds: readonly string[]) => void | Promise<void>) | undefined;
    /** §7 / O7.3: the explicit, secondary Analyze reveal for one reviewed move. */
    onAnalyze?: ((nodeId: string) => Promise<ReviewAnalysisPage>) | undefined;
  }
  let { review, onRetry, onExport, onVoice, shares = [], onShare, onRevoke, onCompare, onAnalyze }: Props = $props();

  type RetryFailure = "retry.failed.board_held" | "retry.failed.forbidden" | "retry.failed.other";
  let selectedId = $state<string | undefined>();
  let retrying = $state<string | undefined>();
  let retryError = $state<{ readonly key: string; readonly id: RetryFailure } | undefined>();
  let forbidden = $state(false);
  let explanation = $state<{ readonly nodeId: string; readonly text: string } | undefined>();
  let explanationFailed = $state<string | undefined>();
  let explaining = $state<string | undefined>();
  let exportBusy = $state(false);
  let exportFailed = $state(false);
  let shareUrl = $state<string | undefined>();
  let createdShareId = $state<string | undefined>();
  let shareBusy = $state(false);
  let shareStatus = $state<"share.created" | "share.created.manual" | "share.revoked" | undefined>();
  let shareError = $state<"share.failed" | "share.revoke.failed" | undefined>();
  let cardBusy = $state(false);
  let cardFailed = $state(false);
  let comparing = $state<string | undefined>();
  let compareFailed = $state<string | undefined>();
  let analysis = $state<ReviewAnalysisPage | undefined>();
  let analysisBusy = $state<string | undefined>();
  let analysisFailed = $state<string | undefined>();
  let analysisRequest = 0;
  let mounted = true;
  let request = 0;

  const imported = $derived(review.source.kind === "native" ? undefined : review.source);
  const retryAvailable = $derived(review.viewer.mayWrite && !forbidden);
  const initial = $derived(review.moments.find((moment) => review.rows.some((row) => row.nodeId === moment.nodeId))?.nodeId ?? review.rows[0]?.nodeId);
  const selectedIndex = $derived(review.rows.findIndex((row) => row.nodeId === (selectedId ?? initial)));
  const selected = $derived(selectedIndex < 0 ? undefined : review.rows[selectedIndex]);
  const doors = $derived(new Map(review.compareDoors.map((door) => [door.entryNodeId, door])));
  /** O7.3: the reveal belongs to one selected move and is gone the moment selection or a retry moves on. */
  const shownAnalysis = $derived(analysis !== undefined && analysis.nodeId === selected?.nodeId && retrying === undefined ? analysis : undefined);
  const sideLabel = (side: "white" | "black"): string => side === "white" ? reviewText("side.white") : reviewText("side.black");
  const resultSentence = $derived(review.outcome.kind === "board_terminal"
    ? reviewText("header.result.board", { result: review.outcome.result, side: sideLabel(review.side) })
    : review.outcome.kind === "recorded_result" ? reviewText("header.result.recorded", { result: review.outcome.result }) : reviewText("header.result.unfinished"));
  const sourceSentence = $derived(imported === undefined
    ? reviewText("header.source.native")
    : reviewText("header.source.imported", { source: imported.kind === "pgn_paste" ? reviewText("source.pgn_paste") : reviewText("source.lichess_url"), date: imported.importedAt.slice(0, 10) }));

  function hideAnalysis(): void {
    analysisRequest += 1;
    analysis = undefined;
    analysisBusy = undefined;
    analysisFailed = undefined;
  }

  function select(nodeId: string): void {
    if (nodeId !== selected?.nodeId) hideAnalysis();
    selectedId = nodeId;
  }

  function step(delta: number): void {
    const next = review.rows[Math.max(0, Math.min(review.rows.length - 1, selectedIndex + delta))];
    if (next !== undefined) select(next.nodeId);
  }

  async function compare(key: string, branchIds: readonly string[]): Promise<void> {
    if (onCompare === undefined || comparing !== undefined) return;
    comparing = key;
    compareFailed = undefined;
    try {
      await onCompare(branchIds);
    } catch {
      if (mounted) compareFailed = key;
    } finally {
      if (mounted) comparing = undefined;
    }
  }

  async function analyze(nodeId: string): Promise<void> {
    if (onAnalyze === undefined || analysisBusy !== undefined || retrying !== undefined) return;
    const current = ++analysisRequest;
    analysisBusy = nodeId;
    analysisFailed = undefined;
    try {
      const page = await onAnalyze(nodeId);
      if (mounted && current === analysisRequest && retrying === undefined) analysis = page;
    } catch {
      if (mounted && current === analysisRequest) analysisFailed = nodeId;
    } finally {
      if (mounted && current === analysisRequest) analysisBusy = undefined;
    }
  }

  function onListKey(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") { event.preventDefault(); step(1); }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
  }

  function failureOf(error: unknown): RetryFailure {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as { readonly code: unknown }).code) : "";
    if (code === "BOARD_HELD" || code === "LEASE_MOVED" || code === "LEASE_HELD") return "retry.failed.board_held";
    if (code === "FORBIDDEN") return "retry.failed.forbidden";
    return "retry.failed.other";
  }

  async function retry(key: string, entryNodeId: string): Promise<void> {
    if (!retryAvailable || retrying !== undefined) return;
    hideAnalysis();
    retrying = key;
    retryError = undefined;
    try {
      await onRetry(entryNodeId);
    } catch (error) {
      // A failed retry is rendered with its reason; it never escapes as an unhandled throw.
      if (!mounted) return;
      const id = failureOf(error);
      if (id === "retry.failed.forbidden") forbidden = true;
      retryError = { key, id };
    } finally {
      if (mounted) retrying = undefined;
    }
  }

  async function explain(nodeId: string): Promise<void> {
    if (onVoice === undefined) return;
    const current = ++request;
    explaining = nodeId;
    explanationFailed = undefined;
    try {
      const text = await onVoice(nodeId);
      if (mounted && current === request) explanation = { nodeId, text };
    } catch {
      if (mounted && current === request) explanationFailed = nodeId;
    } finally {
      if (mounted && current === request) explaining = undefined;
    }
  }

  async function exportGame(): Promise<void> {
    if (exportBusy) return;
    exportBusy = true;
    exportFailed = false;
    try { await onExport(); } catch { if (mounted) exportFailed = true; } finally { if (mounted) exportBusy = false; }
  }

  async function createShare(): Promise<void> {
    if (onShare === undefined || shareBusy) return;
    shareBusy = true;
    shareError = undefined;
    shareStatus = undefined;
    try {
      const created = await onShare();
      if (!mounted) return;
      createdShareId = created.id;
      shareUrl = created.url;
      try {
        if (navigator.clipboard === undefined) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(new URL(created.url, location.href).href);
        if (mounted) shareStatus = "share.created";
      } catch {
        if (mounted) shareStatus = "share.created.manual";
      }
    } catch {
      if (mounted) shareError = "share.failed";
    } finally {
      if (mounted) shareBusy = false;
    }
  }

  async function revokeShare(tokenId: string): Promise<void> {
    if (onRevoke === undefined || shareBusy) return;
    shareBusy = true;
    shareError = undefined;
    try {
      await onRevoke(tokenId);
      if (!mounted) return;
      if (createdShareId === tokenId) { createdShareId = undefined; shareUrl = undefined; }
      shareStatus = "share.revoked";
    } catch {
      if (mounted) shareError = "share.revoke.failed";
    } finally {
      if (mounted) shareBusy = false;
    }
  }

  async function downloadCard(): Promise<void> {
    if (cardBusy) return;
    cardBusy = true;
    cardFailed = false;
    try {
      const card = storyCardDocument(review.storyTitle, review.moments);
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(card.svg)}`;
      await image.decode();
      if (!mounted) return;
      const canvas = document.createElement("canvas");
      canvas.width = card.width;
      canvas.height = card.height;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("canvas unavailable");
      context.drawImage(image, 0, 0);
      const anchor = document.createElement("a");
      anchor.download = "tabiya-review.png";
      anchor.href = canvas.toDataURL("image/png");
      anchor.click();
    } catch {
      if (mounted) cardFailed = true;
    } finally {
      if (mounted) cardBusy = false;
    }
  }

  function readableDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
  }

  onDestroy(() => { mounted = false; request += 1; });
</script>

<main class="review-map" aria-labelledby="review-map-title" data-review-surface="review_map">
  <header class="review-header">
    <div>
      <p class="eyebrow">{imported ? reviewText("header.eyebrow.imported") : reviewText("header.eyebrow.native")}</p>
      <h1 id="review-map-title">{imported ? reviewText("header.title.imported", { white: imported.headers.White ?? reviewText("side.white"), black: imported.headers.Black ?? reviewText("side.black") }) : reviewText("header.title.native")}</h1>
      <p>{resultSentence}</p>
      <p class="muted">{sourceSentence}</p>
      <p class="muted">{reviewText("header.story_title", { title: review.storyTitle })}</p>
      <p class="coverage">{review.coverage.sentence}</p>
      {#if !review.ready}<p class="pending" role="status">{reviewText("header.pending", { pending: review.pendingEvidence })}</p>{/if}
    </div>
    <div class="actions">
      <button type="button" disabled={exportBusy} onclick={() => void exportGame()}>{exportBusy ? reviewText("action.exporting") : reviewText("action.export")}</button>
      {#if onShare}<button type="button" disabled={shareBusy} aria-describedby="review-share-lifetime" onclick={() => void createShare()}>{reviewText("share.action")}</button>{/if}
      <a href="/review">{reviewText("action.back")}</a>
    </div>
  </header>
  {#if exportBusy}<p role="status">{reviewText("action.exporting.status")}</p>{/if}
  {#if exportFailed}<p role="alert">{reviewText("action.export.failed")}</p>{/if}

  <section class="accuracy" aria-labelledby="review-accuracy-title">
    <h2 id="review-accuracy-title">{reviewText("accuracy.title")}</h2>
    <p data-accuracy={review.accuracy.white.kind}>{review.accuracy.white.sentence}</p>
    <p data-accuracy={review.accuracy.black.kind}>{review.accuracy.black.sentence}</p>
  </section>

  <ReviewEvalGraph graph={review.evalGraph} selectedId={selected?.nodeId} onSelect={select} />

  <div class="review-body">
    <section class="moves" aria-labelledby="review-moves-title">
      <h2 id="review-moves-title">{reviewText("moves.title")}</h2>
      <p class="muted">{reviewText("moves.caption")}</p>
      {#if !retryAvailable}<p id="review-retry-unavailable" class="retry-unavailable" role="note">{forbidden ? reviewText("retry.failed.forbidden") : reviewText("retry.unavailable.read_only")}</p>{/if}
      <ol class="move-list" aria-label={reviewText("moves.label")}>
        {#each review.rows as row (row.nodeId)}
          <li class="move-row" class:selected={row.nodeId === selected?.nodeId} data-node-id={row.nodeId} data-side={row.side}>
            <button type="button" class="move-select" aria-current={row.nodeId === selected?.nodeId ? "true" : undefined} onclick={() => select(row.nodeId)} onkeydown={onListKey}>
              <span class="move-label">{row.label}</span>
              {#if row.moment}<span class="moment-marker">{reviewText("moves.row.moment")}</span>{/if}
            </button>
            {#if row.grade}<p class="grade-chip" data-grade={row.grade.klass}>{row.grade.sentence}</p>{/if}
            <button type="button" class="retry" disabled={!retryAvailable || retrying !== undefined} aria-label={reviewText("retry.action.label", { number: row.moveNumber, san: row.san })} aria-describedby={!retryAvailable ? "review-retry-unavailable" : undefined} onclick={() => void retry(`row:${row.nodeId}`, row.entryNodeId)}>{retrying === `row:${row.nodeId}` ? reviewText("retry.busy") : reviewText("retry.action")}</button>
            {#if retryError?.key === `row:${row.nodeId}`}<p class="retry-error" role="alert">{reviewText(retryError.id)}</p>{/if}
            {#if onCompare && doors.get(row.entryNodeId)}
              {@const door = doors.get(row.entryNodeId)!}
              <button type="button" class="compare" disabled={comparing !== undefined || retrying !== undefined} aria-label={reviewText("compare.action.label", { count: door.branchIds.length - 1, number: row.moveNumber, san: row.san })} onclick={() => void compare(`row:${row.nodeId}`, door.branchIds)}>{comparing === `row:${row.nodeId}` ? reviewText("compare.busy") : reviewText("compare.action")}</button>
              {#if door.omitted > 0}<p class="muted compare-note">{reviewText("compare.omitted", { omitted: door.omitted, shown: door.branchIds.length })}</p>{/if}
              {#if compareFailed === `row:${row.nodeId}`}<p class="retry-error" role="alert">{reviewText("compare.failed")}</p>{/if}
            {/if}
          </li>
        {/each}
      </ol>
    </section>

    <section class="stage" aria-label={reviewText("board.label")}>
      <p class="eyebrow">{selected ? reviewText("board.after", { move: selected.label }) : reviewText("board.start")}</p>
      {#if selected}<div class="board"><Chessboard fen={selected.fen} startSide={review.side} lastMove={selected.moveUci} disabled={true} onMove={() => {}} /></div>{/if}
      <div class="nav">
        <button type="button" disabled={selectedIndex <= 0} onclick={() => step(-1)}>{reviewText("nav.previous")}</button>
        <button type="button" disabled={selectedIndex >= review.rows.length - 1} onclick={() => step(1)}>{reviewText("nav.next")}</button>
      </div>
      {#if retrying !== undefined}<p role="status">{reviewText("retry.status")}</p>{/if}
      {#if selected}
        <article class="evidence" aria-labelledby="review-evidence-title">
          <h2 id="review-evidence-title">{reviewText("evidence.title")}</h2>
          {#each selected.facts as fact}<p>{fact}</p>{/each}
        </article>
        {#if onAnalyze && retrying === undefined}
          <section class="analysis" aria-labelledby="review-analysis-title" data-analysis={selected.entryNodeId === review.openRetryEntryNodeId ? "withheld" : shownAnalysis?.kind ?? "closed"}>
            <h3 id="review-analysis-title">{reviewText("analysis.title")}</h3>
            {#if selected.entryNodeId === review.openRetryEntryNodeId}
              <p class="muted">{reviewText("analysis.withheld", { move: selected.label })}</p>
            {:else if shownAnalysis}
              <div aria-live="polite">
                <p class="analysis-sentence">{shownAnalysis.sentence}</p>
                {#if shownAnalysis.kind === "line"}<p class="muted">{shownAnalysis.caveat}</p>{/if}
              </div>
              <button type="button" class="secondary" onclick={hideAnalysis}>{reviewText("analysis.hide")}</button>
            {:else}
              <button type="button" class="secondary analyze" disabled={analysisBusy !== undefined} aria-label={reviewText("analysis.action.label", { number: selected.moveNumber, san: selected.san })} onclick={() => void analyze(selected!.nodeId)}>{analysisBusy === selected.nodeId ? reviewText("analysis.busy") : reviewText("analysis.action")}</button>
              {#if analysisFailed === selected.nodeId}<p role="alert">{reviewText("analysis.failed")}</p>{/if}
            {/if}
          </section>
        {/if}
      {/if}
    </section>

    <section class="moments" aria-labelledby="review-moments-title">
      <h2 id="review-moments-title">{reviewText("moments.title")}</h2>
      <p class="muted">{review.momentsSentence}</p>
      {#each review.moments as moment (moment.nodeId)}
        <article class="moment-card" data-moment-id={moment.nodeId}>
          <h3>{moment.heading}</h3>
          <p class="eyebrow">{moment.moveLabel}</p>
          {#each moment.sentences as sentence}<p>{sentence}</p>{/each}
          <p class="muted provenance">{moment.sourcesSentence}</p>
          {#if explanation?.nodeId === moment.nodeId}<p class="voice">{explanation.text}</p>{/if}
          {#if explanationFailed === moment.nodeId}<p role="alert">{reviewText("moment.explain.failed")}</p>{/if}
          <div class="moment-actions">
            <button type="button" class="primary retry" disabled={!retryAvailable || retrying !== undefined} aria-label={reviewText("retry.moment.label", { number: Math.max(1, Math.ceil(moment.ply / 2)) })} aria-describedby={!retryAvailable ? "review-retry-unavailable" : undefined} onclick={() => void retry(`moment:${moment.nodeId}`, moment.entryNodeId)}>{retrying === `moment:${moment.nodeId}` ? reviewText("retry.busy") : reviewText("retry.action")}</button>
            <button type="button" disabled={review.rows.every((row) => row.nodeId !== moment.nodeId)} onclick={() => select(moment.nodeId)}>{moment.moveLabel}</button>
            {#if onVoice}<button type="button" disabled={explaining === moment.nodeId} onclick={() => void explain(moment.nodeId)}>{explaining === moment.nodeId ? reviewText("moment.explaining") : reviewText("moment.explain")}</button>{/if}
            {#if onCompare && doors.get(moment.entryNodeId)}
              {@const door = doors.get(moment.entryNodeId)!}
              <button type="button" class="compare" disabled={comparing !== undefined || retrying !== undefined} aria-label={reviewText("compare.moment.label", { count: door.branchIds.length - 1, number: Math.max(1, Math.ceil(moment.ply / 2)) })} onclick={() => void compare(`moment:${moment.nodeId}`, door.branchIds)}>{comparing === `moment:${moment.nodeId}` ? reviewText("compare.busy") : reviewText("compare.action")}</button>
            {/if}
          </div>
          {#if compareFailed === `moment:${moment.nodeId}`}<p class="retry-error" role="alert">{reviewText("compare.failed")}</p>{/if}
          {#if retryError?.key === `moment:${moment.nodeId}`}<p class="retry-error" role="alert">{reviewText(retryError.id)}</p>{/if}
        </article>
      {/each}
    </section>
  </div>

  {#if onShare}
    <section class="share-management" aria-labelledby="review-share-title">
      <h2 id="review-share-title">{reviewText("share.title")}</h2>
      <p id="review-share-lifetime">{reviewText("share.lifetime")}</p>
      {#if shareUrl}<p class="pending">{reviewText("share.new")} <a href={shareUrl}>{shareUrl}</a> <button type="button" disabled={cardBusy} onclick={() => void downloadCard()}>{cardBusy ? reviewText("card.busy") : reviewText("card.download")}</button></p>{/if}
      {#if cardBusy}<p role="status">{reviewText("card.busy.status")}</p>{/if}
      {#if cardFailed}<p role="alert">{reviewText("card.failed")}</p>{/if}
      {#if shareStatus}<p role="status" aria-live="polite" aria-atomic="true">{reviewText(shareStatus)}</p>{/if}
      {#if shareError}<p role="alert">{reviewText(shareError)}</p>{/if}
      {#if shares.length > 0}
        <ul aria-label={reviewText("share.list.label")}>
          {#each shares as share (share.id)}
            <li><span>{share.revokedAt === null ? reviewText("share.item.public", { date: readableDate(share.createdAt) }) : reviewText("share.item.revoked", { date: readableDate(share.createdAt), revoked: readableDate(share.revokedAt) })}</span>{#if share.revokedAt === null && onRevoke}<button type="button" disabled={shareBusy} onclick={() => void revokeShare(share.id)}>{reviewText("share.revoke")}</button>{/if}</li>
          {/each}
        </ul>
      {:else}<p>{reviewText("share.none")}</p>{/if}
    </section>
  {/if}

  <footer class="review-footer"><p>{review.footer.sentence}</p></footer>
</main>

<style>
  .review-map{min-height:100%;display:grid;gap:.9rem;padding:1rem;align-content:start}
  .review-map h1,.review-map h2,.review-map h3,.review-map p{margin:.15rem 0}
  .review-map h2{font-size:1rem}
  .eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:.75rem}
  .muted,.provenance{color:var(--muted);font-size:.85rem}
  .review-header{display:flex;justify-content:space-between;align-items:start;gap:1rem}
  .actions{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
  .pending,.retry-unavailable{padding:.5rem .7rem;border:1px solid color-mix(in srgb,var(--ink) 30%,transparent);border-radius:.5rem}
  .accuracy{display:grid;gap:.25rem;padding:.7rem;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);border-radius:.6rem;background:var(--panel)}
  .review-body{display:grid;grid-template-columns:minmax(16rem,22rem) minmax(18rem,1fr) minmax(16rem,22rem);gap:1rem;align-items:start}
  .move-list{list-style:none;margin:.4rem 0 0;padding:0;display:grid;gap:.3rem;max-height:70vh;overflow-y:auto}
  .move-row{display:grid;grid-template-columns:1fr auto;gap:.2rem .5rem;padding:.3rem .4rem;border-radius:.4rem;border:1px solid transparent}
  .move-row.selected{border-color:var(--ink);background:color-mix(in srgb,var(--accent) 8%,var(--panel))}
  .move-select{display:flex;gap:.5rem;align-items:center;text-align:left;background:none;border:0;padding:.2rem;font:inherit;color:inherit;cursor:pointer}
  .moment-marker{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;padding:.05rem .35rem;border:1px solid var(--accent);border-radius:.3rem}
  .grade-chip{grid-column:1 / -1;font-size:.8rem;line-height:1.35;padding:.3rem .45rem;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,var(--panel))}
  .retry,.compare{font-size:.8rem}
  .move-row .compare{grid-column:1 / -1;justify-self:start}
  .compare-note{grid-column:1 / -1}
  .analysis{display:grid;gap:.3rem;padding:.5rem .6rem;border:1px dashed color-mix(in srgb,var(--ink) 25%,transparent);border-radius:.6rem}
  .analysis h3{font-size:.9rem}
  .analysis button{justify-self:start;font-size:.8rem}
  .retry-error{grid-column:1 / -1}
  .stage{display:grid;gap:.5rem;min-width:0}
  .board{width:min(100%,56vh);aspect-ratio:1;justify-self:center}
  .nav{display:flex;gap:.5rem;justify-content:center}
  .evidence{display:grid;gap:.3rem;padding:.6rem;border:1px solid color-mix(in srgb,var(--ink) 20%,transparent);border-radius:.6rem}
  .moments{display:grid;gap:.6rem}
  .moment-card{display:grid;gap:.3rem;padding:.7rem;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:.6rem;background:var(--panel)}
  .moment-actions{display:flex;flex-wrap:wrap;gap:.4rem}
  .share-management{display:grid;gap:.5rem;padding:.75rem;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:.6rem;background:var(--panel)}
  .share-management ul{display:grid;gap:.4rem;margin:0;padding:0;list-style:none}
  .share-management li{display:flex;align-items:center;justify-content:space-between;gap:1rem}
  .review-footer{color:var(--muted);font-size:.85rem}
  @media(max-width:1100px){.review-body{grid-template-columns:minmax(14rem,20rem) 1fr}.moments{grid-column:1 / -1}}
  @media(max-width:760px){.review-header{flex-direction:column}.review-body{grid-template-columns:1fr}.move-list{max-height:40vh}.board{width:min(86vw,55vh)}}
</style>
