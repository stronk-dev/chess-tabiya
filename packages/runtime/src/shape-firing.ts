import { matchesStructuralExpression, type StructuralExpression } from "./structure.js";

export interface ShapeTriggerSource {
  readonly id: string;
  readonly trigger: StructuralExpression;
}

export interface ShapeFiring {
  readonly entryId: string;
  readonly firstNodeId: string;
  readonly lastNodeId: string;
  readonly openEnded: boolean;
}

export function shapeFirings(
  entries: readonly ShapeTriggerSource[],
  path: readonly { readonly id: string; readonly fen: string }[],
): readonly ShapeFiring[] {
  const output: ShapeFiring[] = [];
  for (const entry of [...entries].sort((left, right) => left.id.localeCompare(right.id))) {
    let start = -1;
    for (let index = 0; index <= path.length; index += 1) {
      const matches = index < path.length && matchesStructuralExpression(path[index]!.fen, entry.trigger);
      if (matches && start < 0) start = index;
      if (!matches && start >= 0) {
        const end = index - 1;
        output.push(Object.freeze({ entryId: entry.id, firstNodeId: path[start]!.id, lastNodeId: path[end]!.id, openEnded: end === path.length - 1 }));
        start = -1;
      }
    }
  }
  return Object.freeze(output);
}
