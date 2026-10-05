// Disposable D3430 descriptive research. No calibration statistic, score conversion or verdict.
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { isDeepStrictEqual } from "node:util";
import { parsePersistedProviderDelivery } from "../../packages/runtime/src/index.js";
import manifest from "./manifest.json";
import { digest, type HumanDecision } from "./population.js";
import { OPERATION, assertHeader, assertRoot, type EvaluationHeader, type EvaluationRecord, type RootDelivery } from "./evaluation.js";

function emptyCounts() {
  return {
    decisions: 0, cpOnlyRoots: 0, mixedRoots: 0, mateOnlyRoots: 0,
    candidateRows: 0, cpCandidates: 0, rootMatesCandidates: 0, rootIsMatedCandidates: 0,
    playedCp: 0, playedRootMates: 0, playedRootIsMated: 0,
    cpPlayedInMixedRoot: 0, cpPlayedWithRootMatesAlternative: 0, cpPlayedWithRootIsMatedAlternative: 0,
    cpOnlyConstantTables: 0,
  };
}
type Counts = ReturnType<typeof emptyCounts>;
const claims = {
  strength: "not_measured", distribution: "not_measured", bandIdentity: "not_measured",
  humanLikeLabelAllowed: false,
} as const;

/** Literal domain membership only. Even a mate-bearing root receives no scalar ordering. */
function countDomains(counts: Counts, decision: HumanDecision, delivery: RootDelivery): void {
  const scores = delivery.payload.rows.map((row) => row.score);
  const cp = scores.filter((score) => score.kind === "centipawns");
  const mates = scores.filter((score) => score.kind === "mate");
  const positive = mates.filter((score) => score.outcome === "root_mates").length;
  const negative = mates.filter((score) => score.outcome === "root_is_mated").length;
  const played = delivery.payload.rows.find((row) => row.moveUci === decision.moveUci)!.score;
  counts.decisions += 1;
  counts.candidateRows += scores.length;
  counts.cpCandidates += cp.length;
  counts.rootMatesCandidates += positive;
  counts.rootIsMatedCandidates += negative;
  if (mates.length === 0) {
    counts.cpOnlyRoots += 1;
    if (cp.every((score) => score.value === cp[0]!.value)) counts.cpOnlyConstantTables += 1;
  } else if (cp.length === 0) counts.mateOnlyRoots += 1;
  else counts.mixedRoots += 1;
  if (played.kind === "centipawns") {
    counts.playedCp += 1;
    if (mates.length > 0) counts.cpPlayedInMixedRoot += 1;
    if (positive > 0) counts.cpPlayedWithRootMatesAlternative += 1;
    if (negative > 0) counts.cpPlayedWithRootIsMatedAlternative += 1;
  } else if (played.outcome === "root_mates") counts.playedRootMates += 1;
  else counts.playedRootIsMated += 1;
}

/**
 * Reuse the original header/root authority without changing its frozen executor closure.
 * Recheck this stream's own ordered envelope chain; never attach counts from a second read
 * to a previously inspected file. Nothing is published until the complete stream closes.
 */
