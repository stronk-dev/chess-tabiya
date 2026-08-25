import type { PackPhase } from "@chess-tabiya/schema/drill-pack";

import type { PackSummary } from "./api.js";

export type PackPhaseFilter = "all" | PackPhase;
export type PackBandFilter = "all" | "1000-1400" | "1400-2000" | "2000+";
export type PackSort = "recommended" | "title" | "difficulty";

export interface PackCatalogQuery {
  readonly phase: PackPhaseFilter;
  readonly band: PackBandFilter;
  readonly search: string;
  readonly sort: PackSort;
}

export const PACK_MODE_COPY: Readonly<Record<string, string>> = Object.freeze({
  line: "Recall the theory, then continue",
  plan: "Choose a plan and play its consequence",
  outcome: "Convert, hold, save, or resist",
  trajectory: "Play the position across its phases",
});

export function packModeCopy(mode: string): string {
  return PACK_MODE_COPY[mode] ?? "Rehearse the position and its consequence";
}

export function packDifficultyWindow(value: unknown): {
  readonly min: number;
  readonly max: number;
  readonly label?: string;
} | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const difficulty = value as Record<string, unknown>;
  if (typeof difficulty.minOnlineRapid !== "number" || typeof difficulty.maxOnlineRapid !== "number") return null;
  return Object.freeze({
    min: difficulty.minOnlineRapid,
    max: difficulty.maxOnlineRapid,
    ...(typeof difficulty.label === "string" && difficulty.label.trim() !== ""
      ? { label: difficulty.label }
      : {}),
  });
}

export function packDifficultyCopy(pack: PackSummary, learnerBand?: number): string {
  const window = packDifficultyWindow(pack.difficulty);
  if (window === null) return "No difficulty window is recorded";
  if (learnerBand === undefined) return window.label ?? `Recorded for online rapid ${window.min}–${window.max}`;
  if (learnerBand >= window.min && learnerBand <= window.max) return "Sits at your measured band";
  if (learnerBand < window.min) return "A rung above your measured band";
  return "Below your measured band — technique practice";
}

function matchesBand(pack: PackSummary, band: PackBandFilter): boolean {
  if (band === "all") return true;
  const window = packDifficultyWindow(pack.difficulty);
  if (window === null) return false;
  if (band === "1000-1400") return window.min <= 1400 && window.max >= 1000;
  if (band === "1400-2000") return window.min <= 2000 && window.max >= 1400;
  return window.max > 2000;
}

export function filterPacks(packs: readonly PackSummary[], query: PackCatalogQuery): readonly PackSummary[] {
  const needle = query.search.trim().toLocaleLowerCase();
  const selected = packs.filter((pack) => {
    if (query.phase !== "all" && pack.phase !== query.phase) return false;
    if (!matchesBand(pack, query.band)) return false;
    if (needle === "") return true;
    return [pack.title, pack.objectiveSummary, ...pack.concepts]
      .join(" ")
      .toLocaleLowerCase()
      .includes(needle);
  });
  return Object.freeze([...selected].sort((left, right) => {
    if (query.sort === "title") return left.title.localeCompare(right.title);
    if (query.sort === "difficulty") {
      return (packDifficultyWindow(left.difficulty)?.min ?? Number.MAX_SAFE_INTEGER)
        - (packDifficultyWindow(right.difficulty)?.min ?? Number.MAX_SAFE_INTEGER)
        || left.title.localeCompare(right.title);
    }
    return packs.indexOf(left) - packs.indexOf(right);
  }));
}
