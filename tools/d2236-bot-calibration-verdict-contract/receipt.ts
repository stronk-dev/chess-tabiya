// Disposable D3406 receipt validation, deliberately not a calibration-verdict authority.
import { exactMoveIdentity } from "../../packages/runtime/src/legal-moves.js";
import manifest from "./manifest.json";
import { assertReference, digest, type selectReference } from "./population.js";

type Population = Awaited<ReturnType<typeof selectReference>> & {
  schema: string; manifestDigest: string; source: unknown; populationDigest: string; state: string;
};

export function populationReceipt(artifact: Population) {
  if (artifact.schema !== "tabiya.research.bot-human-reference-population.v1"
    || artifact.state !== "selected_not_evaluated"
    || artifact.manifestDigest !== digest(JSON.stringify(manifest))
    || JSON.stringify(artifact.source) !== JSON.stringify(manifest.humanReference)
    || artifact.populationDigest !== digest(JSON.stringify(artifact.rows))) throw new TypeError("population identity mismatch");
  assertReference(artifact, manifest.humanReference.decompressedSha256);
  const expectedCells = manifest.humanReference.bands.flatMap((band) => manifest.humanReference.windows.map((window) => `${band.id}/${window.id}`));
  if (artifact.rows.length !== manifest.humanReference.decisionsPerBandWindow * expectedCells.length) throw new TypeError("population size mismatch");
  const counts = new Map(expectedCells.map((cell) => [cell, { selected: 0, half0: 0, half1: 0 }]));
  for (const row of artifact.rows) {
    if (Object.keys(row).sort().join(",") !== "band,fen,gameHash,moveUci,ply,referenceHalf,selectionHash,window"
      || !/^sha256:[a-f0-9]{64}$/u.test(row.gameHash) || !/^sha256:[a-f0-9]{64}$/u.test(row.selectionHash)
      || row.referenceHalf !== Number.parseInt(row.gameHash.slice(7, 9), 16) % 2
      || !Number.isSafeInteger(row.ply)) throw new TypeError("invalid population decision");
    const window = manifest.humanReference.windows.find((entry) => entry.id === row.window);
    const cell = counts.get(`${row.band}/${row.window}`);
    if (!cell || !window || row.ply < window.minPly || (window.maxPly !== null && row.ply > window.maxPly)
      || exactMoveIdentity(row.fen, row.moveUci) !== row.moveUci) throw new TypeError("invalid population subject");
    cell.selected += 1;
    if (row.referenceHalf === 0) cell.half0 += 1; else cell.half1 += 1;
  }
  if ([...counts.values()].some((cell) => cell.selected !== manifest.humanReference.decisionsPerBandWindow)) throw new TypeError("population cell mismatch");
  return {
    schema: "tabiya.research.bot-human-reference-receipt.v1",
    state: "selected_not_evaluated",
    manifestDigest: artifact.manifestDigest,
    populationDigest: artifact.populationDigest,
    source: {
      url: manifest.humanReference.sourceUrl,
      license: manifest.humanReference.license,
      compressedRange: manifest.humanReference.compressedRange,
      compressedSha256: manifest.humanReference.compressedSha256,
      decompressedSha256: artifact.decompressedSha256,
      decompressedBytes: artifact.decompressedBytes,
      completeBlocks: artifact.completeBlocks,
      rejectedGames: artifact.rejectedGames,
      duplicateGames: artifact.duplicateGames,
      trailingPartialBlocksDropped: artifact.trailingPartialBlocksDropped,
    },
    selectedDecisions: artifact.rows.length,
    distinctGames: new Set(artifact.rows.map((row) => row.gameHash)).size,
    distinctGameWindows: new Set(artifact.rows.map((row) => `${row.gameHash}/${row.window}`)).size,
    cells: expectedCells.map((cell) => ({ cell, ...counts.get(cell), eligible: artifact.capacity.find((entry) => entry.cell === cell)?.eligible })),
    claims: { engineAnalysis: "not_run", strength: "not_measured", distribution: "not_measured", bandIdentity: "not_measured", humanLikeLabelAllowed: false },
  };
}
