import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function resolvePackPath(id: string, roots: readonly string[] = ["content/drafts", "content/packs"]): string {
  const matches = roots.map((root) => resolve(root, `${id}.json`)).filter(existsSync);
  if (matches.length === 0) throw new Error(`Pack ${id} does not exist under ${roots.join(", ")}`);
  if (matches.length > 1) throw new Error(`Pack ${id} exists in more than one catalogue root: ${matches.join(", ")}`);
  return matches[0]!;
}
