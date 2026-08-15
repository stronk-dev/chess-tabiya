import type { TablebaseCategory } from "../tablebase.js";
import { invertTablebaseCategory } from "../tablebase.js";

export const CATEGORY_RANK: Readonly<Record<Exclude<TablebaseCategory, "unknown">, number>> = Object.freeze({
  loss: 0,
  "syzygy-loss": 1,
  "maybe-loss": 2,
  "blessed-loss": 3,
  draw: 4,
  "cursed-win": 5,
  "maybe-win": 6,
  "syzygy-win": 7,
  win: 8,
});

export function learnerCategory(
  sideToMove: "white" | "black",
  category: TablebaseCategory,
  learner: "white" | "black",
): TablebaseCategory {
  return sideToMove === learner ? category : invertTablebaseCategory(category);
}
