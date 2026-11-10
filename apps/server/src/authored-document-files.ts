import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { isPackDocumentFileName } from "@chess-tabiya/schema/pack-path";
import { ShapeRegistry } from "./shape-registry.js";
import { validateShapeEntry, type ShapeValidationResult } from "./shape-validation.js";

export function authoredFilesUnder(path: string): readonly string[] {
  try {
    return readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
      ? authoredFilesUnder(resolve(path, entry.name)) : [resolve(path, entry.name)]).sort();
  } catch { return []; }
}
export function authoredPackFiles(roots: readonly string[]): readonly string[] {
  return roots.flatMap(authoredFilesUnder).filter(file => isPackDocumentFileName(file, { includeBrowser: true }));
}
export function authoredFilePath(file: string): string {
  const path = relative(process.cwd(), file);
  return path.startsWith("..") ? file : path.split(sep).join("/");
}
export function readAuthoredJson(file: string): unknown { return JSON.parse(readFileSync(file, "utf8")); }

/** Actual draft validators and actual dependency admission, shared by read-only instruments. */
export async function loadAuthoredShapeFiles(directory: string): Promise<{
  readonly registry: ShapeRegistry;
  readonly entries: readonly { readonly file: string; readonly validation: ShapeValidationResult }[];
}> {
  const registry = new ShapeRegistry(), identities = new Map<string, string>();
  const entries: { file: string; validation: ShapeValidationResult }[] = [];
  for (const file of authoredFilesUnder(directory).filter(file => file.endsWith(".json"))) {
    const raw = readAuthoredJson(file);
    const id = raw !== null && typeof raw === "object" && "id" in raw && typeof raw.id === "string" ? raw.id : undefined;
    if (id !== undefined) {
      const previous = identities.get(id);
      if (previous !== undefined) throw new TypeError(`duplicate shape id ${id}: ${authoredFilePath(previous)} and ${authoredFilePath(file)}`);
      identities.set(id, file);
    }
    const validation = validateShapeEntry(raw);
    entries.push({ file, validation });
    if (validation.valid && validation.document !== undefined) await registry.add(validation.document, "community");
  }
  return { registry, entries };
}
