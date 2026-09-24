// rfc/player-style.md §2 / criteria 1–3 — `make style-registry-check`. The production registry is
// held set-equal, by metric id, feature id and floor, to the R21 instrument rows whose R12
// `persistentFloors` value is non-null. It is never compared to a copied list; the count is a
// tripwire only. Feature ids repeat (castling ×2, clocks ×3), so identity is the metric id.

export interface ProductionStyleRow { readonly metricId: string; readonly featureId: string; readonly floor: number }
export interface InstrumentStyleRow { readonly metricId: string; readonly featureId: string; readonly measuredFloorGames: number }

export type StyleRegistryDrift =
  | { readonly kind: "omitted"; readonly metricId: string }
  | { readonly kind: "added"; readonly metricId: string }
  | { readonly kind: "refloored"; readonly metricId: string; readonly production: number; readonly measured: number }
  | { readonly kind: "feature_changed"; readonly metricId: string; readonly production: string; readonly instrument: string }
  | { readonly kind: "instrument_disagrees"; readonly metricId: string; readonly instrument: number; readonly measured: number };

export function styleRegistryDrift(
  production: readonly ProductionStyleRow[],
  instrument: readonly InstrumentStyleRow[],
  persistentFloors: Readonly<Record<string, number | null>>,
): readonly StyleRegistryDrift[] {
  const drift: StyleRegistryDrift[] = [];
  const retained = new Map<string, { readonly featureId: string; readonly floor: number }>();
  for (const row of instrument) {
    const measured = persistentFloors[row.metricId];
    if (measured === null || measured === undefined) continue;
    if (row.measuredFloorGames !== measured) drift.push({ kind: "instrument_disagrees", metricId: row.metricId, instrument: row.measuredFloorGames, measured });
    retained.set(row.metricId, { featureId: row.featureId, floor: measured });
  }
  for (const [metricId, measured] of Object.entries(persistentFloors)) {
    if (measured !== null && !retained.has(metricId)) retained.set(metricId, { featureId: "(absent from the R21 instrument)", floor: measured });
  }
  const productionIds = new Set<string>();
  for (const row of production) {
    productionIds.add(row.metricId);
    const expected = retained.get(row.metricId);
    if (expected === undefined) { drift.push({ kind: "added", metricId: row.metricId }); continue; }
    if (row.floor !== expected.floor) drift.push({ kind: "refloored", metricId: row.metricId, production: row.floor, measured: expected.floor });
    if (row.featureId !== expected.featureId) drift.push({ kind: "feature_changed", metricId: row.metricId, production: row.featureId, instrument: expected.featureId });
  }
  for (const metricId of retained.keys()) if (!productionIds.has(metricId)) drift.push({ kind: "omitted", metricId });
  return Object.freeze(drift.sort((left, right) => left.metricId.localeCompare(right.metricId) || left.kind.localeCompare(right.kind)));
}