export async function auditScoreDomains(
  path: string, rows: readonly HumanDecision[], populationDigest: string, pricingInstrumentDigest: string,
) {
  const totals = emptyCounts();
  const expectedCells = manifest.humanReference.bands.flatMap((band) => manifest.humanReference.windows
    .flatMap((window) => [0, 1].map((half) => `${band.id}/${window.id}/${half}`)));
  const cells = new Map(expectedCells.map((cell) => [cell, { counts: emptyCounts(), games: new Set<string>() }]));
  const games = new Map<string, { half: number; decisions: number; windows: Set<string>; bands: Set<string> }>();
  const gameWindows = new Set<string>();
  let header: EvaluationHeader | undefined;
  let chain = "";
  let lastByte: number | undefined;
  const stream = createReadStream(path);
  stream.on("data", (chunk) => { lastByte = (typeof chunk === "string" ? Buffer.from(chunk) : chunk).at(-1); });
  try {
    for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
      const envelope = JSON.parse(line) as { previous: string; value: EvaluationHeader | EvaluationRecord; digest: string };
      if (Object.keys(envelope).sort().join(",") !== "digest,previous,value" || envelope.previous !== chain
        || envelope.digest !== digest(JSON.stringify({ previous: chain, value: envelope.value }))) throw new TypeError("audit journal chain mismatch");
      if (header === undefined) {
        header = envelope.value as EvaluationHeader;
        assertHeader(header, populationDigest, pricingInstrumentDigest);
      } else {
        const record = envelope.value as EvaluationRecord;
        const decision = rows[totals.decisions];
        if (!decision || Object.keys(record).sort().join(",") !== "decisionDigest,index,reset,source"
          || record.index !== totals.decisions || record.decisionDigest !== digest(JSON.stringify(decision))) throw new TypeError("audit decision order/identity mismatch");
        const cell = cells.get(`${decision.band}/${decision.window}/${decision.referenceHalf}`);
        const gameWindow = `${decision.gameHash}/${decision.window}`;
        if (!cell || !/^sha256:[a-f0-9]{64}$/u.test(decision.gameHash)
          || decision.referenceHalf !== Number.parseInt(decision.gameHash.slice(7, 9), 16) % 2
          || gameWindows.has(gameWindow)) throw new TypeError("audit crossed half/cell or duplicate game/window");
        const delivery = parsePersistedProviderDelivery(OPERATION, record.source);
        assertRoot(header, decision, delivery, record.reset);
        countDomains(totals, decision, delivery);
        countDomains(cell.counts, decision, delivery);
        cell.games.add(decision.gameHash);
        gameWindows.add(gameWindow);
        const game = games.get(decision.gameHash) ?? { half: decision.referenceHalf, decisions: 0, windows: new Set(), bands: new Set() };
        game.decisions += 1; game.windows.add(decision.window); game.bands.add(decision.band);
        games.set(decision.gameHash, game);
      }
      chain = envelope.digest;
    }
  } finally { stream.destroy(); }
  if (!header || lastByte !== 10 || totals.decisions === 0 || totals.decisions !== rows.length) {
    throw new TypeError("audit requires the complete terminated pricing journal; no report published");
  }
  const multiplicities = new Map<number, number>();
  for (const game of games.values()) multiplicities.set(game.decisions, (multiplicities.get(game.decisions) ?? 0) + 1);
  return {
    schema: "tabiya.research.bot-human-reference-score-domains.v1",
    state: "described_not_calibrated", pricingAuthority: header, journalDigest: chain,
    counts: totals,
    clusters: {
      distinctGames: games.size, distinctGameWindows: gameWindows.size,
      multiWindowGames: [...games.values()].filter((game) => game.windows.size > 1).length,
      multiBandGames: [...games.values()].filter((game) => game.bands.size > 1).length,
      multiplicities: [...multiplicities].sort(([left], [right]) => left - right).map(([decisions, count]) => ({ decisions, games: count })),
      halves: [0, 1].map((half) => ({ half, games: [...games.values()].filter((game) => game.half === half).length })),
    },
    cells: [...cells].map(([cell, value]) => ({ cell, ...value.counts, distinctGames: value.games.size })),
    claims,
  };
}

/** Match historical source identity/coverage, not merely a fresh checksum over edited rows. */
export function assertHistoricalPricing(
  result: Awaited<ReturnType<typeof auditScoreDomains>>,
  receipt: EvaluationHeader & { state: string; journalDigest: string; decisions: number; candidateRows: number;
    centipawnRows: number; mateRows: number; playedCentipawn: number; playedMate: number;
    cells: readonly { cell: string; decisions: number; candidateRows: number; centipawnRows: number;
      mateRows: number; playedCentipawn: number; playedMate: number }[] },
): void {
  const header: EvaluationHeader = {
    schema: receipt.schema, manifestDigest: receipt.manifestDigest, populationDigest: receipt.populationDigest,
    instrumentDigest: receipt.instrumentDigest, analysisAuthority: receipt.analysisAuthority,
    actualIdentity: receipt.actualIdentity, optionImage: receipt.optionImage,
    parserImplementationDigest: receipt.parserImplementationDigest,
  };
  if (receipt.state !== "priced_not_calibrated" || receipt.journalDigest !== result.journalDigest
    || !isDeepStrictEqual(header, result.pricingAuthority)) throw new TypeError("historical pricing authority/chain mismatch");
  const originalCounts = (counts: Counts) => ({
    decisions: counts.decisions, candidateRows: counts.candidateRows, centipawnRows: counts.cpCandidates,
    mateRows: counts.rootMatesCandidates + counts.rootIsMatedCandidates,
    playedCentipawn: counts.playedCp, playedMate: counts.playedRootMates + counts.playedRootIsMated,
  });
  const expectedCounts = (value: typeof receipt) => Object.fromEntries(Object.keys(originalCounts(result.counts))
    .map((key) => [key, value[key as keyof ReturnType<typeof originalCounts>]]));
  if (!isDeepStrictEqual(originalCounts(result.counts), expectedCounts(receipt))) throw new TypeError("historical pricing count mismatch");
  const expectedCells = manifest.humanReference.bands.flatMap((band) => manifest.humanReference.windows.map((window) => `${band.id}/${window.id}`));
  if (JSON.stringify(receipt.cells.map((cell) => cell.cell)) !== JSON.stringify(expectedCells)) throw new TypeError("historical pricing cell population mismatch");
  for (const cell of receipt.cells) {
    const summed = emptyCounts();
    for (const half of [0, 1]) {
      const value = result.cells.find((entry) => entry.cell === `${cell.cell}/${half}`);
      if (!value) throw new TypeError("historical pricing half missing");
      for (const key of Object.keys(summed) as (keyof Counts)[]) summed[key] += value[key];
    }
    const counts = originalCounts(summed);
    if (!isDeepStrictEqual(counts, Object.fromEntries(Object.keys(counts).map((key) => [key, cell[key as keyof typeof counts]])))) {
      throw new TypeError("historical pricing cell counts mismatch");
    }
  }
}
