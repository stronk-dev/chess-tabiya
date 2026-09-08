import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";

export const PACK_SIDECAR_BASENAMES = Object.freeze([
  "evidence.json",
  "sources.json",
  "job.json",
  "priority.json",
  "graduation.json",
] as const);

export function isPackSidecarName(name: string): boolean {
  return PACK_SIDECAR_BASENAMES.some(
    (reserved) => name === reserved || name.endsWith(`.${reserved}`),
  );
}

export function isPackDocumentFileName(
  name: string,
  options: { readonly includeBrowser?: boolean } = {},
): boolean {
  return extname(name) === ".json"
    && (options.includeBrowser === true || !name.endsWith(".browser.json"))
    && !isPackSidecarName(name);
}

export function resolvePackPath(id: string, roots: readonly string[] = ["content/drafts", "content/packs"]): string {
  const matches = roots.map((root) => resolve(root, `${id}.json`)).filter(existsSync);
  if (matches.length === 0) throw new Error(`Pack ${id} does not exist under ${roots.join(", ")}`);
  if (matches.length > 1) throw new Error(`Pack ${id} exists in more than one catalogue root: ${matches.join(", ")}`);
  return matches[0]!;
}
