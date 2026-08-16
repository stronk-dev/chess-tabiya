export type ComparisonZoomBand = "far" | "mid" | "near";

export const COMPARISON_GAP_REM = 0.8;

export const COMPARISON_CELL_FLOOR_REM: Readonly<Record<ComparisonZoomBand, number>> = Object.freeze({
  far: 5,
  mid: 9,
  near: 15,
});

export function defaultComparisonZoom(branchCount: number): ComparisonZoomBand {
  return branchCount <= 2 ? "near" : "far";
}

export function comparisonBandMinimumRem(branchCount: number, zoom: ComparisonZoomBand): number {
  if (!Number.isInteger(branchCount) || branchCount < 1) throw new TypeError("Comparison branch count must be a positive integer");
  return branchCount * COMPARISON_CELL_FLOOR_REM[zoom] + Math.max(0, branchCount - 1) * COMPARISON_GAP_REM;
}
